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
  const [shortcutCheckout, setShortcutCheckout] = useState<{ name: string; amount: number } | null>(null);
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('btq_theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('btq_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
    const interval = setInterval(checkServer, 20000);
    return () => clearInterval(interval);
  }, []);

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

  // INÍCIO DA ALTERAÇÃO: Monitoramento Reativo de Sessão e Acesso
  // 1. Mantém o objeto currentUser atualizado quando a lista global 'users' muda (ex: sync remoto)
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const freshUser = users.find(u => u.id === currentUser.id);
      if (freshUser) {
         // Compara permissões e unidades para evitar loops de renderização
         const permsChanged = JSON.stringify(freshUser.permissions) !== JSON.stringify(currentUser.permissions);
         const unitsChanged = JSON.stringify(freshUser.allowedUnits) !== JSON.stringify(currentUser.allowedUnits);
         
         if (permsChanged || unitsChanged) {
            // Atualiza sessão sem logout
            setCurrentUser(prev => prev ? ({ ...prev, ...freshUser }) : null);
         }
      }
    }
  }, [users, currentUser?.id]); 

  // 2. Revogação de Estado (Cleanup): Limpa o ID da unidade se perder acesso
  useEffect(() => {
     if (activeUnitId && currentUser && currentUser.username !== 'admin') {
        const hasAccess = currentUser.allowedUnits?.includes(activeUnitId);
        if (!hasAccess) {
           setActiveUnitId(null);
           localStorage.removeItem('btq_active_unit');
        }
     }
  }, [activeUnitId, currentUser]);
  // FIM DA ALTERAÇÃO

  const syncConfig = useMemo(() => ({ 
    url: 'https://poc-botequista-default-rtdb.firebaseio.com', 
    key: 'REMOVED_FIREBASE_API_KEY', 
    email: 'curupaco@gmail.com', 
    pass: 'REMOVED_FIREBASE_PASSWORD', 
    allPerms: ALL_PERMISSIONS 
  }), []);

  // PERFORMANCE FIX: Memoizado para evitar recreação a cada render, o que causava loop no useSync
  const handleSetOpenTabs = useCallback((tabs: any) => {
    const sanitized = (!tabs) ? [] : (Array.isArray(tabs) ? tabs : Object.values(tabs)).filter(Boolean).map((t: any) => ({
      ...t,
      items: Array.isArray(t.items) ? t.items : (t.items ? (Object.values(t.items) as SaleItem[]) : [])
    }));
    setOpenTabs(sanitized);
  }, []);

  // INÍCIO DA ALTERAÇÃO: Recebendo updateLocalTimestamp do useSync
  const { refresh, registerLocalDeletion, updateLocalTimestamp } = useSync({
    setProducts, setModifierGroups, setCategoryModifiers, setSales, 
    setOpenTabs: handleSetOpenTabs, // Usando a função memoizada
    setUsers, setShifts, setUnits, setCategories, setDbStatus,
    activeUnitId, config: syncConfig
  });
  // FIM DA ALTERAÇÃO

  useEffect(() => {
    if (dbStatus === 'success') setLastSyncTime(Date.now());
  }, [dbStatus]);

  const persist = useCallback((node: string, data: any, itemId?: string) => {
    if (!activeUnitId) return;
    SyncQueue.enqueue({ node, data, itemId, unitId: activeUnitId, action: 'overwrite' });
  }, [activeUnitId]);

  const handleSwitchUnit = () => {
    setActiveUnitId(null);
    localStorage.removeItem('btq_active_unit');
    setProducts([]); setSales([]); setOpenTabs([]); setShifts([]);
    setModifierGroups([]); setCategories([]); setCategoryModifiers({});
    setDbStatus('idle'); setLastSyncTime(null);
    refresh(); 
  };

  const handleLogout = () => {
    handleSwitchUnit(); setCurrentUser(null);
  };

  const handleSaveTab = useCallback((tab: Tab) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.id === tab.id);
      const sanitizedTab: Tab = { ...tab, items: Array.isArray(tab.items) ? tab.items : (Object.values(tab.items || {}) as SaleItem[]) };
      if (idx >= 0) { const next = [...prev]; next[idx] = sanitizedTab; return next; }
      return [...prev, sanitizedTab];
    });
    persist('openTabs', tab, tab.id);
  }, [persist]);

  const handleUpdateTabItem = useCallback((tabId: string, item: SaleItem) => {
    setOpenTabs(prev => prev.map(t => {
        if (t.id === tabId) {
            const currentItems = Array.isArray(t.items) ? [...t.items] : (Object.values(t.items || {}) as SaleItem[]);
            const idx = currentItems.findIndex((i: SaleItem) => i.id === item.id);
            if (idx > -1) {
                if (item.quantity <= 0) currentItems.splice(idx, 1);
                else currentItems[idx] = item;
            } else if (item.quantity > 0) currentItems.push(item);
            return { ...t, items: currentItems };
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
    setProducts(prev => { 
        const next = updater(prev); 
        updateLocalTimestamp('products'); // Bloqueio de sync reverso
        persist('products', next); 
        return next; 
    });
  }, [persist, updateLocalTimestamp]);

  const handleUpdateShifts = useCallback((newShifts: Shift[], changedItem?: Shift) => {
    setShifts(newShifts);
    updateLocalTimestamp('shifts'); // Bloqueio de sync reverso
    if (changedItem) persist('shifts', changedItem, changedItem.id);
    else persist('shifts', newShifts);
  }, [persist, updateLocalTimestamp]);

  // INÍCIO DA ALTERAÇÃO: Correção de Race Condition e Atualização Reativa de Sessão
  const handleUpdateUsers = useCallback((newUsers: User[], changedItem?: User) => {
    setUsers(newUsers);
    
    // 1. Bloqueia leituras do servidor para 'users' por alguns segundos
    // Isso impede que o 'useSync' baixe uma versão antiga do servidor e sobrescreva a edição local
    updateLocalTimestamp('users'); 

    // 2. Atualização Reativa da Sessão (Reactive Session) - Edição Local (Admin editando a si mesmo)
    if (changedItem && currentUser && changedItem.id === currentUser.id) {
        setCurrentUser(prev => prev ? ({ ...prev, ...changedItem }) : null);
    }

    if (changedItem) persist('users', changedItem, changedItem.id);
    else persist('users', newUsers);
  }, [persist, updateLocalTimestamp, currentUser]);
  // FIM DA ALTERAÇÃO

  const handleCompleteSale = useCallback((newSalesList: Sale[], tabIdToClose?: string) => {
    setSales(prev => {
        const next = [...prev, ...newSalesList];
        updateLocalTimestamp('sales'); // Bloqueio de sync reverso
        newSalesList.forEach(s => persist('sales', s, s.id));
        return next;
    });
    if (tabIdToClose) handleDeleteTab(tabIdToClose);
  }, [persist, handleDeleteTab, updateLocalTimestamp]);

  const handleLogin = (u: string, p: string) => {
    setLoginError(null);
    if (u === 'admin' && p === 'admin') {
      setCurrentUser({ id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: ALL_PERMISSIONS });
      return;
    }
    const found = users.find(user => user.username === u && (user.password === p || user.password === hashPassword(p)));
    if (found) setCurrentUser(found);
    else setLoginError("Credenciais inválidas.");
  };

  const isShiftOpen = useMemo(() => Array.isArray(shifts) && shifts.some(s => s.status === 'open'), [shifts]);

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

  // Lógica de Exportação de Backup
  const handleExportData = useCallback(() => {
    const backupData = {
      products,
      sales,
      users,
      shifts,
      openTabs,
      modifierGroups,
      categoryModifiers,
      categories,
      units,
      config: { penduraThreshold, longDurationThreshold },
      meta: {
        exportedAt: Date.now(),
        exportedBy: currentUser?.username,
        systemVersion: '3.9.x'
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `botequista_backup_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [products, sales, users, shifts, openTabs, modifierGroups, categoryModifiers, categories, units, penduraThreshold, longDurationThreshold, currentUser]);

  // Lógica de Importação/Restauração
  const handleDataManagement = useCallback((data: any) => {
    if (data === 'EXPORT_NOW') {
      handleExportData();
      return;
    }

    // Importação de Dados
    if (data) {
      if (data.products) { setProducts(data.products); updateLocalTimestamp('products'); persist('products', data.products); }
      if (data.sales) { setSales(data.sales); updateLocalTimestamp('sales'); persist('sales', data.sales); }
      if (data.users) { setUsers(data.users); updateLocalTimestamp('users'); persist('users', data.users); }
      if (data.shifts) { setShifts(data.shifts); updateLocalTimestamp('shifts'); persist('shifts', data.shifts); }
      if (data.units) { setUnits(data.units); persist('units', data.units); }
      if (data.modifierGroups) { setModifierGroups(data.modifierGroups); updateLocalTimestamp('modifierGroups'); persist('modifierGroups', data.modifierGroups); }
      if (data.categoryModifiers) { setCategoryModifiers(data.categoryModifiers); updateLocalTimestamp('categoryModifiers'); persist('categoryModifiers', data.categoryModifiers); }
      if (data.categories) { setCategories(data.categories); updateLocalTimestamp('categories'); persist('categories', data.categories); }
      if (data.openTabs) { setOpenTabs(data.openTabs); updateLocalTimestamp('openTabs'); persist('openTabs', data.openTabs); }
      
      if (data.config) {
        if (data.config.penduraThreshold) setPenduraThreshold(data.config.penduraThreshold);
        if (data.config.longDurationThreshold) setLongDurationThreshold(data.config.longDurationThreshold);
      }
    }
  }, [handleExportData, persist, updateLocalTimestamp]);

  if (!currentUser) return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading' && users.length === 0} error={loginError} />;

  // INÍCIO DA ALTERAÇÃO: Render Guard (Bloqueio Visual Imediato)
  // Verifica permissão antes de renderizar qualquer conteúdo da unidade
  const hasActiveUnitAccess = !activeUnitId || (currentUser.username === 'admin' || currentUser.allowedUnits?.includes(activeUnitId));

  if (!activeUnitId || !hasActiveUnitAccess) {
    const allowedUnits = currentUser.username === 'admin' ? units : units.filter(u => currentUser.allowedUnits?.includes(u.id) && u.isActive);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
         <div className="max-w-2xl w-full animate-in fade-in zoom-in-95">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-10 text-center italic">Qual o Bar de hoje?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {allowedUnits.map(unit => (
                  <button key={unit.id} onClick={() => { setActiveUnitId(unit.id); localStorage.setItem('btq_active_unit', unit.id); setDbStatus('loading'); }} className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 hover:shadow-2xl transition-all group text-left">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unidade</span>
                     <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase group-hover:text-red-600 transition-colors">{unit.name}</h3>
                  </button>
               ))}
            </div>
            <button onClick={handleLogout} className="mt-12 w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors tracking-widest">Sair do Sistema</button>
         </div>
      </div>
    );
  }
  // FIM DA ALTERAÇÃO

  if (dbStatus === 'loading' && products.length === 0) return <LoadingScreen message="Conectando ao Bar..." />;

  const activeUnitName = units.find(u => u.id === activeUnitId)?.name || 'Bar';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden">
       <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentUser={currentUser} onLogout={handleLogout} onSwitchUnit={handleSwitchUnit} isShiftOpen={isShiftOpen} activeTabsCount={openTabs.length} totalPendura={totalPendura} penduraThreshold={penduraThreshold} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} dbStatus={dbStatus} isOnline={navigator.onLine} theme={theme} />
       
       <main className={`flex-1 flex flex-col min-w-0 h-full relative overflow-hidden transition-all ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <header className="shrink-0 flex justify-between items-center bg-white dark:bg-slate-900/80 p-3 md:p-6 mx-0 md:mx-10 mt-0 md:mt-8 rounded-none md:rounded-[40px] border-b md:border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-xl z-40">
             <div className="flex items-center gap-3 md:gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-white transition-all active:scale-95">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
                <div className="flex flex-col justify-center">
                   <h2 className="text-lg md:text-3xl font-barrio text-slate-900 dark:text-white leading-none uppercase">Botequista</h2>
                   <div className="flex items-center gap-2 mt-1 md:mt-1.5">
                      <button onClick={handleSwitchUnit} className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded-md text-[7px] md:text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 active:scale-95 transition-all cursor-pointer">
                         {activeUnitName}
                         <svg className="w-2.5 h-2.5 md:hidden opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      </button>
                      <button onClick={handleSwitchUnit} className="hidden md:block bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-0.5 rounded-lg text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase transition-all">Trocar Unidade</button>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-2 md:gap-5">
                 <button onClick={() => setStatusModalOpen(true)} className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 rounded-[16px] md:rounded-[22px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:scale-[1.02]">
                    <div className="hidden sm:flex flex-col items-end">
                       <span className={`text-[8px] md:text-[10px] font-black uppercase ${dbStatus === 'success' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {dbStatus === 'success' ? 'SINCRONIZADO' : dbStatus === 'loading' ? 'PENDENTE' : 'OFFLINE'}
                       </span>
                    </div>
                    <div className="relative flex items-center justify-center">
                       <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500' : 'bg-amber-500'} ${dbStatus === 'loading' ? 'animate-ping' : ''}`}></div>
                       {dbStatus === 'success' && <div className="absolute inset-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 animate-pulse"></div>}
                    </div>
                 </button>

                 <div className="flex gap-1.5 md:gap-2 border-l border-slate-100 dark:border-slate-800 pl-2 md:pl-5">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-[16px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all shadow-sm active:scale-90">
                       {theme === 'dark' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" strokeWidth={2.5}/></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeWidth={2.5}/></svg>}
                    </button>
                    <button onClick={() => setFeedbackOpen(true)} className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-[16px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-500 transition-all shadow-sm active:scale-90">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </button>
                 </div>
             </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-10 w-full max-w-[1750px] mx-auto">
              {activeView === 'pos' && <POS products={products} modifierGroups={modifierGroups} categoryModifiers={categoryModifiers} openTabs={openTabs} onSaveTab={handleSaveTab} onUpdateTabItem={handleUpdateTabItem} onDeleteTab={handleDeleteTab} onCompleteSale={handleCompleteSale} activeShift={shifts.find(s => s.status === 'open')} onViewChange={setActiveView} penduraThreshold={penduraThreshold} longDurationThreshold={longDurationThreshold} dbStatus={dbStatus} shortcutCheckout={shortcutCheckout} onClearShortcut={() => setShortcutCheckout(null)} />}
              {activeView === 'products' && <ProductList products={products} setProducts={handleUpdateProducts} modifierGroups={modifierGroups} setModifierGroups={setModifierGroups} categoryModifiers={categoryModifiers} setCategoryModifiers={setCategoryModifiers} categories={categories} setCategories={setCategories} openTabs={openTabs} onSaveTab={handleSaveTab} currentUser={currentUser} />}
              {activeView === 'shifts' && <ShiftControl shifts={shifts} onUpdateShifts={handleUpdateShifts} currentUser={currentUser} sales={sales} activeTabsCount={openTabs.length} />}
              {activeView === 'cash' && <CashManagement shifts={shifts} onUpdateShifts={handleUpdateShifts} sales={sales} currentUser={currentUser} onViewChange={setActiveView} />}
              {activeView === 'users' && <UserManagement users={users} units={units} onUpdateUsers={handleUpdateUsers} />}
              {activeView === 'dashboard' && <Dashboard sales={sales} products={products} theme={theme} />}
              {activeView === 'history' && <SalesHistory sales={sales} onDeleteSale={(id) => { const s = sales.find(x => x.id === id); if(s) { const ns = {...s, deleted: true, deletedAt: Date.now(), deletedBy: currentUser.id}; persist('sales', ns, id); setSales(prev => prev.map(x => x.id === id ? ns : x)); } }} users={users} currentUser={currentUser} activeUnitId={activeUnitId} syncConfig={syncConfig} />}
              {activeView === 'reports' && <Reports sales={sales} products={products} users={users} shifts={shifts} currentUser={currentUser} onQuitarPendura={(name, amt) => { setShortcutCheckout({ name, amount: amt }); setActiveView('pos'); }} penduraThreshold={penduraThreshold} activeUnitId={activeUnitId} syncConfig={syncConfig} theme={theme} />}
              {activeView === 'settings' && <Settings products={products} sales={sales} openTabs={openTabs} users={users} shifts={shifts} units={units} onUpdateUnits={setUnits} onImport={handleDataManagement} dbStatus={dbStatus} currentUser={currentUser} penduraThreshold={penduraThreshold} setPenduraThreshold={setPenduraThreshold} longDurationThreshold={longDurationThreshold} setLongDurationThreshold={setLongDurationThreshold} />}
              {activeView === 'help' && <Help />}
          </div>

          {statusModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setStatusModalOpen(false)} />
              <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
                 <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-8 italic tracking-tighter leading-none">Diagnóstico de Saúde</h3>
                 <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Servidor Botequista</p>
                       <span className={`w-3 h-3 rounded-full ${serverHealth === 'ok' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Banco de Dados</p>
                       <span className={`w-3 h-3 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rede Local</p>
                       <span className={`w-3 h-3 rounded-full ${navigator.onLine ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                    </div>
                 </div>
                 {lastSyncTime && <p className="mt-8 text-[9px] font-black text-slate-400 uppercase italic">Última Resposta: {new Date(lastSyncTime).toLocaleTimeString()}</p>}
                 <button onClick={() => setStatusModalOpen(false)} className="mt-8 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Fechar Diagnóstico</button>
              </div>
            </div>
          )}
       </main>
       <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} currentUser={currentUser?.username || ''} activeView={activeView} />
    </div>
  );
};