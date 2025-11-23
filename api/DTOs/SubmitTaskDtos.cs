namespace AzureDistributedTaskSystem.Api.DTOs;

public class SubmitTaskRequest
{
    public string Type { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}

public class SubmitTaskResponse
{
    public string TaskId { get; set; } = string.Empty;
}

public class TaskStatusResponse
{
    public string TaskId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? OutputUrl { get; set; }
    public string? ErrorMessage { get; set; }
}
