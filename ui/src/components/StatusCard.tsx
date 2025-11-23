import React from 'react';
import type { TaskStatusResponseDto } from '../types/task';
import { LoadingSpinner } from './LoadingSpinner';

interface StatusCardProps {
  status: TaskStatusResponseDto | null;
  loading: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({ status, loading }) => {
  const pillClass = (s: string) => {
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold';
    switch (s) {
      case 'pending':
        return `${base} bg-amber-500/20 text-amber-300`;
      case 'processing':
        return `${base} bg-sky-500/20 text-sky-300`;
      case 'completed':
        return `${base} bg-emerald-500/20 text-emerald-300`;
      case 'failed':
        return `${base} bg-rose-500/20 text-rose-300`;
      default:
        return `${base} bg-slate-700 text-slate-200`;
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <p className="mb-2 text-sm font-medium text-slate-200">Checking status...</p>
        <LoadingSpinner />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
        No status loaded yet. Submit a task or enter a task ID above.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Task ID</p>
          <p className="break-all text-sm text-slate-100">{status.taskId}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
          <span className={pillClass(status.status)}>{status.status}</span>
        </div>
      </div>
      {status.outputUrl && (
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Output Blob URL</p>
          <a
            href={status.outputUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-xs text-sky-400 hover:text-sky-300"
          >
            {status.outputUrl}
          </a>
        </div>
      )}
      {status.errorMessage && (
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">Error</p>
          <p className="text-xs text-rose-300">{status.errorMessage}</p>
        </div>
      )}
    </div>
  );
};
