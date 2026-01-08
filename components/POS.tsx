
import React, { useState, useEffect } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, formatCurrency } from '../types';

interface POSProps {
  products: Product[];
  openTabs: Tab[];
  onUpdateTabs: (updater: (prev: Tab[]) => Tab[]) => void;
  onCompleteSale: (sale: Sale) => void;
}

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

const POS: React.FC<POSProps> = ({ products = [], openTabs = [], onUpdateTabs, onCompleteSale }) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [currentPayments, setCurrentPayments] = useState<PaymentEntry[]>([]);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
  const [inputGrams, setInputGrams] = useState('');

  // Comparação ultra-robusta de IDs
  const normalizeId = (id: any) => String(id).trim();
  const activeTab = openTabs.find(t => normalizeId(t.id) === normalizeId(activeTabId));
  const tabItems = activeTab?.items ?? [];
  const tabTotal = tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, tabTotal - paidSoFar);

  useEffect(() => {
    if (activeTabId && !openTabs.some(t => normalizeId(t.id) === normalizeId(activeTabId))) {
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

  const getOpenTime = (openedAt: number) => {
    const diffMs = Date.now() - (openedAt || Date.now());
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHrs = Math.floor(diffMin / 60);
    return `${diffHrs}h`;
  };

  const handleCreateTab = () => {
    if (!newTabName.trim()) return;
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      name: newTabName,
      items: [],
      openedAt: Date.now()
    };
    onUpdateTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setNewTabName('');
    setIsAddingTab(false);
  };

  const handleForceDelete = (id: string | null, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!id) return;
    const target = openTabs.find(t => normalizeId(t.id) === normalizeId(id));
    if (!target) return;

    const hasItems = (target.items ?? []).length > 0;
    const confirmText = hasItems 
      ? `A mesa "${target.name}" tem itens lançados. APAGAR TUDO e remover comanda agora?`
      : `Deseja excluir a comanda "${target.name}"?`;

    if (window.confirm(confirmText)) {
      onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(id)));
      if (normalizeId(activeTabId) === normalizeId(id)) {
        setActiveTabId(null);
        setIsClosingTab(false);
      }
    }
  };

  const removeItem = (index: number) => {
    if (!activeTabId) return;
    onUpdateTabs(prev => prev.map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const newItems = [...(tab.items ?? [])];
        newItems.splice(index, 1);
        return { ...tab, items: newItems };
      }
      return tab;
    }));
  };

  const addToTab = (product: Product, quantity: number = 1) => {
    if (!activeTabId) return;
    onUpdateTabs(prev => prev.map(tab => {
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
  };

  const updateItemQuantity = (itemIndex: number, delta: number) => {
    if (!activeTabId) return;
    onUpdateTabs(prev => prev.map(tab => {
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

  const handleEditWeight = (idx: number, item: SaleItem) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return;
    setWeightModalProduct(product);
    setEditingWeightIndex(idx);
    setInputGrams((item.quantity * 1000).toFixed(0));
  };

  const addPaymentEntry = () => {
    const val = parseFloat(paymentAmountInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val }]);
    setPaymentAmountInput('');
  };

  const removePaymentEntry = (index: number) => {
    setCurrentPayments(prev => prev.filter((_, i) => i !== index));
  };

  const finishSale = () => {
    if (!activeTab || tabItems.length === 0 || remainingBalance > 0.01) return;
    
    currentPayments.forEach((p, index) => {
      const sale: Sale = {
        id: `${Date.now()}-${index}`,
        timestamp: Date.now(),
        items: index === 0 ? tabItems : [],
        paymentMethod: p.method,
        total: p.amount,
        tabName: activeTab.name
      };
      onCompleteSale(sale);
    });

    onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
    setActiveTabId(null);
    setIsClosingTab(false);
    setCurrentPayments([]);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = Array.from(new Set(products.map(p => p.category)));

  if (!activeTabId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Comandas Abertas</h2>
          {!isAddingTab && (
            <button onClick={() => setIsAddingTab(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95">
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
          {openTabs.map(tab => {
            const itemsCount = (tab.items ?? []).length;
            const tabTotalVal = (tab.items ?? []).reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
            return (
              <div key={tab.id} className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative h-44 group">
                <button 
                  type="button"
                  onClick={(e) => handleForceDelete(tab.id, e)}
                  className="absolute top-0 right-0 p-4 z-20 text-slate-300 hover:text-red-500 transition-all hover:scale-125"
                  title="Excluir Mesa"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div 
                  onClick={() => { setActiveTabId(tab.id); setIsClosingTab(false); }}
                  className="p-5 cursor-pointer flex-1 flex flex-col justify-between"
                >
                  <div className="pr-10">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-8-3V7l8-3 8 3v11l-8 3zM12 21V7M12 7l8-3-8-3-8 3 8 3z" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase truncate tracking-tighter leading-none">{tab.name}</h3>
                    <p className="text-red-600 dark:text-red-400 font-black text-xl mt-1">{formatCurrency(tabTotalVal)}</p>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-50 dark:border-slate-800/50 pt-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{itemsCount} ITENS</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Há {getOpenTime(tab.openedAt)}</span>
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
    <div className="flex flex-col lg:flex-row gap-6 relative">
      <div className="flex-1 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); }} className="flex bg-slate-100 dark:bg-slate-800 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex-1 flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>

        {categories.map(cat => (
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
        ))}
      </div>

      <div className="w-full lg:w-96 flex flex-col h-auto lg:h-[calc(100vh-140px)] sticky top-24">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
          <div className="p-5 bg-red-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black uppercase tracking-tighter truncate leading-tight flex-1 pr-4">{activeTab?.name}</h3>
              <span className="text-[10px] bg-black/20 px-2 py-1 rounded-full font-bold">#{normalizeId(activeTabId).slice(-4)}</span>
            </div>
            <button 
              type="button"
              onClick={(e) => handleForceDelete(activeTabId, e)}
              className="w-full py-2 bg-black/20 hover:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Abandonar Mesa
            </button>
          </div>

          {!isClosingTab ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {tabItems.map((item, idx) => {
                  const product = products.find(p => p.id === item.productId);
                  const isUnit = product?.sellType === 'unit';
                  return (
                    <div key={`${item.productId}-${idx}`} className="bg-slate-50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {/* BOTÕES DE CONTROLE À ESQUERDA */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isUnit ? (
                              <div className="flex flex-col bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 shadow-sm">
                                <button onClick={() => updateItemQuantity(idx, 1)} className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
                                <button onClick={() => updateItemQuantity(idx, -1)} className="p-1 text-slate-400 hover:text-red-500 border-t border-slate-100 dark:border-slate-800 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg></button>
                              </div>
                            ) : (
                              <button onClick={() => handleEditWeight(idx, item)} className="p-2 bg-white dark:bg-slate-950 text-slate-400 hover:text-blue-500 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                            )}
                            <div className="bg-white dark:bg-slate-950 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-600 whitespace-nowrap min-w-[55px] text-center shadow-sm">
                              {isUnit ? `${item.quantity}x` : `${(item.quantity * 1000).toFixed(0)}g`}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate leading-tight">{item.productName}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                           <p className="text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(item.totalPrice)}</p>
                           <button onClick={() => removeItem(idx)} className="text-[10px] font-bold text-red-500 hover:underline uppercase mt-1">Excluir</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {tabItems.length === 0 && (
                  <p className="text-center text-slate-400 text-xs italic py-12">Mesa sem consumo no momento.</p>
                )}
              </div>
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Geral</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(tabTotal)}</span>
                </div>
                {tabItems.length > 0 && (
                  <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 transition-all uppercase text-xs tracking-widest">FECHAR COMANDA</button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col p-5 space-y-6">
               <button onClick={() => setIsClosingTab(false)} className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Voltar</button>
               <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase">Faltando</p>
                 <p className="text-3xl font-black text-red-600">{formatCurrency(remainingBalance)}</p>
               </div>
               {remainingBalance > 0.01 && (
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                       {Object.values(PaymentMethod).map(m => (
                         <button key={m} onClick={() => setPaymentMethodInput(m)} className={`py-2 rounded-xl text-[10px] font-black border transition-all ${paymentMethodInput === m ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>{m}</button>
                       ))}
                    </div>
                    <div className="flex gap-2">
                       <input type="number" value={paymentAmountInput} onChange={e => setPaymentAmountInput(e.target.value)} className="no-spinner flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-black border-2 border-slate-200 dark:border-slate-800 focus:border-red-500 outline-none" placeholder="0.00" />
                       <button onClick={addPaymentEntry} className="bg-slate-800 text-white px-4 rounded-xl font-black text-xs hover:bg-black transition-colors">+</button>
                    </div>
                 </div>
               )}
               <div className="flex-1 overflow-y-auto space-y-2">
                 {currentPayments.map((p, i) => (
                   <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                     <div><p className="text-[10px] font-black uppercase text-slate-400">{p.method}</p><p className="font-black dark:text-white">{formatCurrency(p.amount)}</p></div>
                     <button onClick={() => removePaymentEntry(i)} className="text-red-500 p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                   </div>
                 ))}
               </div>
               <button onClick={finishSale} disabled={remainingBalance > 0.01} className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all ${remainingBalance <= 0.01 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>FINALIZAR ({formatCurrency(paidSoFar)})</button>
            </div>
          )}
        </div>
      </div>

      {(weightModalProduct || editingWeightIndex !== null) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase mb-1">
              {editingWeightIndex !== null ? 'Editar Peso' : weightModalProduct?.name}
            </h4>
            <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest">Peso em gramas (g)</p>
            <div className="relative mb-6">
              <input autoFocus type="number" value={inputGrams} onChange={e => setInputGrams(e.target.value)} placeholder="0" className="no-spinner w-full text-4xl font-black p-4 text-center rounded-2xl bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-red-500 outline-none" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold uppercase text-[10px]">gramas</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { 
                if (!inputGrams) return; 
                addToTab(weightModalProduct!, parseFloat(inputGrams) / 1000); 
              }} className="bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">Confirmar</button>
              <button onClick={() => { setWeightModalProduct(null); setEditingWeightIndex(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-xl font-black uppercase text-xs tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
