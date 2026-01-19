
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Product, Sale, View, Theme, Tab, User, Shift, UserPermission, PaymentMethod, ModifierGroup, generateUniqueId } from './types';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import POS from './components/POS';
import SalesHistory from './components/SalesHistory';
import Sidebar from './components/Sidebar';
import Reports from './components/Reports';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import ShiftControl from './components/ShiftControl';
import CashManagement from './components/CashManagement';
import Help from './components/Help';
import Login from './components/Login';
import { saveToFirebase, loadFromFirebase, getFirebaseToken } from './services/firebaseService';

const isBrowser = typeof window !== 'undefined';
if (isBrowser && !(window as any).process) {
  (window as any).process = { env: {} };
}

const APP_VERSION = "3.4.0"; 
const MASTER_KEY = "REMOVED_FIREBASE_PASSWORD";
const SYSTEM_DB_URL = 'https://poc-botequista-default-rtdb.firebaseio.com';
const SYSTEM_API_KEY = 'REMOVED_FIREBASE_API_KEY'; 
const SYSTEM_AUTH_EMAIL = 'curupaco@gmail.com';
const SYSTEM_AUTH_PASS = 'REMOVED_FIREBASE_PASSWORD';

const viewTitles: Record<View, string> = {
  dashboard: 'Painel de Controle',
  pos: 'Vendas (PDV)',
  products: 'Cardápio e Serviços',
  history: 'Histórico de Vendas',
  reports: 'Relatórios Financeiros',
  settings: 'Ajustes do Sistema',
  users: 'Gestão de Equipe',
  shifts: 'Controle de Turnos',
  cash: 'Tesouraria',
  help: 'Guia de Operação'
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'pending' | 'success' | 'error'>('idle');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [versionMismatch, setVersionMismatch] = useState(false);
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState(false);

  const isInitialLoadDone = useRef(false);
  const lastCloudUpdate = useRef<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [penduraThreshold, setPenduraThreshold] = useState(500);
  const [pendingShortcut, setPendingShortcut] = useState<{name: string, amount: number} | null>(null);

  const activeShift = useMemo(() => (shifts || []).find(s => s.status === 'open'), [shifts]);
  const activeTabsCount = useMemo(() => (openTabs || []).filter(t => (t.items || []).length > 0).length, [openTabs]);

  const totalPendura = useMemo(() => {
    let total = 0;
    (sales || []).forEach(s => {
       if (s.paymentMethod === PaymentMethod.PENDURA) total += s.total;
       else if (s.items?.some(it => it.productId === 'quitacao')) total -= s.total;
    });
    return Math.max(0, total);
  }, [sales]);

  const ALL_ADMIN_PERMISSIONS: UserPermission[] = [
    'dashboard', 'pos', 'products', 'history', 'reports', 'settings', 
    'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift', 
    'delete_sale', 'delete_product', 'edit_product', 'export_report', 
    'clear_fiado', 'full_reset', 'manage_backup', 'help_view'
  ];

  useEffect(() => {
    if (!isBrowser) return;
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const fetchInitialData = useCallback(async (isSilent = false) => {
    if (!isSilent) setDbStatus('loading');
    try {
      const token = await getFirebaseToken(SYSTEM_AUTH_EMAIL, SYSTEM_AUTH_PASS, SYSTEM_API_KEY);
      const cloudData = await loadFromFirebase(SYSTEM_DB_URL, MASTER_KEY, token);
      
      if (cloudData) {
        if (cloudData.minRequiredVersion && isVersionOlder(APP_VERSION, cloudData.minRequiredVersion)) {
           setVersionMismatch(true);
           return;
        }
        handleImportAll(cloudData);
        lastCloudUpdate.current = cloudData.updatedAt;
        setDbStatus('success');
      } else {
        setUsers([{ id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: ALL_ADMIN_PERMISSIONS }]);
        setDbStatus('idle');
      }
    } catch (e) { setDbStatus('error'); } finally { isInitialLoadDone.current = true; }
  }, []);

  function isVersionOlder(local: string, remote: string) {
    const l = local.split('.').map(Number);
    const r = remote.split('.').map(Number);
    for (let i = 0; i < Math.max(l.length, r.length); i++) {
      if ((l[i] || 0) < (r[i] || 0)) return true;
      if ((l[i] || 0) > (r[i] || 0)) return false;
    }
    return false;
  }

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(() => { if (currentUser) fetchInitialData(true); }, 60000);
    return () => clearInterval(interval);
  }, [fetchInitialData, currentUser]);

  useEffect(() => {
    if (!isInitialLoadDone.current || versionMismatch) return;
    setDbStatus('pending');
    const debounce = setTimeout(async () => {
      try {
        const token = await getFirebaseToken(SYSTEM_AUTH_EMAIL, SYSTEM_AUTH_PASS, SYSTEM_API_KEY);
        await saveToFirebase(SYSTEM_DB_URL, { products, modifierGroups, sales, openTabs, users, shifts, config: { penduraThreshold }, minRequiredVersion: APP_VERSION }, MASTER_KEY, token);
        setDbStatus('success');
      } catch (e) { setDbStatus('error'); }
    }, 2000);
    return () => clearTimeout(debounce);
  }, [products, modifierGroups, sales, openTabs, users, shifts, penduraThreshold, versionMismatch]);

  const handleImportAll = (data: any) => {
    if (data.products) setProducts(data.products);
    if (data.modifierGroups) setModifierGroups(data.modifierGroups);
    if (data.sales) setSales(data.sales);
    if (data.openTabs) setOpenTabs(data.openTabs);
    if (data.config?.penduraThreshold) setPenduraThreshold(data.config.penduraThreshold);
    if (data.users?.length) {
      setUsers((data.users as User[]).map(u => (u.username === 'admin') ? { ...u, permissions: ALL_ADMIN_PERMISSIONS } : u));
    }
    if (data.shifts) setShifts(data.shifts);
  };

  const handleLogout = () => setShowLogoutConfirm(true);

  if (versionMismatch) return <div className="min-h-screen bg-red-600 flex items-center justify-center p-8 text-white text-center"><div><h1 className="text-4xl font-black mb-4">ATUALIZAÇÃO NECESSÁRIA</h1><button onClick={() => window.location.reload()} className="bg-white text-red-600 px-12 py-5 rounded-2xl font-black uppercase shadow-2xl">Recarregar Agora</button></div></div>;

  if (!currentUser) return <Login onLogin={(u, p) => {
    const found = users.find(x => x.username === u && x.password === p);
    if (found) setCurrentUser(found);
    else setLoginError("USUÁRIO OU SENHA INVÁLIDOS");
  }} isLoading={dbStatus === 'loading'} error={loginError} />;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} dbStatus={dbStatus} isOnline={true} currentUser={currentUser} onLogout={handleLogout} isShiftOpen={!!activeShift} activeTabsCount={activeTabsCount} totalPendura={totalPendura} penduraThreshold={penduraThreshold} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg md:hidden text-slate-600 dark:text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{viewTitles[activeView]}</h1>
          </div>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.071 16.071l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg></button>
        </header>
        <div className="p-8 h-full overflow-y-auto">
          {activeView === 'pos' ? <POS products={products} modifierGroups={modifierGroups} openTabs={openTabs} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales(prev => [{...s, userId: currentUser.id, shiftId: activeShift?.id || ''}, ...prev])} activeShift={activeShift} onViewChange={setActiveView} shortcutCheckout={pendingShortcut} onClearShortcut={() => setPendingShortcut(null)} /> : 
           activeView === 'products' ? <ProductList products={products} modifierGroups={modifierGroups} setModifierGroups={setModifierGroups} onAdd={p => setProducts(v => [...v, p])} onDelete={id => setProducts(v => v.filter(p => p.id !== id))} onUpdate={u => setProducts(v => v.map(p => p.id === u.id ? u : p))} currentUser={currentUser} /> :
           activeView === 'help' ? <Help /> :
           activeView === 'dashboard' ? <Dashboard sales={sales} products={products} theme={theme} /> :
           activeView === 'history' ? <SalesHistory sales={sales} onDeleteSale={id => setSales(s => s.filter(x => x.id !== id))} users={users} currentUser={currentUser} /> :
           activeView === 'reports' ? <Reports sales={sales} products={products} users={users} shifts={shifts} currentUser={currentUser} onQuitarPendura={(name, amount) => { setPendingShortcut({name, amount}); setActiveView('pos'); }} /> :
           activeView === 'users' ? <UserManagement users={users} onUpdateUsers={setUsers} /> :
           activeView === 'shifts' ? <ShiftControl shifts={shifts} onUpdateShifts={setShifts} currentUser={currentUser} sales={sales} activeTabsCount={activeTabsCount} /> :
           activeView === 'cash' ? <CashManagement shifts={shifts} onUpdateShifts={setShifts} sales={sales} currentUser={currentUser} onViewChange={setActiveView} /> :
           activeView === 'settings' ? <Settings products={products} sales={sales} openTabs={openTabs} users={users} shifts={shifts} onImport={handleImportAll} currentUser={currentUser} penduraThreshold={penduraThreshold} setPenduraThreshold={setPenduraThreshold} dbStatus={dbStatus} /> : null}
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-6">Encerrar Sessão?</h3>
              <div className="flex flex-col gap-3">
                 <button onClick={() => setCurrentUser(null)} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs active:scale-95">Sair Agora</button>
                 <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-5 font-black uppercase text-xs text-slate-400">Cancelar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
