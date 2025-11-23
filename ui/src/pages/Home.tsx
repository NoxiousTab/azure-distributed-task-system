import React from 'react';
import { Cpu, Network } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600/20 text-sky-400">
          <Cpu className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Azure Distributed Task Processing System</h1>
          <p className="text-sm text-slate-400">Local web console for submitting and tracking background tasks.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm font-semibold text-slate-100">What this console does</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Submit text-based tasks to the ASP.NET Core API.</li>
            <li>Tasks are queued into Azurite Queue Storage.</li>
            <li>Azure Functions worker processes tasks asynchronously.</li>
            <li>Results and metadata are stored in Azurite Blob Storage.</li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Network className="h-4 w-4" />
            Supported task types
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>
              <span className="font-semibold text-sky-300">Summarize Text</span> – sentence-aware heuristic summary.
            </li>
            <li>
              <span className="font-semibold text-sky-300">Convert Markdown</span> – simple Markdown to HTML converter.
            </li>
            <li>
              <span className="font-semibold text-slate-400">Compress Image</span> – planned, not yet wired to backend.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
