
import { useEffect, useCallback, useRef } from 'react';
import { saveToFirebase, loadFromFirebase, getFirebaseToken } from '../services/firebaseService';
import { smartMergeTabs, mergeInitialData, isEqual } from '../utils/syncMerger';
import { SyncQueue } from '../utils/syncQueue';
import { Product, Sale, Tab, User, Shift, ModifierGroup, Unit } from '../types';

interface SyncProps {
  products: Product[];
  setProducts: (data: Product[]) => void;
  modifierGroups: ModifierGroup[];
  setModifierGroups: (data: ModifierGroup[]) => void;
  categoryModifiers: Record<string, string>;
  setCategoryModifiers: (data: Record<string, string>) => void;
  sales: Sale[];
  setSales: (data: Sale[]) => void;
  openTabs: Tab[];
  setOpenTabs: (data: Tab[]) => void;
  users: User[];
  setUsers: (data: User[]) => void;
  shifts: Shift[];
  setShifts: (data: Shift[]) => void;
  units: Unit[];
  setUnits: (data: Unit[]) => void;
  penduraThreshold: number;
  setPenduraThreshold: (val: number) => void;
  setDbStatus: (status: 'idle' | 'loading' | 'pending' | 'success' | 'error' | 'offline') => void;
  activeUnitId: string | null;
  config: {
    url: string;
    key: string;
    email: string;
    pass: string;
    masterKey: string;
    allPerms: any[];
  }
}

