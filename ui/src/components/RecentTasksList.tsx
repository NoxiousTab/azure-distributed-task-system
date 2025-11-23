import React from 'react';
import type { LocalTaskRecord } from '../types/task';
import { Clock } from 'lucide-react';

interface RecentTasksListProps {
  tasks: LocalTaskRecord[];
  onSelectTask: (taskId: string) => void;
}

export const RecentTasksList: React.FC<RecentTasksListProps> = ({ tasks, onSelectTask }) => {
  if (!tasks.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
        No recent tasks yet. Submit a task to see it here.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li
          key={`${task.taskId}-${task.createdAt}`}
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm"
        >
          <div>
            <p className="break-all text-slate-100">{task.taskId}</p>
            <p className="mt-1 text-xs text-slate-400">
              <span className="mr-2 inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(task.createdAt).toLocaleString()}
              </span>
              <span className="uppercase text-sky-300">{task.type}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTask(task.taskId)}
            className="ml-4 rounded border border-sky-500 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/10"
          >
            Check Status
          </button>
        </li>
      ))}
    </ul>
  );
};
