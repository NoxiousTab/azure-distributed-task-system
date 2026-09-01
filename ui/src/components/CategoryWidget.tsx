import React from 'react';
import { Link } from 'react-router-dom';
import { FileStack, Scissors, Sparkles, Wand2 } from 'lucide-react';
import type { CategoryDefinition, ToolDefinition } from '../data/tools';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  compress: Scissors,
  convert: Wand2,
  documents: FileStack,
  ocr: Sparkles,
};

const CATEGORY_CHIP_CLASSES: Record<string, string> = {
  compress: 'bg-accent-bg text-accent-ink',
  convert: 'bg-convert-bg text-convert',
  documents: 'bg-stamp-bg text-stamp',
  ocr: 'bg-ocr-bg text-ocr',
};

interface CategoryWidgetProps {
  category: CategoryDefinition;
  tools: ToolDefinition[];
}

const MAX_PREVIEW = 4;

export const CategoryWidget: React.FC<CategoryWidgetProps> = ({ category, tools }) => {
  const preview = tools.slice(0, MAX_PREVIEW);
  const Icon = CATEGORY_ICONS[category.slug] ?? Sparkles;
  const chipClass = CATEGORY_CHIP_CLASSES[category.slug] ?? 'bg-accent-bg text-accent-ink';

  return (
    <div className="rounded-[10px] border border-line bg-panel p-5 transition-shadow duration-200 hover:shadow-[0_12px_24px_-14px_rgba(20,23,26,0.2)]">
      <div className="mb-4 flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${chipClass}`}>
          <Icon size={17} strokeWidth={2.1} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-display text-base font-semibold text-ink">{category.name}</h3>
          <p className="mt-0.5 text-[13px] text-muted">{category.description}</p>
        </div>
      </div>
      <ul className="mb-4 space-y-1">
        {preview.map((tool) => (
          <li key={tool.id}>
            <Link
              to={`/${tool.categorySlug}/${tool.slug}`}
              className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-ink transition-colors hover:bg-panel-2"
            >
              <span>{tool.name}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${tool.status === 'live' ? 'bg-accent' : 'bg-line'}`} />
            </Link>
          </li>
        ))}
      </ul>
      <Link to={`/category/${category.slug}`} className="font-mono text-[12px] uppercase tracking-wide text-accent-ink hover:underline">
        View all {tools.length} tools →
      </Link>
    </div>
  );
};
