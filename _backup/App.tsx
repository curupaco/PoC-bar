import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import ConfirmationModal from './components/ConfirmationModal';
import { useSync } from './hooks/useSync';
import { SyncQueue } from './utils/syncQueue';
import { hashPassword } from './services/cryptoService';
import LoadingScreen from './components/LoadingScreen';
import { getFirebaseToken } from './services/firebaseService';
import { idb } from './utils/idb';

// --- SAFE STORAGE UTILITY ---
// Previne tela branca em navegadores com cookies bloqueados ou modo anônimo estrito
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage Access Denied:', e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Falha silenciosa
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Falha silenciosa
    }
  }
};

const ALL_PERMISSIONS: UserPermission[] = [
  'dashboard', 'pos', 'products', 'history', 'reports', 'settings',
  'users_admin', 'shifts_admin', 'cash_admin', 'open_shift', 'close_shift',
  'delete_sale', 'delete_product', 'edit_product', 'export_report',
  'clear_fiado', 'full_reset', 'manage_backup', 'help_view', 'manage_units'
];

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const currentUserRef = useRef<User | null>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const [activeView, setActiveView] = useState<View>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'offline'>('idle');
  const [serverHealth, setServerHealth] = useState<'ok' | 'error'>('ok');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [shortcutCheckout, setShortcutCheckout] = useState<{ name: string; amount: number } | null>(null);
  
  // Estado para Modal de Confirmação Global
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void; 
    isDanger?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, isDanger: false
  });
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = safeLocalStorage.getItem('btq_theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    safeLocalStorage.setItem('btq_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const checkServer = async () => {
       try {
          const res = await fetch('/api/health');
          setServerHealth(res.ok ? 'ok' : 'error');
       } catch {
          setServerHealth('error');
       }
    };
    checkServer();
    const interval = setInterval(checkServer, 20000);
    return () => clearInterval(interval);
  }, []);

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
  const [longDurationThreshold, setLongDurationThreshold] = useState(4);
  
  const [rawActiveUnitId, setRawActiveUnitId] = useState<string | null>(() => safeLocalStorage.getItem('btq_active_unit'));

  const visibleUnits = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.username === 'admin') return units;

    let allowedStrings: string[] = [];
    const rawAllowed = currentUser.allowedUnits;

    if (Array.isArray(rawAllowed)) {
        allowedStrings = rawAllowed.map(String);
    } else if (typeof rawAllowed === 'object' && rawAllowed !== null) {
        allowedStrings = Object.values(rawAllowed).map(String);
    }

    if (allowedStrings.length === 0) return [];

    return units.filter(u => {
        return u.isActive && allowedStrings.includes(String(u.id));
    });
  }, [currentUser, units]);

  const validatedActiveUnitId = useMemo(() => {
    if (!currentUser) return null;
    if (visibleUnits.length === 1) return visibleUnits[0].id;
    if (visibleUnits.length === 0 && currentUser.username !== 'admin') return null;
    if (!rawActiveUnitId) return null;
    if (currentUser.username === 'admin') return units.some(u => u.id === rawActiveUnitId) ? rawActiveUnitId : null;
    const hasAccess = visibleUnits.some(u => u.id === rawActiveUnitId);
    return hasAccess ? rawActiveUnitId : null;
  }, [currentUser, rawActiveUnitId, visibleUnits, units]);

  useEffect(() => {
    if (validatedActiveUnitId) {
       if (rawActiveUnitId !== validatedActiveUnitId) {
          setRawActiveUnitId(validatedActiveUnitId);
          safeLocalStorage.setItem('btq_active_unit', validatedActiveUnitId);
       }
    } else if (rawActiveUnitId && visibleUnits.length > 1) {
       setRawActiveUnitId(null);
       safeLocalStorage.removeItem('btq_active_unit');
    }
  }, [validatedActiveUnitId, rawActiveUnitId, visibleUnits]);

  useEffect(() => {
    if (currentUser && users.length > 0) {
      const freshUser = users.find(u => u.id === currentUser.id);
      if (freshUser) {
         const currentPerms = JSON.stringify([...(currentUser.permissions || [])].sort());
         const freshPerms = JSON.stringify([...(freshUser.permissions || [])].sort());
         const currentUnits = JSON.stringify(currentUser.allowedUnits || []);
         const freshUnits = JSON.stringify(freshUser.allowedUnits || []);

         if (currentPerms !== freshPerms || currentUnits !== freshUnits) {
            console.log("Sessão atualizada com novas permissões");
            setCurrentUser(prev => prev ? ({ ...prev, ...freshUser }) : null);
         }
      }
    }
  }, [users, currentUser?.id]);

  const syncConfig = useMemo(() => ({ 
    url: 'https://poc-botequista-default-rtdb.firebaseio.com', 
    key: 'REMOVED_FIREBASE_API_KEY', 
    email: 'curupaco@gmail.com', 
    pass: 'REMOVED_FIREBASE_PASSWORD', 
    allPerms: ALL_PERMISSIONS 
  }), []);

  const handleSetOpenTabs = useCallback((tabs: any) => {
    const sanitized = (!tabs) ? [] : (Array.isArray(tabs) ? tabs : Object.values(tabs)).filter(Boolean).map((t: any) => ({
      ...t,
      orders: Array.isArray(t.orders) ? t.orders : []
    }));
    setOpenTabs(sanitized);
  }, []);

  const { 
    isSyncing, 
    lastSync, 
    error: syncError, 
    forcePull, 
    pushData 
  } = useSync({
    config: syncConfig,
    collections: {
      products: { data: products, setData: setProducts },
      categories: { data: categories, setData: setCategories },
      sales: { data: sales, setData: setSales },
      openTabs: { data: openTabs, setData: handleSetOpenTabs },
      users: { data: users, setData: setUsers },
      shifts: { data: shifts, setData: setShifts },
      units: { data: units, setData: setUnits },
      modifierGroups: { data: modifierGroups, setData: setModifierGroups },
      categoryModifiers: { data: categoryModifiers, setData: setCategoryModifiers }
    },
    onSyncComplete: (timestamp) => {
      setLastSyncTime(timestamp);
      setDbStatus('success');
    },
    onSyncError: (err) => {
      console.error("Sync Error:", err);
      setDbStatus('error');
    },
    currentUser
  });

  useEffect(() => {
    if (isSyncing) setDbStatus('loading');
  }, [isSyncing]);

  const handleLogin = async (username: string, pin: string) => {
    const user = users.find(u => u.username === username);
    if (user) {
      const hashed = hashPassword(pin);
      if (user.pin === hashed || user.pin === pin) { // Fallback para pin não hasheado (legado)
        setCurrentUser(user);
        setLoginError(null);
        
        // Se for admin, garante acesso a tudo
        if (user.username === 'admin') {
           // Admin logic handled in visibleUnits
        }
      } else {
        setLoginError('Senha incorreta');
      }
    } else {
      setLoginError('Usuário não encontrado');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('pos');
    setIsSidebarOpen(false);
  };

  const handleConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      isDanger,
      confirmLabel,
      cancelLabel
    });
  };

  const handleAddProduct = (product: Product) => {
    const newProducts = [...products, product];
    setProducts(newProducts);
    pushData('products', newProducts);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(newProducts);
    pushData('products', newProducts);
  };

  const handleDeleteProduct = (productId: string) => {
    const newProducts = products.filter(p => p.id !== productId);
    setProducts(newProducts);
    pushData('products', newProducts);
  };

  const handleAddSale = (sale: Sale) => {
    const newSales = [...sales, sale];
    setSales(newSales);
    pushData('sales', newSales);
  };

  const handleUpdateTab = (updatedTab: Tab) => {
    const newTabs = openTabs.map(t => t.id === updatedTab.id ? updatedTab : t);
    setOpenTabs(newTabs);
    pushData('openTabs', newTabs);
  };

  const handleCloseTab = (tabId: string) => {
    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);
    pushData('openTabs', newTabs);
  };

  const handleAddUser = (user: User) => {
    const newUsers = [...users, user];
    setUsers(newUsers);
    pushData('users', newUsers);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(newUsers);
    pushData('users', newUsers);
  };

  const handleDeleteUser = (userId: string) => {
    const newUsers = users.filter(u => u.id !== userId);
    setUsers(newUsers);
    pushData('users', newUsers);
  };

  const handleOpenShift = (initialCash: number) => {
    if (!currentUser) return;
    const newShift: Shift = {
      id: generateUniqueId(),
      openedBy: currentUser.username,
      openedAt: new Date().toISOString(),
      initialCash,
      status: 'open',
      cashTransactions: [],
      unitId: validatedActiveUnitId || 'default'
    };
    const newShifts = [...shifts, newShift];
    setShifts(newShifts);
    pushData('shifts', newShifts);
  };

  const handleCloseShift = (shiftId: string, closingCash: number, actualCash: number, observations: string) => {
    const newShifts = shifts.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          closedAt: new Date().toISOString(),
          closingCash,
          actualCash,
          observations,
          status: 'closed' as const
        };
      }
      return s;
    });
    setShifts(newShifts);
    pushData('shifts', newShifts);
  };

  const handleAddCashTransaction = (shiftId: string, transaction: CashTransaction) => {
    const newShifts = shifts.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          cashTransactions: [...s.cashTransactions, transaction]
        };
      }
      return s;
    });
    setShifts(newShifts);
    pushData('shifts', newShifts);
  };
  
  const handleUpdateUnit = (unit: Unit) => {
    const exists = units.some(u => u.id === unit.id);
    let newUnits;
    if (exists) {
        newUnits = units.map(u => u.id === unit.id ? unit : u);
    } else {
        newUnits = [...units, unit];
    }
    setUnits(newUnits);
    pushData('units', newUnits);
  };
  
  const handleDeleteUnit = (unitId: string) => {
    const newUnits = units.filter(u => u.id !== unitId);
    setUnits(newUnits);
    pushData('units', newUnits);
  };

  // --- SHORTCUT CHECKOUT HANDLER ---
  // Permite que o Dashboard inicie um checkout rápido de um produto
  const handleShortcutCheckout = (productName: string, amount: number) => {
    setShortcutCheckout({ name: productName, amount });
    setActiveView('pos');
  };

  // --- RENDER ---

  if (!currentUser) {
    return (
      <>
        <Login 
          onLogin={handleLogin} 
          users={users} 
          error={loginError} 
          dbStatus={dbStatus}
          onForceSync={forcePull}
        />
        <div className="fixed bottom-2 right-2 text-xs text-slate-500 opacity-50">
           v1.0.5 | Server: {serverHealth}
        </div>
      </>
    );
  }

  // Filtra dados pela unidade ativa (se aplicável)
  // Se for admin e não tiver unidade selecionada, vê tudo? Ou vê aviso?
  // Vamos assumir: Admin vê tudo se não tiver unidade selecionada? Não, o sistema precisa de contexto.
  // Se não tiver unidade selecionada, bloqueia uso e pede seleção.
  
  const needsUnitSelection = visibleUnits.length > 1 && !validatedActiveUnitId;
  
  // Dados filtrados
  const activeUnitId = validatedActiveUnitId || 'default';
  
  // Produtos e Categorias são globais ou por unidade?
  // Por enquanto, vamos assumir globais, mas vendas e turnos são por unidade.
  // Se quiser produtos por unidade, precisaria filtrar aqui.
  // Vamos filtrar Vendas, Turnos e Tabs por unidade.
  
  const filteredSales = sales.filter(s => !s.unitId || s.unitId === activeUnitId);
  const filteredShifts = shifts.filter(s => !s.unitId || s.unitId === activeUnitId);
  const filteredTabs = openTabs.filter(t => !t.unitId || t.unitId === activeUnitId);

  const currentShift = filteredShifts.find(s => s.status === 'open');

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentUser={currentUser}
        onLogout={handleLogout}
        dbStatus={dbStatus}
        onForceSync={forcePull}
        theme={theme}
        setTheme={setTheme}
        setFeedbackOpen={setFeedbackOpen}
        setStatusModalOpen={setStatusModalOpen}
        activeUnitId={validatedActiveUnitId}
        units={units}
        onSelectUnit={(id) => {
            setRawActiveUnitId(id);
            safeLocalStorage.setItem('btq_active_unit', id);
            window.location.reload(); // Recarrega para garantir consistência
        }}
        visibleUnits={visibleUnits}
      />

      <main className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 relative ${isSidebarCollapsed ? 'ml-0 md:ml-0' : 'ml-0'}`}>
        {/* Mobile Header Overlay */}
        {!isSidebarOpen && (
          <div className="md:hidden absolute top-4 left-4 z-20">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-slate-800 text-white rounded-lg shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        )}

        {needsUnitSelection ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Selecione uma Unidade</h2>
                <p className="text-slate-500 mb-8">Você tem acesso a múltiplas unidades. Por favor, selecione uma para continuar.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
                    {visibleUnits.map(u => (
                        <button
                            key={u.id}
                            onClick={() => {
                                setRawActiveUnitId(u.id);
                                safeLocalStorage.setItem('btq_active_unit', u.id);
                            }}
                            className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-700 flex flex-col items-center"
                        >
                            <span className="text-lg font-semibold">{u.name}</span>
                            <span className="text-sm text-slate-500">{u.address || 'Sem endereço'}</span>
                        </button>
                    ))}
                </div>
            </div>
        ) : (
            <div className="flex-1 overflow-auto relative">
            {activeView === 'dashboard' && (
                <Dashboard 
                sales={filteredSales} 
                products={products} 
                shifts={filteredShifts}
                onNavigate={setActiveView}
                onShortcutCheckout={handleShortcutCheckout}
                />
            )}
            
            {activeView === 'pos' && (
                <POS 
                products={products} 
                categories={categories} 
                onAddSale={handleAddSale}
                currentShift={currentShift}
                openTabs={filteredTabs}
                onUpdateTab={handleUpdateTab}
                onCloseTab={handleCloseTab}
                currentUser={currentUser}
                modifierGroups={modifierGroups}
                categoryModifiers={categoryModifiers}
                activeUnitId={activeUnitId}
                shortcutItem={shortcutCheckout}
                clearShortcut={() => setShortcutCheckout(null)}
                />
            )}

            {activeView === 'products' && (
                <ProductList 
                products={products} 
                categories={categories}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateCategories={setCategories}
                onPushData={pushData}
                currentUser={currentUser}
                modifierGroups={modifierGroups}
                setModifierGroups={setModifierGroups}
                categoryModifiers={categoryModifiers}
                setCategoryModifiers={setCategoryModifiers}
                />
            )}

            {activeView === 'history' && (
                <SalesHistory 
                sales={filteredSales} 
                products={products}
                users={users}
                onDeleteSale={(saleId) => {
                    const newSales = sales.filter(s => s.id !== saleId);
                    setSales(newSales);
                    pushData('sales', newSales);
                }}
                currentUser={currentUser}
                />
            )}

            {activeView === 'reports' && (
                <Reports 
                sales={filteredSales} 
                products={products}
                shifts={filteredShifts}
                users={users}
                />
            )}

            {activeView === 'users' && (
                <UserManagement 
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                currentUser={currentUser}
                units={units}
                />
            )}

            {activeView === 'shifts' && (
                <ShiftControl 
                shifts={filteredShifts}
                currentShift={currentShift}
                onOpenShift={handleOpenShift}
                onCloseShift={handleCloseShift}
                currentUser={currentUser}
                />
            )}

            {activeView === 'cash' && (
                <CashManagement 
                currentShift={currentShift}
                onAddTransaction={handleAddCashTransaction}
                currentUser={currentUser}
                />
            )}
            
            {activeView === 'settings' && (
                <Settings 
                    currentUser={currentUser}
                    units={units}
                    onUpdateUnit={handleUpdateUnit}
                    onDeleteUnit={handleDeleteUnit}
                    onImportData={(data) => {
                        // Importação manual
                        if (data.products) { setProducts(data.products); pushData('products', data.products); }
                        if (data.categories) { setCategories(data.categories); pushData('categories', data.categories); }
                        if (data.sales) { setSales(data.sales); pushData('sales', data.sales); }
                        if (data.users) { setUsers(data.users); pushData('users', data.users); }
                        if (data.shifts) { setShifts(data.shifts); pushData('shifts', data.shifts); }
                        if (data.units) { setUnits(data.units); pushData('units', data.units); }
                        alert('Dados importados com sucesso!');
                    }}
                    onFullReset={() => {
                        if (confirm('TEM CERTEZA? Isso apagará TUDO localmente e no servidor.')) {
                            setProducts([]); setCategories([]); setSales([]); setUsers([]); setShifts([]); setUnits([]);
                            pushData('products', []); pushData('categories', []); pushData('sales', []); 
                            pushData('users', []); pushData('shifts', []); pushData('units', []);
                            window.location.reload();
                        }
                    }}
                />
            )}

            {activeView === 'help' && <Help />}
            </div>
        )}
      </main>

      <FeedbackModal 
        isOpen={feedbackOpen} 
        onClose={() => setFeedbackOpen(false)} 
        currentUser={currentUser}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
      />
      
      {/* Status Modal (Debug) */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setStatusModalOpen(false)}>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl max-w-md w-full m-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">Status do Sistema</h3>
                <div className="space-y-2 text-sm">
                    <p><strong>Server Health:</strong> {serverHealth}</p>
                    <p><strong>DB Status:</strong> {dbStatus}</p>
                    <p><strong>Last Sync:</strong> {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}</p>
                    <p><strong>Active Unit:</strong> {activeUnitId}</p>
                    <p><strong>User:</strong> {currentUser.username}</p>
                    <p><strong>Version:</strong> 1.0.5</p>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={() => setStatusModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg">Fechar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
