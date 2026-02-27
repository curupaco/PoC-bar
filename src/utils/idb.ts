
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface BotequistaDB extends DBSchema {
  keyval: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'botequista-db';
const STORE_NAME = 'keyval';

let dbPromise: Promise<IDBPDatabase<BotequistaDB>>;

if (typeof window !== 'undefined') {
  dbPromise = openDB<BotequistaDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
}

export const idb = {
  async get<T = any>(key: string): Promise<T | undefined> {
    if (!dbPromise) return undefined;
    return (await dbPromise).get(STORE_NAME, key);
  },
  async set(key: string, val: any): Promise<void> {
    if (!dbPromise) return;
    await (await dbPromise).put(STORE_NAME, val, key);
  },
  async del(key: string): Promise<void> {
    if (!dbPromise) return;
    return (await dbPromise).delete(STORE_NAME, key);
  },
  async clear(): Promise<void> {
    if (!dbPromise) return;
    return (await dbPromise).clear(STORE_NAME);
  },
  async keys(): Promise<string[]> {
    if (!dbPromise) return [];
    return (await dbPromise).getAllKeys(STORE_NAME) as Promise<string[]>;
  },
};
