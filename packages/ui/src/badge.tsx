import React from 'react';
import { cn } from './utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'slate' | 'red' | 'blue' | 'neutral' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'emerald',
  size = 'md',
  children,
  ...props
}) => {
  const variants: Record<string, string> = {
    emerald: 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50',
    amber: 'bg-amber-950/70 text-amber-300 border border-amber-700/50',
    warning: 'bg-amber-950/70 text-amber-300 border border-amber-700/50',
    slate: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    neutral: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    red: 'bg-red-950/70 text-red-300 border border-red-700/50',
    danger: 'bg-red-950/70 text-red-300 border border-red-700/50',
    blue: 'bg-sky-950/70 text-sky-300 border border-sky-700/50',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium tracking-wide',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
