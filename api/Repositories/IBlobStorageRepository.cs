using AzureDistributedTaskSystem.Api.Models;

namespace AzureDistributedTaskSystem.Api.Repositories;

public interface IBlobStorageRepository
{
    Task<string> SaveInputAsync(string taskId, object content, CancellationToken cancellationToken = default);
    Task<TaskMetadata?> GetMetadataAsync(string taskId, CancellationToken cancellationToken = default);
    Task<string?> GetOutputBlobUrlAsync(string blobPath, CancellationToken cancellationToken = default);
    Task<string?> GetOutputContentAsync(string taskId, CancellationToken cancellationToken = default);

    Task<byte[]?> GetCompressedImageBytesAsync(string taskId, CancellationToken cancellationToken = default);
}
