import React from 'react';
import { Link } from 'react-router-dom';

export const Logo: React.FC = () => (
  <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink">
    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-accent">
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
        <rect y="0" width="12" height="2" rx="1" fill="#F2F3EC" />
        <rect y="4" width="12" height="2" rx="1" fill="#F2F3EC" />
        <rect y="8" width="7" height="2" rx="1" fill="#F2F3EC" />
      </svg>
    </span>
    toolslip
  </Link>
);
