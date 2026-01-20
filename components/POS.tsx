
// INÍCIO DA ALTERAÇÃO
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

  // --- BLOQUEIO DE TURNO REVISADO ---
  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 animate-in fade-in duration-700">
        <div className="relative group">
          <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full group-hover:bg-red-600/30 transition-all duration-1000"></div>
          <div className="relative w-40 h-40 bg-red-500/10 dark:bg-red-500/5 rounded-[48px] flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
             <svg className="w-16 h-16 text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
             </svg>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center shadow-lg">
             <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="max-w-xs space-y-4">
           <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none italic">Caixa Fechado</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm px-4 leading-relaxed">
             A operação de vendas está protegida. <br />
             <span className="text-red-600 dark:text-red-400 font-black">ABRA O TURNO</span> para liberar o PDV.
           </p>
        </div>
        <button onClick={() => onViewChange && onViewChange('shifts')} className="group relative bg-red-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-red-700 active:scale-95 transition-all overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          Abrir Turno Agora
        </button>
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
    setEditingItemUid(null);
    setWeightModalProduct(null);
    setModifierModalData(null);
    setInputGrams('');
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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top-4">
           {toast}
        </div>
      )}
      {validationError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4" onClick={() => setValidationError(null)}>
           {validationError}
        </div>
      )}

      {!activeTabId ? (
        <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Comandas Ativas</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{openTabs.length} mesas monitoradas</p>
            </div>
            {!isAddingTab && <button onClick={() => setIsAddingTab(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Abrir Mesa</button>}
          </div>
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="NOME OU MESA..." className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-lg tracking-widest outline-none" />
              <div className="flex gap-2">
                <button onClick={() => { if(newTabName.trim()){ const nid = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(nid); setNewTabName(''); setIsAddingTab(false); } }} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs">Criar</button>
                <button onClick={() => setIsAddingTab(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-black px-6 py-4 rounded-2xl uppercase text-xs">Sair</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {openTabs.map(tab => (
              <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-xl transition-all h-40 flex flex-col justify-between group">
                <div><h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate">{tab.name}</h3><span className="text-[9px] text-slate-400 font-black uppercase">{tab.items.length} ITENS</span></div>
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
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="LANÇAR ITEM..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] outline-none border-none focus:ring-2 focus:ring-red-500 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => handleProductClick(p)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 hover:border-red-500 shadow-sm transition-all h-24 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1">{p.name}</p>
                    <p className="text-xl font-black text-red-600">{p.price.toFixed(2).replace('.', ',')}</p>
                  </button>
                ))}
              </div>
           </div>
           <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
              <div className="p-5 bg-red-600 text-white font-black uppercase text-xs flex justify-between">
                <span>{activeTab?.name}</span>
                <button onClick={() => { if(window.confirm("Limpar itens da mesa?")) onUpdateTabs(p => p.map(t => t.id === activeTabId ? {...t, items: []} : t)); }} className="text-white/50 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {tabItems.map((item) => (
                  <div key={item.id} className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl flex justify-between items-center group">
                    <div><p className="text-[11px] font-black uppercase">{item.productName}</p><p className="text-xs font-black text-red-600">{formatCurrency(item.totalPrice)}</p></div>
                    <button onClick={() => onUpdateTabs(p => p.map(t => t.id === activeTabId ? {...t, items: t.items.filter(it => it.id !== item.id)} : t))} className="text-red-500 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase text-slate-400">Total</span><span className="text-2xl font-black">{formatCurrency(tabTotal)}</span></div>
                <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Fechar Conta</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL PESO */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h4 className="text-xl font-black uppercase mb-6 text-center italic">Peso (Gramas)</h4>
            <input autoFocus type="number" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className="w-full text-5xl font-black p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 outline-none border-4 border-red-500" placeholder="0" />
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => { const g = parseFloat(inputGrams); if(g > 0) addToTab(weightModalProduct, g/1000); }} className="bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs">Lançar</button>
              <button onClick={() => { setWeightModalProduct(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs">Sair</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICADORES */}
      {modifierModalData && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <h4 className="text-xl font-black uppercase mb-8 text-center italic">{modifierModalData.group.name}</h4>
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                 {modifierModalData.group.options.map((opt, i) => (
                    <button key={i} onClick={() => addToTab(modifierModalData.product, 1, opt)} className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-red-500 transition-all flex justify-between items-center group">
                       <span className="font-black uppercase text-sm group-hover:text-red-500">{opt.name}</span>
                       <span className="font-black text-emerald-500">+{formatCurrency(opt.price)}</span>
                    </button>
                 ))}
              </div>
              <div className="pt-8">
                 <button onClick={() => addToTab(modifierModalData.product, 1)} className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest mb-3">Sem Opcional</button>
                 <button onClick={() => setModifierModalData(null)} className="w-full py-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest">Fechar</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL FECHAMENTO */}
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
                <button onClick={handleFinishSale} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Confirmar Pagamento</button>
                <button onClick={() => setIsClosingTab(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
// FIM DA ALTERAÇÃO
