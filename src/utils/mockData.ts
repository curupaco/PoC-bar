import { Product, Shift, Category, Tab, SaleItem, Unit, User, SubscriptionPlan, Subscriber, SubscriptionLog } from '../types';

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'CERVEJAS' },
  { id: 'cat-2', name: 'PORÇÕES' },
  { id: 'cat-3', name: 'DRINKS' },
];

export const mockProducts: Product[] = [
  { id: 'p-1', name: 'Heineken 600ml', price: 18, category: 'CERVEJAS', sellType: 'unit', isFavorite: true, trackStock: true, lastCostPrice: 10 },
  { id: 'p-2', name: 'Original 600ml', price: 16, category: 'CERVEJAS', sellType: 'unit', isFavorite: false, trackStock: true, lastCostPrice: 8 },
  { id: 'p-3', name: 'Porção de Fritas', price: 35, category: 'PORÇÕES', sellType: 'unit', isFavorite: false, trackStock: false },
  { id: 'p-4', name: 'Frango a Passarinho', price: 45, category: 'PORÇÕES', sellType: 'unit', isFavorite: false, trackStock: false },
  { id: 'p-5', name: 'Caipirinha de Limão', price: 25, category: 'DRINKS', sellType: 'unit', isFavorite: true, trackStock: false },
  { id: 'p-6', name: 'Gin Tônica', price: 32, category: 'DRINKS', sellType: 'unit', isFavorite: false, trackStock: false },
];

export const mockUnits: Unit[] = [
  { id: 'unit-demo', name: 'Bar Demonstrativo (Sandbox)', isActive: true, createdAt: Date.now(), useStock: true }
];

export const mockUsers: User[] = [
  { id: 'admin-demo', username: 'demo_user', password: '123', displayName: 'Visitante (Demo)', permissions: ['pos', 'products', 'reports', 'settings', 'users_admin', 'shifts_admin', 'open_shift', 'close_shift'], allowedUnits: ['unit-demo'] }
];

export const mockShifts: Shift[] = [
  {
    id: 'shift-demo',
    startTime: Date.now() - 3600000,
    openedBy: 'admin-demo',
    status: 'open',
    cashPrimary: 150,
    cashChange: 0,
    openingCashPrimary: 150,
    openingCashChange: 0,
  }
];

export const mockOpenTabs: Tab[] = [
  {
    id: 'tab-1',
    name: 'MESA 01',
    openedAt: Date.now() - 1800000,
    items: [
      { id: 'it-1', productId: 'p-1', productName: 'Heineken 600ml', category: 'CERVEJAS', quantity: 2, unitPrice: 18, totalPrice: 36 } as SaleItem
    ],
    lastItemAddedAt: Date.now() - 1500000
  },
  {
    id: 'tab-2',
    name: 'BALCÃO',
    openedAt: Date.now() - 500000,
    items: [],
    lastItemAddedAt: Date.now() - 500000
  }
];

export const mockSubscriptionPlans: SubscriptionPlan[] = [
  { id: 'plan-1', name: 'Clube Chopp Diário', price: 59.90, products: ['p-1', 'p-2'], dailyLimit: 1 },
  { id: 'plan-2', name: 'Drink Club VIP', price: 99.90, products: ['p-5', 'p-6'], dailyLimit: 2 },
];

export const mockSubscribers: Subscriber[] = [
  { id: 'sub-1', name: 'João Silva (Chopp)', phone: '11999998888', cpf: '12345678900', planId: 'plan-1', status: 'active', createdAt: Date.now() - 15 * 24 * 3600 * 1000, expiresAt: Date.now() + 15 * 24 * 3600 * 1000 },
  { id: 'sub-2', name: 'Maria Souza (Drink)', phone: '11988887777', cpf: '98765432100', planId: 'plan-2', status: 'active', createdAt: Date.now() - 10 * 24 * 3600 * 1000, expiresAt: Date.now() + 20 * 24 * 3600 * 1000 },
  { id: 'sub-3', name: 'Pedro Oliveira (Inativo)', phone: '11977776666', cpf: '11122233344', planId: 'plan-1', status: 'expired', createdAt: Date.now() - 40 * 24 * 3600 * 1000, expiresAt: Date.now() - 10 * 24 * 3600 * 1000 },
];

export const mockSubscriptionLogs: SubscriptionLog[] = [
  { id: 'slog-1', subscriberId: 'sub-1', subscriberName: 'João Silva (Chopp)', planName: 'Clube Chopp Diário', productId: 'p-1', productName: 'Heineken 600ml', timestamp: Date.now() - 2 * 24 * 3600 * 1000, tabId: 'tab-old-1', tabName: 'Mesa 3', unitId: 'unit-demo' },
  { id: 'slog-2', subscriberId: 'sub-2', subscriberName: 'Maria Souza (Drink)', planName: 'Drink Club VIP', productId: 'p-5', productName: 'Caipirinha de Limão', timestamp: Date.now() - 1 * 24 * 3600 * 1000, tabId: 'tab-old-2', tabName: 'Mesa 8', unitId: 'unit-demo' },
];
