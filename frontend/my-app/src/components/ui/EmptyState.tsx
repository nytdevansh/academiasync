import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'Nothing to display here yet.',
  icon,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs ${className}`}>
    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
      {icon || <Inbox className="w-8 h-8" />}
    </div>
    <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);