
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (shortcutCheckout) {
      setActiveTabId('shortcut-payment');
      setIsClosingTab(true);
      setCurrentPayments([]);
      setCustomerNameInput(shortcutCheckout.name);
      setPaymentAmountInput(shortcutCheckout.amount.toFixed(2));
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

  useEffect(() => {
    if (activeTabId && activeTabId !== 'shortcut-payment' && !openTabs.some(t => normalizeId(t.id) === normalizeId(activeTabId))) {
      setActiveTabId(null);
      setIsClosingTab(false);
      setCurrentPayments([]);
    }
  }, [openTabs, activeTabId]);

  useEffect(() => {
    if (isClosingTab) {
      setPaymentAmountInput(remainingBalance > 0 ? remainingBalance.toFixed(2) : '');
    }
  }, [isClosingTab, currentPayments]);

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-[32px] flex items-center justify-center text-red-500 shadow-xl">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <div className="max-w-md space-y-4">
           <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Vendas Bloqueadas</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium">O PDV está bloqueado porque não há um turno ativo. Inicie um turno para começar a vender.</p>
           {onViewChange && (
             <button 
                onClick={() => onViewChange('shifts')}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95"
             >
                Abrir Turno Agora
             </button>
           )}
        </div>
      </div>
    );
  }

  const handleCreateTab = () => {
    if (!newTabName.trim()) return;
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      name: newTabName,
      items: [],
      openedAt: Date.now()
    };
    onUpdateTabs(prev => [...(prev || []), newTab]);
    setActiveTabId(newId);
    setNewTabName('');
    setIsAddingTab(false);
  };

  const handleDeleteTab = (id: string | null, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (id === 'shortcut-payment') {
      if (onClearShortcut) onClearShortcut();
      setActiveTabId(null);
      setIsClosingTab(false);
      return;
    }

    const targetId = normalizeId(id);
    if (!targetId) return;

    const target = openTabs.find(t => normalizeId(t.id) !== targetId);
    // Correção lógica para busca:
    const realTarget = openTabs.find(t => normalizeId(t.id) === targetId);
    if (!realTarget) return;

    const hasItems = (realTarget.items ?? []).length > 0;
    const msg = hasItems 
      ? `A mesa "${realTarget.name}" tem consumo. Deseja realmente APAGAR TUDO e remover a comanda?`
      : `Deseja excluir a mesa "${realTarget.name}"?`;

    if (window.confirm(msg)) {
      onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== targetId));
      if (normalizeId(activeTabId) === targetId) {
        setActiveTabId(null);
        setIsClosingTab(false);
      }
    }
  };

  const removeItem = (index: number) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const newItems = [...(tab.items ?? [])];
        newItems.splice(index, 1);
        return { ...tab, items: newItems };
      }
      return tab;
    }));
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
            totalPrice: quantity * items[editingWeightIndex].unitPrice
          };
        } else {
          const existingIndex = items.findIndex(i => i.productId === product.id);
          if (existingIndex > -1 && product.sellType === 'unit') {
            const newQty = items[existingIndex].quantity + quantity;
            items[existingIndex] = {
              ...items[existingIndex],
              quantity: newQty,
              totalPrice: newQty * product.price
            };
          } else {
            items.push({
              productId: product.id,
              productName: product.name,
              quantity: quantity,
              unitPrice: product.price,
              totalPrice: quantity * product.price
            });
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

  const updateItemQuantity = (itemIndex: number, delta: number) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const newItems = [...(tab.items ?? [])];
        const item = newItems[itemIndex];
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
           newItems.splice(itemIndex, 1);
        } else {
           newItems[itemIndex] = { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
        }
        return { ...tab, items: newItems };
      }
      return tab;
    }));
  };

  const addPaymentEntry = () => {
    const val = parseFloat(paymentAmountInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    if ((paymentMethodInput === PaymentMethod.PENDURA || shortcutCheckout) && !customerNameInput.trim()) {
      alert("Para identificar pagamentos de pendura, o nome do cliente é obrigatório!");
      return;
    }

    setCurrentPayments(prev => [...(prev || []), { 
      method: paymentMethodInput, 
      amount: val,
      customerName: customerNameInput.trim() || undefined
    }]);
    
    setPaymentAmountInput('');
    if (!shortcutCheckout) {
      setCustomerNameInput('');
    }
  };

  const finishSale = () => {
    const isShortcut = activeTabId === 'shortcut-payment';
    const canFinish = isShortcut ? paidSoFar > 0 : remainingBalance <= 0.01;

    if (!activeTab || (!isShortcut && tabItems.length === 0) || !canFinish) return;
    
    currentPayments.forEach((p, index) => {
      const sale: Sale = {
        id: `${Date.now()}-${index}`,
        timestamp: Date.now(),
        openedAt: activeTab.openedAt,
        items: isShortcut 
          ? [{ productId: 'quitacao', productName: 'Abatimento de Pendura', quantity: 1, unitPrice: p.amount, totalPrice: p.amount }]
          : (index === 0 ? tabItems : []),
        paymentMethod: p.method,
        total: p.amount,
        tabName: activeTab.name,
        customerName: p.customerName || (isShortcut ? shortcutCheckout?.name : undefined),
        userId: '', 
        shiftId: activeShift.id
      };
      onCompleteSale(sale);
    });

    if (isShortcut) {
      if (onClearShortcut) onClearShortcut();
    } else {
      onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
    }
    
    setActiveTabId(null);
    setIsClosingTab(false);
    setCurrentPayments([]);
  };

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = Array.from(new Set(filteredProducts.map(p => p.category)));

  if (!activeTabId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Comandas Abertas</h2>
          {!isAddingTab && (
            <button onClick={() => setIsAddingTab(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-black shadow-lg transition-all active:scale-95">
              Abrir Nova Mesa
            </button>
          )}
        </div>

        {isAddingTab && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-red-500 shadow-xl flex gap-3 animate-in fade-in zoom-in-95">
            <input 
              autoFocus
              value={newTabName} 
              onChange={e => setNewTabName(e.target.value)}
              placeholder="Nome da mesa ou cliente"
              className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-red-500"
              onKeyDown={e => e.key === 'Enter' && handleCreateTab()}
            />
            <button onClick={handleCreateTab} className="bg-red-600 text-white px-6 rounded-xl font-bold hover:bg-red-700 transition-colors">Criar</button>
            <button onClick={() => setIsAddingTab(false)} className="text-slate-400 font-bold px-4 hover:text-slate-600 transition-colors">Cancelar</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(openTabs || []).map(tab => {
            const itemsCount = (tab.items ?? []).length;
            const tabTotalVal = (tab.items ?? []).reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
            return (
              <div key={tab.id} className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative h-44 group">
                <button 
                  type="button"
                  onClick={(e) => handleDeleteTab(tab.id, e)}
                  className="absolute top-0 right-0 p-4 z-20 text-slate-300 hover:text-red-500 transition-all hover:scale-125"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div 
                  onClick={() => { setActiveTabId(tab.id); setIsClosingTab(false); }}
                  className="p-5 cursor-pointer flex-1 flex flex-col justify-between"
                >
                  <div className="pr-10">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 mb-2 transition-colors group-hover:bg-red-50 dark:group-hover:bg-red-900/10 group-hover:text-red-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-8-3V7l8-3 8 3v11l-8 3zM12 21V7M12 7l8-3-8-3-8 3 8 3z" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase truncate tracking-tight leading-normal">{tab.name}</h3>
                    <p className="text-red-600 dark:text-red-400 font-black text-xl mt-1">{formatCurrency(tabTotalVal)}</p>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-50 dark:border-slate-800/50 pt-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{itemsCount} ITENS</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      <div className="flex-1 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if (onClearShortcut) onClearShortcut(); }} className="flex bg-slate-100 dark:bg-slate-800 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex-1 flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Pesquisar produtos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white font-medium"
              disabled={!!shortcutCheckout}
            />
          </div>
        </div>

        {shortcutCheckout ? (
          <div className="bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800 rounded-3xl p-12 text-center space-y-6 animate-in zoom-in-95">
             <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Recebimento de Pendura</h2>
             <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
               Recebendo pagamento de <span className="text-red-600 font-black">{shortcutCheckout.name}</span> no valor de <span className="font-black">{formatCurrency(shortcutCheckout.amount)}</span>.
             </p>
          </div>
        ) : (
          <>
            {categories.length > 0 ? categories.map(cat => (
              <div key={cat} className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">{cat}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.filter(p => p.category === cat).map(p => (
                    <button
                      key={p.id}
                      onClick={() => p.sellType === 'weight' ? setWeightModalProduct(p) : addToTab(p, 1)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 active:scale-95 transition-all text-left group"
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 truncate group-hover:text-red-500 transition-colors">{p.name}</p>
                      <p className="text-sm font-black text-red-600">{formatCurrency(p.price)}{p.sellType === 'weight' ? '/kg' : ''}</p>
                    </button>
                  ))}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-bold uppercase tracking-widest space-y-4">
                 <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p>Nenhum produto encontrado</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="w-full lg:w-96 flex flex-col h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-24">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
          <div className="p-5 bg-red-600 text-white shrink-0">
            <h3 className="font-black uppercase tracking-tight truncate leading-normal mb-2">{activeTab?.name}</h3>
            <button 
              type="button"
              onClick={(e) => handleDeleteTab(activeTabId, e)}
              className="w-full py-2 bg-black/20 hover:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Abandonar Mesa
            </button>
          </div>

          {!isClosingTab ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px]">
                {tabItems.map((item, idx) => {
                  const product = products.find(p => p.id === item.productId);
                  const isUnit = product?.sellType === 'unit';
                  return (
                    <div key={`${item.productId}-${idx}`} className="bg-slate-50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600">
                             {isUnit ? `${item.quantity}x` : `${(item.quantity * 1000).toFixed(0)}g`}
                          </div>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate">{item.productName}</p>
                        </div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(item.totalPrice)}</p>
                      </div>
                      <div className="flex gap-2">
                        {isUnit && (
                          <>
                            <button onClick={() => updateItemQuantity(idx, 1)} className="px-2 py-1 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500">+</button>
                            <button onClick={() => updateItemQuantity(idx, -1)} className="px-2 py-1 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500">-</button>
                          </>
                        )}
                        <button onClick={() => removeItem(idx)} className="text-[9px] font-black text-red-500 uppercase ml-auto">Remover</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(tabTotal)}</span>
                </div>
                {tabItems.length > 0 && (
                  <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 transition-all uppercase text-xs tracking-widest">FECHAR CONTA</button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
               <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <button onClick={() => setIsClosingTab(false)} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg> Voltar</button>
                  <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Faltando</p>
                    <p className="text-3xl font-black text-red-600">{formatCurrency(remainingBalance)}</p>
                  </div>
                  <div className="space-y-2">
                    <select value={paymentMethodInput} onChange={e => setPaymentMethodInput(e.target.value as any)} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-red-500">
                      {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {(paymentMethodInput === PaymentMethod.PENDURA || shortcutCheckout) && (
                      <input type="text" value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-xs outline-none focus:ring-2 focus:ring-red-500" placeholder="Nome do Cliente" />
                    )}
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        inputMode="decimal"
                        value={paymentAmountInput} 
                        onChange={e => setPaymentAmountInput(e.target.value)} 
                        className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-black text-xl outline-none focus:ring-2 focus:ring-red-500" 
                        placeholder="0,00" 
                      />
                      <button onClick={addPaymentEntry} className="bg-black text-white px-4 rounded-xl font-black hover:bg-slate-800 transition-colors">+</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamentos Lançados</p>
                    {currentPayments.map((p, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-black uppercase">{p.method}</span>
                        <span className="font-black text-sm">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                    {currentPayments.length === 0 && (
                      <div className="py-4 text-center text-[10px] font-bold text-slate-300 uppercase italic">Aguardando lançamento...</div>
                    )}
                  </div>
               </div>
               <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                  <button onClick={finishSale} disabled={remainingBalance > 0.01} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">Finalizar Venda</button>
               </div>
            </div>
          )}
        </div>
      </div>

      {(weightModalProduct || editingWeightIndex !== null) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center">
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-4 tracking-tighter">Lançar Gramas (g)</h4>
            <input 
              autoFocus 
              type="number" 
              inputMode="numeric"
              value={inputGrams} 
              onChange={e => setInputGrams(e.target.value)} 
              className="w-full text-5xl font-black p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-red-500 outline-none" 
            />
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => { if (!inputGrams) return; addToTab(weightModalProduct!, parseFloat(inputGrams) / 1000); }} className="bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Confirmar</button>
              <button onClick={() => { setWeightModalProduct(null); setEditingWeightIndex(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-xl font-black uppercase text-xs tracking-widest">Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
