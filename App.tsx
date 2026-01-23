
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, View, Theme, Tab, User, Shift, UserPermission, PaymentMethod, ModifierGroup, Unit } from './types';
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
import FeedbackModal from './components/FeedbackModal';
import { hashPassword } from './services/cryptoService';
import { useSync } from './hooks/useSync';

const isBrowser = typeof window !== 'undefined';
if (isBrowser && !(window as any).process) {
  (window as any).process = { env: {} };
}

const APP_VERSION = "4.0.1 (Multi-Bar Stable)"; 
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
  help: 'Guia de Operação',
  units: 'Gestão de Franquia'
};

const ALL_ADMIN_PERMISSIONS: UserPermission[] = [
  'dashboard', 'pos', 'products', 'history', 'reports', 'settings', 
  'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift', 
  'delete_sale', 'delete_product', 'edit_product', 'export_report', 
  'clear_fiado', 'full_reset', 'manage_backup', 'help_view', 'manage_units'
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null); // Estado da Unidade Selecionada
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'pending' | 'success' | 'error' | 'offline'>('idle');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Restore session logic
  useEffect(() => {
    // Tenta recuperar unidade ativa do localStorage
    const savedUnit = localStorage.getItem('btq_active_unit');
    if (savedUnit) setActiveUnitId(savedUnit);
  }, []);

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
  const [units, setUnits] = useState<Unit[]>([]); // Lista global de bares
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
    units, setUnits, // Global
    penduraThreshold, setPenduraThreshold,
    setDbStatus,
    activeUnitId, // Passamos o ID do bar para prefixar os paths
    config: {
      url: SYSTEM_DB_URL,
      key: SYSTEM_API_KEY,
      email: SYSTEM_AUTH_EMAIL,
      pass: SYSTEM_AUTH_PASS,
      masterKey: MASTER_KEY,
      allPerms: ALL_ADMIN_PERMISSIONS
    }
  });

  useEffect(() => { fetchInitialData(); }, [fetchInitialData, activeUnitId]); // Recarrega se mudar de unidade

  const handleLogin = (u: string, p: string) => {
    const hashedPassword = hashPassword(p);
    const found = users.find(x => 
      x.username === u && (x.password === p || x.password === hashedPassword)
    );
    
    if (found) {
      setCurrentUser(found);
      setLoginError(null);
      
      // Auto-seleção inteligente de unidade
      if (found.username === 'admin') {
         // Admin não auto-seleciona, pois pode querer criar um bar novo ou ver todos
         // A menos que só exista 1 bar
         if (units.length === 1 && units[0].isActive) {
            selectUnit(units[0].id);
         }
      } else {
         const allowed = found.allowedUnits || [];
         if (allowed.length === 1) {
             selectUnit(allowed[0]);
         }
      }
    } else {
      setLoginError("USUÁRIO OU SENHA INVÁLIDOS");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveUnitId(null);
    localStorage.removeItem('btq_active_unit');
  };

  const selectUnit = (unitId: string) => {
    // Limpeza de estado crítica antes de trocar de unidade
    // Isso evita que dados da unidade anterior vazem para a próxima
    setSales([]);
    setOpenTabs([]);
    setProducts([]);
    setShifts([]);
    
    setActiveUnitId(unitId);
    localStorage.setItem('btq_active_unit', unitId);
    setActiveView('pos');
  };

  const allowedUnitsList = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.username === 'admin') return units;
      return units.filter(u => u.isActive && (currentUser.allowedUnits || []).includes(u.id));
  }, [currentUser, units]);


  if (!isInitialLoadDone.current && !activeUnitId) {
    // Carregamento inicial (Login Screen precisa dos Users globais)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-8 animate-pulse">
        <div className="w-20 h-20 bg-red-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-red-600/20">
          <img src="https://img.icons8.com/fluency/512/beer.png" alt="Carregando" className="w-12 h-12" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-black uppercase text-[10px] tracking-[0.4em]">Botequista Pro</p>
          <p className="text-slate-500 font-bold uppercase text-[8px] tracking-widest">Conectando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading'} error={loginError} />;
  }

  // TELA INTERMEDIÁRIA: Seleção de Unidade
  if (!activeUnitId) {
    return (
       <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="max-w-4xl w-full">
             <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic mb-4">Onde vamos trabalhar hoje?</h1>
                <p className="text-slate-400 font-medium">Olá, <span className="text-white font-bold">{currentUser.displayName}</span>. Selecione uma unidade para iniciar o turno.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allowedUnitsList.map(unit => (
                   <button key={unit.id} onClick={() => selectUnit(unit.id)} className="bg-slate-800 hover:bg-red-600 group p-8 rounded-[40px] border border-slate-700 hover:border-red-500 transition-all text-left shadow-2xl hover:scale-105 active:scale-95">
                      <div className="w-12 h-12 bg-slate-900 group-hover:bg-white rounded-2xl flex items-center justify-center mb-6 transition-colors">
                         <span className="text-2xl group-hover:text-red-600">🍺</span>
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">{unit.name}</h3>
                      <p className="text-xs text-slate-500 group-hover:text-white/80 font-bold uppercase mt-2">Acessar Sistema →</p>
                   </button>
                ))}
                
                {/* Botão para criar primeira unidade se for admin e não houver nenhuma */}
                {currentUser.username === 'admin' && units.length === 0 && (
                   <button onClick={() => setActiveView('settings')} className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-8 rounded-[40px] flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-white transition-all">
                      <span className="text-3xl mb-2">+</span>
                      <span className="font-black uppercase text-xs tracking-widest">Criar Primeiro Bar</span>
                   </button>
                )}
             </div>

             <div className="mt-12 text-center">
                <button onClick={handleLogout} className="text-slate-500 hover:text-white font-black uppercase text-xs tracking-widest transition-colors">Sair da Conta</button>
             </div>
          </div>
       </div>
    );
  }

  // APP PRINCIPAL (Carrega apenas após activeUnitId estar definido)
  if (!isInitialLoadDone.current) {
     return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-8">
           <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
           <p className="text-xs font-black uppercase tracking-widest text-slate-400">Carregando dados da unidade...</p>
        </div>
     );
  }

  const hasPermission = (p: UserPermission) => currentUser.username === 'admin' || currentUser.permissions.includes(p);
  const activeUnitName = units.find(u => u.id === activeUnitId)?.name || 'Unidade Desconhecida';

  const status = (() => {
    switch (dbStatus) {
      case 'success': return { label: 'Online', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20 dark:border-emerald-500/30', animate: '' };
      case 'pending':
      case 'loading': return { label: 'Sincronizando', color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20 dark:border-amber-500/30', animate: 'animate-pulse' };
      case 'offline': return { label: 'Offline', color: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20 dark:border-slate-500/30', animate: '' };
      case 'error': return { label: 'Erro de Rede', color: 'bg-red-500', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20 dark:border-red-500/30', animate: '' };
      default: return { label: 'Desconectado', color: 'bg-slate-400', text: 'text-slate-400', border: 'border-slate-200 dark:border-slate-800', animate: '' };
    }
  })();

  return (
    <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300`}>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} currentUser={currentUser.username} />
      
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
            <div>
               <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">{viewTitles[activeView]}</h1>
               <button onClick={() => { setActiveUnitId(null); localStorage.removeItem('btq_active_unit'); }} className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 flex items-center gap-1 mt-1 transition-colors">
                  {activeUnitName} <span className="opacity-50">▼</span>
               </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${status.border} ${status.animate}`}>
              <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${status.text}`}>{status.label}</span>
            </div>

            <button onClick={toggleTheme} className="p-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm text-slate-500 hover:scale-105 transition-all">
              {theme === 'dark' ? <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> : <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            
            <button onClick={() => setIsFeedbackOpen(true)} className="p-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm text-slate-500 hover:text-blue-500 hover:scale-105 transition-all" title="Reportar Erro ou Sugestão">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
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
           activeView === 'users' && hasPermission('users_admin') ? <UserManagement users={users} units={units} onUpdateUsers={setUsers} /> :
           activeView === 'cash' && hasPermission('cash_admin') ? <CashManagement shifts={shifts} onUpdateShifts={setShifts} sales={sales} currentUser={currentUser} onViewChange={setActiveView} /> :
           activeView === 'settings' && hasPermission('settings') ? <Settings products={products} sales={sales} openTabs={openTabs} users={users} shifts={shifts} units={units} onUpdateUnits={setUnits} dbStatus={dbStatus} currentUser={currentUser} penduraThreshold={penduraThreshold} setPenduraThreshold={setPenduraThreshold} onImport={fetchInitialData} /> :
           activeView === 'help' ? <Help /> :
           <div className="flex flex-col items-center justify-center py-20 opacity-30 italic text-center uppercase font-black text-xs">Carregando Visualização...</div>}
        </div>
      </main>
    </div>
  );
};

export default App;
