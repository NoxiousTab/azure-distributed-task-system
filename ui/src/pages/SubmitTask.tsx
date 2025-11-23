import React, { useState } from 'react';
import { TaskForm } from '../components/TaskForm';
import { StatusCard } from '../components/StatusCard';
import { useTaskApi } from '../hooks/useTaskApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { TaskStatusResponseDto, TaskResultDto } from '../types/task';

export const SubmitTaskPage: React.FC = () => {
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatusResponseDto | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [result, setResult] = useState<TaskResultDto | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const { getStatus, getResult, baseUrl } = useTaskApi();

  const handleTrackClick = async () => {
    if (!currentTaskId) return;
    try {
      setLoadingStatus(true);
      const s = await getStatus(currentTaskId);
      setStatus(s);

      if (s.status === 'completed') {
        setLoadingResult(true);
        const r = await getResult(currentTaskId);
        setResult(r);
      }
    } catch (err) {
      // handled via toasts inside hook consumer usually, keep silent here
    } finally {
      setLoadingStatus(false);
      setLoadingResult(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-slate-50">Submit Task</h1>
        <p className="text-sm text-slate-400">
          Choose a task type, provide input, and submit to the backend. You will receive a task ID that you can use to
          track status and retrieve results.
        </p>
        <TaskForm onTaskSubmitted={setCurrentTaskId} />
        {currentTaskId && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-100">Current Task ID</p>
                <p className="break-all text-slate-300">{currentTaskId}</p>
              </div>
              <button
                type="button"
                onClick={handleTrackClick}
                className="ml-4 inline-flex items-center gap-2 rounded border border-sky-500 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/10"
              >
                {loadingStatus && <LoadingSpinner size="sm" />}
                Track Task
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-100">Latest Status</h2>
        <StatusCard status={status} loading={loadingStatus} />
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Result</h3>
          {loadingResult && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <LoadingSpinner size="sm" /> <span>Fetching result...</span>
            </div>
          )}
          {!loadingResult && !result && (
            <p className="text-xs text-slate-400">Result will appear here once the task is completed.</p>
          )}
          {!loadingResult && result && (
            <div className="space-y-3">
              {result.type === 'compress-image' ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">Compressed image</p>
                  <div className="text-xs text-slate-300">
                    {typeof result.originalSizeBytes === 'number' && typeof result.compressedSizeBytes === 'number' && (
                      <div className="space-y-1">
                        <p>
                          Original size:{' '}
                          <span className="font-mono">
                            {(result.originalSizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </p>
                        <p>
                          Compressed size:{' '}
                          <span className="font-mono">
                            {(result.compressedSizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </p>
                        <p>
                          Ratio:{' '}
                          <span className="font-mono">
                            {((result.compressedSizeBytes / result.originalSizeBytes) * 100).toFixed(1)}%
                          </span>{' '}
                          of original
                        </p>
                      </div>
                    )}
                  </div>
                  {currentTaskId && (
                    (() => {
                      const imageUrl = `${baseUrl}/image/${encodeURIComponent(currentTaskId)}`;
                      return (
                        <div className="space-y-2">
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-sky-600 px-2 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-600/20"
                          >
                            Download compressed image
                          </a>
                          <div className="overflow-hidden rounded border border-slate-700 bg-slate-950/60 p-2">
                            <img src={imageUrl} alt="Compressed" className="max-h-48 w-full object-contain" />
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {result.html && (
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Rendered HTML</p>
                      <div
                        className="prose prose-invert max-w-none rounded border border-slate-700 bg-slate-950/60 p-3 text-sm"
                        // Backend already HTML-encodes markdown, but treat as trusted output for this local demo.
                        dangerouslySetInnerHTML={{ __html: result.html }}
                      />
                    </div>
                  )}
                  {result.summary && (
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Summary</p>
                      <pre className="whitespace-pre-wrap rounded border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-100">
                        {result.summary}
                      </pre>
                    </div>
                  )}
                  {!result.html && !result.summary && (
                    <div>
                      <p className="text-xs text-slate-400">No html/summary field present. Raw JSON:</p>
                      <pre className="whitespace-pre-wrap rounded border border-slate-700 bg-slate-950/60 p-3 text-[11px] text-slate-100">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
