using System.Text.Json;
using Azure.Storage.Queues;

namespace AzureDistributedTaskSystem.Api.Repositories;

public class QueueRepository : IQueueRepository
{
    private readonly QueueServiceClient _queueServiceClient;
    private readonly string _queueName;
    private readonly ILogger<QueueRepository> _logger;

    public QueueRepository(QueueServiceClient queueServiceClient, string queueName, ILogger<QueueRepository> logger)
    {
        _queueServiceClient = queueServiceClient;
        _queueName = queueName;
        _logger = logger;
    }

    public async Task EnqueueTaskAsync(object payload, CancellationToken cancellationToken = default)
    {
        var queueClient = _queueServiceClient.GetQueueClient(_queueName);
        await queueClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

        var messageText = JsonSerializer.Serialize(payload);
        _logger.LogInformation("Enqueuing task message to queue {QueueName}", _queueName);
        await queueClient.SendMessageAsync(Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(messageText)), cancellationToken);
    }
}
