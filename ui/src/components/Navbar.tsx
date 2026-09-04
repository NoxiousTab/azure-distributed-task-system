import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';

const linkClass = (isActive: boolean): string =>
  `relative py-1 transition-colors ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`;

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  // "Tools" covers the hub, category pages, and every individual tool page -
  // i.e. everything that isn't the About page - not just an exact "/" match,
  // so it stays highlighted while you're actually using the product.
  const isToolsActive = pathname !== '/about';
  const isAboutActive = pathname === '/about';

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
        <Logo />
        <nav className="flex items-center gap-7 text-sm font-medium">
          <Link to="/" className={linkClass(isToolsActive)}>
            Tools
            {isToolsActive && <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-accent" aria-hidden="true" />}
          </Link>
          <Link to="/about" className={linkClass(isAboutActive)}>
            About
            {isAboutActive && <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-accent" aria-hidden="true" />}
          </Link>
        </nav>
      </div>
    </header>
  );
};