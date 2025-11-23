using Azure.Storage.Blobs;
using Azure.Storage.Queues;
using AzureDistributedTaskSystem.Api.Repositories;
using AzureDistributedTaskSystem.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Configuration
var storageConnectionString = builder.Configuration.GetValue<string>("Storage:ConnectionString")
    ?? "UseDevelopmentStorage=true";
var inputContainerName = builder.Configuration.GetValue<string>("Storage:InputContainer") ?? "input";
var outputContainerName = builder.Configuration.GetValue<string>("Storage:OutputContainer") ?? "output";
var metadataContainerName = builder.Configuration.GetValue<string>("Storage:MetadataContainer") ?? "taskmetadata";
var queueName = builder.Configuration.GetValue<string>("Storage:QueueName") ?? "task-queue";

// Azure Storage clients (Azurite-compatible)
builder.Services.AddSingleton(_ => new BlobServiceClient(storageConnectionString));
builder.Services.AddSingleton(_ => new QueueServiceClient(storageConnectionString));

builder.Services.AddSingleton<IBlobStorageRepository>(sp =>
{
    var blobServiceClient = sp.GetRequiredService<BlobServiceClient>();
    var logger = sp.GetRequiredService<ILogger<BlobStorageRepository>>();
    return new BlobStorageRepository(blobServiceClient, inputContainerName, outputContainerName, metadataContainerName, logger);
});

builder.Services.AddSingleton<IQueueRepository>(sp =>
{
    var queueServiceClient = sp.GetRequiredService<QueueServiceClient>();
    var logger = sp.GetRequiredService<ILogger<QueueRepository>>();
    return new QueueRepository(queueServiceClient, queueName, logger);
});

builder.Services.AddScoped<ITaskService, TaskService>();

// Allow the local React/Vite UI to call this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();

public partial class Program { }
