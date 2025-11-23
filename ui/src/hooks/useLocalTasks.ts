import { useCallback, useEffect, useState } from 'react';
import type { LocalTaskRecord, TaskType } from '../types/task';

const STORAGE_KEY = 'adtps_recent_tasks_v1';
const MAX_TASKS = 10;

export const useLocalTasks = () => {
  const [tasks, setTasks] = useState<LocalTaskRecord[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LocalTaskRecord[];
      if (Array.isArray(parsed)) {
        setTasks(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const persist = useCallback((next: LocalTaskRecord[]) => {
    setTasks(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const addTask = useCallback(
    (taskId: string, type: TaskType) => {
      const now = new Date().toISOString();
      const record: LocalTaskRecord = { taskId, type, createdAt: now };
      persist([record, ...tasks].slice(0, MAX_TASKS));
    },
    [persist, tasks],
  );

  return { tasks, addTask };
};
