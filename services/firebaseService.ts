
import { encryptData, decryptData } from "./cryptoService";
import { Product, Sale, Tab, User, Shift, ModifierGroup } from "../types";

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

const ensureArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
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
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, returnSecureToken: true })
    });
    const data = await response.json();
    return response.ok ? data.idToken : null;
  } catch (e) {
    return null;
  }
};

export const loadFromFirebase = async (url: string, encryptionKey?: string, token?: string, path?: string): Promise<any> => {
  if (!token && url.includes('identitytoolkit')) return null;
  try {
    const targetUrl = getFirebaseUrl(url, token, path);
    const response = await fetch(`${targetUrl}${targetUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`);
    if (!response.ok) return null;
    let data = await response.json();
    
    if (!path && data?.encrypted && encryptionKey) {
        data = decryptData(data.encrypted, encryptionKey);
    }
    
    const arrayNodes = ['products', 'sales', 'openTabs', 'users', 'shifts', 'modifierGroups', 'units'];
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
    await fetch(targetUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {}
};
