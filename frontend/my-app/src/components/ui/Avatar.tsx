import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  className?: string;
}

const colorVariants = [
  'bg-blue-600 text-white',
  'bg-teal-600 text-white',
  'bg-indigo-600 text-white',
  'bg-amber-600 text-white',
  'bg-emerald-600 text-white',
  'bg-rose-600 text-white',
];

function getColorClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colorVariants[Math.abs(hash) % colorVariants.length];
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl font-bold',
};

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', src, className = '' }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200 shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} ${getColorClass(name)} rounded-full flex items-center justify-center font-semibold shrink-0 shadow-xs border border-white/20 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};