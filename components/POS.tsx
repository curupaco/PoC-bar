
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, ModifierGroup, ModifierOption, formatCurrency, generateUniqueId, sanitizeCurrencyInput, parseCurrencyValue } from '../types';

interface POSProps {
  products: Product[];
  modifierGroups: ModifierGroup[];
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
  modifierGroups = [],
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['FAVORITOS']));
  
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [currentPayments, setCurrentPayments] = useState<PaymentEntry[]>([]);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [receivedValueInput, setReceivedValueInput] = useState<number | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);

  // Estados de Fluxo de Lançamento
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [modModalData, setModModalData] = useState<{product: Product, quantity: number} | null>(null);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
  const [inputGrams, setInputGrams] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string, hasItems: boolean} | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2000); return () => clearTimeout(t); } }, [toast]);
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

  const handleQuickDelete = (tabId: string, name: string, items: any[]) => {
    if (items.length === 0) {
      onUpdateTabs(prev => prev.filter(t => normalizeId(t.id) !== normalizeId(tabId)));
      if (normalizeId(activeTabId) === normalizeId(tabId)) setActiveTabId(null);
      showFeedback(`MESA ${name} ABANDONADA`);
    } else {
      setDeleteConfirmId({ id: tabId, name, hasItems: true });
    }
  };

  const handleProductClick = (product: Product, quantity: number = 1) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    if (product.sellType === 'weight') { setWeightModalProduct(product); return; }
    if (product.modifierGroupId) { setModModalData({ product, quantity }); return; }
    addToTab(product, quantity);
  };

  const addToTab = (product: Product, quantity: number = 1, modifier?: ModifierOption) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        const modifierPrice = modifier?.price || 0;
        const finalUnitPrice = product.price + modifierPrice;

        if (editingWeightIndex !== null) {
          items[editingWeightIndex] = { 
            ...items[editingWeightIndex], 
            quantity: quantity, 
            totalPrice: Number((quantity * items[editingWeightIndex].unitPrice).toFixed(2)) 
          };
          showFeedback(`${product.name} ATUALIZADO`);
        } else {
          // Agrupa se for mesmo produto E mesmo modificador (ou ambos sem modificador)
          const existingIndex = items.findIndex(i => i.productId === product.id && i.modifier?.name === modifier?.name);
          
          if (existingIndex > -1 && product.sellType === 'unit') {
            const newQty = items[existingIndex].quantity + quantity;
            items[existingIndex] = { ...items[existingIndex], quantity: newQty, totalPrice: Number((newQty * finalUnitPrice).toFixed(2)) };
            showFeedback(`+1 ${product.name}`);
          } else {
            items.push({ 
              productId: product.id, 
              productName: product.name, 
              category: (product.category || 'GERAL').toUpperCase().trim(),
              quantity: quantity, 
              unitPrice: finalUnitPrice, 
              totalPrice: Number((quantity * finalUnitPrice).toFixed(2)),
              modifier
            });
            showFeedback(`${product.name} LANÇADO`);
          }
        }
        return { ...tab, items };
      }
      return tab;
    }));
    setEditingWeightIndex(null); setWeightModalProduct(null); setModModalData(null); setInputGrams('');
  };

  const removeFromTab = (index: number) => {
    if (!activeTabId) return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...tab.items];
        const removed = items.splice(index, 1);
        if (removed.length > 0) showFeedback(`${removed[0].productName} REMOVIDO`);
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
           setWeightModalProduct(prod); setEditingWeightIndex(index);
           setInputGrams((item.quantity * 1000).toFixed(0)); return tab;
        }
        const newQty = item.quantity + delta;
        if (newQty <= 0) { items.splice(index, 1); showFeedback(`${item.productName} REMOVIDO`); }
        else { items[index] = { ...item, quantity: newQty, totalPrice: Number((newQty * item.unitPrice).toFixed(2)) }; showFeedback(`${item.productName}: ${newQty}x`); }
        return { ...tab, items };
      }
      return tab;
    }));
  };

  const activeTab = useMemo(() => {
    if (shortcutCheckout) return { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() };
    return openTabs.find(t => normalizeId(t.id) === normalizeId(activeTabId));
  }, [activeTabId, openTabs, shortcutCheckout]);
    
  const tabItems = activeTab?.items ?? [];
  const tabTotal = shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, tabTotal - paidSoFar);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = useMemo(() => Array.from(new Set(filteredProducts.map(p => (p.category || 'GERAL').toUpperCase().trim()))).sort(), [filteredProducts]);

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories); if (next.has(cat)) next.delete(cat); else next.add(cat); setExpandedCategories(next);
  };

  const handleFinishSale = () => {
    const isShortcut = activeTabId === 'shortcut-payment';
    let finalPayments = [...currentPayments];
    if (paymentMethodInput === PaymentMethod.CASH && receivedValueInput && receivedValueInput > 0 && finalPayments.length === 0) {
       finalPayments.push({ method: PaymentMethod.CASH, amount: remainingBalance, customerName: customerNameInput.toUpperCase() || undefined });
    }
    const currentTotalPaid = finalPayments.reduce((acc, p) => acc + p.amount, 0);
    if (!activeTab || (!isShortcut && tabItems.length === 0) || (currentTotalPaid < 0.01)) { setValidationError("ADICIONE UM PAGAMENTO!"); return; }
    if (!isShortcut && (tabTotal - currentTotalPaid) > 0.05) { setValidationError(`FALTAM ${formatCurrency(tabTotal - currentTotalPaid)}!`); return; }

    finalPayments.forEach((p, index) => {
       onCompleteSale({
          id: generateUniqueId('sale'), timestamp: Date.now(), openedAt: activeTab.openedAt,
          items: isShortcut ? [{ productId: 'quitacao', productName: 'Quitação Fiado', category: 'FIADO', quantity: 1, unitPrice: p.amount, totalPrice: p.amount }] : (index === 0 ? tabItems : []),
          paymentMethod: p.method, total: p.amount, tabName: activeTab.name, customerName: p.customerName || (isShortcut ? shortcutCheckout?.name : undefined),
          userId: '', shiftId: activeShift?.id || ''
       });
    });
    if (!isShortcut) onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
    else if (onClearShortcut) onClearShortcut();
    setActiveTabId(null); setIsClosingTab(false); setCurrentPayments([]); setReceivedValueInput(null); showFeedback("OPERACÃO FINALIZADA");
  };

  if (!activeShift) return <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in"><h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic">Operação Bloqueada</h2><button onClick={() => onViewChange?.('shifts')} className="bg-red-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Abrir Turno Agora</button></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top-4">{toast}</div>}
      
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl relative z-[410] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Excluir Mesa?</h3>
             <div className="flex flex-col gap-3 mt-6">
                <button onClick={() => { onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(deleteConfirmId.id))); if (normalizeId(activeTabId) === normalizeId(deleteConfirmId.id)) setActiveTabId(null); setDeleteConfirmId(null); showFeedback("MESA EXCLUÍDA"); }} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all">Sim, Excluir</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {validationError && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4" onClick={() => setValidationError(null)}>{validationError}</div>}

      {!activeTabId ? (
        <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[32px] border dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Mesas Abertas</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{(openTabs || []).length === 0 ? 'Nenhuma comanda' : `${(openTabs || []).length} comandas em curso`}</p>
            </div>
            {!isAddingTab && <button onClick={() => setIsAddingTab(true)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest active:scale-95 transition-all">Abrir Mesa</button>}
          </div>

          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in fade-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="NOME DA MESA OU CLIENTE..." className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black uppercase text-lg tracking-widest" onKeyDown={e => e.key === 'Enter' && (() => { if(newTabName.trim()){ const newId = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } })()} />
              <div className="flex gap-2"><button onClick={() => { if(newTabName.trim()){ const newId = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(newId); setNewTabName(''); setIsAddingTab(false); } }} className="flex-1 bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Criar</button><button onClick={() => setIsAddingTab(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-black px-6 py-4 rounded-2xl uppercase text-xs tracking-widest">Sair</button></div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {(openTabs || []).map(tab => (
              <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="bg-white dark:bg-slate-900 rounded-[32px] border dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col relative h-48 group cursor-pointer">
                <button type="button" onClick={(e) => { e.stopPropagation(); handleQuickDelete(tab.id, tab.name, tab.items); }} className="absolute top-2 right-2 p-3 z-30 text-slate-300 hover:text-red-500 transition-all opacity-100 lg:opacity-0 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div><h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{tab.name}</h3><span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{(tab.items ?? []).length} ITENS</span></div>
                  <div><p className="text-red-600 dark:text-red-400 font-black text-2xl tracking-tighter">{formatCurrency((tab.items ?? []).reduce((acc, i) => acc + (i.totalPrice ?? 0), 0))}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 pb-40 overflow-y-auto no-scrollbar h-full">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border dark:border-slate-800 shadow-sm flex items-center gap-4 sticky top-0 z-20">
              <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if (onClearShortcut) onClearShortcut(); }} className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl hover:bg-red-500 hover:text-white active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
              <div className="flex-1 relative"><input type="text" placeholder="BUSCAR PRODUTO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-6 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none outline-none text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500 transition-all" /></div>
            </div>

            {shortcutCheckout ? (
              <div className="bg-orange-50 dark:bg-orange-900/10 border-4 border-orange-200 dark:border-orange-800 rounded-[40px] p-12 text-center animate-in zoom-in-95"><h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-4">Quitação de Pendura</h2><div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(shortcutCheckout.amount)}</div></div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-amber-200 dark:border-amber-900/30 overflow-hidden shadow-sm">
                   <button onClick={() => toggleCategory('FAVORITOS')} className="w-full px-6 py-5 flex items-center justify-between group"><div className="flex items-center gap-3"><span>⭐</span><h3 className="text-xs font-black text-amber-600 uppercase tracking-widest">Mais Vendidos</h3></div><svg className={`w-5 h-5 text-amber-400 transition-transform ${expandedCategories.has('FAVORITOS') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></button>
                   {expandedCategories.has('FAVORITOS') && (
                     <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 border-t border-amber-50 dark:border-amber-900/10 animate-in slide-in-from-top-2">
                       {products.filter(p => p.isFavorite && p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                         <button key={p.id} onClick={() => handleProductClick(p)} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-[20px] border border-amber-100 dark:border-amber-800 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-center flex flex-col items-center justify-center min-h-[90px]"><p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase line-clamp-2 px-1 mb-1">{p.name}</p><p className="text-lg font-black text-amber-600 leading-none">{p.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></button>
                       ))}
                     </div>
                   )}
                </div>

                {categories.map(cat => (
                  <div key={cat} className="bg-white dark:bg-slate-900 rounded-[32px] border dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
                     <button onClick={() => toggleCategory(cat)} className="w-full px-6 py-5 flex items-center justify-between group"><h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">{cat}</h3><svg className={`w-5 h-5 text-slate-300 transition-transform ${expandedCategories.has(cat) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></button>
                     {expandedCategories.has(cat) && (
                       <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 border-t dark:border-slate-800 animate-in slide-in-from-top-2">
                         {filteredProducts.filter(p => (p.category || 'GERAL').toUpperCase().trim() === cat).map(p => (
                           <button key={p.id} onClick={() => handleProductClick(p)} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-[20px] border dark:border-slate-800 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-center flex flex-col items-center justify-center min-h-[90px]"><p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase line-clamp-2 px-1 mb-1">{p.name}</p><p className="text-lg font-black text-red-600 leading-none">{p.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></button>
                         ))}
                       </div>
                     )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* PRÉVIA FIXA DO PEDIDO (SIDEBAR DIREITA) */}
          <div className="w-full lg:w-96 flex flex-col h-[75vh] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24 mt-6 lg:mt-0 pb-32 lg:pb-0 z-10">
            <div className="bg-white dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 rounded-[40px] overflow-hidden flex flex-col h-full shadow-2xl relative">
              <div className="p-5 bg-slate-900 text-white shrink-0 flex justify-between items-center shadow-lg">
                <div><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Resumo da Conta</p><h3 className="font-black uppercase tracking-tight truncate leading-normal text-xs">{activeTab?.name}</h3></div>
                <button type="button" onClick={() => handleQuickDelete(activeTabId!, activeTab?.name || 'Mesa', tabItems)} className="p-2 text-white/30 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 no-scrollbar">
                    {tabItems.map((item, idx) => {
                      const isWeight = products.find(p => p.id === item.productId)?.sellType === 'weight';
                      return (
                        <div key={`${item.productId}-${idx}`} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border dark:border-slate-800 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                             <div className="flex-1 min-w-0">
                               <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase truncate">{item.productName}</p>
                               <p className="text-[10px] font-black text-red-600">{formatCurrency(item.totalPrice)}</p>
                               {item.modifier && (
                                  <p className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-lg mt-1 w-fit font-black uppercase tracking-tighter italic">
                                     ✦ {item.modifier.name} {item.modifier.price > 0 ? `(+${formatCurrency(item.modifier.price)})` : ''}
                                  </p>
                               )}
                             </div>
                             <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1 rounded-2xl border dark:border-slate-800">
                                <div className="flex items-center gap-0.5">
                                   {!isWeight ? (
                                      <><button onClick={() => updateItemQty(idx, -1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all font-black">-</button><button onClick={() => updateItemQty(idx, 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all font-black">+</button></>
                                   ) : (
                                      <button onClick={() => updateItemQty(idx, 0)} className="w-7 h-7 flex items-center justify-center text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232" /></svg></button>
                                   )}
                                </div>
                                <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 min-w-[45px] text-center border-l dark:border-slate-800 pl-1">{isWeight ? `${(item.quantity * 1000).toFixed(0)}g` : `${item.quantity}x`}</span>
                                <button onClick={() => removeFromTab(idx)} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all ml-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142" /></svg></button>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                    {tabItems.length === 0 && <div className="flex flex-col items-center justify-center py-24 opacity-20 italic text-[11px] text-center uppercase font-black">Comanda Vazia</div>}
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-800 shrink-0 mt-auto pb-8">
                    <div className="flex justify-between items-center mb-5"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Acumulado</span><span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(tabTotal)}</span></div>
                    {(tabItems.length > 0 || shortcutCheckout) && <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-red-700 uppercase text-xs tracking-widest transition-all active:scale-95">RECEBER PAGAMENTO</button>}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
                   <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
                      <button onClick={() => setIsClosingTab(false)} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">← Voltar para a conta</button>
                      <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl border dark:border-slate-800"><p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter text-center">{formatCurrency(remainingBalance)}</p></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pagamento</label><select value={paymentMethodInput} onChange={e => { setPaymentMethodInput(e.target.value as any); setReceivedValueInput(null); }} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase outline-none border dark:border-slate-700">{Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                      {paymentMethodInput === PaymentMethod.CASH && (
                        <div className="grid grid-cols-3 gap-2">
                           <button onClick={() => setReceivedValueInput(remainingBalance)} className="col-span-3 py-3 rounded-xl font-black text-xs bg-emerald-600 text-white">VALOR EXATO</button>
                           {[10, 20, 50, 100].map(v => <button key={v} onClick={() => setReceivedValueInput(v)} className="py-3 rounded-xl font-black text-xs bg-slate-100 dark:bg-slate-800 text-slate-500">R$ {v}</button>)}
                        </div>
                      )}
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Lançar Parcial</label><div className="flex gap-2"><input type="text" inputMode="decimal" value={paymentAmountInput} onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))} className="flex-1 px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xl outline-none border border-slate-200 dark:border-slate-700" placeholder={remainingBalance.toFixed(2).replace('.', ',')} /><button onClick={() => { const val = parseCurrencyValue(paymentAmountInput) || remainingBalance; if (isNaN(val) || val <= 0) return; setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val, customerName: customerNameInput.toUpperCase() || undefined }]); setPaymentAmountInput(''); }} className="bg-black text-white px-6 rounded-2xl font-black shadow-lg text-xl">+</button></div></div>
                   </div>
                   <div className="p-6 border-t dark:border-slate-800 mt-auto pb-8 space-y-4">
                      {paymentMethodInput === PaymentMethod.CASH && receivedValueInput && <div className="text-center font-black text-emerald-600 text-xs uppercase tracking-widest">Troco: {formatCurrency(Math.max(0, receivedValueInput - remainingBalance))}</div>}
                      <button onClick={handleFinishSale} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">CONCLUIR VENDA</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL DE SERVIÇOS E ADICIONAIS DINÂMICOS */}
      {modModalData && (
         <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border dark:border-slate-800 animate-in zoom-in-95">
               <div className="p-10 bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 text-center">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Personalizar Pedido</p>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">{modModalData.product.name}</h3>
               </div>
               <div className="p-10 space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest mb-4">Selecione o serviço ou adicional:</p>
                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto no-scrollbar">
                     {modifierGroups.find(g => g.id === modModalData.product.modifierGroupId)?.options.map((opt, i) => (
                        <button 
                           key={i} 
                           onClick={() => addToTab(modModalData.product, modModalData.quantity, opt)}
                           className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 border dark:border-slate-800 transition-all flex justify-between items-center group/btn"
                        >
                           <span className="font-black uppercase text-xs tracking-widest text-slate-600 dark:text-slate-300 group-hover/btn:text-white">{opt.name}</span>
                           <span className={`text-[10px] font-black uppercase ${opt.price > 0 ? 'text-emerald-500 group-hover/btn:text-white' : 'text-slate-300 group-hover/btn:text-white/50'}`}>
                              {opt.price > 0 ? `+${formatCurrency(opt.price)}` : 'S/ Custo'}
                           </span>
                        </button>
                     ))}
                     <button 
                        onClick={() => addToTab(modModalData.product, modModalData.quantity)}
                        className="w-full py-4 mt-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-slate-400 transition-colors"
                     >
                        Nenhum Adicional
                     </button>
                  </div>
               </div>
               <div className="px-10 pb-10">
                  <button onClick={() => setModModalData(null)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
               </div>
            </div>
         </div>
      )}

      {/* Modal Peso */}
      {(weightModalProduct || editingWeightIndex !== null) && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl text-center border dark:border-slate-800 animate-in zoom-in-95">
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tighter italic">Informar Peso (Gramas)</h4>
            <input autoFocus type="number" inputMode="numeric" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className="w-full text-5xl font-black p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-4 border-red-500 outline-none shadow-inner" placeholder="0" />
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={() => { 
                const grams = parseFloat(inputGrams); 
                if (isNaN(grams) || grams <= 0) return; 
                const prod = weightModalProduct || products.find(p => p.id === tabItems[editingWeightIndex!].productId);
                if (prod) addToTab(prod, grams / 1000); 
              }} className="bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">Confirmar</button>
              <button onClick={() => { setWeightModalProduct(null); setEditingWeightIndex(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
