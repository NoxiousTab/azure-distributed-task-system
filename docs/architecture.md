# Architecture

## Overview

This system is a local-only, cloud-native style distributed task processing system built on:

- **ASP.NET Core Web API (.NET 8)** for REST endpoints
- **Azure Functions (isolated worker)** for background processing
- **Azurite** for emulated Azure Storage (Blob + Queue)

### Components

- **API**
  - `POST /submit-task`: accepts task input, writes to Blob, enqueues a message.
  - `GET /status/{taskId}`: reads metadata JSON from Blob.
- **Worker**
  - Queue-triggered Function on `task-queue`.
  - Fetches input from Blob, processes it, writes output + metadata.
- **Storage**
  - Blob containers: `input`, `output`, `taskmetadata`.
  - Queue: `task-queue`.

### Task Type

The sample implementation uses **text summarization**:

- Input: long text.
- Output: truncated summary using a simple heuristic (length-based).

## Error Handling & Retry

- Queue-triggered Functions use built-in retry semantics from Azure Functions runtime.
- Worker wraps processing in try/catch and writes a `failed` status with error message into metadata.
- API validates requests and returns `400 Bad Request` for invalid payloads.

## Logging Strategy

- API and worker extensively use `ILogger` for:
  - Request handling
  - Storage operations
  - Error conditions and exceptions

Logs are Application Insights–compatible and can be wired to App Insights if you deploy to real Azure later.

## Scalability Notes

- Scale out by:
  - Running multiple worker instances (Functions scale out automatically in Azure; locally you can run multiple hosts).
  - Increasing queue processing concurrency.
- Blob and Queue Storage scale well for high throughput workloads.
- API is stateless so it can be fronted by load balancers.
