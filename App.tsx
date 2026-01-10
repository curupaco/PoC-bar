
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Sale, View, Theme, Tab, User, Shift, UserPermission } from './types';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import POS from './components/POS';
import SalesHistory from './components/SalesHistory';
import Sidebar, { menuItems } from './components/Sidebar';
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

// CONFIGURAÇÕES MESTRE DO FIREBASE (Fornecidas pelo usuário)
const MASTER_KEY = "REMOVED_FIREBASE_PASSWORD";
const DEFAULT_FB_URL = 'https://poc-botequista-default-rtdb.firebaseio.com';
const DEFAULT_FB_API_KEY = 'REMOVED_FIREBASE_API_KEY'; 
const DEFAULT_EMAIL = 'curupaco@gmail.com';
const DEFAULT_PASS = 'REMOVED_FIREBASE_PASSWORD';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  
  const isSyncingFromCloud = useRef(false);
  const isInitialLoadDone = useRef(false);

  // Estados dos Dados
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  // TEMA: Forçado 'dark' se não houver preferência salva
  const [theme, setTheme] = useState<Theme>(() => {
    if (!isBrowser) return 'dark';
    const saved = localStorage.getItem('bar_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [fbUrl, setFbUrl] = useState(() => (isBrowser && localStorage.getItem('bar_fb_url')) || DEFAULT_FB_URL);

  const activeShift = useMemo(() => shifts.find(s => s.status === 'open'), [shifts]);

  const ALL_ADMIN_PERMISSIONS: UserPermission[] = [
    'dashboard', 'pos', 'products', 'history', 'reports', 'settings', 
    'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift', 
    'delete_sale', 'delete_product', 'edit_product', 'export_report', 
    'clear_fiado', 'full_reset', 'manage_backup', 'help_view'
  ];

  // Aplica a classe 'dark' imediatamente no carregamento e mudanças
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

  // Função auxiliar para obter a chave API do Firebase
  const getActiveFirebaseApiKey = () => {
    return localStorage.getItem('fb_api_key') || DEFAULT_FB_API_KEY;
  };

  // 1. CARREGAMENTO INICIAL DE DADOS
  useEffect(() => {
    if (!isBrowser) return;
    
    const fetchInitialData = async () => {
      setDbStatus('loading');
      try {
        const apiKey = getActiveFirebaseApiKey();
        let token: string | undefined;
        
        if (apiKey) {
          try {
            token = await getFirebaseToken(DEFAULT_EMAIL, DEFAULT_PASS, apiKey);
          } catch (err) {
            console.warn("Auth Firebase falhou no boot. Usando cache local.");
          }
        }
        
        const cloudData = await loadFromFirebase(fbUrl, MASTER_KEY, token);
        if (cloudData) {
          handleImportAll(cloudData);
          setLastSyncTime(cloudData.updatedAt || new Date().toISOString());
          setDbStatus('success');
        } else {
          setDbStatus('idle');
          const p = localStorage.getItem('bar_products');
          if (p) setProducts(JSON.parse(p));
          const u = localStorage.getItem('bar_users');
          if (u) setUsers(JSON.parse(u));
        }
      } catch (e) {
        setDbStatus('error');
        const p = localStorage.getItem('bar_products');
        if (p) setProducts(JSON.parse(p));
      } finally {
        isInitialLoadDone.current = true;
      }
    };

    fetchInitialData();
  }, [fbUrl]);

  // 2. POLLING (Sincronização a cada 15s)
  useEffect(() => {
    if (!isBrowser || !currentUser) return;

    const interval = setInterval(async () => {
      if (isSyncingFromCloud.current) return;
      
      try {
        const apiKey = getActiveFirebaseApiKey();
        let token: string | undefined;
        
        if (apiKey) {
          try {
            token = await getFirebaseToken(DEFAULT_EMAIL, DEFAULT_PASS, apiKey);
          } catch (e) { /* ignore */ }
        }
        
        const cloudData = await loadFromFirebase(fbUrl, MASTER_KEY, token);
        if (cloudData && cloudData.updatedAt && cloudData.updatedAt > lastSyncTime) {
          handleImportAll(cloudData);
          setLastSyncTime(cloudData.updatedAt);
        }
        setDbStatus('success');
      } catch (e) {
        setDbStatus('error');
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser, fbUrl, lastSyncTime]);

  // 3. PERSISTÊNCIA AUTOMÁTICA
  useEffect(() => {
    if (!isInitialLoadDone.current || isSyncingFromCloud.current) return;

    localStorage.setItem('bar_products', JSON.stringify(products));
    localStorage.setItem('bar_users', JSON.stringify(users));
    localStorage.setItem('bar_fb_url', fbUrl);

    const pushData = async () => {
      try {
        const apiKey = getActiveFirebaseApiKey();
        let token: string | undefined;
        
        if (apiKey) {
          try {
            token = await getFirebaseToken(DEFAULT_EMAIL, DEFAULT_PASS, apiKey);
          } catch (e) { /* silent fail */ }
        }
        
        const now = new Date().toISOString();
        await saveToFirebase(fbUrl, { products, sales, openTabs, users, shifts, updatedAt: now }, MASTER_KEY, token);
        setLastSyncTime(now);
        setDbStatus('success');
      } catch (e) {
        setDbStatus('error');
      }
    };

    const debounce = setTimeout(pushData, 3000);
    return () => clearTimeout(debounce);
  }, [products, sales, openTabs, users, shifts]);

  const handleImportAll = (data: any) => {
    isSyncingFromCloud.current = true;
    if (data.products) setProducts(data.products);
    if (data.sales) setSales(data.sales);
    if (data.openTabs) setOpenTabs(data.openTabs);
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
      setLoginError("SENHA OU USUÁRIO INCORRETOS NESTE BAR");
    }
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
      case 'settings': return <Settings {...props} fbUrl={fbUrl} setFbUrl={setFbUrl} onImport={handleImportAll} dbStatus={dbStatus} onStatusChange={setDbStatus} />;
      case 'help': return <Help />;
      default: return <POS {...props} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales(prev => [s, ...prev])} activeShift={activeShift} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} dbStatus={dbStatus} isOnline={true} currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 lg:px-8 lg:py-4 flex justify-between items-center ml-0 md:ml-64">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg md:hidden text-slate-600 dark:text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <h1 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter leading-none">{menuItems.find(i => i.id === activeView)?.label}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden sm:flex">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{dbStatus === 'success' ? 'BAR SINCRONIZADO' : 'BUSCANDO NUVEM'}</span>
              </div>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">Sincronizado: {new Date(lastSyncTime).toLocaleTimeString()}</p>
            </div>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all">
              {theme === 'dark' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.071 16.071l.707.707M7.929 7.929l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
          </div>
        </header>
        <div className="p-4 lg:p-8 ml-0 md:ml-64 h-full overflow-y-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
