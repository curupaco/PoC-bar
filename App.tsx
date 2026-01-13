
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Product, Sale, View, Theme, Tab, User, Shift, UserPermission, PaymentMethod, generateUniqueId } from './types';
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

const MASTER_KEY = "REMOVED_FIREBASE_PASSWORD";
// Credenciais internas do sistema (Invisíveis ao usuário)
const SYSTEM_DB_URL = 'https://poc-botequista-default-rtdb.firebaseio.com';
const SYSTEM_API_KEY = 'REMOVED_FIREBASE_API_KEY'; 
const SYSTEM_AUTH_EMAIL = 'curupaco@gmail.com';
const SYSTEM_AUTH_PASS = 'REMOVED_FIREBASE_PASSWORD';

const viewTitles: Record<View, string> = {
  dashboard: 'Painel de Controle',
  pos: 'Vendas (PDV)',
  products: 'Cardápio de Itens',
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
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  
  const [pendingShortcut, setPendingShortcut] = useState<{name: string, amount: number} | null>(null);
  const [penduraThreshold, setPenduraThreshold] = useState(500);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isSyncingFromCloud = useRef(false);
  const isInitialLoadDone = useRef(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');

  const activeShift = useMemo(() => (shifts || []).find(s => s.status === 'open'), [shifts]);
  const activeTabsCount = useMemo(() => (openTabs || []).filter(t => (t.items || []).length > 0).length, [openTabs]);
  
  const canSeeDashboard = useMemo(() => currentUser?.permissions.includes('dashboard'), [currentUser]);
  const canSeeReports = useMemo(() => currentUser?.permissions.includes('reports'), [currentUser]);

  const totalPendura = useMemo(() => {
    let total = 0;
    for (let i = 0; i < sales.length; i++) {
       const s = sales[i];
       if (s.paymentMethod === PaymentMethod.PENDURA) total += s.total;
       else if (s.items?.some(it => it.productId === 'quitacao')) total -= s.total;
    }
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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const forceSyncToCloud = useCallback(async (currentData: any) => {
    if (!isInitialLoadDone.current) return;
    try {
      setDbStatus('loading');
      const token = await getFirebaseToken(SYSTEM_AUTH_EMAIL, SYSTEM_AUTH_PASS, SYSTEM_API_KEY);
      const now = new Date().toISOString();
      await saveToFirebase(SYSTEM_DB_URL, { ...currentData, updatedAt: now }, MASTER_KEY, token);
      setLastSyncTime(now);
      setDbStatus('success');
    } catch (e) {
      setDbStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isBrowser) return;
    const fetchInitialData = async () => {
      setDbStatus('loading');
      try {
        const token = await getFirebaseToken(SYSTEM_AUTH_EMAIL, SYSTEM_AUTH_PASS, SYSTEM_API_KEY);
        const cloudData = await loadFromFirebase(SYSTEM_DB_URL, MASTER_KEY, token);
        if (cloudData) {
          handleImportAll(cloudData);
          if (cloudData.config?.penduraThreshold) setPenduraThreshold(cloudData.config.penduraThreshold);
          setLastSyncTime(cloudData.updatedAt || new Date().toISOString());
          setDbStatus('success');
        } else {
          setUsers([{ id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: ALL_ADMIN_PERMISSIONS }]);
          setDbStatus('idle');
        }
      } catch (e) { 
        setDbStatus('error'); 
      } finally { 
        isInitialLoadDone.current = true; 
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!isInitialLoadDone.current || isSyncingFromCloud.current) return;

    setDbStatus('pending');
    const debounce = setTimeout(() => {
      forceSyncToCloud({ 
        products, 
        sales, 
        openTabs, 
        users, 
        shifts, 
        config: { penduraThreshold } 
      });
    }, 1500);
    return () => clearTimeout(debounce);
  }, [products, sales, openTabs, users, shifts, penduraThreshold, forceSyncToCloud]);

  const handleImportAll = (data: any) => {
    isSyncingFromCloud.current = true;
    if (data.products) setProducts(data.products);
    if (data.sales) setSales(data.sales);
    if (data.openTabs) setOpenTabs(data.openTabs);
    if (data.config?.penduraThreshold) setPenduraThreshold(data.config.penduraThreshold);
    
    if (data.users && data.users.length > 0) {
      setUsers((data.users as User[]).map(u => (u.username === 'admin' || u.id === 'admin') ? { ...u, permissions: ALL_ADMIN_PERMISSIONS } : u));
    } else {
      setUsers([{ id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: ALL_ADMIN_PERMISSIONS }]);
    }
    
    if (data.shifts) setShifts(data.shifts);
    setDbStatus('success');
    setTimeout(() => { isSyncingFromCloud.current = false; }, 500);
  };

  const handleLogin = (user: string, pass: string) => {
    const found = users.find(u => u.username === user && u.password === pass);
    if (found) {
      setLoginError(null);
      setCurrentUser((found.username === 'admin' || found.id === 'admin') ? { ...found, permissions: ALL_ADMIN_PERMISSIONS } : found);
    } else {
      setLoginError("USUÁRIO OU SENHA INVÁLIDOS");
    }
  };

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setCurrentUser(null);
    setShowLogoutConfirm(false);
  };

  const handleCompleteSale = (sale: Sale) => {
    const saleWithContext = { ...sale, userId: currentUser?.id || '', shiftId: activeShift?.id || '' };
    setSales(prev => [saleWithContext, ...prev]);
  };

  const handleUpdateShifts = (newShifts: Shift[]) => {
    setShifts(newShifts);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (!currentUser) return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading'} error={loginError} />;

  const renderContent = () => {
    const props = { products, sales, openTabs, users, shifts, currentUser };
    switch (activeView) {
      case 'dashboard': return <Dashboard {...props} theme={theme} />;
      case 'pos': return (
        <POS 
          {...props} 
          onUpdateTabs={setOpenTabs} 
          onCompleteSale={handleCompleteSale} 
          activeShift={activeShift} 
          onViewChange={setActiveView}
          shortcutCheckout={pendingShortcut}
          onClearShortcut={() => setPendingShortcut(null)}
        />
      );
      case 'products': return <ProductList products={products} onAdd={p => setProducts(v => [...v, p])} onDelete={id => setProducts(v => v.filter(p => p.id !== id))} onUpdate={u => setProducts(v => v.map(p => p.id === u.id ? u : p))} currentUser={currentUser} />;
      case 'history': return <SalesHistory sales={sales} onDeleteSale={id => setSales(v => v.filter(s => s.id !== id))} users={users} currentUser={currentUser} />;
      case 'reports': return <Reports {...props} onQuitarPendura={(name, amount) => { setPendingShortcut({name, amount}); setActiveView('pos'); }} />;
      case 'users': return <UserManagement users={users} onUpdateUsers={setUsers} />;
      case 'shifts': return <ShiftControl {...props} onUpdateShifts={handleUpdateShifts} activeTabsCount={activeTabsCount} />;
      case 'cash': return <CashManagement {...props} onUpdateShifts={handleUpdateShifts} onViewChange={setActiveView} />;
      case 'settings': return <Settings {...props} onImport={handleImportAll} dbStatus={dbStatus} penduraThreshold={penduraThreshold} setPenduraThreshold={setPenduraThreshold} />;
      case 'help': return <Help />;
      default: return <POS {...props} onUpdateTabs={setOpenTabs} onCompleteSale={handleCompleteSale} activeShift={activeShift} />;
    }
  };

  const dbStatusLabel = {
    idle: 'Aguardando',
    loading: 'Carregando...',
    pending: 'Salvando...',
    success: 'Sincronizado',
    error: 'Erro de Conexão'
  }[dbStatus];

  const dbStatusColorClass = {
    idle: 'text-slate-400',
    loading: 'text-blue-500 animate-pulse',
    pending: 'text-orange-500 animate-pulse',
    success: 'text-emerald-500',
    error: 'text-red-500 animate-pulse'
  }[dbStatus];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        dbStatus={dbStatus} 
        isOnline={true} 
        currentUser={currentUser} 
        onLogout={handleLogoutRequest} 
        isShiftOpen={!!activeShift}
        activeTabsCount={activeTabsCount}
        totalPendura={totalPendura}
        penduraThreshold={penduraThreshold}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 lg:px-8 lg:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg md:hidden text-slate-600 dark:text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <h1 className="text-lg lg:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none italic">{viewTitles[activeView]}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${dbStatusColorClass}`}>
              {dbStatusLabel}
            </span>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all">
              {theme === 'dark' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.071 16.071l.707.707M7.929 7.929l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 h-full overflow-y-auto mb-16 md:mb-0">
          {renderContent()}
        </div>

        <nav className="fixed bottom-0 inset-x-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-40 md:hidden pb-safe">
           <button onClick={() => setActiveView('pos')} className={`flex flex-col items-center gap-1 ${activeView === 'pos' ? 'text-red-600' : 'text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="text-[8px] font-black uppercase">Venda</span>
           </button>
           {canSeeReports && (
             <button onClick={() => setActiveView('reports')} className={`flex flex-col items-center gap-1 ${activeView === 'reports' ? 'text-red-600' : 'text-slate-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span className="text-[8px] font-black uppercase">Relatórios</span>
             </button>
           )}
           {canSeeDashboard && (
             <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center gap-1 ${activeView === 'dashboard' ? 'text-red-600' : 'text-slate-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" /></svg>
                <span className="text-[8px] font-black uppercase">Painel</span>
             </button>
           )}
           <button onClick={() => setActiveView('shifts')} className={`flex flex-col items-center gap-1 ${activeView === 'shifts' ? 'text-red-600' : 'text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-[8px] font-black uppercase">Turno</span>
           </button>
        </nav>
      </main>

      {/* MODAL DE CONFIRMAÇÃO DE LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setShowLogoutConfirm(false)} />
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-20 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 tracking-tighter leading-none">Encerrar Sessão?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed px-4">
                Você precisará da sua senha para acessar o sistema novamente.
              </p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleLogoutConfirm} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Sair Agora</button>
                 <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600 transition-all">Continuar Operando</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
