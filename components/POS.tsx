
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
  const [inputGrams, setInputGrams] = useState('');
  
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedMenuCats, setCollapsedMenuCats] = useState<Set<string>>(new Set());
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string} | null>(null);
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
    setIsClosingTab(false); setValidationError(null); setCustomerNameInput('');
  }, [activeTabId]);

  useEffect(() => {
    if (shortcutCheckout) {
      setActiveTabId('shortcut-payment'); setIsClosingTab(true); setCurrentPayments([]);
      setCustomerNameInput(shortcutCheckout.name); setPaymentAmountInput(shortcutCheckout.amount.toString().replace('.', ','));
      setPaymentMethodInput(PaymentMethod.CASH);
    }
  }, [shortcutCheckout]);

  const normalizeId = (id: any) => id ? String(id).trim() : '';

  const activeTab = useMemo<any>(() => {
    if (shortcutCheckout) return { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() };
    return openTabs.find(t => normalizeId(t.id) === normalizeId(activeTabId));
  }, [activeTabId, openTabs, shortcutCheckout]);
    
  const tabItems: SaleItem[] = activeTab?.items ?? [];
  const tabTotal = shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, tabTotal - paidSoFar);

  const groupedTabItems = useMemo(() => {
    const groups: Record<string, SaleItem[]> = {};
    tabItems.forEach(item => {
      const cat = item.category || 'GERAL';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [tabItems]);

  const handleQuickDelete = (id: string, name: string, items: any[]) => {
    if (items.length === 0) {
      onUpdateTabs(prev => prev.filter(t => t.id !== id));
      showFeedback(`MESA ${name} REMOVIDA`);
    } else {
      setDeleteConfirmId({ id, name });
    }
  };

  const toggleCategoryCollapse = (cat: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(cat)) newCollapsed.delete(cat);
    else newCollapsed.add(cat);
    setCollapsedCategories(newCollapsed);
  };

  const toggleMenuCategoryCollapse = (cat: string) => {
    const newCollapsed = new Set(collapsedMenuCats);
    if (newCollapsed.has(cat)) newCollapsed.delete(cat);
    else newCollapsed.add(cat);
    setCollapsedMenuCats(newCollapsed);
  };

  const handleProductClick = (product: Product, quantity: number = 1) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') { setValidationError("SELECIONE UMA MESA!"); return; }
    if (product.sellType === 'weight') { 
      setWeightModalProduct(product); 
      return; 
    }
    const effectiveModGroupId = product.modifierGroupId || categoryModifiers?.[product.category.toUpperCase().trim()];
    const modGroup = modifierGroups.find(g => g.id === effectiveModGroupId);
    if (modGroup) { setModifierModalData({ product, group: modGroup }); return; }
    addToTab(product, quantity);
  };

  const addToTab = (product: Product, quantity: number = 1, modifier?: ModifierOption) => {
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        const unitPrice = product.price + (modifier?.price || 0);
        const totalPrice = Number((quantity * unitPrice).toFixed(2));
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
            quantity, unitPrice, totalPrice, modifier
          });
          showFeedback(`${product.name} ADICIONADO`);
        }
        return { ...tab, items };
      }
      return tab;
    }));
    setWeightModalProduct(null); setModifierModalData(null); setInputGrams('');
  };

  const updateItemQty = (itemUid: string, delta: number) => {
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = tab.items.map(item => {
          if (item.id === itemUid) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty, totalPrice: Number((newQty * item.unitPrice).toFixed(2)) };
          }
          return item;
        }).filter(item => item.quantity > 0);
        return { ...tab, items };
      }
      return tab;
    }));
  };

  const changeDue = useMemo(() => {
    if (paymentMethodInput !== PaymentMethod.CASH || !receivedValueInput) return 0;
    const amountToPay = parseCurrencyValue(paymentAmountInput) || remainingBalance;
    return Math.max(0, receivedValueInput - amountToPay);
  }, [receivedValueInput, paymentAmountInput, remainingBalance, paymentMethodInput]);

  const handleFinishSale = () => {
    const isShortcut = activeTabId === 'shortcut-payment';
    let finalPayments = [...currentPayments];

    if (paymentMethodInput === PaymentMethod.CASH && receivedValueInput && receivedValueInput > 0 && finalPayments.length === 0) {
       finalPayments.push({ method: PaymentMethod.CASH, amount: remainingBalance, customerName: customerNameInput.toUpperCase() || undefined });
    }

    const currentTotalPaid = finalPayments.reduce((acc, p) => acc + p.amount, 0);

    if (!activeTab || (!isShortcut && tabItems.length === 0) || (currentTotalPaid < 0.01)) {
       setValidationError("ADICIONE PAGAMENTO PARA CONCLUIR!");
       return;
    }

    if (!isShortcut && (tabTotal - currentTotalPaid) > 0.05) {
       setValidationError(`FALTAM ${formatCurrency(tabTotal - currentTotalPaid)}!`);
       return;
    }

    finalPayments.forEach((p, index) => {
       onCompleteSale({
          id: generateUniqueId('sale'), timestamp: Date.now(), openedAt: activeTab.openedAt,
          items: isShortcut ? [{ id: generateUniqueId('it'), productId: 'quitacao', productName: 'Quitação Fiado', category: 'FIADO', quantity: 1, unitPrice: p.amount, totalPrice: p.amount }] : (index === 0 ? tabItems : []),
          paymentMethod: p.method, total: p.amount, tabName: activeTab.name, customerName: p.customerName || (isShortcut ? shortcutCheckout?.name : undefined),
          userId: '', shiftId: activeShift?.id || ''
       });
    });

    if (!isShortcut) onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
    else if (onClearShortcut) onClearShortcut();

    setActiveTabId(null); setIsClosingTab(false); setCurrentPayments([]); setReceivedValueInput(null); showFeedback("VENDA FINALIZADA");
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const favorites = products.filter(p => p.isFavorite && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const menuCategories = useMemo(() => Array.from(new Set(filteredProducts.map(p => p.category.toUpperCase().trim()))).sort(), [filteredProducts]);

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 animate-in fade-in duration-700">
        <div className="relative group">
          <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full"></div>
          <div className="relative w-40 h-40 bg-red-500/10 rounded-[48px] flex items-center justify-center border border-red-500/20 shadow-2xl">
             <svg className="w-16 h-16 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
        </div>
        <div className="max-w-xs space-y-4">
           <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Caixa Fechado</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Abra o turno para liberar o PDV.</p>
        </div>
        <button onClick={() => onViewChange && onViewChange('shifts')} className="bg-red-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Abrir Turno Agora</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top-4">{toast}</div>}
      {validationError && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4" onClick={() => setValidationError(null)}>{validationError}</div>}

      {/* MODAL DE EXCLUSÃO DE MESA - RESTORED */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-2">Excluir Mesa?</h3>
              <p className="text-sm text-slate-400 font-bold mb-10">A mesa "{deleteConfirmId.name}" possui itens lançados. Deseja realmente apagar tudo?</p>
              <div className="flex flex-col gap-3">
                 <button onClick={() => { onUpdateTabs(prev => prev.filter(t => t.id !== deleteConfirmId.id)); setActiveTabId(null); setDeleteConfirmId(null); showFeedback("MESA EXCLUÍDA"); }} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs">Sim, Apagar Tudo</button>
                 <button onClick={() => setDeleteConfirmId(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs">Cancelar</button>
              </div>
           </div>
        </div>
      )}

      {!activeTabId ? (
        <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
            <div><h2 className="text-xl font-black uppercase italic">Comandas Ativas</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{openTabs.length} mesas monitoradas</p></div>
            {!isAddingTab && <button onClick={() => setIsAddingTab(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Abrir Mesa</button>}
          </div>
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="NOME OU MESA..." className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-lg tracking-widest outline-none" onKeyDown={e => e.key === 'Enter' && (() => { if(newTabName.trim()){ const nid = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(nid); setNewTabName(''); setIsAddingTab(false); } })()} />
              <button onClick={() => { if(newTabName.trim()){ const nid = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(nid); setNewTabName(''); setIsAddingTab(false); } }} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs">Criar</button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {openTabs.map(tab => (
              <div key={tab.id} className="relative group">
                <button onClick={() => handleQuickDelete(tab.id, tab.name, tab.items)} className="absolute top-2 right-2 z-10 p-3 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-2xl transition-all lg:opacity-0 group-hover:opacity-100">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div onClick={() => setActiveTabId(tab.id)} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-xl transition-all h-40 flex flex-col justify-between">
                  <div><h3 className="text-sm font-black uppercase truncate">{tab.name}</h3><span className="text-[9px] text-slate-400 uppercase">{(tab.items || []).length} ITENS</span></div>
                  <p className="text-red-600 font-black text-2xl tracking-tighter">{formatCurrency((tab.items || []).reduce((acc: number, i: any) => acc + i.totalPrice, 0))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-300">
           <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 sticky top-0 z-20">
                <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if(onClearShortcut) onClearShortcut(); }} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                <input type="text" placeholder="LOCALIZAR ITEM NO CARDÁPIO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] outline-none" />
              </div>

              {favorites.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest pl-2">⭐ FAVORITOS</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                    {favorites.map(p => (
                      <button key={p.id} onClick={() => handleProductClick(p)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-amber-500/30 hover:border-amber-500 shadow-sm transition-all h-24 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1">{p.name}</p>
                        <p className="text-xl font-black text-amber-600">{p.price.toFixed(2).replace('.', ',')}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-10">
                {menuCategories.map(cat => {
                  const isCollapsed = collapsedMenuCats.has(cat);
                  return (
                    <div key={cat} className="space-y-4">
                      <div onClick={() => toggleMenuCategoryCollapse(cat)} className="flex items-center gap-4 cursor-pointer hover:opacity-70 transition-all">
                         <div className="flex items-center gap-2">
                           <svg className={`w-4 h-4 text-red-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">{cat}</h3>
                         </div>
                         <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>
                      </div>
                      {!isCollapsed && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 animate-in fade-in slide-in-from-top-1">
                          {filteredProducts.filter(p => p.category.toUpperCase().trim() === cat).map(p => (
                            <button key={p.id} onClick={() => handleProductClick(p)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 hover:border-red-500 shadow-sm transition-all h-24 flex flex-col items-center justify-center text-center">
                              <p className="text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1">{p.name}</p>
                              <p className="text-xl font-black text-red-600">{p.price.toFixed(2).replace('.', ',')}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
           </div>

           {/* CONTAINER LATERAL DA MESA - BLINDAGEM DE ALTURA */}
           <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden h-[85vh] lg:h-[calc(100vh-140px)] sticky top-24">
              <div className="p-5 bg-red-600 text-white font-black uppercase text-xs flex justify-between items-center shrink-0 shadow-lg">
                <span>{activeTab?.name}</span>
                <button onClick={() => handleQuickDelete(activeTabId!, activeTab?.name || 'Mesa', tabItems)} className="text-white/50 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg></button>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                    {Object.keys(groupedTabItems).length > 0 ? (
                      (Object.entries(groupedTabItems) as [string, SaleItem[]][]).map(([category, items]) => {
                        const isCollapsed = collapsedCategories.has(category);
                        const categoryTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
                        return (
                          <div key={category} className="space-y-2">
                            <div onClick={() => toggleCategoryCollapse(category)} className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                              <div className="flex items-center gap-2">
                                 <svg className={`w-3 h-3 text-red-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{category}</span>
                              </div>
                              <span className="text-[10px] font-black text-slate-400">{formatCurrency(categoryTotal)}</span>
                            </div>
                            {!isCollapsed && (
                              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                {items.map((item) => (
                                  <div key={item.id} className="bg-white dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3 shadow-sm">
                                    <div className="flex justify-between items-start">
                                      <p className="text-[11px] font-black uppercase leading-tight flex-1 mr-2">{item.productName}</p>
                                      <p className="text-xs font-black text-red-600">{formatCurrency(item.totalPrice)}</p>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
                                       <div className="flex items-center gap-1">
                                          <button onClick={() => updateItemQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 font-black">-</button>
                                          <span className="text-[10px] font-black w-10 text-center">{item.quantity}{item.productName.toLowerCase().includes(' kg') ? 'kg' : 'x'}</span>
                                          <button onClick={() => updateItemQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 font-black">+</button>
                                       </div>
                                       <button onClick={() => updateItemQty(item.id, -item.quantity)} className="text-red-500 p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 opacity-20 italic text-[10px] uppercase font-black text-center">Nenhum item lançado</div>
                    )}
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-auto">
                    <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase text-slate-400">Total Comanda</span><span className="text-2xl font-black">{formatCurrency(tabTotal)}</span></div>
                    <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Fechar Conta</button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 animate-in slide-in-from-right-4 duration-300 overflow-hidden">
                   <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                      <button onClick={() => { setIsClosingTab(false); setCurrentPayments([]); setReceivedValueInput(null); }} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 hover:text-red-500 transition-colors">← Voltar à comanda</button>
                      <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">A pagar</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(remainingBalance)}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Forma de Pagamento</label>
                          <select value={paymentMethodInput} onChange={e => { setPaymentMethodInput(e.target.value as any); setReceivedValueInput(null); }} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase outline-none border border-slate-200 dark:border-slate-700">
                            {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>

                        {paymentMethodInput === PaymentMethod.CASH && (
                          <div className="space-y-4 animate-in zoom-in-95">
                             <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setReceivedValueInput(remainingBalance)} className="col-span-3 py-4 rounded-2xl font-black text-xs uppercase bg-emerald-600 text-white shadow-lg border border-emerald-500">VALOR EXATO</button>
                                {[5, 10, 20, 50, 100, 200].map(val => (
                                  <button key={val} onClick={() => setReceivedValueInput(val)} className={`py-3 rounded-xl font-black text-xs border transition-all ${receivedValueInput === val ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>R$ {val}</button>
                                ))}
                             </div>
                          </div>
                        )}

                        {paymentMethodInput === PaymentMethod.PENDURA && (
                          <div className="space-y-1 animate-in slide-in-from-right-4">
                            <label className="text-[9px] font-black text-orange-600 uppercase ml-2">Identificar Fiado (Obrigatório)</label>
                            <input type="text" value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase border-2 border-orange-500 outline-none" placeholder="NOME DO CLIENTE..." />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Adicionar Pagamento</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                               <input type="text" inputMode="decimal" value={paymentAmountInput} onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xl outline-none" placeholder={remainingBalance.toFixed(2).replace('.', ',')} />
                            </div>
                            <button onClick={() => {
                               const val = parseCurrencyValue(paymentAmountInput) || remainingBalance;
                               if (val <= 0) return;
                               if (paymentMethodInput === PaymentMethod.PENDURA && !customerNameInput.trim()) { setValidationError("NOME OBRIGATÓRIO PARA PENDURA!"); return; }
                               setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val, customerName: customerNameInput.toUpperCase() || undefined }]);
                               setPaymentAmountInput(''); setReceivedValueInput(null);
                               if (paymentMethodInput !== PaymentMethod.PENDURA) setCustomerNameInput('');
                               showFeedback("PAGAMENTO LANÇADO");
                            }} className="bg-black text-white px-6 rounded-2xl font-black active:scale-95 shadow-lg text-xl">+</button>
                          </div>
                        </div>

                        {currentPayments.length > 0 && (
                          <div className="space-y-2 pt-2 animate-in fade-in">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Registrados</p>
                             {currentPayments.map((p, idx) => (
                               <div key={idx} className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100">
                                  <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400">{p.method} {p.customerName ? `(${p.customerName})` : ''}</span>
                                  <span className="text-xs font-black text-emerald-600">{formatCurrency(p.amount)}</span>
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                   </div>

                   {/* RODAPÉ DE FECHAMENTO - FIXO E BLINDADO CONTRA CORTES */}
                   <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] pb-12">
                      {paymentMethodInput === PaymentMethod.CASH && receivedValueInput && receivedValueInput > 0 && (
                        <div className="bg-emerald-600 text-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-xl animate-in zoom-in-95 border-4 border-emerald-500">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Troco:</span>
                            <span className="text-4xl font-black tracking-tighter">{formatCurrency(changeDue)}</span>
                        </div>
                      )}
                      <button onClick={handleFinishSale} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1">
                        <span>CONCLUIR RECEBIMENTO</span>
                        <span className="text-[10px] opacity-70">Total: {formatCurrency(tabTotal)}</span>
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* MODAL DE PESO (BALANÇA) - BLINDADO */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 italic tracking-tighter">Lançar Peso (Gramas)</h4>
            <div className="relative">
               <input autoFocus type="number" inputMode="numeric" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className="w-full text-5xl font-black p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-4 border-red-500 outline-none shadow-inner" placeholder="0" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest text-center">Ex: 500 = 0.5kg | 1000 = 1.0kg</p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => { const g = parseFloat(inputGrams); if(g > 0) addToTab(weightModalProduct, g/1000); }} className="bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Lançar</button>
              <button onClick={() => { setWeightModalProduct(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs">Sair</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE MODIFICADORES */}
      {modifierModalData && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
              <h4 className="text-xl font-black uppercase mb-8 text-center italic text-slate-800 dark:text-white">{modifierModalData.group.name}</h4>
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                 {modifierModalData.group.options.map((opt, i) => (
                    <button key={i} onClick={() => addToTab(modifierModalData.product, 1, opt)} className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
                       <span className="font-black uppercase text-sm group-hover:text-red-500">{opt.name}</span>
                       <span className="font-black text-emerald-500">+{formatCurrency(opt.price)}</span>
                    </button>
                 ))}
              </div>
              <div className="pt-8 flex flex-col gap-2">
                 <button onClick={() => addToTab(modifierModalData.product, 1)} className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px]">Sem Opcional</button>
                 <button onClick={() => setModifierModalData(null)} className="w-full py-5 rounded-2xl bg-slate-100 text-slate-500 font-black uppercase text-[10px]">Fechar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default POS;
