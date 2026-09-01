import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropZoneProps {
  accept: string;
  label: string;
  hint?: string;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ accept, label, hint, onFileSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (disabled || !files || files.length === 0) return;
      onFileSelected(files[0]);
    },
    [disabled, onFileSelected],
  );

  return (
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
        handleFiles(event.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-16 text-center transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed border-line bg-panel opacity-60'
          : isDragging
            ? 'scale-[1.01] border-accent bg-accent-bg shadow-[0_0_0_6px_rgba(42,70,232,0.08)]'
            : 'border-line bg-panel hover:border-accent hover:bg-panel-2'
      }`}
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
          isDragging ? 'scale-110 bg-accent text-white' : 'animate-float-slow bg-accent-bg text-accent-ink'
        }`}
      >
        <UploadCloud size={24} strokeWidth={2} aria-hidden="true" />
      </div>
      <p className="mb-1 font-body text-[15px] font-medium text-ink">{label}</p>
      {hint && <p className="font-mono text-[12px] text-muted">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
        disabled={disabled}
      />
    </div>
  );
};
