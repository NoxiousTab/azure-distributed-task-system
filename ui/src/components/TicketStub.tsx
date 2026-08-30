import React from 'react';

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
  <div className="w-full max-w-sm overflow-hidden rounded-[10px] border border-line bg-panel">
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
        className="block w-full rounded-md bg-accent py-2.5 text-center font-body text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {downloadLabel}
      </a>
    </div>
  </div>
);
