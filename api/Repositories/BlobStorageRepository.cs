using System.Text.Json;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using AzureDistributedTaskSystem.Api.Models;

namespace AzureDistributedTaskSystem.Api.Repositories;

public class BlobStorageRepository : IBlobStorageRepository
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _inputContainerName;
    private readonly string _outputContainerName;
    private readonly string _metadataContainerName;
    private readonly ILogger<BlobStorageRepository> _logger;

    public BlobStorageRepository(
        BlobServiceClient blobServiceClient,
        string inputContainerName,
        string outputContainerName,
        string metadataContainerName,
        ILogger<BlobStorageRepository> logger)
    {
        _blobServiceClient = blobServiceClient;
        _inputContainerName = inputContainerName;
        _outputContainerName = outputContainerName;
        _metadataContainerName = metadataContainerName;
        _logger = logger;
    }

    public async Task<string> SaveInputAsync(string taskId, object content, CancellationToken cancellationToken = default)
    {
        var container = _blobServiceClient.GetBlobContainerClient(_inputContainerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

        var blobName = $"{taskId}.json";
        var blobClient = container.GetBlobClient(blobName);
        var json = JsonSerializer.Serialize(content);
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(json));

        _logger.LogInformation("Uploading input blob for task {TaskId} to {BlobName}", taskId, blobName);
        await blobClient.UploadAsync(stream, overwrite: true, cancellationToken);

        return $"input/{blobName}";
    }

    public async Task<TaskMetadata?> GetMetadataAsync(string taskId, CancellationToken cancellationToken = default)
    {
        var container = _blobServiceClient.GetBlobContainerClient(_metadataContainerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

        var blobName = $"{taskId}.json";
        var blobClient = container.GetBlobClient(blobName);

        try
        {
            var download = await blobClient.DownloadContentAsync(cancellationToken);
            var json = download.Value.Content.ToString();
            var metadata = JsonSerializer.Deserialize<TaskMetadata>(json);
            return metadata;
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogWarning("Metadata blob not found for task {TaskId}", taskId);
            return null;
        }
    }

    public async Task<string?> GetOutputBlobUrlAsync(string blobPath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(blobPath))
        {
            return null;
        }

        var segments = blobPath.Split('/', 2);
        if (segments.Length != 2)
        {
            _logger.LogWarning("Invalid blob path format: {BlobPath}", blobPath);
            return null;
        }

        var containerName = segments[0];
        var blobName = segments[1];

        var container = _blobServiceClient.GetBlobContainerClient(containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);

        var blobClient = container.GetBlobClient(blobName);
        return blobClient.Uri.ToString();
    }

    public async Task<string?> GetOutputContentAsync(string taskId, CancellationToken cancellationToken = default)
    {
        var container = _blobServiceClient.GetBlobContainerClient(_outputContainerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

        var blobName = $"{taskId}.json";
        var blobClient = container.GetBlobClient(blobName);

        try
        {
            var download = await blobClient.DownloadContentAsync(cancellationToken);
            return download.Value.Content.ToString();
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogWarning("Output blob not found for task {TaskId}", taskId);
            return null;
        }
    }

    public async Task<byte[]?> GetCompressedImageBytesAsync(string taskId, CancellationToken cancellationToken = default)
    {
        var container = _blobServiceClient.GetBlobContainerClient(_outputContainerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

        var blobName = $"{taskId}.jpg";
        var blobClient = container.GetBlobClient(blobName);

        try
        {
            var download = await blobClient.DownloadContentAsync(cancellationToken);
            return download.Value.Content.ToArray();
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogWarning("Compressed image blob not found for task {TaskId}", taskId);
            return null;
        }
    }
}
