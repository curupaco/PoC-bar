import { Product, Shift, Category, Tab, SaleItem, Unit, User } from '../types';

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'CERVEJAS' },
  { id: 'cat-2', name: 'PORÇÕES' },
  { id: 'cat-3', name: 'DRINKS' },
];

export const mockProducts: Product[] = [
  { id: 'p-1', name: 'Heineken 600ml', price: 18, category: 'CERVEJAS', isVisible: true, trackStock: true, stockQuantity: 50, alertThreshold: 10, printerIP: '', lastCostPrice: 10 },
  { id: 'p-2', name: 'Original 600ml', price: 16, category: 'CERVEJAS', isVisible: true, trackStock: true, stockQuantity: 100, alertThreshold: 20, printerIP: '', lastCostPrice: 8 },
  { id: 'p-3', name: 'Porção de Fritas', price: 35, category: 'PORÇÕES', isVisible: true, trackStock: false, printerIP: '' },
  { id: 'p-4', name: 'Frango a Passarinho', price: 45, category: 'PORÇÕES', isVisible: true, trackStock: false, printerIP: '' },
  { id: 'p-5', name: 'Caipirinha de Limão', price: 25, category: 'DRINKS', isVisible: true, trackStock: false, printerIP: '' },
  { id: 'p-6', name: 'Gin Tônica', price: 32, category: 'DRINKS', isVisible: true, trackStock: false, printerIP: '' },
];

export const mockUnits: Unit[] = [
  { id: 'unit-demo', name: 'Bar Demonstrativo (Sandbox)', isActive: true, createdAt: Date.now(), address: 'Demo', city: 'Sandbox', phone: '000000', useStock: true }
];

export const mockUsers: User[] = [
  { id: 'admin-demo', username: 'demo_user', password: '123', displayName: 'Visitante (Demo)', permissions: ['pos_access', 'products_manage', 'reports_view', 'settings_manage', 'inventory_manage', 'users_manage', 'shift_manage'], allowedUnits: ['unit-demo'] }
];

export const mockShifts: Shift[] = [
  {
    id: 'shift-demo',
    unitId: 'unit-demo',
    openedAt: Date.now() - 3600000, // 1 hour ago
    openedBy: 'admin-demo',
    openerName: 'Visitante (Demo)',
    initialBalance: 150,
    status: 'open',
    expectedBalance: 150
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
