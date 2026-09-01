using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;
using ImageMagick;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

public class HeicToJpgHandler : ITaskHandler
{
    public string TaskType => "heic-to-jpg";

    public async Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Base64Image))
        {
            throw new InvalidOperationException("Base64Image must be provided for heic-to-jpg tasks.");
        }

        var originalBytes = Convert.FromBase64String(input.Base64Image);
        var originalSizeBytes = originalBytes.Length;

        // ImageSharp doesn't decode HEIC (it's HEVC-based and patent-encumbered),
        // so this one handler uses Magick.NET, which bundles a cross-platform
        // libheif build. Everything else in this project stays on ImageSharp.
        using var magickImage = new MagickImage(originalBytes);
        magickImage.AutoOrient();
        magickImage.Format = MagickFormat.Jpg;
        magickImage.Quality = 85;

        var convertedBytes = magickImage.ToByteArray();
        var compressedSizeBytes = convertedBytes.Length;

        var blobClient = outputContainer.GetBlobClient($"{taskId}.jpg");
        using (var convertedStream = new MemoryStream(convertedBytes))
        {
            await blobClient.UploadAsync(convertedStream, overwrite: true, cancellationToken);
        }

        return new
        {
            taskId,
            type = TaskType,
            originalSizeBytes,
            compressedSizeBytes
        };
    }
}
