
import React, { useState } from 'react';
import { Product, Sale, Tab, User, Shift } from '../types';
import { getFirebaseToken } from '../services/firebaseService';
import { syncToGitHub, testGitHubToken } from '../services/cloudService';

interface SettingsProps {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  users: User[];
  shifts: Shift[];
  fbUrl: string; setFbUrl: (v: string) => void;
  onImport: (data: any) => void;
  dbStatus: 'idle' | 'loading' | 'success' | 'error';
  onStatusChange: (status: 'idle' | 'loading' | 'success' | 'error') => void;
  currentUser: User;
  penduraThreshold: number;
  setPenduraThreshold: (v: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  products, sales, openTabs, users, shifts,
  fbUrl, setFbUrl,
  onImport, dbStatus, onStatusChange,
  currentUser,
  penduraThreshold, setPenduraThreshold
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // Detecção de variáveis configuradas na Vercel
  const isEnvFixed = !!(process.env as any).FIREBASE_URL;

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('fb_api_key') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('fb_auth_email') || 'curupaco@gmail.com');
  const [pass, setPass] = useState(() => localStorage.getItem('fb_auth_pass') || 'Tc@00216587');

  const canReset = currentUser.username === 'admin' || currentUser.permissions.includes('full_reset');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGlobalSync = async () => {
    if (isEnvFixed) { showToast("Configuração travada pelo servidor.", 'error'); return; }
    if (!apiKey || !fbUrl) { showToast("Preencha a chave e o endereço!", 'error'); return; }
    setIsSyncing(true);
    try {
      const token = await getFirebaseToken(email, pass, apiKey);
      if (token) {
        localStorage.setItem('fb_api_key', apiKey);
        localStorage.setItem('fb_auth_email', email);
        localStorage.setItem('fb_auth_pass', pass);
        onStatusChange('success');
        showToast("Banco de Dados Conectado!");
      }
    } catch (err: any) {
      showToast(err.message || "Erro na conexão", 'error');
      onStatusChange('error');
    } finally {
      setIsSyncing(false);
    }
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
                      showToast("LIMITE DE ALERTA ATUALIZADO");
                    }} 
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-orange-500 font-black text-2xl outline-none transition-all" 
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Cloud Settings */}
      <div className={`bg-white dark:bg-slate-900 p-8 rounded-[40px] border shadow-xl space-y-6 ${isEnvFixed ? 'border-emerald-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4 text-emerald-600">
             <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
                {isEnvFixed ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                )}
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Conexão com Nuvem</h3>
          </div>
          {isEnvFixed && (
            <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               Ativo via Servidor
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Chave da API do Banco</label>
              <input 
                disabled={isEnvFixed}
                type="password" 
                value={isEnvFixed ? "PROTEGIDO PELO SERVIDOR" : apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border-none font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50" 
              />
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">URL do Banco (Firebase)</label>
              <input 
                disabled={isEnvFixed}
                type="text" 
                value={isEnvFixed ? "Protegido pelo Sistema" : fbUrl} 
                onChange={e => setFbUrl(e.target.value)} 
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border-none font-mono text-xs outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50" 
              />
           </div>
        </div>
        
        {!isEnvFixed && (
          <button onClick={handleGlobalSync} disabled={isSyncing} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50">
             {isSyncing ? "Validando..." : "Salvar Configuração"}
          </button>
        )}
      </div>

      {/* Manutenção */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
         <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Ferramentas de Manutenção</h3>
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
    </div>
  );
};

export default Settings;
