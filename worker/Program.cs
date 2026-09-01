using Azure.Storage.Blobs;
using AzureDistributedTaskSystem.Worker.WorkerLogic;
using AzureDistributedTaskSystem.Worker.WorkerLogic.Handlers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Syncfusion.Licensing;

// This is just a fake key, it will most probably not work. I just used this for testing/experimental purposes.
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense("Ngo9BigBOggjHTQxAR8/V1JAaF1cX2hLflFwWGNQYl53ZFRCalhSTnRaSV9jS3hTfkZiWHtac3ZQR2JcWE91Ww==");
var host = new HostBuilder()
    .ConfigureAppConfiguration((context, config) =>
    {
        config.AddJsonFile("local.settings.json", optional: true, reloadOnChange: true)
              .AddEnvironmentVariables();
    })
    .ConfigureServices((context, services) =>
    {
        var configuration = context.Configuration;
        var storageConnectionString = configuration["AzureWebJobsStorage"] ?? "UseDevelopmentStorage=true";

        // Syncfusion requires a one-time license registration before any Syncfusion
        // API is used. Read from local.settings.json / environment - never hardcode
        // this. See local.settings.json.example for the expected key name.
        var syncfusionLicenseKey = configuration["SyncfusionLicenseKey"];
        if (!string.IsNullOrWhiteSpace(syncfusionLicenseKey))
        {
            SyncfusionLicenseProvider.RegisterLicense(syncfusionLicenseKey);
        }

        services.AddLogging();

        services.AddSingleton(new BlobServiceClient(storageConnectionString));

        // One handler per task type. TaskHandlerRegistry collects all of these via
        // IEnumerable<ITaskHandler> and dispatches by TaskType - adding a new task
        // type means writing a new handler and registering it here, nothing else.
        services.AddSingleton<ITaskHandler, SummarizeTextHandler>();
        services.AddSingleton<ITaskHandler, MarkdownToHtmlHandler>();
        services.AddSingleton<ITaskHandler, CompressImageHandler>();
        services.AddSingleton<ITaskHandler, HeicToJpgHandler>();
        services.AddSingleton<ITaskHandler, ImageToPdfHandler>();
        services.AddSingleton<ITaskHandler, PassportPhotoHandler>();
        services.AddSingleton<ITaskHandler, MergePdfHandler>();
        services.AddSingleton<ITaskHandler, CompressPdfHandler>();
        services.AddSingleton<TaskHandlerRegistry>();

        services.AddSingleton<ITaskProcessorService, TaskProcessorService>();
    })
    .ConfigureFunctionsWorkerDefaults()
    .Build();

await host.RunAsync();
