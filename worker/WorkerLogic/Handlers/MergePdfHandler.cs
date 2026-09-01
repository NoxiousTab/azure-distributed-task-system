using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

public class MergePdfHandler : ITaskHandler
{
    public string TaskType => "merge-pdf";

    public async Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken)
    {
        if (input.Base64Files == null || input.Base64Files.Count < 2)
        {
            throw new InvalidOperationException("At least 2 Base64Files must be provided for merge-pdf tasks.");
        }

        long totalOriginalBytes = 0;
        var sourceDocuments = new List<PdfDocument>();

        try
        {
            // Keep every source document open (not disposed) until after the merged
            // document is saved - PdfDocumentOpenMode.Import defers copying some
            // page resources (fonts/images) until Save, so disposing a source early
            // can produce a broken merged file.
            foreach (var base64File in input.Base64Files)
            {
                var fileBytes = Convert.FromBase64String(base64File);
                totalOriginalBytes += fileBytes.Length;
                var fileStream = new MemoryStream(fileBytes);
                sourceDocuments.Add(PdfReader.Open(fileStream, PdfDocumentOpenMode.Import));
            }

            using var mergedDocument = new PdfDocument();
            var mergedPageCount = 0;
            foreach (var sourceDocument in sourceDocuments)
            {
                for (var i = 0; i < sourceDocument.PageCount; i++)
                {
                    mergedDocument.AddPage(sourceDocument.Pages[i]);
                    mergedPageCount++;
                }
            }

            byte[] mergedBytes;
            using (var mergedStream = new MemoryStream())
            {
                mergedDocument.Save(mergedStream, false);
                mergedBytes = mergedStream.ToArray();
            }

            var blobClient = outputContainer.GetBlobClient($"{taskId}.pdf");
            using (var mergedUploadStream = new MemoryStream(mergedBytes))
            {
                await blobClient.UploadAsync(mergedUploadStream, overwrite: true, cancellationToken);
            }

            return new
            {
                taskId,
                type = TaskType,
                originalSizeBytes = totalOriginalBytes,
                compressedSizeBytes = mergedBytes.Length,
                fileCount = input.Base64Files.Count,
                pageCount = mergedPageCount
            };
        }
        finally
        {
            foreach (var sourceDocument in sourceDocuments)
            {
                sourceDocument.Dispose();
            }
        }
    }
}
