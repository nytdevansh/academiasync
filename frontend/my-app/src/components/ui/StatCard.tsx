import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'cyan' | 'blue' | 'gold' | 'emerald' | 'rose' | 'violet' | 'teal';
  trend?: { value: number; label: string };
  subtitle?: string;
}

const colorStyles: Record<string, { bg: string; iconBg: string; text: string; bar: string }> = {
  blue: { bg: 'bg-white', iconBg: 'bg-blue-50 text-blue-600', text: 'text-slate-900', bar: 'bg-blue-600' },
  cyan: { bg: 'bg-white', iconBg: 'bg-sky-50 text-sky-600', text: 'text-slate-900', bar: 'bg-sky-500' },
  teal: { bg: 'bg-white', iconBg: 'bg-teal-50 text-teal-700', text: 'text-slate-900', bar: 'bg-teal-600' },
  gold: { bg: 'bg-white', iconBg: 'bg-amber-50 text-amber-600', text: 'text-slate-900', bar: 'bg-amber-500' },
  emerald: { bg: 'bg-white', iconBg: 'bg-emerald-50 text-emerald-600', text: 'text-slate-900', bar: 'bg-emerald-500' },
  rose: { bg: 'bg-white', iconBg: 'bg-rose-50 text-rose-600', text: 'text-slate-900', bar: 'bg-rose-500' },
  violet: { bg: 'bg-white', iconBg: 'bg-indigo-50 text-indigo-600', text: 'text-slate-900', bar: 'bg-indigo-500' },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = 'blue', trend, subtitle }) => {
  const scheme = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`relative bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${scheme.bar}`} />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${scheme.iconBg}`}>
          {icon}
        </div>
      </div>

      {subtitle && <div className="text-xs text-slate-500 mt-3">{subtitle}</div>}

      {trend && (
        <div className={`flex items-center gap-1.5 text-xs font-medium mt-3 ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend.value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  );
};