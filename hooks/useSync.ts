
import { useEffect, useCallback, useRef } from 'react';
import { saveToFirebase, loadFromFirebase, getFirebaseToken } from '../services/firebaseService';
import { smartMergeTabs, mergeInitialData, isEqual } from '../utils/syncMerger';
import { SyncQueue } from '../utils/syncQueue';
import { Product, Sale, Tab, User, Shift, ModifierGroup } from '../types';

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
  penduraThreshold: number;
  setPenduraThreshold: (val: number) => void;
  setDbStatus: (status: 'idle' | 'loading' | 'pending' | 'success' | 'error' | 'offline') => void;
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
  penduraThreshold, setPenduraThreshold,
  setDbStatus,
  config
}: SyncProps) => {
  const isInitialLoadDone = useRef(false);
  
  // Timestamp da última alteração LOCAL (Grace Period)
  const lastLocalUpdate = useRef<number>(Date.now());
  
  // Refs para acesso atualizado dentro dos loops (Heartbeat/Queue)
  const latestData = useRef({
    products, modifierGroups, categoryModifiers, sales, openTabs, users, shifts
  });

  useEffect(() => {
    latestData.current = { products, modifierGroups, categoryModifiers, sales, openTabs, users, shifts };
    lastLocalUpdate.current = Date.now();
  }, [products, modifierGroups, categoryModifiers, sales, openTabs, users, shifts]);
  
  // Controle de Autenticação
  const tokenCache = useRef<{ value: string; expiresAt: number } | null>(null);
  const activeTokenRequest = useRef<Promise<string> | null>(null);
  const authBlocked = useRef(false);
  const isProcessingQueue = useRef(false);

  const { url, key, email, pass, masterKey, allPerms } = config;

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

  // --- 2. Carga Inicial (Refatorada com syncMerger) ---
  const fetchInitialData = useCallback(async () => {
    setDbStatus('loading');
    try {
      const token = await getValidToken();
      
      const results = await Promise.allSettled([
        loadFromFirebase(url, undefined, token, 'products'),
        loadFromFirebase(url, undefined, token, 'modifierGroups'),
        loadFromFirebase(url, undefined, token, 'categoryModifiers'),
        loadFromFirebase(url, undefined, token, 'sales'),
        loadFromFirebase(url, undefined, token, 'openTabs'),
        loadFromFirebase(url, undefined, token, 'users'),
        loadFromFirebase(url, undefined, token, 'shifts'),
        loadFromFirebase(url, undefined, token, 'config'),
      ]);

      const getData = (index: number) => results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value : null;

      // Tentar carregar legado apenas se falhar o carregamento granular
      let legacyData: any = null;
      if (!getData(0) && !getData(3)) {
         try { legacyData = await loadFromFirebase(url, masterKey, token); } catch (e) {}
      }

      setProducts(mergeInitialData(getData(0), legacyData, 'products', 'btq_products_bk', []));
      setModifierGroups(mergeInitialData(getData(1), legacyData, 'modifierGroups', 'btq_modgroups_bk', []));
      setCategoryModifiers(mergeInitialData(getData(2), legacyData, 'categoryModifiers', 'btq_catmods_bk', {}));
      setSales(mergeInitialData(getData(3), legacyData, 'sales', 'btq_sales_bk', []));
      setOpenTabs(mergeInitialData(getData(4), legacyData, 'openTabs', 'btq_tabs_backup', []));
      setShifts(mergeInitialData(getData(6), legacyData, 'shifts', 'btq_shifts_backup', []));
      
      const usersData = mergeInitialData(getData(5), legacyData, 'users', 'btq_users_backup', []);
      const adminUser = { id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: allPerms };
      setUsers(!usersData.some((u: User) => u.username === 'admin') ? [adminUser, ...usersData] : usersData);

      const configData = mergeInitialData(getData(7), legacyData, 'config', 'btq_config_bk', {});
      if (configData && typeof configData.penduraThreshold === 'number') setPenduraThreshold(configData.penduraThreshold);

      setDbStatus('success');

    } catch (e) { 
      console.error("Load Error (Offline Mode):", e);
      // Carregar localmente em caso de falha total
      const loadLocal = (key: string, setter: Function) => {
         const d = localStorage.getItem(key);
         if (d) setter(JSON.parse(d));
      };
      loadLocal('btq_products_bk', setProducts);
      loadLocal('btq_sales_bk', setSales);
      loadLocal('btq_shifts_backup', setShifts);
      loadLocal('btq_tabs_backup', setOpenTabs);
      loadLocal('btq_users_backup', setUsers);
      setDbStatus('offline');
    } finally { 
      setTimeout(() => { isInitialLoadDone.current = true; }, 500);
    }
  }, [url, masterKey, allPerms, getValidToken, setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, setUsers, setShifts, setPenduraThreshold, setDbStatus]);


  // --- 3. Heartbeat (Refatorado com smartMergeTabs) ---
  useEffect(() => {
    if (!url || authBlocked.current) return;

    const heartbeat = setInterval(async () => {
      // Se estamos enviando dados (Queue Active), evitamos baixar para não gerar conflito de versão
      if (isProcessingQueue.current || !isInitialLoadDone.current) return;
      
      // Grace Period (Edição Ativa): Se o usuário mexeu nos últimos 5s, não baixa
      if (Date.now() - lastLocalUpdate.current < 5000) return;

      try {
        const token = await getValidToken();
        const [serverTabs, serverSales, serverShifts] = await Promise.all([
           loadFromFirebase(url, undefined, token, 'openTabs'),
           loadFromFirebase(url, undefined, token, 'sales'),
           loadFromFirebase(url, undefined, token, 'shifts')
        ]);

        // Double Check: Se o usuário mexeu ENQUANTO baixava, aborta
        if (Date.now() - lastLocalUpdate.current < 5000) return;

        // Smart Merge Mesas
        const { mergedTabs, hasChanges } = smartMergeTabs(serverTabs, latestData.current.openTabs);
        if (hasChanges) {
           setOpenTabs(mergedTabs);
           localStorage.setItem('btq_tabs_backup', JSON.stringify(mergedTabs));
        }

        // Merge Simples para Vendas e Turnos (Server Authority)
        if (serverSales && !isEqual(serverSales, latestData.current.sales)) {
           setSales(serverSales);
           localStorage.setItem('btq_sales_bk', JSON.stringify(serverSales));
        }

        if (serverShifts && !isEqual(serverShifts, latestData.current.shifts)) {
           setShifts(serverShifts);
           localStorage.setItem('btq_shifts_backup', JSON.stringify(serverShifts));
        }

      } catch (e) { /* Silent fail */ }
    }, 4000); 

    return () => clearInterval(heartbeat);
  }, [url, getValidToken, setOpenTabs, setSales, setShifts]);


  // --- 4. Queue Processor (Novo - Processamento em Background) ---
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
      // Processa um por vez para garantir ordem e evitar flood
      const item = pendingItems[0]; 

      try {
        const token = await getValidToken();
        await saveToFirebase(url, item.data, undefined, token, item.node);
        
        SyncQueue.dequeue(item.node);
        
        // Se a fila acabou, sucesso
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
    }, 2000); // Tenta processar a fila a cada 2s

    return () => clearInterval(queueProcessor);
  }, [url, getValidToken, setDbStatus]);


  // --- 5. Trigger de Sincronização (Agora apenas enfileira) ---
  const syncNode = useCallback((nodeName: string, data: any) => {
    if (!isInitialLoadDone.current) return;
    
    lastLocalUpdate.current = Date.now();
    
    // Backup Local Imediato (Safety Net)
    if (nodeName === 'shifts') localStorage.setItem('btq_shifts_backup', JSON.stringify(data));
    if (nodeName === 'openTabs') localStorage.setItem('btq_tabs_backup', JSON.stringify(data));
    if (nodeName === 'sales') localStorage.setItem('btq_sales_bk', JSON.stringify(data));
    if (nodeName === 'products') localStorage.setItem('btq_products_bk', JSON.stringify(data));
    if (nodeName === 'users') localStorage.setItem('btq_users_backup', JSON.stringify(data));

    if (authBlocked.current) {
      setDbStatus('offline');
      return;
    }

    // Adiciona na fila e deixa o QueueProcessor lidar com o envio
    SyncQueue.enqueue(nodeName, data);
    setDbStatus('pending');

  }, [setDbStatus]);

  // -- Debouncers de Trigger --
  useEffect(() => {
    const timer = setTimeout(() => {
      syncNode('products', products);
      syncNode('modifierGroups', modifierGroups);
      syncNode('categoryModifiers', categoryModifiers);
    }, 2000);
    return () => clearTimeout(timer);
  }, [products, modifierGroups, categoryModifiers, syncNode]);

  useEffect(() => {
    const timer = setTimeout(() => { syncNode('sales', sales); }, 2000); 
    return () => clearTimeout(timer);
  }, [sales, syncNode]);

  useEffect(() => {
    // Mesas e Turnos continuam com debounce rápido para UI responsiva
    const timer = setTimeout(() => {
      syncNode('openTabs', openTabs);
      syncNode('shifts', shifts);
    }, 300); 
    return () => clearTimeout(timer);
  }, [openTabs, shifts, syncNode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      syncNode('users', users);
      syncNode('config', { penduraThreshold });
    }, 2000);
    return () => clearTimeout(timer);
  }, [users, penduraThreshold, syncNode]);

  return { fetchInitialData, isInitialLoadDone };
};
