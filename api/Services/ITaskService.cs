using AzureDistributedTaskSystem.Api.DTOs;
using AzureDistributedTaskSystem.Api.Models;

namespace AzureDistributedTaskSystem.Api.Services;

public interface ITaskService
{
    Task<string> CreateTaskAsync(SubmitTaskRequest request, CancellationToken cancellationToken = default);
    Task<TaskMetadata?> GetTaskStatusAsync(string taskId, CancellationToken cancellationToken = default);
}
