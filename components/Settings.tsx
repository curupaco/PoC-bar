
import React, { useState, useRef, useEffect } from 'react';
import { Product, Sale, Tab, formatCurrency, User } from '../types';
import { saveToFirebase, loadFromFirebase, AppFullData } from '../services/firebaseService';

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
  const [fbMessage, setFbMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [snapshotInfo, setSnapshotInfo] = useState<{ date: string; count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [confirmAction, setConfirmAction] = useState<{title: string, msg: string, onConfirm: () => void} | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canBackup = currentUser.username === 'admin' || currentUser.permissions.includes('manage_backup');
  const canReset = currentUser.username === 'admin' || currentUser.permissions.includes('full_reset');

  useEffect(() => {
    const saved = localStorage.getItem('bar_snapshot');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSnapshotInfo({ date: parsed.timestamp, count: (parsed.products?.length || 0) + (parsed.sales?.length || 0) });
      } catch (e) { console.error("Snapshot corrompido"); }
    }
  }, []);

  const showToast = (txt: string) => {
    setToast(txt);
    setTimeout(() => setToast(null), 3000);
  };

  const createRestorePoint = () => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const snapshot = { timestamp, products, sales, openTabs, config: { fbUrl } };
    localStorage.setItem('bar_snapshot', JSON.stringify(snapshot));
    setSnapshotInfo({ date: timestamp, count: products.length + sales.length });
    showToast("Snapshot local criado!");
  };

  const restoreFromPoint = () => {
    const saved = localStorage.getItem('bar_snapshot');
    if (!saved) return;
    setConfirmAction({
      title: "Restaurar Snapshot?",
      msg: "Os dados ATUAIS serão substituídos pela cópia de segurança. Deseja prosseguir?",
      onConfirm: () => {
        const data = JSON.parse(saved);
        onImport(data);
        showToast("Sistema Restaurado!");
        setConfirmAction(null);
      }
    });
  };

  const hardResetTabs = async () => {
    if (!canReset) return;
    setConfirmAction({
      title: "Zerar Mesas?",
      msg: "Isso apagará TODAS as comandas abertas agora. O histórico permanece salvo.",
      onConfirm: async () => {
        setIsSyncing(true);
        const fullData = { products, sales, openTabs: [], config: { fbUrl } };
        await saveToFirebase(fbUrl, fullData, "REMOVED_FIREBASE_PASSWORD");
        onImport(fullData as any);
        setConfirmAction(null);
        setIsSyncing(false);
        showToast("Mesas Zeradas!");
      }
    });
  };

  const fullSystemReset = async () => {
    if (!canReset) return;
    setConfirmAction({
      title: "HARD RESET TOTAL?",
      msg: "LIMPEZA COMPLETA: Apaga Produtos, Vendas e Mesas de TODOS os lugares. Inevitável.",
      onConfirm: async () => {
        setIsSyncing(true);
        const emptyData = { products: [], sales: [], openTabs: [], config: { fbUrl }, updatedAt: new Date().toISOString() };
        localStorage.clear();
        await saveToFirebase(fbUrl, emptyData, "REMOVED_FIREBASE_PASSWORD");
        onImport(emptyData as any);
        setConfirmAction(null);
        setIsSyncing(false);
        window.location.reload();
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 relative">
      {/* TOAST INTERNO */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4">
           {toast}
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO CRÍTICA */}
      {confirmAction && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl animate-in fade-in" onClick={() => setConfirmAction(null)} />
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-20 border-4 border-red-600 animate-in zoom-in-95">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase text-center mb-4 tracking-tighter leading-none">{confirmAction.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-bold mb-10 leading-relaxed uppercase">{confirmAction.msg}</p>
              <div className="flex flex-col gap-3">
                 <button onClick={confirmAction.onConfirm} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Sim, Executar</button>
                 <button onClick={() => setConfirmAction(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Cancelar</button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-slate-100 dark:bg-slate-900/50 p-8 rounded-3xl border-2 border-blue-500 shadow-lg space-y-6 relative overflow-hidden transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
          <div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Ponto de Restauração</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Snapshot de Segurança Local</p></div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <button onClick={createRestorePoint} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 uppercase transition-all text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Criar Snapshot Agora</button>
          {snapshotInfo && (
            <button onClick={restoreFromPoint} className="flex-1 bg-white dark:bg-slate-800 text-blue-600 border border-blue-200 dark:border-blue-900/50 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all text-xs tracking-widest uppercase flex flex-col items-center justify-center gap-1 active:scale-95"><span>Restaurar Snapshot</span><span className="text-[9px] opacity-60 font-medium">Salvo em: {snapshotInfo.date}</span></button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-orange-500 shadow-xl space-y-6 relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.98 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14l.879 2.121z" /></svg></div>
            <div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter text-left">Firebase Cloud</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-left">Banco de Dados Ativo</p></div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${dbStatus === 'success' ? 'bg-emerald-100 text-emerald-600' : dbStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>{dbStatus === 'success' ? '● CONECTADO' : dbStatus === 'error' ? '● ERRO' : '○ DISCONECTADO'}</div>
        </div>
        <div className="flex gap-2">
          <input type="text" value={fbUrl} onChange={e => { setFbUrl(e.target.value); onStatusChange('idle'); setFbMessage(null); }} placeholder="URL do Banco de Dados" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <button onClick={async () => { setIsSyncing(true); await saveToFirebase(fbUrl, {products, sales, openTabs}, "REMOVED_FIREBASE_PASSWORD"); showToast("Nuvem Atualizada!"); setIsSyncing(false); }} disabled={isSyncing || !fbUrl || !canBackup} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-orange-600 uppercase transition-all disabled:opacity-50 text-xs tracking-widest active:scale-95">{isSyncing ? "Sincronizando..." : "Forçar Sincronização Cloud"}</button>
      </div>

      <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border-2 border-red-200 dark:border-red-900/30 space-y-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><h3 className="font-black uppercase text-xs tracking-widest">Zona Crítica de Dados</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button disabled={!canReset} onClick={hardResetTabs} className="bg-white dark:bg-slate-900 text-red-600 border border-red-200 dark:border-red-900/50 py-4 rounded-2xl font-black hover:bg-red-100 transition-all text-xs tracking-widest uppercase disabled:opacity-20 active:scale-95">Zerar Apenas Mesas</button>
          <button disabled={!canReset} onClick={fullSystemReset} className="bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 uppercase transition-all text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-20 active:scale-95">Hard Reset Total</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
