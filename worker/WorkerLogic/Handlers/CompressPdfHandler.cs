using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;
using Microsoft.Extensions.Logging;
using Syncfusion.Pdf;
using Syncfusion.Pdf.Parsing;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

public class CompressPdfHandler : ITaskHandler
{
    private readonly ILogger<CompressPdfHandler> _logger;

    public CompressPdfHandler(ILogger<CompressPdfHandler> logger)
    {
        _logger = logger;
    }

    public string TaskType => "compress-pdf";

    public async Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Base64Pdf))
        {
            throw new InvalidOperationException("Base64Pdf must be provided for compress-pdf tasks.");
        }

        var originalBytes = Convert.FromBase64String(input.Base64Pdf);
        var originalSizeBytes = originalBytes.Length;

        // "low" keeps more visual quality at a bigger file size; "maximum" is the
        // opposite trade. These numbers are Syncfusion's 0-100 JPEG-style image
        // quality scale for the images it recompresses inside the PDF - font
        // subsetting, content-stream cleanup, and metadata removal happen
        // regardless of this setting.
        var imageQuality = input.CompressionLevel?.ToLowerInvariant() switch
        {
            "low" => 80,
            "maximum" => 25,
            _ => 50, // "recommended" and any unrecognized value
        };

        byte[] compressedBytes;
        using (var inputStream = new MemoryStream(originalBytes))
        {
            var loadedDocument = new PdfLoadedDocument(inputStream);
            try
            {
                var compressionOptions = new PdfCompressionOptions
                {
                    CompressImages = true,
                    ImageQuality = imageQuality,
                    OptimizeFont = true,
                    OptimizePageContents = true,
                    RemoveMetadata = true
                };
                loadedDocument.Compress(compressionOptions);

                // Forces a full rewrite of the file instead of an incremental save,
                // which by itself can meaningfully shrink PDFs that have been
                // edited/re-saved multiple times by other tools.
                loadedDocument.FileStructure.IncrementalUpdate = false;

                using var outputStream = new MemoryStream();
                loadedDocument.Save(outputStream);
                compressedBytes = outputStream.ToArray();
            }
            finally
            {
                loadedDocument.Close(true);
            }
        }

        // Never hand back a "compressed" file that's the same size or bigger than
        // what was uploaded - just return the original untouched in that case.
        var finalBytes = compressedBytes.Length < originalSizeBytes ? compressedBytes : originalBytes;

        _logger.LogInformation(
            "Task {TaskId}: original {OriginalBytes} bytes, Syncfusion produced {SavedBytes} bytes, using {FinalSource} ({FinalBytes} bytes)",
            taskId,
            originalSizeBytes,
            compressedBytes.Length,
            finalBytes == compressedBytes ? "compressed" : "original (fallback)",
            finalBytes.Length);

        var blobClient = outputContainer.GetBlobClient($"{taskId}.pdf");
        using (var uploadStream = new MemoryStream(finalBytes))
        {
            await blobClient.UploadAsync(uploadStream, overwrite: true, cancellationToken);
        }

        return new
        {
            taskId,
            type = TaskType,
            originalSizeBytes,
            compressedSizeBytes = finalBytes.Length
        };
    }
}
