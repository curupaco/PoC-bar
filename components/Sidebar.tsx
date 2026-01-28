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
  onSwitchUnit: () => void; 
  isShiftOpen: boolean;
  activeTabsCount: number;
  totalPendura: number;
  penduraThreshold: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme?: Theme;
}

const BottleCapIcon = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="52" r="46" fill="black" fillOpacity="0.1" />
    <path 
      d="M50 4L54.1 8.8L60.3 7.6L63.2 13.1L69.4 13.2L71.1 19.3L77 20.7L77.4 26.9L82.1 29.6L81.2 35.8L84.8 39.8L82.6 45.6L85 51.3L81.6 56.4L82.6 62.6L78.1 66.5L77.7 72.7L72.4 75.3L70.6 81.3L64.8 82.5L61.7 87.9L55.5 87.6L51.3 92.2L46 90.1L40.9 93.3L36.2 89.2L30.1 90.7L26.7 85.5L20.5 85.1L18.4 79.1L12.9 77.1L12.1 70.9L7.2 67.5L7.8 61.3L4 57.1L6.1 51.4L4 45.6L7.2 40.5L6 34.3L10.3 30.2L10.4 24L15.6 21.2L17.2 15.2L23 13.7L25.9 8.2L32.1 8.2L36 3L42.2 4.4L47.3 1.2L50 4Z" 
      fill="#94a3b8" 
    />
    <circle cx="50" cy="50" r="39" fill="#cbd5e1" />
    <circle cx="50" cy="50" r="36" fill="#b91c1c" />
    <circle cx="50" cy="50" r="36" fill="white" fillOpacity="0.05" />
    <path 
      d="M38 32H54C58 32 61 34 61 38.5C61 41.5 59.5 43.5 57 44.5C60.5 45.5 62.5 48 62.5 52C62.5 57 59 60 54 60H38V32ZM46 38V44H53C54.5 44 55.5 43 55.5 41C55.5 39 54.5 38 53 38H46ZM46 49V55H54C55.5 55 56.5 54 56.5 52C56.5 50 55.5 49 54 49H46Z" 
      fill="white" 
    />
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isOpen, 
  onClose, 
  currentUser, 
  onLogout, 
  onSwitchUnit,
  activeTabsCount, 
  isCollapsed, 
  onToggleCollapse,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const hasPerm = (perm: string) => currentUser?.username === 'admin' || currentUser?.permissions.includes(perm as any);

  const navItemClasses = (id: View) => `
    flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 relative group
    ${activeView === id 
      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 font-black' 
      : 'text-slate-400 hover:text-white font-bold'}
    ${isCollapsed ? 'justify-center px-0 mx-auto w-12' : ''}
  `;

  const SectionLabel = ({ label }: { label: string }) => {
    if (isCollapsed) return <div className="h-px bg-slate-800 mx-4 my-6 shrink-0" />;
    return <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-6 mb-4 mt-8 shrink-0">{label}</p>;
  };

  const renderItem = (id: View, label: string, perm: string, icon: React.ReactNode) => {
    if (!hasPerm(perm)) return null;
    return (
      <button key={id} onClick={() => { onViewChange(id); onClose(); }} className={navItemClasses(id)}>
        <div className="shrink-0">{icon}</div>
        
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-[11px] uppercase tracking-widest truncate mr-2">{label}</span>
            {id === 'pos' && activeTabsCount > 0 && (
              <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full shrink-0">
                {activeTabsCount}
              </span>
            )}
          </div>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 whitespace-nowrap shadow-2xl z-[100] w-max border border-slate-800">
            {label}
            {id === 'pos' && activeTabsCount > 0 && ` (${activeTabsCount})`}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 bg-slate-950/50 z-[60] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      
      <aside className={`fixed top-0 left-0 h-full bg-slate-900 dark:bg-slate-950 z-[70] transition-all duration-300 flex flex-col border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-20 md:overflow-visible' : 'w-64 overflow-hidden'}
      `}>
        <div className="p-4 flex items-center justify-between shrink-0">
          <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <BottleCapIcon className="w-full h-full" />
            </div>
            {!isCollapsed && (
              <h1 className="text-2xl font-barrio text-white uppercase tracking-tighter animate-in fade-in slide-in-from-left-2">Botequista</h1>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={onToggleCollapse} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="px-3 mb-4">
            <button onClick={onToggleCollapse} className="w-full h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
          </div>
        )}

        <nav className={`flex-1 flex flex-col gap-1 px-3 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto no-scrollbar'}`}>
          <SectionLabel label="Operação" />
          {renderItem('pos', 'Vendas', 'pos', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth={2.5}/></svg>)}
          {renderItem('shifts', 'Turnos', 'shifts_admin', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5}/></svg>)}
          {renderItem('cash', 'Caixa', 'cash_admin', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5}/></svg>)}
          
          <SectionLabel label="Análise" />
          {renderItem('dashboard', 'Painel', 'dashboard', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" strokeWidth={2.5}/></svg>)}
          {renderItem('history', 'Histórico', 'history', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5}/></svg>)}
          {renderItem('reports', 'Relatórios', 'reports', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2.5}/></svg>)}
          
          <SectionLabel label="Gestão" />
          {renderItem('products', 'Cardápio', 'products', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" strokeWidth={2.5}/></svg>)}
          {renderItem('users', 'Equipe', 'users_admin', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" strokeWidth={2.5} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M23 21v-2a4 4 0 0 0-3-3.87" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>)}
          {renderItem('settings', 'Ajustes', 'settings', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth={2.5}/><circle cx="12" cy="12" r="3" strokeWidth={2.5}/></svg>)}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2 shrink-0 bg-slate-900/50 dark:bg-slate-950/50">
          {/* 1. GUIA */}
          {renderItem('help', 'Guia', 'help_view', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth={2.5}/></svg>)}
          
          {/* 2. USUÁRIO LOGADO */}
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 my-2 animate-in fade-in zoom-in-95">
               <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-black text-[10px] text-white shrink-0 uppercase">
                  {currentUser?.displayName?.slice(0, 2) || '??'}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter leading-none">{currentUser?.displayName}</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-widest truncate">@{currentUser?.username}</p>
               </div>
            </div>
          ) : (
            <div className="flex justify-center my-4 group relative">
               <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-black text-[10px] text-white shrink-0 uppercase shadow-lg">
                  {currentUser?.displayName?.slice(0, 2) || '??'}
               </div>
               <div className="absolute left-full ml-4 px-3 py-2 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 whitespace-nowrap shadow-2xl z-[100] border border-slate-800">
                  Perfil: @{currentUser?.username}
               </div>
            </div>
          )}

          {/* 3. TROCAR BAR */}
          <button onClick={onSwitchUnit} className={`w-full flex items-center gap-4 px-6 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all group relative ${isCollapsed ? 'justify-center px-0 mx-auto w-12' : ''}`}>
             <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
             {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Trocar Bar</span>}
             {isCollapsed && (
               <div className="absolute left-full ml-4 px-3 py-2 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 whitespace-nowrap shadow-2xl z-[100] w-max border border-slate-800">
                 Trocar Bar
               </div>
             )}
          </button>

          {/* 4. SAIR */}
          <button onClick={() => setShowLogoutConfirm(true)} className={`w-full flex items-center gap-4 px-6 py-3 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all group relative ${isCollapsed ? 'justify-center px-0 mx-auto w-12' : ''}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 whitespace-nowrap shadow-2xl z-[100] w-max border border-red-700/50">
                Sair
              </div>
            )}
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-110 text-center border border-slate-200 dark:border-slate-800">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Encerrar Sessão?</h3>
             <div className="flex flex-col gap-3">
                <button onClick={onLogout} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">Sair do Bar</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Ficar</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;