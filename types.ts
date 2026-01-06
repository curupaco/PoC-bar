
export enum PaymentMethod {
  PIX = 'PIX',
  DEBITO = 'Débito',
  CREDITO = 'Crédito',
  PENDURA = 'Pendura',
  CASH = 'Dinheiro'
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  total: number;
}

export type View = 'dashboard' | 'products' | 'pos' | 'history' | 'reports';
export type Theme = 'light' | 'dark';
