
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Sale, View, Theme, Tab, User, Shift, UserPermission, ModifierGroup, Unit, Category, generateUniqueId, downloadJSON } from './types';
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
import { saveToFirebase, saveItemToFirebase, getFirebaseToken, loadFromFirebase } from './services/firebaseService';
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

  const [activeUnitId, setActiveUnitId] = useState<string | null>(() => {
      return localStorage.getItem('btq_active_unit_id');
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [categoryModifiers, setCategoryModifiers] = useState<Record<string, string>>({});
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'offline'>('idle');
  const [penduraThreshold, setPenduraThreshold] = useState(500);

  const syncConfig = useMemo(() => ({ 
    url: 'https://poc-botequista-default-rtdb.firebaseio.com', 
    key: 'AIzaSyDyOVNXnb7iB7Wk7stxrTPvQW4qmWTSQqs', 
    email: 'curupaco@gmail.com', 
    pass: 'Tc@00216587', 
    allPerms: ALL_PERMISSIONS 
  }), []);

  // FIX: Cold Start Login - Busca usuários ao montar a aplicação, independente de estar logado
  useEffect(() => {
    const prefetchAuthData = async () => {
      if (users.length === 0) {
        setDbStatus('loading');
        const token = await getFirebaseToken(syncConfig.email, syncConfig.pass, syncConfig.key);
        if (token) {
          const [loadedUsers, loadedUnits] = await Promise.all([
            loadFromFirebase(syncConfig.url, undefined, token, 'users'),
            loadFromFirebase(syncConfig.url, undefined, token, 'units')
          ]);
          if (loadedUsers) setUsers(loadedUsers);
          if (loadedUnits) setUnits(loadedUnits);
        }
        setDbStatus('idle');
      }
    };
    prefetchAuthData();
  }, [syncConfig, users.length]);

  const { refresh } = useSync({
    setProducts,
    setModifierGroups,
    setCategoryModifiers,
    setSales,
    setOpenTabs,
    setUsers,
    setShifts,
    setUnits,
    setCategories,
    setDbStatus,
    activeUnitId, 
    config: syncConfig
  });

  // FIX: Race Condition - Persist agora aceita ID para salvamento atômico
  const persist = useCallback(async (node: string, data: any, itemId?: string) => {
    try {
      const token = await getFirebaseToken(syncConfig.email, syncConfig.pass, syncConfig.key);
      if (token) {
        const path = (node === 'users' || node === 'units') 
            ? node 
            : activeUnitId ? `data/units/${activeUnitId}/${node}` : null;
        
        if (path) {
          if (itemId) {
             // Salvamento Atômico (Evita Race Condition)
             await saveItemToFirebase(syncConfig.url, data, itemId, undefined, token, path);
          } else {
             // Salvamento Completo (Legacy/Configurações)
             await saveToFirebase(syncConfig.url, data, undefined, token, path);
          }
        }
      }
    } catch (e) {
      console.error(`[Cloud Error] Falha ao salvar ${node}`);
    }
  }, [syncConfig, activeUnitId]);

  const handleImport = async (incomingData: any) => {
    setDbStatus('loading');
    
    if (incomingData === 'EXPORT_NOW') {
       const fullData = { products, modifierGroups, categoryModifiers, sales, openTabs, shifts, users, units, categories };
       downloadJSON(fullData, `botequista_backup_${activeUnitId}_${new Date().toISOString().slice(0,10)}.json`);
       setDbStatus('success');
       return;
    }

    let data = incomingData;
    if (incomingData?.data?.root) {
        data = { ...incomingData.data.root, users: incomingData.users || [], units: incomingData.units || [] };
    }

    if (data.users) { setUsers(data.users); await persist('users', data.users); }
    if (data.units) { setUnits(data.units); await persist('units', data.units); }

    if (activeUnitId) {
        if (data.products) { setProducts(data.products); await persist('products', data.products); }
        if (data.modifierGroups) { setModifierGroups(data.modifierGroups); await persist('modifierGroups', data.modifierGroups); }
        if (data.categoryModifiers) { setCategoryModifiers(data.categoryModifiers); await persist('categoryModifiers', data.categoryModifiers); }
        if (data.sales) { setSales(data.sales); await persist('sales', data.sales); }
        if (data.openTabs) { setOpenTabs(data.openTabs); await persist('openTabs', data.openTabs); }
        if (data.shifts) { setShifts(data.shifts); await persist('shifts', data.shifts); }
        if (data.categories) { setCategories(data.categories); await persist('categories', data.categories); }
    }

    setDbStatus('success');
    refresh();
  };

  const cleanLocalCache = () => {
    localStorage.removeItem('btq_user');
    localStorage.removeItem('btq_active_unit_id');
    setProducts([]); setSales([]); setOpenTabs([]); setShifts([]); 
    setModifierGroups([]); setCategoryModifiers({}); setUnits([]); setCategories([]);
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
    setActiveUnitId(null);
    window.location.reload();
  }, []);

  const handleSelectUnit = (id: string) => {
      setActiveUnitId(id);
      localStorage.setItem('btq_active_unit_id', id);
      setDbStatus('loading');
      // O useSync detectará a mudança de activeUnitId e fará o fetch automaticamente.
      // Removemos o setTimeout(refresh, 50) para evitar duplicidade de requisições.
  };

  const handleBootstrapSystem = async () => {
      setDbStatus('loading');
      const newUnits = [{ id: 'principal', name: 'Bar Principal', isActive: true, createdAt: Date.now() }];
      
      // Atualização otimista local (evita que a UI fique vazia enquanto salva)
      setUnits(newUnits);
      
      // Persiste no servidor
      await persist('units', newUnits);
      
      // Seleciona imediatamente
      handleSelectUnit('principal');
  };

  const activeShift = useMemo(() => shifts.find(s => s.status === 'open'), [shifts]);

  // Se não estiver logado
  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading' && users.length === 0} error={loginError} />;
  }

  // SE LOGADO MAS SEM UNIDADE SELECIONADA -> TELA DE SELEÇÃO
  if (!activeUnitId) {
      const isAdminOrManager = currentUser.username === 'admin' || currentUser.permissions.includes('manage_units');
      const allowedUnits = isAdminOrManager
          ? units 
          : units.filter(u => currentUser.allowedUnits?.includes(u.id));

      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="max-w-4xl w-full">
                  <div className="text-center mb-12">
                      <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic mb-4">Onde vamos trabalhar hoje?</h1>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Olá, {currentUser.displayName}. Escolha sua estação.</p>
                      
                      <button onClick={() => refresh()} className="mt-4 text-[10px] text-slate-600 hover:text-white uppercase font-black flex items-center gap-2 mx-auto transition-colors">
                        <svg className={`w-4 h-4 ${dbStatus === 'loading' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Verificar Conexão
                      </button>
                  </div>

                  {dbStatus === 'loading' && (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-slate-500 font-black uppercase text-xs tracking-widest animate-pulse">Buscando filiais...</p>
                      </div>
                  )}

                  {dbStatus !== 'loading' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {allowedUnits.map(unit => (
                              <button 
                                  key={unit.id}
                                  onClick={() => handleSelectUnit(unit.id)}
                                  className={`group bg-slate-900 p-8 rounded-[40px] border border-slate-800 transition-all text-left relative overflow-hidden active:scale-95 shadow-2xl ${unit.isActive ? 'hover:bg-red-600 hover:border-red-500' : 'opacity-50 cursor-not-allowed'}`}
                                  disabled={!unit.isActive}
                              >
                                  <div className="relative z-10">
                                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{unit.name}</h3>
                                      <p className="text-[10px] font-bold text-slate-500 group-hover:text-red-200 mt-2 uppercase tracking-widest flex justify-between">
                                        <span>ID: {unit.id}</span>
                                        {!unit.isActive && <span>(SUSPENSO)</span>}
                                      </p>
                                      <div className="mt-8 flex items-center gap-2">
                                          <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full text-white uppercase">
                                            {unit.isActive ? 'Entrar' : 'Indisponível'}
                                          </span>
                                      </div>
                                  </div>
                                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
                              </button>
                          ))}
                          
                          {/* ESTADO ZERO: SISTEMA SEM UNIDADES */}
                          {units.length === 0 && (
                              <div className="col-span-full py-12 px-8 bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-800 text-center flex flex-col items-center">
                                  {isAdminOrManager ? (
                                    <>
                                        <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mb-6">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Configuração Inicial</h3>
                                        <p className="text-slate-500 font-bold mb-8 uppercase text-xs max-w-md mt-2">Nenhuma unidade encontrada. Como administrador, você deve criar a primeira unidade para começar a operar.</p>
                                        <button onClick={handleBootstrapSystem} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-3">
                                            <span>Inicializar Sistema</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </button>
                                    </>
                                  ) : (
                                    <>
                                        <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Sistema em Manutenção</h3>
                                        <p className="text-slate-500 font-bold mb-4 uppercase text-xs max-w-md mt-2">Nenhuma unidade disponível no momento. Aguarde a configuração pelo administrador.</p>
                                    </>
                                  )}
                              </div>
                          )}

                          {/* ESTADO DE RESTRIÇÃO: UNIDADES EXISTEM MAS USUÁRIO NÃO TEM ACESSO */}
                          {units.length > 0 && allowedUnits.length === 0 && (
                             <div className="col-span-full text-center py-12 border-2 border-dashed border-red-900/30 rounded-[40px]">
                                <div className="inline-block p-4 rounded-full bg-red-500/10 text-red-500 mb-4">
                                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase italic">Acesso Restrito</h3>
                                <p className="text-slate-500 text-sm font-bold uppercase mt-2">Você não possui unidades vinculadas.</p>
                                <p className="text-slate-600 text-[10px] mt-1 uppercase font-bold">Solicite ao administrador para liberar seu acesso.</p>
                             </div>
                          )}
                      </div>
                  )}
                  
                  <div className="flex justify-center gap-4 mt-12">
                      <button onClick={handleLogout} className="text-slate-500 hover:text-white font-black uppercase text-xs tracking-widest transition-colors">
                          Sair / Trocar Usuário
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // APP PRINCIPAL
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
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">Botequista Pro</h2>
                    <span className="bg-red-600 text-[8px] px-2 py-0.5 rounded text-white font-black uppercase tracking-widest">
                        {units.find(u => u.id === activeUnitId)?.name || activeUnitId}
                    </span>
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  {dbStatus === 'loading' ? '⏳ Sincronizando...' : '☁️ Nuvem Ativa'}
                </span>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
               <button onClick={() => { setActiveUnitId(null); localStorage.removeItem('btq_active_unit_id'); }} className="hidden md:block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all">
                   Trocar Unidade
               </button>
               <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${dbStatus === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                  {dbStatus === 'success' ? '● Online' : '● Sincronizando'}
               </div>
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
            {activeView === 'pos' && <POS products={products} modifierGroups={modifierGroups} categoryModifiers={categoryModifiers} openTabs={openTabs} 
              onUpdateTabs={(updater) => { const next = updater(openTabs); setOpenTabs(next); persist('openTabs', next); }} 
              onCompleteSale={(newSales) => { 
                  // Atomic Update: Saves new sales individually to avoid race conditions
                  const salesArray = Array.isArray(newSales) ? newSales : [newSales];
                  setSales(prev => [...salesArray, ...prev]); 
                  salesArray.forEach(s => persist('sales', s, s.id));
              }} 
              activeShift={activeShift} onViewChange={setActiveView} 
            />}
            
            {activeView === 'products' && <ProductList 
              products={products} 
              setProducts={(updater) => { const next = updater(products); setProducts(next); persist('products', next); }} 
              modifierGroups={modifierGroups} 
              setModifierGroups={(updater) => { const next = updater(modifierGroups); setModifierGroups(next); persist('modifierGroups', next); }} 
              categoryModifiers={categoryModifiers} 
              setCategoryModifiers={(updater) => { const next = updater(categoryModifiers); setCategoryModifiers(next); }} 
              setOpenTabs={setOpenTabs} 
              currentUser={currentUser} 
              categories={categories} 
              setCategories={(updater) => { const next = updater(categories); setCategories(next); persist('categories', next); }} 
              // Atomic Product Updates
              onSaveProduct={(p) => { 
                setProducts(prev => {
                   const exists = prev.find(x => x.id === p.id);
                   const next = exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
                   return next;
                });
                persist('products', p, p.id);
              }}
              onDeleteProduct={(id) => {
                 // Deletion still requires full array update or logic to nullify
                 // For now, keeping full update for deletion as it's less frequent/concurrent
                 setProducts(prev => {
                    const next = prev.filter(p => p.id !== id);
                    persist('products', next); 
                    return next;
                 });
              }}
            />}
            
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
