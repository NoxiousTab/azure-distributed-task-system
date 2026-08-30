import React, { useMemo, useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { ToolCard } from '../components/ToolCard';
import { CategoryWidget } from '../components/CategoryWidget';
import { categories, tools, popularTools } from '../data/tools';

export const Hub: React.FC = () => {
  const [query, setQuery] = useState('');

  const filteredTools = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return null;
    return tools.filter(
      (tool) => tool.name.toLowerCase().includes(trimmed) || tool.tagline.toLowerCase().includes(trimmed),
    );
  }, [query]);

  return (
    <div>
      <section className="pb-8 pt-10">
        <span className="mb-5 inline-block rounded-[4px] bg-accent-bg px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-accent-ink">
          Everyday file tools
        </span>
        <h1 className="mb-4 max-w-xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink">
          Drop a file. Get it done.
        </h1>
        <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted">
          Compress, convert, and fix the everyday files that get in your way — no signup, no software, no
          nonsense.
        </p>
        <SearchBar value={query} onChange={setQuery} placeholder='Search tools — try "compress" or "passport photo"' />
      </section>

      {filteredTools ? (
        <section>
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-ink">
            {filteredTools.length > 0 ? `${filteredTools.length} results` : 'No matches'}
          </h2>
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Try a different word, or browse everything below.</p>
          )}
        </section>
      ) : (
        <>
          <section className="mb-14">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink">Most used</h2>
              <span className="font-mono text-xs text-muted">the ones everyone ends up needing</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-ink">
              Browse by category
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categories.map((category) => (
                <CategoryWidget
                  key={category.slug}
                  category={category}
                  tools={tools.filter((tool) => tool.categorySlug === category.slug)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
