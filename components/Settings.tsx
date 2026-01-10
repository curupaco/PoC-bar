
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
}

const Settings: React.FC<SettingsProps> = ({ 
  products, sales, openTabs, users, shifts,
  fbUrl, setFbUrl,
  onImport, dbStatus, onStatusChange,
  currentUser
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('fb_api_key') || 'REMOVED_FIREBASE_API_KEY');
  const [email, setEmail] = useState(() => localStorage.getItem('fb_auth_email') || 'curupaco@gmail.com');
  const [pass, setPass] = useState(() => localStorage.getItem('fb_auth_pass') || 'REMOVED_FIREBASE_PASSWORD');

  const [ghToken, setGhToken] = useState(() => localStorage.getItem('bar_gh_token') || '');
  const [gistId, setGistId] = useState(() => localStorage.getItem('bar_gist_id') || '');
  const [isBackingUp, setIsBackingUp] = useState(false);

  const canReset = currentUser.username === 'admin' || currentUser.permissions.includes('full_reset');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGlobalSync = async () => {
    if (!apiKey || !fbUrl) { showToast("Preencha a apiKey e a URL!", 'error'); return; }
    setIsSyncing(true);
    try {
      const token = await getFirebaseToken(email, pass, apiKey);
      if (token) {
        localStorage.setItem('fb_api_key', apiKey);
        localStorage.setItem('fb_auth_email', email);
        localStorage.setItem('fb_auth_pass', pass);
        onStatusChange('success');
        showToast("Configuração Atualizada!");
      }
    } catch (err: any) {
      showToast(err.message || "Erro na autenticação", 'error');
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

  const handleGitHubBackup = async () => {
    if (!ghToken) { showToast("Token do GitHub é obrigatório!", 'error'); return; }
    setIsBackingUp(true);
    try {
      await testGitHubToken(ghToken);
      const newGistId = await syncToGitHub(ghToken, { products, sales, openTabs, users, shifts, config: { fbUrl } }, gistId);
      setGistId(newGistId);
      localStorage.setItem('bar_gh_token', ghToken);
      localStorage.setItem('bar_gist_id', newGistId);
      showToast("Backup no GitHub concluído!");
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
           {toast.msg}
        </div>
      )}

      {/* INFRAESTRUTURA */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Infraestrutura em Nuvem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">API Key do Bar</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border-none font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">URL do Banco</label>
              <input type="text" value={fbUrl} onChange={e => setFbUrl(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border-none font-mono text-xs outline-none focus:ring-2 focus:ring-orange-500" />
           </div>
        </div>
        <button onClick={handleGlobalSync} disabled={isSyncing} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50">
           {isSyncing ? "Validando..." : "Salvar Configuração"}
        </button>
      </div>

      {/* MANUTENÇÃO - OS "ZERAR" */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
         <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Ferramentas de Manutenção (Zerar)</h3>
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

      {/* GITHUB BACKUP */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Cópia de Segurança GitHub</h3>
        <div className="space-y-4">
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Token do GitHub</label>
              <input type="password" value={ghToken} onChange={e => setGhToken(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border-none font-mono text-xs outline-none focus:ring-2 focus:ring-slate-500" placeholder="ghp_..." />
           </div>
           <button onClick={handleGitHubBackup} disabled={isBackingUp} className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all">
              {isBackingUp ? "Sincronizando..." : "Sincronizar Agora"}
           </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
