
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
  
  // Controle de Concorrência (Sync Queue)
  const isSyncing = useRef(false);
  
  // Cache de Token
  const tokenCache = useRef<{ value: string; expiresAt: number } | null>(null);
  const activeTokenRequest = useRef<Promise<string> | null>(null);
  const authBlocked = useRef(false);

  const { url, key, email, pass, masterKey, allPerms } = config;

  // -- 1. Autenticação Otimizada --
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
        authBlocked.current = true;
        throw e;
      } finally {
        activeTokenRequest.current = null;
      }
    })();

    activeTokenRequest.current = promise;
    return promise;
  }, [email, pass, key]);

  // -- 2. Carga Inicial Granular (CORREÇÃO DO BUG DE SINCRONIA) --
  const fetchInitialData = useCallback(async () => {
    setDbStatus('loading');
    try {
      const token = await getValidToken();
      
      // Em vez de baixar um "blob" gigante que pode estar estagnado/criptografado na raiz,
      // baixamos cada nó individualmente. Isso garante que leremos o que foi gravado via syncNode.
      const [
        productsData,
        modGroupsData,
        catModsData,
        salesData,
        tabsData,
        usersData,
        shiftsData,
        configData
      ] = await Promise.all([
        loadFromFirebase(url, undefined, token, 'products'),
        loadFromFirebase(url, undefined, token, 'modifierGroups'),
        loadFromFirebase(url, undefined, token, 'categoryModifiers'),
        loadFromFirebase(url, undefined, token, 'sales'),
        loadFromFirebase(url, undefined, token, 'openTabs'),
        loadFromFirebase(url, undefined, token, 'users'),
        loadFromFirebase(url, undefined, token, 'shifts'),
        loadFromFirebase(url, undefined, token, 'config'),
      ]);

      const adminUser = { 
        id: 'admin', 
        username: 'admin', 
        password: 'admin', 
        displayName: 'Administrador', 
        permissions: allPerms 
      };

      setProducts(productsData || []);
      setModifierGroups(modGroupsData || []);
      setCategoryModifiers(catModsData || {});
      setSales(salesData || []);
      setOpenTabs(tabsData || []);
      setShifts(shiftsData || []);
      
      if (configData && typeof configData.penduraThreshold === 'number') {
        setPenduraThreshold(configData.penduraThreshold);
      }
      
      const loadedUsers = usersData || [];
      // Backup dos usuários para LocalStorage (Segurança Offline)
      localStorage.setItem('btq_users_backup', JSON.stringify(loadedUsers));
      
      if (!loadedUsers.some((u: User) => u.username === 'admin')) {
         setUsers([adminUser, ...loadedUsers]);
      } else {
         setUsers(loadedUsers);
      }

      setDbStatus('success');
    } catch (e) { 
      console.error("Initial Sync Error (Entering Offline Mode):", e);
      
      // Tenta recuperar backup local de usuários
      const localUsers = localStorage.getItem('btq_users_backup');
      if (localUsers) {
        setUsers(JSON.parse(localUsers));
        setDbStatus('offline'); // Status Correto: Offline com dados
      } else {
        // Apenas se não tiver backup nenhum, cria o admin padrão
        setUsers([{ id: 'admin', username: 'admin', password: 'admin', displayName: 'Administrador', permissions: allPerms }]);
        setDbStatus('error');
      }
    } finally { 
      // Pequeno delay para garantir que o render cycle do React processe os setStates
      // antes de liberar o syncNode para evitar overwrites imediatos
      setTimeout(() => {
         isInitialLoadDone.current = true; 
      }, 500);
    }
  }, [url, allPerms, setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, setUsers, setShifts, setPenduraThreshold, setDbStatus, getValidToken]);

  // -- 3. Engine de Sincronização com Fila (No-Pileup) --
  const syncNode = useCallback(async (nodeName: string, data: any) => {
    // BLOQUEIO CRÍTICO: Não sincronize nada até que a carga inicial esteja 100% completa
    if (!isInitialLoadDone.current) return;
    
    if (nodeName === 'users') {
      localStorage.setItem('btq_users_backup', JSON.stringify(data));
    }

    if (authBlocked.current) {
      setDbStatus('offline');
      return;
    }

    if (isSyncing.current) {
       return; 
    }

    isSyncing.current = true;
    setDbStatus('pending');

    try {
      const token = await getValidToken();
      // Salva no nó específico (ex: /shifts.json), garantindo que a leitura granular funcione
      await saveToFirebase(url, data, undefined, token, nodeName);
      setDbStatus('success');
    } catch (e) {
      console.error(`Sync Fail [${nodeName}]:`, e);
      if (String(e).includes('Auth')) authBlocked.current = true;
      setDbStatus(authBlocked.current ? 'offline' : 'error');
    } finally {
      isSyncing.current = false;
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
    const timer = setTimeout(() => {
      syncNode('openTabs', openTabs);
      syncNode('shifts', shifts);
    }, 1000);
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
