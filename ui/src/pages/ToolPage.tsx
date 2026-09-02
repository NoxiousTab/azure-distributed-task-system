import React, { useCallback, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { MultiFileDropZone } from '../components/MultiFileDropZone';
import { TicketStub } from '../components/TicketStub';
import { TextResultCard } from '../components/TextResultCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ToolConfigOptions } from '../components/ToolConfigOptions';
import { useTaskApi } from '../hooks/useTaskApi';
import { categories, getTool } from '../data/tools';
import { toFriendlyError, type FriendlyError } from '../utils/errors';

type FlowState = 'idle' | 'configuring' | 'uploading' | 'processing' | 'done' | 'error';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ToolPage: React.FC = () => {
  const { categorySlug, toolSlug } = useParams<{ categorySlug: string; toolSlug: string }>();
  const tool = categorySlug && toolSlug ? getTool(categorySlug, toolSlug) : undefined;
  const category = categories.find((c) => c.slug === categorySlug);

  const { submitImageTask, submitPdfTask, submitMergeTask, getStatus, getResult, baseUrl } = useTaskApi();

  const [state, setState] = useState<FlowState>('idle');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [configOptionId, setConfigOptionId] = useState('');
  const [fileName, setFileName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [result, setResult] = useState<{
    taskId: string;
    outputSizeBytes: number;
    text?: string;
    confidence?: number;
  } | null>(null);
  const [error, setError] = useState<FriendlyError | null>(null);
  const pollCount = useRef(0);

  const reset = (): void => {
    setState('idle');
    setPendingFile(null);
    setResult(null);
    setError(null);
    pollCount.current = 0;
  };

  const pollStatus = useCallback(
    async (taskId: string) => {
      try {
        const status = await getStatus(taskId);
        if (status.status === 'completed') {
          const resultData = await getResult(taskId);
          if (tool?.resultKind === 'text') {
            setResult({
              taskId,
              outputSizeBytes: 0,
              text: resultData.text ?? '',
              confidence: resultData.confidence,
            });
          } else {
            setResult({
              taskId,
              outputSizeBytes: Number(resultData.compressedSizeBytes ?? 0),
            });
          }
          setState('done');
          return;
        }
        if (status.status === 'failed') {
          setError(toFriendlyError(status.errorMessage || ''));
          setState('error');
          return;
        }
        pollCount.current += 1;
        if (pollCount.current > MAX_POLLS) {
          setError({
            title: 'This is taking a while',
            message: 'Still working on it — try checking back again in a moment.',
          });
          setState('error');
          return;
        }
        setTimeout(() => {
          void pollStatus(taskId);
        }, POLL_INTERVAL_MS);
      } catch (err) {
        setError(toFriendlyError(err instanceof Error ? err.message : ''));
        setState('error');
      }
    },
    [getStatus, getResult, tool],
  );

  const submitFile = useCallback(
    async (file: File, currentTool: { id: string; uploadKind?: 'image' | 'pdf' }, compressionLevel?: string) => {
      setFileName(file.name);
      setOriginalSize(file.size);
      setState('uploading');
      setError(null);

      try {
        const formData = new FormData();
        formData.append('type', currentTool.id);
        formData.append('file', file);
        if (compressionLevel) {
          formData.append('compressionLevel', compressionLevel);
        }
        const submitFn = currentTool.uploadKind === 'pdf' ? submitPdfTask : submitImageTask;
        const response = await submitFn(formData);
        setState('processing');
        pollCount.current = 0;
        void pollStatus(response.taskId);
      } catch (err) {
        setError(toFriendlyError(err instanceof Error ? err.message : ''));
        setState('error');
      }
    },
    [submitImageTask, submitPdfTask, pollStatus],
  );

  const handleFileSelected = useCallback(
    (file: File) => {
      if (!tool) return;
      if (tool.configOptions && tool.configOptions.length > 0) {
        setPendingFile(file);
        setConfigOptionId(tool.defaultConfigOptionId ?? tool.configOptions[0].id);
        setState('configuring');
        return;
      }
      void submitFile(file, tool);
    },
    [tool, submitFile],
  );

  const handleConfirmConfig = useCallback(() => {
    if (!pendingFile || !tool) return;
    void submitFile(pendingFile, tool, configOptionId);
  }, [pendingFile, tool, configOptionId, submitFile]);

  const handleMergeSubmit = useCallback(
    async (files: File[]) => {
      setFileName(`${files.length} PDFs`);
      setOriginalSize(files.reduce((sum, f) => sum + f.size, 0));
      setState('uploading');
      setError(null);

      try {
        const formData = new FormData();
        formData.append('type', 'merge-pdf');
        files.forEach((file) => formData.append('files', file));
        const response = await submitMergeTask(formData);
        setState('processing');
        pollCount.current = 0;
        void pollStatus(response.taskId);
      } catch (err) {
        setError(toFriendlyError(err instanceof Error ? err.message : ''));
        setState('error');
      }
    },
    [submitMergeTask, pollStatus],
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
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:text-ink"
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

      {isLive && state === 'idle' && tool.multiFile && (
        <MultiFileDropZone
          accept={tool.accept!}
          hint={tool.acceptHint}
          submitLabel={(count) => `Merge ${count} file${count === 1 ? '' : 's'}`}
          onSubmit={(files) => {
            void handleMergeSubmit(files);
          }}
        />
      )}

      {isLive && state === 'idle' && !tool.multiFile && (
        <div className="max-w-xl">
          <DropZone
            accept={tool.accept!}
            label="Drop a file, or click to browse"
            hint={tool.acceptHint}
            onFileSelected={handleFileSelected}
          />
        </div>
      )}

      {isLive && state === 'configuring' && pendingFile && tool.configOptions && (
        <div className="max-w-xl rounded-[10px] border border-line bg-panel p-6">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-accent-bg text-accent-ink">
                <FileText size={16} strokeWidth={2.1} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-medium text-ink" title={pendingFile.name}>
                  {pendingFile.name}
                </p>
                <p className="font-mono text-[12px] text-muted">{formatFileSize(pendingFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:text-ink"
            >
              Change
            </button>
          </div>

          <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">Compression level</p>
          <ToolConfigOptions options={tool.configOptions} selectedId={configOptionId} onChange={setConfigOptionId} />

          <button
            type="button"
            onClick={handleConfirmConfig}
            className="mt-5 w-full rounded-md bg-accent py-2.5 font-body text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(42,70,232,0.6)] transition-transform duration-150 motion-reduce:transition-none hover:scale-[1.01] hover:opacity-95 active:scale-[0.99]"
          >
            {tool.name}
          </button>
        </div>
      )}

      {isLive && (state === 'uploading' || state === 'processing') && (
        <div className="flex max-w-xl flex-col items-center gap-3 rounded-[10px] border border-line bg-panel px-8 py-16 text-center">
          <LoadingSpinner size="md" />
          <p className="font-body text-sm text-muted">
            {state === 'uploading' ? 'Uploading…' : `Working on ${fileName}…`}
          </p>
        </div>
      )}

      {isLive && state === 'error' && error && (
        <div className="max-w-xl rounded-[10px] border border-line bg-panel p-8 text-center">
          <p className="mb-1 font-display text-base font-semibold text-ink">{error.title}</p>
          <p className="mb-4 text-sm text-muted">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-accent px-4 py-2 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Try again
          </button>
        </div>
      )}

      {isLive && state === 'done' && result && tool.resultKind === 'text' && (
        <div className="flex flex-col items-start gap-4">
          <TextResultCard
            filename={fileName}
            text={result.text ?? ''}
            confidence={result.confidence}
            downloadLabel={tool.downloadLabel ?? 'Download .txt'}
          />
          <button
            type="button"
            onClick={reset}
            className="font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:text-ink"
          >
            Do another
          </button>
        </div>
      )}

      {isLive && state === 'done' && result && tool.resultKind !== 'text' && (
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
            className="font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:text-ink"
          >
            Do another
          </button>
        </div>
      )}
    </div>
  );
};