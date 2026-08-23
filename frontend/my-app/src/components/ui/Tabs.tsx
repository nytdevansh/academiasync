import React, { useState } from 'react';

interface Tab { id: string; label: string; icon?: React.ReactNode; count?: number; }
interface TabsProps { tabs: Tab[]; defaultTab?: string; onTabChange?: (id: string) => void; className?: string; }

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, onTabChange, className = '' }) => {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  const handleClick = (id: string) => {
    setActive(id);
    onTabChange?.(id);
  };

  return (
    <div className={`flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200 w-fit max-w-full overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
            onClick={() => handleClick(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Controlled version
interface ControlledTabsProps { tabs: Tab[]; active: string; onChange: (id: string) => void; className?: string; }
export const ControlledTabs: React.FC<ControlledTabsProps> = ({ tabs, active, onChange, className = '' }) => (
  <div className={`flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200 w-fit max-w-full overflow-x-auto ${className}`}>
    {tabs.map((tab) => {
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer ${
            isActive
              ? 'bg-white text-blue-600 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);