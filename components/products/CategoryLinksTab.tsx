
import React from 'react';
import { ModifierGroup } from '../../types';

interface CategoryLinksTabProps {
  categories: string[];
  categoryModifiers: Record<string, string>;
  modifierGroups: ModifierGroup[];
  setCategoryModifiers: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
}

const CategoryLinksTab: React.FC<CategoryLinksTabProps> = ({
  categories,
  categoryModifiers,
  modifierGroups,
  setCategoryModifiers
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
         <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Vínculos por Categoria</h3>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure o sistema para abrir menus de opções sozinhos em certas categorias</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {categories.map(cat => (
            <div key={cat} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
               <span className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">{cat}</span>
               <select 
                  value={categoryModifiers[cat] || ''} 
                  onChange={e => {
                    const val = e.target.value;
                    setCategoryModifiers(prev => ({ ...prev, [cat]: val }));
                  }}
                  className="flex-1 w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] tracking-widest border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-red-500 transition-all"
               >
                  <option value="">NENHUM VÍNCULO ATIVO</option>
                  {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
               </select>
            </div>
         ))}
      </div>
    </div>
  );
};

export default CategoryLinksTab;
