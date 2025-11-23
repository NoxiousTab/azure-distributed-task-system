using System.Threading.Tasks;
using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.WorkerLogic;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AzureDistributedTaskSystem.Tests.WorkerTests;

public class TaskProcessorServiceTests
{
    [Fact]
    public async Task ProcessMessageAsync_InvalidMessage_DoesNotThrow()
    {
        var blobServiceMock = new Mock<BlobServiceClient>();
        var loggerMock = new Mock<ILogger<TaskProcessorService>>();

        var service = new TaskProcessorService(blobServiceMock.Object, loggerMock.Object);

        // message missing TaskId should be treated as invalid and simply logged, not throw
        var invalidMessageJson = "{ \"type\": \"summarize\", \"inputBlobPath\": \"input/task1.json\" }";

        await service.ProcessMessageAsync(invalidMessageJson);
    }
}
