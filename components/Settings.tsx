
import React, { useState, useEffect } from 'react';
import { Product, Sale, Tab, User, Shift, sanitizeCurrencyInput, parseCurrencyValue } from '../types';

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
  onImport: (data: any) => void;
  dbStatus: 'idle' | 'loading' | 'pending' | 'success' | 'error';
  currentUser: User;
  penduraThreshold: number;
  setPenduraThreshold: (v: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  products, sales, openTabs, users, shifts,
  onImport, currentUser,
  penduraThreshold, setPenduraThreshold
}) => {
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [thresholdInput, setThresholdInput] = useState(() => penduraThreshold.toFixed(2).replace('.', ','));
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

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const requestConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  const handleResetTables = () => {
    if (!canReset) return;
    requestConfirm(
      "Zerar Mesas?", 
      "Isso apagará todos os itens consumidos nas mesas abertas agora. Esta ação não pode ser desfeita.",
      () => {
        onImport({ products, sales, users, shifts, openTabs: [] });
        showToast("MESAS ZERADAS!");
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    );
  };

  const handleResetProducts = () => {
    if (!canReset) return;
    requestConfirm(
      "Apagar Cardápio?", 
      "Você perderá todos os produtos cadastrados. Será necessário refazer todo o cardápio.",
      () => {
        onImport({ products: [], sales, users, shifts, openTabs });
        showToast("CARDÁPIO APAGADO!");
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    );
  };

  const handleResetSales = () => {
    if (!canReset) return;
    requestConfirm(
      "Limpar Histórico?", 
      "Todos os registros de vendas passadas e faturamento serão removidos permanentemente.",
      () => {
        onImport({ products, sales: [], users, shifts, openTabs });
        showToast("HISTÓRICO ZERADO!");
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    );
  };

  const handleFullReset = () => {
    if (!canReset) return;
    requestConfirm(
      "RESET TOTAL?", 
      "ESTA É UMA AÇÃO CRÍTICA. O sistema voltará ao estado de fábrica, apagando TUDO (Usuários, Vendas, Produtos).",
      () => {
        onImport({ products: [], sales: [], openTabs: [], shifts: [], users: [] });
        showToast("SISTEMA REINICIADO!");
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      'danger'
    );
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

      {/* Modal de Confirmação Customizado */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-[310] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase text-center mb-4 tracking-tighter leading-none">{confirmModal.title}</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-10 leading-relaxed px-2">
               {confirmModal.message}
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={confirmModal.onConfirm} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all ${confirmModal.type === 'danger' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-black'}`}>Confirmar</button>
                <button onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {/* Regras de Negócio */}
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
              <p className="text-[8px] text-slate-400 uppercase font-bold ml-2">Aparecerá um aviso visual (⚠️) no menu se os fiados totais passarem deste valor.</p>
           </div>
        </div>
      </div>

      {/* Manutenção */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
         <div className="flex items-center gap-4 text-slate-400">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Manutenção do Banco de Dados</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={handleResetTables} disabled={!canReset} className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 text-amber-600 font-black uppercase text-[10px] tracking-widest border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 transition-all disabled:opacity-30 active:scale-95">
               Zerar Mesas Abertas
            </button>
            <button onClick={handleResetProducts} disabled={!canReset} className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/10 text-blue-600 font-black uppercase text-[10px] tracking-widest border border-blue-200 dark:border-blue-900/30 hover:bg-blue-100 transition-all disabled:opacity-30 active:scale-95">
               Zerar Cardápio
            </button>
            <button onClick={handleResetSales} disabled={!canReset} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 active:scale-95">
               Zerar Histórico de Vendas
            </button>
            <button onClick={handleFullReset} disabled={!canReset} className="p-6 rounded-3xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg disabled:opacity-30 active:scale-95">
               Reset Total do Sistema
            </button>
         </div>
      </div>
      
      <div className="text-center opacity-20">
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">Botequista v3.0 • Stateless Cloud</p>
      </div>
    </div>
  );
};

export default Settings;
