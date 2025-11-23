import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-sky-400 border-t-transparent ${dims}`} />
    </div>
  );
};
