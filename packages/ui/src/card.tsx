import React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'subtle' | 'glow';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-900 border border-slate-800 rounded-2xl shadow-xl',
      glass:
        'bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-2xl relative overflow-hidden',
      subtle: 'bg-slate-900/50 border border-slate-800/50 rounded-xl',
      glow:
        'bg-slate-900/90 border border-emerald-500/30 rounded-2xl shadow-xl shadow-emerald-950/30',
    };

    return (
      <div ref={ref} className={cn(variants[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
