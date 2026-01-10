
import { Product, Sale, Tab, User, Shift } from "../types";
import { encryptData, decryptData } from "./cryptoService";

export interface AppFullData {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  users?: User[];
  shifts?: Shift[];
  config: {
    fbUrl: string;
    fbApiKey?: string;
    fbEmail?: string;
    fbPass?: string;
  };
  updatedAt: string;
}

const getFirebaseUrl = (url: string, token?: string) => {
  if (!url) return "";
  const cleanUrl = url.trim();
  const baseUrl = cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl.replace(/\/$/, '')}/data.json`;
  return token ? `${baseUrl}?auth=${token}` : baseUrl;
};

/**
 * Realiza o login no Firebase Auth via REST API para obter o token de acesso
 */
export const getFirebaseToken = async (email: string, pass: string, apiKey: string): Promise<string> => {
  // Validação da API Key para evitar chamadas fúteis
  if (!apiKey || apiKey.length < 10 || apiKey.includes("undefined")) {
    throw new Error("API Key inválida ou não configurada.");
  }
  
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, returnSecureToken: true })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const msg = errorData.error?.message;
      
      if (msg === "INVALID_API_KEY") {
        throw new Error("A API Key do Firebase informada é inválida.");
      }
      throw new Error(msg || "Erro na autenticação com o Firebase.");
    }

    const data = await response.json();
    return data.idToken;
  } catch (err: any) {
    console.error("Firebase Auth Failure:", err.message);
    throw err;
  }
};

export const saveToFirebase = async (url: string, data: any, encryptionKey?: string, token?: string) => {
  const firebasePct = getFirebaseUrl(url, token);
  if (!firebasePct) return;

  const fullData = { ...data, updatedAt: new Date().toISOString() };
  const payload = encryptionKey ? { encrypted: encryptData(fullData, encryptionKey) } : fullData;

  try {
    const response = await fetch(firebasePct, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Acesso negado ao Firebase Database. Verifique as regras de segurança.");
      }
      throw new Error(`Erro Firebase: ${response.status}`);
    }
    return await response.json();
  } catch (err: any) {
    console.error("Firebase Save Error:", err.message);
    throw err;
  }
};

export const loadFromFirebase = async (url: string, encryptionKey?: string, token?: string): Promise<AppFullData | null> => {
  const firebasePct = getFirebaseUrl(url, token);
  if (!firebasePct) return null;

  try {
    const response = await fetch(firebasePct);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Se falhar por 401/403 sem token, é esperado se o banco for privado.
        // Se falhar com token, a permissão está errada.
        return null;
      }
      return null;
    }

    const rawData = await response.json();
    if (rawData && rawData.encrypted) {
      if (!encryptionKey) return null;
      return decryptData(rawData.encrypted, encryptionKey);
    }
    return rawData;
  } catch (err: any) {
    console.error("Firebase Load Error:", err.message);
    return null;
  }
};
