
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
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, returnSecureToken: true })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Falha na autenticação");
    }

    const data = await response.json();
    return data.idToken;
  } catch (err: any) {
    console.error("Auth Error:", err);
    throw err;
  }
};

export const saveToFirebase = async (url: string, data: any, encryptionKey?: string, token?: string) => {
  const firebasePct = getFirebaseUrl(url, token);
  if (!firebasePct) return;

  const fullData = { ...data, updatedAt: new Date().toISOString() };
  const payload = encryptionKey ? { encrypted: encryptData(fullData, encryptionKey) } : fullData;

  const response = await fetch(firebasePct, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("ACESSO NEGADO: O banco está trancado. Verifique as credenciais de segurança nos Ajustes.");
    }
    throw new Error(`Erro Firebase: ${response.status}`);
  }
  return await response.json();
};

export const loadFromFirebase = async (url: string, encryptionKey?: string, token?: string): Promise<AppFullData | null> => {
  const firebasePct = getFirebaseUrl(url, token);
  if (!firebasePct) return null;

  const response = await fetch(firebasePct);
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("ACESSO NEGADO: Configure a Segurança Avançada para ler os dados.");
    }
    return null;
  }

  const rawData = await response.json();
  if (rawData && rawData.encrypted) {
    if (!encryptionKey) return null;
    return decryptData(rawData.encrypted, encryptionKey);
  }
  return rawData;
};
