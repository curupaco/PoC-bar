
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency, generateUniqueId, sanitizeCurrencyInput, parseCurrencyValue, ModifierGroup, ModifierOption, safeFloat } from '../types';
import WeightModal from './pos/modals/WeightModal';
import UpsellModal from './pos/modals/UpsellModal';

interface POSProps {
  products: Product[];
  modifierGroups: ModifierGroup[];
  categoryModifiers: Record<string, string>;
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
  change?: number; // Para registro visual do troco calculado no momento
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
  onViewChange
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [currentPayments, setCurrentPayments] = useState<PaymentEntry[]>([]);
  
  // States do Formulário de Pagamento
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [cashReceivedInput, setCashReceivedInput] = useState(''); // Valor entregue pelo cliente
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
  
  // State para Modificadores (Upsell)
  const [modifierModalData, setModifierModalData] = useState<{ product: Product, group: ModifierGroup, quantity: number } | null>(null);
  
  // State para controle de categorias colapsadas no PDV
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

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
    setCurrentPayments([]);
    setPaymentAmountInput('');
    setCashReceivedInput('');
    setCustomerNameInput('');
    setIsClosingTab(false);
    setValidationError(null);
    setModifierModalData(null);
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
  // ITEM 2: Uso de safeFloat para evitar 0.000000001
  const remainingBalance = Math.max(0, safeFloat(tabTotal - paidSoFar));

