
import React, { useState, useRef } from 'react';
import { Product, Sale, Tab } from '../types';
import { saveToFirebase, loadFromFirebase, AppFullData } from '../services/firebaseService';

interface SettingsProps {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  fbUrl: string; setFbUrl: (v: string) => void;
  onImport: (data: AppFullData) => void;
  dbStatus: 'idle' | 'loading' | 'success' | 'error';
  onStatusChange: (status: 'idle' | 'loading' | 'success' | 'error') => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  products, sales, openTabs, 
  fbUrl, setFbUrl,
  onImport, dbStatus, onStatusChange 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [fbMessage, setFbMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const testFirebase = async () => {
    if (!fbUrl) return;
    onStatusChange('loading');
    setFbMessage(null);
    try {
      const data = await loadFromFirebase(fbUrl);
      onStatusChange('success');
      setFbMessage({ type: 'success', text: "Conectado ao Firebase!" });
      if (data) onImport(data);
    } catch (err: any) {
      onStatusChange('error');
      setFbMessage({ type: 'error', text: err.message });
    }
  };

  const handleFullSyncFirebase = async () => {
    setIsSyncing(true);
    setFbMessage(null);
    try {
      const fullData = { products, sales, openTabs, config: { fbUrl, ghToken: '', gistId: '' } };
      await saveToFirebase(fbUrl, fullData);
      onStatusChange('success');
      setFbMessage({ type: 'success', text: "Backup enviado para o Firebase!" });
    } catch (err: any) {
      onStatusChange('error');
      setFbMessage({ type: 'error', text: `Erro: ${err.message}` });
    } finally { setIsSyncing(false); }
  };

  const exportJSON = () => {
    const fullData = { products, sales, openTabs, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_botequista_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        onImport(data);
        alert("Backup Importado!");
      } catch { alert("Arquivo JSON inválido."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* CARD FIREBASE */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-orange-500 shadow-xl space-y-6 relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.98 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14l.879 2.121z" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Firebase Database</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${dbStatus === 'success' ? 'bg-emerald-100 text-emerald-600' : dbStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
            {dbStatus === 'success' ? '● ONLINE' : dbStatus === 'error' ? '● ERRO' : '○ DESCONECTADO'}
          </div>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={fbUrl} 
            onChange={e => { setFbUrl(e.target.value); onStatusChange('idle'); setFbMessage(null); }} 
            placeholder="URL do Firebase (ex: https://seu-app.firebaseio.com)" 
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500" 
          />
          <button onClick={testFirebase} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors">Testar</button>
        </div>
        
        {fbMessage && (
          <div className={`p-4 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-1 ${fbMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-red-50 text-red-700 dark:bg-red-900/20'}`}>
             {fbMessage.text}
          </div>
        )}

        <button 
          onClick={handleFullSyncFirebase} 
          disabled={isSyncing || !fbUrl} 
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-orange-600 uppercase transition-all disabled:opacity-50"
        >
          {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
        </button>
      </div>

      {/* MANUTENÇÃO MANUAL */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 transition-colors">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={exportJSON} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exportar JSON (Backup Local)
            </button>
            <label className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Importar JSON (Restaurar)
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importJSON} />
            </label>
          </div>
      </div>
    </div>
  );
};

export default Settings;
