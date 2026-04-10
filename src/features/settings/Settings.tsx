import React, { useState } from 'react';
import { Product, Sale, Tab, User, Shift, Unit, generateUniqueId, Theme } from '../../types';
import SystemDocs from './components/SystemDocs';
import UnitManagement from './UnitManagement';
import { syncToGitHub } from '../../services/cloudService';

interface SettingsProps {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  users: User[];
  shifts: Shift[];
  units: Unit[];
  onUpdateUnits: (units: Unit[]) => void;
  onImport: (data: any) => void;
  dbStatus: string;
  currentUser: User;
  penduraThreshold: number;
  setPenduraThreshold: (val: number) => void;
  longDurationThreshold: number;
  setLongDurationThreshold: (val: number) => void;
}

const Settings: React.FC<SettingsProps> = ({
  products,
  sales,
  openTabs,
  users,
  shifts,
  units,
  onUpdateUnits,
  onImport,
  dbStatus,
  currentUser,
  penduraThreshold,
  setPenduraThreshold,
  longDurationThreshold,
  setLongDurationThreshold
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'UNITS' | 'BACKUP' | 'DOCS'>('GENERAL');
  const [isRescuing, setIsRescuing] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  const unitId = localStorage.getItem('btq_active_unit') || '';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRescueLocal = async () => {
    setIsRescuing(true);
    await new Promise(r => setTimeout(r, 600)); // Fake delay for UX

    try {
        const mirror = localStorage.getItem(`btq_mirror_${unitId}`);
        if (mirror) {
           const data = JSON.parse(mirror);
           onImport(data);
           showToast("DADOS LOCAIS RESGATADOS!");
        } else {
           showToast("NENHUM BACKUP LOCAL ENCONTRADO", "error");
        }
    } catch (e) {
        showToast("ACESSO NEGADO AO DISCO LOCAL", "error");
    }
    setIsRescuing(false);
  };

  const handleGitHubSync = async () => {
    if (!githubToken) return showToast("INFORME O TOKEN DO GITHUB", "error");
    setIsSyncingGithub(true);
    try {
      const backupData = { products, sales, users, shifts, openTabs, units, config: { penduraThreshold } };
      await syncToGitHub(githubToken, backupData);
      showToast("BACKUP GITHUB REALIZADO COM SUCESSO!");
    } catch (e: any) {
      showToast(`ERRO NO GITHUB: ${e.message}`, "error");
    }
    setIsSyncingGithub(false);
  };

  const canManageUnits = currentUser.username === 'admin' || currentUser.permissions.includes('manage_units');
  const canManageBackup = currentUser.username === 'admin' || currentUser.permissions.includes('manage_backup');

  return (
    <div className="max-w-7xl mx-auto pb-32 space-y-8">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
           {toast.msg}
        </div>
      )}

      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <button onClick={() => setActiveTab('GENERAL')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'GENERAL' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Geral</button>
        {canManageUnits && <button onClick={() => setActiveTab('UNITS')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'UNITS' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Franquia</button>}
        {canManageBackup && <button onClick={() => setActiveTab('BACKUP')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'BACKUP' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Backups</button>}
        <button onClick={() => setActiveTab('DOCS')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'DOCS' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Ajuda</button>
      </div>

      {activeTab === 'GENERAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-red-500/10 transition-all duration-700"></div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Parâmetros Operacionais</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Defina limites e comportamentos do PDV</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alerta de Pendura</label>
                  <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg italic">R$ {penduraThreshold}</span>
                </div>
                <div className="relative group/input">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within/input:text-red-500 transition-colors">R$</span>
                  <input 
                    type="number" 
                    value={penduraThreshold} 
                    onChange={e => setPenduraThreshold(Number(e.target.value))} 
                    className="w-full pl-12 pr-5 py-5 rounded-[24px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all" 
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium ml-1">Valor máximo antes do alerta visual na lista de clientes.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mesa Ociosa</label>
                  <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg italic">{longDurationThreshold} HRS</span>
                </div>
                <div className="relative group/input">
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within/input:text-indigo-500 transition-colors uppercase text-[10px] tracking-widest">Horas</span>
                  <input 
                    type="number" 
                    value={longDurationThreshold} 
                    onChange={e => setLongDurationThreshold(Number(e.target.value))} 
                    className="w-full px-5 py-5 rounded-[24px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium ml-1">Tempo de inatividade até o alerta de mesa parada no salão.</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden group">
            <div className={`absolute inset-0 opacity-[0.03] pointer-events-none transition-all duration-700 group-hover:scale-110 ${dbStatus === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-xl transition-all duration-500 group-hover:-translate-y-2 ${dbStatus === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>
               {dbStatus === 'success' ? (
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
               ) : (
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               )}
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Status da Rede</h3>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 px-4 py-1.5 rounded-full ${dbStatus === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {dbStatus === 'success' ? 'Sincronizado' : 'Conexão Instável'}
            </p>
            <button className="mt-8 text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse"></span>
               Ver logs de sincronização
            </button>
          </div>
        </div>
      )}

      {activeTab === 'UNITS' && canManageUnits && (
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
              <div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Minhas Unidades</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie os pontos de venda da rede</p>
              </div>
              <button onClick={() => setShowUnitModal(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Gerenciar</button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map(u => (
                 <div key={u.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                    <h4 className="font-black uppercase text-slate-800 dark:text-white">{u.name}</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">{u.id}</p>
                    <span className={`inline-block mt-3 px-3 py-1 rounded-full text-[8px] font-black uppercase ${u.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                       {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'BACKUP' && canManageBackup && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Resgate de Emergência</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                 Tenta recuperar dados salvos no cache local do navegador (LocalStorage) caso a sincronização com a nuvem falhe. Útil em casos de perda de conexão crítica.
              </p>
              <button 
                 onClick={handleRescueLocal} 
                 disabled={isRescuing}
                 className="w-full bg-amber-500 hover:bg-amber-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 disabled:opacity-50 transition-all"
              >
                 {isRescuing ? 'Buscando...' : 'Restaurar Backup Local'}
              </button>
           </div>

           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Backup GitHub (JSON)</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                 Envia uma cópia completa do banco de dados para um Gist privado no GitHub. Requer token de acesso pessoal.
              </p>
              <input 
                 type="password" 
                 value={githubToken} 
                 onChange={e => setGithubToken(e.target.value)} 
                 placeholder="GitHub Personal Access Token" 
                 className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-xs outline-none focus:ring-2 focus:ring-slate-500"
              />
              <button 
                 onClick={handleGitHubSync} 
                 disabled={isSyncingGithub || !githubToken}
                 className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 disabled:opacity-50 transition-all"
              >
                 {isSyncingGithub ? 'Enviando...' : 'Sincronizar com GitHub'}
              </button>
           </div>
        </div>
      )}

      {activeTab === 'DOCS' && (
         <SystemDocs showToast={(msg, type) => showToast(msg, type || 'success')} />
      )}

      {showUnitModal && (
         <UnitManagement 
            units={units} 
            onUpdateUnits={onUpdateUnits} 
            onClose={() => setShowUnitModal(false)} 
            activeUnitId={unitId}
            franchiseId={currentUser.franchiseId}
         />
      )}
    </div>
  );
};

export default Settings;