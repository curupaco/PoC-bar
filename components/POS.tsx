
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency, generateUniqueId, ModifierGroup, ModifierOption, safeFloat, SalePayment } from '../types';
import WeightModal from './pos/modals/WeightModal';
import UpsellModal from './pos/modals/UpsellModal';
import POSProductGrid from './pos/POSProductGrid';
import POSPaymentPanel from './pos/POSPaymentPanel';

interface POSProps {
  products: Product[];
  modifierGroups: ModifierGroup[];
  categoryModifiers: Record<string, string>;
  openTabs: Tab[];
  onUpdateTabs: (updater: (prev: Tab[]) => Tab[]) => void;
  onCompleteSale: (sale: Sale | Sale[]) => void; 
  shortcutCheckout?: { name: string; amount: number } | null;
  onClearShortcut?: () => void;
  activeShift?: Shift;
  onViewChange?: (view: any) => void;
  theme?: string;
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
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  
  const [isClosingTab, setIsClosingTab] = useState(false);
  
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
  
  const [modifierModalData, setModifierModalData] = useState<{ product: Product, group: ModifierGroup, quantity: number } | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showFeedback = (msg: string) => setToast(msg);

  useEffect(() => {
    setIsClosingTab(false);
  }, [activeTabId]);

  useEffect(() => {
    if (shortcutCheckout) {
      setActiveTabId('shortcut-payment');
      setIsClosingTab(true);
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

  const handleQuickDelete = (tabId: string, name: string) => {
    setDeleteConfirmId({ id: tabId, name });
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

  const processCompletion = (payments: { method: PaymentMethod, amount: number, customerName?: string }[]) => {
    const isShortcut = activeTabId === 'shortcut-payment';
    
    // CORREÇÃO CRÍTICA ITEM 3: Consolida pagamentos em uma única venda (Sale Bundling)
    const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    
    // Define método principal: se for único, usa ele. Se forem vários, usa MULTIPLE.
    const mainMethod = payments.length === 1 ? payments[0].method : PaymentMethod.MULTIPLE;
    
    // Busca nome do cliente se houver (prioriza Pendura ou o primeiro nome disponível)
    const customerName = payments.find(p => p.customerName)?.customerName || 
                        (isShortcut ? shortcutCheckout?.name : undefined);

    const newSale: Sale = {
       id: generateUniqueId('sale'),
       timestamp: Date.now(),
       openedAt: activeTab.openedAt,
       items: isShortcut 
         ? [{ id: generateUniqueId('it'), productId: 'quitacao', productName: 'Quitação Fiado', category: 'FIADO', quantity: 1, unitPrice: totalAmount, totalPrice: totalAmount }] 
         : tabItems,
       paymentMethod: mainMethod,
       payments: payments, // Array completo de pagamentos
       total: totalAmount,
       tabName: activeTab.name,
       customerName: customerName,
       userId: '', 
       shiftId: activeShift?.id || ''
    };

    onCompleteSale([newSale]);

    if (!isShortcut) onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
    else if (onClearShortcut) onClearShortcut();
    
    setActiveTabId(null);
    setIsClosingTab(false);
    showFeedback("VENDA FINALIZADA");
  };

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
           
           <POSProductGrid products={products} onAddProduct={addToTab} />

           <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden h-[85vh] lg:h-[calc(100vh-140px)] sticky top-24">
              <div className="p-5 bg-red-600 text-white font-black uppercase text-xs flex justify-between items-center shrink-0 shadow-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                  {!isClosingTab && (
                    <button onClick={() => setActiveTabId(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors" title="Voltar para seleção de mesas">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                  )}
                  <span className="truncate italic">{activeTab?.name}</span>
                </div>
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
                <POSPaymentPanel 
                  activeTabId={activeTabId} 
                  tabTotal={tabTotal} 
                  onBack={() => setIsClosingTab(false)} 
                  onComplete={processCompletion}
                  shortcutCheckout={shortcutCheckout}
                />
              )}
           </div>
        </div>
      )}

      <WeightModal 
        product={weightModalProduct}
        initialWeight={editingWeightIndex !== null && activeTabId ? (activeTab?.items[editingWeightIndex]?.quantity ?? 0) : undefined}
        onConfirm={(weightInKg) => addToTab(weightModalProduct!, weightInKg, true)}
        onClose={() => { setWeightModalProduct(null); setEditingWeightIndex(null); }}
        showFeedback={showFeedback}
      />

      <UpsellModal 
        data={modifierModalData}
        onConfirm={(opt) => modifierModalData && executeAddItem(modifierModalData.product, modifierModalData.quantity, opt)}
        onClose={() => setModifierModalData(null)}
      />
    </div>
  );
};

export default POS;
