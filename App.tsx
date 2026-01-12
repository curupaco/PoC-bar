
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Sale, View, Theme, Tab, User, Shift, UserPermission, PaymentMethod } from './types';
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
const ENV_FB_URL = (process.env as any).FIREBASE_URL;
const ENV_FB_API_KEY = (process.env as any).FIREBASE_API_KEY; 

const DEFAULT_FB_URL = ENV_FB_URL || 'https://poc-botequista-default-rtdb.firebaseio.com';
const DEFAULT_FB_API_KEY = ENV_FB_API_KEY || ''; 
const DEFAULT_EMAIL = 'curupaco@gmail.com';
const DEFAULT_PASS = 'REMOVED_FIREBASE_PASSWORD';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (!isBrowser) return false;
    return localStorage.getItem('bar_sidebar_collapsed') === 'true';
  });
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  
  // CONFIGURAÇÕES DO BAR
  const [penduraThreshold, setPenduraThreshold] = useState(() => {
    if (!isBrowser) return 500;
    const saved = localStorage.getItem('bar_pendura_threshold');
    return saved ? parseFloat(saved) : 500;
  });

  const isSyncingFromCloud = useRef(false);
  const isInitialLoadDone = useRef(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [theme, setTheme] = useState<Theme>(() => {
    if (!isBrowser) return 'dark';
    const saved = localStorage.getItem('bar_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [fbUrl, setFbUrl] = useState(() => (isBrowser && localStorage.getItem('bar_fb_url')) || DEFAULT_FB_URL);
  const activeShift = useMemo(() => shifts.find(s => s.status === 'open'), [shifts]);

  const activeTabsCount = useMemo(() => openTabs.filter(t => t.items.length > 0).length, [openTabs]);
  const totalPendura = useMemo(() => {
    return sales.reduce((acc, s) => {
      if (s.paymentMethod === PaymentMethod.PENDURA) return acc + s.total;
      if (s.items?.some(i => i.productId === 'quitacao')) return acc - s.total;
      return acc;
    }, 0);
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
    localStorage.setItem('bar_theme', theme);
  }, [theme]);

  const getActiveFirebaseApiKey = () => {
    return localStorage.getItem('fb_api_key') || DEFAULT_FB_API_KEY;
  };

  useEffect(() => {
    if (!isBrowser) return;
    const fetchInitialData = async () => {
      setDbStatus('loading');
      try {
        const apiKey = getActiveFirebaseApiKey();
        let token: string | undefined;
        if (apiKey && apiKey.length > 20) {
          try { token = await getFirebaseToken(DEFAULT_EMAIL, DEFAULT_PASS, apiKey); } catch (e) {}
        }
        const cloudData = await loadFromFirebase(fbUrl, MASTER_KEY, token);
        if (cloudData) {
          handleImportAll(cloudData);
          if (cloudData.config?.penduraThreshold) setPenduraThreshold(cloudData.config.penduraThreshold);
          setLastSyncTime(cloudData.updatedAt || new Date().toISOString());
          setDbStatus('success');
        } else {
          setDbStatus('idle');
          const p = localStorage.getItem('bar_products');
          if (p) setProducts(JSON.parse(p));
          const u = localStorage.getItem('bar_users');
          if (u) setUsers(JSON.parse(u));
        }
      } catch (e) { setDbStatus('error'); } finally { isInitialLoadDone.current = true; }
    };
    fetchInitialData();
  }, [fbUrl]);

  useEffect(() => {
    if (!isInitialLoadDone.current || isSyncingFromCloud.current) return;
    localStorage.setItem('bar_products', JSON.stringify(products));
    localStorage.setItem('bar_users', JSON.stringify(users));
    localStorage.setItem('bar_fb_url', fbUrl);
    localStorage.setItem('bar_pendura_threshold', penduraThreshold.toString());

    const pushData = async () => {
      try {
        const apiKey = getActiveFirebaseApiKey();
        let token: string | undefined;
        if (apiKey && apiKey.length > 20) {
          try { token = await getFirebaseToken(DEFAULT_EMAIL, DEFAULT_PASS, apiKey); } catch (e) {}
        }
        const now = new Date().toISOString();
        await saveToFirebase(fbUrl, { products, sales, openTabs, users, shifts, updatedAt: now, config: { fbUrl, penduraThreshold } }, MASTER_KEY, token);
        setLastSyncTime(now);
        setDbStatus('success');
      } catch (e) { setDbStatus('error'); }
    };
    const debounce = setTimeout(pushData, 3000);
    return () => clearTimeout(debounce);
  }, [products, sales, openTabs, users, shifts, penduraThreshold]);

  const handleImportAll = (data: any) => {
    isSyncingFromCloud.current = true;
    if (data.products) setProducts(data.products);
    if (data.sales) setSales(data.sales);
    if (data.openTabs) setOpenTabs(data.openTabs);
    if (data.config?.penduraThreshold) setPenduraThreshold(data.config.penduraThreshold);
    if (data.users && data.users.length > 0) {
      setUsers((data.users as User[]).map(u => u.username === 'admin' ? { ...u, permissions: ALL_ADMIN_PERMISSIONS } : u));
    } else if (users.length === 0) {
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
      setCurrentUser(found.username === 'admin' ? { ...found, permissions: ALL_ADMIN_PERMISSIONS } : found);
    } else {
      setLoginError("USUÁRIO OU SENHA INVÁLIDOS");
    }
  };

  const toggleSidebar = () => {
    const newVal = !isSidebarCollapsed;
    setIsSidebarCollapsed(newVal);
    localStorage.setItem('bar_sidebar_collapsed', String(newVal));
  };

  if (!currentUser) return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading'} error={loginError} />;

  const renderContent = () => {
    const props = { products, sales, openTabs, users, shifts, currentUser };
    switch (activeView) {
      case 'dashboard': return <Dashboard {...props} theme={theme} />;
      case 'pos': return <POS {...props} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales(prev => [{ ...s, userId: currentUser.id, shiftId: activeShift?.id || '' }, ...prev])} activeShift={activeShift} onViewChange={setActiveView} />;
      case 'products': return <ProductList products={products} onAdd={p => setProducts(v => [...v, p])} onDelete={id => setProducts(v => v.filter(p => p.id !== id))} onUpdate={u => setProducts(v => v.map(p => p.id === u.id ? u : p))} currentUser={currentUser} />;
      case 'history': return <SalesHistory sales={sales} onDeleteSale={id => setSales(v => v.filter(s => s.id !== id))} users={users} currentUser={currentUser} />;
      case 'reports': return <Reports {...props} onQuitarPendura={(n, a) => {}} />;
      case 'users': return <UserManagement users={users} onUpdateUsers={setUsers} />;
      case 'shifts': return <ShiftControl {...props} onUpdateShifts={setShifts} />;
      case 'cash': return <CashManagement {...props} onUpdateShifts={setShifts} />;
      case 'settings': return <Settings {...props} fbUrl={fbUrl} setFbUrl={setFbUrl} onImport={handleImportAll} dbStatus={dbStatus} onStatusChange={setDbStatus} penduraThreshold={penduraThreshold} setPenduraThreshold={setPenduraThreshold} />;
      case 'help': return <Help />;
      default: return <POS {...props} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales(prev => [s, ...prev])} activeShift={activeShift} />;
    }
  };

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
        onLogout={() => setCurrentUser(null)} 
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
            <h1 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter leading-none italic">{activeView}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'} animate-pulse`}></div>
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
           <button onClick={() => setActiveView('shifts')} className={`flex flex-col items-center gap-1 ${activeView === 'shifts' ? 'text-red-600' : 'text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-[8px] font-black uppercase">Turno</span>
           </button>
           <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center gap-1 ${activeView === 'dashboard' ? 'text-red-600' : 'text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span className="text-[8px] font-black uppercase">Painel</span>
           </button>
           <button onClick={() => setActiveView('cash')} className={`flex flex-col items-center gap-1 ${activeView === 'cash' ? 'text-red-600' : 'text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-[8px] font-black uppercase">Caixa</span>
           </button>
        </nav>
      </main>
    </div>
  );
};

export default App;
