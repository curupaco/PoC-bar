import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, Sale, Tab, User, Shift, ModifierGroup, Category, Unit, AuditLog, generateUniqueId, SaleItem, PRODUCT_ID_DEBT_SETTLEMENT } from '../types';
import { useSync } from './useSync';
import { SyncQueue } from '../utils/syncQueue';
import { idb } from '../utils/idb';
import { safeLocalStorage } from '../utils/storage';
import { ALL_PERMISSIONS } from '../constants/permissions';

interface AppStoreProps {
  currentUser: User | null;
  currentUserRef: React.MutableRefObject<User | null>;
  showToast: (msg: string, type?: 'info' | 'error') => void;
}

export const useAppStore = ({ currentUser, currentUserRef, showToast }: AppStoreProps) => {
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'offline'>('idle');
  const [serverHealth, setServerHealth] = useState<'ok' | 'error'>('ok');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

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

  // Logic for Unit selection and validation
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

    return units.filter(u => u.isActive && allowedStrings.includes(String(u.id)));
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

  // Sync Logic
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

  useEffect(() => {
    if (dbStatus === 'success') setLastSyncTime(Date.now());
  }, [dbStatus]);

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

  // Persistence helpers
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
  }, [validatedActiveUnitId, persist, saveLocalCache, auditLogs, showToast, currentUserRef]);

  // Handlers for child components
  const handleSwitchUnit = () => {
    setRawActiveUnitId(null);
    safeLocalStorage.removeItem('btq_active_unit');
    setProducts([]); setSales([]); setOpenTabs([]); setShifts([]);
    setModifierGroups([]); setCategories([]); setCategoryModifiers({});
    setDbStatus('idle'); setLastSyncTime(null);
    refresh();
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
      }
      saveLocalCache('openTabs', nextTabs);
      return nextTabs;
    });

    updateLocalTimestamp('openTabs');
    await persist('openTabs', tab, tab.id);

    const isNew = !openTabs.some(t => t.id === tab.id);
    if (isNew) {
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
              currentItems.splice(idx, 1);
            } else {
              currentItems[idx] = item;
            }
          } else if (item.quantity > 0) {
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
        const next = typeof updater === 'function' ? updater(prev) : updater;
        updateLocalTimestamp('products');
        saveLocalCache('products', next);
        persist('products', next);
        return next;
      });
    } catch (e) {
      showToast("Falha ao salvar produtos", "error");
    }
  }, [persist, updateLocalTimestamp, saveLocalCache, showToast]);

  const handleUpdateCategoryModifiers = useCallback(async (updater: any) => {
    try {
      setCategoryModifiers(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
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
        addAuditLog(changedItem.status === 'open' ? 'SHIFT_OPEN' : 'SHIFT_CLOSE', `Turno ${changedItem.id} ${changedItem.status === 'open' ? 'aberto' : 'fechado'} por @${currentUserRef.current?.username}`);
      }
      else await persist('shifts', newShifts);
    } catch (e) {
      showToast("Falha ao atualizar turno", "error");
    }
  }, [persist, updateLocalTimestamp, saveLocalCache, addAuditLog, shifts, showToast, currentUserRef]);

  const handleUpdateUsers = useCallback((newUsers: User[], changedItem?: User) => {
    setUsers(newUsers);
    updateLocalTimestamp('users');
    saveLocalCache('users', newUsers);
    if (changedItem) persistGlobal('users', changedItem, changedItem.id);
    else persistGlobal('users', newUsers);
  }, [persistGlobal, updateLocalTimestamp, saveLocalCache]);

  const handleUpdateUnits = useCallback((newUnits: Unit[]) => {
    setUnits(newUnits);
    saveLocalCache('units', newUnits);
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
      await persist('sales', s, s.id);
    }
    if (tabIdToClose) {
      const tab = openTabs.find(t => t.id === tabIdToClose);
      if (tab) {
        addAuditLog('TAB_CLOSE', `Mesa fechada: ${tab.name} | Total: ${newSalesList.reduce((acc, s) => acc + s.total, 0)}`);
        await handleDeleteTab(tabIdToClose);
      } else {
        addAuditLog('TAB_CLOSE', `TENTATIVA DUPLICADA: Mesa ID ${tabIdToClose} já fechada.`);
      }
    }
  }, [persist, handleDeleteTab, updateLocalTimestamp, saveLocalCache, openTabs, addAuditLog]);

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

  return {
    // State
    products, setProducts, modifierGroups, setModifierGroups, categories, setCategories,
    categoryModifiers, setCategoryModifiers, sales, setSales, openTabs, setOpenTabs,
    users, setUsers, shifts, setShifts, units, setUnits, auditLogs, setAuditLogs,
    penduraThreshold, setPenduraThreshold, longDurationThreshold, setLongDurationThreshold,
    dbStatus, setDbStatus, lastSyncTime, pendingSyncCount, validatedActiveUnitId, visibleUnits,
    setRawActiveUnitId, syncConfig,

    // Handlers
    handleSwitchUnit, handleSaveTab, handleUpdateTabItem, handleDeleteTab,
    handleUpdateProducts, handleUpdateCategoryModifiers, handleUpdateShifts,
    handleUpdateUsers, handleUpdateUnits, handleCompleteSale, handleDataManagement, handleExportData,
    persist, persistGlobal, saveLocalCache, addAuditLog, refresh, serverHealth
  };
};
