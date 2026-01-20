
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency, generateUniqueId, sanitizeCurrencyInput, parseCurrencyValue } from '../types';

interface POSProps {
  products: Product[];
  openTabs: Tab[];
  onUpdateTabs: (updater: (prev: Tab[]) => Tab[]) => void;
  onCompleteSale: (sale: Sale) => void;
  shortcutCheckout?: { name: string; amount: number } | null;
  onClearShortcut?: () => void;
  activeShift?: Shift;
  onViewChange?: (view: any) => void;
  theme?: string;
}

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  customerName?: string;
}

const POS: React.FC<POSProps> = ({ 
  products = [], 
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
  
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [currentPayments, setCurrentPayments] = useState<PaymentEntry[]>([]);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [receivedValueInput, setReceivedValueInput] = useState<number | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
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
    setCurrentPayments([]);
    setPaymentAmountInput('');
    setReceivedValueInput(null);
    setIsClosingTab(false);
    setValidationError(null);
  }, [activeTabId]);

  useEffect(() => {
    if (shortcutCheckout) {
      setActiveTabId('shortcut-payment');
      setIsClosingTab(true);
      setCurrentPayments([]);
      setCustomerNameInput(shortcutCheckout.name);
      setPaymentAmountInput(shortcutCheckout.amount.toString().replace('.', ','));
      setPaymentMethodInput(PaymentMethod.CASH);
    }
  }, [shortcutCheckout]);

  const normalizeId = (id: any) => id ? String(id).trim() : '';

  const activeTab = useMemo<any>(() => {
    if (shortcutCheckout) {
      return { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() };
    }
    return openTabs.find(t => normalizeId(t.id) === normalizeId(activeTabId));
  }, [activeTabId, openTabs, shortcutCheckout]);
    
  const tabItems: SaleItem[] = activeTab?.items ?? [];
  const tabTotal = shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  
  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, tabTotal - paidSoFar);

  const handleQuickDelete = (tabId: string, name: string, items: any[]) => {
    if (items.length === 0) {
      onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(tabId)));
      if (normalizeId(activeTabId) === normalizeId(tabId)) {
        setActiveTabId(null);
      }
      showFeedback(`MESA ${name} REMOVIDA`);
    } else {
      setDeleteConfirmId({ id: tabId, name, hasItems: true });
    }
  };

  const addToTab = (product: Product, quantity: number = 1) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        if (editingWeightIndex !== null) {
          items[editingWeightIndex] = { 
            ...items[editingWeightIndex], 
            quantity: quantity, 
            totalPrice: Number((quantity * items[editingWeightIndex].unitPrice).toFixed(2)) 
          };
          showFeedback(`${product.name} ATUALIZADO`);
        } else {
          const existingIndex = items.findIndex(i => i.productId === product.id);
          if (existingIndex > -1 && product.sellType === 'unit') {
            const newQty = items[existingIndex].quantity + quantity;
            items[existingIndex] = { ...items[existingIndex], quantity: newQty, totalPrice: Number((newQty * product.price).toFixed(2)) };
            showFeedback(`+1 ${product.name}`);
          } else {
            items.push({ 
              id: generateUniqueId('it'),
              productId: product.id, 
              productName: product.name, 
              category: product.category || 'GERAL',
              quantity: quantity, 
              unitPrice: product.price, 
              totalPrice: Number((quantity * product.price).toFixed(2)) 
            });
            showFeedback(`${product.name} ADICIONADO`);
          }
        }
        return { ...tab, items };
      }
      return tab;
    }));
    setEditingWeightIndex(null);
    setWeightModalProduct(null);
    setInputGrams('');
  };

  const updateItemQty = (index: number, delta: number) => {
    if (!activeTabId) return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...tab.items];
        const item = items[index];
        const prod = products.find(p => p.id === item.productId);
        
        if (prod?.sellType === 'weight' && delta === 0) {
           setWeightModalProduct(prod);
           setEditingWeightIndex(index);
           setInputGrams((item.quantity * 1000).toFixed(0));
           return tab;
        }

        const newQty = item.quantity + delta;
        if (newQty <= 0) {
           items.splice(index, 1);
           showFeedback(`${item.productName} REMOVIDO`);
        } else {
           items[index] = { ...item, quantity: newQty, totalPrice: Number((newQty * item.unitPrice).toFixed(2)) };
           showFeedback(`${item.productName}: ${newQty}x`);
        }
        return { ...tab, items };
      }
      return tab;
    }));
  };

  const handleFinishSale = () => {
    const isShortcut = activeTabId === 'shortcut-payment';
    let finalPayments = [...currentPayments];

    if (paymentMethodInput === PaymentMethod.CASH && receivedValueInput && receivedValueInput > 0 && finalPayments.length === 0) {
       finalPayments.push({ 
         method: PaymentMethod.CASH, 
         amount: remainingBalance, 
         customerName: customerNameInput.toUpperCase() || undefined 
       });
    }

    const currentTotalPaid = finalPayments.reduce((acc, p) => acc + p.amount, 0);

    if (!activeTab || (!isShortcut && tabItems.length === 0) || (currentTotalPaid < 0.01)) {
       setValidationError("ADICIONE UM PAGAMENTO PARA CONCLUIR!");
       return;
    }

    if (!isShortcut && (tabTotal - currentTotalPaid) > 0.05) {
       setValidationError(`FALTAM ${formatCurrency(tabTotal - currentTotalPaid)}!`);
       return;
    }

    finalPayments.forEach((p, index) => {
       onCompleteSale({
          id: generateUniqueId('sale'),
          timestamp: Date.now(),
          openedAt: activeTab.openedAt,
          items: isShortcut 
            ? [{ id: generateUniqueId('it'), productId: 'quitacao', productName: 'Quitação Fiado', category: 'FIADO', quantity: 1, unitPrice: p.amount, totalPrice: p.amount }] 
            : (index === 0 ? tabItems : []),
          paymentMethod: p.method,
          total: p.amount,
          tabName: activeTab.name,
          customerName: p.customerName || (isShortcut ? shortcutCheckout?.name : undefined),
          userId: '', 
          shiftId: activeShift?.id || ''
       });
    });

    if (!isShortcut) onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
    else if (onClearShortcut) onClearShortcut();
    
    setActiveTabId(null);
    setIsClosingTab(false);
    setCurrentPayments([]);
    setReceivedValueInput(null);
    showFeedback("OPERACÃO FINALIZADA");
  };

  // INÍCIO DA FIX: Define changeDue using useMemo
  const changeDue = useMemo(() => {
    if (paymentMethodInput !== PaymentMethod.CASH || !receivedValueInput) return 0;
    const amountToPay = parseCurrencyValue(paymentAmountInput) || remainingBalance;
    return Math.max(0, receivedValueInput - amountToPay);
  }, [receivedValueInput, paymentAmountInput, remainingBalance, paymentMethodInput]);
  // FIM DA FIX

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const favorites = filteredProducts.filter(p => p.isFavorite);
  const categories = Array.from(new Set(filteredProducts.map(p => p.category))).sort();

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 animate-in fade-in duration-700">
        <div className="w-40 h-40 bg-red-500/10 rounded-[48px] flex items-center justify-center border border-red-500/20 shadow-2xl relative">
          <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full"></div>
          <svg className="w-16 h-16 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
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

      {!activeTabId ? (
        <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
            <div><h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Mesas Abertas</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{openTabs.length} contas ativas</p></div>
            {!isAddingTab && <button onClick={() => setIsAddingTab(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Abrir Mesa</button>}
          </div>
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="NOME OU NÚMERO..." className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-lg tracking-widest outline-none border-none shadow-inner" onKeyDown={e => e.key === 'Enter' && (() => { if(newTabName.trim()){ const nid = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(nid); setNewTabName(''); setIsAddingTab(false); } })()} />
              <button onClick={() => { if(newTabName.trim()){ const nid = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(nid); setNewTabName(''); setIsAddingTab(false); } }} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Criar</button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {openTabs.map(tab => (
              <div key={tab.id} className="relative group bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-xl transition-all h-44 flex flex-col justify-between" onClick={() => setActiveTabId(tab.id)}>
                <button onClick={(e) => { e.stopPropagation(); handleQuickDelete(tab.id, tab.name, tab.items); }} className="absolute top-2 right-2 p-3 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-2xl transition-all lg:opacity-0 group-hover:opacity-100 z-10"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                <div><h3 className="text-sm font-black uppercase truncate tracking-tight">{tab.name}</h3><span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">{(tab.items || []).length} ITENS</span></div>
                <p className="text-red-600 dark:text-red-400 font-black text-2xl tracking-tighter italic">{formatCurrency((tab.items || []).reduce((acc: number, i: any) => acc + i.totalPrice, 0))}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-300">
           <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 sticky top-0 z-20">
                <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if(onClearShortcut) onClearShortcut(); }} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                <input type="text" placeholder="LOCALIZAR ITEM NO CARDÁPIO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] tracking-widest outline-none border-none shadow-inner" />
              </div>

              <div className="space-y-10">
                {favorites.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] pl-2">⭐ FAVORITOS</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                      {favorites.map(p => (
                        <button key={p.id} onClick={() => addToTab(p)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-amber-500/30 hover:border-amber-500 shadow-sm transition-all h-24 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1">{p.name}</p>
                          <p className="text-xl font-black text-amber-600">{p.price.toFixed(2).replace('.', ',')}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {categories.map(cat => (
                  <div key={cat} className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-2">{cat}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                      {filteredProducts.filter(p => p.category === cat).map(p => (
                        <button key={p.id} onClick={() => addToTab(p)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 hover:border-red-500 shadow-sm transition-all h-24 flex flex-col items-center justify-center text-center">
                          <p className="text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1">{p.name}</p>
                          <p className="text-xl font-black text-red-600">{p.price.toFixed(2).replace('.', ',')}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {/* LATERAL DIREITA: COMANDA E PAGAMENTO (BLINDAGEM DE RODAPÉ) */}
           <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden h-[85vh] lg:h-[calc(100vh-140px)] sticky top-24">
              <div className="p-5 bg-red-600 text-white font-black uppercase text-xs flex justify-between items-center shrink-0 shadow-lg">
                <span className="truncate italic">{activeTab?.name}</span>
                <button onClick={() => handleQuickDelete(activeTabId!, activeTab?.name || 'Mesa', tabItems)} className="text-white/50 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5} /></svg></button>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {tabItems.map((item, idx) => (
                      <div key={`${item.productId}-${idx}`} className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <p className="text-[11px] font-black uppercase leading-tight flex-1 mr-2">{item.productName}</p>
                          <p className="text-xs font-black text-red-600">{formatCurrency(item.totalPrice)}</p>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                           <div className="flex items-center gap-1">
                              <button onClick={() => updateItemQty(idx, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 font-black">-</button>
                              <span className="text-[10px] font-black w-10 text-center">{item.quantity}x</span>
                              <button onClick={() => updateItemQty(idx, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 font-black">+</button>
                           </div>
                           <button onClick={() => updateItemQty(idx, -item.quantity)} className="text-red-500 p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
                        </div>
                      </div>
                    ))}
                    {tabItems.length === 0 && <div className="flex flex-col items-center justify-center py-20 opacity-20 italic text-[10px] uppercase font-black text-center">Nenhum item lançado</div>}
                  </div>
                  {/* RODAPÉ BLINDADO */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-auto pb-12">
                    <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Comanda</span><span className="text-2xl font-black italic">{formatCurrency(tabTotal)}</span></div>
                    <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">RECEBER PAGAMENTO</button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 animate-in slide-in-from-right-4 duration-300">
                   <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                      <button onClick={() => { setIsClosingTab(false); setCurrentPayments([]); setReceivedValueInput(null); }} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 hover:text-red-500">← Voltar à comanda</button>
                      <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">A pagar</p>
                        <p className="text-4xl font-black tracking-tighter">{formatCurrency(remainingBalance)}</p>
                      </div>
                      <div className="space-y-4">
                        <select value={paymentMethodInput} onChange={e => { setPaymentMethodInput(e.target.value as any); setReceivedValueInput(null); }} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase outline-none border border-slate-200 dark:border-slate-700 shadow-sm">
                          {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="flex gap-2">
                           <div className="relative flex-1">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                               <input type="text" inputMode="decimal" value={paymentAmountInput} onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xl outline-none shadow-inner" placeholder={remainingBalance.toFixed(2).replace('.', ',')} />
                           </div>
                           <button onClick={() => {
                               const val = parseCurrencyValue(paymentAmountInput) || remainingBalance;
                               if (val <= 0) return;
                               setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val, customerName: customerNameInput.toUpperCase() || undefined }]);
                               setPaymentAmountInput(''); setReceivedValueInput(null);
                               showFeedback("PAGAMENTO ADICIONADO");
                           }} className="bg-black text-white px-6 rounded-2xl font-black active:scale-95 shadow-lg text-xl">+</button>
                        </div>
                      </div>
                   </div>
                   {/* RODAPÉ BLINDADO (PAGAMENTO) */}
                   <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] mt-auto pb-12 space-y-4">
                      {paymentMethodInput === PaymentMethod.CASH && receivedValueInput && receivedValueInput > 0 && (
                        <div className="bg-emerald-600 text-white p-5 rounded-3xl flex flex-col items-center justify-center shadow-2xl animate-in zoom-in-95 border-4 border-emerald-500/50">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Troco:</span>
                            <span className="text-4xl font-black tracking-tighter">{formatCurrency(changeDue)}</span>
                        </div>
                      )}
                      <button onClick={handleFinishSale} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1">
                        <span>CONCLUIR VENDA</span>
                        <span className="text-[10px] opacity-70 italic">Total: {formatCurrency(tabTotal)}</span>
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Modal de Peso */}
      {(weightModalProduct || editingWeightIndex !== null) && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl text-center border border-slate-200 dark:border-slate-800">
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tighter italic">Lançar Peso (Gramas)</h4>
            <input autoFocus type="number" inputMode="numeric" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className="w-full text-5xl font-black p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-4 border-red-500 outline-none shadow-inner" placeholder="0" />
            <p className="text-[10px] font-black text-slate-400 uppercase mt-6 tracking-widest">Ex: 500 = 0.5kg | 1000 = 1.0kg</p>
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={() => { 
                const grams = parseFloat(inputGrams);
                if (!inputGrams || isNaN(grams) || grams <= 0) { showFeedback("PESO INVÁLIDO!"); return; }
                addToTab(weightModalProduct!, grams / 1000); 
              }} className="bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">Lançar</button>
              <button onClick={() => { setWeightModalProduct(null); setEditingWeightIndex(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
