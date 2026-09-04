import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Settings2, Download, MousePointerClick, Ban, Gauge, ArrowRight, FileQuestion } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { ToolCard } from '../components/ToolCard';
import { CategoryWidget } from '../components/CategoryWidget';
import { DropZone } from '../components/DropZone';
import { TOOL_ICONS } from '../components/ToolCard';
import { categories, tools, popularTools, getToolsForFile, type ToolDefinition } from '../data/tools';

const steps = [
  {
    icon: UploadCloud,
    title: 'Drop your file',
    description: 'Drop it above and we\u2019ll route you to the right tool, or pick one from the grid below.',
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
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [pickerState, setPickerState] = useState<{ file: File; matches: ToolDefinition[] } | null>(null);
  const [unmatchedName, setUnmatchedName] = useState<string | null>(null);

  const filteredTools = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return null;
    return tools.filter(
      (tool) => tool.name.toLowerCase().includes(trimmed) || tool.tagline.toLowerCase().includes(trimmed),
    );
  }, [query]);

  const handleHeroFile = useCallback(
    (file: File) => {
      const matches = getToolsForFile(file.name);
      if (matches.length === 0) {
        setPickerState(null);
        setUnmatchedName(file.name);
        return;
      }
      setUnmatchedName(null);
      if (matches.length === 1) {
        navigate(`/${matches[0].categorySlug}/${matches[0].slug}`, { state: { file } });
        return;
      }
      setPickerState({ file, matches });
    },
    [navigate],
  );

  return (
    <div>
      <section className="grid grid-cols-1 items-center gap-10 pb-14 pt-10 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div>
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
          <p className="mb-2.5 font-mono text-xs uppercase tracking-wide text-muted">Or search by name</p>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder='Try "compress" or "passport photo"'
          />
        </div>

        <div>
          <DropZone
            accept="*/*"
            label="Drop any file"
            hint="We'll find the right tool for it"
            onFileSelected={handleHeroFile}
          />
          {pickerState && (
            <div className="mt-3 rounded-[10px] border border-line bg-panel p-3">
              <p className="mb-2 px-1 text-[13px] text-muted">
                What do you want to do with <span className="font-medium text-ink">{pickerState.file.name}</span>?
              </p>
              <div className="flex flex-col gap-1">
                {pickerState.matches.map((match) => {
                  const Icon = TOOL_ICONS[match.id] ?? FileQuestion;
                  return (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => navigate(`/${match.categorySlug}/${match.slug}`, { state: { file: pickerState.file } })}
                      className="group flex items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-panel-2"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-accent-bg text-accent-ink">
                        <Icon size={15} strokeWidth={2.1} aria-hidden="true" />
                      </span>
                      <span className="flex-1 font-body text-sm font-medium text-ink">{match.name}</span>
                      <ArrowRight
                        size={14}
                        className="text-muted transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {unmatchedName && (
            <p className="mt-3 px-1 text-[13px] text-muted">
              We don&apos;t have a tool for <span className="font-medium text-ink">{unmatchedName}</span> yet —
              browse everything below.
            </p>
          )}
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