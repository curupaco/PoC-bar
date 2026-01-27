
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
  onSwitchUnit: () => void; // Nova Prop para troca de unidade
  isShiftOpen: boolean;
  activeTabsCount: number;
  totalPendura: number;
  penduraThreshold: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme?: Theme;
}

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
  totalPendura,
  penduraThreshold
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const hasPerm = (perm: string) => currentUser?.username === 'admin' || currentUser?.permissions.includes(perm as any);

  const navItemClasses = (id: View) => `
    flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 relative group
    ${activeView === id 
      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 font-black' 
      : 'text-slate-400 hover:text-white font-bold'}
    ${isCollapsed ? 'justify-center px-0' : ''}
  `;

  const SectionLabel = ({ label }: { label: string }) => {
    if (isCollapsed) return <div className="h-px bg-slate-800 mx-4 my-6" />;
    return <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-6 mb-4 mt-8">{label}</p>;
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
          <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">
            {label}
            {id === 'pos' && activeTabsCount > 0 && ` (${activeTabsCount})`}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[500] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <aside className={`
        fixed left-0 top-0 h-full bg-[#0f172a] dark:bg-[#020617] border-r border-slate-800 z-[600] transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Toggle Button na Borda */}
        <button 
          onClick={onToggleCollapse} 
          className="absolute -right-4 top-32 w-8 h-8 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center border border-slate-700 shadow-xl z-50 hover:text-white hidden md:flex"
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className={`p-8 flex items-center gap-3 shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
           <span className="text-3xl">🍺</span>
           {!isCollapsed && (
              <span className="text-2xl font-barrio text-white tracking-tighter uppercase">Botequista</span>
           )}
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-4">
           <SectionLabel label="OPERAÇÃO" />
           {renderItem('pos', 'VENDA', 'pos', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>)}
           {renderItem('shifts', 'TURNOS', 'shifts_admin', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
           {renderItem('cash', 'CAIXAS', 'cash_admin', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
           
           <SectionLabel label="ANÁLISE" />
           {renderItem('dashboard', 'PAINEL', 'dashboard', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>)}
           {renderItem('history', 'HISTÓRICO', 'history', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>)}
           {renderItem('reports', 'RELATÓRIOS', 'reports', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>)}
           
           <SectionLabel label="GESTÃO" />
           {renderItem('products', 'CARDÁPIO', 'products', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>)}
           {renderItem('users', 'EQUIPE', 'users_admin', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>)}
           {renderItem('settings', 'AJUSTES', 'settings', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>)}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
           {renderItem('help', 'GUIA', 'help_view', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
           
           {/* BOTÃO DE TROCA DE UNIDADE (MOBILE FRIENDLY) */}
           <button 
             onClick={() => { onSwitchUnit(); onClose(); }} 
             className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 relative group text-slate-400 hover:text-white hover:bg-slate-800/50 ${isCollapsed ? 'justify-center px-0' : ''}`}
           >
             <div className="shrink-0 text-red-500">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
             </div>
             {!isCollapsed && (
               <span className="text-[11px] uppercase tracking-widest truncate font-bold text-red-500">Trocar Bar</span>
             )}
             {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">
                   Trocar Unidade
                </div>
             )}
           </button>

           <div className={`flex items-center gap-4 px-4 py-4 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg">
                 {currentUser?.displayName.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black text-white uppercase truncate">{currentUser?.displayName || 'Administrador'}</p>
                   <button onClick={() => setShowLogoutConfirm(true)} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-400 mt-0.5">Sair</button>
                </div>
              )}
           </div>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-[1010] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Sair do Bar?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 font-medium">Você será desconectado com segurança.</p>
             <div className="flex flex-col gap-3">
                <button onClick={onLogout} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Confirmar Logout</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
