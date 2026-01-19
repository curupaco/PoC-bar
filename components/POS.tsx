
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency, generateUniqueId, sanitizeCurrencyInput, parseCurrencyValue, Theme } from '../types';

interface POSProps {
  products: Product[];
  modifierGroups?: any[];
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

  const handleProductClick = (product: Product, quantity: number = 1) => {
    if (!activeShift) { setValidationError("ABRA O TURNO PARA VENDER!"); return; }
    if (!activeTabId || activeTabId === 'shortcut-payment') { setValidationError("SELECIONE UMA MESA!"); return; }
    if (product.sellType === 'weight') { setWeightModalProduct(product); return; }
    addToTab(product, quantity);
  };

  const addToTab = (product: Product, quantity: number = 1) => {
    if (!activeShift) { setValidationError("ABRA O TURNO PARA VENDER!"); return; }
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        
        if (editingItemUid) {
          const idx = items.findIndex(it => it.id === editingItemUid);
          if (idx > -1) {
            items[idx] = { ...items[idx], quantity, totalPrice: Number((quantity * items[idx].unitPrice).toFixed(2)) };
            showFeedback(`${product.name} ATUALIZADO`);
          }
        } else {
          const existingIndex = items.findIndex(i => i.productId === product.id && !i.modifier);
          if (existingIndex > -1 && product.sellType === 'unit') {
            const newQty = items[existingIndex].quantity + quantity;
            items[existingIndex] = { ...items[existingIndex], quantity: newQty, totalPrice: Number((newQty * product.price).toFixed(2)) };
            showFeedback(`+1 ${product.name}`);
          } else {
            items.push({ 
              id: generateUniqueId('it'),
              productId: product.id, 
              productName: product.name, 
              category: product.category?.toUpperCase().trim() || 'GERAL',
              quantity, 
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
    setEditingItemUid(null); setWeightModalProduct(null); setInputGrams('');
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
        if (newQty <= 0) {
           items.splice(idx, 1);
        } else {
           items[idx] = { ...item, quantity: newQty, totalPrice: Number((newQty * item.unitPrice).toFixed(2)) };
        }
        return { ...tab, items };
      }
      return tab;
    }));
  };

