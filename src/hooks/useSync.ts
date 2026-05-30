
import { useEffect, useCallback, useRef, useState } from 'react';
import { loadFromFirebase, getFirebaseToken, saveToFirebase, saveItemToFirebase } from '../services/firebaseService';
import { Product, Sale, Tab, User, Shift, ModifierGroup, Unit, Category, StockTransaction, Franchise, AuditLog } from '../types';
import { SyncQueue, QueueItem } from '../utils/syncQueue';
import { idb } from '../utils/idb';
import { diagnosticLogger } from '../utils/diagnosticLogger';

interface SyncProps {
  setProducts: (data: any) => void;
  setModifierGroups: (data: any) => void;
  setCategoryModifiers: (data: any) => void;
  setSales: (data: any) => void;
  setOpenTabs: (data: any) => void;
  setUsers: (data: any) => void;
  setShifts: (data: any) => void;
  setUnits: (data: any) => void;
  setFranchises: (data: any) => void;
  setCategories: (data: any) => void;
  setAuditLogs: (data: any) => void;
  setStockTransactions: (data: any) => void;
  setDbStatus: (status: 'idle' | 'loading' | 'success' | 'error' | 'offline') => void;
  activeUnitId: string | null;
  config: { url: string; key: string; email: string; pass: string; allPerms: any[]; isDemo?: boolean; }
}

