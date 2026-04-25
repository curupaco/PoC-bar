
import { idb } from './idb';

export interface QueueItem {
  id: string;
  node: string;
  data: any;
  itemId?: string;
  unitId: string;
  action: 'overwrite' | 'merge';
  timestamp: number;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'btq_sync_outbox_v3';

// Cache em memória - exposto para testes
export let memoryQueue: QueueItem[] = [];
export let isLoaded = false;
// Promessa singleton para evitar múltiplas inicializações simultâneas
let initPromise: Promise<void> | null = null;

export const SyncQueue = {
  async init(force = false) {
    if (isLoaded && !force) return;
    if (initPromise && !force) return initPromise;

    if (force) {
      isLoaded = false;
      initPromise = null;
    }

    initPromise = (async () => {
      try {
        const stored = await idb.get<QueueItem[]>(QUEUE_STORAGE_KEY);
        if (stored) memoryQueue = stored;
        isLoaded = true;
      } catch (e) {
        console.error("Failed to load queue from IDB", e);
        memoryQueue = [];
        isLoaded = true; 
      }
    })();

    return initPromise;
  },

  getAll(): QueueItem[] {
    return memoryQueue;
  },

  // Torna enqueue async para garantir que o banco carregou antes de adicionar
  async enqueue(item: Omit<QueueItem, 'timestamp' | 'retryCount' | 'id'>) {
    if (!isLoaded) await this.init();

    // Remove duplicatas lógicas (debounce local)
    memoryQueue = memoryQueue.filter(q => !(q.node === item.node && q.itemId === item.itemId));
    
    const newItem: QueueItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retryCount: 0
    };
    
    memoryQueue.push(newItem);
    await this.persist();
  },

  async dequeue(id: string) {
    if (!isLoaded) await this.init();
    memoryQueue = memoryQueue.filter(q => q.id !== id);
    await this.persist();
  },

  async update(updatedItem: QueueItem) {
    if (!isLoaded) await this.init();
    const index = memoryQueue.findIndex(q => q.id === updatedItem.id);
    if (index > -1) {
        memoryQueue[index] = updatedItem;
        await this.persist();
    }
  },

  peek(): QueueItem | undefined {
    return memoryQueue.sort((a, b) => a.timestamp - b.timestamp)[0];
  },

  getLength(): number {
    return memoryQueue.length;
  },

  async persist() {
    try {
      await idb.set(QUEUE_STORAGE_KEY, memoryQueue);
    } catch (e) {
      console.error("Failed to persist queue", e);
    }
  }
};