export const useSync = ({
  products, setProducts,
  modifierGroups, setModifierGroups,
  categoryModifiers, setCategoryModifiers,
  sales, setSales,
  openTabs, setOpenTabs,
  users, setUsers,
  shifts, setShifts,
  units, setUnits,
  penduraThreshold, setPenduraThreshold,
  setDbStatus,
  activeUnitId,
  config
}: SyncProps) => {
  const isInitialLoadDone = useRef(false);
  
  // Timestamp da última alteração LOCAL (Grace Period)
  const lastLocalUpdate = useRef<number>(Date.now());
  
  // Refs para acesso atualizado dentro dos loops (Heartbeat/Queue)
  const latestData = useRef({
    products, modifierGroups, categoryModifiers, sales, openTabs, users, shifts, units
  });

  useEffect(() => {
    latestData.current = { products, modifierGroups, categoryModifiers, sales, openTabs, users, shifts, units };
    lastLocalUpdate.current = Date.now();
  }, [products, modifierGroups, categoryModifiers, sales, openTabs, users, shifts, units]);
  
  // Controle de Autenticação
  const tokenCache = useRef<{ value: string; expiresAt: number } | null>(null);
  const activeTokenRequest = useRef<Promise<string> | null>(null);
  const authBlocked = useRef(false);
  const isProcessingQueue = useRef(false);

  const { url, key, email, pass, masterKey, allPerms } = config;

  // Helper para construir caminhos baseados na unidade ativa
  const getPath = useCallback((node: string) => {
    // Dados Globais
    if (['users', 'units', 'config'].includes(node)) return node;
    
    // Dados da Unidade
    if (activeUnitId) return `data/units/${activeUnitId}/${node}`;
    
    // Fallback (apenas para transição ou erros)
    return `data/root/${node}`;
  }, [activeUnitId]);

  // Helper para localStorage Key com namespace
  const getStorageKey = useCallback((key: string) => {
     if (['btq_users_backup', 'btq_units_backup', 'btq_config_bk'].includes(key)) return key;
     if (activeUnitId) return `${key}_${activeUnitId}`;
     return key;
  }, [activeUnitId]);

  // --- 1. Autenticação (Mantida) ---
  const getValidToken = useCallback(async () => {
    if (authBlocked.current) throw new Error("Modo Offline Forçado (Auth Bloqueada).");

    const now = Date.now();
    if (tokenCache.current && tokenCache.current.expiresAt > now + 300000) {
      return tokenCache.current.value;
    }

    if (activeTokenRequest.current) return activeTokenRequest.current;

    const promise = (async () => {
      try {
        const token = await getFirebaseToken(email, pass, key);
        tokenCache.current = { value: token, expiresAt: Date.now() + 3600 * 1000 };
        return token;
      } catch (e) {
        console.error("Auth Fail:", e);
        if (String(e).includes('INVALID') || String(e).includes('CREDENTIALS')) {
            authBlocked.current = true;
        }
        throw e;
      } finally {
        activeTokenRequest.current = null;
      }
    })();

    activeTokenRequest.current = promise;
    return promise;
  }, [email, pass, key]);

  // --- 2. Carga Inicial ---
  const fetchInitialData = useCallback(async () => {
    // Se não tem unidade selecionada, carregamos apenas o global (Users e Units)
    const loadOnlyGlobal = !activeUnitId;

    setDbStatus('loading');
    try {
      const token = await getValidToken();
      
      // Carregar Globais
      const pUsers = loadFromFirebase(url, undefined, token, 'users');
      const pUnits = loadFromFirebase(url, undefined, token, 'units');
      // Tentar carregar unidades legadas se units retornar vazio
      const [usersData, unitsData] = await Promise.all([pUsers, pUnits]);

      const adminUser = { id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: allPerms };
      setUsers(!usersData || !usersData.some((u: User) => u.username === 'admin') ? [adminUser, ...(usersData || [])] : usersData);
      
      // Converte objeto de units em array se necessário
      const unitsArray = unitsData ? (Array.isArray(unitsData) ? unitsData : Object.values(unitsData)) : [];
      setUnits(unitsArray);

      if (!loadOnlyGlobal) {
        // Carregar Dados da Unidade Específica
        const results = await Promise.allSettled([
          loadFromFirebase(url, undefined, token, getPath('products')),
          loadFromFirebase(url, undefined, token, getPath('modifierGroups')),
          loadFromFirebase(url, undefined, token, getPath('categoryModifiers')),
          loadFromFirebase(url, undefined, token, getPath('sales')),
          loadFromFirebase(url, undefined, token, getPath('openTabs')),
          loadFromFirebase(url, undefined, token, getPath('shifts')),
          loadFromFirebase(url, undefined, token, getPath('config')),
        ]);

        const getData = (index: number) => results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value : null;

        setProducts(mergeInitialData(getData(0), null, 'products', getStorageKey('btq_products_bk'), []));
        setModifierGroups(mergeInitialData(getData(1), null, 'modifierGroups', getStorageKey('btq_modgroups_bk'), []));
        setCategoryModifiers(mergeInitialData(getData(2), null, 'categoryModifiers', getStorageKey('btq_catmods_bk'), {}));
        setSales(mergeInitialData(getData(3), null, 'sales', getStorageKey('btq_sales_bk'), []));
        setOpenTabs(mergeInitialData(getData(4), null, 'openTabs', getStorageKey('btq_tabs_backup'), []));
        setShifts(mergeInitialData(getData(5), null, 'shifts', getStorageKey('btq_shifts_backup'), []));
        
        const configData = mergeInitialData(getData(6), null, 'config', 'btq_config_bk', {});
        if (configData && typeof configData.penduraThreshold === 'number') setPenduraThreshold(configData.penduraThreshold);
      }

      setDbStatus('success');

    } catch (e) { 
      console.error("Load Error (Offline Mode):", e);
      // Carregar localmente em caso de falha total
      const loadLocal = (key: string, setter: Function) => {
         const d = localStorage.getItem(key);
         if (d) setter(JSON.parse(d));
      };
      
      loadLocal('btq_users_backup', setUsers);
      loadLocal('btq_units_backup', setUnits);
      
      if (!loadOnlyGlobal) {
        loadLocal(getStorageKey('btq_products_bk'), setProducts);
        loadLocal(getStorageKey('btq_sales_bk'), setSales);
        loadLocal(getStorageKey('btq_shifts_backup'), setShifts);
        loadLocal(getStorageKey('btq_tabs_backup'), setOpenTabs);
      }
      setDbStatus('offline');
    } finally { 
      setTimeout(() => { isInitialLoadDone.current = true; }, 500);
    }
  }, [url, allPerms, getValidToken, activeUnitId, getPath, getStorageKey, setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, setUsers, setShifts, setUnits, setPenduraThreshold, setDbStatus]);


  // --- 3. Heartbeat ---
  useEffect(() => {
    if (!url || authBlocked.current || !activeUnitId) return;

    const heartbeat = setInterval(async () => {
      if (isProcessingQueue.current || !isInitialLoadDone.current) return;
      if (Date.now() - lastLocalUpdate.current < 5000) return;

      try {
        const token = await getValidToken();
        const [serverTabs, serverSales, serverShifts, serverUsers, serverUnits] = await Promise.all([
           loadFromFirebase(url, undefined, token, getPath('openTabs')),
           loadFromFirebase(url, undefined, token, getPath('sales')),
           loadFromFirebase(url, undefined, token, getPath('shifts')),
           loadFromFirebase(url, undefined, token, 'users'), // Global
           loadFromFirebase(url, undefined, token, 'units')  // Global
        ]);

        if (Date.now() - lastLocalUpdate.current < 5000) return;

        // Smart Merge Mesas
        const { mergedTabs, hasChanges } = smartMergeTabs(serverTabs, latestData.current.openTabs);
        if (hasChanges) {
           setOpenTabs(mergedTabs);
           localStorage.setItem(getStorageKey('btq_tabs_backup'), JSON.stringify(mergedTabs));
        }

        if (serverSales && !isEqual(serverSales, latestData.current.sales)) {
           setSales(serverSales);
           localStorage.setItem(getStorageKey('btq_sales_bk'), JSON.stringify(serverSales));
        }

        if (serverShifts && !isEqual(serverShifts, latestData.current.shifts)) {
           setShifts(serverShifts);
           localStorage.setItem(getStorageKey('btq_shifts_backup'), JSON.stringify(serverShifts));
        }
        
        // Globais
        if (serverUsers && !isEqual(serverUsers, latestData.current.users)) {
            // Preservar admin local se não vier do server
            const finalUsers = serverUsers.some((u:any) => u.username === 'admin') ? serverUsers : [...serverUsers, latestData.current.users.find(u => u.username === 'admin')].filter(Boolean);
            setUsers(finalUsers);
            localStorage.setItem('btq_users_backup', JSON.stringify(finalUsers));
        }
        
        if (serverUnits) {
            const unitsArray = Array.isArray(serverUnits) ? serverUnits : Object.values(serverUnits);
            if(!isEqual(unitsArray, latestData.current.units)) {
                setUnits(unitsArray);
                localStorage.setItem('btq_units_backup', JSON.stringify(unitsArray));
            }
        }

      } catch (e) { /* Silent fail */ }
    }, 4000); 

    return () => clearInterval(heartbeat);
  }, [url, getValidToken, getPath, getStorageKey, setOpenTabs, setSales, setShifts, setUsers, setUnits, activeUnitId]);


  // --- 4. Queue Processor ---
  useEffect(() => {
    if (!url || authBlocked.current) return;

    const queueProcessor = setInterval(async () => {
      if (!SyncQueue.hasPending() || isProcessingQueue.current || !isInitialLoadDone.current) {
        if (!SyncQueue.hasPending() && isInitialLoadDone.current) setDbStatus('success');
        return;
      }

      isProcessingQueue.current = true;
      setDbStatus('pending');

      const pendingItems = SyncQueue.getPending();
      const item = pendingItems[0]; 

      try {
        const token = await getValidToken();
        // Se a node for global, usa caminho absoluto, senão usa getPath (relativo à unit)
        // O SyncQueue armazena o nome lógico da node ('sales', 'users'). Precisamos converter.
        const path = getPath(item.node);
        
        await saveToFirebase(url, item.data, undefined, token, path);
        
        SyncQueue.dequeue(item.node);
        
        if (!SyncQueue.hasPending()) {
          setDbStatus('success');
        }
      } catch (e) {
        console.error(`Queue Retry Fail [${item.node}]:`, e);
        SyncQueue.incrementRetry(item.node);
        
        if (String(e).includes('Auth')) {
           authBlocked.current = true;
           setDbStatus('offline');
        } else {
           setDbStatus('error');
        }
      } finally {
        isProcessingQueue.current = false;
      }
    }, 2000);

    return () => clearInterval(queueProcessor);
  }, [url, getValidToken, setDbStatus, getPath]);


  // --- 5. Trigger de Sincronização ---
  const syncNode = useCallback((nodeName: string, data: any) => {
    if (!isInitialLoadDone.current) return;
    
    lastLocalUpdate.current = Date.now();
    
    // Backup Local Imediato com Namespace
    const storageKey = getStorageKey(nodeName === 'users' || nodeName === 'units' ? `btq_${nodeName}_backup` : (
        nodeName === 'shifts' ? 'btq_shifts_backup' : 
        nodeName === 'openTabs' ? 'btq_tabs_backup' : 
        nodeName === 'sales' ? 'btq_sales_bk' : 
        nodeName === 'products' ? 'btq_products_bk' : `btq_${nodeName}_bk`
    ));
    
    localStorage.setItem(storageKey, JSON.stringify(data));

    if (authBlocked.current) {
      setDbStatus('offline');
      return;
    }

    SyncQueue.enqueue(nodeName, data);
    setDbStatus('pending');

  }, [setDbStatus, getStorageKey]);

  // -- Debouncers de Trigger --
  useEffect(() => {
    if (!activeUnitId) return;
    const timer = setTimeout(() => {
      syncNode('products', products);
      syncNode('modifierGroups', modifierGroups);
      syncNode('categoryModifiers', categoryModifiers);
    }, 2000);
    return () => clearTimeout(timer);
  }, [products, modifierGroups, categoryModifiers, syncNode, activeUnitId]);

  useEffect(() => {
    if (!activeUnitId) return;
    const timer = setTimeout(() => { syncNode('sales', sales); }, 2000); 
    return () => clearTimeout(timer);
  }, [sales, syncNode, activeUnitId]);

  useEffect(() => {
    if (!activeUnitId) return;
    const timer = setTimeout(() => {
      syncNode('openTabs', openTabs);
      syncNode('shifts', shifts);
    }, 300); 
    return () => clearTimeout(timer);
  }, [openTabs, shifts, syncNode, activeUnitId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      syncNode('users', users);
      syncNode('units', units);
      if (activeUnitId) syncNode('config', { penduraThreshold });
    }, 2000);
    return () => clearTimeout(timer);
  }, [users, units, penduraThreshold, syncNode, activeUnitId]);

  return { fetchInitialData, isInitialLoadDone };
};
