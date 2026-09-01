namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

/// <summary>
/// Collects every registered ITaskHandler (via DI) and dispatches by TaskType.
/// Adding a new task type means writing a new handler and registering it in
/// Program.cs - nothing here or in TaskProcessorService needs to change.
/// </summary>
public class TaskHandlerRegistry
{
    private readonly Dictionary<string, ITaskHandler> _handlersByType;

    public TaskHandlerRegistry(IEnumerable<ITaskHandler> handlers)
    {
        _handlersByType = handlers.ToDictionary(h => h.TaskType, StringComparer.OrdinalIgnoreCase);
    }

    public ITaskHandler? GetHandler(string taskType) =>
        _handlersByType.TryGetValue(taskType, out var handler) ? handler : null;
}
