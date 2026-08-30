import React from 'react';
import { Link } from 'react-router-dom';
import type { ToolDefinition } from '../data/tools';

export const ToolCard: React.FC<{ tool: ToolDefinition }> = ({ tool }) => (
  <Link
    to={`/${tool.categorySlug}/${tool.slug}`}
    className="group block rounded-[10px] border border-line bg-panel p-[18px] transition-all hover:-translate-y-0.5 hover:border-accent"
  >
    <h3 className="mb-1.5 font-display text-[17px] font-semibold tracking-tight text-ink">{tool.name}</h3>
    <p className="mb-3.5 text-[13.5px] leading-snug text-muted">{tool.tagline}</p>
    {tool.status === 'live' ? (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-accent-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Available now
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-line" />
        Coming soon
      </span>
    )}
  </Link>
);
