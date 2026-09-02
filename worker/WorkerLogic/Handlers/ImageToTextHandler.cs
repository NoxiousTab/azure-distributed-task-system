using System.Diagnostics;
using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.Models;

namespace AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;

/// <summary>
/// Runs OCR by shelling out to the system `tesseract` CLI (apt install tesseract-ocr),
/// rather than the charlesw/tesseract NuGet P/Invoke wrapper. That wrapper's native-library
/// loader hardcodes specific .so filenames (e.g. libleptonica-1.82.0.so) that don't match
/// what apt actually installs on Ubuntu/Debian - a long-standing, unfixed upstream bug
/// (see charlesw/tesseract issues #503 and #675). The distro's tesseract binary is already
/// correctly linked against whatever leptonica it was built against, so calling it as a
/// subprocess sidesteps the whole interop-naming problem.
///
/// Requires `tesseract-ocr` (and English language data - usually pulled in automatically,
/// see worker/README-ocr-setup.md if not) installed on whatever machine runs this worker.
/// </summary>
public class ImageToTextHandler : ITaskHandler
{
    public string TaskType => "image-to-text";

    public async Task<object> ProcessAsync(TaskInput input, string taskId, BlobContainerClient outputContainer, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Base64Image))
        {
            throw new InvalidOperationException("Base64Image must be provided for image-to-text tasks.");
        }

        var imageBytes = Convert.FromBase64String(input.Base64Image);

        var workDir = Path.Combine(Path.GetTempPath(), $"ocr-{taskId}");
        Directory.CreateDirectory(workDir);
        var inputPath = Path.Combine(workDir, "input.png");
        var outputBase = Path.Combine(workDir, "output"); // tesseract appends .txt / .tsv itself

        try
        {
            await File.WriteAllBytesAsync(inputPath, imageBytes, cancellationToken);

            var (exitCode, stdErr) = await RunTesseractAsync(inputPath, outputBase, cancellationToken);
            if (exitCode != 0)
            {
                throw new InvalidOperationException($"tesseract exited with code {exitCode}: {stdErr}");
            }

            var text = (await File.ReadAllTextAsync(outputBase + ".txt", cancellationToken)).Trim();
            var confidence = TryReadAverageConfidence(outputBase + ".tsv");

            object result = new
            {
                taskId,
                type = TaskType,
                text,
                characterCount = text.Length,
                confidence
            };

            return result;
        }
        catch (System.ComponentModel.Win32Exception ex)
        {
            // Process.Start throws this specific exception type when the executable
            // itself can't be found on PATH - worth a clearer message than the raw Win32 one.
            throw new InvalidOperationException(
                "Couldn't find the 'tesseract' executable. Install it with: sudo apt install tesseract-ocr", ex);
        }
        finally
        {
            try { Directory.Delete(workDir, recursive: true); } catch { /* best-effort cleanup */ }
        }
    }

    private static async Task<(int ExitCode, string StdErr)> RunTesseractAsync(string inputPath, string outputBase, CancellationToken cancellationToken)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "tesseract",
            ArgumentList = { inputPath, outputBase, "txt", "tsv" },
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };

        using var process = Process.Start(psi) ?? throw new InvalidOperationException("Failed to start the tesseract process.");
        var stdErrTask = process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        var stdErr = await stdErrTask;
        return (process.ExitCode, stdErr);
    }

    // tesseract's TSV output has one row per detected element (page/block/paragraph/line/word),
    // with a `conf` column that's -1 for anything above word level. Averaging just the word-level
    // rows gives a reasonable overall confidence score for the UI.
    private static double? TryReadAverageConfidence(string tsvPath)
    {
        if (!File.Exists(tsvPath))
        {
            return null;
        }

        var lines = File.ReadAllLines(tsvPath);
        double sum = 0;
        int count = 0;

        for (int i = 1; i < lines.Length; i++)
        {
            var cols = lines[i].Split('\t');
            if (cols.Length < 11 || !double.TryParse(cols[10], out var conf) || conf < 0)
            {
                continue;
            }
            sum += conf;
            count++;
        }

        return count > 0 ? Math.Round(sum / count, 1) : null;
    }
}

