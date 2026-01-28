import React from 'react';
import { User, View, Theme } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUnit: () => void;
  isShiftOpen: boolean;
  activeTabsCount: number;
  totalPendura: number;
  penduraThreshold: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dbStatus: string;
  isOnline: boolean;
  theme: Theme;
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
  onToggleCollapse,
  dbStatus,
  isOnline,
  theme
}) => {
  const hasPermission = (perm: string) => {
    if (!currentUser) return false;
    if (currentUser.username === 'admin') return true;
    return currentUser.permissions.includes(perm as any);
  };

  const SectionLabel = ({ label }: { label: string }) => {
    if (isCollapsed) return <div className="h-4"></div>;
    return (
      <div className="px-3 mt-6 mb-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
    );
  };

  const renderItem = (view: View, label: string, perm: string, icon: React.ReactNode) => {
    if (!hasPermission(perm)) return null;
    const isActive = activeView === view;
    return (
      <button
        onClick={() => { onViewChange(view); if(window.innerWidth < 768) onClose(); }}
        className={`group relative flex items-center w-full p-3 mb-1 rounded-[18px] transition-all duration-200 ${
          isActive 
            ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-red-600 hover:shadow-sm'
        }`}
      >
        <div className={`flex items-center justify-center w-6 h-6 transition-transform group-hover:scale-110 ${isCollapsed ? 'mx-auto' : ''}`}>
          {icon}
        </div>
        
        {!isCollapsed && (
          <span className="ml-3 text-[11px] font-black uppercase tracking-wide truncate">{label}</span>
        )}

        {/* Badges */}
        {view === 'pos' && activeTabsCount > 0 && !isCollapsed && (
          <span className="ml-auto bg-white text-red-600 text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">{activeTabsCount}</span>
        )}
        {view === 'pos' && activeTabsCount > 0 && isCollapsed && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></span>
        )}

        {view === 'reports' && totalPendura > penduraThreshold && !isCollapsed && (
           <span className="ml-auto text-[10px] animate-pulse">⚠️</span>
        )}
        {view === 'reports' && totalPendura > penduraThreshold && isCollapsed && (
           <span className="absolute top-0 right-1 text-[8px] animate-pulse">⚠️</span>
        )}

        {/* Tooltip for collapsed mode */}
        {isCollapsed && (
           <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
             {label}
           </div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside 
        className={`fixed md:fixed inset-y-0 left-0 z-[110] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 shrink-0">
           <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
             <div className="w-10 h-10 shrink-0 relative flex items-center justify-center">
                {/* Logo Tampinha Metálica (Correto) */}
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-md">
                  <circle cx="50" cy="52" r="46" fill="black" fillOpacity="0.1" />
                  <path d="M50 4L54.1 8.8L60.3 7.6L63.2 13.1L69.4 13.2L71.1 19.3L77 20.7L77.4 26.9L82.1 29.6L81.2 35.8L84.8 39.8L82.6 45.6L85 51.3L81.6 56.4L82.6 62.6L78.1 66.5L78.1 72.7L72.4 75.3L70.6 81.3L64.8 82.5L61.7 87.9L55.5 87.6L51.3 92.2L46 90.1L40.9 93.3L36.2 89.2L30.1 90.7L26.7 85.5L20.5 85.1L18.4 79.1L12.9 77.1L12.1 70.9L7.2 67.5L7.8 61.3L4 57.1L6.1 51.4L4 45.6L7.2 40.5L6 34.3L10.3 30.2L10.4 24L15.6 21.2L17.2 15.2L23 13.7L25.9 8.2L32.1 8.2L36 3L42.2 4.4L47.3 1.2L50 4Z" fill="#94a3b8" />
                  <circle cx="50" cy="50" r="39" fill="#cbd5e1" />
                  <circle cx="50" cy="50" r="36" fill="#b91c1c" />
                  <circle cx="50" cy="50" r="36" fill="white" fillOpacity="0.05" />
                  <path d="M38 32H54C58 32 61 34 61 38.5C61 41.5 59.5 43.5 57 44.5C60.5 45.5 62.5 48 62.5 52C62.5 57 59 60 54 60H38V32ZM46 38V44H53C54.5 44 55.5 43 55.5 41C55.5 39 54.5 38 53 38H46ZM46 49V55H54C55.5 55 56.5 54 56.5 52C56.5 50 55.5 49 54 49H46Z" fill="white" />
                </svg>
             </div>
             {!isCollapsed && (
               <span className="text-2xl font-barrio text-slate-900 dark:text-white tracking-tighter">BOTEQUISTA</span>
             )}
           </div>
           
           {!isCollapsed && (
             <button onClick={onToggleCollapse} className="hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
               </svg>
             </button>
           )}
        </div>

        {/* Collapsed Toggle Button (Floating) */}
        {isCollapsed && (
             <button onClick={onToggleCollapse} className="absolute top-8 -right-3 bg-slate-800 text-slate-400 p-1 rounded-full border border-slate-700 shadow-md z-50 hover:text-white hidden md:flex hover:bg-red-600 hover:border-red-600 transition-all">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7" /></svg>
             </button>
        )}

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-1 px-4 overflow-y-auto overflow-x-hidden custom-scrollbar py-4">
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
          {renderItem('settings', 'Ajustes', 'settings', (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ))}
        </nav>

        {/* Footer Group */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex flex-col gap-2">
           {renderItem('help', 'Guia', 'help_view', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>)}
           
           <div className={`mt-2 mb-2 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                 {currentUser?.username.slice(0, 2).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1 overflow-hidden">
                   <p className="text-xs font-black text-slate-800 dark:text-white uppercase truncate">{currentUser?.displayName}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">@{currentUser?.username}</p>
                </div>
              )}
           </div>

           {!isCollapsed && <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:border-red-200 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sair
           </button>}
           {isCollapsed && <button onClick={onLogout} className="w-full flex items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 hover:text-red-600 border border-slate-200 dark:border-slate-700 hover:border-red-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           </button>}
        </div>

      </aside>
    </>
  );
};

export default Sidebar;