import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => (
  <div className="group flex max-w-md items-center gap-2.5 rounded-lg border border-line bg-panel px-4 py-3 transition-all duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgba(42,70,232,0.1)]">
    <Search size={16} className="shrink-0 text-muted transition-colors group-focus-within:text-accent" aria-hidden="true" />
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder ?? 'Search tools'}
      aria-label="Search tools"
      className="w-full bg-transparent font-body text-[15px] text-ink placeholder:text-muted focus:outline-none"
    />
  </div>
);
