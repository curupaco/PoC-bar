
export enum PaymentMethod {
  PIX = 'PIX',
  DEBITO = 'Débito',
  CREDITO = 'Crédito',
  PENDURA = 'Pendura',
  CASH = 'Dinheiro'
}

export type SellType = 'unit' | 'weight';

export type UserPermission = 
  | 'dashboard' 
  | 'pos' 
  | 'products' 
  | 'history' 
  | 'reports' 
  | 'settings' 
  | 'users_admin' 
  | 'shifts_admin' 
  | 'cash_admin' 
  | 'open_shift' 
  | 'close_shift';

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  permissions: UserPermission[];
}

export interface Shift {
  id: string;
  startTime: number;
  endTime?: number;
  openedBy: string; // userId
  closedBy?: string; // userId
  status: 'open' | 'closed';
  
  // Caixas Segmentados (Saldos de Abertura)
  cashPrimary: number;   
  cashChange: number;    
  cashSecondary: number; 

  // Valores de fechamento
  finalCashPrimary?: number;
  finalCashChange?: number;
  finalCashSecondary?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sellType: SellType;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Tab {
  id: string;
  name: string;
  items: SaleItem[];
  openedAt: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  openedAt?: number;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  total: number;
  tabName?: string;
  customerName?: string;
  userId: string; // Quem realizou a venda
  shiftId: string; // Turno vinculado
}

export type View = 'dashboard' | 'products' | 'pos' | 'history' | 'reports' | 'settings' | 'users' | 'shifts' | 'cash';
export type Theme = 'light' | 'dark' | 'retro';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
