# API Documentation

Base URL (local): `http://localhost:5000` or `http://localhost:5190` (depending on Kestrel port).

## POST /submit-task

Submit a new task.

### Request

```http
POST /submit-task
Content-Type: application/json
```

```json
{
  "type": "summarize",
  "text": "Sample text to summarize..."
}
```

or

```json
{
  "type": "markdown-to-html",
  "text": "# Heading\n\nSome *markdown* content."
}
```

- **type**: `summarize` or `markdown-to-html`.
- **text**: non-empty string (interpreted as plain text or markdown depending on `type`).

### Responses

- `202 Accepted`

```json
{
  "taskId": "<guid>"
}
```

- `400 Bad Request` – invalid payload.
- `500 Internal Server Error` – unexpected error.

### Example (curl)

```bash
curl -X POST "http://localhost:5190/submit-task" \
  -H "Content-Type: application/json" \
  -d '{"type":"summarize","text":"This is a long text..."}'
```

## GET /status/{taskId}

Retrieve the status of a task.

### Request

```http
GET /status/{taskId}
```

### Responses

- `200 OK`

```json
{
  "taskId": "...",
  "status": "pending|processing|completed|failed",
  "outputUrl": "http://127.0.0.1:10000/devstoreaccount1/output/..." ,
  "errorMessage": null
}
```

- `404 Not Found` – task metadata not found.
- `500 Internal Server Error` – unexpected error.

### Example (curl)

```bash
curl "http://localhost:5190/status/{taskId}"
```
