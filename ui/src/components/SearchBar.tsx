import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => (
  <div className="flex max-w-md items-center gap-2.5 rounded-lg border border-line bg-panel px-4 py-3">
    <Search size={16} className="shrink-0 text-muted" aria-hidden="true" />
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
