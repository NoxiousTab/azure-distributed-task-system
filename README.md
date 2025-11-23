# Azure Distributed Task Processing System

Local, end-to-end distributed task processing stack built with **.NET 8**, **Azure Functions (isolated)**, **Azurite** and a **React + TypeScript + Vite + TailwindCSS** web console.

## Architecture

```text
   Web UI (React/Vite/Tailwind)
                |
                v
+-----------------------------+
|        ASP.NET Core API     |
|  (submit, status, result,   |
|      compressed image)      |
+-----------------------------+
                |
                v
      Azurite Queue Storage
      (task-queue)
                |
                v
+-----------------------------+
|   Azure Functions Worker    |
|  (Queue trigger, .NET 8)    |
+-----------------------------+
                |
                v
      Azurite Blob Storage
  - input/         (task inputs)
  - output/        (results + images)
  - taskmetadata/  (status JSON)
```

### Components

- **API (`api/`)**
  - `POST /submit-task` – text-based tasks.
  - `POST /submit-image-task` – image compression tasks (multipart, JPEG/PNG).
  - `GET /status/{taskId}` – task status + output blob URL.
  - `GET /result/{taskId}` – JSON result payload.
  - `GET /image/{taskId}` – streams compressed JPEG back to the UI.

- **Worker (`worker/`)**
  - Azure Functions isolated worker triggered by queue messages.
  - Reads task input from `input/`, writes result JSON to `output/`, updates `taskmetadata/`.
  - Uses **Markdig** for Markdown → HTML.
  - Uses **System.Drawing** to recompress images to JPEG.

- **UI (`ui/`)**
  - React 18 + TypeScript + Vite + TailwindCSS.
  - Pages: Home, Submit Task, Task Status, Recent Tasks, About.
  - Task types:
    - `summarize` – sentence-aware text summarization.
    - `markdown-to-html` – Markdown rendered via Markdig.
    - `compress-image` – image upload, backend compression, inline stats + download/preview.
  - Uses `react-hot-toast` for notifications and Tailwind typography for nice HTML rendering.

## Task Types

### 1. Summarize text

- **Submit**: `POST /submit-task` with JSON body:

  ```json
  { "type": "summarize", "text": "..." }
  ```

- Worker runs a sentence-aware heuristic to keep whole sentences up to a max length.
- Result is available via `GET /result/{taskId}` as `{ summary: "..." }` and shown in the UI.

### 2. Markdown to HTML

- **Submit**: `POST /submit-task` with JSON body:

  ```json
  { "type": "markdown-to-html", "text": "# Title\n..." }
  ```

- Worker uses Markdig with advanced extensions to produce HTML.
- Result is `{ html: "<h1>Title</h1>..." }` and rendered in the UI with Tailwind typography.

### 3. Compress image

- **Submit**:
  - Via API: `POST /submit-image-task` (`multipart/form-data`):
    - `type=compress-image`
    - `file` = JPEG or PNG, ≤ 5MB.
  - Via UI: choose **Compress Image**, upload file, submit.

- Worker decodes the image, recompresses to JPEG (quality ~75), and writes:
  - `output/{taskId}.jpg` – compressed image.
  - `output/{taskId}.json` – result JSON:

    ```json
    {
      "taskId": "...",
      "type": "compress-image",
      "originalSizeBytes": 123456,
      "compressedSizeBytes": 45678,
      "compressionRatio": 0.37
    }
    ```

- UI shows size stats and uses `GET /image/{taskId}` for download + preview.

## Local Development

See `docs/setup.md` for full instructions. High-level steps:

1. **Start Azurite** (from repo root):

   ```bash
   docker compose up -d
   ```

2. **Run the API**:

   ```bash
   cd api
   dotnet run
   ```

3. **Run the worker**:

   ```bash
   cd worker
   dotnet restore
   func start
   ```

4. **Run the web UI**:

   ```bash
   cd ui
   npm install
   npm run dev
   ```

   The UI defaults to `http://localhost:5000` for the API. You can override via `VITE_API_BASE_URL` in `.env.local` under `ui/`.

## GitHub Actions CI

GitHub Actions workflow: `.github/workflows/build-and-test.yml`.

- Runs on `windows-latest` for pushes/PRs to `main`/`master`.
- Steps:
  - `dotnet restore` for:
    - `api/api.csproj`
    - `worker/worker.csproj`
    - `tests/tests.csproj`
  - `dotnet build` each project in **Release** configuration.
  - `dotnet test` for `tests/tests.csproj` with `XPlat Code Coverage`.

> **Note**  
> The earlier CI failure (`MSB1003: Specify a project or solution file`) happened because `dotnet restore` was run in the repo root, which does not contain a `.sln` or project file. The workflow now restores/builds/tests each project explicitly by path, so this error should no longer occur.

## Logging & Observability

- Both API and worker use `ILogger` extensively for request handling, storage operations, and error paths.
- Logs are compatible with Application Insights if you deploy to real Azure.

## Repository Structure

```text
api/        ASP.NET Core Web API
worker/     Azure Functions isolated worker
tests/      xUnit tests for API and worker logic
ui/         React + TS + Vite + Tailwind web console
docs/       Additional documentation (setup, API, architecture)
.github/    GitHub Actions workflows
```

You can extend this system with additional task types, richer monitoring (e.g., per-task timelines), or deeper observability as needed.
