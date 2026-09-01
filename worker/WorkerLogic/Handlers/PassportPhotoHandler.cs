using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

public class PassportPhotoHandler : ITaskHandler
{
    private const int PassportPhotoSizePx = 600;

    public string TaskType => "passport-photo";

    public async Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Base64Image))
        {
            throw new InvalidOperationException("Base64Image must be provided for passport-photo tasks.");
        }

        var originalBytes = Convert.FromBase64String(input.Base64Image);
        var originalSizeBytes = originalBytes.Length;

        using var inputStream = new MemoryStream(originalBytes);
        using var image = await Image.LoadAsync(inputStream, cancellationToken);

        // Center-crop to a square before resizing, so the subject isn't
        // stretched to fit the required 1:1 passport photo aspect ratio.
        var squareSide = Math.Min(image.Width, image.Height);
        image.Mutate(x => x
            .Crop(new Rectangle(
                (image.Width - squareSide) / 2,
                (image.Height - squareSide) / 2,
                squareSide,
                squareSide))
            .Resize(PassportPhotoSizePx, PassportPhotoSizePx));

        using var outputStream = new MemoryStream();
        var encoder = new JpegEncoder { Quality = 90 };
        await image.SaveAsJpegAsync(outputStream, encoder, cancellationToken);
        var resultBytes = outputStream.ToArray();

        var blobClient = outputContainer.GetBlobClient($"{taskId}.jpg");
        outputStream.Position = 0;
        await blobClient.UploadAsync(outputStream, overwrite: true, cancellationToken);

        return new
        {
            taskId,
            type = TaskType,
            originalSizeBytes,
            compressedSizeBytes = resultBytes.Length,
            width = PassportPhotoSizePx,
            height = PassportPhotoSizePx
        };
    }
}
