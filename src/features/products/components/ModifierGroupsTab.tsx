
import React from 'react';
import { ModifierGroup, formatCurrency } from '../../../types';

interface ModifierGroupsTabProps {
  modifierGroups: ModifierGroup[];
  onEdit: (group: ModifierGroup) => void;
  onDelete: (id: string, name: string) => void;
  onShowModal: () => void;
}

const ModifierGroupsTab: React.FC<ModifierGroupsTabProps> = ({
  modifierGroups,
  onEdit,
  onDelete,
  onShowModal
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Menus de Opções</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Crie adicionais e acompanhamentos dinâmicos</p>
        </div>
        <button onClick={onShowModal} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Novo Menu</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modifierGroups.map(group => (
          <div key={group.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
               <div>
                  <h4 className="font-black text-lg uppercase text-slate-800 dark:text-white leading-none">{group.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Destaque: {group.category || 'Geral'}</p>
               </div>
               <div className="flex gap-1">
                  <button onClick={() => onEdit(group)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                  <button onClick={() => onDelete(group.id, group.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
               </div>
            </div>
            <div className="space-y-2">
               {group.options.map((opt, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                     <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{opt.name}</span>
                     <span className="text-xs font-black text-red-600">{opt.price > 0 ? `+ ${formatCurrency(opt.price)}` : 'GRÁTIS'}</span>
                  </div>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModifierGroupsTab;
