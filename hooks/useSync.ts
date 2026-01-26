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

  const { 
    setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, 
    setUsers, setShifts, setUnits, setCategories, setDbStatus, activeUnitId, config
  } = props;

  const getPath = (node: string) => activeUnitId ? `data/units/${activeUnitId}/${node}` : null;
  const getMetaPath = () => activeUnitId ? `data/units/${activeUnitId}/_meta` : null;

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
           // Caminho absoluto ou sub-caminho já formatado
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
        if (currentRetry >= 10) { // Reduzido para não travar indefinidamente
            await SyncQueue.dequeue(item.id);
        } else {
            await SyncQueue.update({ ...item, retryCount: currentRetry + 1 });
        }
        isProcessingQueue.current = false;
    }
  }, [config, activeUnitId]);

  // SMART MERGE
  const smartMerge = useCallback((serverData: any[], nodeKey: string) => {
      const queue = SyncQueue.getAll();
      
      const pendingItems = queue.filter(q => 
          q.node.startsWith(nodeKey) && 
          (q.unitId === activeUnitId || (!q.unitId && activeUnitId))
      );
      
      if (pendingItems.length === 0) return serverData;

      const dataMap = new Map(serverData.map((item: any) => [item.id, item]));

      pendingItems.forEach(q => {
          if (!q.node.includes('/') && q.itemId) {
             if (q.data) {
                dataMap.set(q.itemId, { ...q.data, id: q.itemId });
             } else {
                dataMap.delete(q.itemId);
             }
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
                      const newTab = { ...tab, items: tab.items ? [...tab.items] : [] };
                      const itemId = q.itemId;
                      
                      if (itemId) {
                          const itemIndex = newTab.items.findIndex((i: any) => i.id === itemId);
                          if (q.data) {
                              if (itemIndex > -1) newTab.items[itemIndex] = q.data;
                              else newTab.items.push(q.data);
                          } else {
                              if (itemIndex > -1) newTab.items.splice(itemIndex, 1);
                          }
                          dataMap.set(tabId, newTab);
                      }
                  }
              }
          });
      }

      return Array.from(dataMap.values());
  }, [activeUnitId]);

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      await SyncQueue.init();

      const token = await getFirebaseToken(config.email, config.pass, config.key);
      if (!token) throw new Error("Auth Failed");

      // Reset erro counter se conectou
      errorCount.current = 0;

      processQueue(token);

      if (activeUnitId) {
         const [tRaw, metaRaw] = await Promise.all([
            loadFromFirebase(config.url, undefined, token, getPath('openTabs')!),
            loadFromFirebase(config.url, undefined, token, getMetaPath()!)
         ]);

         if (tRaw) {
            const merged = smartMerge(tRaw, 'openTabs');
            // Check hash antes de atualizar
            const hash = JSON.stringify(merged);
            if (lastDataHash.current['openTabs'] !== hash) {
                setOpenTabs(merged);
                lastDataHash.current['openTabs'] = hash;
            }
         }
         
         const serverMeta = metaRaw || {};
         
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
                     
                     // Só atualiza estado se o hash for diferente (Scroll Jump Fix)
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
      
      // Só marca offline se falhar 3 vezes seguidas (Badge Flickering Fix)
      if (errorCount.current >= 3) {
          setDbStatus('offline');
      }
    } finally {
      isFetching.current = false;
    }
  }, [activeUnitId, config, processQueue, smartMerge]);

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
  }, [config]);

  useEffect(() => {
    setDbStatus('loading');
    fetchGlobal();
    fetchData(); 
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData, fetchGlobal]);

  const refresh = useCallback(() => {
     localMeta.current = {};
     lastDataHash.current = {}; // Limpa cache de hash
     initialLoadDone.current = false;
     fetchGlobal();
     fetchData();
  }, [fetchGlobal, fetchData]);

  return { refresh };
};