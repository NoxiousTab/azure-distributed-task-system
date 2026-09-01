import React from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  isActive ? 'text-ink' : 'text-muted transition-colors hover:text-ink';

export const Navbar: React.FC = () => (
  <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur-md">
    <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-6">
      <Logo />
      <nav className="flex items-center gap-7 text-sm font-medium">
        <NavLink to="/" end className={linkClass}>
          Tools
        </NavLink>
        <NavLink to="/about" className={linkClass}>
          About
        </NavLink>
      </nav>
    </div>
  </header>
);