  const handleQuickDelete = (tabId: string, name: string, items: any[]) => {
    const itemsCount = (items || []).length;
    if (itemsCount === 0) {
      onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(tabId)));
      if (normalizeId(activeTabId) === normalizeId(tabId)) setActiveTabId(null);
      showFeedback(`MESA ${name} REMOVIDA`);
    } else {
      setDeleteConfirmId({ id: tabId, name, hasItems: true });
    }
  };

  const handleFinishSale = () => {
    if (!activeShift) { setValidationError("ABRA O TURNO PARA RECEBER PAGAMENTOS!"); return; }
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
    
    setActiveTabId(null); setIsClosingTab(false); setCurrentPayments([]); setReceivedValueInput(null);
    showFeedback("VENDA FINALIZADA");
  };

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = Array.from(new Set(filteredProducts.map(p => p.category))).sort();

  return (
    <div className={`flex flex-col lg:flex-row gap-6 relative h-full`}>
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 uppercase text-[10px] bg-slate-900 text-white tracking-widest`}>
          {toast}
        </div>
      )}
      
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)} />
          <div className={`w-full max-w-sm p-8 shadow-2xl relative z-[410] animate-in zoom-in-95 bg-white dark:bg-slate-900 rounded-[32px] border-slate-200 dark:border-slate-800 border`}>
             <h3 className={`text-xl font-black uppercase text-center mb-2 tracking-tighter text-slate-800 dark:text-white`}>Excluir Mesa?</h3>
             <p className={`text-sm text-center mb-8 text-slate-500`}>Apagar o consumo de "<span className="font-bold">{deleteConfirmId.name}</span>"?</p>
             <div className="flex flex-col gap-3">
                <button onClick={() => { onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(deleteConfirmId.id))); setActiveTabId(null); setDeleteConfirmId(null); }} className={`w-full py-4 font-black uppercase text-xs tracking-widest bg-red-600 text-white rounded-xl`}>Sim, Excluir</button>
                <button onClick={() => setDeleteConfirmId(null)} className={`w-full py-4 font-black uppercase text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl`}>Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {!activeTabId ? (
        <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
          <div className={`p-6 border shadow-sm flex justify-between items-center bg-white dark:bg-slate-900 rounded-[32px] border-slate-200 dark:border-slate-800`}>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Monitor de Mesas</h2>
              {!activeShift && <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Caixa Fechado</p>}
            </div>
            {!isAddingTab && (
              <button 
                onClick={() => activeShift ? setIsAddingTab(true) : setValidationError("ABRA O TURNO!")} 
                className={`px-8 py-3 font-black uppercase text-xs tracking-widest active:scale-95 transition-all bg-red-600 text-white rounded-2xl shadow-lg`}
              >
                Nova Mesa
              </button>
            )}
          </div>

          {isAddingTab && (
            <div className={`p-8 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95 bg-white dark:bg-slate-900 border-red-500 border-4 rounded-[32px]`}>
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="IDENTIFICAÇÃO..." className={`flex-1 px-6 py-4 outline-none uppercase text-lg bg-slate-50 dark:bg-slate-950 font-black rounded-2xl`} onKeyDown={e => e.key === 'Enter' && (() => { if(newTabName.trim()){ const newId = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } })()} />
              <div className="flex gap-2">
                <button onClick={() => { if(newTabName.trim()){ const newId = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } }} className={`px-10 py-4 font-black uppercase text-xs tracking-widest bg-red-600 text-white rounded-2xl`}>Abrir</button>
                <button onClick={() => setIsAddingTab(false)} className={`font-black px-6 rounded-2xl uppercase text-xs bg-slate-100 dark:bg-slate-800 text-slate-400`}>Sair</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {(openTabs || []).map(tab => (
              <div key={tab.id} className="group relative">
                <button type="button" onClick={(e) => { e.stopPropagation(); handleQuickDelete(tab.id, tab.name, tab.items); }} className={`absolute -top-2 -right-2 p-3 z-30 border rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-800 border-slate-200`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div onClick={() => setActiveTabId(tab.id)} className={`p-6 h-48 flex flex-col justify-between cursor-pointer transition-all active:scale-95 bg-white dark:bg-slate-900 rounded-[32px] border-slate-200 dark:border-slate-800 border border-b-8 hover:translate-y-[-4px]`}>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{tab.name}</h3>
                    <span className={`text-[9px] font-black uppercase text-slate-400`}>{(tab.items ?? []).length} ITENS</span>
                  </div>
                  <p className={`font-black text-2xl tracking-tighter text-red-600`}>{formatCurrency((tab.items ?? []).reduce((acc, i) => acc + (i.totalPrice ?? 0), 0))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 pb-40 overflow-y-auto no-scrollbar h-full relative">
            <div className={`p-4 shadow-sm flex items-center gap-4 sticky top-0 z-20 bg-white dark:bg-slate-900 rounded-[28px] border-slate-200 dark:border-slate-800 border`}>
              <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if (onClearShortcut) onClearShortcut(); }} className={`p-3.5 transition-all bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500`}>
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="BUSCAR NO CARDÁPIO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-12 pr-4 py-4 outline-none uppercase text-[10px] tracking-widest bg-slate-50 dark:bg-slate-950 font-black rounded-2xl`} disabled={!!shortcutCheckout} />
              </div>
            </div>

            <div className="space-y-10">
              {categories.map(cat => (
                <div key={cat} className="space-y-4">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] pl-2 text-slate-400`}>{cat}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {filteredProducts.filter(p => p.category === cat).map(p => (
                      <button key={p.id} onClick={() => handleProductClick(p)} className={`p-2 active:scale-95 transition-all text-center flex flex-col items-center justify-center h-28 bg-white dark:bg-slate-900 rounded-[24px] border-slate-200 dark:border-slate-800 shadow-sm`}>
                        <p className={`text-[10px] font-black uppercase leading-[1.1] line-clamp-2 px-1 mb-1 text-slate-800 dark:text-slate-100`}>{p.name}</p>
                        <p className={`text-2xl font-black leading-none text-red-600`}>{p.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-full lg:w-96 flex flex-col h-[75vh] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24 mt-6 lg:mt-0 pb-32 lg:pb-0 z-10">
            <div className={`overflow-hidden flex flex-col h-full shadow-2xl relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px]`}>
              <div className={`p-5 text-white shrink-0 flex justify-between items-center bg-red-600`}>
                <h3 className="font-black uppercase truncate text-xs">{activeTab?.name}</h3>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {tabItems.map((item) => (
                      <div key={item.id} className={`p-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-slate-800/50`}>
                        <div className="flex items-center justify-between gap-2">
                           <div className="flex-1 min-w-0">
                             <p className="text-[11px] font-black uppercase truncate leading-tight">{item.productName}</p>
                             <p className="text-[10px] font-black text-red-600 mt-1">{formatCurrency(item.totalPrice)}</p>
                           </div>
                           <div className={`flex items-center gap-2 p-1.5 border shadow-sm bg-white dark:bg-slate-950 rounded-2xl border-slate-200 dark:border-slate-800`}>
                               <button onClick={() => updateItemQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500">-</button>
                               <span className="text-[11px] font-black min-w-[40px] text-center text-slate-900 dark:text-slate-100">
                                 {item.quantity}x
                               </span>
                               <button onClick={() => updateItemQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500">+</button>
                               <button onClick={() => removeFromTab(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all ml-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`p-6 mt-auto pb-8 text-center bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800`}>
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                      <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{formatCurrency(tabTotal)}</span>
                    </div>
                    {(tabItems.length > 0 || shortcutCheckout) && <button onClick={() => setIsClosingTab(true)} className={`w-full py-5 font-black uppercase text-xs tracking-widest transition-all bg-red-600 text-white rounded-2xl shadow-lg`}>Receber</button>}
                  </div>
                </>
              ) : (
                <div className={`flex-1 flex flex-col`}>
                   <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
                      <button onClick={() => { setIsClosingTab(false); setCurrentPayments([]); }} className={`text-[10px] font-black uppercase flex items-center gap-2 text-slate-400 hover:text-red-500`}>← Voltar</button>
                      <div className={`p-6 border text-center bg-slate-100 dark:bg-slate-950 border-slate-200 rounded-3xl`}>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Devedor</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(remainingBalance)}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <select value={paymentMethodInput} onChange={e => { setPaymentMethodInput(e.target.value as any); setReceivedValueInput(null); }} className={`w-full p-4 border font-black text-xs uppercase outline-none bg-slate-50 dark:bg-slate-800 rounded-2xl border-slate-200`}>
                          {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="flex gap-2">
                           <div className="relative flex-1">
                              <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400`}>R$</span>
                              <input type="text" value={paymentAmountInput} onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))} className={`w-full pl-12 pr-4 py-4 font-black text-xl border outline-none bg-slate-50 dark:bg-slate-800 rounded-2xl border-slate-200`} placeholder={remainingBalance.toFixed(2).replace('.', ',')} />
                           </div>
                           <button onClick={() => {
                              const val = parseCurrencyValue(paymentAmountInput) || remainingBalance;
                              if (val <= 0) return;
                              setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val, customerName: customerNameInput.toUpperCase() || undefined }]);
                              setPaymentAmountInput(''); setReceivedValueInput(null);
                           }} className={`px-6 font-black text-xl bg-black text-white rounded-2xl`}>+</button>
                        </div>
                      </div>
                   </div>
                   <div className={`p-6 shrink-0 mt-auto pb-8 border-t border-slate-100 dark:border-slate-800`}>
                      <button onClick={handleFinishSale} className={`w-full py-5 font-black uppercase text-xs tracking-widest bg-emerald-600 text-white rounded-2xl shadow-emerald-500/20`}>Concluir</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {weightModalProduct && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className={`w-full max-w-sm p-10 text-center shadow-2xl bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800`}>
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tighter italic">Lançar Peso (Gramas)</h4>
            <input autoFocus type="number" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className={`w-full text-5xl font-black p-8 text-center outline-none border-4 bg-slate-50 dark:bg-slate-950 border-red-500 rounded-3xl`} placeholder="0" />
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={() => { 
                const grams = parseFloat(inputGrams);
                if (!inputGrams || isNaN(grams) || grams <= 0) { showFeedback("PESO INVÁLIDO!"); return; }
                addToTab(weightModalProduct!, grams / 1000); 
              }} className={`py-5 font-black uppercase text-xs tracking-widest shadow-lg bg-red-600 text-white rounded-2xl`}>Lançar</button>
              <button onClick={() => setWeightModalProduct(null)} className={`py-5 font-black uppercase text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl`}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
