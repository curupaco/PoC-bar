
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
import { saveToFirebase, loadFromFirebase } from './services/firebaseService';

// Proteção global contra falhas de build em ambientes Node.js (Vercel Build Step)
const isBrowser = typeof window !== 'undefined';
if (isBrowser && !(window as any).process) {
  (window as any).process = { env: {} };
}

const getSafeEnv = (key: string): string | undefined => {
  try {
    return (process.env as any)[key];
  } catch {
    return undefined;
  }
};

// Prioriza a variável de ambiente da Vercel sobre o valor padrão
const ENV_FB_URL = getSafeEnv('FIREBASE_URL');
const DEFAULT_FB_URL = 'https://poc-botequista-default-rtdb.firebaseio.com';
const MASTER_KEY = "Tc@00216587";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [encryptionKey] = useState<string>(MASTER_KEY);
  const [activeView, setActiveView] = useState<View>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isOnline, setIsOnline] = useState(isBrowser ? navigator.onLine : true);
  const [shortcutCheckout, setShortcutCheckout] = useState<{ name: string; amount: number } | null>(null);
  
  const isInitialMount = useRef(true);
  const isSyncingFromCloud = useRef(false);

  const [fbUrl, setFbUrl] = useState(() => {
    if (isBrowser) {
      const saved = localStorage.getItem('bar_fb_url');
      if (saved) return saved;
      if (ENV_FB_URL) return ENV_FB_URL;
    }
    return DEFAULT_FB_URL;
  });
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (isBrowser) {
      const saved = localStorage.getItem('bar_theme');
      return (saved as Theme) || 'dark';
    }
    return 'dark';
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const activeShift = useMemo(() => shifts.find(s => s.status === 'open'), [shifts]);

  const ALL_ADMIN_PERMISSIONS: UserPermission[] = [
    'dashboard', 'pos', 'products', 'history', 'reports', 'settings', 
    'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift', 
    'delete_sale', 'delete_product', 'edit_product', 'export_report', 
    'clear_fiado', 'full_reset', 'manage_backup', 'help_view'
  ];

  useEffect(() => {
    if (!isBrowser) return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Carregamento Inicial
    const p = localStorage.getItem('bar_products');
    const s = localStorage.getItem('bar_sales');
    const t = localStorage.getItem('bar_open_tabs');
    const u = localStorage.getItem('bar_users');
    const sh = localStorage.getItem('bar_shifts');
    
    try {
      if (p) setProducts(JSON.parse(p));
      else setProducts([{ id: '1', name: 'CERVEJA LATA 350ML', price: 6.00, category: 'BEBIDAS', sellType: 'unit' }]);
      if (s) setSales(JSON.parse(s));
      if (t) setOpenTabs(JSON.parse(t));
      
      let initialUsers: User[] = u ? JSON.parse(u) : [
        { id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: ALL_ADMIN_PERMISSIONS }
      ];
      setUsers(initialUsers.map(usr => usr.username === 'admin' ? { ...usr, permissions: ALL_ADMIN_PERMISSIONS } : usr));
      if (sh) setShifts(JSON.parse(sh));
    } catch (e) { console.error("Cache error", e); }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = (user: string, pass: string) => {
    const found = users.find(u => u.username === user && u.password === pass);
    if (found) {
      setLoginError(null);
      setCurrentUser(found.username === 'admin' ? { ...found, permissions: ALL_ADMIN_PERMISSIONS } : found);
    } else {
      setLoginError("USUÁRIO OU SENHA INVÁLIDOS");
    }
  };

  useEffect(() => {
    if (!isBrowser || isInitialMount.current) {
      if (isInitialMount.current) isInitialMount.current = false;
      return;
    }

    localStorage.setItem('bar_products', JSON.stringify(products));
    localStorage.setItem('bar_sales', JSON.stringify(sales));
    localStorage.setItem('bar_open_tabs', JSON.stringify(openTabs));
    localStorage.setItem('bar_users', JSON.stringify(users));
    localStorage.setItem('bar_shifts', JSON.stringify(shifts));
    localStorage.setItem('bar_theme', theme);
    localStorage.setItem('bar_fb_url', fbUrl);
    
    document.documentElement.classList.toggle('dark', theme === 'dark');

    if (fbUrl && !isSyncingFromCloud.current) {
      const timer = setTimeout(() => {
        saveToFirebase(fbUrl, { products, sales, openTabs, users, shifts, config: { fbUrl } }, encryptionKey)
          .then(() => setDbStatus('success'))
          .catch(() => setDbStatus('error'));
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [products, sales, openTabs, users, shifts, fbUrl, theme]);

  useEffect(() => {
    if (fbUrl && isBrowser) {
      setDbStatus('loading');
      loadFromFirebase(fbUrl, encryptionKey)
        .then((data: any) => data ? handleImportAll(data) : setDbStatus('idle'))
        .catch(() => setDbStatus('error'));
    }
  }, []);

  const handleImportAll = (data: any) => {
    isSyncingFromCloud.current = true;
    if (data.products) setProducts(data.products);
    if (data.sales) setSales(data.sales);
    if (data.openTabs) setOpenTabs(data.openTabs);
    if (data.users) setUsers((data.users as User[]).map(u => u.username === 'admin' ? { ...u, permissions: ALL_ADMIN_PERMISSIONS } : u));
    if (data.shifts) setShifts(data.shifts);
    setDbStatus('success');
    setTimeout(() => { isSyncingFromCloud.current = false; }, 500);
  };

  if (!currentUser) return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading'} error={loginError} />;

  const renderContent = () => {
    const props = { products, sales, openTabs, users, shifts, currentUser };
    switch (activeView) {
      case 'dashboard': return <Dashboard {...props} theme={theme} />;
      case 'pos': return <POS {...props} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales(prev => [{ ...s, userId: currentUser.id, shiftId: activeShift?.id || '' }, ...prev])} shortcutCheckout={shortcutCheckout} onClearShortcut={() => setShortcutCheckout(null)} activeShift={activeShift} onViewChange={setActiveView} />;
      case 'products': return <ProductList products={products} onAdd={p => setProducts(v => [...v, p])} onDelete={id => setProducts(v => v.filter(p => p.id !== id))} onUpdate={u => setProducts(v => v.map(p => p.id === u.id ? u : p))} currentUser={currentUser} />;
      case 'history': return <SalesHistory sales={sales} onDeleteSale={id => setSales(v => v.filter(s => s.id !== id))} users={users} currentUser={currentUser} />;
      case 'reports': return <Reports {...props} onQuitarPendura={(n, a) => { setShortcutCheckout({ name: n, amount: a }); setActiveView('pos'); }} />;
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
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} dbStatus={dbStatus} isOnline={isOnline} currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 lg:px-8 lg:py-4 flex justify-between items-center ml-0 md:ml-64">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg md:hidden text-slate-600 dark:text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <h1 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter leading-none">{menuItems.find(i => i.id === activeView)?.label}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'} animate-pulse`} title={dbStatus === 'success' ? 'Nuvem Conectada' : 'Erro de Conexão'}></div>
              <span className="hidden sm:inline text-[9px] font-black uppercase text-slate-400 tracking-widest">{dbStatus === 'success' ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} 
              className="relative w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-md border border-slate-200 dark:border-slate-700 transition-all active:scale-90"
              title="Trocar Tema"
            >
              <div className="absolute transition-all duration-500 rotate-0 dark:rotate-[360deg] scale-100 dark:scale-0 opacity-100 dark:opacity-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.071 16.071l.707.707M7.929 7.929l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
              </div>
              <div className="absolute transition-all duration-500 rotate-[-360deg] dark:rotate-0 scale-0 dark:scale-100 opacity-0 dark:opacity-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              </div>
            </button>
          </div>
        </header>
        <div className="p-4 lg:p-8 ml-0 md:ml-64 h-full overflow-y-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
