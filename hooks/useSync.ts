
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
  const lastDataHash = useRef<Record<string, string>>({});
  const errorCount = useRef(0);
  const serverTombstones = useRef<Set<string>>(new Set());

  const { 
    setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, 
    setUsers, setShifts, setUnits, setCategories, setDbStatus, activeUnitId, config
  } = props;

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

  const registerLocalDeletion = useCallback((id: string) => {
      if (!activeUnitId) return;
      const currentList = getPersistedBlacklist();
      currentList.add(id);
      localStorage.setItem(`btq_zombie_blacklist_${activeUnitId}`, JSON.stringify(Array.from(currentList)));
  }, [activeUnitId, getPersistedBlacklist]);

  useEffect(() => {
      lastDataHash.current = {};
      initialLoadDone.current = false;
      serverTombstones.current.clear();
      if (activeUnitId) setDbStatus('loading');
  }, [activeUnitId, setDbStatus]);

  const processQueue = useCallback(async (token: string) => {
    if (isProcessingQueue.current) return;
    await SyncQueue.init();
    const item = SyncQueue.peek();
    if (!item) return;

    const effectiveUnitId = item.unitId || activeUnitId;
    if (!effectiveUnitId) return;

    isProcessingQueue.current = true;
    try {
        const path = `data/units/${effectiveUnitId}/${item.node}`;
        if (item.itemId) {
            await saveItemToFirebase(config.url, item.data, item.itemId, undefined, token, path);
        } else {
            await saveToFirebase(config.url, item.data, undefined, token, path);
        }
        await SyncQueue.dequeue(item.id);
        isProcessingQueue.current = false;
        processQueue(token);
    } catch (e) {
        const currentRetry = item.retryCount || 0;
        if (currentRetry >= 10) await SyncQueue.dequeue(item.id);
        else await SyncQueue.update({ ...item, retryCount: currentRetry + 1 });
        isProcessingQueue.current = false;
    }
  }, [config, activeUnitId]);

  const smartMerge = useCallback((serverData: any[], nodeKey: string) => {
      const queue = SyncQueue.getAll();
      const localBlacklist = getPersistedBlacklist();
      const pendingItems = queue.filter(q => q.node.startsWith(nodeKey) && (q.unitId === activeUnitId || (!q.unitId && activeUnitId)));
      const safeServerData = Array.isArray(serverData) ? serverData : [];
      const dataMap = new Map(safeServerData.map((item: any) => [item.id, item]));

      pendingItems.forEach(q => {
          if (!q.node.includes('/') && q.itemId) {
             if (q.data) dataMap.set(q.itemId, { ...q.data, id: q.itemId });
             else dataMap.delete(q.itemId);
          }
      });

      if (nodeKey === 'openTabs') {
          const nestedItems = pendingItems.filter(q => q.node.includes('/items'));
          nestedItems.forEach(q => {
              const parts = q.node.split('/');
              if (parts.length >= 3) {
                  const tabId = parts[1];
                  const tab = dataMap.get(tabId);
                  if (tab) {
                      const currentItems = Array.isArray(tab.items) ? tab.items : [];
                      const itemsMap = new Map(currentItems.map((i: any) => [i.id, i]));
                      if (q.itemId) {
                          if (q.data) itemsMap.set(q.itemId, q.data);
                          else itemsMap.delete(q.itemId);
                      }
                      dataMap.set(tabId, { ...tab, items: Array.from(itemsMap.values()) });
                  }
              }
          });
          const idsToDelete = new Set([...localBlacklist, ...serverTombstones.current]);
          for (const id of idsToDelete) { if (dataMap.has(id)) dataMap.delete(id); }
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
         const metaRaw = await loadFromFirebase(config.url, undefined, token, getMetaPath()!);
         const serverMeta = metaRaw || {};
         
         if (serverMeta.deleted_tabs) {
             const cutoff = Date.now() - (24 * 60 * 60 * 1000);
             Object.entries(serverMeta.deleted_tabs).forEach(([id, ts]: [string, any]) => {
                 if (Number(ts) > cutoff) serverTombstones.current.add(id);
             });
         }

         const tRaw = await loadFromFirebase(config.url, undefined, token, getPath('openTabs')!);
         const mergedTabs = smartMerge(tRaw || [], 'openTabs');
         setOpenTabs(mergedTabs);
         
         const limitConfig: Record<string, string> = {
            'sales': 'orderBy="$key"&limitToLast=200',
            'shifts': 'orderBy="$key"&limitToLast=50'
         };

         // Ordem de carregamento forçada para evitar flashes de estado vazio
         const nodesToCheck = [
             { key: 'products', setter: setProducts },
             { key: 'modifierGroups', setter: setModifierGroups },
             { key: 'categories', setter: setCategories },
             { key: 'categoryModifiers', setter: setCategoryModifiers },
             { key: 'sales', setter: setSales },
             { key: 'shifts', setter: setShifts }
         ];

         for (const node of nodesToCheck) {
             const serverTs = serverMeta[`${node.key}_ts`];
             const localTs = localMeta.current[node.key] || 0;
             
             if (!initialLoadDone.current || (serverTs && serverTs > localTs)) {
                 const query = limitConfig[node.key] || '';
                 const data = await loadFromFirebase(config.url, undefined, token, getPath(node.key)!, query);
                 if (data) {
                     const merged = smartMerge(data, node.key);
                     node.setter(merged);
                     localMeta.current[node.key] = serverMeta[`${node.key}_ts`] || Date.now();
                 }
             }
         }
         initialLoadDone.current = true;
         // Delay de segurança para o React processar todos os setters antes de mudar o status do banco
         setTimeout(() => setDbStatus('success'), 100);
      }
    } catch (e) {
      errorCount.current += 1;
      if (errorCount.current >= 3) setDbStatus('offline');
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
        if (uRaw) setUsers(uRaw);
        if (Array.isArray(unitsRaw)) setUnits(unitsRaw);
      }
  }, [config, setUsers, setUnits]);

  useEffect(() => {
    fetchGlobal();
    fetchData(); 
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData, fetchGlobal]);

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
