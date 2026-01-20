
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

const getFirebaseUrl = (url: string, token?: string, path?: string) => {
  if (!url) return "";
  let cleanUrl = url.trim().replace(/\/$/, ''); // Remove trailing slash
  
  // Se a URL base terminar em .json, removemos para poder anexar o path
  if (cleanUrl.endsWith('.json')) {
    cleanUrl = cleanUrl.replace('.json', '');
  }

  // Se houver path, anexa. Se não, usa raiz.
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

  // Se path for fornecido, não usamos 'updatedAt' na raiz do objeto parcial, 
  // pois o Firebase mescla chaves. Se for raiz, mantemos.
  const payloadData = path ? data : { ...data, updatedAt: new Date().toISOString() };
  
  // Criptografia só é aplicada se houver chave E se não estivermos salvando um nó específico (para manter granularidade)
  // Se quisermos granularidade com criptografia, teríamos que criptografar o valor do nó, não o objeto todo.
  // Para corrigir o Item 1 (Race Condition), optamos por salvar nós granulares em Plain Text (protegidos por Auth).
  const payload = (encryptionKey && !path) ? { encrypted: encryptData(payloadData, encryptionKey) } : payloadData;

  try {
    const response = await fetch(targetUrl, {
      method: 'PUT', // PUT em um nó específico substitui apenas aquele nó, agindo como um UPDATE granular
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
    
    // Suporte Legado: Se estiver criptografado na raiz
    if (rawData && rawData.encrypted) {
      if (!encryptionKey) return null;
      return decryptData(rawData.encrypted, encryptionKey);
    }
    
    // Suporte Novo: Dados granulares (Plain JSON)
    return rawData;
  } catch (err: any) {
    console.error("Load Error:", err.message);
    return null;
  }
};
