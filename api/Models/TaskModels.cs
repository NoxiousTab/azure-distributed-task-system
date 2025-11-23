namespace AzureDistributedTaskSystem.Api.Models;

public enum TaskStatus
{
    Pending,
    Processing,
    Completed,
    Failed
}

public class TaskMetadata
{
    public string TaskId { get; set; } = string.Empty;
    public TaskStatus Status { get; set; }
    public string InputBlob { get; set; } = string.Empty;
    public string? OutputBlob { get; set; }
    public string? ErrorMessage { get; set; }
}
