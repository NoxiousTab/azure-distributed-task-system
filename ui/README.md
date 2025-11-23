# Azure Distributed Task Processing System – Web Console (UI)

A React + TypeScript + Vite + TailwindCSS web console for the **Azure Distributed Task Processing System**.

This UI lets you:

- **Submit tasks** to the local ASP.NET Core Web API
- **Monitor task status** via `/status/{taskId}`
- **View results** (summary or rendered HTML)
- **Browse recent tasks** stored locally in `localStorage`

---

## Tech Stack

- React 18 + TypeScript
- Vite
- TailwindCSS
- react-router-dom
- lucide-react (icons)
- react-hot-toast (toasts)

---

## Getting Started

### 1. Prerequisites

- Node.js (18+ recommended)
- The backend API running locally at `http://localhost:5000` (see root project README)

### 2. Install dependencies

From the `ui/` folder:

```bash
cd ui
npm install
```

### 3. Run the dev server

```bash
npm run dev
```

Open the URL printed by Vite, typically:

```text
http://localhost:5173/
```

You should see the **Azure Task Processing** dashboard.

---

## API Configuration

By default, the UI talks to the backend at:

```text
http://localhost:5000
```

To change this, create a `.env.local` file in `ui/` with:

```bash
VITE_API_BASE_URL=http://localhost:5001
```

Then restart the dev server.

---

## Pages & Features

### Home

- Overview of the system.
- Lists currently supported task types:
  - `Summarize Text` – simple sentence-aware summary.
  - `Convert Markdown` – Markdown to HTML converter.
  - `Compress Image` – visible in UI but not yet wired to the backend.

### Submit Task

- Task type dropdown:
  - **Summarize Text**
  - **Convert Markdown**
  - **Compress Image (not yet supported)**
- Dynamic input:
  - Textarea for text/markdown tasks.
  - File input shown for image task (disabled at backend level).
- Validations:
  - Require task type.
  - Require text or file depending on task.
  - Max file size 5MB for images.
- On submit:
  - Calls `POST /submit-task` with `{ type, text }`.
  - Shows toast notifications for success/error.
  - Stores task in localStorage for Recent Tasks.
  - Shows latest status card and allows quick tracking.

### Task Status

- Input field for `taskId`.
- **Check Status** button → calls `GET /status/{taskId}`.
- Auto-refresh toggle (5s interval) for polling.
- Status card shows:
  - `taskId`
  - `status` (`pending|processing|completed|failed`)
  - `outputUrl` if provided
  - `errorMessage` if provided

### Recent Tasks

- Shows last 10 tasks saved in `localStorage` by this browser.
- Click **Check Status** to fetch status via API.
- Status card for the selected task.

### About

- High-level architecture overview.
- Current API base URL.
- Hint for changing `VITE_API_BASE_URL`.

---

## File Structure

```text
ui/
  src/
    components/
      Navbar.tsx
      TaskForm.tsx
      StatusCard.tsx
      RecentTasksList.tsx
      LoadingSpinner.tsx
    pages/
      Home.tsx
      SubmitTask.tsx
      TaskStatus.tsx
      RecentTasks.tsx
      About.tsx
    hooks/
      useTaskApi.ts
      useLocalTasks.ts
    types/
      task.ts
    utils/
      api.ts
    App.tsx
    main.tsx
    index.css
  package.json
  tsconfig.json
  tailwind.config.js
  vite.config.ts
  postcss.config.cjs
  index.html
```

---

## Building for Production

From `ui/`:

```bash
npm run build
```

This produces a static bundle in `dist/` that can be served by any static file server or reverse-proxied behind your API.

You can preview the production build with:

```bash
npm run preview
```

---

## Notes

- The **Compress Image** task type is currently **UI-only**; the backend does not yet support it and the UI will show a helpful error.
- All behavior assumes the backend API shape as documented in the main project.

---

_Screenshot placeholders_

- `screenshots/home.png` – Home dashboard
- `screenshots/submit.png` – Submit Task form
- `screenshots/status.png` – Task Status view
- `screenshots/recent.png` – Recent Tasks list

IMPORTANT: Ensure the backend is running and accessible before using the UI.
