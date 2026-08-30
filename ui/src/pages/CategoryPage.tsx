import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ToolCard } from '../components/ToolCard';
import { categories, tools } from '../data/tools';

export const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const category = categories.find((c) => c.slug === categorySlug);

  if (!category) {
    return <Navigate to="/" replace />;
  }

  const categoryTools = tools.filter((tool) => tool.categorySlug === category.slug);

  return (
    <div className="pt-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
      >
        <ArrowLeft size={13} aria-hidden="true" /> All tools
      </Link>
      <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-ink">{category.name}</h1>
      <p className="mb-8 max-w-lg text-muted">{category.description}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categoryTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
};
