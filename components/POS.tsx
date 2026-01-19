
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, ModifierGroup, ModifierOption, formatCurrency, generateUniqueId, sanitizeCurrencyInput, parseCurrencyValue } from '../types';

interface POSProps {
  products: Product[];
  modifierGroups?: ModifierGroup[];
  categoryModifiers?: Record<string, string>;
  openTabs: Tab[];
  onUpdateTabs: (updater: (prev: Tab[]) => Tab[]) => void;
  onCompleteSale: (sale: Sale) => void;
  shortcutCheckout?: { name: string; amount: number } | null;
  onClearShortcut?: () => void;
  activeShift?: Shift;
  onViewChange?: (view: any) => void;
}

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  customerName?: string;
}

const POS: React.FC<POSProps> = ({ 
  products = [], 
  modifierGroups = [],
  categoryModifiers = {},
  openTabs = [], 
  onUpdateTabs, 
  onCompleteSale,
  shortcutCheckout,
  onClearShortcut,
  activeShift,
  onViewChange
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['FAVORITOS', 'BEBIDAS']));
  
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [currentPayments, setCurrentPayments] = useState<PaymentEntry[]>([]);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [receivedValueInput, setReceivedValueInput] = useState<number | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [modModalData, setModModalData] = useState<{product: Product, quantity: number} | null>(null);
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);
  const [inputGrams, setInputGrams] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string, hasItems: boolean} | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t); } }, [toast]);
  const showFeedback = (msg: string) => setToast(msg);

  useEffect(() => {
    setCurrentPayments([]); setPaymentAmountInput(''); setReceivedValueInput(null);
    setIsClosingTab(false); setValidationError(null);
  }, [activeTabId]);

  useEffect(() => {
    if (shortcutCheckout) {
      setActiveTabId('shortcut-payment'); setIsClosingTab(true); setCurrentPayments([]);
      setCustomerNameInput(shortcutCheckout.name); setPaymentAmountInput(shortcutCheckout.amount.toString().replace('.', ','));
      setPaymentMethodInput(PaymentMethod.CASH);
    }
  }, [shortcutCheckout]);

  const normalizeId = (id: any) => id ? String(id).trim() : '';

  const activeTab = useMemo(() => {
    if (shortcutCheckout) return { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() };
    return openTabs.find(t => normalizeId(t.id) === normalizeId(activeTabId));
  }, [activeTabId, openTabs, shortcutCheckout]);
    
  const tabItems = activeTab?.items ?? [];
  const tabTotal = shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, tabTotal - paidSoFar);

  const handleProductClick = (product: Product, quantity: number = 1) => {
    if (!activeShift) {
       setValidationError("ABRA O TURNO PARA VENDER!");
       return;
    }
    if (!activeTabId || activeTabId === 'shortcut-payment') {
       setValidationError("SELECIONE UMA MESA PRIMEIRO!");
       return;
    }
    if (product.sellType === 'weight') { setWeightModalProduct(product); return; }
    
    const effectiveModGroupId = product.modifierGroupId || categoryModifiers[product.category?.toUpperCase().trim() || 'GERAL'];
    if (effectiveModGroupId && modifierGroups.some(g => g.id === effectiveModGroupId)) {
       setModModalData({ product, quantity }); 
       return;
    }
    addToTab(product, quantity);
  };

  const addToTab = (product: Product, quantity: number = 1, modifier?: ModifierOption) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        const finalPrice = product.price + (modifier?.price || 0);

        if (editingWeightId) {
          // Correção: Edita pelo ID do produto para evitar erros de index
          const idx = items.findIndex(it => it.productId === editingWeightId);
          if (idx > -1) {
            items[idx] = { ...items[idx], quantity, totalPrice: Number((quantity * finalPrice).toFixed(2)) };
            showFeedback(`${product.name} ATUALIZADO`);
          }
        } else {
          const existingIndex = items.findIndex(i => i.productId === product.id && i.modifier?.name === modifier?.name);
          if (existingIndex > -1 && product.sellType === 'unit') {
            const newQty = items[existingIndex].quantity + quantity;
            items[existingIndex] = { ...items[existingIndex], quantity: newQty, totalPrice: Number((newQty * finalPrice).toFixed(2)) };
            showFeedback(`+1 ${product.name}`);
          } else {
            items.push({ productId: product.id, productName: product.name, category: product.category || 'GERAL', quantity, unitPrice: finalPrice, totalPrice: Number((quantity * finalPrice).toFixed(2)), modifier });
            showFeedback(`${product.name} ADICIONADO`);
          }
        }
        return { ...tab, items };
      }
      return tab;
    }));
    setEditingWeightId(null); setWeightModalProduct(null); setModModalData(null); setInputGrams('');
  };

  const handleQuickDelete = (tabId: string, name: string, items: any[]) => {
    if (!activeShift) return;
    if (items.length === 0) {
      onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(tabId)));
      if (normalizeId(activeTabId) === normalizeId(tabId)) setActiveTabId(null);
      showFeedback(`MESA ${name} ABANDONADA`);
    } else {
      setDeleteConfirmId({ id: tabId, name, hasItems: true });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top-4">
           {toast}
        </div>
      )}
      
      {/* SE CAIXA FECHADO, MOSTRA APENAS MESAS (BLOQUEIA EDIÇÃO) */}
      {!activeShift && activeTabId && (
        <div className="fixed top-24 right-8 z-[200] bg-red-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-pulse">
          Modo Visualização (Caixa Fechado)
        </div>
      )}

      {/* RENDER POS NORMAL (OMITIDO PARA CONCISÃO, MAS MANTENDO A LÓGICA DE VISUALIZAÇÃO) */}
      {/* AQUI FICARIA O RESTANTE DO JSX DO POS JÁ EXISTENTE */}
      <div className="flex-1">
         {/* ... renderização de mesas e produtos ... */}
      </div>
    </div>
  );
};

export default POS;
