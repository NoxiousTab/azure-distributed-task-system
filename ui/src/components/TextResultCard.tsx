import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface TextResultCardProps {
  filename: string;
  text: string;
  confidence?: number;
  downloadLabel: string;
}

export const TextResultCard: React.FC<TextResultCardProps> = ({
  filename,
  text,
  confidence,
  downloadLabel,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can be unavailable (older browsers, non-secure context) -
      // the textarea below is still selectable/copyable by hand as a fallback.
    }
  };

  const handleDownload = (): void => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace(/\.[^.]+$/, '') + '.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-stub-in w-full max-w-xl -rotate-[0.4deg] overflow-hidden rounded-[10px] border border-line bg-panel shadow-[0_2px_0_rgba(20,23,26,0.04),0_20px_36px_-18px_rgba(20,23,26,0.4)]">
      <div
        className="h-3"
        style={{
          backgroundImage: 'radial-gradient(circle at 8px 6px, #F2F3EC 5px, transparent 5.5px)',
          backgroundSize: '16px 16px',
          backgroundRepeat: 'repeat-x',
        }}
        aria-hidden="true"
      />
      <div className="px-5 pb-5 pt-1.5">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <span className="truncate font-display text-[15px] font-semibold text-ink" title={filename}>
            {filename}
          </span>
          <span className="inline-block shrink-0 -rotate-3 rounded-[3px] border-[1.5px] border-stamp bg-stamp-bg px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-stamp">
            DONE
          </span>
        </div>

        {text.length === 0 ? (
          <p className="mb-3.5 rounded-md border border-dashed border-line bg-bg px-3 py-6 text-center text-sm text-muted">
            No text detected in that image.
          </p>
        ) : (
          <textarea
            readOnly
            value={text}
            className="mb-3.5 h-40 w-full resize-none rounded-md border border-line bg-bg px-3 py-2.5 font-mono text-[13px] leading-relaxed text-ink"
          />
        )}

        <div className="mb-3.5 flex items-center justify-between border-y border-dashed border-line py-2.5 font-mono text-[13px] text-ink">
          <span>{text.length.toLocaleString()} characters</span>
          {typeof confidence === 'number' && <span className="text-accent-ink">{confidence.toFixed(0)}% confidence</span>}
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={text.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-line bg-panel py-2.5 font-body text-sm font-semibold text-ink transition-colors hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check size={15} strokeWidth={2.3} aria-hidden="true" /> : <Copy size={15} strokeWidth={2.3} aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy text'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={text.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-accent py-2.5 font-body text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(42,70,232,0.6)] transition-transform duration-150 hover:scale-[1.02] hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <Download size={15} strokeWidth={2.3} aria-hidden="true" />
            {downloadLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
