
import { Product, Sale, Tab } from "../types";
import { encryptData, decryptData } from "./cryptoService";

export interface AppFullData {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  config: {
    fbUrl: string;
    ghToken?: string;
    gistId?: string;
  };
  updatedAt: string;
}

export const saveToFirebase = async (url: string, data: Omit<AppFullData, 'updatedAt'>, encryptionKey?: string) => {
  if (!url) return;
  const firebasePct = url.endsWith('.json') ? url : `${url.replace(/\/$/, '')}/data.json`;

  const fullData: AppFullData = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  // Se houver uma chave, criptografamos todo o objeto antes de enviar
  const payload = encryptionKey 
    ? { encrypted: encryptData(fullData, encryptionKey) }
    : fullData;

  try {
    const response = await fetch(firebasePct, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText || response.statusText}`);
    }
    return await response.json();
  } catch (err: any) {
    throw new Error(err.message || "Erro desconhecido ao salvar no Firebase");
  }
};

export const loadFromFirebase = async (url: string, encryptionKey?: string): Promise<AppFullData | null> => {
  if (!url) return null;
  const firebasePct = url.endsWith('.json') ? url : `${url.replace(/\/$/, '')}/data.json`;

  try {
    const response = await fetch(firebasePct);
    if (!response.ok) {
       if (response.status === 404) return null;
       const errorText = await response.text();
       throw new Error(`Erro ${response.status}: ${errorText || response.statusText}`);
    }
    
    const rawData = await response.json();

    // Se os dados estiverem criptografados no banco
    if (rawData && rawData.encrypted) {
      if (!encryptionKey) throw new Error("Dados criptografados. Chave de acesso necessária.");
      const decrypted = decryptData(rawData.encrypted, encryptionKey);
      if (!decrypted) throw new Error("Chave de acesso incorreta ou dados corrompidos.");
      return decrypted;
    }

    return rawData;
  } catch (err: any) {
    throw new Error(err.message || "Erro ao carregar dados do Firebase");
  }
};
