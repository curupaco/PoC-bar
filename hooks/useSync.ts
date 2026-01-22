
import { useEffect, useCallback, useRef } from 'react';
import { saveToFirebase, loadFromFirebase, getFirebaseToken } from '../services/firebaseService';
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

// Utilitário para comparação profunda simplificada (evita loops infinitos de atualização)
const isEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

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
  
  // Timestamp da última alteração LOCAL.
  const lastLocalUpdate = useRef<number>(Date.now());
  
  // Refs para acesso dentro do setInterval sem stale closure
  const latestData = useRef({
    products,
    modifierGroups,
    categoryModifiers,
    sales,
    openTabs,
    users,
    shifts
  });

  // Mantém os refs atualizados sempre que o state muda
  useEffect(() => {
    latestData.current = {
      products, modifierGroups, categoryModifiers, sales, openTabs, users, shifts
    };
    // Sempre que o estado muda localmente, marcamos o timestamp
    lastLocalUpdate.current = Date.now();
  }, [products, modifierGroups, categoryModifiers, sales, openTabs, users, shifts]);
  
  // Controle de Concorrência e Fila
  const activeSyncs = useRef<Record<string, boolean>>({});
  const pendingSyncs = useRef<Record<string, any>>({});
  
  // Cache de Token
  const tokenCache = useRef<{ value: string; expiresAt: number } | null>(null);
  const activeTokenRequest = useRef<Promise<string> | null>(null);
  const authBlocked = useRef(false);

  const { url, key, email, pass, masterKey, allPerms } = config;

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

      const getData = (index: number) => 
        results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value : null;

      const productsNode = getData(0);
      const modGroupsNode = getData(1);
      const catModsNode = getData(2);
      const salesNode = getData(3);
      const tabsNode = getData(4);
      const usersNode = getData(5);
      const shiftsNode = getData(6);
      const configNode = getData(7);

      let legacyData: any = null;
      const needsLegacy = !productsNode && !salesNode && !shiftsNode;

      if (needsLegacy) {
         try {
           legacyData = await loadFromFirebase(url, masterKey, token);
         } catch (legacyErr) {
           console.error("Falha ao buscar legado:", legacyErr);
         }
      }

      const merge = (cloudData: any, legacyKey: string, storageKey: string, fallback: any) => {
         if (cloudData && (Array.isArray(cloudData) ? cloudData.length > 0 : Object.keys(cloudData).length > 0)) {
            return cloudData;
         }
         if (legacyData && legacyData[legacyKey]) {
            return legacyData[legacyKey];
         }
         const local = localStorage.getItem(storageKey);
         if (local) {
            try {
               const parsed = JSON.parse(local);
               if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
                  console.warn(`Usando Backup Local para ${storageKey} (Cloud Vazio/Erro)`);
                  return parsed;
               }
            } catch(e) {}
         }
         return fallback;
      };

      const finalProducts = merge(productsNode, 'products', 'btq_products_bk', []);
      const finalModGroups = merge(modGroupsNode, 'modifierGroups', 'btq_modgroups_bk', []);
      const finalCatMods = merge(catModsNode, 'categoryModifiers', 'btq_catmods_bk', {});
      const finalSales = merge(salesNode, 'sales', 'btq_sales_bk', []);
      const finalTabs = merge(tabsNode, 'openTabs', 'btq_tabs_backup', []);
      const finalShifts = merge(shiftsNode, 'shifts', 'btq_shifts_backup', []);
      const finalUsers = merge(usersNode, 'users', 'btq_users_backup', []);
      const finalConfig = merge(configNode, 'config', 'btq_config_bk', {});

      setProducts(finalProducts);
      setModifierGroups(finalModGroups);
      setCategoryModifiers(finalCatMods);
      setSales(finalSales);
      setOpenTabs(finalTabs);
      setShifts(finalShifts);
      
      if (finalConfig && typeof finalConfig.penduraThreshold === 'number') {
        setPenduraThreshold(finalConfig.penduraThreshold);
      }
      
      const adminUser = { 
        id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: allPerms 
      };

      if (!finalUsers.some((u: User) => u.username === 'admin')) {
         setUsers([adminUser, ...finalUsers]);
      } else {
         setUsers(finalUsers);
      }

      setDbStatus('success');

    } catch (e) { 
      console.error("Critical Load Error - Entering Offline Mode:", e);
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
      setTimeout(() => {
         isInitialLoadDone.current = true; 
      }, 500);
    }
  }, [url, masterKey, allPerms, setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, setUsers, setShifts, setPenduraThreshold, setDbStatus, getValidToken]);

  // -- Heartbeat: Polling para Atualização em Tempo Real (Multi-Atendente) --
  useEffect(() => {
    if (!url || authBlocked.current) return;

    const heartbeat = setInterval(async () => {
      // 1. Checagem Pré-Requisição (Grace Period)
      const isPushing = Object.values(activeSyncs.current).some(v => v);
      if (isPushing || !isInitialLoadDone.current) return;

      if (Date.now() - lastLocalUpdate.current < 5000) { // Reduzido para 5s para ser mais ágil, mas mantendo a segurança
        return;
      }

      try {
        const token = await getValidToken();

        const [serverTabs, serverSales, serverShifts] = await Promise.all([
           loadFromFirebase(url, undefined, token, 'openTabs'),
           loadFromFirebase(url, undefined, token, 'sales'),
           loadFromFirebase(url, undefined, token, 'shifts')
        ]);

        // 2. CORREÇÃO CRÍTICA: Checagem Pós-Requisição
        // Se durante a requisição o usuário criou algo (Race Condition), abortamos a atualização visual.
        // Isso impede que a resposta (antiga) do servidor sobrescreva o estado local (novo).
        if (Date.now() - lastLocalUpdate.current < 5000) {
            // console.log("Heartbeat Aborted: Local changes happened during fetch.");
            return;
        }

        // 3. SMART MERGE PARA MESAS (OPEN TABS)
        // Se o servidor manda mesas, não sobrescrevemos cegamente.
        // Mantemos as mesas locais que são NOVAS (criadas há menos de 2 min) e que ainda não subiram.
        if (serverTabs) {
            const currentTabs = latestData.current.openTabs;
            const smartMergedTabs = [...serverTabs];
            let hasMergeChanges = false;

            // Recupera mesas locais que sumiriam (Resgate de Comanda)
            currentTabs.forEach(localTab => {
                const isOnServer = serverTabs.find((st: Tab) => st.id === localTab.id);
                if (!isOnServer) {
                    // Se a mesa foi aberta localmente há menos de 2 minutos, assumimos que é uma criação recente
                    // que ainda não propagou. MANTEMOS ELA.
                    if ((Date.now() - (localTab.openedAt || 0)) < 120000) {
                        smartMergedTabs.push(localTab);
                        hasMergeChanges = true;
                    }
                }
            });

            // Só atualiza se houver diferença real
            // A comparação isEqual deve considerar a lista mesclada
            if (!isEqual(smartMergedTabs, currentTabs) || hasMergeChanges) {
               // Ordenação opcional para manter consistência visual (opcional)
               // smartMergedTabs.sort((a, b) => b.openedAt - a.openedAt); 
               setOpenTabs(smartMergedTabs);
               localStorage.setItem('btq_tabs_backup', JSON.stringify(smartMergedTabs));
            }
        }

        if (serverSales && !isEqual(serverSales, latestData.current.sales)) {
           setSales(serverSales);
           localStorage.setItem('btq_sales_bk', JSON.stringify(serverSales));
        }

        if (serverShifts && !isEqual(serverShifts, latestData.current.shifts)) {
           setShifts(serverShifts);
           localStorage.setItem('btq_shifts_backup', JSON.stringify(serverShifts));
        }

      } catch (e) {
        // Silently fail
      }
    }, 4000); 

    return () => clearInterval(heartbeat);
  }, [url, getValidToken, setOpenTabs, setSales, setShifts]);

  const syncNode = useCallback(async (nodeName: string, data: any) => {
    if (!isInitialLoadDone.current) return;
    
    lastLocalUpdate.current = Date.now();
    
    // Backup Local Automático
    if (nodeName === 'shifts') localStorage.setItem('btq_shifts_backup', JSON.stringify(data));
    if (nodeName === 'openTabs') localStorage.setItem('btq_tabs_backup', JSON.stringify(data));
    if (nodeName === 'sales') localStorage.setItem('btq_sales_bk', JSON.stringify(data));
    if (nodeName === 'products') localStorage.setItem('btq_products_bk', JSON.stringify(data));
    if (nodeName === 'users') localStorage.setItem('btq_users_backup', JSON.stringify(data));

    if (authBlocked.current) {
      setDbStatus('offline');
      return;
    }

    if (activeSyncs.current[nodeName]) {
       pendingSyncs.current[nodeName] = data;
       setDbStatus('pending');
       return; 
    }

    activeSyncs.current[nodeName] = true;
    delete pendingSyncs.current[nodeName]; 
    setDbStatus('pending');

    try {
      const token = await getValidToken();
      await saveToFirebase(url, data, undefined, token, nodeName);
      
      const hasActives = Object.values(activeSyncs.current).some(v => v);
      if (!hasActives) setDbStatus('success');
      
    } catch (e) {
      console.error(`Sync Fail [${nodeName}]:`, e);
      if (String(e).includes('Auth')) authBlocked.current = true;
      setDbStatus(authBlocked.current ? 'offline' : 'error');
    } finally {
      activeSyncs.current[nodeName] = false;

      if (pendingSyncs.current[nodeName] !== undefined) {
          const nextData = pendingSyncs.current[nodeName];
          setTimeout(() => syncNode(nodeName, nextData), 100);
      } else {
          const hasActives = Object.values(activeSyncs.current).some(v => v);
          if (!hasActives) setDbStatus(authBlocked.current ? 'offline' : 'success');
      }
    }
  }, [url, setDbStatus, getValidToken]);

  // -- Efeitos (Debounced) --
  
  useEffect(() => {
    const timer = setTimeout(() => {
      syncNode('products', products);
      syncNode('modifierGroups', modifierGroups);
      syncNode('categoryModifiers', categoryModifiers);
    }, 2000);
    return () => clearTimeout(timer);
  }, [products, modifierGroups, categoryModifiers, syncNode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      syncNode('sales', sales);
    }, 2000); 
    return () => clearTimeout(timer);
  }, [sales, syncNode]);

  useEffect(() => {
    // Mesas e Turnos são críticos - Reduzi o debounce para 300ms para salvar mais rápido
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
