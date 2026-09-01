using System.Text;
using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

public class SummarizeTextHandler : ITaskHandler
{
    public string TaskType => "summarize";

    public Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken)
    {
        var summary = SummarizeText(input.Text);
        object result = new { taskId, type = TaskType, summary };
        return Task.FromResult(result);
    }

    private static string SummarizeText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        const int maxLength = 200;
        if (text.Length <= maxLength)
        {
            return text;
        }

        // Simple sentence-aware heuristic: keep whole sentences up to maxLength
        var sentenceEndings = new[] { '.', '!', '?' };
        var sentences = new List<string>();

        int start = 0;
        for (int i = 0; i < text.Length; i++)
        {
            if (sentenceEndings.Contains(text[i]))
            {
                int end = i + 1;
                var sentence = text[start..end].Trim();
                if (!string.IsNullOrWhiteSpace(sentence))
                {
                    sentences.Add(sentence);
                }
                start = end;
            }
        }

        // Tail content after the last punctuation
        if (start < text.Length)
        {
            var tail = text[start..].Trim();
            if (!string.IsNullOrWhiteSpace(tail))
            {
                sentences.Add(tail);
            }
        }

        if (sentences.Count == 0)
        {
            // Fallback: pure truncation
            return text[..maxLength] + "...";
        }

        var builder = new StringBuilder();
        foreach (var sentence in sentences)
        {
            if (builder.Length + sentence.Length > maxLength)
            {
                break;
            }
            if (builder.Length > 0)
            {
                builder.Append(' ');
            }
            builder.Append(sentence);
        }

        if (builder.Length == 0)
        {
            // If even first sentence is too long, truncate it
            return sentences[0].Length <= maxLength
                ? sentences[0]
                : sentences[0][..maxLength] + "...";
        }

        return builder.ToString();
    }
}
