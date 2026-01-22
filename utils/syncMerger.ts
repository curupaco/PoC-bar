
import { Tab, Sale, Shift, Product, User, ModifierGroup } from '../types';

// Utilitário para comparação profunda
export const isEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Realiza o merge inteligente das comandas (Open Tabs).
 * Preserva comandas locais criadas recentemente (Grace Period) que ainda não existem no servidor.
 */
export const smartMergeTabs = (
  serverTabs: Tab[], 
  localTabs: Tab[]
): { mergedTabs: Tab[], hasChanges: boolean } => {
  if (!serverTabs) return { mergedTabs: localTabs, hasChanges: false };
  if (!localTabs) return { mergedTabs: serverTabs, hasChanges: true };

  const mergedTabs = [...serverTabs];
  let hasProtectedTabs = false;

  // Varredura de Resgate
  localTabs.forEach(localTab => {
    const isOnServer = serverTabs.find((st: Tab) => st.id === localTab.id);
    
    if (!isOnServer) {
      // Regra de Negócio: Se a mesa foi aberta localmente há menos de 2 minutos (120000ms),
      // assumimos que é uma criação recente que ainda está na fila de upload.
      // Mantemos ela na tela para não "sumir" para o garçom.
      const timeSinceCreation = Date.now() - (localTab.openedAt || 0);
      if (timeSinceCreation < 120000) {
        mergedTabs.push(localTab);
        hasProtectedTabs = true;
      }
    }
  });

  // Verifica se o resultado final é diferente do que já temos localmente
  const isDifferent = !isEqual(mergedTabs, localTabs);
  
  return { 
    mergedTabs: isDifferent ? mergedTabs : localTabs, 
    hasChanges: isDifferent 
  };
};

/**
 * Lógica de Fallback para o carregamento inicial.
 * Tenta usar dados da nuvem, se falhar, tenta legado, se falhar, tenta cache local.
 */
export const mergeInitialData = (
  cloudData: any, 
  legacyData: any, 
  legacyKey: string, 
  storageKey: string, 
  fallback: any
) => {
  // 1. Prioridade: Dados Granulares da Nuvem
  if (cloudData && (Array.isArray(cloudData) ? cloudData.length > 0 : Object.keys(cloudData).length > 0)) {
    return cloudData;
  }
  
  // 2. Fallback: Nó Legado (root blob)
  if (legacyData && legacyData[legacyKey]) {
    return legacyData[legacyKey];
  }

  // 3. Fallback: LocalStorage (Offline)
  const local = localStorage.getItem(storageKey);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
        console.warn(`[Merger] Usando Backup Local para ${storageKey} (Cloud Vazio/Erro)`);
        return parsed;
      }
    } catch(e) {
      console.warn(`[Merger] Erro ao ler backup local de ${storageKey}`);
    }
  }

  // 4. Default
  return fallback;
};
