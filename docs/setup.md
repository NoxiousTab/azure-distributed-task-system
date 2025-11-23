# Setup and Run Guide

## Prerequisites

- Windows
- .NET 8 SDK
- Azure Functions Core Tools v4
- Docker Desktop
- Azure Storage Explorer (optional but recommended)

## 1. Start Azurite via Docker Compose

From the repo root:

```bash
docker compose up -d
```

Azurite endpoints (default):

- Blob: `http://127.0.0.1:10000/devstoreaccount1`
- Queue: `http://127.0.0.1:10001/devstoreaccount1`

Connection string used by this project:

```text
UseDevelopmentStorage=true
```

## 2. Run the API

```bash
cd api
dotnet run
```

The API will listen on a Kestrel port (e.g., `http://localhost:5190`).

## 3. Run the Worker (Azure Functions)

```bash
cd worker
func start
```

The Functions host will start and listen for queue messages on the configured queue.

## 4. Use Storage Explorer (optional)

- Configure a new connection using `UseDevelopmentStorage=true`.
- You should see:
  - Blob containers: `input`, `output`, `taskmetadata`.
  - Queue: `task-queue`.

## 5. End-to-End Test

1. **Submit a task**

```bash
curl -X POST "http://localhost:5190/submit-task" \
  -H "Content-Type: application/json" \
  -d '{"type":"summarize","text":"This is a long text to summarize..."}'
```

Note the returned `taskId`.

2. **Poll status**

```bash
curl "http://localhost:5190/status/<taskId>"
```

3. **Inspect blobs (optional)** using Storage Explorer under:

- `input/{taskId}.json`
- `output/{taskId}.json`
- `taskmetadata/{taskId}.json`

## 6. Run Tests

From the repo root:

```bash
dotnet test
```

This runs unit tests for both the API and worker logic.
