
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
      const data = await loadFromFirebase(fbUrl, "Tc@00216587");
      onStatusChange('success');
      setFbMessage({ type: 'success', text: "Conectado e sincronizado com o Firebase!" });
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
      await saveToFirebase(fbUrl, fullData, "Tc@00216587");
      onStatusChange('success');
      setFbMessage({ type: 'success', text: "Backup criptografado enviado com sucesso!" });
    } catch (err: any) {
      onStatusChange('error');
      setFbMessage({ type: 'error', text: `Erro: ${err.message}` });
    } finally { setIsSyncing(false); }
  };

  const hardResetTabs = async () => {
    if (!window.confirm("Isso apagará TODAS as mesas abertas agora. As vendas já fechadas continuam no histórico. Continuar?")) return;
    
    setIsSyncing(true);
    try {
      const fullData = { products, sales, openTabs: [], config: { fbUrl, ghToken: '', gistId: '' } };
      await saveToFirebase(fbUrl, fullData, "Tc@00216587");
      onImport(fullData);
      setFbMessage({ type: 'success', text: "Comandas zeradas!" });
    } catch (err: any) {
      setFbMessage({ type: 'error', text: `Falha: ${err.message}` });
    } finally { setIsSyncing(false); }
  };

  const granularReset = async (type: 'sales' | 'products') => {
    const msg = type === 'sales' 
      ? "Deseja apagar TODO o histórico de faturamento e vendas passadas? Esta ação é irreversível."
      : "Deseja apagar TODO o cardápio de produtos? Você terá que cadastrar tudo novamente.";
    
    if (!window.confirm(msg)) return;

    setIsSyncing(true);
    try {
      const newData: AppFullData = { 
        products: type === 'products' ? [] : products, 
        sales: type === 'sales' ? [] : sales, 
        openTabs: openTabs, 
        config: { fbUrl, ghToken: '', gistId: '' },
        updatedAt: new Date().toISOString()
      };
      
      await saveToFirebase(fbUrl, newData, "Tc@00216587");
      onImport(newData);
      setFbMessage({ type: 'success', text: `Limpeza de ${type === 'sales' ? 'vendas' : 'produtos'} realizada!` });
    } catch (err: any) {
      setFbMessage({ type: 'error', text: `Erro: ${err.message}` });
    } finally { setIsSyncing(false); }
  };

  const fullSystemReset = async () => {
    const confirm1 = window.confirm("CUIDADO: Isso apagará TUDO (Produtos, Vendas e Mesas) do seu dispositivo e do Firebase. É uma limpeza total. Deseja continuar?");
    if (!confirm1) return;
    
    const confirm2 = window.confirm("TEM CERTEZA ABSOLUTA? Você perderá todo o histórico de faturamento e terá que cadastrar os produtos novamente.");
    if (!confirm2) return;

    setIsSyncing(true);
    try {
      const emptyData: AppFullData = { 
        products: [], 
        sales: [], 
        openTabs: [], 
        config: { fbUrl, ghToken: '', gistId: '' },
        updatedAt: new Date().toISOString()
      };
      
      localStorage.clear();
      await saveToFirebase(fbUrl, emptyData, "Tc@00216587");
      onImport(emptyData);
      
      setFbMessage({ type: 'success', text: "Sistema reiniciado do zero!" });
      alert("O sistema foi totalmente resetado. A página será recarregada.");
      window.location.reload();
    } catch (err: any) {
      setFbMessage({ type: 'error', text: `Erro no Reset Total: ${err.message}` });
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
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-orange-500 shadow-xl space-y-6 relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.98 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14l.879 2.121z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter text-left">Firebase Cloud</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-left">Criptografia AES Ativa</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${dbStatus === 'success' ? 'bg-emerald-100 text-emerald-600' : dbStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
            {dbStatus === 'success' ? '● CONECTADO' : dbStatus === 'error' ? '● ERRO' : '○ DISCONECTADO'}
          </div>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={fbUrl} 
            onChange={e => { setFbUrl(e.target.value); onStatusChange('idle'); setFbMessage(null); }} 
            placeholder="URL do Firebase" 
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500" 
          />
          <button onClick={testFirebase} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors">Testar</button>
        </div>
        
        {fbMessage && (
          <div className={`p-4 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-1 ${fbMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-red-50 text-red-700 dark:bg-red-900/20'}`}>
             {fbMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={handleFullSyncFirebase} 
            disabled={isSyncing || !fbUrl} 
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-orange-600 uppercase transition-all disabled:opacity-50 text-xs tracking-widest"
          >
            {isSyncing ? "Sincronizando..." : "Forçar Sincronização Cloud"}
          </button>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border-2 border-red-200 dark:border-red-900/30 space-y-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           <h3 className="font-black uppercase text-xs tracking-widest">Zona Crítica de Dados</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => granularReset('sales')} 
            className="bg-white dark:bg-slate-900 text-red-600 border border-red-200 dark:border-red-900/50 py-4 rounded-2xl font-black hover:bg-red-100 transition-all text-xs tracking-widest uppercase"
          >
            Limpar Histórico Vendas
          </button>
          <button 
            onClick={() => granularReset('products')} 
            className="bg-white dark:bg-slate-900 text-red-600 border border-red-200 dark:border-red-900/50 py-4 rounded-2xl font-black hover:bg-red-100 transition-all text-xs tracking-widest uppercase"
          >
            Zerar Cardápio Produtos
          </button>
          <button 
            onClick={hardResetTabs} 
            disabled={isSyncing} 
            className="bg-white dark:bg-slate-900 text-red-600 border border-red-200 dark:border-red-900/50 py-4 rounded-2xl font-black hover:bg-red-100 transition-all text-xs tracking-widest uppercase"
          >
            Zerar Apenas Mesas
          </button>
          <button 
            onClick={fullSystemReset} 
            disabled={isSyncing} 
            className="bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 uppercase transition-all text-xs tracking-widest flex items-center justify-center gap-2"
          >
            Hard Reset Total
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 transition-colors">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backup Manual em Arquivo</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={exportJSON} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exportar JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Importar JSON
            </button>
            <input type="file" ref={fileInputRef} onChange={importJSON} className="hidden" accept=".json" />
          </div>
      </div>
    </div>
  );
};

export default Settings;
