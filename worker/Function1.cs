using AzureDistributedTaskSystem.Worker.WorkerLogic;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace AzureDistributedTaskSystem.Worker;

public class Function1
{
    private readonly ITaskProcessorService _taskProcessorService;
    private readonly ILogger<Function1> _logger;

    public Function1(ITaskProcessorService taskProcessorService, ILogger<Function1> logger)
    {
        _taskProcessorService = taskProcessorService;
        _logger = logger;
    }

    [Function("TaskProcessorFunction")]
    public async Task RunAsync([QueueTrigger("task-queue", Connection = "AzureWebJobsStorage")] string message)
    {
        _logger.LogInformation("Queue trigger function received message: {Message}", message);
        await _taskProcessorService.ProcessMessageAsync(message);
    }
}
