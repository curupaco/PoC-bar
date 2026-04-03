
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage Access Denied:', e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Falha silenciosa
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Falha silenciosa
    }
  }
};
