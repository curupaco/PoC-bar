
import { Tab, Sale, Shift, Product, User, ModifierGroup } from '../types';

export const isEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

export const smartMergeTabs = (
  serverTabs: Tab[], 
  localTabs: Tab[]
): { mergedTabs: Tab[], hasChanges: boolean } => {
  if (!serverTabs) return { mergedTabs: localTabs, hasChanges: false };
  if (!localTabs) return { mergedTabs: serverTabs, hasChanges: true };

  const mergedTabs = [...serverTabs];
  
  localTabs.forEach(localTab => {
    const isOnServer = serverTabs.find((st: Tab) => st.id === localTab.id);
    if (!isOnServer) {
      const timeSinceCreation = Date.now() - (localTab.openedAt || 0);
      if (timeSinceCreation < 120000) {
        mergedTabs.push(localTab);
      }
    }
  });

  const isDifferent = !isEqual(mergedTabs, localTabs);
  return { mergedTabs: isDifferent ? mergedTabs : localTabs, hasChanges: isDifferent };
};

/**
 * mergeInitialData - Sistema de Resgate de Emergência Total.
 * Varre o servidor e o navegador em busca de QUALQUER dado de produtos.
 */
export const mergeInitialData = (
  cloudData: any, 
  legacyDataFromBlob: any, 
  legacyKey: string, 
  storageKey: string, 
  fallback: any
) => {
  const isValid = (d: any) => d && (Array.isArray(d) ? d.length > 0 : Object.keys(d).length > 0);

  // 1. PRIORIDADE: Dado oficial da unidade
  if (isValid(cloudData)) return cloudData;
  
  // 2. EMERGÊNCIA: Puxar do Backup em Arquivo (data.json)
  if (isValid(legacyDataFromBlob) && isValid(legacyDataFromBlob[legacyKey])) {
      console.log(`[FORCE_RESCUE] ${legacyKey} resgatado do Backup Central.`);
      return legacyDataFromBlob[legacyKey];
  }

  // 3. EMERGÊNCIA: Varredura de LocalStorage (6 gerações de chaves)
  const rescueKeys = [
    `btq_${legacyKey}_bk`,
    `btq_${legacyKey}_backup`,
    `btq_${legacyKey}`,
    storageKey,
    legacyKey,
    'data'
  ];

  for (const k of rescueKeys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        const data = (k === 'data' && parsed) ? parsed[legacyKey] : parsed;
        if (isValid(data)) {
          console.warn(`[FORCE_RESCUE] ${legacyKey} resgatado localmente via chave: ${k}`);
          return data;
        }
      }
    } catch(e) {}
  }

  return fallback;
};
