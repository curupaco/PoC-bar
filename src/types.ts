export type View = 'pos' | 'products' | 'shifts' | 'cash' | 'users' | 'dashboard' | 'history' | 'reports' | 'settings' | 'help';
export type UserPermission = 'dashboard' | 'pos' | 'products' | 'history' | 'reports' | 'settings' | 'users_admin' | 'shifts_admin' | 'cash_admin' | 'open_shift' | 'close_shift' | 'delete_sale' | 'delete_product' | 'edit_product' | 'export_report' | 'clear_fiado' | 'full_reset' | 'manage_backup' | 'help_view' | 'manage_units' | 'view_audit_logs';
export type Theme = 'light' | 'dark';
export type SellType = 'unit' | 'weight';

export enum PaymentMethod {
  CASH = 'Dinheiro',
  CREDITO = 'Crédito',
  DEBITO = 'Débito',
  PIX = 'Pix',
  PENDURA = 'Pendura',
  MULTIPLE = 'Múltiplo'
}

export interface ModifierOption {
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  category?: string;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sellType: SellType;
  isFavorite: boolean;
  modifierGroupId?: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifier?: ModifierOption;
}

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  customerName?: string;
  change?: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items?: SaleItem[];
  paymentMethod: PaymentMethod | string;
  payments?: PaymentEntry[];
  total: number;
  tabName?: string;
  customerName?: string;
  userId: string;
  shiftId: string;
  deleted?: boolean;
  deletedAt?: number;
  deletedBy?: string;
}

export interface Tab {
  id: string;
  name: string;
  items: SaleItem[];
  openedAt: number;
  version?: number;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  permissions: UserPermission[];
  allowedUnits?: string[];
}

export interface CashTransaction {
  id: string;
  timestamp: number;
  type: 'transfer';
  from: 'Primary' | 'Change';
  to: 'Primary' | 'Change';
  amount: number;
  user: string;
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
  cashSecondary?: number;
  openingCashPrimary: number;
  openingCashChange: number;
  openingCashSecondary?: number;
  finalCashPrimary?: number;
  finalCashChange?: number;
  finalCashSecondary?: number;
  actualCashCounted?: number;
  cashDifference?: number;
  transactions?: CashTransaction[];
  version?: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  username: string;
  action: string; // 'TAB_OPEN', 'TAB_ITEM_ADD', 'TAB_ITEM_REMOVE', 'TAB_CLOSE', 'SHIFT_OPEN', 'SHIFT_CLOSE', 'PAYMENT'
  details: string;
  unitId: string;
}


export interface Unit {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: number;
}

export interface Category {
  id: string;
  name: string;
}

// Helpers
export const PRODUCT_ID_DEBT_SETTLEMENT = 'quitacao';

export const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  } catch (e) {
    return `R$ ${value.toFixed(2)}`;
  }
};

export const parseCurrencyValue = (val: string): number => {
  if (!val) return 0;
  const normalized = val.replace(/\./g, '').replace(',', '.');
  const floatVal = parseFloat(normalized);
  return isNaN(floatVal) ? 0 : floatVal;
};

export const sanitizeCurrencyInput = (val: string): string => {
  return val.replace(/[^0-9,]/g, '');
};

export const safeFloat = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const getBusinessDateStart = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};