
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, ModifierGroup, ModifierOption, formatCurrency, generateUniqueId, sanitizeCurrencyInput, parseCurrencyValue, Theme } from '../types';

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
  theme?: Theme;
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
  onViewChange,
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [currentPayments, setCurrentPayments] = useState<PaymentEntry[]>([]);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [receivedValueInput, setReceivedValueInput] = useState<number | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [modifierModalData, setModifierModalData] = useState<{product: Product, group: ModifierGroup} | null>(null);
  const [editingItemUid, setEditingItemUid] = useState<string | null>(null);
  const [inputGrams, setInputGrams] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string, hasItems: boolean} | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

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

  const changeDue = useMemo(() => {
    if (paymentMethodInput !== PaymentMethod.CASH || !receivedValueInput) return 0;
    const amountToPay = parseCurrencyValue(paymentAmountInput) || remainingBalance;
    return Math.max(0, receivedValueInput - amountToPay);
  }, [receivedValueInput, paymentAmountInput, remainingBalance, paymentMethodInput]);

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-[32px] flex items-center justify-center text-red-600 shadow-xl border border-red-200 dark:border-red-900/30">
             <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-2 border-white dark:border-slate-900 animate-ping opacity-30"></div>
        </div>
        <div className="max-w-xs space-y-4">
           <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none italic">Caixa Fechado</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm px-4 leading-relaxed">
             A operação de vendas está bloqueada. <span className="text-red-600 dark:text-red-400 font-black">ABRA O TURNO</span> para começar.
           </p>
        </div>
        <button onClick={() => onViewChange && onViewChange('shifts')} className="bg-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Ir para Turnos</button>
      </div>
    );
  }

  const handleProductClick = (product: Product, quantity: number = 1) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') { setValidationError("SELECIONE UMA MESA!"); return; }
    if (product.sellType === 'weight') { setWeightModalProduct(product); return; }
    
    const effectiveModGroupId = product.modifierGroupId || categoryModifiers[product.category.toUpperCase().trim()];
    const modGroup = modifierGroups.find(g => g.id === effectiveModGroupId);

    if (modGroup) {
      setModifierModalData({ product, group: modGroup });
      return;
    }

    addToTab(product, quantity);
  };

  const addToTab = (product: Product, quantity: number = 1, modifier?: ModifierOption) => {
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        const unitPrice = product.price + (modifier?.price || 0);
        const totalPrice = Number((quantity * unitPrice).toFixed(2));
        
        if (editingItemUid) {
          const idx = items.findIndex(it => it.id === editingItemUid);
          if (idx > -1) {
            items[idx] = { ...items[idx], quantity, unitPrice, totalPrice, modifier };
            showFeedback(`${product.name} ATUALIZADO`);
          }
        } else {
          const existingIndex = items.findIndex(i => 
            i.productId === product.id && 
            product.sellType === 'unit' &&
            (!i.modifier && !modifier || i.modifier?.name === modifier?.name)
          );

          if (existingIndex > -1) {
            const newQty = items[existingIndex].quantity + quantity;
            items[existingIndex] = { ...items[existingIndex], quantity: newQty, totalPrice: Number((newQty * unitPrice).toFixed(2)) };
            showFeedback(`+1 ${product.name}`);
          } else {
            items.push({ 
              id: generateUniqueId('it'),
              productId: product.id, 
              productName: modifier ? `${product.name} (${modifier.name})` : product.name, 
              category: product.category?.toUpperCase().trim() || 'GERAL',
              quantity, 
              unitPrice, 
              totalPrice,
              modifier
            });
            showFeedback(`${product.name} ADICIONADO`);
          }
        }
        return { ...tab, items };
      }
      return tab;
    }));
    setEditingItemUid(null); setWeightModalProduct(null); setModifierModalData(null); setInputGrams('');
  };

  const removeFromTab = (uid: string) => {
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        return { ...tab, items: (tab.items ?? []).filter(it => it.id !== uid) };
      }
      return tab;
    }));
  };

  const updateItemQty = (uid: string, delta: number) => {
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        const idx = items.findIndex(it => it.id === uid);
        if (idx === -1) return tab;

        const item = items[idx];
        const prod = products.find(p => p.id === item.productId);
        
        if (prod?.sellType === 'weight' && delta === 0) {
           setWeightModalProduct(prod);
           setEditingItemUid(uid);
           setInputGrams((item.quantity * 1000).toFixed(0));
           return tab;
        }

        const newQty = item.quantity + delta;
        if (newQty <= 0) items.splice(idx, 1);
        else items[idx] = { ...item, quantity: newQty, totalPrice: Number((newQty * item.unitPrice).toFixed(2)) };
        return { ...tab, items };
      }
      return tab;
    }));
  };

  const handleFinishSale = () => {
    const isShortcut = activeTabId === 'shortcut-payment';
    let finalPayments = [...currentPayments];
    if (paymentMethodInput === PaymentMethod.CASH && receivedValueInput && receivedValueInput > 0 && finalPayments.length === 0) {
       finalPayments.push({ method: PaymentMethod.CASH, amount: remainingBalance, customerName: customerNameInput.toUpperCase() || undefined });
    }
    const currentTotalPaid = finalPayments.reduce((acc, p) => acc + p.amount, 0);
    if (!activeTab || (!isShortcut && tabItems.length === 0) || (currentTotalPaid < 0.01)) {
       setValidationError("PAGAMENTO OBRIGATÓRIO!"); return;
    }
    if (!isShortcut && (tabTotal - currentTotalPaid) > 0.05) {
       setValidationError(`FALTAM ${formatCurrency(tabTotal - currentTotalPaid)}!`); return;
    }
    finalPayments.forEach((p, index) => {
       onCompleteSale({
          id: generateUniqueId('sale'),
          timestamp: Date.now(),
          openedAt: activeTab.openedAt,
          items: isShortcut 
            ? [{ id: 'q', productId: 'quitacao', productName: 'Quitação Fiado', category: 'FIADO', quantity: 1, unitPrice: p.amount, totalPrice: p.amount }] 
            : (index === 0 ? tabItems : []),
          paymentMethod: p.method,
          total: p.amount,
          tabName: activeTab.name,
          customerName: p.customerName || (isShortcut ? shortcutCheckout?.name : undefined),
          userId: '', shiftId: activeShift?.id || ''
       });
    });
    if (!isShortcut) onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
    else if (onClearShortcut) onClearShortcut();
    setActiveTabId(null); setIsClosingTab(false); setCurrentPayments([]);
    showFeedback("VENDA FINALIZADA");
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const favorites = filteredProducts.filter(p => p.isFavorite);
  const categories = Array.from(new Set(filteredProducts.map(p => p.category))).sort();

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">{toast}</div>}
      {validationError && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl" onClick={() => setValidationError(null)}>{validationError}</div>}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl relative z-[410] text-center">
             <h3 className="text-xl font-black uppercase mb-2 text-slate-800 dark:text-white">Excluir Mesa?</h3>
             <p className="text-sm text-slate-500 mb-8">Apagar o consumo de "{deleteConfirmId.name}"?</p>
             <div className="flex flex-col gap-3">
                <button onClick={() => { onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(deleteConfirmId.id))); setActiveTabId(null); setDeleteConfirmId(null); }} className="w-full py-4 font-black uppercase text-xs bg-red-600 text-white rounded-xl">Sim, Excluir</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 font-black uppercase text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {!activeTabId ? (
        <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Monitor de Mesas</h2>
            {!isAddingTab && <button onClick={() => setIsAddingTab(true)} className="px-8 py-3 font-black uppercase text-xs tracking-widest bg-red-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">Nova Mesa</button>}
          </div>
          {isAddingTab && (
            <div className="p-8 bg-white dark:bg-slate-900 border-red-500 border-4 rounded-[32px] flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="IDENTIFICAÇÃO DA MESA..." className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-950 font-black rounded-2xl outline-none uppercase text-lg" onKeyDown={e => e.key === 'Enter' && (() => { if(newTabName.trim()){ const newId = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } })()} />
              <div className="flex gap-2">
                <button onClick={() => { if(newTabName.trim()){ const newId = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } }} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs">Abrir</button>
                <button onClick={() => setIsAddingTab(false)} className="px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-black uppercase text-xs">Sair</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {openTabs.map(tab => (
              <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="p-6 h-48 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 border-b-8 hover:translate-y-[-4px] shadow-sm cursor-pointer transition-all flex flex-col justify-between group relative">
                <button onClick={(e) => { e.stopPropagation(); if(tab.items.length === 0) onUpdateTabs(p => p.filter(t => t.id !== tab.id)); else setDeleteConfirmId({id: tab.id, name: tab.name, hasItems: true}); }} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate">{tab.name}</h3>
                  <span className="text-[9px] text-emerald-600 font-black uppercase">{tab.items.length} ITENS</span>
                </div>
                <p className="font-black text-2xl text-red-600">{formatCurrency(tab.items.reduce((acc, i) => acc + i.totalPrice, 0))}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 pb-40 overflow-y-auto no-scrollbar h-full relative">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4 sticky top-0 z-20">
              <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if (onClearShortcut) onClearShortcut(); }} className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 hover:bg-red-500 hover:text-white transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <input type="text" placeholder="BUSCAR PRODUTO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] outline-none" disabled={!!shortcutCheckout} />
            </div>

            <div className="space-y-10">
              {favorites.length > 0 && !shortcutCheckout && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] pl-2">⭐ FAVORITOS</h3>
                    <div className="flex-1 h-px bg-amber-100 dark:bg-amber-900/20"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {favorites.map(p => (
                      <button key={p.id} onClick={() => handleProductClick(p)} className="p-4 bg-white dark:bg-slate-900 rounded-[24px] border-amber-200 dark:border-amber-900/30 border-2 shadow-sm hover:border-amber-500 text-center flex flex-col items-center justify-center h-28 active:scale-95 transition-all">
                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase leading-none line-clamp-2 mb-1">{p.name}</p>
                        <p className="text-2xl font-black text-amber-600">{p.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {categories.map(cat => (
                <div key={cat} className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] pl-2 text-slate-400">{cat}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {filteredProducts.filter(p => p.category === cat).map(p => (
                      <button key={p.id} onClick={() => handleProductClick(p)} className="p-4 bg-white dark:bg-slate-900 rounded-[24px] border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 text-center flex flex-col items-center justify-center h-28 active:scale-95 transition-all">
                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase leading-none line-clamp-2 mb-1">{p.name}</p>
                        <p className="text-2xl font-black text-red-600">{p.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-full lg:w-96 flex flex-col h-[75vh] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24 mt-6 lg:mt-0 z-10">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] overflow-hidden flex flex-col h-full shadow-2xl relative">
              <div className="p-5 bg-red-600 text-white shrink-0 flex justify-between items-center shadow-lg">
                <h3 className="font-black uppercase truncate text-xs">{activeTab?.name}</h3>
              </div>
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {tabItems.map((item) => (
                      <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                           <div className="flex-1 min-w-0">
                             <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate">{item.productName}</p>
                             <p className="text-[10px] font-black text-red-600 mt-1">{formatCurrency(item.totalPrice)}</p>
                           </div>
                           <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                               <button onClick={() => updateItemQty(item.id, -1)} className="w-8 h-8 text-slate-400 font-black">-</button>
                               <span className="text-[11px] font-black min-w-[40px] text-center">{item.quantity}x</span>
                               <button onClick={() => updateItemQty(item.id, 1)} className="w-8 h-8 text-slate-400 font-black">+</button>
                               <button onClick={() => removeFromTab(item.id)} className="w-8 h-8 text-slate-300 ml-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                           </div>
                        </div>
                      </div>
                    ))}
                    {tabItems.length === 0 && <div className="flex flex-col items-center justify-center py-24 opacity-30 italic text-[10px] text-center uppercase font-black">Mesa Vazia</div>}
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 mt-auto pb-8">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(tabTotal)}</span>
                    </div>
                    {(tabItems.length > 0 || shortcutCheckout) && <button onClick={() => setIsClosingTab(true)} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Receber</button>}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col">
                   <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
                      <button onClick={() => { setIsClosingTab(false); setCurrentPayments([]); }} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 hover:text-red-500">← Voltar</button>
                      <div className="p-6 bg-slate-100 dark:bg-slate-950 rounded-3xl border text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">A Pagar</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(remainingBalance)}</p>
                      </div>
                      <div className="space-y-4">
                        <select value={paymentMethodInput} onChange={e => setPaymentMethodInput(e.target.value as any)} className="w-full p-4 border font-black text-xs uppercase bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border-slate-200">
                          {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="flex gap-2">
                           <div className="relative flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                              <input type="text" inputMode="decimal" value={paymentAmountInput} onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))} className="w-full pl-12 pr-4 py-4 border font-black text-xl bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none" placeholder={remainingBalance.toFixed(2).replace('.', ',')} />
                           </div>
                           <button onClick={() => {
                              const val = parseCurrencyValue(paymentAmountInput) || remainingBalance;
                              if (val <= 0) return;
                              if ((paymentMethodInput === PaymentMethod.PENDURA || shortcutCheckout) && !customerNameInput.trim()) { setValidationError("NOME DO CLIENTE OBRIGATÓRIO!"); return; }
                              setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val, customerName: customerNameInput.toUpperCase() || undefined }]);
                              setPaymentAmountInput('');
                           }} className="px-6 bg-black text-white rounded-2xl font-black text-xl">+</button>
                        </div>
                        {((paymentMethodInput === PaymentMethod.PENDURA) || shortcutCheckout) && <input type="text" value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)} placeholder="NOME DO CLIENTE..." className="w-full p-4 border font-black text-xs uppercase bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none shadow-inner" />}
                      </div>
                      {currentPayments.map((p, idx) => <div key={idx} className="flex justify-between bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100"><span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400">{p.method} {p.customerName ? `(${p.customerName})` : ''}</span><span className="text-xs font-black text-emerald-600">{formatCurrency(p.amount)}</span></div>)}
                   </div>
                   <div className="p-6 border-t bg-white dark:bg-slate-900 mt-auto pb-8">
                      <button onClick={handleFinishSale} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">Concluir Venda</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL PESO */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm p-10 bg-white dark:bg-slate-900 rounded-[40px] text-center shadow-2xl animate-in zoom-in-95">
            <h4 className="text-xl font-black uppercase mb-6 italic text-slate-800 dark:text-white">Peso (Gramas)</h4>
            <input autoFocus type="number" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className="w-full text-5xl font-black p-8 text-center bg-slate-50 dark:bg-slate-950 border-4 border-red-500 rounded-3xl outline-none" placeholder="0" />
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={() => { const g = parseFloat(inputGrams); if(g > 0) addToTab(weightModalProduct, g/1000); }} className="py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs">Lançar</button>
              <button onClick={() => {setWeightModalProduct(null); setEditingItemUid(null);}} className="py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Sair</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICADORES */}
      {modifierModalData && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
              <div className="text-center mb-8"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{modifierModalData.group.name}</span><h4 className="text-2xl font-black uppercase italic text-slate-800 dark:text-white">{modifierModalData.product.name}</h4></div>
              <div className="grid grid-cols-1 gap-3 mb-8 max-h-[40vh] overflow-y-auto no-scrollbar">
                 <button onClick={() => addToTab(modifierModalData.product, 1)} className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:border-red-500 text-left transition-all">
                    <p className="font-black uppercase text-xs text-slate-800 dark:text-white">Padrão / Sem Adicionais</p>
                    <p className="text-red-600 font-black text-lg">{formatCurrency(modifierModalData.product.price)}</p>
                 </button>
                 {modifierModalData.group.options.map((opt, i) => (
                   <button key={i} onClick={() => addToTab(modifierModalData.product, 1, opt)} className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:border-red-500 text-left transition-all group">
                      <div className="flex justify-between items-center"><p className="font-black uppercase text-xs text-slate-800 dark:text-white group-hover:text-red-500">{opt.name}</p><p className="font-black text-lg text-emerald-500">+{formatCurrency(opt.price)}</p></div>
                      <p className="text-[10px] font-bold text-slate-400">Total: {formatCurrency(modifierModalData.product.price + opt.price)}</p>
                   </button>
                 ))}
              </div>
              <button onClick={() => setModifierModalData(null)} className="w-full py-5 rounded-2xl bg-slate-100 dark:bg-slate-800 font-black uppercase text-xs tracking-widest text-slate-500">Cancelar</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default POS;
