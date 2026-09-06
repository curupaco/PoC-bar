import React, { useState } from 'react';
import { Unit, generateUniqueId } from '../../types';

interface UnitManagementProps {
  units: Unit[];
  onUpdateUnits: (units: Unit[]) => void;
  onClose: () => void;
  activeUnitId?: string;
  franchiseId?: string;
}

const slugify = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^\w\s-]/g, "")
     .replace(/[\s_-]+/g, "-")
     .replace(/^-+|-+$/g, "");

const UnitManagement: React.FC<UnitManagementProps> = ({ units, onUpdateUnits, onClose, activeUnitId, franchiseId }) => {
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const slug = slugify(name);
    if (units.some(u => u.id === slug)) { alert("Já existe uma unidade com nome similar."); return; }
    const newUnit: Unit = { 
      id: slug, 
      name: name.trim(), 
      isActive: true, 
      createdAt: Date.now(),
      franchiseId: franchiseId
    };
    onUpdateUnits([...units, newUnit]);
    setName(''); setIsAdding(false);
  };

  const toggleStatus = (id: string) => {
    onUpdateUnits(units.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const toggleStock = (id: string) => {
    onUpdateUnits(units.map(u => u.id === id ? { ...u, useStock: !u.useStock } : u));
  };

  const startEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setEditName(unit.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    const updatedUnits = units.map(u => u.id === editingId ? { ...u, name: editName.trim() } : u);
    onUpdateUnits(updatedUnits);
    cancelEdit();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
           <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Gestão de Franquia</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adicione, edite ou remova bares da rede</p>
           </div>
           <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6 bg-white dark:bg-slate-900">
           {isAdding ? (
             <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-red-200 dark:border-red-900/30 animate-in slide-in-from-top-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Nova Unidade</label>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                   <input 
                     autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="EX: BAR DA PRAIA" 
                     className="flex-1 px-4 h-12 rounded-2xl bg-white dark:bg-slate-950 font-black uppercase text-sm border-2 border-transparent focus:border-red-500 outline-none"
                   />
                   <div className="flex items-center gap-2">
                     <button onClick={handleCreate} className="h-12 bg-red-600 hover:bg-red-700 text-white px-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center">Criar</button>
                     <button onClick={() => setIsAdding(false)} className="h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 px-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center">Cancelar</button>
                   </div>
                </div>
             </div>
           ) : (
             <button onClick={() => setIsAdding(true)} className="w-full bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-red-600/20 hover:border-red-600 transition-all border-dashed">
                + Adicionar Nova Unidade
             </button>
           )}

           <div className="grid grid-cols-1 gap-4">
              {units.map(unit => {
                 const isCurrent = unit.id === activeUnitId;
                 const isEditing = unit.id === editingId;

                 return (
                    <div key={unit.id} className={`p-6 rounded-3xl border flex flex-col sm:flex-row justify-between items-center gap-4 transition-all ${unit.isActive ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-900 opacity-60 border-transparent'} ${isCurrent ? 'ring-2 ring-red-500 shadow-xl' : ''}`}>
                        <div className="flex-1 w-full sm:w-auto">
                           <div className="flex items-center gap-2">
                              {isEditing ? (
                                 <div className="flex items-center gap-2 w-full">
                                    <input
                                       autoFocus
                                       value={editName}
                                       onChange={e => setEditName(e.target.value)}
                                       className="flex-1 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-red-500 font-black uppercase text-sm outline-none"
                                       onKeyDown={e => {
                                          if (e.key === 'Enter') saveEdit();
                                          if (e.key === 'Escape') cancelEdit();
                                       }}
                                    />
                                    <button onClick={saveEdit} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                    <button onClick={cancelEdit} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                 </div>
                              ) : (
                                 <>
                                    <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm sm:text-base">{unit.name}</h4>
                                    <button onClick={() => startEdit(unit)} className="text-slate-300 hover:text-blue-500 transition-colors p-1" title="Editar nome">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <a 
                                       href={`/menu/${slugify(unit.name)}?u=${unit.id}`} 
                                       target="_blank" 
                                       rel="noreferrer" 
                                       className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                                       title="Ver Cardápio Digital"
                                    >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                    {isCurrent && <span className="bg-red-600 text-white text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">Atual</span>}
                                 </>
                              )}
                           </div>
                           <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {unit.id}</p>
                        </div>
                       <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                          <button 
                            onClick={() => toggleStock(unit.id)}
                            className={`text-[9px] font-black uppercase px-4 py-2 rounded-full transition-all flex items-center gap-2 ${unit.useStock ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-400 border border-transparent'}`}
                          >
                             <span className={`w-1.5 h-1.5 rounded-full ${unit.useStock ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></span>
                             {unit.useStock ? 'Estoque Ativo' : 'Estoque Inativo'}
                          </button>

                          <button 
                            onClick={() => toggleStatus(unit.id)}
                            className={`text-[9px] font-black uppercase px-4 py-2 rounded-full transition-all ${unit.isActive ? 'bg-emerald-100 text-emerald-600 hover:bg-red-100 hover:text-red-600' : 'bg-slate-200 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'}`}
                          >
                             {unit.isActive ? 'Bar Ativo' : 'Bar Suspenso'}
                          </button>
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default UnitManagement;