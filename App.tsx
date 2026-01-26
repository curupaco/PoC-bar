
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Sale, Tab, User, Shift, ModifierGroup, Unit, Category, View, UserPermission, PaymentMethod, generateUniqueId, Theme, CashTransaction, SaleItem } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import ProductList from './components/ProductList';
import SalesHistory from './components/SalesHistory';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import ShiftControl from './components/ShiftControl';
import CashManagement from './components/CashManagement';
import Settings from './components/Settings';
import Help from './components/Help';
import Login from './components/Login';
import FeedbackModal from './components/FeedbackModal';
import { useSync } from './hooks/useSync';
import { SyncQueue } from './utils/syncQueue';
import { hashPassword } from './services/cryptoService';
import LoadingScreen from './components/LoadingScreen';
import { getFirebaseToken } from './services/firebaseService';

const ALL_PERMISSIONS: UserPermission[] = [
  'dashboard', 'pos', 'products', 'history', 'reports', 'settings',
  'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift',
  'delete_sale', 'delete_product', 'edit_product', 'export_report',
  'clear_fiado', 'full_reset', 'manage_backup', 'help_view', 'manage_units'
];

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'offline'>('idle');
  const [serverHealth, setServerHealth] = useState<'ok' | 'error'>('ok');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  
  const [cloudDebtors, setCloudDebtors] = useState<Set<string>>(new Set());

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('btq_theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('btq_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const [products, setProducts] = useState<Product[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [categoryModifiers, setCategoryModifiers] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [penduraThreshold, setPenduraThreshold] = useState(500);
  const [longDurationThreshold, setLongDurationThreshold] = useState(4);
  
  const [activeUnitId, setActiveUnitId] = useState<string | null>(() => localStorage.getItem('btq_active_unit'));

  useEffect(() => {
    if (activeUnitId) localStorage.setItem('btq_active_unit', activeUnitId);
    else localStorage.removeItem('btq_active_unit');
  }, [activeUnitId]);

  const syncConfig = useMemo(() => ({ 
    url: 'https://poc-botequista-default-rtdb.firebaseio.com', 
    key: 'REMOVED_FIREBASE_API_KEY', 
    email: 'curupaco@gmail.com', 
    pass: 'REMOVED_FIREBASE_PASSWORD', 
    allPerms: ALL_PERMISSIONS 
  }), []);

  useEffect(() => {
    const checkServer = async () => {
       try {
          const res = await fetch('/api/health');
          setServerHealth(res.ok ? 'ok' : 'error');
       } catch {
          setServerHealth('error');
       }
    };
    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
     if (!activeUnitId) return;
     const fetchDebtors = async () => {
        try {
           const token = await getFirebaseToken(syncConfig.email, syncConfig.pass, syncConfig.key);
           const res = await fetch(`/api/debtors?unitId=${activeUnitId}`, {
              headers: { 'x-fb-url': syncConfig.url, 'x-fb-token': token || '' }
           });
           if (res.ok) {
              const data = await res.json();
              setCloudDebtors(new Set(data.debtors));
           }
        } catch (e) {
           console.warn("Falha ao carregar lista global de devedores.");
        }
     };
     fetchDebtors();
  }, [activeUnitId, syncConfig]);

  const { refresh, registerLocalDeletion } = useSync({
    setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, 
    setUsers, setShifts, setUnits, setCategories, setDbStatus,
    activeUnitId, config: syncConfig
  });

  useEffect(() => {
    if (dbStatus === 'success') setLastSyncTime(Date.now());
  }, [dbStatus]);

  const persist = useCallback((node: string, data: any, itemId?: string) => {
    if (!activeUnitId) return;
    SyncQueue.enqueue({ node, data, itemId, unitId: activeUnitId, action: 'overwrite' });
  }, [activeUnitId]);

  const handleSwitchUnit = () => {
    setActiveUnitId(null);
    setProducts([]); setSales([]); setOpenTabs([]); setShifts([]);
    setModifierGroups([]); setCategories([]); setCategoryModifiers({});
    setDbStatus('idle'); setLastSyncTime(null); setCloudDebtors(new Set());
  };

  const handleLogout = () => {
    handleSwitchUnit(); setUnits([]); setUsers([]); setCurrentUser(null);
  };

  const handleSaveTab = useCallback((tab: Tab) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.id === tab.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = tab; return next; }
      return [...prev, tab];
    });
    persist('openTabs', tab, tab.id);
  }, [persist]);

  const handleUpdateTabItem = useCallback((tabId: string, item: SaleItem) => {
    setOpenTabs(prev => prev.map(t => {
        if (t.id === tabId) {
            const items = t.items ? [...t.items] : [];
            const idx = items.findIndex(i => i.id === item.id);
            if (idx > -1) {
                if (item.quantity <= 0) items.splice(idx, 1);
                else items[idx] = item;
            } else if (item.quantity > 0) items.push(item);
            return { ...t, items };
        }
        return t;
    }));
    persist(`openTabs/${tabId}/items`, item.quantity <= 0 ? null : item, item.id);
  }, [persist]);

  const handleDeleteTab = useCallback((tabId: string) => {
    setOpenTabs(prev => prev.filter(t => t.id !== tabId));
    persist('openTabs', null, tabId);
    persist(`_meta/deleted_tabs/${tabId}`, Date.now());
    registerLocalDeletion(tabId);
  }, [persist, registerLocalDeletion]);

  const handleUpdateProducts = useCallback((updater: any) => {
    setProducts(prev => { const next = updater(prev); persist('products', next); return next; });
  }, [persist]);

  const handleUpdateUsers = useCallback((newUsers: User[], changedItem?: User) => {
    setUsers(newUsers);
    if (changedItem) persist('users', changedItem, changedItem.id);
    else persist('users', newUsers);
  }, [persist]);

  const handleCompleteSale = useCallback((newSalesList: Sale[], tabIdToClose?: string) => {
    setSales(prev => {
        const next = [...prev, ...newSalesList];
        newSalesList.forEach(s => persist('sales', s, s.id));
        return next;
    });
    if (tabIdToClose) handleDeleteTab(tabIdToClose);
  }, [persist, handleDeleteTab]);

  const handleLogin = (u: string, p: string) => {
    setLoginError(null);
    if (u === 'admin' && p === 'admin') {
      setCurrentUser({ id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: ALL_PERMISSIONS, allowedUnits: [] });
      return;
    }
    const found = users.find(user => user.username === u && (user.password === p || user.password === hashPassword(p)));
    if (found) setCurrentUser(found);
    else setLoginError("Credenciais inválidas.");
  };

  const isShiftOpen = useMemo(() => shifts.some(s => s.status === 'open'), [shifts]);
  const totalPendura = useMemo(() => {
     return sales.reduce((acc, s) => {
        if (s.deleted) return acc;
        let debit = 0;
        if (s.paymentMethod === 'Pendura') debit = s.total;
        if (s.payments) { const pPart = s.payments.find(p => p.method === 'Pendura'); if(pPart) debit = pPart.amount; }
        if (s.items?.some(i => i.productId === 'quitacao')) debit -= s.total;
        return acc + debit;
     }, 0);
  }, [sales]);

  const activeDebtors = useMemo(() => {
    const combined = new Set(cloudDebtors);
    sales.forEach(s => {
       if (s.deleted || !s.customerName) return;
       const name = s.customerName.trim().toUpperCase();
       if (s.paymentMethod === 'Pendura') combined.add(name);
       if (s.items?.some(i => i.productId === 'quitacao')) combined.delete(name);
    });
    return combined;
  }, [sales, cloudDebtors]);

  if (!currentUser) return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading' && users.length === 0} error={loginError} />;

  if (!activeUnitId) {
    if (dbStatus === 'loading' && units.length === 0) return <LoadingScreen message="Buscando bares..." />;
    const allowedUnits = currentUser.username === 'admin' ? units : units.filter(u => currentUser.allowedUnits?.includes(u.id) && u.isActive);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
         <div className="max-w-2xl w-full animate-in fade-in zoom-in-95">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 text-center italic">Qual o Bar de hoje?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {allowedUnits.map(unit => (
                  <button key={unit.id} onClick={() => setActiveUnitId(unit.id)} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 hover:shadow-xl transition-all group text-left">
                     <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase group-hover:text-red-600 transition-colors">{unit.name}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">ID: {unit.id}</p>
                  </button>
               ))}
            </div>
         </div>
      </div>
    );
  }

  const activeUnitName = units.find(u => u.id === activeUnitId)?.name || 'Carregando...';

  return (
    <div className="flex h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden">
       <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentUser={currentUser} onLogout={handleLogout} isShiftOpen={isShiftOpen} activeTabsCount={openTabs.length} totalPendura={totalPendura} penduraThreshold={penduraThreshold} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} dbStatus={dbStatus} isOnline={navigator.onLine} theme={theme} />
       
       <main className={`flex-1 overflow-auto transition-all ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} h-full relative`}>
          <header className="hidden md:flex justify-between items-center bg-white dark:bg-slate-900/80 p-5 mx-8 mt-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md sticky top-6 z-30">
             <div className="flex flex-col">
                <h2 className="text-2xl font-barrio text-slate-900 dark:text-white leading-none">Botequista Pro</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-red-200 dark:border-red-900/50">
                      {activeUnitName}
                   </span>
                   <button 
                     onClick={handleSwitchUnit}
                     className="bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                   >
                     Trocar
                   </button>
                </div>
             </div>

             <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setStatusModalOpen(true)} 
                    className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase border flex items-center gap-2 transition-all bg-transparent ${dbStatus === 'success' && serverHealth === 'ok' ? 'text-emerald-600 border-emerald-100 dark:border-emerald-900/20' : 'text-slate-400 border-slate-100 dark:border-slate-800'}`}
                 >
                    <div className={`w-2 h-2 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : dbStatus === 'loading' ? 'bg-amber-400 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div>
                    {dbStatus === 'success' ? 'Sincronizado' : dbStatus === 'loading' ? 'Sincronizando...' : 'Offline'}
                 </button>

                 <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-all shadow-sm active:scale-95">
                    {theme === 'dark' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" strokeWidth={2}/></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeWidth={2}/></svg>}
                 </button>

                 <button onClick={() => setFeedbackOpen(true)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-all shadow-sm active:scale-95">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                 </button>
             </div>
          </header>

          <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full">
              {activeView === 'pos' && <POS products={products} modifierGroups={modifierGroups} categoryModifiers={categoryModifiers} openTabs={openTabs} onSaveTab={handleSaveTab} onUpdateTabItem={handleUpdateTabItem} onDeleteTab={handleDeleteTab} onCompleteSale={handleCompleteSale} activeShift={shifts.find(s => s.status === 'open')} onViewChange={setActiveView} penduraThreshold={penduraThreshold} longDurationThreshold={longDurationThreshold} activeDebtors={activeDebtors} dbStatus={dbStatus} />}
              {activeView === 'products' && <ProductList products={products} setProducts={handleUpdateProducts} modifierGroups={modifierGroups} setModifierGroups={setModifierGroups} categoryModifiers={categoryModifiers} setCategoryModifiers={setCategoryModifiers} categories={categories} setCategories={setCategories} openTabs={openTabs} onSaveTab={handleSaveTab} currentUser={currentUser} />}
              {activeView === 'shifts' && <ShiftControl shifts={shifts} onUpdateShifts={setShifts} currentUser={currentUser} sales={sales} activeTabsCount={openTabs.length} />}
              {activeView === 'cash' && <CashManagement shifts={shifts} onUpdateShifts={setShifts} sales={sales} currentUser={currentUser} onViewChange={setActiveView} />}
              {activeView === 'users' && <UserManagement users={users} units={units} onUpdateUsers={handleUpdateUsers} />}
              {activeView === 'dashboard' && <Dashboard sales={sales} products={products} theme={theme} />}
              {activeView === 'history' && <SalesHistory sales={sales} onDeleteSale={(id) => { setSales(prev => prev.map(s => s.id === id ? {...s, deleted: true, deletedAt: Date.now(), deletedBy: currentUser.id} : s)); persist('sales', sales.find(s => s.id === id)!, id); }} users={users} currentUser={currentUser} activeUnitId={activeUnitId} syncConfig={syncConfig} />}
              {activeView === 'reports' && <Reports sales={sales} products={products} users={users} shifts={shifts} currentUser={currentUser} onQuitarPendura={(name, amt) => handleCompleteSale([{id: generateUniqueId('sale'), timestamp: Date.now(), items: [{id:'q1', productId:'quitacao', productName:'Quitação', category:'FIADO', quantity:1, unitPrice:amt, totalPrice:amt}], paymentMethod:PaymentMethod.CASH, payments:[{method:PaymentMethod.CASH, amount:amt}], total:amt, customerName:name, userId:currentUser.id, shiftId:shifts.find(s=>s.status==='open')?.id || ''}])} penduraThreshold={penduraThreshold} activeUnitId={activeUnitId} syncConfig={syncConfig} theme={theme} />}
              {activeView === 'settings' && <Settings products={products} sales={sales} openTabs={openTabs} users={users} shifts={shifts} units={units} onUpdateUnits={setUnits} onImport={(data) => data==='EXPORT_NOW'?console.log('Export'):setProducts(data.products)} dbStatus={dbStatus} currentUser={currentUser} penduraThreshold={penduraThreshold} setPenduraThreshold={setPenduraThreshold} longDurationThreshold={longDurationThreshold} setLongDurationThreshold={setLongDurationThreshold} />}
              {activeView === 'help' && <Help />}
          </div>

          {statusModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setStatusModalOpen(false)} />
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-8 italic">Saúde do Sistema</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                       <p className="text-xs font-bold uppercase">Conexão Local (Wi-Fi)</p>
                       <span className={`w-2.5 h-2.5 rounded-full ${navigator.onLine ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                       <p className="text-xs font-bold uppercase">Servidor App</p>
                       <span className={`w-2.5 h-2.5 rounded-full ${serverHealth === 'ok' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                       <p className="text-xs font-bold uppercase">Banco de Dados</p>
                       <span className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                    </div>
                 </div>
                 {lastSyncTime && <p className="mt-8 text-[9px] font-black text-slate-400 uppercase italic">Resposta da Nuvem: {new Date(lastSyncTime).toLocaleTimeString()}</p>}
                 <button onClick={() => setStatusModalOpen(false)} className="mt-8 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Fechar</button>
              </div>
            </div>
          )}
       </main>
       <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} currentUser={currentUser.username} />
    </div>
  );
};
