using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

public class ImageToPdfHandler : ITaskHandler
{
    public string TaskType => "image-to-pdf";

    public async Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Base64Image))
        {
            throw new InvalidOperationException("Base64Image must be provided for image-to-pdf tasks.");
        }

        var originalBytes = Convert.FromBase64String(input.Base64Image);
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

        var blobClient = outputContainer.GetBlobClient($"{taskId}.pdf");
        using (var pdfUploadStream = new MemoryStream(pdfBytes))
        {
            await blobClient.UploadAsync(pdfUploadStream, overwrite: true, cancellationToken);
        }

        return new
        {
            taskId,
            type = TaskType,
            originalSizeBytes,
            compressedSizeBytes = pdfBytes.Length
        };
    }
}
