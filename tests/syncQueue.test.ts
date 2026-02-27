import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncQueue } from '../src/utils/syncQueue';
import { idb } from '../src/utils/idb';

// Mock do IDB
vi.mock('../src/utils/idb', () => ({
    idb: {
        get: vi.fn(),
        set: vi.fn(),
    },
}));

describe('SyncQueue (Fila de Sincronização)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reinicia o estado interno do SyncQueue
        // Como o SyncQueue é um singleton com estado interno, 
        // precisamos limpar a memória entre os testes se possível, 
        // ou garantir que o init lide com isso.
        // @ts-ignore - Acessando propriedade privada para resetar estado de teste
        SyncQueue.isLoaded = false;
        // @ts-ignore
        SyncQueue.memoryQueue = [];
    });

    it('deve inicializar com uma fila vazia se o IDB estiver vazio', async () => {
        (idb.get as any).mockResolvedValue(null);
        await SyncQueue.init();
        expect(SyncQueue.getAll()).toEqual([]);
    });

    it('deve carregar itens existentes do IDB na inicialização', async () => {
        const existingItems = [{ id: '1', node: 'sales', data: {}, unitId: 'U1', timestamp: 123, retryCount: 0 }];
        (idb.get as any).mockResolvedValue(existingItems);
        await SyncQueue.init();
        expect(SyncQueue.getAll()).toEqual(existingItems);
    });

    it('deve adicionar novos itens à fila e persistir no IDB', async () => {
        (idb.get as any).mockResolvedValue([]);
        await SyncQueue.init();

        await SyncQueue.enqueue({
            node: 'sales',
            data: { total: 100 },
            unitId: 'U1',
            action: 'overwrite'
        });

        const queue = SyncQueue.getAll();
        expect(queue).toHaveLength(1);
        expect(queue[0].node).toBe('sales');
        expect(idb.set).toHaveBeenCalled();
    });

    it('deve remover duplicatas lógicas ao enfileirar (debounce)', async () => {
        await SyncQueue.init();

        await SyncQueue.enqueue({ node: 'tabs', itemId: 'tab1', data: { v: 1 }, unitId: 'U1', action: 'overwrite' });
        await SyncQueue.enqueue({ node: 'tabs', itemId: 'tab1', data: { v: 2 }, unitId: 'U1', action: 'overwrite' });

        const queue = SyncQueue.getAll();
        expect(queue).toHaveLength(1);
        expect(queue[0].data.v).toBe(2); // Mantém o último
    });

    it('deve remover itens da fila com dequeue', async () => {
        (idb.get as any).mockResolvedValue([{ id: 'test-id', node: 'sales' }]);
        await SyncQueue.init();

        await SyncQueue.dequeue('test-id');
        expect(SyncQueue.getAll()).toHaveLength(0);
    });
});
