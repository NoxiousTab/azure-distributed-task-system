using System.Text;
using System.Text.Json;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using AzureDistributedTaskSystem.Worker.Models;
using AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;
using Microsoft.Extensions.Logging;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic;

public interface ITaskProcessorService
{
    Task ProcessMessageAsync(string message, CancellationToken cancellationToken = default);
}

/// <summary>
/// Orchestrates a queued task: loads the input blob, hands off to whichever
/// ITaskHandler is registered for the task's type (see Handlers/), writes the
/// result blob, and keeps the task's status metadata up to date. Deliberately
/// has no per-task-type logic itself - that all lives in Handlers/.
/// </summary>
public class TaskProcessorService : ITaskProcessorService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly TaskHandlerRegistry _handlerRegistry;
    private readonly ILogger<TaskProcessorService> _logger;

    private const string InputContainerName = "input";
    private const string OutputContainerName = "output";
    private const string MetadataContainerName = "taskmetadata";

    public TaskProcessorService(BlobServiceClient blobServiceClient, TaskHandlerRegistry handlerRegistry, ILogger<TaskProcessorService> logger)
    {
        _blobServiceClient = blobServiceClient;
        _handlerRegistry = handlerRegistry;
        _logger = logger;
    }

    public async Task ProcessMessageAsync(string message, CancellationToken cancellationToken = default)
    {
        TaskQueueMessage? queueMessage;
        try
        {
            queueMessage = JsonSerializer.Deserialize<TaskQueueMessage>(message, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize queue message: {Message}", message);
            return;
        }

        if (queueMessage == null || string.IsNullOrWhiteSpace(queueMessage.TaskId))
        {
            _logger.LogWarning("Invalid queue message payload: {Message}", message);
            return;
        }

        _logger.LogInformation("Processing task {TaskId} of type {Type}", queueMessage.TaskId, queueMessage.Type);

        var inputContainer = _blobServiceClient.GetBlobContainerClient(InputContainerName);
        await inputContainer.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

        var outputContainer = _blobServiceClient.GetBlobContainerClient(OutputContainerName);
        // Allow anonymous read access to blobs in the output container so the UI can download results directly.
        await outputContainer.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);

        var metadataContainer = _blobServiceClient.GetBlobContainerClient(MetadataContainerName);
        await metadataContainer.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

        var inputBlobSegments = queueMessage.InputBlobPath.Split('/', 2);
        if (inputBlobSegments.Length != 2)
        {
            _logger.LogError("Invalid input blob path {Path} for task {TaskId}", queueMessage.InputBlobPath, queueMessage.TaskId);
            return;
        }

        var inputBlobName = inputBlobSegments[1];
        var inputBlobClient = inputContainer.GetBlobClient(inputBlobName);

        try
        {
            var download = await inputBlobClient.DownloadContentAsync(cancellationToken);
            var json = download.Value.Content.ToString();
            var taskInput = JsonSerializer.Deserialize<TaskInput>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (taskInput == null)
            {
                throw new InvalidOperationException("Input payload was null after deserialization.");
            }

            await UpdateMetadataAsync(metadataContainer, new TaskMetadata
            {
                TaskId = queueMessage.TaskId,
                Status = AzureDistributedTaskSystem.Worker.Models.TaskStatus.Processing,
                InputBlob = queueMessage.InputBlobPath
            }, cancellationToken);

            var normalizedType = taskInput.Type.ToLowerInvariant();
            var handler = _handlerRegistry.GetHandler(normalizedType);
            if (handler == null)
            {
                throw new NotSupportedException($"Unsupported task type: {taskInput.Type}");
            }

            var result = await handler.ProcessAsync(taskInput, queueMessage.TaskId, outputContainer, cancellationToken);
            var outputJson = JsonSerializer.Serialize(result);

            var outputBlobName = $"{queueMessage.TaskId}.json";
            var outputBlobClient = outputContainer.GetBlobClient(outputBlobName);

            using (var outputStream = new MemoryStream(Encoding.UTF8.GetBytes(outputJson)))
            {
                await outputBlobClient.UploadAsync(outputStream, overwrite: true, cancellationToken);
            }

            await UpdateMetadataAsync(metadataContainer, new TaskMetadata
            {
                TaskId = queueMessage.TaskId,
                Status = AzureDistributedTaskSystem.Worker.Models.TaskStatus.Completed,
                InputBlob = queueMessage.InputBlobPath,
                OutputBlob = $"{OutputContainerName}/{outputBlobName}"
            }, cancellationToken);

            _logger.LogInformation("Successfully processed task {TaskId}", queueMessage.TaskId);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogError(ex, "Input blob not found for task {TaskId}", queueMessage.TaskId);
            await UpdateMetadataAsync(metadataContainer, new TaskMetadata
            {
                TaskId = queueMessage.TaskId,
                Status = AzureDistributedTaskSystem.Worker.Models.TaskStatus.Failed,
                InputBlob = queueMessage.InputBlobPath,
                ErrorMessage = "Input blob not found."
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while processing task {TaskId}", queueMessage.TaskId);
            await UpdateMetadataAsync(metadataContainer, new TaskMetadata
            {
                TaskId = queueMessage.TaskId,
                Status = AzureDistributedTaskSystem.Worker.Models.TaskStatus.Failed,
                InputBlob = queueMessage.InputBlobPath,
                ErrorMessage = ex.Message
            }, cancellationToken);
            throw;
        }
    }

    private static async Task UpdateMetadataAsync(BlobContainerClient metadataContainer, TaskMetadata metadata, CancellationToken cancellationToken)
    {
        var blobClient = metadataContainer.GetBlobClient($"{metadata.TaskId}.json");
        var json = JsonSerializer.Serialize(metadata, new JsonSerializerOptions
        {
            WriteIndented = false
        });
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));
        await blobClient.UploadAsync(stream, overwrite: true, cancellationToken);
    }
}
