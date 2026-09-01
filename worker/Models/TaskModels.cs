namespace AzureDistributedTaskSystem.Worker.Models;

public enum TaskStatus
{
    Pending,
    Processing,
    Completed,
    Failed
}

public class TaskQueueMessage
{
    public string TaskId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string InputBlobPath { get; set; } = string.Empty;
}

public class TaskInput
{
    public string TaskId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;

    // For compress-image / heic-to-jpg / image-to-pdf / passport-photo tasks
    public string? Base64Image { get; set; }
    public string? ContentType { get; set; }

    // For merge-pdf tasks
    public List<string>? Base64Files { get; set; }

    // For compress-pdf tasks
    public string? Base64Pdf { get; set; }
}

public class TaskMetadata
{
    public string TaskId { get; set; } = string.Empty;
    public TaskStatus Status { get; set; }
    public string InputBlob { get; set; } = string.Empty;
    public string? OutputBlob { get; set; }
    public string? ErrorMessage { get; set; }
}
