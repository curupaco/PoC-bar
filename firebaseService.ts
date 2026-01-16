
// @google/genai guidelines: Ensure valid types are exported for synchronization data
import { Product, Sale, Tab, User, Shift } from "./types";
import { encryptData, decryptData } from "./services/cryptoService";

export interface AppFullData {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  users?: User[];
  shifts?: Shift[];
  // Minimum required version of the app to process this data. Added to support remote version checks in App.tsx.
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

const getFirebaseUrl = (url: string, token?: string) => {
  if (!url) return "";
  const cleanUrl = url.trim();
  const baseUrl = cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl.replace(/\/$/, '')}/data.json`;
  return token ? `${baseUrl}?auth=${token}` : baseUrl;
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

export const saveToFirebase = async (url: string, data: any, encryptionKey?: string, token?: string) => {
  const targetUrl = getFirebaseUrl(url, token);
  if (!targetUrl) return;

  const fullData = { ...data, updatedAt: new Date().toISOString() };
  const payload = encryptionKey ? { encrypted: encryptData(fullData, encryptionKey) } : fullData;

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

export const loadFromFirebase = async (url: string, encryptionKey?: string, token?: string): Promise<AppFullData | null> => {
  const targetUrl = getFirebaseUrl(url, token);
  if (!targetUrl) return null;

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return null;
    }

    const rawData = await response.json();
    if (rawData && rawData.encrypted) {
      if (!encryptionKey) return null;
      return decryptData(rawData.encrypted, encryptionKey);
    }
    return rawData;
  } catch (err: any) {
    console.error("Load Error:", err.message);
    return null;
  }
};
