
import React from 'react';
import { View, User, formatCurrency } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean; // Mobile open state
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

interface MenuItem {
  id: View;
  label: string;
  perm: string;
  icon: React.ReactNode;
}

const operationalItems: MenuItem[] = [
  { id: 'pos', label: 'Venda (PDV)', perm: 'pos', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { id: 'shifts', label: 'Turnos', perm: 'shifts_admin', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: 'cash', label: 'Tesouraria', perm: 'cash_admin', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

const managementItems: MenuItem[] = [
  { id: 'dashboard', label: 'Painel Geral', perm: 'dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { id: 'history', label: 'Histórico', perm: 'history', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { id: 'reports', label: 'Relatórios', perm: 'reports', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
];

const adminItems: MenuItem[] = [
  { id: 'products', label: 'Cardápio', perm: 'products', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M4 3h5.881L21.119 14.238a2 2 0 010 2.828l-4.053 4.053a2 2 0 01-2.828 0L3 9.882V4a1 1 0 011-1z" /></svg> },
  { id: 'users', label: 'Equipe', perm: 'users_admin', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { id: 'settings', label: 'Ajustes', perm: 'settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onClose, dbStatus, currentUser, onLogout, isShiftOpen, activeTabsCount, totalPendura, penduraThreshold, isCollapsed, onToggleCollapse }) => {
  const hasPerm = (perm: string) => currentUser?.username === 'admin' || currentUser?.id === 'admin' || currentUser?.permissions.includes(perm as any);

  const NavGroup = ({ title, items }: { title: string, items: MenuItem[] }) => {
    const visibleItems = items.filter(i => hasPerm(i.perm));
    if (visibleItems.length === 0) return null;
    
    return (
      <div className={`space-y-2 pt-4 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {!isCollapsed && <h3 className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>}
        <div className={`space-y-1 w-full ${isCollapsed ? 'px-2' : ''}`}>
          {visibleItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button 
                key={item.id} 
                title={isCollapsed ? item.label : ''} 
                onClick={() => { onViewChange(item.id); onClose(); }} 
                className={`w-full flex items-center transition-all group relative rounded-2xl ${isCollapsed ? 'justify-center p-4' : 'justify-between px-4 py-3'} ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                  <span className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-red-500'}`}>{item.icon}</span>
                  {!isCollapsed && <span className="text-[11px] uppercase font-black tracking-tight">{item.label}</span>}
                </div>
                
                {!isCollapsed ? (
                   <div className="flex items-center gap-1.5">
                      {item.id === 'pos' && activeTabsCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                          ({activeTabsCount})
                        </span>
                      )}
                      {item.id === 'shifts' && isShiftOpen && (
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isActive ? 'bg-white' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'}`}></div>
                      )}
                      {item.id === 'reports' && totalPendura >= penduraThreshold && (
                        <span title={`Fiados altos: ${formatCurrency(totalPendura)}`} className={`${isActive ? 'text-white' : 'text-orange-500'} animate-bounce`}>⚠️</span>
                      )}
                   </div>
                ) : (
                  <>
                    {item.id === 'pos' && activeTabsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">{activeTabsCount}</span>
                    )}
                    {item.id === 'shifts' && isShiftOpen && (
                      <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-pulse"></div>
                    )}
                    {item.id === 'reports' && totalPendura >= penduraThreshold && (
                      <span className="absolute bottom-1 right-1 text-[8px]">⚠️</span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300" onClick={onClose} />}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        
        <button 
          onClick={onToggleCollapse} 
          title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-md text-slate-400 hover:text-red-500 z-[60] transition-transform" 
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}
        >
           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className="p-6 flex-1 overflow-y-auto space-y-4 no-scrollbar overflow-x-hidden">
          <div className={`flex flex-col mb-8 ${isCollapsed ? 'items-center' : 'px-2'}`}>
             <div className="flex items-center gap-2">
                <img 
                  src="https://img.icons8.com/fluency/512/beer.png" 
                  alt="Logo" 
                  className={`transition-all shrink-0 object-contain drop-shadow-sm ${isCollapsed ? 'w-10 h-10' : 'w-9 h-9'}`} 
                />
                {!isCollapsed && (
                  <span className="font-normal text-slate-800 dark:text-white tracking-tighter leading-none font-barrio text-3xl whitespace-nowrap">
                    Botequista
                  </span>
                )}
             </div>
             {!isCollapsed && <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] mt-2 ml-11">Sincronizado</span>}
          </div>
          
          <NavGroup title="Operação" items={operationalItems} />
          <NavGroup title="Análise" items={managementItems} />
          <NavGroup title="Gestão" items={adminItems} />
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
           <div className={`p-4 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
             <button 
              onClick={() => { onViewChange('help'); onClose(); }} 
              title={isCollapsed ? "Guia de Operação" : "Abrir Manual"}
              className={`w-full flex items-center rounded-2xl transition-all ${isCollapsed ? 'justify-center p-4' : 'space-x-3 px-4 py-3'} ${activeView === 'help' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-red-500'}`}
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {!isCollapsed && <span className="text-[11px] uppercase font-black">Guia de Operação</span>}
             </button>
           </div>

           <div className={`p-4 border-t border-slate-100 dark:border-slate-800 ${isCollapsed ? 'flex justify-center' : ''}`}>
            <div className="flex items-center gap-3 p-1">
              <button 
                onClick={onLogout}
                title={isCollapsed ? `Sair (${currentUser?.displayName})` : "Encerrar Sessão"}
                className={`rounded-2xl bg-slate-900 dark:bg-red-600 flex items-center justify-center text-white font-black uppercase text-xs shadow-lg transition-all shrink-0 hover:scale-105 active:scale-95 w-10 h-10`}
              >
                {currentUser?.username.slice(0, 2).toUpperCase()}
              </button>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-800 dark:text-white truncate uppercase">{currentUser?.displayName}</p>
                  <button onClick={onLogout} className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors">Sair</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
