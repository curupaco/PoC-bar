
import { useEffect, useCallback, useRef } from 'react';
import { loadFromFirebase, getFirebaseToken } from '../services/firebaseService';
import { Product, Sale, Tab, User, Shift, ModifierGroup } from '../types';

interface SyncProps {
  setProducts: (data: Product[]) => void;
  setModifierGroups: (data: ModifierGroup[]) => void;
  setCategoryModifiers: (data: Record<string, string>) => void;
  setSales: (data: Sale[]) => void;
  setOpenTabs: (data: Tab[]) => void;
  setUsers: (data: User[]) => void;
  setShifts: (data: Shift[]) => void;
  setDbStatus: (status: 'idle' | 'loading' | 'success' | 'error' | 'offline') => void;
  activeUnitId: string | null;
  config: { url: string; key: string; email: string; pass: string; allPerms: any[]; }
}

export const useSync = (props: SyncProps) => {
  const isFetching = useRef(false);
  const lastDataHash = useRef<string>("");

  const { 
    setProducts, setModifierGroups, setSales, setOpenTabs, 
    setUsers, setShifts, setDbStatus, activeUnitId, config
  } = props;

  const getPath = (node: string) => `data/units/${activeUnitId || 'principal'}/${node}`;

  const fetchRemote = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const token = await getFirebaseToken(config.email, config.pass, config.key);
      if (!token) throw new Error("Auth Failed");

      const [uRaw, pRaw, sRaw, mRaw, hRaw, tRaw] = await Promise.all([
        loadFromFirebase(config.url, undefined, token, 'users'),
        loadFromFirebase(config.url, undefined, token, getPath('products')),
        loadFromFirebase(config.url, undefined, token, getPath('sales')),
        loadFromFirebase(config.url, undefined, token, getPath('modifierGroups')),
        loadFromFirebase(config.url, undefined, token, getPath('shifts')),
        loadFromFirebase(config.url, undefined, token, getPath('openTabs'))
      ]);

      const currentHash = JSON.stringify({ uRaw, pRaw, sRaw, mRaw, hRaw, tRaw });
      
      if (currentHash !== lastDataHash.current) {
        // Só atualiza os estados se os dados realmente mudaram
        if (uRaw) setUsers(uRaw);
        if (pRaw) setProducts(pRaw);
        if (sRaw) setSales(sRaw);
        if (mRaw) setModifierGroups(mRaw);
        if (hRaw) setShifts(hRaw);
        if (tRaw) setOpenTabs(tRaw);
        
        lastDataHash.current = currentHash;
        console.log("[Firebase] Dados Sincronizados.");
      }
      
      setDbStatus('success');
    } catch (e) {
      console.warn("[Sync] Falha na rede.");
      setDbStatus('offline');
    } finally {
      isFetching.current = false;
    }
  }, [config.url, config.key, config.email, config.pass, activeUnitId, setProducts, setSales, setUsers, setShifts, setModifierGroups, setOpenTabs, setDbStatus]);

  useEffect(() => {
    setDbStatus('loading');
    fetchRemote();

    const interval = setInterval(fetchRemote, 30000); 
    return () => clearInterval(interval);
  }, [fetchRemote, setDbStatus]);

  return { refresh: fetchRemote };
};
