
import React, { useState } from 'react';
import { Product, Sale, Tab, User, Shift } from '../types';

interface SettingsProps {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  users: User[];
  shifts: Shift[];
  fbUrl: string; setFbUrl: (v: string) => void;
  fbApiKey: string; setFbApiKey: (v: string) => void;
  onImport: (data: any) => void;
  dbStatus: 'idle' | 'loading' | 'pending' | 'success' | 'error';
  onStatusChange: (status: any) => void;
  currentUser: User;
  penduraThreshold: number;
  setPenduraThreshold: (v: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  products, sales, openTabs, users, shifts,
  fbUrl, setFbUrl, fbApiKey, setFbApiKey,
  onImport, currentUser,
  penduraThreshold, setPenduraThreshold
}) => {
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const canReset = currentUser.username === 'admin' || currentUser.permissions.includes('full_reset');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleResetTables = () => {
    if (!canReset) return;
    if (confirm("CONFIRMAR: Deseja ZERAR todas as mesas abertas?")) {
      onImport({ products, sales, users, shifts, openTabs: [] });
      showToast("MESAS ZERADAS!");
    }
  };

  const handleResetProducts = () => {
    if (!canReset) return;
    if (confirm("CONFIRMAR: Deseja APAGAR todos os produtos do cardápio?")) {
      onImport({ products: [], sales, users, shifts, openTabs });
      showToast("CARDÁPIO ZERADO!");
    }
  };

  const handleResetSales = () => {
    if (!canReset) return;
    if (confirm("CONFIRMAR: Deseja APAGAR todo o histórico de vendas?")) {
      onImport({ products, sales: [], users, shifts, openTabs });
      showToast("HISTÓRICO ZERADO!");
    }
  };

  const handleFullReset = () => {
    if (!canReset) return;
    if (confirm("PERIGO: Isso resetará TODO o sistema para o estado inicial. Continuar?")) {
      onImport({ products: [], sales: [], openTabs: [], shifts: [], users: [] });
      showToast("SISTEMA RESETADO!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
           {toast.msg}
        </div>
      )}

      {/* Configurações de Nuvem */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4 text-blue-500">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Conexão Blindada (Firebase)</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">URL do Banco de Dados</label>
              <input 
                type="text" 
                value={fbUrl} 
                onChange={e => setFbUrl(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs outline-none" 
                placeholder="https://seu-projeto.firebaseio.com"
              />
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">API Key do Firebase (Necessário para Auth)</label>
              <input 
                type="password" 
                value={fbApiKey} 
                onChange={e => setFbApiKey(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs outline-none" 
                placeholder="Cole aqui a sua Web API Key..."
              />
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-2 px-2 italic">As chaves inseridas acima são mantidas apenas em memória e sincronizadas com a nuvem.</p>
           </div>
        </div>
      </div>

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
                    type="number" 
                    value={penduraThreshold} 
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setPenduraThreshold(isNaN(val) ? 0 : val);
                    }} 
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-orange-500 font-black text-2xl outline-none transition-all" 
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Manutenção */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
         <div className="flex items-center gap-4 text-slate-400">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Ferramentas de Manutenção</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={handleResetTables} disabled={!canReset} className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 text-amber-600 font-black uppercase text-[10px] tracking-widest border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 transition-all disabled:opacity-30">
               Zerar Mesas Abertas
            </button>
            <button onClick={handleResetProducts} disabled={!canReset} className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/10 text-blue-600 font-black uppercase text-[10px] tracking-widest border border-blue-200 dark:border-blue-900/30 hover:bg-blue-100 transition-all disabled:opacity-30">
               Zerar Cardápio
            </button>
            <button onClick={handleResetSales} disabled={!canReset} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30">
               Zerar Histórico de Vendas
            </button>
            <button onClick={handleFullReset} disabled={!canReset} className="p-6 rounded-3xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg disabled:opacity-30">
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
