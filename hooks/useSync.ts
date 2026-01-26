import { useEffect, useCallback, useRef } from 'react';
import { loadFromFirebase, getFirebaseToken, saveToFirebase, saveItemToFirebase } from '../services/firebaseService';
import { Product, Sale, Tab, User, Shift, ModifierGroup, Unit, Category } from '../types';
import { SyncQueue, QueueItem } from '../utils/syncQueue';
import { idb } from '../utils/idb';

interface SyncProps {
  setProducts: (data: any) => void;
  setModifierGroups: (data: any) => void;
  setCategoryModifiers: (data: any) => void;
  setSales: (data: any) => void;
  setOpenTabs: (data: any) => void;
  setUsers: (data: any) => void;
  setShifts: (data: any) => void;
  setUnits: (data: any) => void;
  setCategories: (data: any) => void;
  setDbStatus: (status: 'idle' | 'loading' | 'success' | 'error' | 'offline') => void;
  activeUnitId: string | null;
  config: { url: string; key: string; email: string; pass: string; allPerms: any[]; }
}

export const useSync = (props: SyncProps) => {
  const isFetching = useRef(false);
  const isProcessingQueue = useRef(false);
  const localMeta = useRef<Record<string, number>>({});
  const initialLoadDone = useRef(false);
  
  // FIX 1: Cache de Hash para evitar re-renders desnecessários (Scroll Jump)
  const lastDataHash = useRef<Record<string, string>>({});
  
  // FIX 2: Contador de erros para evitar "pisca-pisca" do status Offline
  const errorCount = useRef(0);

  // Armazena a lista de IDs deletados globalmente (Server-Side Tombstones)
  const serverTombstones = useRef<Set<string>>(new Set());

  const { 
    setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, 
    setUsers, setShifts, setUnits, setCategories, setDbStatus, activeUnitId, config
  } = props;

  // FIX 5: Blacklist por Unidade para evitar interferência entre bares
  const getPersistedBlacklist = useCallback(() => {
      if (!activeUnitId) return new Set<string>();
      try {
          const raw = localStorage.getItem(`btq_zombie_blacklist_${activeUnitId}`);
          return new Set<string>(raw ? JSON.parse(raw) : []);
      } catch {
          return new Set<string>();
      }
  }, [activeUnitId]);

  const getPath = (node: string) => activeUnitId ? `data/units/${activeUnitId}/${node}` : null;
  const getMetaPath = () => activeUnitId ? `data/units/${activeUnitId}/_meta` : null;

  // Função exposta para o App marcar itens como deletados permanentemente
  const registerLocalDeletion = useCallback((id: string) => {
      if (!activeUnitId) return;
      const currentList = getPersistedBlacklist();
      currentList.add(id);
      localStorage.setItem(`btq_zombie_blacklist_${activeUnitId}`, JSON.stringify(Array.from(currentList)));
  }, [activeUnitId, getPersistedBlacklist]);

  // Limpa o hash se mudar de unidade
  useEffect(() => {
      lastDataHash.current = {};
      initialLoadDone.current = false;
      serverTombstones.current.clear();
  }, [activeUnitId]);

  // PROCESSAMENTO DA FILA OFFLINE
  const processQueue = useCallback(async (token: string) => {
    if (isProcessingQueue.current) return;
    
    await SyncQueue.init();
    
    const item = SyncQueue.peek();
    if (!item) return;

    const effectiveUnitId = item.unitId || activeUnitId;
    if (!effectiveUnitId) return;

    isProcessingQueue.current = true;
    try {
        let path = '';
        if (item.node.includes('/')) {
           path = `data/units/${effectiveUnitId}/${item.node}`;
        } else {
           path = `data/units/${effectiveUnitId}/${item.node}`;
        }
        
        if (item.itemId) {
            await saveItemToFirebase(config.url, item.data, item.itemId, undefined, token, path);
        } else {
            await saveToFirebase(config.url, item.data, undefined, token, path);
        }
        
        await SyncQueue.dequeue(item.id);
        
        isProcessingQueue.current = false;
        processQueue(token);
    } catch (e) {
        console.warn("[Queue] Erro ao processar item:", item.id, e);
        const currentRetry = item.retryCount || 0;
        if (currentRetry >= 10) { 
            await SyncQueue.dequeue(item.id);
        } else {
            await SyncQueue.update({ ...item, retryCount: currentRetry + 1 });
        }
        isProcessingQueue.current = false;
    }
  }, [config, activeUnitId]);

  // SMART MERGE (Corrigido para usar Maps em Items e Tombstones Globais)
  const smartMerge = useCallback((serverData: any[], nodeKey: string) => {
      const queue = SyncQueue.getAll();
      const localBlacklist = getPersistedBlacklist();
      
      const pendingItems = queue.filter(q => 
          q.node.startsWith(nodeKey) && 
          (q.unitId === activeUnitId || (!q.unitId && activeUnitId))
      );
      
      const safeServerData = Array.isArray(serverData) ? serverData : [];
      
      // 1. Mapa inicial com dados do servidor
      const dataMap = new Map(safeServerData.map((item: any) => [item.id, item]));

      // 2. Aplica alterações pendentes da fila (Optimistic UI)
      pendingItems.forEach(q => {
          if (!q.node.includes('/') && q.itemId) {
             if (q.data) {
                dataMap.set(q.itemId, { ...q.data, id: q.itemId });
             } else {
                dataMap.delete(q.itemId);
             }
          }
      });

      // 3. Lógica específica para itens aninhados em openTabs (RACE CONDITION FIX)
      if (nodeKey === 'openTabs') {
          const nestedItems = pendingItems.filter(q => q.node.includes('/items'));
          
          nestedItems.forEach(q => {
              const parts = q.node.split('/');
              // Esperado: openTabs/{tabId}/items/{itemId}
              if (parts.length >= 3) {
                  const tabId = parts[1];
                  const tab = dataMap.get(tabId);
                  
                  if (tab) {
                      // Usa Map para garantir unicidade de items por ID
                      const currentItems = Array.isArray(tab.items) ? tab.items : [];
                      const itemsMap = new Map(currentItems.map((i: any) => [i.id, i]));
                      
                      const itemId = q.itemId;
                      if (itemId) {
                          if (q.data) {
                              // Adiciona ou Atualiza
                              itemsMap.set(itemId, q.data);
                          } else {
                              // Remove
                              itemsMap.delete(itemId);
                          }
                      }
                      
                      // Reconstrói o array do tab
                      const newTab = { ...tab, items: Array.from(itemsMap.values()) };
                      dataMap.set(tabId, newTab);
                  }
              }
          });
      }

      // 4. APLICA BLACKLIST (Mesa Zumbi Killer 3.0 - Global & Local)
      // Combina blacklist local com tombstones do servidor
      if (nodeKey === 'openTabs') {
          const idsToDelete = new Set([...localBlacklist, ...serverTombstones.current]);
          if (idsToDelete.size > 0) {
              for (const id of idsToDelete) {
                  if (dataMap.has(id)) {
                      dataMap.delete(id);
                  }
              }
          }
      }

      return Array.from(dataMap.values());
  }, [activeUnitId, getPersistedBlacklist]);

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      await SyncQueue.init();

      const token = await getFirebaseToken(config.email, config.pass, config.key);
      if (!token) throw new Error("Auth Failed");

      errorCount.current = 0;

      processQueue(token);

      if (activeUnitId) {
         // Carrega metadados primeiro para checar tombstones
         const metaRaw = await loadFromFirebase(config.url, undefined, token, getMetaPath()!);
         const serverMeta = metaRaw || {};
         
         // Atualiza Set de Tombstones Globais
         if (serverMeta.deleted_tabs) {
             const deletedMap = serverMeta.deleted_tabs;
             const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24h atrás
             Object.entries(deletedMap).forEach(([id, ts]: [string, any]) => {
                 if (Number(ts) > cutoff) serverTombstones.current.add(id);
             });
         }

         const tRaw = await loadFromFirebase(config.url, undefined, token, getPath('openTabs')!);

         const mergedTabs = smartMerge(tRaw || [], 'openTabs');
         const tabsHash = JSON.stringify(mergedTabs);
         
         if (lastDataHash.current['openTabs'] !== tabsHash) {
            setOpenTabs(mergedTabs);
            lastDataHash.current['openTabs'] = tabsHash;
         }
         
         const limitConfig: Record<string, string> = {
            'sales': 'orderBy="$key"&limitToLast=200',
            'shifts': 'orderBy="$key"&limitToLast=50'
         };

         const nodesToCheck = [
             { key: 'products', setter: setProducts },
             { key: 'sales', setter: setSales },
             { key: 'shifts', setter: setShifts },
             { key: 'modifierGroups', setter: setModifierGroups },
             { key: 'categories', setter: setCategories },
             { key: 'categoryModifiers', setter: setCategoryModifiers }
         ];

         const updates: Promise<any>[] = [];
         const setters: any[] = [];
         const keys: string[] = [];

         for (const node of nodesToCheck) {
             const serverTs = serverMeta[`${node.key}_ts`];
             const localTs = localMeta.current[node.key] || 0;
             
             if (!initialLoadDone.current || (serverTs && serverTs > localTs)) {
                 const query = limitConfig[node.key] || '';
                 updates.push(loadFromFirebase(config.url, undefined, token, getPath(node.key)!, query));
                 setters.push(node.setter);
                 keys.push(node.key);
             }
         }

         if (updates.length > 0) {
             const results = await Promise.all(updates);
             results.forEach((data, idx) => {
                 if (data) {
                     const key = keys[idx];
                     const merged = smartMerge(data, key);
                     const hash = JSON.stringify(merged);
                     
                     if (lastDataHash.current[key] !== hash) {
                        setters[idx](merged);
                        lastDataHash.current[key] = hash;
                     }
                     localMeta.current[key] = serverMeta[`${key}_ts`] || Date.now();
                 }
             });
         }
         
         initialLoadDone.current = true;
      }

      setDbStatus('success');
    } catch (e) {
      console.warn("[Sync] Network issue:", e);
      errorCount.current += 1;
      
      if (errorCount.current >= 3) {
          setDbStatus('offline');
      }
    } finally {
      isFetching.current = false;
    }
  }, [activeUnitId, config, processQueue, smartMerge, setProducts, setSales, setShifts, setModifierGroups, setCategories, setCategoryModifiers, setOpenTabs, setDbStatus]);

  const fetchGlobal = useCallback(async () => {
      const token = await getFirebaseToken(config.email, config.pass, config.key);
      if(token) {
        const [uRaw, unitsRaw] = await Promise.all([
            loadFromFirebase(config.url, undefined, token, 'users'),
            loadFromFirebase(config.url, undefined, token, 'units')
        ]);
        if (uRaw) {
             const hash = JSON.stringify(uRaw);
             if (lastDataHash.current['users'] !== hash) {
                setUsers(uRaw);
                lastDataHash.current['users'] = hash;
             }
        }
        if (Array.isArray(unitsRaw)) {
             const hash = JSON.stringify(unitsRaw);
             if (lastDataHash.current['units'] !== hash) {
                setUnits(unitsRaw);
                lastDataHash.current['units'] = hash;
             }
        }
      }
  }, [config, setUsers, setUnits]);

  useEffect(() => {
    // FIX 2: dbStatus só entra em loading no load inicial para não interromper a UI do POS no polling
    if (!initialLoadDone.current) setDbStatus('loading');
    
    fetchGlobal();
    fetchData(); 
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData, fetchGlobal, setDbStatus]);

  const refresh = useCallback(() => {
     localMeta.current = {};
     lastDataHash.current = {}; 
     initialLoadDone.current = false;
     serverTombstones.current.clear();
     fetchGlobal();
     fetchData();
  }, [fetchGlobal, fetchData]);

  return { refresh, registerLocalDeletion };
};