import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, Sale, Tab, User, Shift, ModifierGroup, Category, Unit, AuditLog, generateUniqueId, SaleItem, PRODUCT_ID_DEBT_SETTLEMENT, StockTransaction, Franchise, RoomState, ConsignedEvent, RoomHistoryRecord, SubscriptionPlan, Subscriber, SubscriptionLog } from '../types';
import { useSync } from './useSync';
import { SyncQueue } from '../utils/syncQueue';
import { idb } from '../utils/idb';
import { safeLocalStorage } from '../utils/storage';
import { ALL_PERMISSIONS } from '../constants/permissions';
import { mockProducts, mockCategories, mockUnits, mockUsers, mockShifts, mockOpenTabs, mockSubscriptionPlans, mockSubscribers, mockSubscriptionLogs } from '../utils/mockData';

// Helper to programmatically synthesize a crisp, physical service bell ding (🛎️) using Web Audio API
const playBellChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Resume immediately or request resume on click due to browser autoplay protections
    if (audioCtx.state === 'suspended') {
      const resume = () => {
        audioCtx.resume();
        window.removeEventListener('click', resume);
      };
      window.addEventListener('click', resume);
    }

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    const gain2 = audioCtx.createGain();

    // Crisp high pitch (2200 Hz)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2200, audioCtx.currentTime);

    // Metallic chime second harmonic (4400 Hz)
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(4400, audioCtx.currentTime);

    gain1.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

    gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(audioCtx.currentTime + 1.2);
    osc2.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.warn('AudioContext not allowed or not supported:', e);
  }
};

interface AppStoreProps {
  currentUser: User | null;
  currentUserRef: React.MutableRefObject<User | null>;
  showToast: (msg: string, type?: 'info' | 'error') => void;
}

