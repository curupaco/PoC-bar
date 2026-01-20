
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

  // INÍCIO DA ALTERAÇÃO: Explicitly type activeTab to avoid unknown errors
  const activeTab = useMemo<any>(() => {
    if (shortcutCheckout) return { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() };
    return openTabs.find(t => normalizeId(t.id) === normalizeId(activeTabId));
  }, [activeTabId, openTabs, shortcutCheckout]);
    
  // INÍCIO DA ALTERAÇÃO: Explicitly type tabItems as SaleItem[]
  const tabItems: SaleItem[] = activeTab?.items ?? [];
  const tabTotal = shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, tabTotal - paidSoFar);
  // FIM DA ALTERAÇÃO

  // Agrupamento para a Comanda Lateral
  const groupedTabItems = useMemo(() => {
    const groups: Record<string, SaleItem[]> = {};
    tabItems.forEach(item => {
      const cat = item.category || 'GERAL';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [tabItems]);

  const toggleCategoryCollapse = (cat: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(cat)) newCollapsed.delete(cat);
    else newCollapsed.add(cat);
    setCollapsedCategories(newCollapsed);
  };

  // --- BLOQUEIO DE TURNO ---
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

  const handleProductClick = (product: Product, quantity: number = 1) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') { setValidationError("SELECIONE UMA MESA!"); return; }
    if (product.sellType === 'weight') { setWeightModalProduct(product); return; }
    const effectiveModGroupId = product.modifierGroupId || categoryModifiers[product.category.toUpperCase().trim()];
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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const favorites = products.filter(p => p.isFavorite && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top-4">{toast}</div>}
      {validationError && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4" onClick={() => setValidationError(null)}>{validationError}</div>}

      {!activeTabId ? (
        <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
            <div><h2 className="text-xl font-black uppercase italic">Comandas Ativas</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{openTabs.length} mesas monitoradas</p></div>
            {!isAddingTab && <button onClick={() => setIsAddingTab(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Abrir Mesa</button>}
          </div>
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="NOME OU MESA..." className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-lg tracking-widest outline-none" />
              <button onClick={() => { if(newTabName.trim()){ const nid = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(nid); setNewTabName(''); setIsAddingTab(false); } }} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs">Criar</button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {openTabs.map(tab => (
              <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-xl transition-all h-40 flex flex-col justify-between">
                <div><h3 className="text-sm font-black uppercase truncate">{tab.name}</h3><span className="text-[9px] text-slate-400 uppercase">{tab.items.length} ITENS</span></div>
                <p className="text-red-600 font-black text-2xl tracking-tighter">{formatCurrency(tab.items.reduce((acc, i) => acc + i.totalPrice, 0))}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full">
           <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 sticky top-0 z-20">
                <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if(onClearShortcut) onClearShortcut(); }} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                <input type="text" placeholder="LANÇAR ITEM..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] outline-none" />
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

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">CARDÁPIO GERAL</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => handleProductClick(p)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 hover:border-red-500 shadow-sm transition-all h-24 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1">{p.name}</p>
                      <p className="text-xl font-black text-red-600">{p.price.toFixed(2).replace('.', ',')}</p>
                    </button>
                  ))}
                </div>
              </div>
           </div>

           {/* COMANDA LATERAL COM GRUPOS E COLAPSO */}
           <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden h-[calc(100vh-140px)] sticky top-24">
              <div className="p-5 bg-red-600 text-white font-black uppercase text-xs flex justify-between items-center shrink-0">
                <span>{activeTab?.name}</span>
                <button onClick={() => { if(window.confirm("Zerar mesa?")) onUpdateTabs(p => p.map(t => t.id === activeTabId ? {...t, items: []} : t)); }} className="text-white/50 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {Object.keys(groupedTabItems).length > 0 ? (
                  Object.entries(groupedTabItems).map(([category, items]) => {
                    const isCollapsed = collapsedCategories.has(category);
                    const categoryTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
                    
                    return (
                      <div key={category} className="space-y-2">
                        {/* Cabeçalho da Categoria com Colapso */}
                        <div 
                          onClick={() => toggleCategoryCollapse(category)}
                          className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                             <svg className={`w-3 h-3 text-red-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{category}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400">{formatCurrency(categoryTotal)}</span>
                        </div>

                        {/* Itens da Categoria */}
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
                                      <span className="text-[10px] font-black w-10 text-center">{item.quantity}{item.productId === 'peso' ? 'kg' : 'x'}</span>
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

              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase text-slate-400">Total Comanda</span><span className="text-2xl font-black">{formatCurrency(tabTotal)}</span></div>
                <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Fechar Conta</button>
              </div>
           </div>
        </div>
      )}

      {weightModalProduct && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h4 className="text-xl font-black uppercase mb-6 text-center italic">Peso (Gramas)</h4>
            <input autoFocus type="number" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className="w-full text-5xl font-black p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 outline-none border-4 border-red-500" placeholder="0" />
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => { const g = parseFloat(inputGrams); if(g > 0) addToTab(weightModalProduct, g/1000); }} className="bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs">Lançar</button>
              <button onClick={() => setWeightModalProduct(null)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs">Sair</button>
            </div>
          </div>
        </div>
      )}

      {modifierModalData && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
              <h4 className="text-xl font-black uppercase mb-8 text-center italic">{modifierModalData.group.name}</h4>
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

      {isClosingTab && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
             <h3 className="text-2xl font-black uppercase mb-2 tracking-tighter">Recebimento</h3>
             <p className="text-4xl font-black text-red-600 mb-8 tracking-tighter">{formatCurrency(remainingBalance)}</p>
             <div className="space-y-4">
                <select value={paymentMethodInput} onChange={e => setPaymentMethodInput(e.target.value as any)} className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black uppercase text-xs outline-none">
                   {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {paymentMethodInput === PaymentMethod.PENDURA && <input type="text" value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)} placeholder="NOME DO CLIENTE..." className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black uppercase text-xs outline-none border-2 border-orange-500/20" />}
                <button onClick={handleFinishSale} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs">Confirmar</button>
                <button onClick={() => setIsClosingTab(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