export const useSync = (props: SyncProps) => {
  const isFetching = useRef(false);
  const isProcessingQueue = useRef(false);
  const localMeta = useRef<Record<string, number>>({});
  const initialLoadDone = useRef(false);
  const errorCount = useRef(0);
  const serverTombstones = useRef<Set<string>>(new Set());
  const currentUnitRef = useRef<string | null>(null);

  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const {
    setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs,
    setUsers, setShifts, setUnits, setFranchises, setCategories, setAuditLogs, setStockTransactions, setDbStatus, activeUnitId, config
  } = props;

  const ensureArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(Boolean);
    if (typeof data === 'object') {
      return Object.entries(data).map(([key, value]: [string, any]) => {
        if (value && typeof value === 'object') {
          return value.id ? value : { ...value, id: key };
        }
        return value;
      }).filter(Boolean);
    }
    return [];
  };

  // INÍCIO DA ALTERAÇÃO: Prevenção de Race Condition
  const updateLocalTimestamp = useCallback((key: string) => {
    localMeta.current[key] = Date.now() + 10000;
  }, []);
  // FIM DA ALTERAÇÃO

  // Reset total ao trocar de unidade para evitar vazamento de dados
  useEffect(() => {
    if (activeUnitId !== currentUnitRef.current) {
      localMeta.current = {};
      initialLoadDone.current = false;
      serverTombstones.current.clear();
      errorCount.current = 0;
      currentUnitRef.current = activeUnitId;
      diagnosticLogger.info('useSync', `Unidade alterada para: ${activeUnitId}`, { activeUnitId });
    }
  }, [activeUnitId]);

  const getPersistedBlacklist = useCallback(async () => {
    if (!activeUnitId) return new Set<string>();
    const key = `btq_blacklist_idb_${activeUnitId}`;
    const list = await idb.get<string[]>(key);
    return new Set<string>(list || []);
  }, [activeUnitId]);

  const registerLocalDeletion = useCallback(async (id: string) => {
    if (!activeUnitId) return;
    const key = `btq_blacklist_idb_${activeUnitId}`;
    const current = await getPersistedBlacklist();
    current.add(id);
    await idb.set(key, Array.from(current));
  }, [activeUnitId, getPersistedBlacklist]);

  const processQueue = useCallback(async (token: string) => {
    if (isProcessingQueue.current) return;
    await SyncQueue.init();
    const item = SyncQueue.peek();
    if (!item) return;

    let path = '';
    if (item.unitId === 'GLOBAL') {
      path = item.node;
    } else {
      const effectiveUnitId = item.unitId || activeUnitId;
      if (!effectiveUnitId) return;
      path = `data/units/${effectiveUnitId}/${item.node}`;
    }

    isProcessingQueue.current = true;
    try {
      if (item.itemId) await saveItemToFirebase(config.url, item.data, item.itemId, undefined, token, path);
      else await saveToFirebase(config.url, item.data, undefined, token, path);

      await SyncQueue.dequeue(item.id);
      setPendingSyncCount(SyncQueue.getLength());
      isProcessingQueue.current = false;
      processQueue(token);
    } catch (e) {
      diagnosticLogger.error('useSync', 'Erro ao processar fila de sincronização', e, activeUnitId);
      const currentRetry = item.retryCount || 0;
      if (currentRetry >= 10) await SyncQueue.dequeue(item.id);
      else await SyncQueue.update({ ...item, retryCount: currentRetry + 1 });
      setPendingSyncCount(SyncQueue.getLength());
      isProcessingQueue.current = false;
    }
  }, [config, activeUnitId]);

  const smartMerge = useCallback((serverData: any, nodeKey: string, queue: QueueItem[], blacklist: Set<string>) => {
    const pendingItems = queue.filter(q => q.node.startsWith(nodeKey) && (q.unitId === activeUnitId || (!q.unitId && activeUnitId)));

    // FIX CRÍTICO: Tratamento especial para categoryModifiers (Objeto Simples vs Coleção)
    // categoryModifiers não tem IDs internos, é um mapa { Categoria: GrupoID }.
    // A lógica padrão de 'ensureArray' + 'map by ID' destruía essa estrutura.
    if (nodeKey === 'categoryModifiers') {
      let mergedData = serverData || {};
      // Aplica atualizações pendentes na ordem da fila (sobrescreve o objeto)
      pendingItems.forEach(q => {
        if (q.data && typeof q.data === 'object') {
          mergedData = q.data;
        }
      });
      return mergedData;
    }

    const safeServerData = ensureArray(serverData).map(item => {
      if (nodeKey === 'openTabs' && item && item.items && !Array.isArray(item.items)) {
        return { ...item, items: ensureArray(item.items) };
      }
      return item;
    });

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
            const currentItems = ensureArray(tab.items);
            const itemsMap = new Map(currentItems.map((i: any) => [i.id, i]));
            if (q.itemId) {
              if (q.data) itemsMap.set(q.itemId, q.data);
              else itemsMap.delete(q.itemId);
            }
            dataMap.set(tabId, { ...tab, items: Array.from(itemsMap.values()) });
          }
        }
      });
      const idsToDelete = new Set([...blacklist, ...serverTombstones.current]);
      for (const id of idsToDelete) { if (dataMap.has(id)) dataMap.delete(id); }
    }

    if (nodeKey === 'categories') {
      const uniqueNames = new Set<string>();
      return Array.from(dataMap.values()).filter((cat: any) => {
        const name = cat.name?.trim().toUpperCase();
        if (!name || uniqueNames.has(name)) return false;
        uniqueNames.add(name);
        return true;
      });
    }

    return Array.from(dataMap.values());
  }, [activeUnitId]);

  const fetchData = useCallback(async () => {
    if (config.isDemo) return;
    if (isFetching.current || !activeUnitId) return;
    const fetchStartedForUnit = activeUnitId;
    isFetching.current = true;

    try {
      await SyncQueue.init();
      const currentQueue = SyncQueue.getAll();
      const currentBlacklist = await getPersistedBlacklist();

      const nodesToCheck = [
        { key: 'products', setter: setProducts },
        { key: 'modifierGroups', setter: setModifierGroups },
        { key: 'categories', setter: setCategories },
        { key: 'categoryModifiers', setter: setCategoryModifiers },
        { key: 'sales', setter: setSales },
        { key: 'shifts', setter: setShifts },
        { key: 'openTabs', setter: setOpenTabs },
        { key: 'auditLogs', setter: setAuditLogs },
        { key: 'stockTransactions', setter: setStockTransactions },
      ];

      if (!initialLoadDone.current) {
        diagnosticLogger.info('useSync', 'Carregando dados do cache local', { activeUnitId });
        const cachedData = await idb.get<Record<string, any>>(`btq_cache_${activeUnitId}`);
        if (cachedData && fetchStartedForUnit === activeUnitId) {
          nodesToCheck.forEach(node => {
            if (cachedData[node.key]) {
              const merged = smartMerge(cachedData[node.key], node.key, currentQueue, currentBlacklist);
              node.setter(merged);
            }
          });
          setDbStatus('success');
          diagnosticLogger.info('useSync', 'Cache carregado com sucesso', { activeUnitId });
        } else {
          diagnosticLogger.warn('useSync', 'Nenhum cache encontrado para a unidade', { activeUnitId });
        }
      }

      const token = await getFirebaseToken(config.email, config.pass, config.key);
      if (!token) {
        throw new Error("Falha na autenticação Firebase");
      }

      errorCount.current = 0;
      processQueue(token);
      setPendingSyncCount(SyncQueue.getLength());

      const metaRaw = await loadFromFirebase(config.url, undefined, token, `data/units/${activeUnitId}/_meta`);
      const serverMeta = metaRaw || {};

      const now = Date.now();
      const cutoff24h = now - (24 * 60 * 60 * 1000);

      if (serverMeta.deleted_tabs && typeof serverMeta.deleted_tabs === 'object' && !Array.isArray(serverMeta.deleted_tabs)) {
        const keysToDelete: string[] = [];
        Object.entries(serverMeta.deleted_tabs).forEach(([id, ts]: [string, any]) => {
          const timestamp = Number(ts);
          if (timestamp > cutoff24h) serverTombstones.current.add(id);
          else keysToDelete.push(id);
        });
        if (keysToDelete.length > 0 && config.email.includes('admin')) {
          keysToDelete.forEach(id => saveItemToFirebase(config.url, null, id, undefined, token, `data/units/${activeUnitId}/_meta/deleted_tabs`));
        }
      }

      const limitConfig: Record<string, string> = {
        'sales': 'orderBy="$key"&limitToLast=1000',
        'shifts': 'orderBy="$key"&limitToLast=50',
        'auditLogs': 'orderBy="$key"&limitToLast=2000',
        'stockTransactions': 'orderBy="$key"&limitToLast=5000'
      };

      const promises = nodesToCheck.map(async (node) => {
        const serverTs = serverMeta[`${node.key}_ts`];
        const localTs = localMeta.current[node.key] || 0;

        if (!initialLoadDone.current || (serverTs && serverTs > localTs)) {
          const query = limitConfig[node.key] || '';
          const path = `data/units/${activeUnitId}/${node.key}`;
          try {
            const data = await loadFromFirebase(config.url, undefined, token, path, query);
            if (data !== null) {
              const merged = smartMerge(data, node.key, currentQueue, currentBlacklist);
              localMeta.current[node.key] = serverTs || now;
              diagnosticLogger.info('useSync', `Dados sincronizados: ${node.key}`, { activeUnitId, itemCount: Array.isArray(merged) ? merged.length : Object.keys(merged || {}).length });
              return { key: node.key, data: merged };
            } else {
              diagnosticLogger.warn('useSync', `Dados nulos retornados para: ${node.key}`, { activeUnitId });
            }
          } catch (nodeError) {
            diagnosticLogger.error('useSync', `Erro ao carregar ${node.key}`, nodeError, activeUnitId);
          }
        }
        return null;
      });

      const results = await Promise.all(promises);

      if (fetchStartedForUnit !== activeUnitId) return;

      const cacheToSave = await idb.get<Record<string, any>>(`btq_cache_${activeUnitId}`) || {};
      let hasNewData = false;

      results.forEach(res => {
        if (res) {
          const nodeConfig = nodesToCheck.find(n => n.key === res.key);
          if (nodeConfig) nodeConfig.setter(res.data);
          cacheToSave[res.key] = res.data;
          hasNewData = true;
        }
      });

      if (hasNewData) {
        await idb.set(`btq_cache_${activeUnitId}`, cacheToSave);
      }

      initialLoadDone.current = true;
      setDbStatus('success');
      diagnosticLogger.info('useSync', 'Sincronização completada com sucesso', { activeUnitId });
    } catch (e) {
      diagnosticLogger.error('useSync', 'Erro geral no fetchData', e, activeUnitId);
      errorCount.current += 1;
      if (errorCount.current >= 3) {
        setDbStatus('offline');
        diagnosticLogger.error('useSync', 'Muitos erros - marcando como offline', { errorCount: errorCount.current, activeUnitId }, activeUnitId);
      }
    } finally {
      isFetching.current = false;
    }
  }, [activeUnitId, config, processQueue, smartMerge, getPersistedBlacklist, setProducts, setSales, setShifts, setModifierGroups, setCategories, setCategoryModifiers, setOpenTabs, setUsers, setDbStatus, setAuditLogs, setStockTransactions]);

  const fetchGlobal = useCallback(async () => {
    if (config.isDemo) return;
    try {
      const token = await getFirebaseToken(config.email, config.pass, config.key);
      if (token) {
        processQueue(token);
        setPendingSyncCount(SyncQueue.getLength());
        const [uRaw, unitsRaw, franchisesRaw] = await Promise.all([
          loadFromFirebase(config.url, undefined, token, 'users'),
          loadFromFirebase(config.url, undefined, token, 'units'),
          loadFromFirebase(config.url, undefined, token, 'franchises')
        ]);
        if (uRaw !== null) setUsers(ensureArray(uRaw));
        if (unitsRaw !== null) setUnits(ensureArray(unitsRaw));
        if (franchisesRaw !== null) setFranchises(ensureArray(franchisesRaw));
        diagnosticLogger.info('useSync', 'Dados globais sincronizados');
      }
    } catch (e) {
      diagnosticLogger.error('useSync', 'Erro ao sincronizar dados globais', e);
    }
  }, [config, setUsers, setUnits, setFranchises, processQueue]);

  useEffect(() => {
    fetchGlobal();
    if (activeUnitId) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchData, fetchGlobal, activeUnitId]);

  const refresh = useCallback(() => {
    localMeta.current = {};
    initialLoadDone.current = false;
    serverTombstones.current.clear();
    diagnosticLogger.info('useSync', 'Refresh manual acionado', { activeUnitId });
    fetchGlobal();
    if (activeUnitId) fetchData();
  }, [fetchGlobal, fetchData, activeUnitId]);

  return { refresh, registerLocalDeletion, updateLocalTimestamp, pendingSyncCount };
};
