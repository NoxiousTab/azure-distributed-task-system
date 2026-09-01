using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

/// <summary>
/// Handles processing for one task type. TaskProcessorService looks handlers up
/// by TaskType via TaskHandlerRegistry and stays agnostic to what each one does.
/// A handler is responsible for its own output blob (image/pdf/etc.) - the
/// orchestrator only writes the returned result object as the task's result JSON.
/// </summary>
public interface ITaskHandler
{
    string TaskType { get; }

    Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken);
}
