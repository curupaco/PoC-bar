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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-6">Parâmetros do Sistema</h3>
              
              <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite Alerta de Pendura (R$)</label>
                   <input 
                      type="number" 
                      value={penduraThreshold} 
                      onChange={e => setPenduraThreshold(Number(e.target.value))} 
                      className="w-full mt-2 px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alerta Mesa Ociosa (Horas)</label>
                   <input 
                      type="number" 
                      value={longDurationThreshold} 
                      onChange={e => setLongDurationThreshold(Number(e.target.value))} 
                      className="w-full mt-2 px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                   />
                </div>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-4 ${dbStatus === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                 {dbStatus === 'success' ? '☁️' : '⚠️'}
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Status da Conexão</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{dbStatus === 'success' ? 'Sincronizado com Nuvem' : 'Operando Offline / Erro'}</p>
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