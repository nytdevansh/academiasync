import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'violet' | 'orange' | 'blue' | 'teal' | 'gold';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  blue: 'bg-sky-50 text-sky-800 border-sky-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  violet: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  gold: 'bg-amber-50 text-amber-800 border-amber-300',
  muted: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'muted', children, icon, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant] || variantStyles.muted} ${className}`}>
    {icon && <span className="shrink-0">{icon}</span>}
    {children}
  </span>
);