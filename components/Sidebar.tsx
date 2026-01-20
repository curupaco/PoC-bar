
import React, { useState } from 'react';
import { View, User, Theme } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  dbStatus: 'idle' | 'loading' | 'pending' | 'success' | 'error' | 'offline';
  isOnline: boolean;
  currentUser: User | null;
  onLogout: () => void;
  isShiftOpen: boolean;
  activeTabsCount: number;
  totalPendura: number;
  penduraThreshold: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme?: Theme;
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
  isCollapsed, 
  onToggleCollapse,
  totalPendura,
  penduraThreshold
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    <div className={`absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-[9999] shadow-2xl border invisible group-hover:visible translate-x-2 group-hover:translate-x-0 bg-slate-900 border-slate-700 text-white text-[10px] font-black uppercase tracking-widest`}>
      {text}
      <div className={`absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900`}></div>
    </div>
  );

  return (
    <>
      {/* MODAL DE CONFIRMAÇÃO DE LOGOUT CUSTOMIZADO */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setShowLogoutConfirm(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-[610] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             </div>
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 tracking-tighter leading-tight italic">Encerrar Sessão?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed px-2">
               As mesas abertas e o turno ativo continuarão salvos com total segurança na nuvem.
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={() => { onLogout(); setShowLogoutConfirm(false); }} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Sair Agora</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[90] md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 flex flex-col z-[100] transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl`}>
        <button onClick={onToggleCollapse} className={`hidden md:flex absolute -right-3 top-20 w-6 h-6 border rounded-full items-center justify-center shadow-md z-[110] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400`}>
           <svg className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className={`p-6 flex-1 space-y-8 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto no-scrollbar'}`}>
          <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
             <img src="https://img.icons8.com/fluency/512/beer.png" alt="Logo" className="w-10 h-10 object-contain" />
             {!isCollapsed && <span className={`font-normal tracking-tighter leading-none text-slate-800 dark:text-white font-barrio text-3xl`}>Botequista</span>}
          </div>
          
          <div className="space-y-8">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-2">
                {!isCollapsed && (
                  <h3 className={`text-[10px] font-black uppercase tracking-widest pl-4 mb-2 text-slate-400`}>{section.title}</h3>
                )}
                <div className="space-y-1">
                  {navItems
                    .filter(item => section.items.includes(item.id) && hasPerm(item.perm))
                    .map((item) => {
                      const isActive = activeView === item.id;
                      const isPosShiftClosed = item.id === 'pos' && !isShiftOpen;
                      const isReportsAlert = item.id === 'reports' && totalPendura > penduraThreshold;
                      
                      let activeClass = 'bg-red-600 text-white shadow-lg shadow-red-500/20';
                      let hoverClass = 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500';

                      return (
                        <div key={item.id} className="relative group">
                          <button onClick={() => { onViewChange(item.id); onClose(); }} className={`w-full flex items-center gap-3 transition-all rounded-2xl ${isCollapsed ? 'justify-center p-4' : 'px-4 py-3'} ${isActive ? activeClass : hoverClass}`}>
                            <div className="relative">
                              <span className={isActive ? 'text-inherit' : 'text-inherit opacity-60'}>{item.icon}</span>
                              {item.id === 'pos' && (
                                <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${isShiftOpen ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                              )}
                              {isReportsAlert && (
                                <>
                                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping opacity-75`}></div>
                                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-orange-500`}></div>
                                </>
                              )}
                            </div>
                            {!isCollapsed && (
                              <div className="flex-1 flex items-center justify-between min-w-0">
                                <span className={`text-[11px] uppercase font-black tracking-tight truncate`}>{item.label}</span>
                                {item.id === 'pos' && activeTabsCount > 0 && (
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>{activeTabsCount}</span>
                                )}
                                {isReportsAlert && (
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                     ⚠️
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                          {isCollapsed && <Tooltip text={item.label + (isPosShiftClosed ? ' (Turno Fechado)' : '') + (isReportsAlert ? ' (Limite Pendura Excedido)' : '')} />}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-4 space-y-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50`}>
           <div className="relative group">
             <button onClick={() => { onViewChange('help'); onClose(); }} className={`w-full flex items-center gap-3 rounded-2xl transition-all ${isCollapsed ? 'justify-center p-4' : 'px-4 py-3'} ${activeView === 'help' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-red-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {!isCollapsed && <span className={`text-[11px] uppercase font-black`}>GUIA DO BAR</span>}
             </button>
             {isCollapsed && <Tooltip text="GUIA DO BAR" />}
           </div>
           <div className={`flex items-center gap-3 p-1 ${isCollapsed ? 'justify-center' : ''}`}>
             <button onClick={() => setShowLogoutConfirm(true)} className={`flex items-center justify-center text-white font-black uppercase text-xs w-10 h-10 shrink-0 shadow-md rounded-2xl bg-red-600`}>
               {currentUser?.username.slice(0, 2).toUpperCase()}
             </button>
             {!isCollapsed && (
               <div className="flex-1 min-w-0">
                 <p className={`text-[10px] font-black truncate uppercase leading-none mb-1 text-slate-800 dark:text-white`}>{currentUser?.displayName}</p>
                 <button onClick={() => setShowLogoutConfirm(true)} className={`text-[9px] font-black hover:opacity-100 opacity-60 uppercase tracking-widest leading-none text-red-500`}>SAIR</button>
               </div>
             )}
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
