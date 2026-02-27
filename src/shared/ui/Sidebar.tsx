import React from 'react';
import { User, View, UserPermission, Theme, formatCurrency } from '../../types';

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

// Restauração do Ícone Vetorial (Tampinha) para a Sidebar
export const LogoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="52" r="46" fill="black" fillOpacity="0.2" />
    <path d="M50 4L54.1 8.8L60.3 7.6L63.2 13.1L69.4 13.2L71.1 19.3L77 20.7L77.4 26.9L82.1 29.6L81.2 35.8L84.8 39.8L82.6 45.6L85 51.3L81.6 56.4L82.6 62.6L78.1 66.5L78.1 72.7L72.4 75.3L70.6 81.3L64.8 82.5L61.7 87.9L55.5 87.6L51.3 92.2L46 90.1L40.9 93.3L36.2 89.2L30.1 90.7L26.7 85.5L20.5 85.1L18.4 79.1L12.9 77.1L12.1 70.9L7.2 67.5L7.8 61.3L4 57.1L6.1 51.4L4 45.6L7.2 40.5L6 34.3L10.3 30.2L10.4 24L15.6 21.2L17.2 15.2L23 13.7L25.9 8.2L32.1 8.2L36 3L42.2 4.4L47.3 1.2L50 4Z" fill="#94a3b8" />
    <circle cx="50" cy="50" r="39" fill="#cbd5e1" />
    <circle cx="50" cy="50" r="36" fill="#b91c1c" />
    <circle cx="50" cy="50" r="36" fill="white" fillOpacity="0.05" />
    <path d="M38 32H54C58 32 61 34 61 38.5C61 41.5 59.5 43.5 57 44.5C60.5 45.5 62.5 48 62.5 52C62.5 57 59 60 54 60H38V32ZM46 38V44H53C54.5 44 55.5 43 55.5 41C55.5 39 54.5 38 53 38H46ZM46 49V55H54C55.5 55 56.5 54 56.5 52C56.5 50 55.5 49 54 49H46Z" fill="white" />
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  isOpen,
  onClose,
  currentUser,
  onLogout,
  activeTabsCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  
  const hasPermission = (perm: UserPermission) => {
    if (!currentUser) return false;
    if (currentUser.username === 'admin') return true;
    return currentUser.permissions.includes(perm);
  };

  const NavItem = ({ 
    view, 
    label, 
    icon, 
    perm,
    badge
  }: { 
    view: View, 
    label: string, 
    icon: React.ReactNode, 
    perm: UserPermission,
    badge?: number 
  }) => {
    if (!hasPermission(perm)) return null;
    
    const isActive = activeView === view;
    
    return (
      <button
        onClick={() => {
          onViewChange(view);
          if (window.innerWidth < 768) onClose();
        }}
        className={`group w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 relative
          ${isActive 
            ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        title={isCollapsed ? label : ''}
      >
        <div className={`w-6 h-6 flex items-center justify-center transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          {icon}
        </div>
        
        {!isCollapsed && (
          <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            {label}
          </span>
        )}

        {!isCollapsed && badge !== undefined && badge > 0 && (
          <span className="ml-auto bg-white text-red-600 px-2 py-0.5 rounded-md text-[9px] font-black shadow-sm">
            {badge}
          </span>
        )}
        
        {isCollapsed && badge !== undefined && badge > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border border-slate-900 rounded-full"></span>
        )}
      </button>
    );
  };

  const SectionTitle = ({ label }: { label: string }) => {
    if (isCollapsed) return <div className="h-px bg-slate-200 dark:bg-slate-800 my-4 mx-2"></div>;
    return (
      <h3 className="px-3 mb-3 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mt-6">
        {label}
      </h3>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      <aside
        className={`fixed md:absolute top-0 left-0 h-full bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800 z-[100] transition-all duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* 1. LOGO & TOGGLE - Layout corrigido com Position Absolute para evitar saltos */}
        <div className={`h-28 flex items-center shrink-0 relative transition-all duration-300 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
           <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'scale-90 mb-6' : ''}`}>
              <LogoIcon className="w-10 h-10 drop-shadow-lg shrink-0" />
              {!isCollapsed && (
                <span className="font-barrio text-2xl text-slate-900 dark:text-white tracking-tight animate-in fade-in duration-300">BOTEQUISTA</span>
              )}
           </div>
           
           <button 
             onClick={onToggleCollapse} 
             className={`hidden md:flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 absolute ${
                isCollapsed 
                  ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-8' 
                  : 'top-1/2 right-6 -translate-y-1/2'
             }`}
             title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
           >
             {isCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
             ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
             )}
           </button>
        </div>

        {/* SCROLL AREA */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar space-y-1">
          
          {/* 2. OPERAÇÃO */}
          <SectionTitle label="Operação" />
          <NavItem 
            view="pos" 
            label="Vendas" 
            perm="pos" 
            badge={activeTabsCount}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
          />
          <NavItem 
            view="shifts" 
            label="Turnos" 
            perm="shifts_admin" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
          />
          <NavItem 
            view="cash" 
            label="Caixa" 
            perm="cash_admin" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
          />

          {/* 3. GESTÃO */}
          <SectionTitle label="Gestão" />
          <NavItem 
            view="products" 
            label="Cardápio" 
            perm="products" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7" /></svg>} 
          />
          <NavItem 
            view="users" 
            label="Equipe" 
            perm="users_admin" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} 
          />
          <NavItem 
            view="settings" 
            label="Ajustes" 
            perm="settings" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} 
          />

          {/* 4. ANÁLISE */}
          <SectionTitle label="Análise" />
          <NavItem 
            view="dashboard" 
            label="Painel" 
            perm="dashboard" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>} 
          />
          <NavItem 
            view="history" 
            label="Histórico" 
            perm="history" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
          />
          <NavItem 
            view="reports" 
            label="Relatórios" 
            perm="reports" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
          />

        </nav>

        {/* 5. FIXO (Guia, Usuário, Sair) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] space-y-2">
            
            {/* Guia */}
            <NavItem 
              view="help" 
              label="Guia" 
              perm="help_view" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            />

            {/* User Profile */}
            {currentUser && (
              <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${isCollapsed ? 'justify-center' : ''}`}>
                 <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-red-900/20">
                    {currentUser.username.slice(0, 2).toUpperCase()}
                 </div>
                 {!isCollapsed && (
                    <div className="flex-1 min-w-0 overflow-hidden">
                       <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate">{currentUser.displayName}</p>
                       <p className="text-[8px] font-bold text-slate-500 uppercase truncate">@{currentUser.username}</p>
                    </div>
                 )}
              </div>
            )}

            {/* Sair (Simples trigger - O App lida com a confirmação) */}
            <button 
              onClick={onLogout}
              className={`group w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 ${isCollapsed ? 'justify-center' : ''}`}
            >
               <div className="w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
               </div>
               {!isCollapsed && (
                 <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white tracking-widest animate-in slide-in-from-left-2">Sair</span>
               )}
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;