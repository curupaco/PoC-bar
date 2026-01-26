import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Sale, Tab, User, Shift, ModifierGroup, Unit, Category, View, UserPermission, PaymentMethod, generateUniqueId, Theme, CashTransaction, SaleItem } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import ProductList from './components/ProductList';
import SalesHistory from './components/SalesHistory';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import ShiftControl from './components/ShiftControl';
import CashManagement from './components/CashManagement';
import Settings from './components/Settings';
import Help from './components/Help';
import Login from './components/Login';
import FeedbackModal from './components/FeedbackModal';
import { useSync } from './hooks/useSync';
import { SyncQueue } from './utils/syncQueue';
import { hashPassword } from './services/cryptoService';
import LoadingScreen from './components/LoadingScreen';

const ALL_PERMISSIONS: UserPermission[] = [
  'dashboard', 'pos', 'products', 'history', 'reports', 'settings',
  'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift',
  'delete_sale', 'delete_product', 'edit_product', 'export_report',
  'clear_fiado', 'full_reset', 'manage_backup', 'help_view', 'manage_units'
];

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'offline'>('idle');
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Theme Logic
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('btq_theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('btq_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [categoryModifiers, setCategoryModifiers] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [penduraThreshold, setPenduraThreshold] = useState(500);
  
  // CORREÇÃO ITEM 3: Persistência de Sessão da Unidade
  const [activeUnitId, setActiveUnitId] = useState<string | null>(() => {
    return localStorage.getItem('btq_active_unit');
  });

  // Salva a unidade escolhida no LocalStorage sempre que mudar
  useEffect(() => {
    if (activeUnitId) {
      localStorage.setItem('btq_active_unit', activeUnitId);
    } else {
      localStorage.removeItem('btq_active_unit');
    }
  }, [activeUnitId]);

  const syncConfig = useMemo(() => ({ 
    url: 'https://poc-botequista-default-rtdb.firebaseio.com', 
    key: 'REMOVED_FIREBASE_API_KEY', 
    email: 'curupaco@gmail.com', 
    pass: 'REMOVED_FIREBASE_PASSWORD', 
    allPerms: ALL_PERMISSIONS 
  }), []);

  const { refresh, registerLocalDeletion } = useSync({
    setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, 
    setUsers, setShifts, setUnits, setCategories, setDbStatus,
    activeUnitId, config: syncConfig
  });

  // Helper to persist data to SyncQueue
  // CORREÇÃO ITEM 2: Passa o unitId para a fila para evitar corrupção offline
  const persist = useCallback((node: string, data: any, itemId?: string) => {
    if (!activeUnitId) return;
    SyncQueue.enqueue({ 
       node, 
       data, 
       itemId, 
       unitId: activeUnitId,
       action: 'overwrite' 
    });
  }, [activeUnitId]);

  // Função para trocar de unidade limpando o estado
  const handleSwitchUnit = () => {
    setActiveUnitId(null);
    setProducts([]);
    setSales([]);
    setOpenTabs([]);
    setShifts([]);
    setModifierGroups([]);
    setCategories([]);
    setCategoryModifiers({});
  };

  // CORREÇÃO ITEM 1: Logout Seguro (Limpa tudo antes de sair)
  const handleLogout = () => {
    handleSwitchUnit(); // Limpa dados da unidade e remove do localStorage
    setUnits([]); // Limpa cache de unidades
    setUsers([]); // Limpa cache de usuários
    setCurrentUser(null); // Remove sessão
  };

  // CORREÇÃO CRÍTICA 1 (RACE CONDITION TABS): Atualização Atômica de Mesas
  const handleSaveTab = (tab: Tab) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.id === tab.id);
      if (idx >= 0) {
         const newTabs = [...prev];
         newTabs[idx] = tab;
         return newTabs;
      }
      return [...prev, tab];
    });
    persist('openTabs', tab, tab.id);
  };

  // NOVA FUNÇÃO: Gravação granular de itens (Resolvendo Item Fantasma)
  const handleUpdateTabItem = (tabId: string, item: SaleItem) => {
    setOpenTabs(prev => {
        return prev.map(t => {
            if (t.id === tabId) {
                // Atualização otimista local (UI imediata)
                const items = t.items ? [...t.items] : [];
                const idx = items.findIndex(i => i.id === item.id);
                if (idx > -1) {
                    // Update
                    if (item.quantity <= 0) {
                        items.splice(idx, 1);
                    } else {
                        items[idx] = item;
                    }
                } else if (item.quantity > 0) {
                    // Insert
                    items.push(item);
                }
                return { ...t, items };
            }
            return t;
        });
    });

    // Gravação Atômica no Backend: openTabs/{tabId}/items/{itemId}
    if (item.quantity <= 0) {
        // Deletar item específico
        persist(`openTabs/${tabId}/items`, null, item.id);
    } else {
        // Gravar/Atualizar item específico
        persist(`openTabs/${tabId}/items`, item, item.id);
    }
  };

  const handleDeleteTab = (tabId: string) => {
    // 1. Atualização Otimista
    setOpenTabs(prev => prev.filter(t => t.id !== tabId));
    
    // 2. Persistência na Fila (Backend) - Deleta a mesa
    persist('openTabs', null, tabId);
    
    // 3. FIX MESA ZUMBI GLOBAL: Grava Tombstone no Servidor
    // Grava em _meta/deleted_tabs/{tabId} = timestamp
    persist(`_meta/deleted_tabs/${tabId}`, Date.now());

    // 4. Fallback Local (para feedback imediato se estiver offline)
    registerLocalDeletion(tabId);
  };

  // Handlers for Data Updates (Generic Lists)
  const handleUpdateProducts = (updater: (prev: Product[]) => Product[]) => {
    setProducts(prev => {
      const next = updater(prev);
      persist('products', next);
      return next;
    });
  };

  const handleUpdateModifierGroups = (updater: (prev: ModifierGroup[]) => ModifierGroup[]) => {
    setModifierGroups(prev => {
      const next = updater(prev);
      persist('modifierGroups', next);
      return next;
    });
  };
  
  const handleUpdateCategories = (updater: (prev: Category[]) => Category[]) => {
    setCategories(prev => {
      const next = updater(prev);
      persist('categories', next);
      return next;
    });
  };

  const handleUpdateUsers = (newUsers: User[], changedItem?: User) => {
    setUsers(newUsers);
    if (changedItem) {
        persist('users', changedItem, changedItem.id);
    } else {
        persist('users', newUsers);
    }
  };
  
  const handleUpdateShifts = (newShifts: Shift[], changedItem?: Shift) => {
    setShifts(newShifts);
    if (changedItem) {
        const { transactions, ...shiftToSave } = changedItem;
        persist('shifts', shiftToSave, changedItem.id);
    } else {
        persist('shifts', newShifts);
    }
  };

  const handleRegisterTransaction = (shiftId: string, transaction: CashTransaction) => {
     persist(`shifts/${shiftId}/transactions`, transaction, transaction.id);
  };

  const handleUpdateUnits = (newUnits: Unit[]) => {
    setUnits(newUnits);
    persist('units', newUnits); 
  };

  const handleCompleteSale = (newSalesList: Sale[], tabIdToClose?: string) => {
    setSales(prev => {
        const next = [...prev, ...newSalesList];
        newSalesList.forEach(s => persist('sales', s, s.id));
        return next;
    });

    if (tabIdToClose) {
        handleDeleteTab(tabIdToClose);
    }
  };

  // Auth
  const handleLogin = (u: string, p: string) => {
    if (u === 'admin' && p === 'admin') {
      setCurrentUser({ id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: ALL_PERMISSIONS, allowedUnits: [] });
      return;
    }
    const hashedPassword = hashPassword(p);
    const found = users.find(user => user.username === u && (user.password === p || user.password === hashedPassword));
    if (found) {
      setCurrentUser(found);
    } else {
      alert("Credenciais Inválidas"); 
    }
  };

  // Derived State
  const isShiftOpen = useMemo(() => shifts.some(s => s.status === 'open'), [shifts]);
  const totalPendura = useMemo(() => {
     return sales.reduce((acc, s) => {
        if (s.deleted) return acc;
        let debit = 0;
        if (s.paymentMethod === 'Pendura') debit = s.total;
        if (s.payments) {
           const pPart = s.payments.find(p => p.method === 'Pendura');
           if(pPart) debit = pPart.amount;
        }
        if (s.items?.some(i => i.productId === 'quitacao')) debit -= s.total;
        return acc + debit;
     }, 0);
  }, [sales]);

  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        setDeferredPrompt(null);
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'success': return 'Sincronizado';
      case 'loading': return 'Sincronizando';
      case 'error': return 'Erro';
      case 'offline': return 'Fora do Ar';
      default: return 'Aguardando';
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading'} error={dbStatus === 'error' ? 'Erro de Conexão' : null} />;
  }

  if (!activeUnitId) {
    const isLoadingGlobal = dbStatus === 'loading' && units.length === 0;
    
    if (isLoadingGlobal) {
       return <LoadingScreen message="Buscando bares..." />;
    }

    const allowedUnits = currentUser.username === 'admin' 
      ? units 
      : units.filter(u => currentUser.allowedUnits?.includes(u.id) && u.isActive);

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
         <div className="max-w-2xl w-full animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 text-center italic">
               Onde vamos trabalhar hoje?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {allowedUnits.map(unit => (
                  <button 
                    key={unit.id}
                    onClick={() => setActiveUnitId(unit.id)}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 hover:shadow-xl transition-all group text-left"
                  >
                     <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase group-hover:text-red-600 transition-colors">{unit.name}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">ID: {unit.id}</p>
                  </button>
               ))}
               {allowedUnits.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-slate-100 dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-300 dark:border-slate-800">
                     <p className="text-slate-500 font-bold uppercase text-xs">Nenhum bar liberado para seu usuário.</p>
                     <button onClick={() => setCurrentUser(null)} className="mt-4 text-red-500 font-black uppercase text-[10px] hover:underline">Voltar / Sair</button>
                  </div>
               )}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden selection:bg-red-500/30 transition-colors duration-300">
       <Sidebar 
          activeView={activeView} 
          onViewChange={setActiveView}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          isShiftOpen={isShiftOpen}
          activeTabsCount={openTabs.length}
          totalPendura={totalPendura}
          penduraThreshold={penduraThreshold}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          dbStatus={dbStatus}
          isOnline={navigator.onLine}
          onInstallApp={deferredPrompt ? handleInstallClick : undefined}
          theme={theme}
       />
       
       <main className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} h-full relative`}>
          <header className="hidden md:flex justify-between items-center bg-white dark:bg-slate-900/80 p-5 mx-8 mt-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md sticky top-6 z-30 transition-all">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                   <h2 className="text-2xl font-normal font-barrio leading-none text-slate-900 dark:text-white">Botequista</h2>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-red-200 dark:border-red-900/50">
                         {units.find(u => u.id === activeUnitId)?.name || 'Carregando...'}
                      </span>
                      <button 
                        onClick={handleSwitchUnit}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Trocar
                      </button>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                 <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase border flex items-center gap-2 transition-all ${dbStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'}`}>
                    <div className={`w-2 h-2 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    {getStatusLabel(dbStatus)}
                 </div>

                 <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-all shadow-sm active:scale-95"
                    title={theme === 'dark' ? 'Mudar para Claro' : 'Mudar para Escuro'}
                 >
                    {theme === 'dark' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    )}
                 </button>

                 <button onClick={() => setFeedbackOpen(true)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-all shadow-sm active:scale-95">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                 </button>
             </div>
          </header>

          <div className="md:hidden p-4 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <span className="font-barrio text-xl text-slate-800 dark:text-white">Botequista</span>
              <div className={`w-3 h-3 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          </div>
          
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full pb-20 md:pb-8">
              {activeView === 'dashboard' && <Dashboard sales={sales} products={products} theme={theme} />}
              
              {activeView === 'pos' && (
                 <POS 
                    products={products}
                    modifierGroups={modifierGroups}
                    categoryModifiers={categoryModifiers}
                    openTabs={openTabs}
                    onSaveTab={handleSaveTab}
                    onUpdateTabItem={handleUpdateTabItem} // Nova prop passada para o POS
                    onDeleteTab={handleDeleteTab}
                    onCompleteSale={handleCompleteSale}
                    activeShift={shifts.find(s => s.status === 'open')}
                    onViewChange={setActiveView}
                    theme={theme}
                 />
              )}

              {activeView === 'products' && (
                 <ProductList 
                    products={products}
                    setProducts={handleUpdateProducts}
                    modifierGroups={modifierGroups}
                    setModifierGroups={handleUpdateModifierGroups}
                    categoryModifiers={categoryModifiers}
                    setCategoryModifiers={(updater) => {
                       setCategoryModifiers(prev => {
                          const next = updater(prev);
                          persist('categoryModifiers', next);
                          return next;
                       });
                    }}
                    openTabs={openTabs}
                    onSaveTab={handleSaveTab}
                    categories={categories}
                    setCategories={handleUpdateCategories}
                    currentUser={currentUser}
                    onSaveProduct={(p) => {
                       setProducts(prev => {
                          const exists = prev.some(x => x.id === p.id);
                          const next = exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
                          return next;
                       });
                       persist('products', p, p.id);
                    }}
                    onDeleteProduct={(id) => {
                       setProducts(prev => {
                          const next = prev.filter(p => p.id !== id);
                          persist('products', next);
                          return next;
                       });
                    }}
                 />
              )}

              {activeView === 'history' && (
                 <SalesHistory 
                    sales={sales} 
                    onDeleteSale={(id) => {
                       setSales(prev => {
                          const next = prev.map(s => s.id === id ? {...s, deleted: true, deletedAt: Date.now(), deletedBy: currentUser.id} : s);
                          const updated = next.find(s => s.id === id);
                          if(updated) persist('sales', updated, id);
                          return next;
                       });
                    }} 
                    users={users} 
                    currentUser={currentUser} 
                    activeUnitId={activeUnitId} 
                    syncConfig={syncConfig} 
                 />
              )}

              {activeView === 'reports' && (
                 <Reports 
                    sales={sales} 
                    products={products} 
                    users={users} 
                    shifts={shifts} 
                    currentUser={currentUser} 
                    onQuitarPendura={(name, amount) => {
                       const quitacaoSale: Sale = {
                          id: generateUniqueId('sale'),
                          timestamp: Date.now(),
                          items: [{ id: 'q1', productId: 'quitacao', productName: 'Quitação Fiado', category: 'FIADO', quantity: 1, unitPrice: amount, totalPrice: amount }],
                          paymentMethod: PaymentMethod.CASH,
                          payments: [{ method: PaymentMethod.CASH, amount }],
                          total: amount,
                          customerName: name,
                          userId: currentUser.id,
                          shiftId: shifts.find(s => s.status === 'open')?.id || ''
                       };
                       handleCompleteSale([quitacaoSale]);
                       alert("Quitação registrada!");
                    }} 
                    penduraThreshold={penduraThreshold} 
                    activeUnitId={activeUnitId} 
                    syncConfig={syncConfig} 
                    theme={theme}
                 />
              )}

              {activeView === 'users' && (
                 <UserManagement 
                    users={users} 
                    units={units}
                    onUpdateUsers={handleUpdateUsers}
                 />
              )}

              {activeView === 'shifts' && (
                 <ShiftControl 
                    shifts={shifts}
                    onUpdateShifts={handleUpdateShifts}
                    currentUser={currentUser}
                    sales={sales}
                    activeTabsCount={openTabs.length}
                 />
              )}

              {activeView === 'cash' && (
                 <CashManagement 
                    shifts={shifts}
                    onUpdateShifts={handleUpdateShifts}
                    onRegisterTransaction={handleRegisterTransaction}
                    sales={sales}
                    currentUser={currentUser}
                    onViewChange={setActiveView}
                 />
              )}

              {activeView === 'settings' && (
                 <Settings 
                    products={products}
                    sales={sales}
                    openTabs={openTabs}
                    users={users}
                    shifts={shifts}
                    units={units}
                    onUpdateUnits={handleUpdateUnits}
                    onImport={(data) => {
                       if(data === 'EXPORT_NOW') {
                          const blob = new Blob([JSON.stringify({ products, sales, users, shifts, openTabs, units, categories }, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `backup-${Date.now()}.json`;
                          link.click();
                       } else {
                          if(data.products) setProducts(data.products);
                          if(data.sales) setSales(data.sales);
                          if(data.users) setUsers(data.users);
                          if(data.shifts) setShifts(data.shifts);
                          if(data.openTabs) setOpenTabs(data.openTabs);
                          alert("Dados importados! (Recarregue para persistir se necessário)");
                       }
                    }}
                    dbStatus={dbStatus}
                    currentUser={currentUser}
                    penduraThreshold={penduraThreshold}
                    setPenduraThreshold={setPenduraThreshold}
                 />
              )}

              {activeView === 'help' && <Help />}
          </div>

          <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} currentUser={currentUser.username} />
       </main>
    </div>
  );
};