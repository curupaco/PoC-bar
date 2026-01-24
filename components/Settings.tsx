
import React, { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const canManageBackup = currentUser.username === 'admin' || currentUser.permissions.includes('manage_backup');
  const canManageUnits = currentUser.username === 'admin' || currentUser.permissions.includes('manage_units');
  
  const unitId = 'principal';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const requestConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json) {
           onImport(json);
           showToast("BACKUP RESTAURADO!");
        }
      } catch (err) {
        showToast("ARQUIVO INVÁLIDO", "error");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRescueLocal = () => {
    const mirror = localStorage.getItem(`btq_mirror_${unitId}`);
    if (mirror) {
       const data = JSON.parse(mirror);
       onImport(data);
       showToast("DADOS LOCAIS RESGATADOS!");
    } else {
       showToast("NENHUM BACKUP LOCAL ENCONTRADO", "error");
    }
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

      {/* SEGURANÇA MÁXIMA - CHECK DE PERMISSÃO DE BACKUP */}
      {canManageBackup ? (
        <>
          <div className="bg-red-600 p-8 rounded-[40px] shadow-2xl border-4 border-red-500 flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
             <div className="text-white text-center md:text-left">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Proteja seu Bar</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-90 mt-2">Baixe uma cópia dos dados para o seu computador agora</p>
             </div>
             <button 
                onClick={() => onImport('EXPORT_NOW')}
                className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
             >
                Baixar Backup Completo
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-600 p-8 rounded-[40px] shadow-xl border border-emerald-400 flex flex-col gap-4">
                 <h4 className="text-lg font-black text-white uppercase italic">Restaurar Arquivo</h4>
                 <p className="text-[10px] text-white/80 font-bold uppercase leading-relaxed">Subir arquivo .json salvo anteriormente</p>
                 <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                 <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white text-emerald-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Selecionar .json</button>
              </div>
              
              <div className="bg-blue-600 p-8 rounded-[40px] shadow-xl border border-blue-400 flex flex-col gap-4">
                 <h4 className="text-lg font-black text-white uppercase italic">Resgate Local</h4>
                 <p className="text-[10px] text-white/80 font-bold uppercase leading-relaxed">Tenta recuperar dados da última sessão deste navegador</p>
                 <button onClick={handleRescueLocal} className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-auto">Resgatar Mirror</button>
              </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center opacity-60">
           <p className="text-[10px] font-black uppercase text-slate-400">Opções de Backup restritas ao Administrador ou Gerente autorizado.</p>
        </div>
      )}

      {/* GESTÃO DE FRANQUIA - BOTÃO DE ACESSO */}
      {canManageUnits && (
        <div className="bg-indigo-600 p-8 rounded-[40px] shadow-xl border border-indigo-400 flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
           <div className="text-white text-center md:text-left">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Gestão de Rede & Franquia</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-90 mt-2">Adicionar, remover ou suspender unidades (Bares)</p>
           </div>
           <button 
              onClick={() => setShowUnitManager(true)}
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
           >
              Gerenciar Unidades
           </button>
        </div>
      )}

      <SystemDocs showToast={showToast} />
      
      {/* REGRAS DE NEGÓCIO */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-xl space-y-6">
        <div className="flex items-center gap-4 text-orange-600">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter">Configurações Gerais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Limite Alerta Pendura (R$)</label>
              <input 
                type="text" 
                value={thresholdInput} 
                onChange={e => handleThresholdChange(e.target.value)} 
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black text-xl border-none outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
           </div>
        </div>
      </div>

      {/* MANUTENÇÃO (REQUER FULL_RESET) */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
         <div className="flex items-center gap-4 text-slate-400">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Manutenção Crítica</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => {
                requestConfirm("Zerar Mesas?", "Isso apagará apenas as comandas abertas.", () => {
                    onImport({ products, sales, users, shifts, openTabs: [] });
                    showToast("MESAS ZERADAS!");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                });
              }} 
              disabled={!canReset} 
              className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 text-amber-600 font-black uppercase text-[10px] tracking-widest border border-amber-200 dark:border-amber-900/30 active:scale-95 transition-all disabled:opacity-50"
            >
              Limpar Mesas Abertas
            </button>
            <button 
              onClick={() => {
                requestConfirm("RESET TOTAL?", "O sistema voltará ao zero. TUDO SERÁ APAGADO DA NUVEM.", () => {
                    onImport({ products: [], sales: [], openTabs: [], shifts: [], users: [] });
                    showToast("SISTEMA RESETADO!");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }, 'danger');
              }} 
              disabled={!canReset} 
              className="p-6 rounded-3xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              Apagar Tudo (Nuvem)
            </button>
         </div>
      </div>
      
      {/* MODAL CONFIRMAÇÃO */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} />
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl relative z-310 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase text-center mb-4 tracking-tighter italic">{confirmModal.title}</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-10 leading-relaxed">{confirmModal.message}</p>
             <div className="flex flex-col gap-3">
                <button onClick={confirmModal.onConfirm} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all ${confirmModal.type === 'danger' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-black'}`}>Confirmar</button>
                <button onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL GESTÃO DE UNIDADES (Multi-tenant) */}
      {showUnitManager && units && onUpdateUnits && (
        <UnitManagement 
          units={units} 
          onUpdateUnits={onUpdateUnits} 
          activeUnitId={unitId}
          onClose={() => setShowUnitManager(false)} 
        />
      )}
    </div>
  );
};

export default Settings;
