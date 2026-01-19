
import React from 'react';
import { View, User } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  dbStatus: 'idle' | 'loading' | 'pending' | 'success' | 'error';
  isOnline: boolean;
  currentUser: User | null;
  onLogout: () => void;
  isShiftOpen: boolean;
  activeTabsCount: number;
  totalPendura: number;
  penduraThreshold: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: View;
  label: string;
  perm: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isOpen, 
  onClose, 
  currentUser, 
  onLogout, 
  isShiftOpen, 
  activeTabsCount, 
  totalPendura, 
  penduraThreshold, 
  isCollapsed, 
  onToggleCollapse
}) => {
  const hasPerm = (perm: string) => currentUser?.username === 'admin' || currentUser?.permissions.includes(perm as any);

  const navItems: NavItem[] = [
    { id: 'pos', label: 'VENDA (PDV)', perm: 'pos', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { id: 'shifts', label: 'TURNOS', perm: 'shifts_admin', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'cash', label: 'TESOURARIA', perm: 'cash_admin', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'dashboard', label: 'PAINEL GERAL', perm: 'dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'history', label: 'HISTÓRICO', perm: 'history', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'reports', label: 'RELATÓRIOS', perm: 'reports', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: 'products', label: 'CARDÁPIO', perm: 'products', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M4 3h5.881L21.119 14.238a2 2 0 010 2.828l-4.053 4.053a2 2 0 01-2.828 0L3 9.882V4a1 1 0 011-1z" /></svg> },
    { id: 'users', label: 'EQUIPE', perm: 'users_admin', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 'settings', label: 'AJUSTES', perm: 'settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  const menuSections = [
    { title: 'OPERAÇÃO', items: ['pos', 'shifts', 'cash'] },
    { title: 'ANÁLISE', items: ['dashboard', 'history', 'reports'] },
    { title: 'GESTÃO', items: ['products', 'users', 'settings'] }
  ];

  const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-[9999] shadow-2xl border border-slate-700 invisible group-hover:visible translate-x-2 group-hover:translate-x-0">
      {text}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900"></div>
    </div>
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[90] md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-[100] transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'w-20 overflow-visible' : 'w-64'}`}>
        <button onClick={onToggleCollapse} className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-md text-slate-400 z-[110]">
           <svg className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className={`p-6 flex-1 space-y-8 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto no-scrollbar'}`}>
          <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
             <img src="https://img.icons8.com/fluency/512/beer.png" alt="Logo" className="w-9 h-9 object-contain" />
             {!isCollapsed && <span className="font-normal text-slate-800 dark:text-white tracking-tighter leading-none font-barrio text-3xl">Botequista</span>}
          </div>
          
          <div className="space-y-8">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-2">
                {!isCollapsed && (
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 mb-2">{section.title}</h3>
                )}
                <div className="space-y-1">
                  {navItems
                    .filter(item => section.items.includes(item.id) && hasPerm(item.perm))
                    .map((item) => {
                      const isActive = activeView === item.id;
                      return (
                        <div key={item.id} className="relative group">
                          <button onClick={() => { onViewChange(item.id); onClose(); }} className={`w-full flex items-center gap-3 transition-all rounded-2xl ${isCollapsed ? 'justify-center p-4' : 'px-4 py-3'} ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                            {!isCollapsed && <span className="text-[11px] uppercase font-black tracking-tight">{item.label}</span>}
                            {!isCollapsed && item.id === 'pos' && activeTabsCount > 0 && (
                              <span className="ml-auto text-[9px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-lg">({activeTabsCount})</span>
                            )}
                            {item.id === 'shifts' && isShiftOpen && (
                              <span className={`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] ${isCollapsed ? 'absolute top-2 right-2' : 'ml-auto'}`}></span>
                            )}
                            {!isCollapsed && item.id === 'reports' && totalPendura >= penduraThreshold && <span className="ml-auto text-[10px] animate-bounce">⚠️</span>}
                          </button>
                          {isCollapsed && <Tooltip text={item.label} />}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 overflow-visible">
           <div className="relative group">
             <button onClick={() => { onViewChange('help'); onClose(); }} className={`w-full flex items-center gap-3 rounded-2xl transition-all ${isCollapsed ? 'justify-center p-4' : 'px-4 py-3'} ${activeView === 'help' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-red-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {!isCollapsed && <span className="text-[11px] uppercase font-black">GUIA DE OPERAÇÃO</span>}
             </button>
             {isCollapsed && <Tooltip text="GUIA DE OPERAÇÃO" />}
           </div>
           <div className={`flex items-center gap-3 p-1 ${isCollapsed ? 'justify-center' : ''}`}>
             <button onClick={onLogout} className="rounded-2xl bg-red-600 flex items-center justify-center text-white font-black uppercase text-xs w-10 h-10 shrink-0 shadow-md">
               {currentUser?.username.slice(0, 2).toUpperCase()}
             </button>
             {!isCollapsed && (
               <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-black text-slate-800 dark:text-white truncate uppercase leading-none mb-1">{currentUser?.displayName}</p>
                 <button onClick={onLogout} className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest leading-none">SAIR</button>
               </div>
             )}
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
