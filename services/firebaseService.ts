
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
    // Adicionado penduraThreshold para persistência das configurações de negócio
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

/**
 * Realiza o login no Firebase Auth via REST API para obter o token de acesso
 */
export const getFirebaseToken = async (email: string, pass: string, apiKey: string): Promise<string> => {
  if (!apiKey || apiKey.length < 25) {
    throw new Error("Chave de API do Firebase não configurada ou inválida.");
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
        throw new Error("Usuário ou Senha do Firebase incorretos (Bad Credentials). Verifique as configurações de nuvem.");
      }
      if (errorMsg === "INVALID_API_KEY") {
        throw new Error("A API Key informada não pertence a este projeto do Firebase.");
      }
      if (errorMsg === "OPERATION_NOT_ALLOWED") {
        throw new Error("O provedor 'E-mail/Senha' está desativado no console do Firebase (Authentication).");
      }
      
      throw new Error(errorMsg || "Erro na autenticação com o Firebase.");
    }

    return data.idToken;
  } catch (err: any) {
    console.error("Firebase Auth Exception:", err.message);
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
        throw new Error("Erro 401/403: Acesso negado. Configure as Rules do Firebase para permitir leitura/escrita.");
      }
      throw new Error(`Erro Firebase (${response.status})`);
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
