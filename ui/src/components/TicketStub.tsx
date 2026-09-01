import React from 'react';
import { Download } from 'lucide-react';

interface TicketStubProps {
  filename: string;
  statLeft: string;
  statRight?: string;
  timestamp: string;
  downloadUrl: string;
  downloadLabel: string;
}

export const TicketStub: React.FC<TicketStubProps> = ({
  filename,
  statLeft,
  statRight,
  timestamp,
  downloadUrl,
  downloadLabel,
}) => (
  <div className="animate-stub-in w-full max-w-sm -rotate-[0.6deg] overflow-hidden rounded-[10px] border border-line bg-panel shadow-[0_2px_0_rgba(20,23,26,0.04),0_20px_36px_-18px_rgba(20,23,26,0.4)]">
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
      <div className="mb-3.5 flex items-center justify-between border-y border-dashed border-line py-2.5 font-mono text-[13px] text-ink">
        <span>{statLeft}</span>
        {statRight && <span className="text-accent-ink">{statRight}</span>}
      </div>
      <div className="mb-3.5 font-mono text-[11px] text-muted">completed {timestamp}</div>
      <a
        href={downloadUrl}
        download
        className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-center font-body text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(42,70,232,0.6)] transition-transform duration-150 hover:scale-[1.02] hover:opacity-95 active:scale-[0.99]"
      >
        <Download size={15} strokeWidth={2.3} aria-hidden="true" />
        {downloadLabel}
      </a>
    </div>
  </div>
);
