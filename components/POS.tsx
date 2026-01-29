import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency, generateUniqueId, ModifierGroup, ModifierOption, safeFloat } from '../types';
import WeightModal from './pos/modals/WeightModal';
import UpsellModal from './pos/modals/UpsellModal';
import POSProductGrid from './pos/POSProductGrid';
import POSPaymentPanel from './pos/POSPaymentPanel';

interface POSProps {
  products: Product[];
  modifierGroups: ModifierGroup[];
  categoryModifiers: Record<string, string>;
  openTabs: Tab[];
  onSaveTab: (tab: Tab) => void;
  onUpdateTabItem?: (tabId: string, item: SaleItem) => void; 
  onDeleteTab: (id: string) => void;
  onCompleteSale: (sales: Sale[], tabIdToClose?: string) => void; 
  shortcutCheckout?: { name: string; amount: number } | null;
  onClearShortcut?: () => void;
  activeShift?: Shift;
  onViewChange?: (view: any) => void;
  dbStatus?: string;
  penduraThreshold?: number;
  longDurationThreshold?: number;
}

export const POS: React.FC<POSProps> = ({ 
  products = [], 
  modifierGroups = [],
  categoryModifiers = {},
  openTabs = [], 
  onSaveTab,
  onUpdateTabItem,
  onDeleteTab,
  onCompleteSale,
  shortcutCheckout,
  onClearShortcut,
  activeShift,
  onViewChange
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [modifierModalData, setModifierModalData] = useState<{ product: Product, group: ModifierGroup, quantity: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tabToDelete, setTabToDelete] = useState<Tab | null>(null);

  // CORREÇÃO: Detecta se veio de um atalho de quitação dos relatórios
  useEffect(() => {
    if (shortcutCheckout) {
      setActiveTabId('shortcut-payment');
      setIsClosingTab(true);
      setShowMobileCart(true); // Garante visibilidade no mobile
    }
  }, [shortcutCheckout]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showFeedback = useCallback((msg: string) => setToast(msg), []);

  const activeTab = useMemo(() => {
    if (activeTabId === 'shortcut-payment' && shortcutCheckout) {
       return { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() };
    }
    return openTabs.find(t => t.id === activeTabId);
  }, [activeTabId, openTabs, shortcutCheckout]);
    
  const tabItems: SaleItem[] = useMemo(() => {
    if (!activeTab?.items) return [];
    const items = activeTab.items;
    return (Array.isArray(items) ? items : (Object.values(items) as SaleItem[]));
  }, [activeTab]);

  const tabTotal = useMemo(() => {
    if (activeTabId === 'shortcut-payment' && shortcutCheckout) return shortcutCheckout.amount;
    return tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  }, [activeTabId, shortcutCheckout, tabItems]);

  const executeAddItem = useCallback((product: Product, quantity: number, modifier?: ModifierOption) => {
    if (!activeTabId) return;

    // INÍCIO DA ALTERAÇÃO: Agrupamento de Itens
    // Verifica se já existe um item igual na comanda (mesmo produto e mesmo modificador)
    const existingItem = tabItems.find(item => 
        item.productId === product.id && 
        (
            (!item.modifier && !modifier) || 
            (item.modifier && modifier && item.modifier.name === modifier.name && item.modifier.price === modifier.price)
        )
    );

    if (existingItem) {
        // Atualiza quantidade do item existente
        const newQty = existingItem.quantity + quantity;
        const updatedItem: SaleItem = {
            ...existingItem,
            quantity: newQty,
            totalPrice: safeFloat(newQty * existingItem.unitPrice)
        };
        if (onUpdateTabItem) onUpdateTabItem(activeTabId, updatedItem);
        showFeedback(`+${quantity} ${product.name}`);
    } else {
        // Cria novo item se não existir correspondência
        const modPrice = modifier ? modifier.price : 0;
        const effectiveUnitPrice = safeFloat(product.price + modPrice);
        const newItem: SaleItem = { 
          id: generateUniqueId('it'), 
          productId: product.id, 
          productName: product.name, 
          category: product.category || 'GERAL', 
          quantity, 
          unitPrice: effectiveUnitPrice, 
          totalPrice: safeFloat(quantity * effectiveUnitPrice), 
          modifier 
        };
        if (onUpdateTabItem) onUpdateTabItem(activeTabId, newItem);
        showFeedback(`+${quantity} ${product.name}`);
    }
    // FIM DA ALTERAÇÃO

    setModifierModalData(null);
  }, [activeTabId, tabItems, onUpdateTabItem, showFeedback]);

  const addToTab = useCallback((product: Product, quantity: number = 1) => {
    if (!activeTabId) { showFeedback("ABRA UMA COMANDA PRIMEIRO!"); return; }
    if (product.sellType === 'weight') { setWeightModalProduct(product); return; }
    let groupId = product.modifierGroupId || (product.category ? categoryModifiers[product.category.toUpperCase()] : undefined);
    if (groupId) {
        const group = modifierGroups.find(g => g.id === groupId);
        if (group && group.options.length > 0) { setModifierModalData({ product, group, quantity }); return; }
    }
    executeAddItem(product, quantity);
  }, [activeTabId, categoryModifiers, modifierGroups, executeAddItem, showFeedback]);

  const updateItemQty = useCallback((index: number, delta: number) => {
    if (!activeTabId || !activeTab) return;
    const item = tabItems[index];
    const newQty = item.quantity + delta;
    const updatedItem: SaleItem = { ...item, quantity: newQty, totalPrice: safeFloat(newQty * item.unitPrice) };
    if (onUpdateTabItem) onUpdateTabItem(activeTabId, updatedItem);
  }, [activeTabId, activeTab, tabItems, onUpdateTabItem]);

  const processCompletion = (payments: any[]) => {
    const isShortcut = activeTabId === 'shortcut-payment';
    const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    
    // Se for quitação, cria o item especial de quitação para o histórico
    const items = isShortcut 
      ? [{ id: 'q1', productId: 'quitacao', productName: 'Quitação de Pendura', category: 'FIADO', quantity: 1, unitPrice: totalAmount, totalPrice: totalAmount }]
      : tabItems;

    const newSale: Sale = {
       id: generateUniqueId('sale'), 
       timestamp: Date.now(), 
       items,
       paymentMethod: payments.length === 1 ? payments[0].method : PaymentMethod.MULTIPLE,
       payments, 
       total: totalAmount, 
       tabName: isShortcut ? undefined : activeTab?.name, 
       customerName: isShortcut ? shortcutCheckout?.name : payments[0]?.customerName,
       userId: '', 
       shiftId: activeShift?.id || ''
    };
    
    onCompleteSale([newSale], !isShortcut ? activeTabId! : undefined);
    
    // Limpeza de estado
    setActiveTabId(null); 
    setIsClosingTab(false); 
    setShowMobileCart(false);
    if (isShortcut && onClearShortcut) onClearShortcut();
  };

  const handleConfirmDelete = () => {
    if (tabToDelete) {
       onDeleteTab(tabToDelete.id);
       if (activeTabId === tabToDelete.id) {
          setActiveTabId(null);
          setShowMobileCart(false);
       }
       setTabToDelete(null);
       showFeedback("COMANDA DESCARTADA");
    }
  };

  const handleBackFromPayment = () => {
     if (activeTabId === 'shortcut-payment') {
        setActiveTabId(null);
        if (onClearShortcut) onClearShortcut();
     }
     setIsClosingTab(false);
  };

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
         <div className="relative group">
            <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full group-hover:bg-red-600/30 transition-all"></div>
            <div className="w-48 h-48 bg-white dark:bg-slate-900 rounded-[50px] flex items-center justify-center border-4 border-slate-100 dark:border-slate-800 shadow-2xl relative z-10 rotate-3 transition-transform hover:rotate-6 hover:scale-105">
               <span className="text-8xl filter drop-shadow-lg">🍺</span>
            </div>
         </div>
         <div className="space-y-3 relative z-10">
            <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Bar Fechado!</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">O barril está descansando. Abra o turno para começar a festa.</p>
         </div>
         <button onClick={() => onViewChange && onViewChange('shifts')} className="bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all relative z-10">Abrir Turno</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 relative overflow-hidden">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] animate-bounce">
           <div className="bg-red-600 text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl">{toast}</div>
        </div>
      )}

      {!activeTabId ? (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Comandas Abertas</h2>
            {!isAddingTab && <button onClick={() => setIsAddingTab(true)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all">Abrir Mesa/Comanda</button>}
          </div>
          
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="NOME OU NÚMERO DA MESA..." className="flex-1 px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-xl outline-none" onKeyDown={e => e.key === 'Enter' && newTabName && (onSaveTab({id: generateUniqueId('tab'), name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}), setActiveTabId(null), setIsAddingTab(false))} />
              <button onClick={() => { if(newTabName){ onSaveTab({id: generateUniqueId('tab'), name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}); setNewTabName(''); setIsAddingTab(false); } }} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Confirmar</button>
            </div>
          )}

          {openTabs.length === 0 && !isAddingTab ? (
             <div className="flex flex-col items-center justify-center py-24 text-center opacity-60 animate-in slide-in-from-bottom-4">
                <div className="w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-inner">
                   <span className="text-6xl grayscale">🦗</span>
                </div>
                <h3 className="text-2xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter italic">Tudo calmo por aqui...</h3>
                <p className="text-sm font-bold text-slate-400 mt-2 tracking-wide">O turno está rodando. Abra a primeira mesa para começar!</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {openTabs.map(tab => (
                <div key={tab.id} className="relative group">
                  <div onClick={() => setActiveTabId(tab.id)} className="bg-white dark:bg-slate-900 p-6 rounded-[35px] border-2 border-slate-200 dark:border-slate-800 cursor-pointer hover:border-red-500 transition-all flex flex-col justify-between h-40 shadow-sm hover:shadow-xl">
                    <h3 className="font-black uppercase text-sm truncate">{tab.name}</h3>
                    <p className="font-black text-xl text-red-600 italic">
                      {formatCurrency(
                        (Array.isArray(tab.items) ? tab.items : (Object.values(tab.items || {}) as SaleItem[]))
                          .reduce((acc: number, item: SaleItem) => acc + (item.totalPrice || 0), 0)
                      )}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setTabToDelete(tab); }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 overflow-hidden">
           <div className={`${showMobileCart ? 'hidden lg:block' : 'block'} flex-1 overflow-y-auto no-scrollbar pb-24`}>
              <div className="flex items-center gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-[25px] border border-slate-200 dark:border-slate-800">
                 <button onClick={() => { setActiveTabId(null); if(activeTabId === 'shortcut-payment' && onClearShortcut) onClearShortcut(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                 </button>
                 <h2 className="text-xl font-black uppercase italic text-red-600">{activeTab?.name}</h2>
              </div>
              <POSProductGrid products={products} onAddProduct={addToTab} />
           </div>

           <div className={`${!showMobileCart ? 'hidden lg:flex' : 'fixed inset-0 z-[500] flex'} lg:relative w-full lg:w-[420px] flex-col bg-white dark:bg-slate-900 border-l-2 border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-300`}>
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                 <h3 className="font-black uppercase tracking-tighter italic">Itens na Comanda</h3>
                 <button onClick={() => setShowMobileCart(false)} className="lg:hidden p-2 bg-white/10 rounded-xl">✕</button>
              </div>

              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {tabItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 font-black uppercase text-[10px] italic opacity-50">Comanda Vazia</div>
                    ) : (
                      tabItems.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase leading-tight">{item.productName}</p>
                            {item.modifier && <p className="text-[9px] font-bold text-slate-400">+ {item.modifier.name}</p>}
                            <p className="text-[11px] font-black text-red-600 mt-1">{formatCurrency(item.totalPrice)}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                             <button onClick={() => updateItemQty(idx, -1)} className="w-8 h-8 font-black text-slate-400 hover:text-red-600">-</button>
                             <span className="text-xs font-black">{item.quantity}</span>
                             <button onClick={() => updateItemQty(idx, 1)} className="w-8 h-8 font-black text-slate-400 hover:text-emerald-600">+</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-8 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 space-y-3">
                     <div className="flex justify-between items-center text-2xl font-black italic tracking-tighter mb-2">
                        <span className="text-[10px] font-black uppercase not-italic text-slate-400">Total</span>
                        <span>{formatCurrency(tabTotal)}</span>
                     </div>
                     <button onClick={() => setIsClosingTab(true)} disabled={tabItems.length === 0} className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30">Fechar Conta</button>
                     <button onClick={() => setTabToDelete(activeTab!)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors">Descartar Mesa</button>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <POSPaymentPanel activeTabId={activeTabId} tabTotal={tabTotal} onBack={handleBackFromPayment} onComplete={processCompletion} shortcutCheckout={activeTabId === 'shortcut-payment' ? shortcutCheckout : null} />
                </div>
              )}
           </div>

           {activeTabId && !showMobileCart && !isClosingTab && (
             <button 
               onClick={() => setShowMobileCart(true)}
               className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-5 rounded-[30px] shadow-2xl flex items-center gap-4 z-[400] animate-in slide-in-from-bottom-10"
             >
                <div className="flex flex-col text-left">
                   <span className="text-[8px] font-black uppercase opacity-60">Ver Comanda</span>
                   <span className="text-lg font-black italic leading-none">{formatCurrency(tabTotal)}</span>
                </div>
                <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center font-black text-sm">{tabItems.length}</div>
             </button>
           )}
        </div>
      )}

      {tabToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setTabToDelete(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-[1010] text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Apagar "{tabToDelete.name}"?</h3>
             <p className="text-sm text-slate-500 mb-8 leading-relaxed">Esta ação é irreversível e removerá todos os itens desta mesa.</p>
             <div className="flex flex-col gap-3">
                <button onClick={handleConfirmDelete} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Sim, Descartar</button>
                <button onClick={() => setTabToDelete(null)} className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Manter Mesa</button>
             </div>
          </div>
        </div>
      )}

      <WeightModal product={weightModalProduct} onConfirm={(w) => { addToTab(weightModalProduct!, w); setWeightModalProduct(null); }} onClose={() => setWeightModalProduct(null)} showFeedback={showFeedback} />
      <UpsellModal data={modifierModalData} onConfirm={(opt) => modifierModalData && executeAddItem(modifierModalData.product, modifierModalData.quantity, opt)} onClose={() => setModifierModalData(null)} />
    </div>
  );
};

export default POS;