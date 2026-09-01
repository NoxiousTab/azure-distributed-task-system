using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;
using Markdig;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

public class MarkdownToHtmlHandler : ITaskHandler
{
    public string TaskType => "markdown-to-html";

    public Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken)
    {
        var html = ConvertMarkdownToHtml(input.Text);
        object result = new { taskId, type = TaskType, html };
        return Task.FromResult(result);
    }

    private static string ConvertMarkdownToHtml(string markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
        {
            return string.Empty;
        }

        // Use Markdig for full markdown support (headings, emphasis, lists, code blocks, etc.).
        var pipeline = new MarkdownPipelineBuilder()
            .UseAdvancedExtensions()
            .Build();

        return Markdown.ToHtml(markdown, pipeline);
    }
}
