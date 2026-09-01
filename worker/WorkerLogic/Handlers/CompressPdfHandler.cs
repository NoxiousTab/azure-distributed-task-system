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

        byte[] compressedBytes;
        using (var inputStream = new MemoryStream(originalBytes))
        {
            var loadedDocument = new PdfLoadedDocument(inputStream);
            try
            {
                // Syncfusion's compression pipeline handles what our earlier hand-rolled
                // PDFsharp approach couldn't: font subsetting, page content stream
                // cleanup, and metadata removal, on top of image downsampling and
                // recompression. That means it actually helps text-heavy PDFs, not
                // just scanned/image-heavy ones.
                var compressionOptions = new PdfCompressionOptions
                {
                    CompressImages = true,
                    ImageQuality = 50,
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
