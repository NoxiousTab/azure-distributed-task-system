using System.Threading;
using System.Threading.Tasks;
using AzureDistributedTaskSystem.Api.Controllers;
using AzureDistributedTaskSystem.Api.DTOs;
using AzureDistributedTaskSystem.Api.Models;
using AzureDistributedTaskSystem.Api.Repositories;
using AzureDistributedTaskSystem.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AzureDistributedTaskSystem.Tests.ApiTests;

public class TaskControllerValidationTests
{
    [Fact]
    public async Task SubmitTask_InvalidBody_ReturnsBadRequest()
    {
        var taskServiceMock = new Mock<ITaskService>();
        var blobRepoMock = new Mock<IBlobStorageRepository>();
        var loggerMock = new Mock<ILogger<TaskController>>();

        var controller = new TaskController(taskServiceMock.Object, blobRepoMock.Object, loggerMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var result = await controller.SubmitTask(null!, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetStatus_EmptyTaskId_ReturnsBadRequest()
    {
        var taskServiceMock = new Mock<ITaskService>();
        var blobRepoMock = new Mock<IBlobStorageRepository>();
        var loggerMock = new Mock<ILogger<TaskController>>();

        var controller = new TaskController(taskServiceMock.Object, blobRepoMock.Object, loggerMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var result = await controller.GetStatus("", CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}
