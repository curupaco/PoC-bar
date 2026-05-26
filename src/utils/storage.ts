const prefixKey = (k: string): string => k.startsWith('btq_') ? k : `btq_${k}`;

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(prefixKey(key));
    } catch (e) {
      console.warn('LocalStorage Access Denied:', e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(prefixKey(key), value);
    } catch (e) {
      // Falha silenciosa
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(prefixKey(key));
    } catch (e) {
      // Falha silenciosa
    }
  }
};
