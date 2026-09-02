import React, { useMemo, useState } from 'react';
import { FileStack, Scissors, Sparkles, Wand2, UploadCloud, Settings2, Download, MousePointerClick, Ban, Gauge } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { ToolCard } from '../components/ToolCard';
import { CategoryWidget } from '../components/CategoryWidget';
import { categories, tools, popularTools } from '../data/tools';

const steps = [
  {
    icon: UploadCloud,
    title: 'Drop your file',
    description: 'Pick a tool, then drag a file in or click to browse. Nothing to install.',
  },
  {
    icon: Settings2,
    title: 'We process it',
    description: 'Your file goes through a short processing queue — usually a few seconds.',
  },
  {
    icon: Download,
    title: 'Download the result',
    description: 'Grab the finished file straight from the browser. That\u2019s it.',
  },
];

const reasons = [
  {
    icon: MousePointerClick,
    title: 'No signup',
    description: 'No account, no email, no password to lose. Use a tool and go.',
  },
  {
    icon: Ban,
    title: 'No software',
    description: 'Runs entirely in the browser tab you already have open.',
  },
  {
    icon: Gauge,
    title: 'Free, no catch',
    description: 'Every tool here is free to use, with no premium tier hiding basic features.',
  },
];

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
      <section className="relative overflow-hidden pb-8 pt-10">
        {/* Soft accent glow + faint scattered category icons - purely decorative,
            gives the hero some depth without competing with the copy or search. */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent opacity-[0.08] blur-3xl"
          aria-hidden="true"
        />
        <Scissors
          className="pointer-events-none absolute right-6 top-2 -rotate-12 text-accent opacity-[0.07]"
          size={64}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <Wand2
          className="pointer-events-none absolute right-40 top-24 rotate-12 text-convert opacity-[0.07]"
          size={44}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <FileStack
          className="pointer-events-none absolute right-16 top-40 -rotate-6 text-stamp opacity-[0.07]"
          size={50}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <Sparkles
          className="pointer-events-none absolute right-64 top-4 rotate-6 text-ocr opacity-[0.07]"
          size={36}
          strokeWidth={1.5}
          aria-hidden="true"
        />

        <div className="relative">
          <span className="mb-5 inline-block rounded-[4px] bg-accent-bg px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-accent-ink">
            Everyday file tools
          </span>
          <h1 className="mb-4 max-w-xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Drop a file.
            <br />
            Get it done.
          </h1>
          <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted">
            Compress, convert, and fix the everyday files that get in your way — no signup, no software, no
            nonsense.
          </p>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder='Search tools — try "compress" or "passport photo"'
          />
        </div>
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

          <section className="mb-16">
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

          <section className="mb-16 border-t border-line pt-14">
            <h2 className="mb-8 font-display text-sm font-semibold uppercase tracking-wide text-ink">
              How it works
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[8px] bg-accent-bg text-accent-ink">
                    <step.icon size={19} strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div className="mb-1.5 flex items-baseline gap-2">
                    <span className="font-mono text-xs text-muted">0{index + 1}</span>
                    <h3 className="font-display text-base font-semibold text-ink">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[10px] border border-line bg-panel px-6 py-10 sm:px-10">
            <h2 className="mb-8 font-display text-sm font-semibold uppercase tracking-wide text-ink">
              Why toolslip
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {reasons.map((reason) => (
                <div key={reason.title} className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-panel-2 text-ink">
                    <reason.icon size={17} strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-display text-sm font-semibold text-ink">{reason.title}</h3>
                    <p className="text-[13px] leading-relaxed text-muted">{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
