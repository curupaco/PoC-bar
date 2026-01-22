interface QueueItem {
  node: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'btq_sync_queue_v1';

/**
 * Gerenciador de Fila de Sincronização Persistente
 * Garante que dados não sejam perdidos se a internet cair ou a página fechar.
 */
export const SyncQueue = {
  // Lê a fila atual do disco
  load(): Record<string, QueueItem> {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  // Salva a fila no disco
  save(queue: Record<string, QueueItem>) {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  },

  // Adiciona ou atualiza um item na fila
  // Usa estratégia 'Last Write Wins' por nó: se já tem 'products' na fila, substitui pelo novo.
  enqueue(node: string, data: any) {
    const queue = this.load();
    queue[node] = {
      node,
      data,
      timestamp: Date.now(),
      retryCount: (queue[node]?.retryCount || 0)
    };
    this.save(queue);
  },

  // Remove um item da fila (após sucesso)
  dequeue(node: string) {
    const queue = this.load();
    delete queue[node];
    this.save(queue);
  },

  // Retorna os itens pendentes ordenados por prioridade/tempo
  // Priorizamos: Vendas > Mesas > Turnos > Produtos
  getPending(): QueueItem[] {
    const queue = this.load();
    const items = Object.values(queue) as QueueItem[];
    
    return items.sort((a, b) => {
      // Ordem de prioridade fixa
      const priority = ['sales', 'openTabs', 'shifts', 'products', 'users', 'config'];
      const pA = priority.indexOf(a.node);
      const pB = priority.indexOf(b.node);
      
      if (pA !== -1 && pB !== -1) return pA - pB;
      return a.timestamp - b.timestamp;
    });
  },

  // Retorna se há itens na fila
  hasPending(): boolean {
    const queue = this.load();
    return Object.keys(queue).length > 0;
  },

  // Incrementa contador de tentativas (para backoff futuro)
  incrementRetry(node: string) {
    const queue = this.load();
    if (queue[node]) {
      queue[node].retryCount += 1;
      this.save(queue);
    }
  }
};