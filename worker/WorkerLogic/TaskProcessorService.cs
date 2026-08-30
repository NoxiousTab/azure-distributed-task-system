using System.Text.Json;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using AzureDistributedTaskSystem.Worker.Models;
using ImageMagick;
using Markdig;
using Microsoft.Extensions.Logging;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic;

public interface ITaskProcessorService
{
    Task ProcessMessageAsync(string message, CancellationToken cancellationToken = default);
}

public class TaskProcessorService : ITaskProcessorService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly ILogger<TaskProcessorService> _logger;

    private const string InputContainerName = "input";
    private const string OutputContainerName = "output";
    private const string MetadataContainerName = "taskmetadata";

    public TaskProcessorService(BlobServiceClient blobServiceClient, ILogger<TaskProcessorService> logger)
    {
        _blobServiceClient = blobServiceClient;
        _logger = logger;
    }

    public async Task ProcessMessageAsync(string message, CancellationToken cancellationToken = default)
    {
        TaskQueueMessage? queueMessage;
        try
        {
            queueMessage = JsonSerializer.Deserialize<TaskQueueMessage>(message, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize queue message: {Message}", message);
            return;
        }

        if (queueMessage == null || string.IsNullOrWhiteSpace(queueMessage.TaskId))
        {
            _logger.LogWarning("Invalid queue message payload: {Message}", message);
            return;
        }

        _logger.LogInformation("Processing task {TaskId} of type {Type}", queueMessage.TaskId, queueMessage.Type);

        var inputContainer = _blobServiceClient.GetBlobContainerClient(InputContainerName);
        await inputContainer.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

        var outputContainer = _blobServiceClient.GetBlobContainerClient(OutputContainerName);
        // Allow anonymous read access to blobs in the output container so the UI can download results directly.
        await outputContainer.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);

        var metadataContainer = _blobServiceClient.GetBlobContainerClient(MetadataContainerName);
        await metadataContainer.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

        var inputBlobSegments = queueMessage.InputBlobPath.Split('/', 2);
        if (inputBlobSegments.Length != 2)
        {
            _logger.LogError("Invalid input blob path {Path} for task {TaskId}", queueMessage.InputBlobPath, queueMessage.TaskId);
            return;
        }

        var inputBlobName = inputBlobSegments[1];
        var inputBlobClient = inputContainer.GetBlobClient(inputBlobName);

        try
        {
            var download = await inputBlobClient.DownloadContentAsync(cancellationToken);
            var json = download.Value.Content.ToString();
            var taskInput = JsonSerializer.Deserialize<TaskInput>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (taskInput == null)
            {
                throw new InvalidOperationException("Input payload was null after deserialization.");
            }

            await UpdateMetadataAsync(metadataContainer, new TaskMetadata
            {
                TaskId = queueMessage.TaskId,
                Status = AzureDistributedTaskSystem.Worker.Models.TaskStatus.Processing,
                InputBlob = queueMessage.InputBlobPath
            }, cancellationToken);

            var normalizedType = taskInput.Type.ToLowerInvariant();
            string outputJson;

            switch (normalizedType)
            {
                case "summarize":
                    {
                        var summary = SummarizeText(taskInput.Text);
                        outputJson = JsonSerializer.Serialize(new { taskId = queueMessage.TaskId, type = normalizedType, summary });
                        break;
                    }
                case "markdown-to-html":
                    {
                        var html = ConvertMarkdownToHtml(taskInput.Text);
                        outputJson = JsonSerializer.Serialize(new { taskId = queueMessage.TaskId, type = normalizedType, html });
                        break;
                    }
                case "compress-image":
                    {
                        if (string.IsNullOrWhiteSpace(taskInput.Base64Image))
                        {
                            throw new InvalidOperationException("Base64Image must be provided for compress-image tasks.");
                        }

                        var originalBytes = Convert.FromBase64String(taskInput.Base64Image);
                        var originalSizeBytes = originalBytes.Length;

                        using var inputStream = new MemoryStream(originalBytes);
                        using var image = await Image.LoadAsync(inputStream, cancellationToken);
                        using var outputStream = new MemoryStream();

                        // ImageSharp is fully cross-platform (no OS imaging dependency),
                        // unlike System.Drawing.Common which only works on Windows.
                        var jpegEncoder = new JpegEncoder { Quality = 75 };
                        await image.SaveAsJpegAsync(outputStream, jpegEncoder, cancellationToken);

                        var compressedBytes = outputStream.ToArray();
                        var compressedSizeBytes = compressedBytes.Length;
                        var compressionRatio = originalSizeBytes == 0
                            ? 0d
                            : (double)compressedSizeBytes / originalSizeBytes;

                        // Save compressed image as separate blob
                        var compressedBlobName = $"{queueMessage.TaskId}.jpg";
                        var compressedBlobClient = outputContainer.GetBlobClient(compressedBlobName);

                        outputStream.Position = 0;
                        await compressedBlobClient.UploadAsync(outputStream, overwrite: true, cancellationToken);

                        outputJson = JsonSerializer.Serialize(new
                        {
                            taskId = queueMessage.TaskId,
                            type = normalizedType,
                            originalSizeBytes,
                            compressedSizeBytes,
                            compressionRatio
                        });
                        break;
                    }
                case "heic-to-jpg":
                    {
                        if (string.IsNullOrWhiteSpace(taskInput.Base64Image))
                        {
                            throw new InvalidOperationException("Base64Image must be provided for heic-to-jpg tasks.");
                        }

                        var originalBytes = Convert.FromBase64String(taskInput.Base64Image);
                        var originalSizeBytes = originalBytes.Length;

                        // ImageSharp doesn't decode HEIC (it's HEVC-based and patent-encumbered),
                        // so this one case uses Magick.NET, which bundles a cross-platform
                        // libheif build. Everything else in this file stays on ImageSharp.
                        using var magickImage = new MagickImage(originalBytes);
                        magickImage.AutoOrient();
                        magickImage.Format = MagickFormat.Jpg;
                        magickImage.Quality = 85;

                        var convertedBytes = magickImage.ToByteArray();
                        var compressedSizeBytes = convertedBytes.Length;

                        var convertedBlobName = $"{queueMessage.TaskId}.jpg";
                        var convertedBlobClient = outputContainer.GetBlobClient(convertedBlobName);
                        using (var convertedStream = new MemoryStream(convertedBytes))
                        {
                            await convertedBlobClient.UploadAsync(convertedStream, overwrite: true, cancellationToken);
                        }

                        outputJson = JsonSerializer.Serialize(new
                        {
                            taskId = queueMessage.TaskId,
                            type = normalizedType,
                            originalSizeBytes,
                            compressedSizeBytes
                        });
                        break;
                    }
                case "image-to-pdf":
                    {
                        if (string.IsNullOrWhiteSpace(taskInput.Base64Image))
                        {
                            throw new InvalidOperationException("Base64Image must be provided for image-to-pdf tasks.");
                        }

                        var originalBytes = Convert.FromBase64String(taskInput.Base64Image);
                        var originalSizeBytes = originalBytes.Length;

                        using var pdfDocument = new PdfDocument();
                        var page = pdfDocument.AddPage();

                        using var pdfImageStream = new MemoryStream(originalBytes);
                        var xImage = XImage.FromStream(pdfImageStream);
                        // Treat image pixels as points at the image's own resolution (falling
                        // back to 96 DPI when a format doesn't carry that metadata) so the
                        // page comes out the same proportions as the source photo/scan.
                        var horizontalDpi = xImage.HorizontalResolution > 0 ? xImage.HorizontalResolution : 96;
                        var verticalDpi = xImage.VerticalResolution > 0 ? xImage.VerticalResolution : 96;
                        page.Width = XUnit.FromPoint(xImage.PixelWidth * 72.0 / horizontalDpi);
                        page.Height = XUnit.FromPoint(xImage.PixelHeight * 72.0 / verticalDpi);

                        using (var gfx = XGraphics.FromPdfPage(page))
                        {
                            gfx.DrawImage(xImage, 0, 0, page.Width.Point, page.Height.Point);
                        }

                        byte[] pdfBytes;
                        using (var pdfStream = new MemoryStream())
                        {
                            pdfDocument.Save(pdfStream, false);
                            pdfBytes = pdfStream.ToArray();
                        }

                        var pdfBlobName = $"{queueMessage.TaskId}.pdf";
                        var pdfBlobClient = outputContainer.GetBlobClient(pdfBlobName);
                        using (var pdfUploadStream = new MemoryStream(pdfBytes))
                        {
                            await pdfBlobClient.UploadAsync(pdfUploadStream, overwrite: true, cancellationToken);
                        }

                        outputJson = JsonSerializer.Serialize(new
                        {
                            taskId = queueMessage.TaskId,
                            type = normalizedType,
                            originalSizeBytes,
                            compressedSizeBytes = pdfBytes.Length
                        });
                        break;
                    }
                case "passport-photo":
                    {
                        if (string.IsNullOrWhiteSpace(taskInput.Base64Image))
                        {
                            throw new InvalidOperationException("Base64Image must be provided for passport-photo tasks.");
                        }

                        const int passportPhotoSizePx = 600;

                        var originalBytes = Convert.FromBase64String(taskInput.Base64Image);
                        var originalSizeBytes = originalBytes.Length;

                        using var passportInputStream = new MemoryStream(originalBytes);
                        using var passportImage = await Image.LoadAsync(passportInputStream, cancellationToken);

                        // Center-crop to a square before resizing, so the subject isn't
                        // stretched to fit the required 1:1 passport photo aspect ratio.
                        var squareSide = Math.Min(passportImage.Width, passportImage.Height);
                        passportImage.Mutate(x => x
                            .Crop(new SixLabors.ImageSharp.Rectangle(
                                (passportImage.Width - squareSide) / 2,
                                (passportImage.Height - squareSide) / 2,
                                squareSide,
                                squareSide))
                            .Resize(passportPhotoSizePx, passportPhotoSizePx));

                        using var passportOutputStream = new MemoryStream();
                        var passportEncoder = new JpegEncoder { Quality = 90 };
                        await passportImage.SaveAsJpegAsync(passportOutputStream, passportEncoder, cancellationToken);
                        var passportBytes = passportOutputStream.ToArray();

                        var passportBlobName = $"{queueMessage.TaskId}.jpg";
                        var passportBlobClient = outputContainer.GetBlobClient(passportBlobName);
                        passportOutputStream.Position = 0;
                        await passportBlobClient.UploadAsync(passportOutputStream, overwrite: true, cancellationToken);

                        outputJson = JsonSerializer.Serialize(new
                        {
                            taskId = queueMessage.TaskId,
                            type = normalizedType,
                            originalSizeBytes,
                            compressedSizeBytes = passportBytes.Length,
                            width = passportPhotoSizePx,
                            height = passportPhotoSizePx
                        });
                        break;
                    }
                default:
                    throw new NotSupportedException($"Unsupported task type: {taskInput.Type}");
            }

            var outputBlobName = $"{queueMessage.TaskId}.json";
            var outputBlobClient = outputContainer.GetBlobClient(outputBlobName);

            using (var outputStream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(outputJson)))
            {
                await outputBlobClient.UploadAsync(outputStream, overwrite: true, cancellationToken);
            }

            await UpdateMetadataAsync(metadataContainer, new TaskMetadata
            {
                TaskId = queueMessage.TaskId,
                Status = AzureDistributedTaskSystem.Worker.Models.TaskStatus.Completed,
                InputBlob = queueMessage.InputBlobPath,
                OutputBlob = $"{OutputContainerName}/{outputBlobName}"
            }, cancellationToken);

            _logger.LogInformation("Successfully processed task {TaskId}", queueMessage.TaskId);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogError(ex, "Input blob not found for task {TaskId}", queueMessage.TaskId);
            await UpdateMetadataAsync(metadataContainer, new TaskMetadata
            {
                TaskId = queueMessage.TaskId,
                Status = AzureDistributedTaskSystem.Worker.Models.TaskStatus.Failed,
                InputBlob = queueMessage.InputBlobPath,
                ErrorMessage = "Input blob not found."
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while processing task {TaskId}", queueMessage.TaskId);
            await UpdateMetadataAsync(metadataContainer, new TaskMetadata
            {
                TaskId = queueMessage.TaskId,
                Status = AzureDistributedTaskSystem.Worker.Models.TaskStatus.Failed,
                InputBlob = queueMessage.InputBlobPath,
                ErrorMessage = ex.Message
            }, cancellationToken);
            throw;
        }
    }

    private static string SummarizeText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        const int maxLength = 200;
        if (text.Length <= maxLength)
        {
            return text;
        }

        // Simple sentence-aware heuristic: keep whole sentences up to maxLength
        var sentenceEndings = new[] { '.', '!', '?' };
        var sentences = new List<string>();

        int start = 0;
        for (int i = 0; i < text.Length; i++)
        {
            if (sentenceEndings.Contains(text[i]))
            {
                int end = i + 1;
                var sentence = text[start..end].Trim();
                if (!string.IsNullOrWhiteSpace(sentence))
                {
                    sentences.Add(sentence);
                }
                start = end;
            }
        }

        // Tail content after the last punctuation
        if (start < text.Length)
        {
            var tail = text[start..].Trim();
            if (!string.IsNullOrWhiteSpace(tail))
            {
                sentences.Add(tail);
            }
        }

        if (sentences.Count == 0)
        {
            // Fallback: pure truncation
            return text[..maxLength] + "...";
        }

        var builder = new System.Text.StringBuilder();
        foreach (var sentence in sentences)
        {
            if (builder.Length + sentence.Length > maxLength)
            {
                break;
            }
            if (builder.Length > 0)
            {
                builder.Append(' ');
            }
            builder.Append(sentence);
        }

        if (builder.Length == 0)
        {
            // If even first sentence is too long, truncate it
            return sentences[0].Length <= maxLength
                ? sentences[0]
                : sentences[0][..maxLength] + "...";
        }

        return builder.ToString();
    }

    private static string ConvertMarkdownToHtml(string markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
        {
            return string.Empty;
        }

        // Use Markdig for full markdown support (headings, emphasis, lists, code blocks, etc.).
        var pipeline = new MarkdownPipelineBuilder()
            .UseAdvancedExtensions()
            .Build();

        return Markdown.ToHtml(markdown, pipeline);
    }

    private static async Task UpdateMetadataAsync(BlobContainerClient metadataContainer, TaskMetadata metadata, CancellationToken cancellationToken)
    {
        var blobClient = metadataContainer.GetBlobClient($"{metadata.TaskId}.json");
        var json = JsonSerializer.Serialize(metadata, new JsonSerializerOptions
        {
            WriteIndented = false
        });
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(json));
        await blobClient.UploadAsync(stream, overwrite: true, cancellationToken);
    }
}
