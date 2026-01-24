
import { useEffect, useCallback, useRef } from 'react';
import { loadFromFirebase, getFirebaseToken } from '../services/firebaseService';
import { Product, Sale, Tab, User, Shift, ModifierGroup, Unit, Category } from '../types';

interface SyncProps {
  setProducts: (data: Product[]) => void;
  setModifierGroups: (data: ModifierGroup[]) => void;
  setCategoryModifiers: (data: Record<string, string>) => void;
  setSales: (data: Sale[]) => void;
  setOpenTabs: (data: Tab[]) => void;
  setUsers: (data: User[]) => void;
  setShifts: (data: Shift[]) => void;
  setUnits: (data: Unit[]) => void;
  setCategories: (data: Category[]) => void;
  setDbStatus: (status: 'idle' | 'loading' | 'success' | 'error' | 'offline') => void;
  activeUnitId: string | null;
  config: { url: string; key: string; email: string; pass: string; allPerms: any[]; }
}

export const useSync = (props: SyncProps) => {
  const isFetching = useRef(false);
  // Hash separado para dados globais e dados da unidade
  const lastGlobalHash = useRef<string>("");
  const lastUnitHash = useRef<string>("");

  const { 
    setProducts, setModifierGroups, setCategoryModifiers, setSales, setOpenTabs, 
    setUsers, setShifts, setUnits, setCategories, setDbStatus, activeUnitId, config
  } = props;

  const getPath = (node: string) => activeUnitId ? `data/units/${activeUnitId}/${node}` : null;

  // Reseta o hash de comparação ao trocar de unidade para garantir que os dados da nova unidade sejam carregados
  useEffect(() => {
    lastUnitHash.current = "";
  }, [activeUnitId]);

  const fetchRemote = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const token = await getFirebaseToken(config.email, config.pass, config.key);
      if (!token) throw new Error("Auth Failed");

      // 1. Fetch Dados Globais (Sempre)
      const [uRaw, unitsRaw] = await Promise.all([
        loadFromFirebase(config.url, undefined, token, 'users'),
        loadFromFirebase(config.url, undefined, token, 'units')
      ]);

      const globalHash = JSON.stringify({ uRaw, unitsRaw });
      if (globalHash !== lastGlobalHash.current) {
        if (uRaw) setUsers(uRaw);
        if (Array.isArray(unitsRaw)) setUnits(unitsRaw);
        lastGlobalHash.current = globalHash;
      }

      // 2. Fetch Dados da Unidade (Apenas se selecionada)
      if (activeUnitId) {
        const [pRaw, sRaw, mRaw, hRaw, tRaw, catsRaw, catModsRaw] = await Promise.all([
          loadFromFirebase(config.url, undefined, token, getPath('products')!),
          loadFromFirebase(config.url, undefined, token, getPath('sales')!),
          loadFromFirebase(config.url, undefined, token, getPath('modifierGroups')!),
          loadFromFirebase(config.url, undefined, token, getPath('shifts')!),
          loadFromFirebase(config.url, undefined, token, getPath('openTabs')!),
          loadFromFirebase(config.url, undefined, token, getPath('categories')!),
          loadFromFirebase(config.url, undefined, token, getPath('categoryModifiers')!)
        ]);

        const unitHash = JSON.stringify({ pRaw, sRaw, mRaw, hRaw, tRaw, catsRaw, catModsRaw });
        
        if (unitHash !== lastUnitHash.current) {
          if (pRaw) setProducts(pRaw);
          if (sRaw) setSales(sRaw);
          if (mRaw) setModifierGroups(mRaw);
          if (hRaw) setShifts(hRaw);
          if (tRaw) setOpenTabs(tRaw);
          if (catsRaw) setCategories(catsRaw);
          if (catModsRaw) setCategoryModifiers(catModsRaw);
          
          lastUnitHash.current = unitHash;
          console.log(`[Firebase] Dados da Unidade '${activeUnitId}' Sincronizados.`);
        }
      } else {
        // Se não tem unidade selecionada, limpa os dados da unidade anterior para evitar mistura
        setProducts([]);
        setSales([]);
        setShifts([]);
        setOpenTabs([]);
      }
      
      setDbStatus('success');
    } catch (e) {
      console.warn("[Sync] Falha na rede ou Auth.");
      setDbStatus('offline');
    } finally {
      isFetching.current = false;
    }
  }, [config.url, config.key, config.email, config.pass, activeUnitId, setProducts, setSales, setUsers, setShifts, setModifierGroups, setCategoryModifiers, setOpenTabs, setUnits, setCategories, setDbStatus]);

  useEffect(() => {
    setDbStatus('loading');
    fetchRemote();

    const interval = setInterval(fetchRemote, 10000); // Polling mais rápido (10s) para sentir mais "realtime"
    return () => clearInterval(interval);
  }, [fetchRemote, setDbStatus]);

  return { refresh: fetchRemote };
};
