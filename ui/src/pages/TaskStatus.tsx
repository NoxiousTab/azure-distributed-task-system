import React, { useEffect, useState } from 'react';
import { useTaskApi } from '../hooks/useTaskApi';
import { StatusCard } from '../components/StatusCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { TaskStatusResponseDto, TaskResultDto } from '../types/task';
import toast from 'react-hot-toast';

export const TaskStatusPage: React.FC = () => {
  const [taskId, setTaskId] = useState('');
  const [status, setStatus] = useState<TaskStatusResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [result, setResult] = useState<TaskResultDto | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const { getStatus, getResult, baseUrl } = useTaskApi();

  const fetchStatus = async () => {
    if (!taskId.trim()) {
      toast.error('Enter a task ID');
      return;
    }
    try {
      setLoading(true);
      const s = await getStatus(taskId.trim());
      setStatus(s);

      if (s.status === 'completed') {
        setLoadingResult(true);
        const r = await getResult(s.taskId);
        setResult(r);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to fetch status');
    } finally {
      setLoading(false);
      setLoadingResult(false);
    }
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, taskId]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-50">Task Status</h1>
      <p className="text-sm text-slate-400">
        Enter a task ID to check its status. You can also enable auto-refresh to poll every few seconds.
      </p>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="taskIdInput">
            Task ID
          </label>
          <input
            id="taskIdInput"
            type="text"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            placeholder="Paste a task ID here"
          />
        </div>
        <div className="flex flex-col items-start gap-2 pt-2 md:w-56 md:items-end md:pt-0">
          <button
            type="button"
            onClick={fetchStatus}
            className="inline-flex items-center gap-2 rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            {loading && <LoadingSpinner size="sm" />}
            Check Status
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
            />
            Auto-refresh every 5s
          </label>
        </div>
      </div>

      <StatusCard status={status} loading={loading} />

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
          <div className="space-y-2">
            {result.type === 'compress-image' ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">Compressed image</p>
                {typeof result.originalSizeBytes === 'number' && typeof result.compressedSizeBytes === 'number' && (
                  <div className="space-y-1 text-xs text-slate-300">
                    <p>
                      Original size:{' '}
                      <span className="font-mono">{(result.originalSizeBytes / 1024).toFixed(1)} KB</span>
                    </p>
                    <p>
                      Compressed size:{' '}
                      <span className="font-mono">{(result.compressedSizeBytes / 1024).toFixed(1)} KB</span>
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
                {status?.status === 'completed' && status.taskId && (
                  (() => {
                    const imageUrl = `${baseUrl}/image/${encodeURIComponent(status.taskId)}`;
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
  );
};
