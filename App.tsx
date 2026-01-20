
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, View, Theme, Tab, User, Shift, UserPermission, PaymentMethod, ModifierGroup } from './types';
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
import { hashPassword } from './services/cryptoService';
import { useSync } from './hooks/useSync';

const isBrowser = typeof window !== 'undefined';
if (isBrowser && !(window as any).process) {
  (window as any).process = { env: {} };
}

const APP_VERSION = "3.9.35"; 
const MASTER_KEY = "Tc@00216587";
const SYSTEM_DB_URL = 'https://poc-botequista-default-rtdb.firebaseio.com';
const SYSTEM_API_KEY = 'AIzaSyDyOVNXnb7iB7Wk7stxrTPvQW4qmWTSQqs'; 
const SYSTEM_AUTH_EMAIL = 'curupaco@gmail.com';
const SYSTEM_AUTH_PASS = 'Tc@00216587';

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

const ALL_ADMIN_PERMISSIONS: UserPermission[] = [
  'dashboard', 'pos', 'products', 'history', 'reports', 'settings', 
  'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift', 
  'delete_sale', 'delete_product', 'edit_product', 'export_report', 
  'clear_fiado', 'full_reset', 'manage_backup', 'help_view'
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'pending' | 'success' | 'error' | 'offline'>('idle');

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('btq-theme') as Theme) || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    if (theme === 'dark') root.classList.add('dark');
    localStorage.setItem('btq-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [categoryModifiers, setCategoryModifiers] = useState<Record<string, string>>({});
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [penduraThreshold, setPenduraThreshold] = useState(500);
  const [pendingShortcut, setPendingShortcut] = useState<{name: string, amount: number} | null>(null);

  const activeShift = useMemo(() => (shifts || []).find(s => s.status === 'open'), [shifts]);
  const activeTabsCount = useMemo(() => (openTabs || []).filter(t => (t.items || []).length > 0).length, [openTabs]);

  const totalPendura = useMemo(() => {
    let total = 0;
    (sales || []).forEach(s => {
       if (s.deleted) return; 
       if (s.paymentMethod === PaymentMethod.PENDURA) total += s.total;
       else if (s.items?.some(it => it.productId === 'quitacao')) total -= s.total;
    });
    return Math.max(0, total);
  }, [sales]);

  // Hook Customizado de Sincronização
  const { fetchInitialData, isInitialLoadDone } = useSync({
    products, setProducts,
    modifierGroups, setModifierGroups,
    categoryModifiers, setCategoryModifiers,
    sales, setSales,
    openTabs, setOpenTabs,
    users, setUsers,
    shifts, setShifts,
    penduraThreshold, setPenduraThreshold,
    setDbStatus,
    config: {
      url: SYSTEM_DB_URL,
      key: SYSTEM_API_KEY,
      email: SYSTEM_AUTH_EMAIL,
      pass: SYSTEM_AUTH_PASS,
      masterKey: MASTER_KEY,
      allPerms: ALL_ADMIN_PERMISSIONS
    }
  });

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  // Item 4: Segurança - Hash check na entrada
  const handleLogin = (u: string, p: string) => {
    const hashedPassword = hashPassword(p);
    const found = users.find(x => 
      x.username === u && (x.password === p || x.password === hashedPassword)
    );
    
    if (found) {
      setCurrentUser(found);
      setLoginError(null);
    } else {
      setLoginError("USUÁRIO OU SENHA INVÁLIDOS");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!isInitialLoadDone.current) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-8 animate-pulse">
        <div className="w-20 h-20 bg-red-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-red-600/20">
          <img src="https://img.icons8.com/fluency/512/beer.png" alt="Carregando" className="w-12 h-12" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-black uppercase text-[10px] tracking-[0.4em]">Botequista Pro</p>
          <p className="text-slate-500 font-bold uppercase text-[8px] tracking-widest">Sincronizando Banco de Dados...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading'} error={loginError} />;
  }

  const hasPermission = (p: UserPermission) => currentUser.username === 'admin' || currentUser.permissions.includes(p);

  const status = (() => {
    switch (dbStatus) {
      case 'success': return { label: 'Sincronizado', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20 dark:border-emerald-500/30', animate: '' };
      case 'pending':
      case 'loading': return { label: 'Sincronizando', color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20 dark:border-amber-500/30', animate: 'animate-pulse' };
      case 'offline': return { label: 'Offline', color: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20 dark:border-slate-500/30', animate: '' };
      case 'error': return { label: 'Erro Sinc', color: 'bg-red-500', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20 dark:border-red-500/30', animate: '' };
      default: return { label: 'Offline', color: 'bg-slate-400', text: 'text-slate-400', border: 'border-slate-200 dark:border-slate-800', animate: '' };
    }
  })();

  return (
    <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300`}>
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        dbStatus={dbStatus} 
        isOnline={dbStatus !== 'offline' && dbStatus !== 'error'} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        isShiftOpen={!!activeShift} 
        activeTabsCount={activeTabsCount} 
        totalPendura={totalPendura} 
        penduraThreshold={penduraThreshold} 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        theme={theme}
      />
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 md:hidden text-slate-600 dark:text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{viewTitles[activeView]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${status.border} ${status.animate}`}>
              <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${status.text}`}>{status.label}</span>
            </div>
            <button onClick={toggleTheme} className="p-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm text-slate-500 hover:scale-105 transition-all">
              {theme === 'dark' ? <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> : <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
          </div>
        </header>
        <div className="p-8 h-full overflow-y-auto">
          {activeView === 'pos' ? <POS products={products} modifierGroups={modifierGroups} categoryModifiers={categoryModifiers} openTabs={openTabs} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales(prev => [{...s, userId: currentUser.id, shiftId: activeShift?.id || ''}, ...prev])} activeShift={activeShift} onViewChange={setActiveView} shortcutCheckout={pendingShortcut} onClearShortcut={() => setPendingShortcut(null)} theme={theme} /> : 
           activeView === 'products' && hasPermission('products') ? (
             <ProductList 
                products={products} 
                setProducts={setProducts} 
                modifierGroups={modifierGroups} 
                setModifierGroups={setModifierGroups} 
                categoryModifiers={categoryModifiers} 
                setCategoryModifiers={setCategoryModifiers} 
                setOpenTabs={setOpenTabs}
                currentUser={currentUser} 
             />
           ) :
           activeView === 'dashboard' && hasPermission('dashboard') ? <Dashboard sales={sales} products={products} theme={theme} /> :
           activeView === 'history' && hasPermission('history') ? (
             <SalesHistory 
                sales={sales} 
                onDeleteSale={id => setSales(prev => prev.map(s => s.id === id ? { ...s, deleted: true, deletedAt: Date.now(), deletedBy: currentUser.username } : s))} 
                users={users} 
                currentUser={currentUser} 
             />
           ) :
           activeView === 'reports' && hasPermission('reports') ? (
             <Reports 
                sales={sales} 
                products={products} 
                users={users} 
                shifts={shifts} 
                currentUser={currentUser} 
                onQuitarPendura={(name, amount) => { setPendingShortcut({name, amount}); setActiveView('pos'); }} 
                theme={theme}
                penduraThreshold={penduraThreshold}
             />
           ) :
           activeView === 'shifts' && hasPermission('shifts_admin') ? <ShiftControl shifts={shifts} onUpdateShifts={setShifts} currentUser={currentUser} sales={sales} activeTabsCount={activeTabsCount} /> :
           activeView === 'users' && hasPermission('users_admin') ? <UserManagement users={users} onUpdateUsers={setUsers} /> :
           activeView === 'cash' && hasPermission('cash_admin') ? <CashManagement shifts={shifts} onUpdateShifts={setShifts} sales={sales} currentUser={currentUser} onViewChange={setActiveView} /> :
           activeView === 'settings' && hasPermission('settings') ? <Settings products={products} sales={sales} openTabs={openTabs} users={users} shifts={shifts} dbStatus={dbStatus} currentUser={currentUser} penduraThreshold={penduraThreshold} setPenduraThreshold={setPenduraThreshold} onImport={fetchInitialData} /> :
           activeView === 'help' ? <Help /> :
           <div className="flex flex-col items-center justify-center py-20 opacity-30 italic text-center uppercase font-black text-xs">Carregando Visualização...</div>}
        </div>
      </main>
    </div>
  );
};

export default App;
