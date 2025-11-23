import React, { useMemo, useState } from 'react';
import type { TaskType } from '../types/task';
import { useTaskApi } from '../hooks/useTaskApi';
import { useLocalTasks } from '../hooks/useLocalTasks';
import { LoadingSpinner } from './LoadingSpinner';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

interface TaskFormProps {
  onTaskSubmitted?: (taskId: string) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onTaskSubmitted }) => {
  const [taskType, setTaskType] = useState<TaskType>('summarize');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { submitTask, submitImageTask } = useTaskApi();
  const { addTask } = useLocalTasks();

  const requiresFile = useMemo(() => taskType === 'compress-image', [taskType]);

  const isValid = useMemo(() => {
    if (!taskType) return false;
    if (requiresFile) {
      return !!file;
    }
    return text.trim().length > 0;
  }, [file, requiresFile, taskType, text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (f.size > maxBytes) {
      toast.error('Maximum file size is 5MB');
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      setSubmitting(true);

      if (taskType === 'compress-image') {
        if (!file) {
          toast.error('Please select an image file.');
          return;
        }

        const formData = new FormData();
        formData.append('type', 'compress-image');
        formData.append('file', file);

        const response = await submitImageTask(formData);
        addTask(response.taskId, taskType);
        toast.success(`Image compression task submitted. ID: ${response.taskId}`);
        onTaskSubmitted?.(response.taskId);
        return;
      }

      const payloadText = text;

      const response = await submitTask({ type: taskType, text: payloadText });
      addTask(response.taskId, taskType);
      toast.success(`Task submitted. ID: ${response.taskId}`);
      onTaskSubmitted?.(response.taskId);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-200" htmlFor="taskType">
          Task type
        </label>
        <select
          id="taskType"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as TaskType)}
          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="summarize">Summarize Text</option>
          <option value="markdown-to-html">Convert Markdown</option>
          <option value="compress-image">Compress Image</option>
        </select>
      </div>

      {requiresFile ? (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-200" htmlFor="fileInput">
            Image file
          </label>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-200 file:mr-4 file:rounded file:border-0 file:bg-sky-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-600"
          />
          <p className="text-xs text-slate-400">Max size 5MB. JPEG and PNG are supported.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-200" htmlFor="taskText">
            Input text / markdown
          </label>
          <textarea
            id="taskText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            placeholder={
              taskType === 'summarize'
                ? 'Enter the text you want summarized...'
                : 'Enter markdown content to convert to HTML...'
            }
          />
          {text.trim().length === 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs text-rose-400">
              <AlertTriangle className="h-3 w-3" />
              Please provide input text.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Backend base URL: <code className="text-sky-400">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}</code>
        </div>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="inline-flex items-center gap-2 rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {submitting && <LoadingSpinner size="sm" />}
          <span>{submitting ? 'Submitting...' : 'Submit Task'}</span>
        </button>
      </div>
    </form>
  );
};
