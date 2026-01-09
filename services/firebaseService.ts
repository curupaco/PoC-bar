
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
    ghToken?: string;
    gistId?: string;
  };
  updatedAt: string;
}

const getFirebaseUrl = (url: string) => {
  if (!url) return "";
  const cleanUrl = url.trim();
  return cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl.replace(/\/$/, '')}/data.json`;
};

export const saveToFirebase = async (url: string, data: any, encryptionKey?: string) => {
  const firebasePct = getFirebaseUrl(url);
  if (!firebasePct) return;

  const fullData = { ...data, updatedAt: new Date().toISOString() };
  const payload = encryptionKey ? { encrypted: encryptData(fullData, encryptionKey) } : fullData;

  try {
    const response = await fetch(firebasePct, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Firebase Error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn("Silent failure on background sync:", err);
    throw err;
  }
};

export const loadFromFirebase = async (url: string, encryptionKey?: string): Promise<AppFullData | null> => {
  const firebasePct = getFirebaseUrl(url);
  if (!firebasePct) return null;

  try {
    const response = await fetch(firebasePct);
    if (!response.ok) return null;
    const rawData = await response.json();
    if (rawData && rawData.encrypted) {
      if (!encryptionKey) return null;
      return decryptData(rawData.encrypted, encryptionKey);
    }
    return rawData;
  } catch (err) {
    console.error("Firebase load failed:", err);
    return null;
  }
};
