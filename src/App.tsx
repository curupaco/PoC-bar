
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Product, Sale, Tab, User, Shift, ModifierGroup, Unit, Category, View, UserPermission, PaymentMethod, generateUniqueId, Theme, CashTransaction, SaleItem, PRODUCT_ID_DEBT_SETTLEMENT, formatCurrency, AuditLog } from './types';
import Sidebar from './shared/ui/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import POS from './features/pos/POS';
import ProductList from './features/products/ProductList';
import SalesHistory from './features/dashboard/SalesHistory';
import Reports from './features/reports/Reports';
import UserManagement from './features/auth/UserManagement';
import ShiftControl from './features/finance/ShiftControl';
import CashManagement from './features/finance/CashManagement';
import Settings from './features/settings/Settings';
import Help from './features/help/Help';
import Login from './features/auth/Login';
import FeedbackModal from './shared/ui/FeedbackModal';
import ConfirmationModal from './shared/ui/ConfirmationModal';
import { useSync } from './hooks/useSync';
import { SyncQueue } from './utils/syncQueue';
import { hashPassword } from './services/cryptoService';
import LoadingScreen from './shared/ui/LoadingScreen';
import { getFirebaseToken } from './services/firebaseService';
import { idb } from './utils/idb';

// --- SAFE STORAGE UTILITY ---
import { LandingPage } from './features/landing/LandingPage';

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
  'clear_fiado', 'full_reset', 'manage_backup', 'help_view', 'manage_units', 'view_audit_logs'
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
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'info' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

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
    isOpen: false, title: '', message: '', onConfirm: () => { }, isDanger: false
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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
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
    url: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    key: import.meta.env.VITE_FIREBASE_API_KEY,
    email: import.meta.env.VITE_FIREBASE_EMAIL,
    pass: import.meta.env.VITE_FIREBASE_PASSWORD,
    allPerms: ALL_PERMISSIONS
  }), []);

  const handleSetOpenTabs = useCallback((tabs: any) => {
    const sanitized = (!tabs) ? [] : (Array.isArray(tabs) ? tabs : Object.values(tabs)).filter(Boolean).map((t: any) => ({
      ...t,
      items: Array.isArray(t.items) ? t.items : (t.items ? (Object.values(t.items) as SaleItem[]) : [])
    }));
    setOpenTabs(sanitized);
  }, []);

  const { refresh, registerLocalDeletion, updateLocalTimestamp, pendingSyncCount } = useSync({
    setProducts, setModifierGroups, setCategoryModifiers, setSales,
    setOpenTabs: handleSetOpenTabs,
    setUsers, setShifts, setUnits, setCategories, setAuditLogs, setDbStatus,
    activeUnitId: validatedActiveUnitId,
    config: syncConfig
  });

  // ITEM 2: Prevenção de fechamento de aba com sincronização pendente
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSyncCount > 0) {
        e.preventDefault();
        e.returnValue = 'Existem dados pendentes de sincronização. Se você sair agora, as alterações podem ser perdidas.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingSyncCount]);

  // CORREÇÃO CRÍTICA (SNAPSHOT OTIMISTA): Função auxiliar para gravar no disco IMEDIATAMENTE
  const saveLocalCache = useCallback(async (key: string, data: any) => {
    if (!validatedActiveUnitId) return;
    const cacheKey = `btq_cache_${validatedActiveUnitId}`;
    try {
      const current: any = await idb.get(cacheKey);
      const next = current || {};
      next[key] = data;
      await idb.set(cacheKey, next);
    } catch (err) {
      console.warn('Cache write failed', err);
      throw err;
    }
  }, [validatedActiveUnitId]);

  useEffect(() => {
    if (dbStatus === 'success') setLastSyncTime(Date.now());
  }, [dbStatus]);

  const persist = useCallback(async (node: string, data: any, itemId?: string) => {
    if (!validatedActiveUnitId) return;
    await SyncQueue.enqueue({ node, data, itemId, unitId: validatedActiveUnitId, action: 'overwrite' });
  }, [validatedActiveUnitId]);

  const persistGlobal = useCallback(async (node: string, data: any, itemId?: string) => {
    await SyncQueue.enqueue({ node, data, itemId, unitId: 'GLOBAL', action: 'overwrite' });
  }, []);

  const addAuditLog = useCallback(async (action: string, details: string) => {
    if (!validatedActiveUnitId || !currentUserRef.current) return;
    const log: AuditLog = {
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      userId: currentUserRef.current.id,
      username: currentUserRef.current.username,
      action,
      details,
      unitId: validatedActiveUnitId
    };
    try {
      const nextLogs = [log, ...auditLogs].slice(0, 2000);
      setAuditLogs(nextLogs);
      await saveLocalCache('auditLogs', nextLogs);
      await persist('auditLogs', log, log.id);
    } catch (e) {
      showToast("Falha ao registrar log de auditoria", "error");
    }
  }, [validatedActiveUnitId, persist, saveLocalCache, auditLogs, showToast]);

  const handleSwitchUnit = () => {
    setRawActiveUnitId(null);
    safeLocalStorage.removeItem('btq_active_unit');
    setProducts([]); setSales([]); setOpenTabs([]); setShifts([]);
    setModifierGroups([]); setCategories([]); setCategoryModifiers({});
    setDbStatus('idle'); setLastSyncTime(null);
    refresh();
  };

  // Logout Real
  const performLogout = () => {
    handleSwitchUnit();
    setCurrentUser(null);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Solicitação de Logout (Abre Modal)
  const requestLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Vai abandonar o barco?',
      message: 'O bar vai sentir sua falta. Tem certeza que quer sair agora?',
      onConfirm: performLogout,
      confirmLabel: 'Passar a Régua',
      cancelLabel: 'Pedir a Saideira',
      isDanger: true
    });
  };

  const handleSaveTab = useCallback(async (tab: Tab) => {
    const sanitizedTab: Tab = { ...tab, items: Array.isArray(tab.items) ? tab.items : (Object.values(tab.items || {}) as SaleItem[]) };
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.id === tab.id);
      let nextTabs;
      if (idx >= 0) {
        nextTabs = [...prev];
        nextTabs[idx] = sanitizedTab;
      } else {
        sanitizedTab.version = 1;
        nextTabs = [...prev, sanitizedTab];
        console.log(`[MESA_ABERTURA] ID: ${tab.id} | Nome: ${tab.name} | Aberta por: ${currentUserRef.current?.username}`);
      }
      saveLocalCache('openTabs', nextTabs);
      return nextTabs;
    });

    updateLocalTimestamp('openTabs');
    await persist('openTabs', tab, tab.id);

    const isNew = !openTabs.some(t => t.id === tab.id);
    if (isNew) {
      console.log(`[MESA_ABERTURA] ID: ${tab.id} | Nome: ${tab.name} | Aberta por: ${currentUserRef.current?.username}`);
      addAuditLog('TAB_OPEN', `Mesa aberta: ${tab.name}`);
    } else {
      addAuditLog('TAB_UPDATE', `Mesa atualizada: ${tab.name}`);
    }

  }, [persist, saveLocalCache, updateLocalTimestamp, openTabs, addAuditLog]);

  const handleUpdateTabItem = useCallback(async (tabId: string, item: SaleItem) => {
    setOpenTabs(prev => {
      const nextTabs = prev.map(t => {
        if (t.id === tabId) {
          const currentItems = Array.isArray(t.items) ? [...t.items] : (Object.values(t.items || {}) as SaleItem[]);
          const idx = currentItems.findIndex((i: SaleItem) => i.id === item.id);
          if (idx > -1) {
            if (item.quantity <= 0) {
              console.log(`[MESA_INCREMENTO] Removido item da Mesa ${t.name}: ${item.productName}`);
              currentItems.splice(idx, 1);
            } else {
              const diff = item.quantity - currentItems[idx].quantity;
              if (diff !== 0) {
                console.log(`[MESA_INCREMENTO] Mesa ${t.name} | ${diff > 0 ? 'Adicionado' : 'Removido'} ${Math.abs(diff)}x ${item.productName}`);
              }
              currentItems[idx] = item;
            }
          } else if (item.quantity > 0) {
            console.log(`[MESA_INCREMENTO] Mesa ${t.name} | Novo item: ${item.quantity}x ${item.productName}`);
            currentItems.push(item);
          }
          return { ...t, items: currentItems };
        }
        return t;
      });
      saveLocalCache('openTabs', nextTabs);
      return nextTabs;
    });
    updateLocalTimestamp('openTabs');
    await persist(`openTabs/${tabId}/items`, item.quantity <= 0 ? null : item, item.id);
  }, [persist, saveLocalCache, updateLocalTimestamp]);

  const handleDeleteTab = useCallback(async (tabId: string) => {
    setOpenTabs(prev => {
      if (!prev.some(t => t.id === tabId)) return prev;

      const nextTabs = prev.filter(t => t.id !== tabId);
      saveLocalCache('openTabs', nextTabs);
      return nextTabs;
    });
    updateLocalTimestamp('openTabs');
    await persist('openTabs', null, tabId);
    await persist(`_meta/deleted_tabs/${tabId}`, Date.now());
    await registerLocalDeletion(tabId);
    addAuditLog('TAB_DELETE', `Mesa descartada ID: ${tabId}`);
  }, [persist, registerLocalDeletion, saveLocalCache, updateLocalTimestamp, addAuditLog]);

  const handleUpdateProducts = useCallback(async (updater: any) => {
    try {
      setProducts(prev => {
        const next = updater(prev);
        updateLocalTimestamp('products');
        saveLocalCache('products', next);
        persist('products', next);
        return next;
      });
    } catch (e) {
      showToast("Falha ao salvar produtos", "error");
    }
  }, [persist, updateLocalTimestamp, saveLocalCache, showToast]);

  const handleUpdateCategoryModifiers = useCallback(async (updater: (prev: Record<string, string>) => Record<string, string>) => {
    try {
      setCategoryModifiers(prev => {
        const next = updater(prev);
        updateLocalTimestamp('categoryModifiers');
        saveLocalCache('categoryModifiers', next);
        persist('categoryModifiers', next);
        return next;
      });
    } catch (e) {
      showToast("Falha ao salvar modificadores", "error");
    }
  }, [persist, updateLocalTimestamp, saveLocalCache, showToast]);

  const handleUpdateShifts = useCallback(async (newShifts: Shift[], changedItem?: Shift) => {
    if (changedItem && changedItem.status === 'closed') {
      const existing = shifts.find(s => s.id === changedItem.id);
      if (existing && existing.status === 'closed') {
        console.warn(`[GATEWAY] Turno ${changedItem.id} já consta como fechado. Ignorando atualização de estado.`);
        addAuditLog('SHIFT_CLOSE', `TENTATIVA DUPLICADA: Turno ${changedItem.id} fechado por @${currentUserRef.current?.username}`);
        return;
      }
    }

    try {
      setShifts(newShifts);
      updateLocalTimestamp('shifts');
      await saveLocalCache('shifts', newShifts);
      if (changedItem) {
        await persist('shifts', changedItem, changedItem.id);
        const action = changedItem.status === 'open' ? 'SHIFT_OPEN' : 'SHIFT_CLOSE';
        addAuditLog(action, `Turno ${changedItem.id} ${changedItem.status === 'open' ? 'aberto' : 'fechado'} por @${currentUserRef.current?.username}`);
      }
      else await persist('shifts', newShifts);
    } catch (e) {
      showToast("Falha ao atualizar turno", "error");
    }
  }, [persist, updateLocalTimestamp, saveLocalCache, addAuditLog, shifts, showToast]);

  const handleUpdateUsers = useCallback((newUsers: User[], changedItem?: User) => {
    setUsers(newUsers);
    updateLocalTimestamp('users');
    saveLocalCache('users', newUsers); // Snapshot

    const current = currentUserRef.current;
    if (changedItem && current && changedItem.id === current.id) {
      setCurrentUser(prev => prev ? ({ ...prev, ...changedItem }) : null);
    }

    if (changedItem) persistGlobal('users', changedItem, changedItem.id);
    else persistGlobal('users', newUsers);
  }, [persistGlobal, updateLocalTimestamp, saveLocalCache]);

  const handleUpdateUnits = useCallback((newUnits: Unit[]) => {
    setUnits(newUnits);
    saveLocalCache('units', newUnits); // Snapshot
    persistGlobal('units', newUnits);
  }, [persistGlobal, saveLocalCache]);

  const handleCompleteSale = useCallback(async (newSalesList: Sale[], tabIdToClose?: string) => {
    setSales(prev => {
      const next = [...prev, ...newSalesList];
      saveLocalCache('sales', next);
      return next;
    });

    updateLocalTimestamp('sales');
    for (const s of newSalesList) {
      console.log(`[PAGAMENTO] Venda ID: ${s.id} | Mesa: ${s.tabName || 'Balcão'} | Valor: ${formatCurrency(s.total)} | Forma: ${s.paymentMethod}`);
      await persist('sales', s, s.id);
    }

    if (tabIdToClose) {
      const tab = openTabs.find(t => t.id === tabIdToClose);
      if (tab) {
        console.log(`[MESA_FECHAMENTO] Mesa: ${tab.name} | Total Pago: ${formatCurrency(newSalesList.reduce((acc, s) => acc + s.total, 0))}`);
        addAuditLog('TAB_CLOSE', `Mesa fechada: ${tab.name} | Total: ${formatCurrency(newSalesList.reduce((acc, s) => acc + s.total, 0))}`);
        await handleDeleteTab(tabIdToClose);
      } else {
        console.warn(`[GATEWAY] Tentativa de fechar mesa já fechada ou inexistente: ${tabIdToClose}`);
        addAuditLog('TAB_CLOSE', `TENTATIVA DUPLICADA: Mesa ID ${tabIdToClose} já fechada.`);
      }
    }

    if (shortcutCheckout) {
      setActiveView('reports');
      setShortcutCheckout(null);
    }
  }, [persist, handleDeleteTab, updateLocalTimestamp, shortcutCheckout, saveLocalCache, openTabs, addAuditLog]);

  const handleLogin = (u: string, p: string) => {
    setLoginError(null);
    if (u === 'admin' && p === 'admin') {
      setCurrentUser({ id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: ALL_PERMISSIONS });
      return;
    }
    const found = users.find(user => user.username === u && (user.password === p || user.password === hashPassword(p)));
    if (found) {
      setCurrentUser(JSON.parse(JSON.stringify(found)));
    } else {
      setLoginError("Credenciais inválidas.");
    }
  };

  const isShiftOpen = useMemo(() => Array.isArray(shifts) && shifts.some(s => s.status === 'open'), [shifts]);

  const totalPendura = useMemo(() => {
    return sales.reduce((acc, s) => {
      if (s.deleted) return acc;
      let debit = 0;
      if (s.paymentMethod === 'Pendura') debit = s.total;
      if (s.payments) { const pPart = s.payments.find(p => p.method === 'Pendura'); if (pPart) debit = pPart.amount; }
      if (s.items?.some(i => i.productId === PRODUCT_ID_DEBT_SETTLEMENT)) debit -= s.total;
      return acc + debit;
    }, 0);
  }, [sales]);

  const handleExportData = useCallback(() => {
    const backupData = {
      products, sales, users, shifts, openTabs, modifierGroups, categoryModifiers, categories, units,
      config: { penduraThreshold, longDurationThreshold },
      meta: { exportedAt: Date.now(), exportedBy: currentUser?.username, systemVersion: '3.9.x' }
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `botequista_backup_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [products, sales, users, shifts, openTabs, modifierGroups, categoryModifiers, categories, units, penduraThreshold, longDurationThreshold, currentUser]);

  const handleDataManagement = useCallback((data: any) => {
    if (data === 'EXPORT_NOW') { handleExportData(); return; }
    if (data) {
      if (data.products) { setProducts(data.products); updateLocalTimestamp('products'); saveLocalCache('products', data.products); persist('products', data.products); }
      if (data.sales) { setSales(data.sales); updateLocalTimestamp('sales'); saveLocalCache('sales', data.sales); persist('sales', data.sales); }
      if (data.users) { setUsers(data.users); updateLocalTimestamp('users'); saveLocalCache('users', data.users); persistGlobal('users', data.users); }
      if (data.shifts) { setShifts(data.shifts); updateLocalTimestamp('shifts'); saveLocalCache('shifts', data.shifts); persist('shifts', data.shifts); }
      if (data.units) { setUnits(data.units); saveLocalCache('units', data.units); persistGlobal('units', data.units); }

      if (data.modifierGroups) { setModifierGroups(data.modifierGroups); updateLocalTimestamp('modifierGroups'); saveLocalCache('modifierGroups', data.modifierGroups); persist('modifierGroups', data.modifierGroups); }
      if (data.categoryModifiers) { setCategoryModifiers(data.categoryModifiers); updateLocalTimestamp('categoryModifiers'); saveLocalCache('categoryModifiers', data.categoryModifiers); persist('categoryModifiers', data.categoryModifiers); }
      if (data.categories) { setCategories(data.categories); updateLocalTimestamp('categories'); saveLocalCache('categories', data.categories); persist('categories', data.categories); }
      if (data.openTabs) { setOpenTabs(data.openTabs); updateLocalTimestamp('openTabs'); saveLocalCache('openTabs', data.openTabs); persist('openTabs', data.openTabs); }
      if (data.config) {
        if (data.config.penduraThreshold) setPenduraThreshold(data.config.penduraThreshold);
        if (data.config.longDurationThreshold) setLongDurationThreshold(data.config.longDurationThreshold);
      }
    }
  }, [handleExportData, persist, persistGlobal, updateLocalTimestamp, saveLocalCache]);

  if (window.location.pathname.startsWith('/landing')) {
    return <LandingPage />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={dbStatus === 'loading' && users.length === 0} error={loginError} />;
  }

  if (!validatedActiveUnitId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-2xl w-full animate-in fade-in zoom-in-95">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-10 text-center italic">Qual o Bar de hoje?</h2>
          {visibleUnits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {visibleUnits.map(unit => (
                <button key={unit.id} onClick={() => { setRawActiveUnitId(unit.id); safeLocalStorage.setItem('btq_active_unit', unit.id); setDbStatus('loading'); }} className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 hover:shadow-2xl transition-all group text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unidade</span>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase group-hover:text-red-600 transition-colors">{unit.name}</h3>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-100 dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-bold uppercase text-xs">Nenhuma unidade disponível para seu perfil.</p>
              <p className="text-slate-400 text-[10px] mt-2">Contate o administrador.</p>
            </div>
          )}
          <button onClick={requestLogout} className="mt-12 w-full py-4 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors tracking-widest">Sair do Sistema</button>
        </div>
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
      </div>
    );
  }

  if (dbStatus === 'loading' && products.length === 0) return <LoadingScreen message="Conectando ao Bar..." />;

  const activeUnitName = units.find(u => u.id === validatedActiveUnitId)?.name || 'Bar';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentUser={currentUser} onLogout={requestLogout} onSwitchUnit={handleSwitchUnit} isShiftOpen={isShiftOpen} activeTabsCount={openTabs.length} totalPendura={totalPendura} penduraThreshold={penduraThreshold} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} dbStatus={dbStatus} isOnline={navigator.onLine} theme={theme} />

      <main className={`flex-1 flex flex-col min-w-0 h-full relative overflow-hidden transition-all ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="shrink-0 flex justify-between items-center bg-white dark:bg-slate-900/80 p-3 md:p-6 mx-0 md:mx-10 mt-0 md:mt-8 rounded-none md:rounded-[40px] border-b md:border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-xl z-40">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-white transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex flex-col justify-center">
                <h2 className="text-xl md:text-3xl font-barrio text-slate-900 dark:text-white leading-none uppercase tracking-tight">Botequista</h2>
                <div className="flex items-center gap-2 mt-1 md:mt-1.5">
                  <button onClick={visibleUnits.length > 1 ? handleSwitchUnit : undefined} className={`bg-red-600 ${visibleUnits.length > 1 ? 'hover:bg-red-700 cursor-pointer' : 'cursor-default'} text-white px-2 py-0.5 rounded-md text-[7px] md:text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 active:scale-95 transition-all`}>
                    {activeUnitName}
                    {visibleUnits.length > 1 && <svg className="w-2.5 h-2.5 md:hidden opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                  </button>
                  {visibleUnits.length > 1 && (
                    <button onClick={handleSwitchUnit} className="hidden md:block bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-0.5 rounded-lg text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase transition-all">Trocar Unidade</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            <button onClick={() => setStatusModalOpen(true)} className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 rounded-[16px] md:rounded-[22px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:scale-[1.02]">
              <div className="hidden sm:flex flex-col items-end">
                <span className={`text-[8px] md:text-[10px] font-black uppercase ${dbStatus === 'success' && serverHealth === 'ok' ? 'text-emerald-500' :
                  dbStatus === 'success' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                  {dbStatus === 'success' && serverHealth === 'ok' ? 'SINCRONIZADO' :
                    dbStatus === 'success' ? 'ERRO API' :
                      dbStatus === 'loading' ? 'PENDENTE' : 'OFFLINE'}
                </span>
              </div>
              <div className="relative flex items-center justify-center">
                <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${dbStatus === 'success' && serverHealth === 'ok' ? 'bg-emerald-500' :
                  dbStatus === 'success' ? 'bg-amber-500' : 'bg-red-500'
                  } ${dbStatus === 'loading' ? 'animate-ping' : ''}`}></div>
                {dbStatus === 'success' && serverHealth === 'ok' && <div className="absolute inset-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 animate-pulse"></div>}
              </div>
            </button>

            <div className="flex gap-1.5 md:gap-2 border-l border-slate-100 dark:border-slate-800 pl-2 md:pl-5">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-[16px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all shadow-sm active:scale-90">
                {theme === 'dark' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" strokeWidth={2.5} /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeWidth={2.5} /></svg>}
              </button>
              <button onClick={() => setFeedbackOpen(true)} className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-[16px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-500 transition-all shadow-sm active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 w-full max-w-[1750px] mx-auto">
          {activeView === 'pos' && <POS products={products} modifierGroups={modifierGroups} categoryModifiers={categoryModifiers} openTabs={openTabs} onSaveTab={handleSaveTab} onUpdateTabItem={handleUpdateTabItem} onDeleteTab={handleDeleteTab} onCompleteSale={handleCompleteSale} activeShift={shifts.find(s => s.status === 'open')} onViewChange={setActiveView} penduraThreshold={penduraThreshold} longDurationThreshold={longDurationThreshold} dbStatus={dbStatus} shortcutCheckout={shortcutCheckout} onClearShortcut={() => setShortcutCheckout(null)} />}
          {activeView === 'products' && <ProductList products={products} setProducts={handleUpdateProducts} modifierGroups={modifierGroups} setModifierGroups={setModifierGroups} categoryModifiers={categoryModifiers} setCategoryModifiers={handleUpdateCategoryModifiers} categories={categories} setCategories={setCategories} openTabs={openTabs} onSaveTab={handleSaveTab} currentUser={currentUser} />}
          {activeView === 'shifts' && <ShiftControl shifts={shifts} onUpdateShifts={handleUpdateShifts} currentUser={currentUser} sales={sales} activeTabsCount={openTabs.length} />}
          {activeView === 'cash' && <CashManagement shifts={shifts} onUpdateShifts={handleUpdateShifts} sales={sales} currentUser={currentUser} onViewChange={setActiveView} />}
          {activeView === 'users' && <UserManagement users={users} units={units} onUpdateUsers={handleUpdateUsers} />}
          {activeView === 'dashboard' && <Dashboard sales={sales} products={products} theme={theme} />}
          {activeView === 'history' && <SalesHistory sales={sales} onDeleteSale={(id) => { const s = sales.find(x => x.id === id); if (s) { const ns = { ...s, deleted: true, deletedAt: Date.now(), deletedBy: currentUser.id }; persist('sales', ns, id); setSales(prev => { const next = prev.map(x => x.id === id ? ns : x); saveLocalCache('sales', next); return next; }); addAuditLog('SALE_DELETE', `Venda anulada ID: ${id}`); } }} users={users} currentUser={currentUser} activeUnitId={validatedActiveUnitId} syncConfig={syncConfig} />}
          {activeView === 'reports' && <Reports sales={sales} products={products} users={users} shifts={shifts} auditLogs={auditLogs} currentUser={currentUser} onQuitarPendura={(name, amt) => { setShortcutCheckout({ name, amount: amt }); setActiveView('pos'); }} penduraThreshold={penduraThreshold} activeUnitId={validatedActiveUnitId} syncConfig={syncConfig} theme={theme} />}
          {activeView === 'settings' && <Settings products={products} sales={sales} openTabs={openTabs} users={users} shifts={shifts} units={units} onUpdateUnits={handleUpdateUnits} onImport={handleDataManagement} dbStatus={dbStatus} currentUser={currentUser} penduraThreshold={penduraThreshold} setPenduraThreshold={setPenduraThreshold} longDurationThreshold={longDurationThreshold} setLongDurationThreshold={setLongDurationThreshold} />}
          {activeView === 'help' && <Help />}
        </div>

        {statusModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setStatusModalOpen(false)} />
            <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-8 italic tracking-tighter leading-none">Diagnóstico de Saúde</h3>
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Servidor Botequista</p>
                  <span className={`w-3 h-3 rounded-full ${serverHealth === 'ok' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Banco de Dados</p>
                  <span className={`w-3 h-3 rounded-full ${dbStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rede Local</p>
                  <span className={`w-3 h-3 rounded-full ${navigator.onLine ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                </div>
              </div>
              {lastSyncTime && <p className="mt-8 text-[9px] font-black text-slate-400 uppercase italic">Última Resposta: {new Date(lastSyncTime).toLocaleTimeString()}</p>}
              <button onClick={() => setStatusModalOpen(false)} className="mt-8 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Fechar Diagnóstico</button>
            </div>
          </div>
        )}
      </main>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} currentUser={currentUser?.username || ''} activeView={activeView} />

      {/* Toasts de Erro/Info */}
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[9999] px-8 py-4 rounded-full font-black uppercase text-[10px] shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}>
          {toast.type === 'error' && <span className="mr-2">⚠️</span>}
          {toast.msg}
        </div>
      )}

      {/* Modal Global de Confirmação (Estilo System Screen) */}
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
    </div>
  );
};
