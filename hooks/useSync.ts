
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
  const pendingSyncs = useRef<Set<string>>(new Set());
  
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

  // -- 2. Carga Inicial com Fallback Local (Offline Mode) --
  const fetchInitialData = useCallback(async () => {
    setDbStatus('loading');
    try {
      const token = await getValidToken();
      const cloudData = await loadFromFirebase(url, masterKey, token);
      
      const adminUser = { 
        id: 'admin', 
        username: 'admin', 
        password: 'admin', 
        displayName: 'Administrador', 
        permissions: allPerms 
      };

      if (cloudData) {
        setProducts(cloudData.products || []);
        setModifierGroups(cloudData.modifierGroups || []);
        setCategoryModifiers(cloudData.categoryModifiers || {});
        setSales(cloudData.sales || []);
        setOpenTabs(cloudData.openTabs || []);
        setShifts(cloudData.shifts || []);
        
        // Recupera Configurações Globais
        if (cloudData.config && typeof cloudData.config.penduraThreshold === 'number') {
          setPenduraThreshold(cloudData.config.penduraThreshold);
        }
        
        const loadedUsers = cloudData.users || [];
        // Backup dos usuários para LocalStorage (Segurança Offline)
        localStorage.setItem('btq_users_backup', JSON.stringify(loadedUsers));
        
        if (!loadedUsers.some(u => u.username === 'admin')) {
           setUsers([adminUser, ...loadedUsers]);
        } else {
           setUsers(loadedUsers);
        }
        setDbStatus('success');
      } else {
        setUsers([adminUser]);
        setDbStatus('success');
      }
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
      isInitialLoadDone.current = true; 
    }
  }, [url, masterKey, allPerms, setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, setUsers, setShifts, setPenduraThreshold, setDbStatus, getValidToken]);

  // -- 3. Engine de Sincronização com Fila (No-Pileup) --
  const syncNode = useCallback(async (nodeName: string, data: any) => {
    if (!isInitialLoadDone.current) return;
    
    // 1. Backup Local de Segurança para Users
    if (nodeName === 'users') {
      localStorage.setItem('btq_users_backup', JSON.stringify(data));
    }

    // 2. Se estiver bloqueado (Auth Fail), nem tenta e marca offline
    if (authBlocked.current) {
      setDbStatus('offline');
      return;
    }

    // 3. Mecanismo de Lock (Simples)
    if (isSyncing.current) {
       return; 
    }

    isSyncing.current = true;
    setDbStatus('pending');

    try {
      const token = await getValidToken();
      await saveToFirebase(url, data, undefined, token, nodeName);
      setDbStatus('success');
    } catch (e) {
      console.error(`Sync Fail [${nodeName}]:`, e);
      // Se falhar, verifica se foi auth
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
