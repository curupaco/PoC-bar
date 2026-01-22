
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

// Helper para garantir que objetos retornados como {0: {}, 1: {}} virem Arrays corretamente
// ADIÇÃO: .filter(Boolean) remove entradas 'null' que o Firebase pode deixar se um índice for deletado
const ensureArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  if (typeof data === 'object') return Object.values(data).filter(Boolean);
  return [];
};

const getFirebaseUrl = (url: string, token?: string, path?: string) => {
  if (!url) return "";
  let cleanUrl = url.trim().replace(/\/$/, ''); 
  
  if (cleanUrl.endsWith('.json')) {
    cleanUrl = cleanUrl.replace('.json', '');
  }

  const finalPath = path ? `/${path}.json` : '/data.json';
  const fullUrl = `${cleanUrl}${finalPath}`;

  return token ? `${fullUrl}?auth=${token}` : fullUrl;
};

export const getFirebaseToken = async (email: string, pass: string, apiKey: string): Promise<string> => {
  if (!apiKey || apiKey.length < 25) {
    throw new Error("Conexão de dados não configurada.");
  }
  
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, returnSecureToken: true })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message;
      if (errorMsg === "INVALID_LOGIN_CREDENTIALS" || errorMsg === "BAD_CREDENTIALS") {
        throw new Error("Erro de Acesso: Credenciais de sincronização inválidas.");
      }
      throw new Error("Falha na autenticação do canal de dados.");
    }

    return data.idToken;
  } catch (err: any) {
    console.error("Auth Exception:", err.message);
    throw err;
  }
};

export const saveToFirebase = async (url: string, data: any, encryptionKey?: string, token?: string, path?: string) => {
  const targetUrl = getFirebaseUrl(url, token, path);
  if (!targetUrl) return;

  const payloadData = path ? data : { ...data, updatedAt: new Date().toISOString() };
  const payload = (encryptionKey && !path) ? { encrypted: encryptData(payloadData, encryptionKey) } : payloadData;

  try {
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Erro de Sincronização: Acesso negado.");
      }
      throw new Error(`Erro de Dados (${response.status})`);
    }
    return await response.json();
  } catch (err: any) {
    console.error("Save Error:", err.message);
    throw err;
  }
};

export const loadFromFirebase = async (url: string, encryptionKey?: string, token?: string, path?: string): Promise<any | null> => {
  const targetUrl = getFirebaseUrl(url, token, path);
  if (!targetUrl) return null;

  try {
    // Timestamp para quebrar cache agressivo de iOS/PWA
    const separator = targetUrl.includes('?') ? '&' : '?';
    const noCacheUrl = `${targetUrl}${separator}t=${Date.now()}`;

    const response = await fetch(noCacheUrl, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
    
    if (!response.ok) {
      // 404 significa que o nó ainda não existe (banco novo), retornamos null para tratar na lógica de negócio
      if (response.status === 404) return null;
      throw new Error(`HTTP Error ${response.status}`);
    }

    const rawData = await response.json();
    
    // Descriptografia legado (Blob Root)
    if (!path && rawData && rawData.encrypted) {
      if (!encryptionKey) return null;
      return decryptData(rawData.encrypted, encryptionKey);
    }
    
    // Normalização de Arrays para nós granulares
    if (path && ['products', 'sales', 'openTabs', 'users', 'shifts', 'modifierGroups'].includes(path)) {
        return ensureArray(rawData);
    }

    return rawData;
  } catch (err: any) {
    console.warn(`Load Warning [${path || 'root'}]:`, err.message);
    return null; // Retorna null em erro de rede para forçar uso do backup local
  }
};
