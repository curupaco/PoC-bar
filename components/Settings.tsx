
import React, { useState, useEffect } from 'react';
import { Product, Sale, Tab, User, Shift, Unit, sanitizeCurrencyInput, parseCurrencyValue } from '../types';
import SystemDocs from './settings/SystemDocs';
import UnitManagement from './UnitManagement';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'warning';
}

interface SettingsProps {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  users: User[];
  shifts: Shift[];
  units?: Unit[];
  onUpdateUnits?: (u: Unit[]) => void;
  onImport: (data: any) => void;
  dbStatus: 'idle' | 'loading' | 'pending' | 'success' | 'error' | 'offline';
  currentUser: User;
  penduraThreshold: number;
  setPenduraThreshold: (v: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  products, sales, openTabs, users, shifts, units, onUpdateUnits,
  onImport, currentUser,
  penduraThreshold, setPenduraThreshold
}) => {
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [thresholdInput, setThresholdInput] = useState(() => penduraThreshold.toFixed(2).replace('.', ','));
  const [showUnitManager, setShowUnitManager] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  useEffect(() => {
    setThresholdInput(penduraThreshold.toFixed(2).replace('.', ','));
  }, [penduraThreshold]);

  const canReset = currentUser.username === 'admin' || currentUser.permissions.includes('full_reset');
  const canManageUnits = currentUser.username === 'admin' || currentUser.permissions.includes('manage_units');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const requestConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  const handleThresholdChange = (val: string) => {
    const sanitized = sanitizeCurrencyInput(val);
    setThresholdInput(sanitized);
    const numeric = parseCurrencyValue(sanitized);
    setPenduraThreshold(numeric);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
           {toast.msg}
        </div>
      )}

      {/* CENTRAL DE DOCUMENTAÇÃO MODULARIZADA */}
      <SystemDocs showToast={showToast} />
      
      {/* GESTÃO DE FRANQUIA (MULTI-BAR) */}
      {canManageUnits && units && onUpdateUnits && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-indigo-200 dark:border-indigo-900/30 shadow-xl space-y-6">
           <div className="flex items-center gap-4 text-indigo-600">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Gestão de Franquia</h3>
           </div>
           <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
              <div>
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Unidades Ativas</p>
                 <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{units.filter(u => u.isActive).length} <span className="text-xs text-slate-400 font-bold">de {units.length} cadastradas</span></p>
              </div>
              <button onClick={() => setShowUnitManager(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30">
                 Gerenciar Bares
              </button>
           </div>
        </div>
      )}

      {showUnitManager && units && onUpdateUnits && (
         <UnitManagement units={units} onUpdateUnits={onUpdateUnits} onClose={() => setShowUnitManager(false)} />
      )}

      {/* REGRAS DE NEGÓCIO */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-xl space-y-6">
        <div className="flex items-center gap-4 text-orange-600">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter">Regras de Negócio</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Limite de Alerta de Pendura (R$)</label>
              <div className="relative">
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                 <input 
                    type="text" 
                    inputMode="decimal"
                    value={thresholdInput} 
                    onChange={e => handleThresholdChange(e.target.value)} 
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-orange-500 font-black text-2xl outline-none transition-all shadow-inner" 
                    placeholder="0,00"
                 />
              </div>
           </div>
        </div>
      </div>

      {/* MANUTENÇÃO */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
         <div className="flex items-center gap-4 text-slate-400">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Manutenção do Banco</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => {
                requestConfirm("Zerar Mesas?", "Isso apagará todos os itens consumidos nas mesas abertas.", () => {
                    onImport({ products, sales, users, shifts, openTabs: [] });
                    showToast("MESAS ZERADAS!");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                });
              }} 
              disabled={!canReset} 
              className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 text-amber-600 font-black uppercase text-[10px] tracking-widest border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 transition-all disabled:opacity-30 active:scale-95"
            >
              Zerar Mesas Abertas
            </button>
            <button 
              onClick={() => {
                requestConfirm("RESET TOTAL?", "O sistema voltará ao estado de fábrica. TODOS OS DADOS SERÃO PERDIDOS.", () => {
                    onImport({ products: [], sales: [], openTabs: [], shifts: [], users: [] });
                    showToast("SISTEMA REINICIADO!");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }, 'danger');
              }} 
              disabled={!canReset} 
              className="p-6 rounded-3xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg disabled:opacity-30 active:scale-95"
            >
              Reset Total de Fábrica
            </button>
         </div>
      </div>
      
      {/* MODAL CONFIRMAÇÃO */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-310 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase text-center mb-4 tracking-tighter">{confirmModal.title}</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-10 leading-relaxed">{confirmModal.message}</p>
             <div className="flex flex-col gap-3">
                <button onClick={confirmModal.onConfirm} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all ${confirmModal.type === 'danger' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-black'}`}>Confirmar</button>
                <button onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
