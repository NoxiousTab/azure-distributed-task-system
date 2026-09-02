import React from 'react';
import type { ToolConfigOption } from '../data/tools';

interface ToolConfigOptionsProps {
  options: ToolConfigOption[];
  selectedId: string;
  onChange: (id: string) => void;
}

export const ToolConfigOptions: React.FC<ToolConfigOptionsProps> = ({ options, selectedId, onChange }) => (
  <div role="radiogroup" className="flex flex-col gap-2">
    {options.map((option) => {
      const isSelected = option.id === selectedId;
      return (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={isSelected}
          onClick={() => onChange(option.id)}
          className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors duration-150 motion-reduce:transition-none ${
            isSelected ? 'border-accent bg-accent-bg' : 'border-line bg-panel hover:border-ink/20'
          }`}
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
              isSelected ? 'border-accent' : 'border-line'
            }`}
            aria-hidden="true"
          >
            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
          </span>
          <span>
            <span className="block font-body text-sm font-medium text-ink">{option.label}</span>
            <span className="block text-[12.5px] text-muted">{option.description}</span>
          </span>
        </button>
      );
    })}
  </div>
);