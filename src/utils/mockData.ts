import { Product, Shift, Category, Tab, SaleItem, Unit, User } from '../types';

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
