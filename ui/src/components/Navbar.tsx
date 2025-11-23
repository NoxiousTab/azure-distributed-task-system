import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Cpu, FileText, History, Home, Info, Moon, SunMedium } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const activeClass = 'text-sky-400 border-b-2 border-sky-500';
  const baseClass = 'flex items-center gap-1 px-2 py-1 text-sm text-slate-300 hover:text-white';

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-sky-400">
          <Cpu className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-wide">Azure Task Processing</span>
        </Link>
        <nav className="flex items-center gap-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}
          >
            <Home className="h-4 w-4" /> Home
          </NavLink>
          <NavLink
            to="/submit"
            className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}
          >
            <FileText className="h-4 w-4" /> Submit
          </NavLink>
          <NavLink
            to="/status"
            className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}
          >
            <Cpu className="h-4 w-4" /> Status
          </NavLink>
          <NavLink
            to="/recent"
            className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}
          >
            <History className="h-4 w-4" /> Recent
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}
          >
            <Info className="h-4 w-4" /> About
          </NavLink>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
};
