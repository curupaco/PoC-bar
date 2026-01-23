
import React, { useState } from 'react';
import { Unit, generateUniqueId } from '../types';

interface UnitManagementProps {
  units: Unit[];
  onUpdateUnits: (units: Unit[]) => void;
  onClose: () => void;
}

const UnitManagement: React.FC<UnitManagementProps> = ({ units, onUpdateUnits, onClose }) => {
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    
    // Gera ID amigável para URL (slug)
    const slug = name.toLowerCase().trim()
      .replace(/[áàãâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòõôö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '_');
    
    // Verifica duplicidade
    if (units.some(u => u.id === slug)) {
        alert("Já existe uma unidade com nome similar.");
        return;
    }

    const newUnit: Unit = {
      id: slug,
      name: name.trim(),
      isActive: true,
      createdAt: Date.now()
    };

    onUpdateUnits([...units, newUnit]);
    setName('');
    setIsAdding(false);
  };

  const toggleStatus = (id: string) => {
    onUpdateUnits(units.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
           <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Gestão de Franquia</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adicione ou remova bares da rede</p>
           </div>
           <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-all">✕</button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
           {isAdding ? (
             <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-red-200 dark:border-red-900/30 animate-in slide-in-from-top-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Nova Unidade</label>
                <div className="flex gap-4 mt-2">
                   <input 
                     autoFocus 
                     value={name} 
                     onChange={e => setName(e.target.value)} 
                     placeholder="EX: BAR DA PRAIA" 
                     className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 font-black uppercase text-sm border-2 border-transparent focus:border-red-500 outline-none"
                   />
                   <button onClick={handleCreate} className="bg-red-600 text-white px-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700">Criar</button>
                   <button onClick={() => setIsAdding(false)} className="text-slate-400 font-bold uppercase text-xs px-4">Cancelar</button>
                </div>
             </div>
           ) : (
             <button onClick={() => setIsAdding(true)} className="w-full bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-red-600/20 hover:border-red-600 transition-all border-dashed">
                + Adicionar Nova Unidade
             </button>
           )}

           <div className="grid grid-cols-1 gap-4">
              {units.map(unit => (
                 <div key={unit.id} className={`p-6 rounded-3xl border flex justify-between items-center transition-all ${unit.isActive ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-slate-100 dark:bg-slate-900 opacity-60 border-transparent'}`}>
                    <div>
                       <h4 className="font-black text-slate-800 dark:text-white uppercase">{unit.name}</h4>
                       <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {unit.id}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${unit.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                          {unit.isActive ? 'Ativo' : 'Suspenso'}
                       </span>
                       <button onClick={() => toggleStatus(unit.id)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title={unit.isActive ? "Suspender" : "Ativar"}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                       </button>
                    </div>
                 </div>
              ))}
              {units.length === 0 && <p className="text-center text-slate-400 font-bold text-xs uppercase opacity-50 py-10">Nenhuma unidade cadastrada.</p>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default UnitManagement;
