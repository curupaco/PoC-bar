
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency } from '../types';

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

  const activeTab = shortcutCheckout 
    ? { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() }
    : openTabs.find(t => normalizeId(t.id) === normalizeId(activeTabId));
    
  const tabItems = activeTab?.items ?? [];
  const tabTotal = shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  
  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, tabTotal - paidSoFar);

  const addToTab = (product: Product, quantity: number = 1) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        if (editingWeightIndex !== null) {
          items[editingWeightIndex] = { ...items[editingWeightIndex], quantity: quantity, totalPrice: quantity * items[editingWeightIndex].unitPrice };
          showFeedback(`${product.name} ATUALIZADO`);
        } else {
          const existingIndex = items.findIndex(i => i.productId === product.id);
          if (existingIndex > -1 && product.sellType === 'unit') {
            const newQty = items[existingIndex].quantity + quantity;
            items[existingIndex] = { ...items[existingIndex], quantity: newQty, totalPrice: newQty * product.price };
            showFeedback(`+1 ${product.name}`);
          } else {
            items.push({ productId: product.id, productName: product.name, quantity: quantity, unitPrice: product.price, totalPrice: quantity * product.price });
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
    onUpdateTabs(prev => prev.map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...tab.items];
        const removed = items.splice(index, 1);
        showFeedback(`${removed[0].productName} REMOVIDO`);
        return { ...tab, items };
      }
      return tab;
    }));
  };

  const updateItemQty = (index: number, delta: number) => {
    if (!activeTabId) return;
    onUpdateTabs(prev => prev.map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...tab.items];
        const item = items[index];
        const prod = products.find(p => p.id === item.productId);
        
        if (prod?.sellType === 'weight' && delta !== 0) {
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
           items[index] = { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
           showFeedback(`${item.productName}: ${newQty}x`);
        }
        return { ...tab, items };
      }
      return tab;
    }));
  };

  const handlePaymentInputChange = (val: string) => {
    const cleaned = val.replace(/[^0-9,]/g, '');
    const parts = cleaned.split(',');
    if (parts.length > 2) return;
    setPaymentAmountInput(cleaned);
  };

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const favorites = filteredProducts.filter(p => p.isFavorite);
  const categories = Array.from(new Set(filteredProducts.map(p => p.category))).sort();

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-[32px] flex items-center justify-center text-red-500 shadow-xl">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <div className="max-w-md space-y-4">
           <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Vendas Bloqueadas</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium">Inicie um turno para começar a vender.</p>
           {onViewChange && (
             <button onClick={() => onViewChange('shifts')} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all">Abrir Turno Agora</button>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[210] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top-4">
           {toast}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[32px] p-8 shadow-2xl relative z-20 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase text-center mb-2 tracking-tighter leading-none">Excluir Mesa?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-8">
               {deleteConfirmId.hasItems 
                 ? `A mesa "${deleteConfirmId.name}" tem consumo. Apagar tudo?` 
                 : `Excluir a mesa "${deleteConfirmId.name}"?`}
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={() => {
                   onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(deleteConfirmId.id)));
                   if (normalizeId(activeTabId) === normalizeId(deleteConfirmId.id)) { setActiveTabId(null); setIsClosingTab(false); }
                   setDeleteConfirmId(null);
                }} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Sim, Excluir</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {validationError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4">
           {validationError}
        </div>
      )}

      {!activeTabId ? (
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Mesas Abertas</h2>
            {!isAddingTab && (
              <button onClick={() => setIsAddingTab(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-black shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest">Abrir Mesa</button>
            )}
          </div>
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-red-500 shadow-xl flex gap-3 animate-in fade-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="Mesa ou Cliente" className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none font-bold uppercase" onKeyDown={e => e.key === 'Enter' && (() => { if(newTabName.trim()){ const newId = `tab-${Date.now()}`; onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } })()} />
              <button onClick={() => { if(newTabName.trim()){ const newId = `tab-${Date.now()}`; onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } }} className="bg-red-600 text-white px-6 rounded-xl font-black hover:bg-red-700 uppercase text-xs">Criar</button>
              <button onClick={() => setIsAddingTab(false)} className="text-slate-400 font-bold px-4 uppercase text-xs">Sair</button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {(openTabs || []).map(tab => (
              <div key={tab.id} className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative h-36 group">
                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId({ id: tab.id, name: tab.name, hasItems: tab.items.length > 0 }); }} className="absolute top-0 right-0 p-3 z-20 text-slate-300 hover:text-red-500 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div onClick={() => setActiveTabId(tab.id)} className="p-4 cursor-pointer flex-1 flex flex-col justify-between">
                  <h3 className="text-[12px] font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{tab.name}</h3>
                  <div>
                    <p className="text-red-600 dark:text-red-400 font-black text-lg">{formatCurrency((tab.items ?? []).reduce((acc, i) => acc + (i.totalPrice ?? 0), 0))}</p>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{(tab.items ?? []).length} ITENS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 pb-20">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if (onClearShortcut) onClearShortcut(); }} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <div className="flex-1 flex items-center gap-3">
                <input type="text" placeholder="BUSCAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest" disabled={!!shortcutCheckout} />
              </div>
            </div>

            {shortcutCheckout ? (
              <div className="bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800 rounded-3xl p-12 text-center space-y-4 animate-in zoom-in-95">
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Quitação de Fiado</h2>
                 <p className="text-slate-600 dark:text-slate-400 font-medium">Cliente: <span className="text-red-600 font-black">{shortcutCheckout.name}</span> | Valor: <span className="font-black">{formatCurrency(shortcutCheckout.amount)}</span></p>
              </div>
            ) : (
              <div className="space-y-6">
                {favorites.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">⭐ FAVORITOS</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2">
                      {favorites.map(p => (
                        <button key={p.id} onClick={() => p.sellType === 'weight' ? setWeightModalProduct(p) : addToTab(p, 1)} className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded-xl border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 transition-all text-left">
                          <p className="text-[9px] font-black text-amber-900 dark:text-amber-100 truncate uppercase leading-tight">{p.name}</p>
                          <p className="text-xs font-black text-amber-600">{formatCurrency(p.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {categories.map(cat => (
                  <div key={cat} className="space-y-2">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">{cat}</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2">
                      {filteredProducts.filter(p => p.category === cat).map(p => (
                        <button key={p.id} onClick={() => p.sellType === 'weight' ? setWeightModalProduct(p) : addToTab(p, 1)} className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 active:scale-95 transition-all text-left">
                          <p className="text-[9px] font-black text-slate-800 dark:text-slate-100 truncate uppercase leading-tight">{p.name}</p>
                          <p className="text-xs font-black text-red-600">{formatCurrency(p.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-full lg:w-96 flex flex-col h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
              <div className="p-4 bg-red-600 text-white shrink-0 flex justify-between items-center">
                <h3 className="font-black uppercase tracking-tight truncate leading-normal text-[11px]">{activeTab?.name}</h3>
                <button type="button" onClick={() => setDeleteConfirmId({ id: activeTabId, name: activeTab?.name || 'Mesa', hasItems: tabItems.length > 0 })} className="p-2 text-white/50 hover:text-white transition-colors">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[250px]">
                    {tabItems.map((item, idx) => (
                      <div key={`${item.productId}-${idx}`} className="bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                           <div className="flex-1 min-w-0">
                             <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase truncate leading-tight">{item.productName}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase">{formatCurrency(item.totalPrice)}</p>
                           </div>
                           
                           <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                             <button onClick={() => updateItemQty(idx, -1)} className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors font-black">-</button>
                             <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 min-w-[20px] text-center">
                               {products.find(p => p.id === item.productId)?.sellType === 'unit' ? `${item.quantity}` : `${(item.quantity * 1000).toFixed(0)}g`}
                             </span>
                             <button onClick={() => updateItemQty(idx, 1)} className="w-6 h-6 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-md transition-colors font-black">+</button>
                             <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-1"></div>
                             <button onClick={() => removeFromTab(idx)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                           </div>
                        </div>
                      </div>
                    ))}
                    {tabItems.length === 0 && <div className="flex flex-col items-center justify-center py-10 opacity-30 italic text-[10px] text-center uppercase font-black">Mesa Vazia</div>}
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(tabTotal)}</span>
                    </div>
                    {(tabItems.length > 0 || shortcutCheckout) && (
                      <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-red-700 uppercase text-[10px] tracking-widest">RECEBER PAGAMENTO</button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      <button onClick={() => { setIsClosingTab(false); setCurrentPayments([]); }} className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                        ← Voltar
                      </button>
                      <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Restante</p>
                        <p className="text-2xl font-black text-red-600">{formatCurrency(remainingBalance)}</p>
                      </div>
                      <div className="space-y-2">
                        <select value={paymentMethodInput} onChange={e => setPaymentMethodInput(e.target.value as any)} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-[10px] uppercase outline-none">
                          {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        {(paymentMethodInput === PaymentMethod.PENDURA || shortcutCheckout) && (
                          <input type="text" value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs uppercase" placeholder="NOME DO CLIENTE" />
                        )}
                        <div className="flex gap-2">
                          <input type="text" inputMode="decimal" value={paymentAmountInput} onChange={e => handlePaymentInputChange(e.target.value)} className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-lg outline-none" placeholder="0,00" />
                          <button onClick={() => {
                             const val = parseFloat(paymentAmountInput.replace(',', '.'));
                             if (isNaN(val) || val <= 0) return;
                             if ((paymentMethodInput === PaymentMethod.PENDURA || shortcutCheckout) && !customerNameInput.trim()) {
                               setValidationError("NOME OBRIGATÓRIO!");
                               return;
                             }
                             setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val, customerName: customerNameInput.toUpperCase() || undefined }]);
                             setPaymentAmountInput('');
                             if (!shortcutCheckout) setCustomerNameInput('');
                          }} className="bg-black text-white px-4 rounded-xl font-black">+</button>
                        </div>
                      </div>
                      {currentPayments.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                           {currentPayments.map((p, idx) => (
                             <div key={idx} className="flex justify-between items-center text-[9px] font-black text-slate-700 dark:text-slate-300">
                                <span className="uppercase">{p.method} {p.customerName ? `(${p.customerName})` : ''}</span>
                                <span>{formatCurrency(p.amount)}</span>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                   <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                      <button onClick={() => {
                        const isShortcut = activeTabId === 'shortcut-payment';
                        const canFinish = isShortcut ? paidSoFar > 0 : remainingBalance <= 0.01;
                        if (!activeTab || (!isShortcut && tabItems.length === 0) || !canFinish) return;
                        currentPayments.forEach((p, index) => {
                           onCompleteSale({
                              id: `${Date.now()}-${index}`,
                              timestamp: Date.now(),
                              openedAt: activeTab.openedAt,
                              items: isShortcut ? [{ productId: 'quitacao', productName: 'Quitação Fiado', quantity: 1, unitPrice: p.amount, totalPrice: p.amount }] : (index === 0 ? tabItems : []),
                              paymentMethod: p.method,
                              total: p.amount,
                              tabName: activeTab.name,
                              customerName: p.customerName || (isShortcut ? shortcutCheckout?.name : undefined),
                              userId: '', 
                              shiftId: activeShift.id
                           });
                        });
                        if (!isShortcut) onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
                        else if (onClearShortcut) onClearShortcut();
                        setActiveTabId(null);
                        setIsClosingTab(false);
                        setCurrentPayments([]);
                        showFeedback("VENDA FINALIZADA");
                      }} disabled={remainingBalance > 0.01} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50">Finalizar</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {(weightModalProduct || editingWeightIndex !== null) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center border border-slate-200 dark:border-slate-800">
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Gramas</h4>
            <div className="relative">
               <input autoFocus type="number" inputMode="numeric" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className="w-full text-5xl font-black p-6 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-red-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => { if (!inputGrams) return; addToTab(weightModalProduct!, parseFloat(inputGrams) / 1000); }} className="bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Lançar</button>
              <button onClick={() => { setWeightModalProduct(null); setEditingWeightIndex(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