  const handleQuickDelete = (tabId: string, name: string) => {
    setDeleteConfirmId({ id: tabId, name });
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cat)) newSet.delete(cat);
      else newSet.add(cat);
      return newSet;
    });
  };

  const addToTab = (product: Product, quantity: number = 1, weightConfirmed: boolean = false) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;

    if (editingWeightIndex !== null) {
       executeAddItem(product, quantity);
       return;
    }

    if (product.sellType === 'weight' && !weightConfirmed) {
        setWeightModalProduct(product);
        return;
    }

    let groupId = product.modifierGroupId;
    if (!groupId && product.category) {
        const normalizedCat = product.category.toUpperCase().trim();
        groupId = categoryModifiers[normalizedCat];
    }

    if (groupId) {
        const group = modifierGroups.find(g => g.id === groupId);
        if (group && group.options.length > 0) {
            setModifierModalData({ product, group, quantity });
            return;
        }
    }

    executeAddItem(product, quantity);
  };

  const executeAddItem = (product: Product, quantity: number, modifier?: ModifierOption) => {
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        
        if (editingWeightIndex !== null) {
          const currentItem = items[editingWeightIndex];
          // ITEM 2: safeFloat
          items[editingWeightIndex] = { 
            ...currentItem, 
            quantity: quantity, 
            totalPrice: safeFloat(quantity * currentItem.unitPrice)
          };
          showFeedback(`${product.name} ATUALIZADO`);
        } else {
          const modPrice = modifier ? modifier.price : 0;
          const effectiveUnitPrice = safeFloat(product.price + modPrice);

          const existingIndex = items.findIndex(i => 
             i.productId === product.id && 
             (i.modifier?.name === modifier?.name)
          );

          if (existingIndex > -1 && product.sellType === 'unit') {
            const newQty = items[existingIndex].quantity + quantity;
            items[existingIndex] = { 
               ...items[existingIndex], 
               quantity: newQty, 
               totalPrice: safeFloat(newQty * effectiveUnitPrice)
            };
            showFeedback(`+1 ${product.name}`);
          } else {
            items.push({ 
              id: generateUniqueId('it'),
              productId: product.id, 
              productName: product.name, 
              category: product.category || 'GERAL',
              quantity: quantity, 
              unitPrice: effectiveUnitPrice, 
              totalPrice: safeFloat(quantity * effectiveUnitPrice),
              modifier: modifier 
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
    setModifierModalData(null);
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
           return tab;
        }

        const newQty = item.quantity + delta;
        if (newQty <= 0) {
           items.splice(index, 1);
           showFeedback(`${item.productName} REMOVIDO`);
        } else {
           items[index] = { ...item, quantity: newQty, totalPrice: safeFloat(newQty * item.unitPrice) };
           showFeedback(`${item.productName}: ${newQty}x`);
        }
        return { ...tab, items };
      }
      return tab;
    }));
  };

  // --- LÓGICA DE PAGAMENTO ---

  const handleAddPayment = () => {
    const amountToPay = parseCurrencyValue(paymentAmountInput);
    
    if (amountToPay <= 0) {
      showFeedback("VALOR INVÁLIDO");
      return;
    }

    if (amountToPay > remainingBalance + 0.05) {
      showFeedback("VALOR MAIOR QUE O RESTANTE");
      return;
    }

    // Validação de Pendura
    if (paymentMethodInput === PaymentMethod.PENDURA && !customerNameInput.trim()) {
      setValidationError("NOME DO CLIENTE OBRIGATÓRIO PARA PENDURA!");
      return;
    }

    // Cálculo de troco para registro (apenas visual, o valor pago é o valor da dívida abatida)
    let change = 0;
    if (paymentMethodInput === PaymentMethod.CASH) {
       const handed = parseCurrencyValue(cashReceivedInput);
       if (handed > amountToPay) {
          change = safeFloat(handed - amountToPay);
       }
    }

    setCurrentPayments(prev => [...prev, {
      method: paymentMethodInput,
      amount: amountToPay,
      customerName: customerNameInput.trim() || undefined,
      change: change > 0 ? change : undefined
    }]);

    // Limpa inputs para próximo pagamento
    setPaymentAmountInput('');
    setCashReceivedInput('');
    // Não limpa o nome se for o mesmo cliente pagando em partes, ou se estiver em modo quitação
    if (paymentMethodInput !== PaymentMethod.PENDURA && activeTabId !== 'shortcut-payment') setCustomerNameInput('');
    
    showFeedback("PAGAMENTO ADICIONADO");
  };

  const handleFinishSale = () => {
    const isShortcut = activeTabId === 'shortcut-payment';
    
    // Se não houver pagamentos adicionados, tenta adicionar o que está no input agora (Fluxo Rápido)
    if (currentPayments.length === 0) {
        const val = parseCurrencyValue(paymentAmountInput);
        // Se o valor no input cobre tudo ou se o input está vazio mas é Cash (atalho total), processa
        if (val >= remainingBalance - 0.05 || (!paymentAmountInput && paymentMethodInput === PaymentMethod.CASH)) {
             
             // Validação Pendura Rápida
             if (paymentMethodInput === PaymentMethod.PENDURA && !customerNameInput.trim()) {
                setValidationError("NOME DO CLIENTE OBRIGATÓRIO!");
                return;
             }

             // Adiciona e finaliza
             const finalAmount = val > 0 ? val : remainingBalance;
             const singlePayment: PaymentEntry = {
                method: paymentMethodInput,
                amount: finalAmount,
                customerName: customerNameInput.trim() || undefined
             };
             
             processCompletion([singlePayment]);
             return;
        }
    }

    const currentTotalPaid = currentPayments.reduce((acc, p) => acc + p.amount, 0);

    if (remainingBalance > 0.05) {
       setValidationError(`FALTAM ${formatCurrency(remainingBalance)}! ADICIONE O PAGAMENTO.`);
       return;
    }

    processCompletion(currentPayments);
  };

  const processCompletion = (payments: PaymentEntry[]) => {
    const isShortcut = activeTabId === 'shortcut-payment';
    
    payments.forEach((p, index) => {
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
    setCashReceivedInput('');
    showFeedback("OPERACÃO FINALIZADA");
  };

  const liveChange = useMemo(() => {
    if (paymentMethodInput !== PaymentMethod.CASH) return 0;
    const toPay = parseCurrencyValue(paymentAmountInput);
    const handed = parseCurrencyValue(cashReceivedInput);
    if (handed <= 0) return 0;
    return Math.max(0, safeFloat(handed - toPay));
  }, [paymentAmountInput, cashReceivedInput, paymentMethodInput]);

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const favorites = filteredProducts.filter(p => p.isFavorite);
  const categories = Array.from(new Set(filteredProducts.map(p => p.category))).sort();

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-12 animate-in fade-in duration-1000">
        <div className="relative">
          <div className="w-48 h-48 bg-red-600/10 rounded-[60px] flex items-center justify-center border border-red-500/20 shadow-2xl relative">
            <div className="absolute inset-0 bg-red-600/10 blur-[80px] rounded-full animate-pulse"></div>
            <svg className="w-20 h-20 text-red-600 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 animate-bounce">
            <img src="https://img.icons8.com/fluency/512/beer.png" className="w-10 h-10" alt="Botequista" />
          </div>
        </div>
        <div className="max-w-md space-y-4">
           <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Acesso Restrito</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-lg px-8">O turno atual está <span className="text-red-600 font-black">encerrado</span>. Abra o caixa para liberar as funções de venda e tesouraria.</p>
        </div>
        <button onClick={() => onViewChange && onViewChange('shifts')} className="bg-red-600 text-white px-16 py-6 rounded-[28px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-red-600/40 active:scale-95 transition-all hover:bg-red-700">Abrir Turno Agora</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top-4">{toast}</div>}
      {validationError && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4" onClick={() => setValidationError(null)}>{validationError}</div>}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-[710] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-2 tracking-tighter italic">Apagar Mesa?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
               Remover a mesa <span className="font-bold text-slate-800 dark:text-white">"{deleteConfirmId.name}"</span> definitivamente?
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={() => {
                   onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(deleteConfirmId.id)));
                   if (normalizeId(activeTabId) === normalizeId(deleteConfirmId.id)) { setActiveTabId(null); }
                   setDeleteConfirmId(null);
                   showFeedback(`MESA REMOVIDA`);
                }} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Sim, Remover</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</button>
             </div>
          </div>
        </div>
      )}

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
                <button onClick={(e) => { e.stopPropagation(); handleQuickDelete(tab.id, tab.name); }} className="absolute top-2 right-2 p-3 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-2xl transition-all lg:opacity-0 group-hover:opacity-100 z-10"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
                    <div 
                      onClick={() => toggleCategory(cat)} 
                      className="flex items-center gap-4 cursor-pointer group select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 text-red-600 transition-transform duration-300 ${collapsedCats.has(cat) ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-red-500 transition-colors">{cat}</h3>
                      </div>
                      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                      <span className="text-[9px] font-black text-slate-300 uppercase">{filteredProducts.filter(p => p.category === cat).length} ITENS</span>
                    </div>
                    {!collapsedCats.has(cat) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 animate-in slide-in-from-top-2">
                        {filteredProducts.filter(p => p.category === cat).map(p => (
                          <button key={p.id} onClick={() => addToTab(p)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 hover:border-red-500 shadow-sm transition-all h-24 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1">{p.name}</p>
                            <p className="text-xl font-black text-red-600">{p.price.toFixed(2).replace('.', ',')}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
           </div>

           <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden h-[85vh] lg:h-[calc(100vh-140px)] sticky top-24">
              <div className="p-5 bg-red-600 text-white font-black uppercase text-xs flex justify-between items-center shrink-0 shadow-lg">
                <span className="truncate italic">{activeTab?.name}</span>
                <button onClick={() => handleQuickDelete(activeTabId!, activeTab?.name || 'Mesa')} className="text-white/50 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5} /></svg></button>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {tabItems.map((item, idx) => (
                      <div key={`${item.productId}-${idx}`} className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col flex-1 mr-2">
                             <p className="text-[11px] font-black uppercase leading-tight">{item.productName}</p>
                             {item.modifier && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-1">+ {item.modifier.name}</span>}
                          </div>
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
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-auto pb-12">
                    <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Comanda</span><span className="text-2xl font-black italic">{formatCurrency(tabTotal)}</span></div>
                    <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">RECEBER PAGAMENTO</button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 animate-in slide-in-from-right-4 duration-300">
                   {/* ITEM 5: Adicionado padding bottom extra para o teclado não cobrir */}
                   <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-32">
                      <button onClick={() => { setIsClosingTab(false); setCurrentPayments([]); setCashReceivedInput(''); }} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 hover:text-red-500">← Voltar à comanda</button>
                      
                      <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Falta Pagar</p>
                        <p className="text-4xl font-black tracking-tighter">{formatCurrency(remainingBalance)}</p>
                      </div>

                      {currentPayments.length > 0 && (
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Pagamentos Lançados</p>
                           {currentPayments.map((p, idx) => (
                             <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2">
                                <div className="flex flex-col">
                                   <span className="text-xs font-black uppercase text-slate-800 dark:text-white">{p.method}</span>
                                   {p.customerName && <span className="text-[9px] font-bold text-slate-400 uppercase">{p.customerName}</span>}
                                   {p.change !== undefined && p.change > 0 && <span className="text-[9px] font-bold text-emerald-500 uppercase">Troco: {formatCurrency(p.change)}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                   <span className="font-black text-slate-900 dark:text-white">{formatCurrency(p.amount)}</span>
                                   <button onClick={() => setCurrentPayments(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}

                      <div className="space-y-4">
                        <select 
                           value={paymentMethodInput} 
                           onChange={e => { 
                              const method = e.target.value as PaymentMethod;
                              setPaymentMethodInput(method); 
                              setCashReceivedInput(''); 
                              if (method !== PaymentMethod.PENDURA && activeTabId !== 'shortcut-payment') {
                                  setCustomerNameInput(''); 
                              }
                           }} 
                           className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase outline-none border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-red-500"
                        >
                          {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>

                        {(paymentMethodInput === PaymentMethod.PENDURA || activeTabId === 'shortcut-payment') && (
                           <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                              <label className={`text-[9px] font-black uppercase tracking-widest ml-2 ${activeTabId === 'shortcut-payment' ? 'text-slate-400' : 'text-red-500'}`}>
                                {activeTabId === 'shortcut-payment' ? 'Cliente (Vinculado)' : 'Nome do Cliente (Obrigatório)'}
                              </label>
                              <input 
                                 type="text" 
                                 value={customerNameInput} 
                                 onChange={e => {
                                    if (activeTabId !== 'shortcut-payment') setCustomerNameInput(e.target.value);
                                 }} 
                                 readOnly={activeTabId === 'shortcut-payment'}
                                 className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold uppercase text-xs outline-none border-2 shadow-inner ${activeTabId === 'shortcut-payment' ? 'border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed' : 'border-red-200 focus:border-red-500'}`}
                                 placeholder="QUEM VAI FICAR DEVENDO?"
                              />
                           </div>
                        )}

                        {paymentMethodInput === PaymentMethod.CASH ? (
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor a Cobrar</label>
                                 <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">R$</span>
                                    <input 
                                       type="text" 
                                       inputMode="decimal" 
                                       value={paymentAmountInput} 
                                       onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))} 
                                       className="w-full pl-8 pr-2 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-lg outline-none shadow-inner" 
                                       placeholder="" 
                                    />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Entregue</label>
                                 <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">R$</span>
                                    <input 
                                       type="text" 
                                       inputMode="decimal" 
                                       value={cashReceivedInput} 
                                       onChange={e => setCashReceivedInput(sanitizeCurrencyInput(e.target.value))} 
                                       className="w-full pl-8 pr-2 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-lg outline-none shadow-inner border-2 border-emerald-500/20 focus:border-emerald-500 transition-colors" 
                                       placeholder="" 
                                    />
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor do Pagamento</label>
                              <div className="relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                                 <input 
                                    type="text" 
                                    inputMode="decimal" 
                                    value={paymentAmountInput} 
                                    onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))} 
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xl outline-none shadow-inner" 
                                    placeholder="" 
                                 />
                              </div>
                           </div>
                        )}

                        <button onClick={handleAddPayment} disabled={remainingBalance <= 0.05} className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2">
                           <span>ADICIONAR PAGAMENTO</span>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                   </div>

                   <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] mt-auto pb-12 space-y-4 z-10 sticky bottom-0">
                      {liveChange > 0 && (
                        <div className="bg-emerald-600 text-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-lg animate-in zoom-in-95 border-2 border-emerald-400">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Troco Calculado:</span>
                            <span className="text-3xl font-black tracking-tighter">{formatCurrency(liveChange)}</span>
                        </div>
                      )}
                      
                      <button onClick={handleFinishSale} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1 ${remainingBalance <= 0.05 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                        <span>CONCLUIR VENDA</span>
                        <span className="text-[10px] opacity-70 italic">Total: {formatCurrency(tabTotal)}</span>
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* MODAL DE PESO (GRAMATURA) */}
      <WeightModal 
        product={weightModalProduct}
        initialWeight={
          editingWeightIndex !== null && activeTabId 
            ? (activeTab?.items[editingWeightIndex]?.quantity ?? 0) 
            : undefined
        }
        onConfirm={(weightInKg) => addToTab(weightModalProduct!, weightInKg, true)}
        onClose={() => { setWeightModalProduct(null); setEditingWeightIndex(null); }}
        showFeedback={showFeedback}
      />

      {/* MODAL DE MODIFICADORES (UPSELL) */}
      <UpsellModal 
        data={modifierModalData}
        onConfirm={(opt) => modifierModalData && executeAddItem(modifierModalData.product, modifierModalData.quantity, opt)}
        onClose={() => setModifierModalData(null)}
      />
    </div>
  );
};

export default POS;
