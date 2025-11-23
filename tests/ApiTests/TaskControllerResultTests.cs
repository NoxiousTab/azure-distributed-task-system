using System.Threading;
using System.Threading.Tasks;
using AzureDistributedTaskSystem.Api.Controllers;
using AzureDistributedTaskSystem.Api.Models;
using AzureDistributedTaskSystem.Api.Repositories;
using AzureDistributedTaskSystem.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AzureDistributedTaskSystem.Tests.ApiTests;

public class TaskControllerResultTests
{
    [Fact]
    public async Task GetResult_CompletedTask_ReturnsContent()
    {
        var taskServiceMock = new Mock<ITaskService>();
        var blobRepoMock = new Mock<IBlobStorageRepository>();
        var loggerMock = new Mock<ILogger<TaskController>>();

        var metadata = new TaskMetadata
        {
            TaskId = "task1",
            Status = AzureDistributedTaskSystem.Api.Models.TaskStatus.Completed,
            OutputBlob = "output/task1.json"
        };

        taskServiceMock
            .Setup(s => s.GetTaskStatusAsync("task1", default))
            .ReturnsAsync(metadata);

        blobRepoMock
            .Setup(b => b.GetOutputContentAsync("task1", default))
            .ReturnsAsync("{\"taskId\":\"task1\",\"summary\":\"ok\"}");

        var controller = new TaskController(taskServiceMock.Object, blobRepoMock.Object, loggerMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var result = await controller.GetResult("task1", CancellationToken.None);

        var contentResult = Assert.IsType<ContentResult>(result);
        Assert.Equal("application/json", contentResult.ContentType);
        Assert.Contains("\"taskId\":\"task1\"", contentResult.Content);
    }
}
