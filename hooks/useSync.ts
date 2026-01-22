
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
  
  // CORREÇÃO: Controle de Concorrência por NÓ (Per-Node Locking) em vez de Global
  // Isso permite que 'shifts' salve ao mesmo tempo que 'sales' sem que um cancele o outro.
  const activeSyncs = useRef<Record<string, boolean>>({});
  
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

  // -- 2. Carga Inicial Híbrida (Granular + Migração Legada) --
  const fetchInitialData = useCallback(async () => {
    setDbStatus('loading');
    try {
      const token = await getValidToken();
      
      // Tentativa 1: Carregar nós individuais (Estrutura Nova)
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

      // Verificação de Migração: Se tudo estiver vazio, pode ser que os dados estejam no formato antigo (Blob Criptografado na Raiz)
      let finalProducts = productsData || [];
      let finalSales = salesData || [];
      let finalShifts = shiftsData || [];
      let finalTabs = tabsData || [];
      let finalUsers = usersData || [];
      let finalModGroups = modGroupsData || [];
      let finalCatMods = catModsData || {};
      let finalConfig = configData || {};

      const isEmptyNewDb = 
        !productsData && !salesData && !shiftsData && !usersData;

      if (isEmptyNewDb) {
         console.warn("DB Granular vazio. Tentando recuperar dados legados (Migração)...");
         try {
           // Carrega a raiz sem path, passando a masterKey para descriptografar se necessário
           const legacyData = await loadFromFirebase(url, masterKey, token);
           if (legacyData) {
              console.log("Dados legados recuperados com sucesso. Aplicando migração...");
              finalProducts = legacyData.products || [];
              finalSales = legacyData.sales || [];
              finalShifts = legacyData.shifts || [];
              finalTabs = legacyData.openTabs || [];
              finalUsers = legacyData.users || [];
              finalModGroups = legacyData.modifierGroups || [];
              finalCatMods = legacyData.categoryModifiers || {};
              finalConfig = legacyData.config || {};
           }
         } catch (legacyErr) {
           console.error("Falha na migração legado:", legacyErr);
         }
      }

      const adminUser = { 
        id: 'admin', 
        username: 'admin', 
        password: 'admin', 
        displayName: 'Administrador', 
        permissions: allPerms 
      };

      setProducts(finalProducts);
      setModifierGroups(finalModGroups);
      setCategoryModifiers(finalCatMods);
      setSales(finalSales);
      setOpenTabs(finalTabs);
      setShifts(finalShifts);
      
      if (finalConfig && typeof finalConfig.penduraThreshold === 'number') {
        setPenduraThreshold(finalConfig.penduraThreshold);
      }
      
      // Backup dos usuários para LocalStorage (Segurança Offline)
      localStorage.setItem('btq_users_backup', JSON.stringify(finalUsers));
      
      if (!finalUsers.some((u: User) => u.username === 'admin')) {
         setUsers([adminUser, ...finalUsers]);
      } else {
         setUsers(finalUsers);
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
      setTimeout(() => {
         isInitialLoadDone.current = true; 
      }, 500);
    }
  }, [url, masterKey, allPerms, setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, setUsers, setShifts, setPenduraThreshold, setDbStatus, getValidToken]);

  // -- 3. Engine de Sincronização Paralela (Non-Blocking) --
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

    // BLOQUEIO POR NÓ: Evita concorrência apenas no MESMO recurso, mas permite paralelos
    if (activeSyncs.current[nodeName]) {
       // Se já está salvando ESTE nó, ignoramos para evitar pileup.
       // O debounce do useEffect garante que se houver dados novos, uma nova chamada virá em 1s/2s.
       return; 
    }

    activeSyncs.current[nodeName] = true;
    setDbStatus('pending');

    try {
      const token = await getValidToken();
      // Salva no nó específico (ex: /shifts.json)
      await saveToFirebase(url, data, undefined, token, nodeName);
      
      // Só volta para success se não houver outros syncs ativos
      const areOthersSyncing = Object.values(activeSyncs.current).some(v => v);
      if (!areOthersSyncing) setDbStatus('success');
      
    } catch (e) {
      console.error(`Sync Fail [${nodeName}]:`, e);
      if (String(e).includes('Auth')) authBlocked.current = true;
      setDbStatus(authBlocked.current ? 'offline' : 'error');
    } finally {
      activeSyncs.current[nodeName] = false;
      
      // Garante status limpo se tudo acabou
      if (!Object.values(activeSyncs.current).some(v => v)) {
         setDbStatus(authBlocked.current ? 'offline' : 'success');
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
    const timer = setTimeout(() => {
      syncNode('openTabs', openTabs);
      syncNode('shifts', shifts);
    }, 1000); // 1s para dados operacionais críticos
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
