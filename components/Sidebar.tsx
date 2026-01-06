
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pos', label: 'Venda (PDV)', icon: '🛒' },
    { id: 'products', label: 'Produtos', icon: '📦' },
    { id: 'history', label: 'Histórico', icon: '📜' },
    { id: 'reports', label: 'Relatórios', icon: '📈' },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
      flex flex-col z-50 transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-red-600 via-black to-red-700 rounded-lg flex items-center justify-center text-white text-lg shadow-lg border-2 border-red-500">
              💀
            </div>
            <span className="text-lg lg:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
              Botequista
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden text-slate-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id as View);
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === item.id
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="text-lg lg:text-xl">{item.icon}</span>
              <span className="text-sm lg:text-base">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-gradient-to-br from-red-600 to-black rounded-2xl p-4 text-white shadow-inner hidden md:block">
          <p className="text-[10px] font-medium opacity-80 mb-1">Status</p>
          <p className="text-xs font-bold flex items-center">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            Online
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
