import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crop, FileDown, FileImage, Image, Layers, RefreshCw, ScanText } from 'lucide-react';
import type { ToolDefinition } from '../data/tools';

export const TOOL_ICONS: Record<string, React.ElementType> = {
  'compress-image': Image,
  'compress-pdf': FileDown,
  'heic-to-jpg': RefreshCw,
  'image-to-pdf': FileImage,
  'merge-pdf': Layers,
  'passport-photo': Crop,
  'image-to-text': ScanText,
};

const CATEGORY_CHIP_CLASSES: Record<string, string> = {
  compress: 'bg-accent-bg text-accent-ink',
  convert: 'bg-convert-bg text-convert',
  documents: 'bg-stamp-bg text-stamp',
  ocr: 'bg-ocr-bg text-ocr',
};

export const ToolCard: React.FC<{ tool: ToolDefinition }> = ({ tool }) => {
  const Icon = TOOL_ICONS[tool.id] ?? Image;
  const chipClass = CATEGORY_CHIP_CLASSES[tool.categorySlug] ?? 'bg-accent-bg text-accent-ink';

  return (
    <Link
      to={`/${tool.categorySlug}/${tool.slug}`}
      className="group block rounded-[10px] border border-line bg-panel p-[18px] shadow-[0_1px_2px_rgba(20,23,26,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-[0_12px_24px_-12px_rgba(20,23,26,0.25)]"
    >
      <div
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-[8px] transition-transform duration-200 group-hover:scale-110 ${chipClass}`}
      >
        <Icon size={17} strokeWidth={2.1} aria-hidden="true" />
      </div>
      <h3 className="mb-1.5 font-display text-[17px] font-semibold tracking-tight text-ink">{tool.name}</h3>
      <p className="mb-3.5 text-[13.5px] leading-snug text-muted">{tool.tagline}</p>
      <div className="flex items-center justify-between">
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
        <ArrowRight
          size={15}
          strokeWidth={2.2}
          className="text-muted transition-all duration-200 motion-reduce:transition-none group-hover:translate-x-0.5 group-hover:text-accent-ink"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
};