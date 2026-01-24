
// @google/genai guidelines: Ensure valid types are exported for synchronization data
import { Product, Sale, Tab, User, Shift, ModifierGroup } from "../types";
import { encryptData, decryptData } from "./cryptoService";

export interface AppFullData {
  products: Product[];
  modifierGroups?: ModifierGroup[];
  categoryModifiers?: Record<string, string>;
  sales: Sale[];
  openTabs: Tab[];
  users?: User[];
  shifts?: Shift[];
  minRequiredVersion?: string;
  config: {
    fbUrl?: string;
    fbApiKey?: string;
    fbEmail?: string;
    fbPass?: string;
    penduraThreshold?: number;
  };
  updatedAt: string;
}

// CACHE DE TOKEN DE AUTENTICAÇÃO
// Evita erro QUOTA_EXCEEDED : Exceeded quota for verifying passwords
let _cachedToken: string | null = null;
let _tokenExpiration: number = 0;

const ensureArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  // Correção Crítica: Se o Firebase retornar um objeto (dicionário de IDs), converte para array
  if (typeof data === 'object') return Object.values(data).filter(Boolean);
  return [];
};

const getFirebaseUrl = (url: string, token?: string, path?: string) => {
  if (!url) return "";
  let cleanUrl = url.trim().replace(/\/$/, '');
  if (cleanUrl.endsWith('.json')) cleanUrl = cleanUrl.replace('.json', '');
  const finalPath = path ? `/${path}.json` : '/.json';
  const fullUrl = `${cleanUrl}${finalPath}`;
  return token ? `${fullUrl}?auth=${token}` : fullUrl;
};

export const getFirebaseToken = async (email: string, pass: string, apiKey: string): Promise<string | null> => {
  if (!apiKey) return null;

  // 1. Verifica se temos um token válido em cache (com margem de segurança de 60s)
  if (_cachedToken && Date.now() < _tokenExpiration - 60000) {
    return _cachedToken;
  }

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, returnSecureToken: true })
    });
    
    const data = await response.json();
    
    if (response.ok && data.idToken) {
      // 2. Salva no cache
      _cachedToken = data.idToken;
      // data.expiresIn vem em segundos (geralmente 3600s = 1h)
      const expiresInSeconds = parseInt(data.expiresIn || '3600', 10);
      _tokenExpiration = Date.now() + (expiresInSeconds * 1000);
      
      return data.idToken;
    } else {
      console.error("Auth Error:", data.error);
      return null;
    }
  } catch (e) {
    console.error("Network Auth Error:", e);
    return null;
  }
};

export const loadFromFirebase = async (url: string, encryptionKey?: string, token?: string, path?: string): Promise<any> => {
  if (!token && url.includes('identitytoolkit')) return null;
  try {
    const targetUrl = getFirebaseUrl(url, token, path);
    // Adiciona timestamp para evitar cache do navegador (browser cache vs token cache)
    const response = await fetch(`${targetUrl}${targetUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`);
    if (!response.ok) return null;
    let data = await response.json();
    
    if (!path && data?.encrypted && encryptionKey) {
        data = decryptData(data.encrypted, encryptionKey);
    }
    
    const arrayNodes = ['products', 'sales', 'openTabs', 'users', 'shifts', 'modifierGroups', 'units', 'categories'];
    // Se o path requisitado for um nó de lista, ou se o dado retornado contiver nós de lista
    if (path && arrayNodes.some(node => path.endsWith(node))) {
        return ensureArray(data);
    }
    
    return data;
  } catch (e) {
    return null;
  }
};

// Salva lista inteira (Legacy/Overwrite)
export const saveToFirebase = async (url: string, data: any, encryptionKey?: string, token?: string, path?: string) => {
  if (!token) return;
  try {
    const targetUrl = getFirebaseUrl(url, token, path);
    const payload = (encryptionKey && !path) ? { encrypted: encryptData(data, encryptionKey) } : data;
    await fetch(targetUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {}
};

// Salva item individual (Atomic/Concurrent Safe)
export const saveItemToFirebase = async (url: string, data: any, itemId: string, encryptionKey?: string, token?: string, parentPath?: string) => {
  if (!token || !parentPath || !itemId) return;
  try {
    // Constrói o caminho específico: data/units/{id}/sales/{saleId}
    const itemPath = `${parentPath}/${itemId}`;
    const targetUrl = getFirebaseUrl(url, token, itemPath);
    
    await fetch(targetUrl, {
      method: 'PUT', // PUT num nó filho específico age como INSERT/UPDATE atômico para aquele item
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error("Save Item Error", e);
  }
};
