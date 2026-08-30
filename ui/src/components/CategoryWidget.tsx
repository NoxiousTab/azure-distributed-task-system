import React from 'react';
import { Link } from 'react-router-dom';
import type { CategoryDefinition, ToolDefinition } from '../data/tools';

interface CategoryWidgetProps {
  category: CategoryDefinition;
  tools: ToolDefinition[];
}

const MAX_PREVIEW = 4;

export const CategoryWidget: React.FC<CategoryWidgetProps> = ({ category, tools }) => {
  const preview = tools.slice(0, MAX_PREVIEW);

  return (
    <div className="rounded-[10px] border border-line bg-panel p-5">
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold text-ink">{category.name}</h3>
        <p className="mt-0.5 text-[13px] text-muted">{category.description}</p>
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
