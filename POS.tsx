
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency, generateUniqueId, sanitizeCurrencyInput, parseCurrencyValue } from './types';

interface POSProps {
  products: Product[];
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

  const activeTab = useMemo(() => {
    if (shortcutCheckout) {
      return { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() };
    }
    return openTabs.find(t => normalizeId(t.id) === normalizeId(activeTabId));
  }, [activeTabId, openTabs, shortcutCheckout]);
    
  const tabItems = activeTab?.items ?? [];
  const tabTotal = shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  
  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, tabTotal - paidSoFar);

  const handleQuickDelete = (tabId: string, name: string, items: any[]) => {
    if (items.length === 0) {
      onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(tabId)));
      if (normalizeId(activeTabId) === normalizeId(tabId)) {
        setActiveTabId(null);
      }
      showFeedback(`MESA ${name} ABANDONADA`);
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

  const removeFromTab = (index: number) => {
    if (!activeTabId) return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...tab.items];
        const removed = items.splice(index, 1);
        if (removed.length > 0) {
          showFeedback(`${removed[0].productName} REMOVIDO`);
        }
        return { ...tab, items };
      }
      return tab;
    }));
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

  const changeDue = useMemo(() => {
    if (paymentMethodInput !== PaymentMethod.CASH || !receivedValueInput) return 0;
    const amountToPay = parseCurrencyValue(paymentAmountInput) || remainingBalance;
    return Math.max(0, receivedValueInput - amountToPay);
  }, [receivedValueInput, paymentAmountInput, remainingBalance, paymentMethodInput]);

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const favorites = filteredProducts.filter(p => p.isFavorite);
  const categories = Array.from(new Set(filteredProducts.map(p => p.category))).sort();

  const formatPriceOnly = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-[32px] flex items-center justify-center text-red-600 shadow-xl border border-red-200 dark:border-red-900/30">
             <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
             </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-2 border-white dark:border-slate-900 animate-ping opacity-20"></div>
        </div>
        
        <div className="max-w-xs space-y-4">
           <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none italic">Operação Bloqueada</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm px-4">
             O caixa está fechado. Para começar a vender, você precisa <span className="text-red-600 dark:text-red-400 font-bold">abrir um novo turno</span>.
           </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[240px]">
           {onViewChange && (
             <button 
               onClick={() => onViewChange('shifts')} 
               className="bg-red-600 hover:bg-red-700 text-white w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all animate-bounce"
             >
               Abrir Turno Agora
             </button>
           )}
           <button 
             onClick={() => window.location.reload()}
             className="text-slate-400 dark:text-slate-600 font-black uppercase text-[10px] tracking-widest py-2"
           >
             Recarregar Sistema
           </button>
        </div>
      </div>
    );
  }

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
            ? [{ productId: 'quitacao', productName: 'Quitação Fiado', category: 'FIADO', quantity: 1, unitPrice: p.amount, totalPrice: p.amount }] 
            : (index === 0 ? tabItems : []),
          paymentMethod: p.method,
          total: p.amount,
          tabName: activeTab.name,
          customerName: p.customerName || (isShortcut ? shortcutCheckout?.name : undefined),
          userId: '', 
          shiftId: activeShift.id
       });
    });

    if (!isShortcut) {
      onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
    } else if (onClearShortcut) {
      onClearShortcut();
    }
    
    setActiveTabId(null);
    setIsClosingTab(false);
    setCurrentPayments([]);
    setReceivedValueInput(null);
    showFeedback("OPERACÃO FINALIZADA");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top-4">
           {toast}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl relative z-[410] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 max-sm:absolute max-sm:bottom-0">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase text-center mb-2 tracking-tighter leading-none">Excluir Mesa?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-8">
               A mesa "<span className="font-bold">{deleteConfirmId.name}</span>" possui consumo pendente. Tem certeza que deseja apagar tudo?
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={() => {
                   onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(deleteConfirmId.id)));
                   if (normalizeId(activeTabId) === normalizeId(deleteConfirmId.id)) { setActiveTabId(null); setIsClosingTab(false); }
                   setDeleteConfirmId(null);
                   showFeedback("MESA EXCLUÍDA");
                }} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Sim, Excluir</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {validationError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4" onClick={() => setValidationError(null)}>
           {validationError}
        </div>
      )}

      {!activeTabId ? (
        <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Gestão de Mesas</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{(openTabs || []).length} mesas monitoradas</p>
            </div>
            {!isAddingTab && (
              <button onClick={() => setIsAddingTab(true)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest">Abrir Mesa</button>
            )}
          </div>

          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in fade-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="NOME DA MESA OU CLIENTE..." className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-none outline-none font-black uppercase text-lg tracking-widest" onKeyDown={e => e.key === 'Enter' && (() => { if(newTabName.trim()){ const newId = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } })()} />
              <div className="flex gap-2">
                <button onClick={() => { if(newTabName.trim()){ const newId = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } }} className="flex-1 bg-red-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-red-700 uppercase text-xs tracking-widest">Criar</button>
                <button onClick={() => setIsAddingTab(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-black px-6 py-4 rounded-2xl uppercase text-xs tracking-widest">Sair</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {(openTabs || []).map(tab => (
              <div key={tab.id} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col relative h-48 group">
                <button type="button" onClick={(e) => { e.stopPropagation(); handleQuickDelete(tab.id, tab.name, tab.items); }} className="absolute top-2 right-2 p-3 z-30 text-slate-300 hover:text-red-500 transition-all opacity-100 lg:opacity-0 group-hover:opacity-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div onClick={() => setActiveTabId(tab.id)} className="p-6 cursor-pointer flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{tab.name}</h3>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{(tab.items ?? []).length} ITENS</span>
                  </div>
                  <div>
                    <p className="text-red-600 dark:text-red-400 font-black text-2xl tracking-tighter">{formatCurrency((tab.items ?? []).reduce((acc, i) => acc + (i.totalPrice ?? 0), 0))}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 pb-40 overflow-y-auto no-scrollbar h-full">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 sticky top-0 z-20">
              <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if (onClearShortcut) onClearShortcut(); }} className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="LOCALIZAR PRODUTO NO CARDÁPIO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none outline-none text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500 transition-all" disabled={!!shortcutCheckout} />
              </div>
            </div>

            {shortcutCheckout ? (
              <div className="bg-orange-50 dark:bg-orange-900/10 border-4 border-orange-200 dark:border-orange-800 rounded-[40px] p-12 text-center space-y-4 animate-in zoom-in-95">
                 <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Quitação de Pendura</h2>
                 <p className="text-slate-600 dark:text-slate-400 font-medium text-lg text-center">Cliente: <span className="text-orange-600 font-black">{shortcutCheckout.name}</span></p>
                 <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter text-center">{formatCurrency(shortcutCheckout.amount)}</div>
              </div>
            ) : (
              <div className="space-y-10">
                {favorites.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] pl-2">⭐ FAVORITOS</h3>
                      <div className="flex-1 h-px bg-amber-100 dark:bg-amber-900/20"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                      {favorites.map(p => (
                        <button key={p.id} onClick={() => p.sellType === 'weight' ? setWeightModalProduct(p) : addToTab(p, 1)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-amber-200 dark:border-amber-900/30 hover:border-amber-400 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-center flex flex-col items-center justify-center h-24 group">
                          <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase leading-[1.1] line-clamp-2 px-1 mb-0.5">{p.name}</p>
                          <p className="text-2xl font-black text-amber-600 leading-none">{formatPriceOnly(p.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {categories.map(cat => (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-2">{cat}</h3>
                      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800/30"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                      {filteredProducts.filter(p => p.category === cat).map(p => (
                        <button key={p.id} onClick={() => p.sellType === 'weight' ? setWeightModalProduct(p) : addToTab(p, 1)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-center flex flex-col items-center justify-center h-24 group">
                          <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase leading-[1.1] line-clamp-2 px-1 mb-0.5">{p.name}</p>
                          <p className="text-2xl font-black text-red-600 leading-none">{formatPriceOnly(p.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-full lg:w-96 flex flex-col h-[75vh] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24 mt-6 lg:mt-0 pb-32 lg:pb-0 z-10">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] overflow-hidden flex flex-col h-full shadow-2xl relative">
              <div className="p-5 bg-red-600 text-white shrink-0 flex justify-between items-center shadow-lg">
                <h3 className="font-black uppercase tracking-tight truncate leading-normal text-xs">{activeTab?.name}</h3>
                <button type="button" onClick={() => handleQuickDelete(activeTabId!, activeTab?.name || 'Mesa', tabItems)} className="p-2 text-white/50 hover:text-white transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 no-scrollbar">
                    {tabItems.map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId);
                      const isWeight = prod?.sellType === 'weight';
                      return (
                        <div key={`${item.productId}-${idx}`} className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-3 animate-in slide-in-from-right-2">
                          <div className="flex items-center justify-between gap-2">
                             <div className="flex-1 min-w-0">
                               <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase truncate leading-tight">{item.productName}</p>
                               <p className="text-[10px] font-black text-red-600 mt-1">{formatCurrency(item.totalPrice)}</p>
                             </div>
                             
                             <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                               <div className="flex items-center gap-1">
                                 {!isWeight ? (
                                   <>
                                     <button onClick={() => updateItemQty(idx, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all font-black active:scale-90">-</button>
                                     <button onClick={() => updateItemQty(idx, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-all font-black active:scale-90">+</button>
                                   </>
                                 ) : (
                                   <button onClick={() => updateItemQty(idx, 0)} className="w-8 h-8 flex items-center justify-center text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-all active:scale-90">
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                   </button>
                                 )}
                               </div>
                               
                               <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 min-w-[60px] text-center border-l border-slate-100 dark:border-slate-800 pl-2">
                                 {isWeight ? `${(item.quantity * 1000).toFixed(0)}g` : `${item.quantity}x`}
                               </span>

                               <button onClick={() => removeFromTab(idx)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all ml-1">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                    {tabItems.length === 0 && <div className="flex flex-col items-center justify-center py-24 opacity-30 italic text-[11px] text-center uppercase font-black">Nenhum consumo registrado</div>}
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-auto pb-8">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Atual</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(tabTotal)}</span>
                    </div>
                    {(tabItems.length > 0 || shortcutCheckout) && (
                      <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-red-700 uppercase text-xs tracking-widest transition-all active:scale-95 shadow-red-500/20">RECEBER PAGAMENTO</button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
                   <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
                      <button onClick={() => { setIsClosingTab(false); setCurrentPayments([]); setReceivedValueInput(null); }} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 hover:text-red-500 transition-colors">
                        ← Retornar à comanda
                      </button>

                      <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Aguardando Pagamento</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter text-center">{formatCurrency(remainingBalance)}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Forma de Pagamento</label>
                        <select value={paymentMethodInput} onChange={e => { setPaymentMethodInput(e.target.value as any); setReceivedValueInput(null); }} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase outline-none focus:ring-4 focus:ring-red-500/10 border border-slate-200 dark:border-slate-700 transition-all">
                          {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>

                      {paymentMethodInput === PaymentMethod.CASH && (
                        <div className="space-y-4 animate-in slide-in-from-top-4">
                           <div className="grid grid-cols-3 gap-2">
                              <button onClick={() => setReceivedValueInput(remainingBalance)} className="col-span-3 py-4 rounded-2xl font-black text-xs uppercase bg-emerald-600 text-white shadow-lg active:scale-95 transition-all border border-emerald-500">VALOR EXATO</button>
                              {[5, 10, 20, 50, 100, 200].map(val => (
                                <button key={val} onClick={() => setReceivedValueInput(val)} className={`py-3 rounded-xl font-black text-xs border transition-all active:scale-90 ${receivedValueInput === val ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-500'}`}>R$ {val}</button>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {((paymentMethodInput === PaymentMethod.PENDURA) || shortcutCheckout) && (
                          <div className="space-y-1 animate-in slide-in-from-right-4">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Identificar Cliente</label>
                            <input type="text" value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase border border-slate-200 dark:border-slate-700 outline-none" placeholder="NOME DO CLIENTE..." />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Lançar Valor Manual</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                               <input type="text" inputMode="decimal" value={paymentAmountInput} onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xl outline-none border border-slate-200 dark:border-slate-700" placeholder={remainingBalance.toFixed(2).replace('.', ',')} />
                            </div>
                            <button onClick={() => {
                               const val = parseCurrencyValue(paymentAmountInput) || remainingBalance;
                               if (isNaN(val) || val <= 0) return;
                               if (((paymentMethodInput === PaymentMethod.PENDURA) || shortcutCheckout) && !customerNameInput.trim()) {
                                 setValidationError("NOME DO CLIENTE OBRIGATÓRIO!");
                                 return;
                               }
                               setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val, customerName: customerNameInput.toUpperCase() || undefined }]);
                               setPaymentAmountInput('');
                               setReceivedValueInput(null);
                               if (!shortcutCheckout) setCustomerNameInput('');
                               setValidationError(null);
                               showFeedback("PAGAMENTO ADICIONADO");
                            }} className="bg-black text-white px-6 rounded-2xl font-black active:scale-95 transition-all shadow-lg text-xl">+</button>
                          </div>
                        </div>
                      </div>

                      {currentPayments.length > 0 && (
                        <div className="space-y-2 pt-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Recebidos</p>
                           {currentPayments.map((p, idx) => (
                             <div key={idx} className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 animate-in slide-in-from-bottom-2">
                                <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400">{p.method} {p.customerName ? `(${p.customerName})` : ''}</span>
                                <span className="text-xs font-black text-emerald-600">{formatCurrency(p.amount)}</span>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>

                   <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] mt-auto pb-8 space-y-4">
                      {paymentMethodInput === PaymentMethod.CASH && receivedValueInput && receivedValueInput > 0 && (
                        <div className="bg-emerald-600 text-white p-5 rounded-3xl flex flex-col items-center justify-center shadow-2xl animate-in zoom-in-95 border-4 border-emerald-500/50 text-center">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Troco a devolver:</span>
                            <span className="text-4xl font-black tracking-tighter">{formatCurrency(changeDue)}</span>
                        </div>
                      )}

                      <button onClick={handleFinishSale} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-1">
                        <span>CONCLUIR VENDA</span>
                        <span className="text-[10px] opacity-70">Total: {formatCurrency(tabTotal)}</span>
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de Peso */}
      {(weightModalProduct || editingWeightIndex !== null) && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl text-center border border-slate-200 dark:border-slate-800">
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tighter italic">Lançar Peso (Gramas)</h4>
            <div className="relative">
               <input autoFocus type="number" inputMode="numeric" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className="w-full text-5xl font-black p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-4 border-red-500 outline-none shadow-inner" placeholder="0" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-6 tracking-widest text-center">Ex: 500 = 0.5kg | 1000 = 1.0kg</p>
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={() => { 
                const grams = parseFloat(inputGrams);
                if (!inputGrams || isNaN(grams) || grams <= 0) {
                  showFeedback("PESO INVÁLIDO!");
                  return;
                }
                addToTab(weightModalProduct!, grams / 1000); 
              }} className="bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 shadow-red-500/20">Lançar</button>
              <button onClick={() => { setWeightModalProduct(null); setEditingWeightIndex(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
