import React from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/tools';

export const Footer: React.FC = () => (
  <footer className="border-t border-line">
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-8 flex flex-col gap-8 sm:flex-row sm:justify-between">
        <div className="max-w-xs">
          <span className="font-display text-base font-bold tracking-tight text-ink">toolslip</span>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Built for the file tasks nobody wants to think about twice.
          </p>
        </div>
        <div className="flex gap-10">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted">Tools</p>
            <ul className="space-y-1.5">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="text-[13px] text-ink transition-colors hover:text-accent-ink"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted">Site</p>
            <ul className="space-y-1.5">
              <li>
                <Link to="/" className="text-[13px] text-ink transition-colors hover:text-accent-ink">
                  All tools
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[13px] text-ink transition-colors hover:text-accent-ink">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line pt-5 font-mono text-[11px] text-muted">
        no signup · no software · no nonsense
      </div>
    </div>
  </footer>
);