export const useAppStore = ({ currentUser, currentUserRef, showToast }: AppStoreProps) => {
  const isDemo = useMemo(() => {
    return window.location.search.includes('demo=true') || safeLocalStorage.getItem('_demo_mode') === 'true';
  }, []);

  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'offline'>(isDemo ? 'success' : 'idle');
  const [serverHealth, setServerHealth] = useState<'ok' | 'error'>('ok');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>(isDemo ? mockProducts : []);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [categoryModifiers, setCategoryModifiers] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>(isDemo ? mockCategories : []);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>(isDemo ? mockOpenTabs : []);
  const [rooms, setRooms] = useState<RoomState[]>([]);
  const [roomHistory, setRoomHistory] = useState<RoomHistoryRecord[]>([]);
  const latestOpenTabsRef = React.useRef<Tab[]>([]);
  useEffect(() => {
    latestOpenTabsRef.current = openTabs;
  }, [openTabs]);

  const [users, setUsers] = useState<User[]>(isDemo ? mockUsers : []);
  const [shifts, setShifts] = useState<Shift[]>(isDemo ? mockShifts : []);
  const [units, setUnits] = useState<Unit[]>(isDemo ? mockUnits : []);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [consignedEvents, setConsignedEvents] = useState<ConsignedEvent[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(isDemo ? mockSubscriptionPlans : []);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(isDemo ? mockSubscribers : []);
  const [subscriptionLogs, setSubscriptionLogs] = useState<SubscriptionLog[]>(isDemo ? mockSubscriptionLogs : []);
  const [penduraThreshold, setPenduraThreshold] = useState(500);
  const [longDurationThreshold, setLongDurationThreshold] = useState(4);

  const [rawActiveUnitId, setRawActiveUnitId] = useState<string | null>(() => isDemo ? 'unit-demo' : safeLocalStorage.getItem('btq_active_unit'));


  // Logic for Unit selection and validation
  const visibleUnits = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.username === 'admin') return units;

    // Lógica de Franquia: Se for admin de franquia, vê todas as unidades da mesma
    if (currentUser.permissions.includes('franchise_admin') && currentUser.franchiseId) {
      return units.filter(u => u.isActive && u.franchiseId === currentUser.franchiseId);
    }

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

  // Memoized Stock Balances
  const stockBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    stockTransactions.forEach(tx => {
      if (!balances[tx.productId]) balances[tx.productId] = 0;
      balances[tx.productId] += tx.quantity;
    });
    return balances;
  }, [stockTransactions]);

  // Sync Logic
  const syncConfig = useMemo(() => ({
    url: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    key: import.meta.env.VITE_FIREBASE_API_KEY,
    email: import.meta.env.VITE_FIREBASE_EMAIL,
    pass: import.meta.env.VITE_FIREBASE_PASSWORD,
    allPerms: ALL_PERMISSIONS,
    isDemo
  }), [isDemo]);

  const handleSetOpenTabs = useCallback((tabs: any) => {
    const sanitized = (!tabs) ? [] : (Array.isArray(tabs) ? tabs : Object.values(tabs)).filter(Boolean).map((t: any) => ({
      ...t,
      items: Array.isArray(t.items) ? t.items : (t.items ? (Object.values(t.items) as SaleItem[]) : [])
    }));

    const prevOpenTabs = latestOpenTabsRef.current;

    // Detect transition to READY status when old state exists (prevents audio storm on initial synchronization)
    if (prevOpenTabs && prevOpenTabs.length > 0) {
      sanitized.forEach((newTab: any) => {
        const oldTab = prevOpenTabs.find(t => t.id === newTab.id);
        if (oldTab) {
          newTab.items.forEach((newItem: any) => {
            if (newItem.productionStatus === 'READY') {
              const oldItem = oldTab.items.find(i => i.id === newItem.id);
              const wasNotReady = !oldItem || oldItem.productionStatus !== 'READY';

              if (wasNotReady) {
                // DING DING! Pedido pronto!
                playBellChime();

                // Format toast notification beautifully
                let msg = "Pedido pronto!";
                const normalizedName = newTab.name?.toUpperCase() || '';
                if (normalizedName.startsWith('EXPRESSA')) {
                  msg = `Pedido pronto! Venda expressa. 🛎️`;
                } else if (normalizedName.startsWith('MESA')) {
                  msg = `Pedido pronto! ${newTab.name || 'Mesa'} 🛎️`;
                } else if (newTab.name) {
                  msg = `Pedido pronto! ${newTab.name} 🛎️`;
                }

                showToast(msg, 'info');
              }
            }
          });
        }
      });
    }

    setOpenTabs(sanitized);
  }, [showToast]);

  const { refresh, registerLocalDeletion, updateLocalTimestamp, pendingSyncCount } = useSync({
    setProducts, setModifierGroups, setCategoryModifiers, setSales,
    setOpenTabs: handleSetOpenTabs,
    setUsers, setShifts, setUnits, setFranchises, setCategories, setAuditLogs, setStockTransactions, setRooms, setConsignedEvents, setRoomHistory, setDbStatus,
    setSubscriptionPlans, setSubscribers, setSubscriptionLogs,
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
    if (isDemo) return;
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
  }, [validatedActiveUnitId, isDemo]);

  const persist = useCallback(async (node: string, data: any, itemId?: string) => {
    if (isDemo) return;
    if (!validatedActiveUnitId) return;
    await SyncQueue.enqueue({ node, data, itemId, unitId: validatedActiveUnitId, action: 'overwrite' });
  }, [validatedActiveUnitId, isDemo]);

  const persistGlobal = useCallback(async (node: string, data: any, itemId?: string) => {
    if (isDemo) return;
    await SyncQueue.enqueue({ node, data, itemId, unitId: 'GLOBAL', action: 'overwrite' });
  }, [isDemo]);

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
    setRooms([]);
    setDbStatus('idle'); setLastSyncTime(null);
    refresh();
  };

  const handleSaveTab = useCallback(async (tab: Tab) => {
    try {
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
    } catch (e) {
      showToast("Falha ao salvar mesa no servidor ou cache local", "error");
    }
  }, [persist, saveLocalCache, updateLocalTimestamp, openTabs, addAuditLog, showToast]);

  const handleUpdateTabItem = useCallback(async (tabId: string, item: SaleItem) => {
    try {
      // Regras de Prevenção de Fraude: Rastrear exclusões ou reduções de itens nas comandas
      const targetTab = openTabs.find(t => t.id === tabId);
      if (targetTab) {
        const currentItems = Array.isArray(targetTab.items) ? targetTab.items : (Object.values(targetTab.items || {}) as SaleItem[]);
        const existingItem = currentItems.find((i: SaleItem) => i.id === item.id);
        if (existingItem) {
          const prevQty = existingItem.quantity;
          const newQty = item.quantity;
          const diff = newQty - prevQty;
          
          if (diff < 0) {
            const tabName = targetTab.name || 'Mesa';
            const changeDesc = newQty <= 0 
              ? `Excluiu '${item.productName}' (Qtd anterior: ${prevQty}) da comanda '${tabName}'`
              : `Reduziu '${item.productName}' de ${prevQty} para ${newQty} na comanda '${tabName}'`;
            
            if (targetTab.billPrintedAt) {
              addAuditLog('TAB_ITEM_REMOVE_AFTER_PRINT', `CRÍTICO: ${changeDesc} após impressão de pré-conta.`);
            } else {
              addAuditLog('TAB_ITEM_REMOVE', changeDesc);
            }
          }
        }
      }

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
            return { ...t, items: currentItems, lastItemAddedAt: Date.now() };
          }
          return t;
        });
        saveLocalCache('openTabs', nextTabs);
        return nextTabs;
      });
      updateLocalTimestamp('openTabs');
      await persist(`openTabs/${tabId}/items`, item.quantity <= 0 ? null : item, item.id);
      await persist(`openTabs/${tabId}`, Date.now(), 'lastItemAddedAt');
    } catch (e) {
      showToast("Falha ao atualizar item no servidor ou cache local", "error");
    }
  }, [persist, saveLocalCache, updateLocalTimestamp, showToast, openTabs, addAuditLog]);

  const handleDeleteTab = useCallback(async (tabId: string) => {
    try {
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
    } catch (e) {
      showToast("Falha ao descartar comanda no servidor", "error");
    }
  }, [persist, registerLocalDeletion, saveLocalCache, updateLocalTimestamp, addAuditLog, showToast]);

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
    try {
      setUsers(newUsers);
      updateLocalTimestamp('users');
      saveLocalCache('users', newUsers);
      if (changedItem) persistGlobal('users', changedItem, changedItem.id);
      else persistGlobal('users', newUsers);
    } catch (e) {
      showToast("Falha ao atualizar usuários", "error");
    }
  }, [persistGlobal, updateLocalTimestamp, saveLocalCache, showToast]);

  const handleResetAdminPassword = useCallback(async (firebasePass: string): Promise<boolean> => {
    if (isDemo) return false;
    if (firebasePass !== syncConfig.pass) return false;
    
    try {
      const nextUsers = users.map(u => {
        if (u.username === 'admin') {
          return {
            ...u,
            password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' // admin123
          };
        }
        return u;
      });

      const adminExists = users.some(u => u.username === 'admin');
      if (!adminExists) {
        const newAdmin: User = {
          id: 'user-admin-recovery',
          username: 'admin',
          password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
          displayName: 'Administrador',
          permissions: ALL_PERMISSIONS,
          allowedUnits: []
        };
        nextUsers.push(newAdmin);
      }
      
      setUsers(nextUsers);
      updateLocalTimestamp('users');
      saveLocalCache('users', nextUsers);
      await persistGlobal('users', nextUsers);
      addAuditLog('USER_RESET_ADMIN', 'Senha do admin redefinida via chave master');
      return true;
    } catch (e) {
      console.error("Falha ao recuperar admin:", e);
      return false;
    }
  }, [isDemo, syncConfig.pass, users, persistGlobal, saveLocalCache, updateLocalTimestamp, addAuditLog]);

  const handleUpdateUnits = useCallback((newUnits: Unit[]) => {
    try {
      setUnits(newUnits);
      saveLocalCache('units', newUnits);
      persistGlobal('units', newUnits);
    } catch (e) {
      showToast("Falha ao atualizar unidades", "error");
    }
  }, [persistGlobal, saveLocalCache, showToast]);

  const handleUpdateRooms = useCallback(async (updater: any) => {
    try {
      setRooms(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        updateLocalTimestamp('rooms');
        saveLocalCache('rooms', next);
        persist('rooms', next);
        return next;
      });
    } catch (e) {
      showToast("Falha ao salvar quartos", "error");
    }
  }, [persist, updateLocalTimestamp, saveLocalCache, showToast]);

  const handleUpdateRoom = useCallback(async (room: RoomState) => {
    try {
      setRooms(prev => {
        const next = prev.map(r => r.id === room.id ? room : r);
        saveLocalCache('rooms', next);
        return next;
      });
      updateLocalTimestamp('rooms');
      await persist('rooms', room, room.id);
    } catch (e) {
      showToast("Falha ao salvar quarto", "error");
    }
  }, [persist, updateLocalTimestamp, saveLocalCache, showToast]);

  const handleUpdateRoomHistory = useCallback(async (updater: any) => {
    try {
      setRoomHistory(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        updateLocalTimestamp('roomHistory');
        saveLocalCache('roomHistory', next);
        persist('roomHistory', next);
        return next;
      });
    } catch (e) {
      showToast("Falha ao salvar histórico de quartos", "error");
    }
  }, [persist, updateLocalTimestamp, saveLocalCache, showToast]);

  const handleSaveRoomHistoryRecord = useCallback(async (record: RoomHistoryRecord) => {
    try {
      setRoomHistory(prev => {
        const index = prev.findIndex(r => r.id === record.id);
        let next;
        if (index > -1) {
          next = prev.map(r => r.id === record.id ? record : r);
        } else {
          next = [...prev, record];
        }
        saveLocalCache('roomHistory', next);
        return next;
      });
      updateLocalTimestamp('roomHistory');
      await persist('roomHistory', record, record.id);
    } catch (e) {
      showToast("Falha ao salvar registro de histórico", "error");
    }
  }, [persist, updateLocalTimestamp, saveLocalCache, showToast]);

  const handleUpdateFranchises = useCallback((newFranchises: Franchise[]) => {
    try {
      setFranchises(newFranchises);
      saveLocalCache('franchises', newFranchises);
      persistGlobal('franchises', newFranchises);
    } catch (e) {
      showToast("Falha ao atualizar franquias", "error");
    }
  }, [persistGlobal, saveLocalCache, showToast]);

  const handleUpdateStock = useCallback(async (transaction: StockTransaction) => {
    if (!validatedActiveUnitId) return;
    try {
      setStockTransactions(prev => {
        const next = [transaction, ...prev].slice(0, 5000);
        saveLocalCache('stockTransactions', next);
        return next;
      });

      await persist('stockTransactions', transaction, transaction.id);

      // Se for uma entrada, atualiza o último preço de custo no produto de forma atômica
      if (transaction.type === 'IN' && transaction.price) {
        setProducts(prev => {
          const product = prev.find(p => p.id === transaction.productId);
          if (!product) return prev;

          const updatedProduct = { ...product, lastCostPrice: transaction.price };
          const next = prev.map(p => p.id === transaction.productId ? updatedProduct : p);

          saveLocalCache('products', next);
          // FIX: Persiste apenas o produto alterado, não a lista inteira
          persist('products', updatedProduct, updatedProduct.id);

          return next;
        });
      }
    } catch (e) {
      showToast("Falha ao registrar movimentação de estoque", "error");
    }
  }, [validatedActiveUnitId, persist, saveLocalCache, showToast]);

  const handleCompleteSale = useCallback(async (newSalesList: Sale[], tabIdToClose?: string) => {
    try {
      // Registrar consumo de cota do Clube de Assinaturas se a comanda/mesa tinha um assinante vinculado
      let subscriberToUpdateId: string | undefined;
      if (tabIdToClose) {
        const tab = openTabs.find(t => t.id === tabIdToClose);
        if (tab && tab.subscriberId) {
          subscriberToUpdateId = tab.subscriberId;
        }
      }

      if (subscriberToUpdateId) {
        const sub = subscribers.find(s => s.id === subscriberToUpdateId);
        const plan = sub ? subscriptionPlans.find(p => p.id === sub.planId) : null;
        
        if (sub && plan) {
          const newLogs: SubscriptionLog[] = [];
          for (const sale of newSalesList) {
            if (!sale.items) continue;
            for (const item of sale.items) {
              if (item.isSubscriptionBenefit) {
                const logEntry: SubscriptionLog = {
                  id: generateUniqueId('slog'),
                  subscriberId: sub.id,
                  subscriberName: sub.name,
                  planName: plan.name,
                  productId: item.productId,
                  productName: item.productName,
                  timestamp: Date.now(),
                  tabId: tabIdToClose,
                  tabName: sale.tabName || 'Mesa',
                  unitId: validatedActiveUnitId || 'all'
                };
                newLogs.push(logEntry);
              }
            }
          }
          
          if (newLogs.length > 0) {
            setSubscriptionLogs(prev => {
              const next = [...newLogs, ...prev].slice(0, 2000);
              saveLocalCache('subscriptionLogs', next);
              return next;
            });
            updateLocalTimestamp('subscriptionLogs');
            for (const log of newLogs) {
              await persist('subscriptionLogs', log, log.id);
            }
          }
        }
      }

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

      // Baixa de estoque automática (Otimizada para processamento em lote)
      const activeUnit = units.find(u => u.id === validatedActiveUnitId);
      if (activeUnit?.useStock) {
        const batchTransactions: StockTransaction[] = [];
        const timestamp = Date.now();
        const userId = currentUserRef.current?.id || 'system';

        for (const s of newSalesList) {
          if (!s.items) continue;
          for (const item of s.items) {
            if (item.productId === PRODUCT_ID_DEBT_SETTLEMENT) continue;

            // Verifica se o produto deve controlar estoque
            const product = products.find(p => p.id === item.productId);
            if (!product) continue;

            // 1. Processa a Ficha Técnica Híbrida se houver receita
            if (product.recipe && product.recipe.length > 0) {
              for (const recipeItem of product.recipe) {
                const ingredient = products.find(p => p.id === recipeItem.productId);
                if (ingredient && ingredient.trackStock !== false) {
                  const transaction: StockTransaction = {
                    id: generateUniqueId('stk'),
                    productId: recipeItem.productId,
                    unitId: validatedActiveUnitId!,
                    quantity: -(recipeItem.quantity * item.quantity),
                    type: 'OUT',
                    reason: `Consumo: ${product.name}`,
                    timestamp,
                    userId
                  };
                  batchTransactions.push(transaction);
                }
              }
            }

            // 2. Processa o produto principal se estiver com controle de estoque ativo
            if (product.trackStock !== false) {
              const transaction: StockTransaction = {
                id: generateUniqueId('stk'),
                productId: item.productId,
                unitId: validatedActiveUnitId!,
                quantity: -item.quantity,
                type: 'OUT',
                timestamp,
                userId
              };
              batchTransactions.push(transaction);
            }
          }
        }

        if (batchTransactions.length > 0) {
          // Atualiza estado local de uma vez só
          setStockTransactions(prev => {
            const next = [...batchTransactions, ...prev].slice(0, 5000);
            saveLocalCache('stockTransactions', next);
            return next;
          });

          // Envia para a fila de sincronização (individualmente para auditoria atômica)
          for (const t of batchTransactions) {
            persist('stockTransactions', t, t.id);
          }
        }
      }
    } catch (e) {
      showToast("Falha ao registrar venda ou baixar estoque", "error");
    }
  }, [persist, handleDeleteTab, updateLocalTimestamp, saveLocalCache, openTabs, addAuditLog, units, validatedActiveUnitId, currentUserRef, products, showToast, subscribers, subscriptionPlans]);

  const handleSaveSubscriptionPlan = useCallback(async (plan: SubscriptionPlan) => {
    try {
      setSubscriptionPlans(prev => {
        const idx = prev.findIndex(p => p.id === plan.id);
        const next = [...prev];
        if (idx >= 0) next[idx] = plan;
        else next.push(plan);
        saveLocalCache('subscriptionPlans', next);
        return next;
      });
      updateLocalTimestamp('subscriptionPlans');
      await persist('subscriptionPlans', plan, plan.id);
      addAuditLog('PLAN_SAVE', `Plano de assinatura salvo: ${plan.name}`);
    } catch (e) {
      showToast("Falha ao salvar plano de assinatura", "error");
    }
  }, [persist, saveLocalCache, updateLocalTimestamp, addAuditLog, showToast]);

  const handleDeleteSubscriptionPlan = useCallback(async (planId: string) => {
    try {
      setSubscriptionPlans(prev => {
        const next = prev.filter(p => p.id !== planId);
        saveLocalCache('subscriptionPlans', next);
        return next;
      });
      updateLocalTimestamp('subscriptionPlans');
      await persist('subscriptionPlans', null, planId);
      await registerLocalDeletion(planId);
      addAuditLog('PLAN_DELETE', `Plano de assinatura deletado: ${planId}`);
    } catch (e) {
      showToast("Falha ao deletar plano de assinatura", "error");
    }
  }, [persist, saveLocalCache, updateLocalTimestamp, registerLocalDeletion, addAuditLog, showToast]);

  const handleSaveSubscriber = useCallback(async (subscriber: Subscriber) => {
    try {
      setSubscribers(prev => {
        const idx = prev.findIndex(s => s.id === subscriber.id);
        const next = [...prev];
        if (idx >= 0) next[idx] = subscriber;
        else next.push(subscriber);
        saveLocalCache('subscribers', next);
        return next;
      });
      updateLocalTimestamp('subscribers');
      await persist('subscribers', subscriber, subscriber.id);
      addAuditLog('SUBSCRIBER_SAVE', `Assinante salvo: ${subscriber.name} (${subscriber.status})`);
    } catch (e) {
      showToast("Falha ao salvar assinante", "error");
    }
  }, [persist, saveLocalCache, updateLocalTimestamp, addAuditLog, showToast]);

  const handleDeleteSubscriber = useCallback(async (subscriberId: string) => {
    try {
      setSubscribers(prev => {
        const next = prev.filter(s => s.id !== subscriberId);
        saveLocalCache('subscribers', next);
        return next;
      });
      updateLocalTimestamp('subscribers');
      await persist('subscribers', null, subscriberId);
      await registerLocalDeletion(subscriberId);
      addAuditLog('SUBSCRIBER_DELETE', `Assinante deletado: ${subscriberId}`);
    } catch (e) {
      showToast("Falha ao deletar assinante", "error");
    }
  }, [persist, saveLocalCache, updateLocalTimestamp, registerLocalDeletion, addAuditLog, showToast]);

  const handleSimulateSubscriptionRenewal = useCallback(async (subscriberId: string) => {
    try {
      let subName = '';
      setSubscribers(prev => {
        const idx = prev.findIndex(s => s.id === subscriberId);
        if (idx === -1) return prev;
        const next = [...prev];
        const target = next[idx];
        subName = target.name;
        next[idx] = {
          ...target,
          status: 'active',
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // mais 30 dias
        };
        saveLocalCache('subscribers', next);
        return next;
      });
      updateLocalTimestamp('subscribers');
      
      const nextSubscribers = await new Promise<Subscriber[]>(resolve => {
        setSubscribers(prev => { resolve(prev); return prev; });
      });
      const updatedSub = nextSubscribers.find(s => s.id === subscriberId);
      if (updatedSub) {
        await persist('subscribers', updatedSub, subscriberId);
      }
      
      addAuditLog('SUBSCRIBER_RENEW', `Assinatura renovada para: ${subName}`);
      showToast(`Assinatura de ${subName} renovada com sucesso!`, 'success');
    } catch (e) {
      showToast("Falha ao renovar assinatura", "error");
    }
  }, [persist, saveLocalCache, updateLocalTimestamp, addAuditLog, showToast]);

  const handleExportData = useCallback(() => {
    const backupData = {
      products, sales, users, shifts, openTabs, modifierGroups, categoryModifiers, categories, units, rooms, consignedEvents, roomHistory,
      subscriptionPlans, subscribers, subscriptionLogs,
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
  }, [products, sales, users, shifts, openTabs, modifierGroups, categoryModifiers, categories, units, rooms, consignedEvents, roomHistory, subscriptionPlans, subscribers, subscriptionLogs, penduraThreshold, longDurationThreshold, currentUser]);

  const handleDataManagement = useCallback((data: any) => {
    if (data === 'EXPORT_NOW') { handleExportData(); return; }
    if (data) {
      if (data.products) { setProducts(data.products); updateLocalTimestamp('products'); saveLocalCache('products', data.products); persist('products', data.products); }
      if (data.sales) { setSales(data.sales); updateLocalTimestamp('sales'); saveLocalCache('sales', data.sales); persist('sales', data.sales); }
      if (data.users) { setUsers(data.users); updateLocalTimestamp('users'); saveLocalCache('users', data.users); persistGlobal('users', data.users); }
      if (data.shifts) { setShifts(data.shifts); updateLocalTimestamp('shifts'); saveLocalCache('shifts', data.shifts); persist('shifts', data.shifts); }
      if (data.units) { setUnits(data.units); saveLocalCache('units', data.units); persistGlobal('units', data.units); }
      if (data.rooms) { setRooms(data.rooms); updateLocalTimestamp('rooms'); saveLocalCache('rooms', data.rooms); persist('rooms', data.rooms); }
      if (data.roomHistory) { setRoomHistory(data.roomHistory); updateLocalTimestamp('roomHistory'); saveLocalCache('roomHistory', data.roomHistory); persist('roomHistory', data.roomHistory); }

      if (data.modifierGroups) { setModifierGroups(data.modifierGroups); updateLocalTimestamp('modifierGroups'); saveLocalCache('modifierGroups', data.modifierGroups); persist('modifierGroups', data.modifierGroups); }
      if (data.categoryModifiers) { setCategoryModifiers(data.categoryModifiers); updateLocalTimestamp('categoryModifiers'); saveLocalCache('categoryModifiers', data.categoryModifiers); persist('categoryModifiers', data.categoryModifiers); }
      if (data.categories) { setCategories(data.categories); updateLocalTimestamp('categories'); saveLocalCache('categories', data.categories); persist('categories', data.categories); }
      if (data.openTabs) { setOpenTabs(data.openTabs); updateLocalTimestamp('openTabs'); saveLocalCache('openTabs', data.openTabs); persist('openTabs', data.openTabs); }
      if (data.consignedEvents) { setConsignedEvents(data.consignedEvents); updateLocalTimestamp('consignedEvents'); saveLocalCache('consignedEvents', data.consignedEvents); persist('consignedEvents', data.consignedEvents); }
      
      if (data.subscriptionPlans) { setSubscriptionPlans(data.subscriptionPlans); saveLocalCache('subscriptionPlans', data.subscriptionPlans); persist('subscriptionPlans', data.subscriptionPlans); }
      if (data.subscribers) { setSubscribers(data.subscribers); saveLocalCache('subscribers', data.subscribers); persist('subscribers', data.subscribers); }
      if (data.subscriptionLogs) { setSubscriptionLogs(data.subscriptionLogs); saveLocalCache('subscriptionLogs', data.subscriptionLogs); persist('subscriptionLogs', data.subscriptionLogs); }
      
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
    users, setUsers, shifts, setShifts, units, setUnits, franchises, setFranchises, auditLogs, setAuditLogs,
    stockTransactions, setStockTransactions, stockBalances,
    consignedEvents, setConsignedEvents,
    rooms, setRooms, roomHistory, setRoomHistory,
    subscriptionPlans, setSubscriptionPlans, subscribers, setSubscribers, subscriptionLogs, setSubscriptionLogs,
    penduraThreshold, setPenduraThreshold, longDurationThreshold, setLongDurationThreshold,
    dbStatus, setDbStatus, lastSyncTime, pendingSyncCount, validatedActiveUnitId, visibleUnits,
    setRawActiveUnitId, syncConfig,

    // Handlers
    handleSwitchUnit, handleSaveTab, handleUpdateTabItem, handleDeleteTab,
    handleUpdateProducts, handleUpdateCategoryModifiers, handleUpdateShifts,
    handleUpdateUsers, handleUpdateUnits, handleUpdateFranchises, handleCompleteSale, handleDataManagement, handleExportData,
    handleUpdateStock, handleUpdateRooms, handleUpdateRoom, handleUpdateRoomHistory, handleSaveRoomHistoryRecord, handleResetAdminPassword,
    handleSaveSubscriptionPlan, handleDeleteSubscriptionPlan, handleSaveSubscriber, handleDeleteSubscriber, handleSimulateSubscriptionRenewal,
    persist, persistGlobal, saveLocalCache, addAuditLog, refresh, serverHealth
  };
};
