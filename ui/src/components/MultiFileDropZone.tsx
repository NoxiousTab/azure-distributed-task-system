import React, { useCallback, useRef, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';

interface MultiFileDropZoneProps {
  accept: string;
  hint?: string;
  minFiles?: number;
  maxFiles?: number;
  submitLabel: (count: number) => string;
  onSubmit: (files: File[]) => void;
  disabled?: boolean;
}

export const MultiFileDropZone: React.FC<MultiFileDropZoneProps> = ({
  accept,
  hint,
  minFiles = 2,
  maxFiles = 10,
  submitLabel,
  onSubmit,
  disabled,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (disabled || !incoming) return;
      setFiles((prev) => [...prev, ...Array.from(incoming)].slice(0, maxFiles));
    },
    [disabled, maxFiles],
  );

  const removeFile = (index: number): void => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-xl">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 text-center transition-all duration-200 ${
          disabled
            ? 'cursor-not-allowed border-line bg-panel opacity-60'
            : isDragging
              ? 'scale-[1.01] border-accent bg-accent-bg shadow-[0_0_0_6px_rgba(42,70,232,0.08)]'
              : 'border-line bg-panel hover:border-accent hover:bg-panel-2'
        }`}
      >
        <div
          className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${
            isDragging ? 'scale-110 bg-accent text-white' : 'bg-accent-bg text-accent-ink'
          }`}
        >
          <UploadCloud size={22} strokeWidth={2} aria-hidden="true" />
        </div>
        <p className="mb-1 font-body text-[15px] font-medium text-ink">Drop files here, or click to add</p>
        {hint && <p className="font-mono text-[12px] text-muted">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(event) => addFiles(event.target.files)}
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink transition-colors hover:bg-panel-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText size={14} className="shrink-0 text-muted" aria-hidden="true" />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 shrink-0 text-muted hover:text-ink"
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={disabled || files.length < minFiles}
        onClick={() => onSubmit(files)}
        className="mt-4 w-full rounded-md bg-accent py-2.5 font-body text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(42,70,232,0.6)] transition-all duration-150 hover:scale-[1.01] hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
      >
        {files.length < minFiles ? `Add at least ${minFiles} files` : submitLabel(files.length)}
      </button>
    </div>
  );
};
