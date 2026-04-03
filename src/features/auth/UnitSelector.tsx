import React from 'react';
import { Unit } from '../../types';
import ConfirmationModal from '../../shared/ui/ConfirmationModal';

interface UnitSelectorProps {
  visibleUnits: Unit[];
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
  onSelectUnit,
  requestLogout,
  confirmModal,
  setConfirmModal
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-2xl w-full animate-in fade-in zoom-in-95">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-10 text-center italic">Qual o Bar de hoje?</h2>
        {visibleUnits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {visibleUnits.map(unit => (
              <button
                key={unit.id}
                onClick={() => onSelectUnit(unit.id)}
                className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 hover:shadow-2xl transition-all group text-left"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unidade</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase group-hover:text-red-600 transition-colors">{unit.name}</h3>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-100 dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 font-bold uppercase text-xs">Nenhuma unidade disponível para seu perfil.</p>
            <p className="text-slate-400 text-[10px] mt-2">Contate o administrador.</p>
          </div>
        )}
        <button onClick={requestLogout} className="mt-12 w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors tracking-widest">Sair do Sistema</button>
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
