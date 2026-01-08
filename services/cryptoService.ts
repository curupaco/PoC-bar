
import CryptoJS from 'crypto-js';

export const encryptData = (data: any, key: string): string => {
  if (!key) throw new Error("Chave de criptografia não fornecida.");
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, key).toString();
};

export const decryptData = (ciphertext: string, key: string): any => {
  if (!key) throw new Error("Chave de descriptografia não fornecida.");
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) return null;
    return JSON.parse(decryptedString);
  } catch (e) {
    console.error("Falha na descriptografia:", e);
    return null;
  }
};
