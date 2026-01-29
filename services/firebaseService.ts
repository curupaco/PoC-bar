
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

// CACHE DE TOKEN DE AUTENTICAÇÃO (Em Memória - Seguro para troca de dispositivos)
let _cachedToken: string | null = null;
let _tokenExpiration: number = 0;
// Singleton Promise para deduplicação de chamadas de login simultâneas
let _tokenPromise: Promise<string | null> | null = null;

const ensureArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  if (typeof data === 'object') return Object.values(data).filter(Boolean);
  return [];
};

// FIX 3: Timeout Wrapper para Fetch
// AUMENTADO PARA 60s (Mobile Fix): Redes móveis têm latência alta. 15s causava aborto prematuro.
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 60000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const getFirebaseUrl = (url: string, token?: string, path?: string, queryParams?: string) => {
  if (!url) return "";
  let cleanUrl = url.trim().replace(/\/$/, '');
  if (cleanUrl.endsWith('.json')) cleanUrl = cleanUrl.replace('.json', '');
  const finalPath = path ? `/${path}.json` : '/.json';
  const fullUrl = `${cleanUrl}${finalPath}`;
  
  const params = [];
  if (token) params.push(`auth=${token}`);
  if (queryParams) params.push(queryParams);
  
  return params.length > 0 ? `${fullUrl}?${params.join('&')}` : fullUrl;
};

const touchMetadata = async (url: string, token: string, path: string | undefined) => {
  if (!path || !path.includes('/units/')) return;
  const parts = path.split('/');
  const unitIndex = parts.indexOf('units');
  
  if (unitIndex === -1 || parts.length < unitIndex + 3) return;

  const unitId = parts[unitIndex + 1];
  const collection = parts[unitIndex + 2]; 

  if (collection === 'openTabs') return; 

  const metaPath = `data/units/${unitId}/_meta/${collection}_ts`;
  const targetUrl = getFirebaseUrl(url, token, metaPath);

  fetchWithTimeout(targetUrl, {
       method: 'PUT',
       body: JSON.stringify(Date.now())
  }, 5000).catch(e => console.warn("Meta touch fail", e));
};

export const getFirebaseToken = async (email: string, pass: string, apiKey: string): Promise<string | null> => {
  if (!apiKey) return null;

  // 1. Verifica Cache Válido
  if (_cachedToken && Date.now() < _tokenExpiration - 60000) {
    return _cachedToken;
  }

  // 2. Verifica se já existe uma promessa de login em andamento (Deduplicação)
  if (_tokenPromise) {
    return _tokenPromise;
  }

  // 3. Inicia nova requisição
  _tokenPromise = (async () => {
    try {
      const response = await fetchWithTimeout(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, returnSecureToken: true })
      });
      
      const data = await response.json();
      
      if (response.ok && data.idToken) {
        _cachedToken = data.idToken;
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
    } finally {
      // Limpa a promessa para permitir novas tentativas no futuro
      _tokenPromise = null;
    }
  })();

  return _tokenPromise;
};

export const loadFromFirebase = async (url: string, encryptionKey?: string, token?: string, path?: string, queryParams?: string): Promise<any> => {
  if (!token && url.includes('identitytoolkit')) return null;
  try {
    const targetUrl = getFirebaseUrl(url, token, path, queryParams);
    const response = await fetchWithTimeout(`${targetUrl}&cb=${Date.now()}`);
    
    if (!response.ok) return null;
    let data = await response.json();
    
    if (!path && data?.encrypted && encryptionKey) {
        data = decryptData(data.encrypted, encryptionKey);
    }
    
    const arrayNodes = ['products', 'sales', 'openTabs', 'users', 'shifts', 'modifierGroups', 'units', 'categories'];
    if (path && arrayNodes.some(node => path.endsWith(node))) {
        return ensureArray(data);
    }
    
    return data;
  } catch (e) {
    return null;
  }
};

export const saveToFirebase = async (url: string, data: any, encryptionKey?: string, token?: string, path?: string) => {
  if (!token) return;
  try {
    const targetUrl = getFirebaseUrl(url, token, path);
    const payload = (encryptionKey && !path) ? { encrypted: encryptData(data, encryptionKey) } : data;
    await fetchWithTimeout(targetUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (path) touchMetadata(url, token, path);
    
  } catch (e) {
     throw e; // Propagate for Queue retry logic
  }
};

export const saveItemToFirebase = async (url: string, data: any, itemId: string, encryptionKey?: string, token?: string, parentPath?: string) => {
  if (!token || !parentPath || !itemId) return;
  try {
    const itemPath = `${parentPath}/${itemId}`;
    const targetUrl = getFirebaseUrl(url, token, itemPath);
    
    // Se data for null, usamos DELETE
    if (data === null) {
        await fetchWithTimeout(targetUrl, { method: 'DELETE' });
    } else {
        await fetchWithTimeout(targetUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
    }

    touchMetadata(url, token, parentPath);

  } catch (e) {
    console.error("Save Item Error", e);
    throw e; // Propagate for Queue retry
  }
};
