import React, { useMemo } from 'react';
import { Unit, Franchise } from '../../types';
import ConfirmationModal from '../../shared/ui/ConfirmationModal';

interface UnitSelectorProps {
  visibleUnits: Unit[];
  franchises?: Franchise[];
  onSelectUnit: (unitId: string) => void;
  requestLogout: () => void;
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
  };
  setConfirmModal: React.Dispatch<React.SetStateAction<any>>;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  visibleUnits,
  franchises = [],
  onSelectUnit,
  requestLogout,
  confirmModal,
  setConfirmModal
}) => {
  const groups = useMemo(() => {
    const map: Record<string, { name: string; units: Unit[] }> = {};
    
    // Inicializa grupos de franquias conhecidas (com check de array)
    if (Array.isArray(franchises)) {
      franchises.forEach(f => {
        if (f && f.id) map[f.id] = { name: f.name, units: [] };
      });
    }

    const independent: Unit[] = [];

    if (Array.isArray(visibleUnits)) {
      visibleUnits.forEach(u => {
        if (u && u.franchiseId && map[u.franchiseId]) {
          map[u.franchiseId].units.push(u);
        } else if (u) {
          independent.push(u);
        }
      });
    }

    return {
      franchises: Object.values(map).filter(g => g.units.length > 0),
      independent
    };
  }, [visibleUnits, franchises]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-4xl w-full animate-in fade-in zoom-in-95 py-20">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-12 text-center italic">Qual o Bar de hoje?</h2>
        
        <div className="space-y-12">
          {groups.franchises.map(group => (
            <div key={group.name} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{group.name}</h3>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.units.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => onSelectUnit(unit.id)}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 hover:shadow-2xl transition-all group text-left"
                  >
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unidade</span>
                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase group-hover:text-red-600 transition-colors leading-tight">{unit.name}</h4>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {groups.independent.length > 0 && (
            <div className="space-y-6">
              {groups.franchises.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Unidades Avulsas</h3>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.independent.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => onSelectUnit(unit.id)}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 hover:shadow-2xl transition-all group text-left"
                  >
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unidade</span>
                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase group-hover:text-red-600 transition-colors leading-tight">{unit.name}</h4>
                  </button>
                ))}
              </div>
            </div>
          )}

          {visibleUnits.length === 0 && (
            <div className="text-center py-20 bg-slate-100 dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-bold uppercase text-xs">Nenhuma unidade disponível para seu perfil.</p>
              <p className="text-slate-400 text-[10px] mt-2">Contate o administrador.</p>
            </div>
          )}
        </div>

        <button onClick={requestLogout} className="mt-16 w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors tracking-widest">Sair do Sistema</button>
      </div>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
      />
    </div>
  );
};
