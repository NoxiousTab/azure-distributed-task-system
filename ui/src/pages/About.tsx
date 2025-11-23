import React from 'react';
import { Cpu, Server } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

export const AboutPage: React.FC = () => {
  const baseUrl = getApiBaseUrl();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-50">About This System</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Cpu className="h-4 w-4" />
            Backend Architecture
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>.NET 8 ASP.NET Core Web API.</li>
            <li>Azure Functions (isolated worker) for background processing.</li>
            <li>Azurite local emulation for Blob and Queue Storage.</li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Server className="h-4 w-4" />
            API Configuration
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            The UI talks to the backend API at:
          </p>
          <p className="mt-1 font-mono text-xs text-sky-400">{baseUrl}</p>
          <p className="mt-2 text-xs text-slate-400">
            To change this, set <code className="text-sky-400">VITE_API_BASE_URL</code> in a
            <code className="text-sky-400">.env.local</code> file and restart the dev server.
          </p>
        </div>
      </div>
    </div>
  );
};
