
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
  | 'close_shift' 
  | 'delete_sale' 
  | 'delete_product' 
  | 'edit_product' 
  | 'export_report' 
  | 'clear_fiado' 
  | 'full_reset' 
  | 'manage_backup' 
  | 'help_view';

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
  openedBy: string;
  closedBy?: string;
  status: 'open' | 'closed';
  cashPrimary: number;   
  cashChange: number;    
  cashSecondary: number; 
  finalCashPrimary?: number;
  finalCashChange?: number;
  finalCashSecondary?: number;
  actualCashCounted?: number; 
  cashDifference?: number;    
}

export interface ModifierOption {
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  category: string;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sellType: SellType;
  isFavorite?: boolean;
  modifierGroupId?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  category: string; 
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifier?: ModifierOption;
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
  userId: string;
  shiftId: string;
}

export type View = 'dashboard' | 'products' | 'pos' | 'history' | 'reports' | 'settings' | 'users' | 'shifts' | 'cash' | 'help';
export type Theme = 'light' | 'dark';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const generateUniqueId = (prefix: string = '') => {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${ts}-${rand}` : `${ts}-${rand}`;
};

export const sanitizeCurrencyInput = (val: string): string => {
  // Apenas remove letras e caracteres especiais, mantendo números, vírgula e ponto para o usuário digitar 1,50
  return val.replace(/[^0-9,.]/g, '');
};

export const parseCurrencyValue = (val: string): number => {
  if (!val) return 0;
  // Converte para formato numérico real trocando vírgula por ponto antes do parseFloat
  const normalized = val.replace(',', '.');
  return parseFloat(normalized) || 0;
};
