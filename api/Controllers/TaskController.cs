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

    // Tools that accept a single uploaded image/file and are processed the same way
    // (multipart upload -> queued -> worker picks a case on the type).
    private static readonly HashSet<string> ImageTaskTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "compress-image",
        "heic-to-jpg",
        "image-to-pdf",
        "passport-photo",
    };

    private static readonly Dictionary<string, string[]> AllowedContentTypesByType = new(StringComparer.OrdinalIgnoreCase)
    {
        ["compress-image"] = new[] { "image/jpeg", "image/png" },
        ["image-to-pdf"] = new[] { "image/jpeg", "image/png" },
        ["passport-photo"] = new[] { "image/jpeg", "image/png" },
        // Browsers are inconsistent about the content-type they report for HEIC files -
        // some send image/heic, others fall back to application/octet-stream. The
        // filename extension check below is the more reliable signal for this one.
        ["heic-to-jpg"] = new[] { "image/heic", "image/heif", "application/octet-stream" },
    };

    private static readonly string[] HeicExtensions = { ".heic", ".heif" };

    [HttpPost("submit-image-task")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<SubmitTaskResponse>> SubmitImageTask([FromForm] string type, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            return BadRequest("type is required.");
        }

        var normalizedType = type.Trim().ToLowerInvariant();
        if (!ImageTaskTypes.Contains(normalizedType))
        {
            return BadRequest($"Unsupported task type for image submission. Supported types: {string.Join(", ", ImageTaskTypes)}.");
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest("A file is required.");
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest("Maximum file size is 5MB.");
        }

        var allowedContentTypes = AllowedContentTypesByType[normalizedType];
        var hasAllowedContentType = allowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase);
        var hasAllowedExtension = normalizedType == "heic-to-jpg"
            && HeicExtensions.Any(ext => file.FileName.EndsWith(ext, StringComparison.OrdinalIgnoreCase));

        if (!hasAllowedContentType && !hasAllowedExtension)
        {
            return BadRequest("That file doesn't match what this tool expects.");
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

    [HttpPost("submit-merge-task")]
    [RequestSizeLimit(150 * 1024 * 1024)]
    public async Task<ActionResult<SubmitTaskResponse>> SubmitMergeTask([FromForm] string type, [FromForm] List<IFormFile> files, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(type) || !type.Trim().Equals("merge-pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("type must be 'merge-pdf'.");
        }

        if (files is null || files.Count < 2)
        {
            return BadRequest("At least 2 PDF files are required to merge.");
        }

        if (files.Count > 10)
        {
            return BadRequest("Maximum 10 files per merge.");
        }

        foreach (var file in files)
        {
            var hasAllowedContentType = string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase);
            var hasAllowedExtension = file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);
            if (!hasAllowedContentType && !hasAllowedExtension)
            {
                return BadRequest($"'{file.FileName}' doesn't look like a PDF.");
            }

            if (file.Length > 50 * 1024 * 1024)
            {
                return BadRequest($"'{file.FileName}' is over the 50MB per-file limit.");
            }
        }

        var taskId = Guid.NewGuid().ToString("N");

        try
        {
            var base64Files = new List<string>(files.Count);
            foreach (var file in files)
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms, cancellationToken);
                base64Files.Add(Convert.ToBase64String(ms.ToArray()));
            }

            var inputBlobPath = await _blobRepository.SaveInputAsync(taskId, new
            {
                taskId,
                Type = "merge-pdf",
                Base64Files = base64Files
            }, cancellationToken);

            var queuePayload = new
            {
                taskId,
                type = "merge-pdf",
                inputBlobPath
            };

            await _queueRepository.EnqueueTaskAsync(queuePayload, cancellationToken);

            _logger.LogInformation("Created merge-pdf task {TaskId} with {FileCount} files", taskId, files.Count);

            return Accepted(new SubmitTaskResponse { TaskId = taskId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while creating merge-pdf task");
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }

    [HttpPost("submit-pdf-task")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<ActionResult<SubmitTaskResponse>> SubmitPdfTask([FromForm] string type, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(type) || !type.Trim().Equals("compress-pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("type must be 'compress-pdf'.");
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest("A file is required.");
        }

        if (file.Length > 50 * 1024 * 1024)
        {
            return BadRequest("Maximum file size is 50MB.");
        }

        var hasAllowedContentType = string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase);
        var hasAllowedExtension = file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);
        if (!hasAllowedContentType && !hasAllowedExtension)
        {
            return BadRequest("That file doesn't look like a PDF.");
        }

        var taskId = Guid.NewGuid().ToString("N");

        try
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken);
            var base64Pdf = Convert.ToBase64String(ms.ToArray());

            var inputBlobPath = await _blobRepository.SaveInputAsync(taskId, new
            {
                taskId,
                Type = "compress-pdf",
                Base64Pdf = base64Pdf
            }, cancellationToken);

            var queuePayload = new
            {
                taskId,
                type = "compress-pdf",
                inputBlobPath
            };

            await _queueRepository.EnqueueTaskAsync(queuePayload, cancellationToken);

            _logger.LogInformation("Created compress-pdf task {TaskId}", taskId);

            return Accepted(new SubmitTaskResponse { TaskId = taskId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while creating compress-pdf task");
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

            return File(bytes, "image/jpeg", $"{taskId}.jpg");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving compressed image");
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }

    [HttpGet("pdf/{taskId}")]
    public async Task<IActionResult> GetGeneratedPdf(string taskId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(taskId))
        {
            return BadRequest("taskId is required.");
        }

        try
        {
            var bytes = await _blobRepository.GetGeneratedPdfBytesAsync(taskId, cancellationToken);
            if (bytes == null)
            {
                return NotFound();
            }

            return File(bytes, "application/pdf", $"{taskId}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving generated PDF");
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }
}
