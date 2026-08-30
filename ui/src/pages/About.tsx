import React from 'react';

export const AboutPage: React.FC = () => (
  <div className="max-w-xl pt-8">
    <h1 className="mb-4 font-display text-3xl font-bold tracking-tight text-ink">About toolslip</h1>
    <p className="mb-4 text-muted">
      toolslip is a small collection of tools for the file tasks that come up more often than they should —
      compressing a photo before you email it, converting a scan for a form, getting a document under an
      upload limit. Drop a file, get it back, move on.
    </p>
    <p className="text-muted">
      Everything runs through a queue-based processing pipeline behind the scenes, so larger jobs don&apos;t
      lock up the page while they run.
    </p>
  </div>
);
