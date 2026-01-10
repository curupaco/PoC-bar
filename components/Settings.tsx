
import React, { useState, useEffect } from 'react';
import { Product, Sale, Tab, formatCurrency, User } from '../types';
import { saveToFirebase, loadFromFirebase, getFirebaseToken, AppFullData } from '../services/firebaseService';

interface SettingsProps {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  fbUrl: string; setFbUrl: (v: string) => void;
  onImport: (data: AppFullData) => void;
  dbStatus: 'idle' | 'loading' | 'success' | 'error';
  onStatusChange: (status: 'idle' | 'loading' | 'success' | 'error') => void;
  currentUser: User;
}

const Settings: React.FC<SettingsProps> = ({ 
  products, sales, openTabs, 
  fbUrl, setFbUrl,
  onImport, dbStatus, onStatusChange,
  currentUser
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('fb_api_key') || 'AIzaSyDyOVNXnb7iB7Wk7stxrTPvQW4qmWTSQqs');
  const [email, setEmail] = useState(() => localStorage.getItem('fb_auth_email') || 'curupaco@gmail.com');
  const [pass, setPass] = useState(() => localStorage.getItem('fb_auth_pass') || 'Tc@00216587');
  const [isAuthEnabled, setIsAuthEnabled] = useState(() => localStorage.getItem('fb_auth_enabled') === 'true');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEnableSecurity = async () => {
    if (!apiKey || !email || !pass) {
      showToast("Preencha o e-mail e a senha que você criou!", 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const token = await getFirebaseToken(email, pass, apiKey);
      if (token) {
        localStorage.setItem('fb_api_key', apiKey);
        localStorage.setItem('fb_auth_email', email);
        localStorage.setItem('fb_auth_pass', pass);
        localStorage.setItem('fb_auth_enabled', 'true');
        setIsAuthEnabled(true);
        onStatusChange('success');
        showToast("Segurança Ativada com Sucesso!");
      }
    } catch (err: any) {
      showToast("Erro: Verifique se o E-mail e Senha estão certos no Firebase.", 'error');
      onStatusChange('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisableSecurity = () => {
    localStorage.removeItem('fb_auth_enabled');
    setIsAuthEnabled(false);
    showToast("Segurança Desativada (Modo Público)");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
           {toast.msg}
        </div>
      )}

      {/* PAINEL DE SEGURANÇA AVANÇADA */}
      <div className={`bg-white dark:bg-slate-900 p-8 rounded-[40px] border-4 shadow-2xl transition-all ${isAuthEnabled ? 'border-emerald-500/30' : 'border-red-500 animate-pulse'}`}>
        <div className="flex items-center justify-between gap-4 mb-8">
           <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isAuthEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                 <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Trava de Segurança</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proteja seus dados com login oficial</p>
              </div>
           </div>
           {!isAuthEnabled && (
             <button onClick={() => setShowGuide(!showGuide)} className="text-[10px] font-black text-blue-500 underline uppercase">Não acho a aba Authentication?</button>
           )}
        </div>

        {showGuide && !isAuthEnabled && (
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-3xl animate-in slide-in-from-top-2">
             <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase mb-4">Como encontrar no Firebase:</h4>
             <ul className="text-[11px] font-bold text-slate-600 dark:text-slate-300 space-y-3 uppercase">
                <li className="flex gap-2"><span>1.</span> No menu da esquerda, procure por <strong className="text-blue-600">Criação</strong> (ou Build) e clique.</li>
                <li className="flex gap-2"><span>2.</span> Clique em <strong className="text-blue-600">Authentication</strong> (primeiro item da lista).</li>
                <li className="flex gap-2"><span>3.</span> Clique no botão <strong className="text-blue-600">Começar</strong>.</li>
                <li className="flex gap-2"><span>4.</span> Vá em <strong className="text-blue-600">Sign-in Method</strong> e ative "E-mail/Senha".</li>
                <li className="flex gap-2"><span>5.</span> Vá em <strong className="text-blue-600">Users</strong> e crie seu e-mail e senha.</li>
             </ul>
          </div>
        )}

        {!isAuthEnabled ? (
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-800">
               <p className="text-[11px] font-bold text-red-600 dark:text-red-400 leading-relaxed uppercase">
                 ⚠️ O banco está quase pronto. Clique em "Ativar Segurança Agora" para testar suas novas credenciais.
               </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">apiKey (Já configurada)</label>
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border-none font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" />
               </div>
               
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail (Criado por você no Firebase)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border-none font-black text-xs outline-none focus:ring-2 focus:ring-red-500 shadow-inner" placeholder="ex: seu@email.com" />
               </div>

               <div className="md:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Senha (Criada por você no Firebase)</label>
                  <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border-none font-black text-xs outline-none focus:ring-2 focus:ring-red-500 shadow-inner" placeholder="••••••••" />
               </div>
            </div>

            <button onClick={handleEnableSecurity} disabled={isSyncing} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50">
               {isSyncing ? "Validando no Firebase..." : "Ativar Segurança Agora"}
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-emerald-500/20">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase">Acesso Seguro Ativado:</p>
                   <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase">{email}</p>
                </div>
             </div>
             <button onClick={handleDisableSecurity} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors">Voltar para Modo Público</button>
          </div>
        )}
      </div>

      {/* CONFIGURAÇÃO DE URL */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">databaseURL</h3>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">O endereço onde suas cervejas e vendas são salvas</p>
          </div>
        </div>
        <input type="text" value={fbUrl} onChange={e => { setFbUrl(e.target.value); onStatusChange('idle'); }} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500 shadow-inner" />
        
        <button 
          onClick={async () => {
            setIsSyncing(true);
            try {
               let token: string | undefined;
               if (isAuthEnabled) token = await getFirebaseToken(email, pass, apiKey);
               await saveToFirebase(fbUrl, {products, sales, openTabs}, "Tc@00216587", token);
               onStatusChange('success');
               showToast("Tudo salvo na Nuvem!");
            } catch (e: any) {
               onStatusChange('error');
               showToast(e.message || "Erro de conexão", 'error');
            } finally {
               setIsSyncing(false);
            }
          }} 
          disabled={isSyncing || !fbUrl} 
          className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-orange-600 transition-all uppercase text-xs tracking-widest disabled:opacity-50 active:scale-95"
        >
          {isSyncing ? "Sincronizando..." : "Salvar Dados na Nuvem Agora"}
        </button>
      </div>
    </div>
  );
};

export default Settings;
