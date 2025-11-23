using Azure.Storage.Blobs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

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

        services.AddLogging();

        services.AddSingleton(new BlobServiceClient(storageConnectionString));
        services.AddSingleton<AzureDistributedTaskSystem.Worker.WorkerLogic.ITaskProcessorService, AzureDistributedTaskSystem.Worker.WorkerLogic.TaskProcessorService>();
    })
    .ConfigureFunctionsWorkerDefaults()
    .Build();

await host.RunAsync();
