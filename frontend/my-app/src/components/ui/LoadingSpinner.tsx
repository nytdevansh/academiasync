import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({ size = 'md', text }) => {
  const sizeClasses = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 gap-3 text-slate-500">
      <Loader2 className={`${sizeClasses} text-blue-600 animate-spin`} />
      {text && <span className="text-sm font-medium text-slate-600">{text}</span>}
    </div>
  );
};

export const InlineSpinner: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return <Loader2 className={`${sizeClasses} text-blue-600 animate-spin shrink-0`} />;
};