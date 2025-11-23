using System;
using System.Threading;
using System.Threading.Tasks;
using AzureDistributedTaskSystem.Api.DTOs;
using AzureDistributedTaskSystem.Api.Models;
using AzureDistributedTaskSystem.Api.Repositories;
using AzureDistributedTaskSystem.Api.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AzureDistributedTaskSystem.Tests.ApiTests;

public class TaskServiceTests
{
    [Fact]
    public async Task CreateTaskAsync_ValidRequest_EnqueuesMessageAndReturnsTaskId()
    {
        var blobRepoMock = new Mock<IBlobStorageRepository>();
        var queueRepoMock = new Mock<IQueueRepository>();
        var loggerMock = new Mock<ILogger<TaskService>>();

        blobRepoMock
            .Setup(b => b.SaveInputAsync(It.IsAny<string>(), It.IsAny<object>(), default))
            .ReturnsAsync((string taskId, object _, CancellationToken _) => $"input/{taskId}.json");

        var service = new TaskService(blobRepoMock.Object, queueRepoMock.Object, loggerMock.Object);

        var request = new SubmitTaskRequest
        {
            Type = "summarize",
            Text = "Some text to summarize"
        };

        var taskId = await service.CreateTaskAsync(request);

        Assert.False(string.IsNullOrWhiteSpace(taskId));
        blobRepoMock.Verify(b => b.SaveInputAsync(taskId, It.IsAny<object>(), default), Times.Once);
        queueRepoMock.Verify(q => q.EnqueueTaskAsync(It.IsAny<object>(), default), Times.Once);
    }

    [Fact]
    public async Task CreateTaskAsync_MarkdownToHtml_EnqueuesMessage()
    {
        var blobRepoMock = new Mock<IBlobStorageRepository>();
        var queueRepoMock = new Mock<IQueueRepository>();
        var loggerMock = new Mock<ILogger<TaskService>>();

        blobRepoMock
            .Setup(b => b.SaveInputAsync(It.IsAny<string>(), It.IsAny<object>(), default))
            .ReturnsAsync((string taskId, object _, CancellationToken _) => $"input/{taskId}.json");

        var service = new TaskService(blobRepoMock.Object, queueRepoMock.Object, loggerMock.Object);

        var request = new SubmitTaskRequest
        {
            Type = "markdown-to-html",
            Text = "# Title"
        };

        var taskId = await service.CreateTaskAsync(request);

        Assert.False(string.IsNullOrWhiteSpace(taskId));
        queueRepoMock.Verify(q => q.EnqueueTaskAsync(It.IsAny<object>(), default), Times.Once);
    }

    [Fact]
    public async Task CreateTaskAsync_InvalidType_ThrowsArgumentException()
    {
        var blobRepoMock = new Mock<IBlobStorageRepository>();
        var queueRepoMock = new Mock<IQueueRepository>();
        var loggerMock = new Mock<ILogger<TaskService>>();

        var service = new TaskService(blobRepoMock.Object, queueRepoMock.Object, loggerMock.Object);

        var request = new SubmitTaskRequest
        {
            Type = "unknown",
            Text = "text"
        };

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateTaskAsync(request));
    }

    [Fact]
    public async Task GetTaskStatusAsync_DelegatesToRepository()
    {
        var blobRepoMock = new Mock<IBlobStorageRepository>();
        var queueRepoMock = new Mock<IQueueRepository>();
        var loggerMock = new Mock<ILogger<TaskService>>();

        var expected = new TaskMetadata { TaskId = "id", Status = AzureDistributedTaskSystem.Api.Models.TaskStatus.Completed };
        blobRepoMock
            .Setup(b => b.GetMetadataAsync("id", default))
            .ReturnsAsync(expected);

        var service = new TaskService(blobRepoMock.Object, queueRepoMock.Object, loggerMock.Object);

        var result = await service.GetTaskStatusAsync("id");

        Assert.Equal(expected, result);
    }
}
