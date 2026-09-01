using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

public class CompressImageHandler : ITaskHandler
{
    public string TaskType => "compress-image";

    public async Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Base64Image))
        {
            throw new InvalidOperationException("Base64Image must be provided for compress-image tasks.");
        }

        var originalBytes = Convert.FromBase64String(input.Base64Image);
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

        var blobClient = outputContainer.GetBlobClient($"{taskId}.jpg");
        outputStream.Position = 0;
        await blobClient.UploadAsync(outputStream, overwrite: true, cancellationToken);

        return new
        {
            taskId,
            type = TaskType,
            originalSizeBytes,
            compressedSizeBytes,
            compressionRatio
        };
    }
}
