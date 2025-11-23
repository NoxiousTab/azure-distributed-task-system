using AzureDistributedTaskSystem.Api.DTOs;
using AzureDistributedTaskSystem.Api.Models;
using AzureDistributedTaskSystem.Api.Repositories;

namespace AzureDistributedTaskSystem.Api.Services;

public class TaskService : ITaskService
{
    private readonly IBlobStorageRepository _blobRepository;
    private readonly IQueueRepository _queueRepository;
    private readonly ILogger<TaskService> _logger;

    public TaskService(IBlobStorageRepository blobRepository, IQueueRepository queueRepository, ILogger<TaskService> logger)
    {
        _blobRepository = blobRepository;
        _queueRepository = queueRepository;
        _logger = logger;
    }

    public async Task<string> CreateTaskAsync(SubmitTaskRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedType = request.Type?.Trim().ToLowerInvariant();
        if (normalizedType is not ("summarize" or "markdown-to-html"))
        {
            throw new ArgumentException("Unsupported task type. Supported types: 'summarize', 'markdown-to-html'.", nameof(request.Type));
        }

        if (string.IsNullOrWhiteSpace(request.Text))
        {
            throw new ArgumentException("Text must be provided.", nameof(request.Text));
        }

        var taskId = Guid.NewGuid().ToString("N");

        _logger.LogInformation("Creating new task {TaskId} of type {Type}", taskId, normalizedType);

        var inputBlobPath = await _blobRepository.SaveInputAsync(taskId, new
        {
            taskId,
            Type = normalizedType,
            request.Text
        }, cancellationToken);

        var queuePayload = new
        {
            taskId,
            type = normalizedType,
            inputBlobPath
        };

        await _queueRepository.EnqueueTaskAsync(queuePayload, cancellationToken);

        return taskId;
    }

    public async Task<TaskMetadata?> GetTaskStatusAsync(string taskId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving status for task {TaskId}", taskId);
        return await _blobRepository.GetMetadataAsync(taskId, cancellationToken);
    }
}
