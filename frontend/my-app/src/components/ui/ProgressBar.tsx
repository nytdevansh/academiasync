import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'default' | 'gold' | 'emerald' | 'rose' | 'teal' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const variantGradients = {
  default: 'bg-blue-600',
  blue: 'bg-blue-600',
  teal: 'bg-teal-600',
  gold: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  className = '',
}) => {
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          {label && <span className="text-slate-600">{label}</span>}
          {showLabel && <span className="text-slate-500 ml-auto font-semibold">{Math.round(value)}%</span>}
        </div>
      )}
      <div className={`w-full ${heightClass} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${variantGradients[variant] || variantGradients.default}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};