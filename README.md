# Azure Distributed Task Processing System (Local Azure Emulation + .NET 8 + C#)

## ASCII Architecture Diagram

```text
+-------------+        +--------------------+        +------------------+
|  API (Web)  |        |   Azurite Queue    |        | Azure Functions  |
|  .NET 8     |        |  (task-queue)     |        |  Worker (Queue   |
|             |  --->  |                    |  --->  |   Trigger)       |
+-------------+        +--------------------+        +------------------+
       |                         |                               |
       v                         v                               v
+----------------+      +--------------------+          +-------------------+
|  Azurite Blob  |      |  taskmetadata/     |          |  output/          |
|  input/        |      |  status JSON       |          |  processed result |
+----------------+      +--------------------+          +-------------------+
```

- **API**: Accepts task submissions and exposes status endpoints.
- **Azurite Queue**: Stores task messages.
- **Functions Worker**: Dequeues and processes tasks.
- **Azurite Blob Storage**: Stores input, output, and metadata JSON.

## Quick Start

See `docs/setup.md` for full setup and run instructions.

High-level steps:

- **Start Azurite** with Docker Compose.
- **Run the API** (`dotnet run` in `api/`).
- **Run the worker** (`func start` in `worker/`).
- **Submit tasks** via `POST /submit-task`.
- **Check status** via `GET /status/{taskId}`.
