import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  variant = 'pills',
  fullWidth = true,
  className = '',
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-x-auto no-scrollbar ${fullWidth ? 'w-full' : ''} ${className}`.trim()}>
        {items.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-200 flex items-center justify-center gap-2 select-none ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md shadow-slate-900/10 dark:shadow-none'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  isActive ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant
  return (
    <div className={`flex items-center border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar ${fullWidth ? 'w-full' : ''} ${className}`.trim()}>
      {items.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={`px-5 py-3 font-black uppercase text-xs tracking-widest border-b-2 transition-all duration-200 flex items-center gap-2 select-none ${
              isActive
                ? 'border-red-600 text-red-600 dark:text-red-500 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                isActive ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
