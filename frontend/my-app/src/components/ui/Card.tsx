import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  flat?: boolean;
}

export const Card: React.FC<CardProps> = ({ hover, glass, flat, className = '', children, ...props }) => {
  const baseClasses = 'bg-white rounded-xl border border-slate-200 p-5 md:p-6 transition-all duration-200';
  const hoverClass = hover ? 'hover:shadow-md hover:border-slate-300' : 'shadow-sm';
  const flatClass = flat ? 'bg-slate-50 border-slate-200' : '';
  const glassClass = glass ? 'bg-white/80 backdrop-blur-md border-slate-200/80 shadow-sm' : '';

  return (
    <div className={`${baseClasses} ${glassClass || flatClass || hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

