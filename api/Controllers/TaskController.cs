using AzureDistributedTaskSystem.Api.DTOs;
using AzureDistributedTaskSystem.Api.Models;
using AzureDistributedTaskSystem.Api.Repositories;
using AzureDistributedTaskSystem.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AzureDistributedTaskSystem.Api.Controllers;

[ApiController]
[Route("/")]
public class TaskController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly IBlobStorageRepository _blobRepository;
    private readonly IQueueRepository _queueRepository;
    private readonly ILogger<TaskController> _logger;

    public TaskController(ITaskService taskService, IBlobStorageRepository blobRepository, IQueueRepository queueRepository, ILogger<TaskController> logger)
    {
        _taskService = taskService;
        _blobRepository = blobRepository;
        _queueRepository = queueRepository;
        _logger = logger;
    }

    [HttpPost("submit-task")]
    public async Task<ActionResult<SubmitTaskResponse>> SubmitTask([FromBody] SubmitTaskRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest("Request body is required.");
        }

        try
        {
            var taskId = await _taskService.CreateTaskAsync(request, cancellationToken);
            return Accepted(new SubmitTaskResponse { TaskId = taskId });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error while creating task");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while creating task");
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }

    [HttpOptions("submit-task")]
    public IActionResult SubmitTaskOptions()
    {
        return Ok();
    }

    [HttpPost("submit-image-task")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<SubmitTaskResponse>> SubmitImageTask([FromForm] string type, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            return BadRequest("type is required.");
        }

        var normalizedType = type.Trim().ToLowerInvariant();
        if (normalizedType != "compress-image")
        {
            return BadRequest("Unsupported task type for image submission. Only 'compress-image' is allowed.");
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest("Image file is required.");
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest("Maximum file size is 5MB.");
        }

        if (file.ContentType is not "image/jpeg" and not "image/png")
        {
            return BadRequest("Only JPEG and PNG images are supported.");
        }

        var taskId = Guid.NewGuid().ToString("N");

        try
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken);
            var base64 = Convert.ToBase64String(ms.ToArray());

            var inputBlobPath = await _blobRepository.SaveInputAsync(taskId, new
            {
                taskId,
                Type = normalizedType,
                Base64Image = base64,
                ContentType = file.ContentType
            }, cancellationToken);

            var queuePayload = new
            {
                taskId,
                type = normalizedType,
                inputBlobPath
            };

            await _queueRepository.EnqueueTaskAsync(queuePayload, cancellationToken);

            _logger.LogInformation("Created compress-image task {TaskId}", taskId);

            return Accepted(new SubmitTaskResponse { TaskId = taskId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while creating compress-image task");
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }

    [HttpGet("status/{taskId}")]
    public async Task<ActionResult<TaskStatusResponse>> GetStatus(string taskId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(taskId))
        {
            return BadRequest("taskId is required.");
        }

        try
        {
            var metadata = await _taskService.GetTaskStatusAsync(taskId, cancellationToken);
            if (metadata == null)
            {
                return NotFound();
            }

            string? outputUrl = null;
            if (!string.IsNullOrWhiteSpace(metadata.OutputBlob))
            {
                outputUrl = await _blobRepository.GetOutputBlobUrlAsync(metadata.OutputBlob!, cancellationToken);
            }

            var response = new TaskStatusResponse
            {
                TaskId = metadata.TaskId,
                Status = metadata.Status.ToString().ToLowerInvariant(),
                OutputUrl = outputUrl,
                ErrorMessage = metadata.ErrorMessage
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving task status");
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }

    [HttpGet("result/{taskId}")]
    public async Task<IActionResult> GetResult(string taskId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(taskId))
        {
            return BadRequest("taskId is required.");
        }

        try
        {
            var metadata = await _taskService.GetTaskStatusAsync(taskId, cancellationToken);
            if (metadata == null)
            {
                return NotFound();
            }

            if (metadata.Status != AzureDistributedTaskSystem.Api.Models.TaskStatus.Completed)
            {
                return StatusCode(StatusCodes.Status409Conflict, new
                {
                    taskId = metadata.TaskId,
                    status = metadata.Status.ToString().ToLowerInvariant(),
                    error = "Task is not completed yet."
                });
            }

            var content = await _blobRepository.GetOutputContentAsync(taskId, cancellationToken);
            if (content == null)
            {
                return NotFound();
            }

            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving task result");
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }

    [HttpGet("image/{taskId}")]
    public async Task<IActionResult> GetCompressedImage(string taskId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(taskId))
        {
            return BadRequest("taskId is required.");
        }

        try
        {
            var bytes = await _blobRepository.GetCompressedImageBytesAsync(taskId, cancellationToken);
            if (bytes == null)
            {
                return NotFound();
            }

            return File(bytes, "image/jpeg");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving compressed image");
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }
}
