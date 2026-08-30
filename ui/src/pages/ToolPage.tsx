import React, { useCallback, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { TicketStub } from '../components/TicketStub';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useTaskApi } from '../hooks/useTaskApi';
import { categories, getTool } from '../data/tools';

type FlowState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30;

export const ToolPage: React.FC = () => {
  const { categorySlug, toolSlug } = useParams<{ categorySlug: string; toolSlug: string }>();
  const tool = categorySlug && toolSlug ? getTool(categorySlug, toolSlug) : undefined;
  const category = categories.find((c) => c.slug === categorySlug);

  const { submitImageTask, getStatus, getResult, baseUrl } = useTaskApi();

  const [state, setState] = useState<FlowState>('idle');
  const [fileName, setFileName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [result, setResult] = useState<{ taskId: string; outputSizeBytes: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const pollCount = useRef(0);

  const reset = (): void => {
    setState('idle');
    setResult(null);
    setErrorMessage('');
    pollCount.current = 0;
  };

  const pollStatus = useCallback(
    async (taskId: string) => {
      try {
        const status = await getStatus(taskId);
        if (status.status === 'completed') {
          const resultData = await getResult(taskId);
          setResult({
            taskId,
            outputSizeBytes: Number(resultData.compressedSizeBytes ?? 0),
          });
          setState('done');
          return;
        }
        if (status.status === 'failed') {
          setErrorMessage(status.errorMessage || 'Something went wrong while processing this file.');
          setState('error');
          return;
        }
        pollCount.current += 1;
        if (pollCount.current > MAX_POLLS) {
          setErrorMessage('This is taking longer than expected. Try again in a moment.');
          setState('error');
          return;
        }
        setTimeout(() => {
          void pollStatus(taskId);
        }, POLL_INTERVAL_MS);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to check status.');
        setState('error');
      }
    },
    [getStatus, getResult],
  );

  const handleFile = useCallback(
    async (file: File, taskId: string) => {
      setFileName(file.name);
      setOriginalSize(file.size);
      setState('uploading');
      setErrorMessage('');

      try {
        const formData = new FormData();
        formData.append('type', taskId);
        formData.append('file', file);
        const response = await submitImageTask(formData);
        setState('processing');
        pollCount.current = 0;
        void pollStatus(response.taskId);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to submit file.');
        setState('error');
      }
    },
    [submitImageTask, pollStatus],
  );

  if (!category || !tool) {
    return <Navigate to="/" replace />;
  }

  const isLive = tool.status === 'live' && tool.accept && tool.resultKind;
  const downloadPrefix = tool.resultKind === 'pdf' ? 'pdf' : 'image';
  const downloadExtension = tool.resultKind === 'pdf' ? 'pdf' : 'jpg';

  const sizeChangeLabel = (before: number, after: number): string | undefined => {
    if (before <= 0) return undefined;
    const pctChange = (1 - after / before) * 100;
    if (pctChange >= 0) {
      return `saved ${pctChange.toFixed(0)}%`;
    }
    return `+${Math.abs(pctChange).toFixed(0)}% larger`;
  };

  return (
    <div className="pt-8">
      <Link
        to={`/category/${category.slug}`}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
      >
        <ArrowLeft size={13} aria-hidden="true" /> {category.name}
      </Link>
      <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-ink">{tool.name}</h1>
      <p className="mb-8 max-w-lg text-muted">{tool.tagline}</p>

      {!isLive && (
        <div className="max-w-xl rounded-[10px] border border-line bg-panel p-8 text-center">
          <p className="mb-1 font-display text-base font-semibold text-ink">Coming soon</p>
          <p className="text-sm text-muted">
            This tool isn&apos;t wired up yet — it&apos;ll work the same way as the tools already live once
            it&apos;s built.
          </p>
        </div>
      )}

      {isLive && state === 'idle' && (
        <div className="max-w-xl">
          <DropZone
            accept={tool.accept!}
            label={`Drop a file, or click to browse`}
            hint={tool.acceptHint}
            onFileSelected={(file) => {
              void handleFile(file, tool.id);
            }}
          />
        </div>
      )}

      {isLive && (state === 'uploading' || state === 'processing') && (
        <div className="flex max-w-xl flex-col items-center gap-3 rounded-[10px] border border-line bg-panel px-8 py-16 text-center">
          <LoadingSpinner size="md" />
          <p className="font-body text-sm text-muted">
            {state === 'uploading' ? 'Uploading your file…' : `Working on ${fileName}…`}
          </p>
        </div>
      )}

      {isLive && state === 'error' && (
        <div className="max-w-xl rounded-[10px] border border-line bg-panel p-8 text-center">
          <p className="mb-1 font-display text-base font-semibold text-ink">That didn&apos;t work</p>
          <p className="mb-4 text-sm text-muted">{errorMessage}</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-accent px-4 py-2 font-body text-sm font-semibold text-white hover:opacity-90"
          >
            Try again
          </button>
        </div>
      )}

      {isLive && state === 'done' && result && (
        <div className="flex flex-col items-start gap-4">
          <TicketStub
            filename={fileName}
            statLeft={`${(originalSize / 1024).toFixed(0)} KB → ${(result.outputSizeBytes / 1024).toFixed(0)} KB`}
            statRight={sizeChangeLabel(originalSize, result.outputSizeBytes)}
            timestamp={new Date().toLocaleTimeString()}
            downloadUrl={`${baseUrl}/${downloadPrefix}/${encodeURIComponent(result.taskId)}`}
            downloadLabel={tool.downloadLabel ?? `Download .${downloadExtension}`}
          />
          <button
            type="button"
            onClick={reset}
            className="font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
          >
            Do another file
          </button>
        </div>
      )}
    </div>
  );
};
