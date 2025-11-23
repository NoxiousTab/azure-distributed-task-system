namespace AzureDistributedTaskSystem.Api.Repositories;

public interface IQueueRepository
{
    Task EnqueueTaskAsync(object payload, CancellationToken cancellationToken = default);
}
