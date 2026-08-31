import React from 'react';
import { Unit, Theme } from '../../types';
import Badge from './Badge';
import Button from './Button';

interface AppHeaderProps {
  setIsSidebarOpen: (open: boolean) => void;
  activeUnitName: string;
  visibleUnits: Unit[];
  handleSwitchUnit: () => void;
  setStatusModalOpen: (open: boolean) => void;
  dbStatus: string;
  serverHealth: string;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setFeedbackOpen: (open: boolean) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  setIsSidebarOpen,
  activeUnitName,
  visibleUnits,
  handleSwitchUnit,
  setStatusModalOpen,
  dbStatus,
  serverHealth,
  theme,
  setTheme,
  setFeedbackOpen
}) => {
  const isOnline = dbStatus === 'success' && serverHealth === 'ok';
  const isPending = dbStatus === 'loading';
  const statusVariant = isOnline ? 'success' : isPending ? 'warning' : 'danger';
  const statusLabel = isOnline ? 'SINCRONIZADO' : dbStatus === 'success' ? 'ERRO API' : isPending ? 'PENDENTE' : 'OFFLINE';

  return (
    <header className="shrink-0 flex justify-between items-center bg-white dark:bg-slate-900/80 p-3 md:p-6 mx-0 md:mx-10 mt-0 md:mt-8 rounded-none md:rounded-[32px] border-b md:border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-xl z-40">
      <div className="flex items-center gap-3 md:gap-4">
        <Button
          onClick={() => setIsSidebarOpen(true)}
          variant="secondary"
          size="xs"
          rounded="xl"
          className="md:hidden !p-2.5"
          aria-label="Abrir menu lateral"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-3xl font-barrio text-slate-900 dark:text-white leading-none uppercase tracking-tight">Botequista</h2>
              <Badge variant="primary" size="sm" dot className="md:hidden animate-pulse">
                {activeUnitName}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 md:mt-1.5">
              <button
                onClick={visibleUnits.length > 1 ? handleSwitchUnit : undefined}
                className={`bg-red-600 ${visibleUnits.length > 1 ? 'hover:bg-red-700 cursor-pointer' : 'cursor-default'} text-white px-2.5 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 active:scale-95 transition-all`}
                aria-label={visibleUnits.length > 1 ? "Trocar unidade do bar" : `Unidade atual: ${activeUnitName}`}
              >
                {activeUnitName}
                {visibleUnits.length > 1 && (
                  <svg className="w-2.5 h-2.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                )}
              </button>
              {visibleUnits.length > 1 && (
                <Button 
                  onClick={handleSwitchUnit} 
                  variant="secondary"
                  size="xs"
                  rounded="lg"
                  className="hidden md:inline-flex"
                  aria-label="Trocar unidade do bar"
                >
                  Trocar Unidade
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-5">
        <button
          onClick={() => setStatusModalOpen(true)}
          className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 transition-all hover:scale-[1.02]"
          aria-label="Ver status de sincronização e rede"
        >
          <div className="hidden sm:flex flex-col items-end">
            <Badge variant={statusVariant} size="sm" dot={isOnline}>
              {statusLabel}
            </Badge>
          </div>
          <div className="relative flex items-center justify-center sm:hidden">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-red-500'} ${isPending ? 'animate-ping' : ''}`} />
          </div>
        </button>

        <div className="flex gap-1.5 md:gap-2 border-l border-slate-100 dark:border-slate-800 pl-2 md:pl-5">
          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="ghost"
            size="xs"
            rounded="xl"
            className="!p-2.5 text-slate-500 dark:text-slate-400 hover:text-red-500"
            aria-label={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" strokeWidth={2.5} />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeWidth={2.5} />
              </svg>
            )}
          </Button>

          <Button
            onClick={() => setFeedbackOpen(true)}
            variant="ghost"
            size="xs"
            rounded="xl"
            className="!p-2.5 text-slate-500 dark:text-slate-400 hover:text-blue-500"
            aria-label="Enviar feedback ou reportar erro"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </Button>
        </div>
      </div>
    </header>
  );
};
