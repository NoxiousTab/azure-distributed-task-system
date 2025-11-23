import React, { useState } from 'react';
import { useLocalTasks } from '../hooks/useLocalTasks';
import { RecentTasksList } from '../components/RecentTasksList';
import { useTaskApi } from '../hooks/useTaskApi';
import { StatusCard } from '../components/StatusCard';
import type { TaskStatusResponseDto, TaskResultDto } from '../types/task';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const RecentTasksPage: React.FC = () => {
  const { tasks } = useLocalTasks();
  const { getStatus, getResult, baseUrl } = useTaskApi();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatusResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaskResultDto | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const handleSelectTask = async (taskId: string) => {
    setSelectedTaskId(taskId);
    try {
      setLoading(true);
      const s = await getStatus(taskId);
      setStatus(s);

      if (s.status === 'completed') {
        setLoadingResult(true);
        const r = await getResult(taskId);
        setResult(r);
      }
    } finally {
      setLoading(false);
      setLoadingResult(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h1 className="text-lg font-semibold text-slate-50">Recent Tasks</h1>
        <p className="text-sm text-slate-400">These are the last 10 task IDs you submitted from this browser.</p>
        <RecentTasksList tasks={tasks} onSelectTask={handleSelectTask} />
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Selected Task Status</h2>
        {selectedTaskId && (
          <p className="text-xs text-slate-400">
            Selected: <span className="font-mono text-slate-200">{selectedTaskId}</span>
          </p>
        )}
        <StatusCard status={status} loading={loading} />
        {loading && (
          <div className="pt-2 text-xs text-slate-400">
            <LoadingSpinner size="sm" /> Fetching status...
          </div>
        )}
        <div className="mt-3 space-y-2 rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200">
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
    </div>
  );
}
