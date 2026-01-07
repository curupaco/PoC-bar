
export enum PaymentMethod {
  PIX = 'PIX',
  DEBITO = 'Débito',
  CREDITO = 'Crédito',
  PENDURA = 'Pendura',
  CASH = 'Dinheiro'
}

export type SellType = 'unit' | 'weight';

export interface Product {
  id: string;
  name: string;
  price: number; // Preço por unidade ou por Kg
  category: string;
  sellType: SellType;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number; // Quantidade (unidades) ou Peso (em Kg, ex: 0.350 para 350g)
  unitPrice: number;
  totalPrice: number;
}

export interface Tab {
  id: string;
  name: string; // Mesa ou Nome do Cliente
  items: SaleItem[];
  openedAt: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  total: number;
  tabName?: string;
}

export type View = 'dashboard' | 'products' | 'pos' | 'history' | 'reports';
export type Theme = 'light' | 'dark';
