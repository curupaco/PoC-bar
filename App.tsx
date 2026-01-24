
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Sale, View, Theme, Tab, User, Shift, UserPermission, ModifierGroup, Unit, generateUniqueId, downloadJSON } from './types';
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
import { useSync } from './hooks/useSync';
import { saveToFirebase, getFirebaseToken } from './services/firebaseService';
import { hashPassword } from './services/cryptoService';

const ALL_PERMISSIONS: UserPermission[] = ['dashboard', 'pos', 'products', 'history', 'reports', 'settings', 'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift', 'delete_sale', 'delete_product', 'edit_product', 'export_report', 'clear_fiado', 'full_reset', 'manage_backup', 'help_view', 'manage_units'];

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('btq_user');
    return saved ? JSON.parse(saved) : null;
  });

  const unitId = 'principal';

  const [products, setProducts] = useState<Product[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [categoryModifiers, setCategoryModifiers] = useState<Record<string, string>>({});
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'offline'>('idle');
  const [penduraThreshold, setPenduraThreshold] = useState(500);

  const syncConfig = useMemo(() => ({ 
    url: 'https://poc-botequista-default-rtdb.firebaseio.com', 
    key: 'AIzaSyDyOVNXnb7iB7Wk7stxrTPvQW4qmWTSQqs', 
    email: 'curupaco@gmail.com', 
    pass: 'Tc@00216587', 
    allPerms: ALL_PERMISSIONS 
  }), []);

  const { refresh } = useSync({
    setProducts,
    setModifierGroups,
    setCategoryModifiers,
    setSales,
    setOpenTabs,
    setUsers,
    setShifts,
    setDbStatus,
    activeUnitId: unitId,
    config: syncConfig
  });

  // LOCAL MIRROR: Salva tudo no localStorage como redundância
  useEffect(() => {
    if (dbStatus === 'success' || (products.length > 0)) {
      const mirror = { products, modifierGroups, categoryModifiers, sales, openTabs, shifts, users, units, updatedAt: Date.now() };
      localStorage.setItem(`btq_mirror_${unitId}`, JSON.stringify(mirror));
    }
  }, [products, modifierGroups, categoryModifiers, sales, openTabs, shifts, users, units, dbStatus]);

  const persist = useCallback(async (node: string, data: any) => {
    try {
      const token = await getFirebaseToken(syncConfig.email, syncConfig.pass, syncConfig.key);
      if (token) {
        const path = (node === 'users' || node === 'units') ? node : `data/units/${unitId}/${node}`;
        await saveToFirebase(syncConfig.url, data, undefined, token, path);
      }
    } catch (e) {
      console.error(`[Cloud Error] Falha ao salvar ${node}`);
    }
  }, [syncConfig, unitId]);

  const handleImport = async (incomingData: any) => {
    setDbStatus('loading');
    
    if (incomingData === 'EXPORT_NOW') {
       const fullData = { products, modifierGroups, categoryModifiers, sales, openTabs, shifts, users, units };
       downloadJSON(fullData, `botequista_backup_${new Date().toISOString().slice(0,10)}.json`);
       setDbStatus('success');
       return;
    }

    if (incomingData === 'SEED_INITIAL') {
      const seedProducts: Product[] = [
        { id: generateUniqueId('prod'), name: 'CERVEJA HEINEKEN 600ML', price: 18.50, category: 'CERVEJAS', sellType: 'unit' },
        { id: generateUniqueId('prod'), name: 'CERVEJA ORIGINAL 600ML', price: 15.00, category: 'CERVEJAS', sellType: 'unit' },
        { id: generateUniqueId('prod'), name: 'REFRIGERANTE LATA', price: 6.50, category: 'BEBIDAS', sellType: 'unit' },
        { id: generateUniqueId('prod'), name: 'DOSE CACHAÇA ARTESANAL', price: 8.00, category: 'DOSES', sellType: 'unit' },
        { id: generateUniqueId('prod'), name: 'BATATA FRITA PORÇÃO', price: 35.00, category: 'PORÇÕES', sellType: 'unit' }
      ];
      setProducts(seedProducts);
      await persist('products', seedProducts);
      setDbStatus('success');
      return;
    }

    let data = incomingData;
    if (incomingData?.data?.root) {
        console.log("Detectada estrutura aninhada (data.root). Normalizando...");
        data = {
            ...incomingData.data.root,
            users: incomingData.users || [],
            units: incomingData.units || [],
            config: incomingData.config
        };
    }

    if (data.products) { setProducts(data.products); await persist('products', data.products); }
    if (data.modifierGroups) { setModifierGroups(data.modifierGroups); await persist('modifierGroups', data.modifierGroups); }
    if (data.categoryModifiers) { setCategoryModifiers(data.categoryModifiers); await persist('categoryModifiers', data.categoryModifiers); }
    if (data.sales) { setSales(data.sales); await persist('sales', data.sales); }
    const tabsToImport = data.openTabs || [];
    setOpenTabs(tabsToImport); await persist('openTabs', tabsToImport);
    
    if (data.shifts) { setShifts(data.shifts); await persist('shifts', data.shifts); }
    
    let unitsToImport = data.units || [];
    if (!unitsToImport.some((u: Unit) => u.id === unitId)) {
        unitsToImport.push({ id: unitId, name: 'Bar Principal', isActive: true, createdAt: Date.now() });
    }
    setUnits(unitsToImport);
    await persist('units', unitsToImport);

    if (data.users && data.users.length > 0) { 
        const fixedUsers = data.users.map((u: User) => {
            if (u.username === 'admin') return u;
            if (u.allowedUnits && !u.allowedUnits.includes(unitId)) {
                return { ...u, allowedUnits: [...u.allowedUnits, unitId] };
            }
            if (!u.allowedUnits) {
                return { ...u, allowedUnits: [unitId] };
            }
            return u;
        });
        setUsers(fixedUsers); 
        await persist('users', fixedUsers); 
    }
    
    if (data.config && data.config.penduraThreshold) { setPenduraThreshold(data.config.penduraThreshold); }

    setDbStatus('success');
    refresh();
  };

  const cleanLocalCache = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('btq_')) {
        localStorage.removeItem(key);
      }
    });
    setProducts([]);
    setSales([]);
    setOpenTabs([]);
    setShifts([]);
    setModifierGroups([]);
    setCategoryModifiers({});
    setUnits([]);
  };

  const handleLogin = useCallback((u: string, p: string) => {
    setLoginError(null);
    const userLower = u.toLowerCase().trim();
    
    let authenticatedUser: User | null = null;

    if (userLower === 'admin' && p.trim() === 'admin') {
      authenticatedUser = { id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: ALL_PERMISSIONS };
    } else {
      const found = users.find(x => x.username === userLower);
      if (found && (found.password === p.trim() || found.password === hashPassword(p.trim()))) {
        authenticatedUser = found;
      }
    }

    if (authenticatedUser) {
      cleanLocalCache();
      setCurrentUser(authenticatedUser);
      localStorage.setItem('btq_user', JSON.stringify(authenticatedUser));
      setDbStatus('loading');
      setTimeout(() => refresh(), 100);
    } else {
      setLoginError("Acesso Negado.");
    }
  }, [users, refresh]);

  const handleLogout = useCallback(() => {
    cleanLocalCache();
    setCurrentUser(null);
    window.location.reload();
  }, []);

  const activeShift = useMemo(() => shifts.find(s => s.status === 'open'), [shifts]);

  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading' && users.length === 0} error={loginError} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white overflow-hidden font-sans dark">
      <Sidebar 
        activeView={activeView} 
        onViewChange={(v) => { setActiveView(v); setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        dbStatus={dbStatus} 
        isOnline={dbStatus === 'success'}
        currentUser={currentUser} 
        onLogout={handleLogout}
        isShiftOpen={!!activeShift}
        activeTabsCount={openTabs.length}
        totalPendura={0} 
        penduraThreshold={penduraThreshold}
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`flex-1 overflow-y-auto h-screen p-4 md:p-6 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} bg-slate-950`}>
        <header className="flex justify-between items-center mb-8 bg-slate-900/50 p-5 rounded-3xl border border-slate-800">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-800 rounded-xl text-white active:scale-95 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
              <div className="flex flex-col">
                <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">Botequista Pro</h2>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  {dbStatus === 'loading' ? '⏳ Sincronizando...' : '☁️ Nuvem Ativa'}
                </span>
              </div>
           </div>
           
           <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${dbStatus === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
              {dbStatus === 'success' ? '● Online' : '● Sincronizando'}
           </div>
        </header>
        
        {dbStatus === 'loading' && products.length === 0 && users.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-black uppercase tracking-widest text-[10px]">Conectando ao Banco...</p>
            </div>
          </div>
        ) : (
          <>
            {activeView === 'pos' && <POS products={products} modifierGroups={modifierGroups} categoryModifiers={categoryModifiers} openTabs={openTabs} onUpdateTabs={(updater) => { const next = updater(openTabs); setOpenTabs(next); persist('openTabs', next); }} onCompleteSale={(s) => { 
                const newSales = Array.isArray(s) ? s : [s];
                const next = [...newSales, ...sales]; 
                setSales(next); 
                persist('sales', next); 
            }} activeShift={activeShift} onViewChange={setActiveView} />}
            {activeView === 'products' && <ProductList products={products} setProducts={(updater) => { const next = updater(products); setProducts(next); persist('products', next); }} modifierGroups={modifierGroups} setModifierGroups={(updater) => { const next = updater(modifierGroups); setModifierGroups(next); persist('modifierGroups', next); }} categoryModifiers={categoryModifiers} setCategoryModifiers={(updater) => { const next = updater(categoryModifiers); setCategoryModifiers(next); }} setOpenTabs={setOpenTabs} currentUser={currentUser} />}
            {activeView === 'history' && <SalesHistory sales={sales} onDeleteSale={(id) => { const next = sales.map(s => s.id === id ? {...s, deleted: true, deletedAt: Date.now(), deletedBy: currentUser.id} : s); setSales(next); persist('sales', next); }} users={users} currentUser={currentUser} />}
            {activeView === 'reports' && <Reports sales={sales} products={products} users={users} shifts={shifts} currentUser={currentUser} onQuitarPendura={(name, amount) => {}} penduraThreshold={penduraThreshold} />}
            {activeView === 'shifts' && <ShiftControl shifts={shifts} onUpdateShifts={(next) => { setShifts(next); persist('shifts', next); }} currentUser={currentUser} sales={sales} activeTabsCount={openTabs.length} />}
            {activeView === 'users' && <UserManagement users={users} units={units} onUpdateUsers={(next) => { setUsers(next); persist('users', next); }} />}
            {activeView === 'settings' && <Settings products={products} sales={sales} openTabs={openTabs} users={users} shifts={shifts} units={units} onUpdateUnits={(next) => { setUnits(next); persist('units', next); }} onImport={handleImport} dbStatus={dbStatus} currentUser={currentUser} penduraThreshold={penduraThreshold} setPenduraThreshold={setPenduraThreshold} />}
            {activeView === 'dashboard' && <Dashboard sales={sales} products={products} theme={'dark'} />}
            {activeView === 'cash' && <CashManagement shifts={shifts} onUpdateShifts={(next) => { setShifts(next); persist('shifts', next); }} sales={sales} currentUser={currentUser} onViewChange={setActiveView} />}
            {activeView === 'help' && <Help />}
          </>
        )}
      </main>
    </div>
  );
};
