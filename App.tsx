
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Sale, View, Theme, Tab, User, Shift } from './types';
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
import Login from './components/Login';
import { saveToFirebase, loadFromFirebase, AppFullData } from './services/firebaseService';

const DEFAULT_FB_URL = 'https://poc-botequista-default-rtdb.firebaseio.com';
const FIXED_FB_URL = process.env.FIREBASE_URL || DEFAULT_FB_URL;
const MASTER_KEY = "REMOVED_FIREBASE_PASSWORD";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [encryptionKey] = useState<string>(MASTER_KEY);

  const [activeView, setActiveView] = useState<View>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [shortcutCheckout, setShortcutCheckout] = useState<{ name: string; amount: number } | null>(null);
  
  const isInitialMount = useRef(true);
  const isSyncingFromCloud = useRef(false);

  const [fbUrl, setFbUrl] = useState(() => localStorage.getItem('bar_fb_url') || FIXED_FB_URL);
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('bar_theme');
    return (saved as Theme) || 'dark';
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const activeShift = useMemo(() => shifts.find(s => s.status === 'open'), [shifts]);

  // Função para normalização agressiva de categorias (CACHETA -> Cacheta)
  const normalizeCategories = (prods: Product[]): Product[] => {
    return prods.map(p => ({
      ...p,
      category: (p.category === 'CACHETA' || p.category === 'Cacheta') ? 'Cacheta' : p.category
    }));
  };

  // Atualiza status de rede
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const p = localStorage.getItem('bar_products');
    const s = localStorage.getItem('bar_sales');
    const t = localStorage.getItem('bar_open_tabs');
    const u = localStorage.getItem('bar_users');
    const sh = localStorage.getItem('bar_shifts');
    
    try {
      if (p) {
        const loadedProducts = JSON.parse(p);
        setProducts(normalizeCategories(loadedProducts));
      } else {
        setProducts([
          { id: '1', name: 'Cerveja Lata 350ml', price: 6.00, category: 'Bebidas', sellType: 'unit' },
          { id: '2', name: 'Batata Frita', price: 45.00, category: 'Porções', sellType: 'weight' },
        ]);
      }
      if (s) setSales(JSON.parse(s));
      if (t) setOpenTabs(JSON.parse(t));
      
      let initialUsers: User[] = [];
      const allAdminPerms: any[] = ['dashboard', 'pos', 'products', 'history', 'reports', 'settings', 'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift', 'delete_sale', 'delete_product', 'edit_product', 'export_report', 'clear_fiado', 'full_reset', 'manage_backup'];
      const standardPerms: any[] = ['dashboard', 'pos', 'history'];
      
      if (u) {
        initialUsers = JSON.parse(u);
        if (!initialUsers.find(u => u.username === 'admin')) {
          initialUsers.push({ id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: allAdminPerms });
        }
        if (!initialUsers.find(u => u.username === 'ozzy')) {
          initialUsers.push({ id: 'user-ozzy', username: 'ozzy', password: 'ozzy', displayName: 'Ozzy Osbourne', permissions: standardPerms });
        }
        
        initialUsers = initialUsers.map(user => {
          if (user.username === 'admin') {
            return { ...user, permissions: Array.from(new Set([...user.permissions, ...allAdminPerms])) };
          }
          return user;
        });
      } else {
        const admin: User = { 
          id: 'admin', 
          username: 'admin', 
          password: 'admin', 
          displayName: 'Administrador', 
          permissions: allAdminPerms 
        };
        const ozzy: User = { 
          id: 'user-ozzy', 
          username: 'ozzy', 
          password: 'ozzy', 
          displayName: 'Ozzy Osbourne', 
          permissions: standardPerms 
        };
        initialUsers = [admin, ozzy];
      }
      setUsers(initialUsers);

      if (sh) setShifts(JSON.parse(sh));
    } catch (e) { console.error("Erro ao carregar cache local", e); }
  }, []);

  const handleLogin = (user: string, pass: string) => {
    const found = users.find(u => u.username === user && u.password === pass);
    if (found) {
      setCurrentUser(found);
      if (!found.permissions.includes(activeView as any) && found.username !== 'admin') {
        setActiveView(found.permissions.includes('pos') ? 'pos' : (found.permissions[0] as any) || 'pos');
      }
    } else {
      alert("Usuário ou senha inválidos.");
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    localStorage.setItem('bar_products', JSON.stringify(products));
    localStorage.setItem('bar_sales', JSON.stringify(sales));
    localStorage.setItem('bar_open_tabs', JSON.stringify(openTabs));
    localStorage.setItem('bar_users', JSON.stringify(users));
    localStorage.setItem('bar_shifts', JSON.stringify(shifts));
    localStorage.setItem('bar_theme', theme);
    
    const root = window.document.documentElement;
    root.classList.remove('dark');
    if (theme === 'dark') root.classList.add('dark');

    if (fbUrl && !isInitialMount.current && !isSyncingFromCloud.current) {
      const timer = setTimeout(() => {
        const fullData = { products, sales, openTabs, users, shifts, config: { fbUrl } };
        saveToFirebase(fbUrl, fullData, encryptionKey)
          .then(() => setDbStatus('success'))
          .catch(() => setDbStatus('error'));
      }, 1500); 
      return () => clearTimeout(timer);
    }
    
    if (isInitialMount.current) isInitialMount.current = false;
  }, [products, sales, openTabs, users, shifts, fbUrl, theme]);

  useEffect(() => {
    const urlToLoad = fbUrl || FIXED_FB_URL;
    if (urlToLoad) {
      setDbStatus('loading');
      loadFromFirebase(urlToLoad, encryptionKey)
        .then((data: any) => {
          if (data) handleImportAll(data);
          else setDbStatus('idle');
        })
        .catch(() => setDbStatus('error'));
    }
  }, []);

  const handleImportAll = (data: any) => {
    isSyncingFromCloud.current = true;
    if (data.products) setProducts(normalizeCategories(data.products));
    if (data.sales) setSales(data.sales);
    if (data.openTabs) setOpenTabs(data.openTabs);
    if (data.users) {
      const importedUsers = data.users as User[];
      if (!importedUsers.find(u => u.username === 'ozzy')) {
        importedUsers.push({ id: 'user-ozzy', username: 'ozzy', password: 'ozzy', displayName: 'Ozzy Osbourne', permissions: ['dashboard', 'pos', 'history'] });
      }
      setUsers(importedUsers);
    }
    if (data.shifts) setShifts(data.shifts);
    setDbStatus('success');
    setTimeout(() => { isSyncingFromCloud.current = false; }, 500);
  };

  const handleQuitarPendura = (customerName: string, amount: number) => {
    setShortcutCheckout({ name: customerName, amount });
    setActiveView('pos');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading'} error={null} />;
  }

  const renderContent = () => {
    const commonProps = { products, sales, openTabs };
    switch (activeView) {
      case 'dashboard': return <Dashboard {...commonProps} theme={theme} />;
      case 'products': return <ProductList products={products} onAdd={p => setProducts(prev => normalizeCategories([...prev, p]))} onDelete={id => setProducts(prev => prev.filter(p => p.id !== id))} onUpdate={u => setProducts(prev => normalizeCategories(prev.map(p => p.id === u.id ? u : p)))} currentUser={currentUser} />;
      case 'pos': return (
        <POS 
          products={products} 
          openTabs={openTabs} 
          onUpdateTabs={setOpenTabs} 
          onCompleteSale={s => setSales(prev => [{ ...s, userId: currentUser.id, shiftId: activeShift?.id || '' }, ...prev])} 
          shortcutCheckout={shortcutCheckout}
          onClearShortcut={() => setShortcutCheckout(null)}
          activeShift={activeShift}
          onViewChange={setActiveView}
        />
      );
      case 'history': return <SalesHistory sales={sales} onDeleteSale={id => setSales(prev => prev.filter(s => s.id !== id))} users={users} currentUser={currentUser} />;
      case 'reports': return <Reports sales={sales} products={products} users={users} shifts={shifts} onQuitarPendura={handleQuitarPendura} currentUser={currentUser} />;
      case 'users': return <UserManagement users={users} onUpdateUsers={setUsers} />;
      case 'shifts': return <ShiftControl shifts={shifts} onUpdateShifts={setShifts} currentUser={currentUser} sales={sales} />;
      case 'cash': return <CashManagement shifts={shifts} onUpdateShifts={setShifts} sales={sales} currentUser={currentUser} />;
      case 'settings': return <Settings {...commonProps} fbUrl={fbUrl} setFbUrl={setFbUrl} onImport={handleImportAll} dbStatus={dbStatus} onStatusChange={setDbStatus} currentUser={currentUser} />;
      default: return <POS products={products} openTabs={openTabs} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales(prev => [{ ...s, userId: currentUser.id, shiftId: activeShift?.id || '' }, ...prev])} activeShift={activeShift} onViewChange={setActiveView} />;
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
        isOnline={isOnline}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 lg:px-8 lg:py-4 flex justify-between items-center ml-0 md:ml-64">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg md:hidden text-slate-600 dark:text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <h1 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {menuItems.find(i => i.id === activeView)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {activeShift ? (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Turno Ativo
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-[10px] font-black uppercase">
                Fora de Turno
              </div>
            )}
            <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all shadow-sm">
              {theme === 'light' ? '🌙' : '🌞'}
            </button>
          </div>
        </header>
        <div className="p-4 lg:p-8 ml-0 md:ml-64 h-full overflow-y-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
