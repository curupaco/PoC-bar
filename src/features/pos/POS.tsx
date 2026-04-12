
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency, generateUniqueId, ModifierGroup, ModifierOption, safeFloat, PRODUCT_ID_DEBT_SETTLEMENT } from '../../types';
import { validateItemName } from '../../utils/wordValidator';
import WeightModal from './components/modals/WeightModal';
import UpsellModal from './components/modals/UpsellModal';
import POSProductGrid from './components/POSProductGrid';
import POSPaymentPanel from './components/POSPaymentPanel';

interface POSProps {
  products: Product[];
  modifierGroups: ModifierGroup[];
  categoryModifiers: Record<string, string>;
  openTabs: Tab[];
  onSaveTab: (tab: Tab) => Promise<void>;
  onUpdateTabItem?: (tabId: string, item: SaleItem) => Promise<void>; 
  onDeleteTab: (id: string) => Promise<void>;
  onCompleteSale: (sales: Sale[], tabIdToClose?: string) => Promise<void>; 
  shortcutCheckout?: { name: string; amount: number } | null;
  onClearShortcut?: () => void;
  activeShift?: Shift;
  onViewChange?: (view: any) => void;
  dbStatus?: string;
  penduraThreshold?: number;
  longDurationThreshold?: number;
  stockTransactions?: any[];
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
  onViewChange,
  dbStatus,
  penduraThreshold = 500,
  longDurationThreshold = 4,
  stockTransactions = []
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [isRenamingTab, setIsRenamingTab] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [modifierModalData, setModifierModalData] = useState<{ product: Product, group: ModifierGroup, quantity: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tabToDelete, setTabToDelete] = useState<Tab | null>(null);

  useEffect(() => {
    if (shortcutCheckout) {
      setActiveTabId('shortcut-payment');
      setIsClosingTab(true);
      setShowMobileCart(true);
    }
  }, [shortcutCheckout]);

  // ITEM 8: ATALHOS DE TECLADO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'F1': e.preventDefault(); handleQuickSale(); break;
        case 'F2': e.preventDefault(); setIsAddingTab(true); break;
        case 'Escape': e.preventDefault(); setActiveTabId(null); setIsAddingTab(false); break;
        case ' ': if (activeTabId && !isClosingTab) { e.preventDefault(); setIsClosingTab(true); } break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, isClosingTab]);

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

  const executeAddItem = useCallback(async (product: Product, quantity: number, modifier?: ModifierOption) => {
    if (!activeTabId) return;

    const existingItem = tabItems.find(item => 
        item.productId === product.id && 
        (
            (!item.modifier && !modifier) || 
            (item.modifier && modifier && item.modifier.name === modifier.name && item.modifier.price === modifier.price)
        )
    );

    if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        const updatedItem: SaleItem = {
            ...existingItem,
            quantity: newQty,
            totalPrice: safeFloat(newQty * existingItem.unitPrice)
        };
        if (onUpdateTabItem) await onUpdateTabItem(activeTabId, updatedItem);
        showFeedback(`+${quantity} ${product.name}`);
    } else {
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
        if (onUpdateTabItem) await onUpdateTabItem(activeTabId, newItem);
        showFeedback(`+${quantity} ${product.name}`);
    }

    setModifierModalData(null);
  }, [activeTabId, tabItems, onUpdateTabItem, showFeedback, activeTab, onSaveTab]);

  // ITEM 4: BOTÃO SAIDEIRA
  const handleSaideira = async () => {
    if (!activeTabId || tabItems.length === 0) return;
    const lastItem = tabItems[tabItems.length - 1];
    const product = products.find(p => p.id === lastItem.productId);
    if (product) {
       await executeAddItem(product, lastItem.quantity, lastItem.modifier);
       showFeedback("SAIDEIRA ADICIONADA! 🍻");
    }
  };

  const addToTab = useCallback(async (product: Product, quantity: number = 1) => {
    if (!activeTabId) { showFeedback("ABRA UMA COMANDA PRIMEIRO!"); return; }
    if (product.sellType === 'weight') { setWeightModalProduct(product); return; }
    let groupId = product.modifierGroupId || (product.category ? categoryModifiers[product.category.toUpperCase()] : undefined);
    if (groupId) {
        const group = modifierGroups.find(g => g.id === groupId);
        if (group && group.options.length > 0) { setModifierModalData({ product, group, quantity }); return; }
    }
    await executeAddItem(product, quantity);
  }, [activeTabId, categoryModifiers, modifierGroups, executeAddItem, showFeedback]);

  const updateItemQty = useCallback(async (index: number, delta: number) => {
    if (!activeTabId || !activeTab) return;
    const item = tabItems[index];
    const newQty = item.quantity + delta;
    const updatedItem: SaleItem = { ...item, quantity: newQty, totalPrice: safeFloat(newQty * item.unitPrice) };
    if (onUpdateTabItem) await onUpdateTabItem(activeTabId, updatedItem);
  }, [activeTabId, activeTab, tabItems, onUpdateTabItem]);

  const handleQuickSale = async () => {
    const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const expressName = `EXPRESSA #${shortId}`;
    const newTabId = generateUniqueId('tab-express');
    
    await onSaveTab({
      id: newTabId,
      name: expressName,
      items: [],
      openedAt: Date.now()
    });
    
    setActiveTabId(newTabId);
    showFeedback("VENDA RÁPIDA INICIADA ⚡");
  };

  const handleRenameTab = async () => {
    const finalName = newTabName.toUpperCase().trim();
    const tError = validateItemName(finalName);
    if (tError) { showFeedback(tError); return; }

    const updatedTab: Tab = {
      ...activeTab!,
      name: finalName
    };
    await onSaveTab(updatedTab);
    setNewTabName('');
    setIsRenamingTab(false);
    showFeedback("COMANDA RENOMEADA");
  };

  const processCompletion = async (payments: any[]) => {
    const isShortcut = activeTabId === 'shortcut-payment';
    const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    
    const items = isShortcut 
      ? [{ id: 'q1', productId: PRODUCT_ID_DEBT_SETTLEMENT, productName: 'Quitação de Pendura', category: 'FIADO', quantity: 1, unitPrice: totalAmount, totalPrice: totalAmount }]
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
    
    await onCompleteSale([newSale], !isShortcut ? activeTabId! : undefined);
    
    setActiveTabId(null); 
    setIsClosingTab(false); 
    setShowMobileCart(false);
    if (isShortcut && onClearShortcut) onClearShortcut();
  };

  const handleConfirmDelete = async () => {
    if (tabToDelete) {
       await onDeleteTab(tabToDelete.id);
       if (activeTabId === tabToDelete.id) {
          setActiveTabId(null);
          setShowMobileCart(false);
       }
       setTabToDelete(null);
       showFeedback("COMANDA DESCARTADA");
    }
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 animate-in fade-in p-1">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Vendas</h2>
            <div className="flex w-full sm:w-auto gap-3">
              <button onClick={handleQuickSale} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2">
                <span>⚡</span>
                <span>Venda Rápida</span>
              </button>
              <button onClick={() => setIsAddingTab(true)} className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all">Abrir Mesa</button>
            </div>
          </div>
          
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input 
                autoFocus 
                value={newTabName} 
                onChange={e => setNewTabName(e.target.value)} 
                placeholder="NOME OU NÚMERO DA MESA..." 
                className="flex-1 px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-xl outline-none" 
                onKeyDown={async e => {
                  if (e.key === 'Enter' && newTabName) {
                    const finalName = newTabName.toUpperCase().trim();
                    const tError = validateItemName(finalName);
                    if (tError) { showFeedback(tError); return; }
                    
                    await onSaveTab({ id: generateUniqueId('tab'), name: finalName, items: [], openedAt: Date.now() });
                    setActiveTabId(null);
                    setIsAddingTab(false);
                    setNewTabName('');
                  }
                }} 
              />
              <div className="flex gap-2">
                <button 
                  onClick={async () => { 
                    const finalName = newTabName.toUpperCase().trim();
                    if (finalName) { 
                      const tError = validateItemName(finalName);
                      if (tError) { showFeedback(tError); return; }
                      await onSaveTab({ id: generateUniqueId('tab'), name: finalName, items: [], openedAt: Date.now() }); 
                      setNewTabName(''); 
                      setIsAddingTab(false); 
                    } 
                  }} 
                  className="flex-1 bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
                >
                  Confirmar
                </button>
                <button onClick={() => { setIsAddingTab(false); setNewTabName(''); }} className="px-6 py-4 rounded-2xl font-black uppercase text-xs text-slate-400">Cancelar</button>
              </div>
            </div>
          )}

          {openTabs.length === 0 && !isAddingTab ? (
             <div className="flex flex-col items-center justify-center py-24 text-center opacity-60 animate-in slide-in-from-bottom-4">
                <div className="w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-inner">
                   <span className="text-6xl grayscale">🦗</span>
                </div>
                <h3 className="text-2xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter italic">Tudo calmo por aqui...</h3>
                <p className="text-sm font-bold text-slate-400 mt-2 tracking-wide">O turno está rodando. Use a venda rápida para agilizar!</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {openTabs.map(tab => {
                const isExpress = tab.name.startsWith('EXPRESSA');
                
                // ITEM 7: SINALIZAÇÃO DE MESA OCIOSA
                const idleLimit = (longDurationThreshold || 30) * 60 * 1000;
                const lastActivity = tab.lastItemAddedAt || tab.openedAt;
                const isIdle = Date.now() - lastActivity > idleLimit;
                const isVeryIdle = Date.now() - lastActivity > idleLimit * 2;

                return (
                  <div key={tab.id} className="relative group">
                    <div onClick={() => setActiveTabId(tab.id)} className={`p-6 rounded-[35px] border-2 cursor-pointer transition-all flex flex-col justify-between h-40 shadow-sm hover:shadow-xl 
                       ${isExpress ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-500' : 
                         isVeryIdle ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900 animate-pulse' :
                         isIdle ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900 border-dashed' :
                         'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-500'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                           <h3 className="font-black uppercase text-sm truncate">{tab.name}</h3>
                           {isIdle && <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-0.5">{isVeryIdle ? 'MESA OCIOSA ++' : 'OCIOSA'}</span>}
                        </div>
                        {isExpress && <span className="text-[8px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded ml-1">⚡</span>}
                      </div>
                      <p className={`font-black text-xl italic ${isExpress ? 'text-emerald-600' : isIdle ? 'text-amber-600' : 'text-red-600'}`}>
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
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 overflow-hidden">
           <div className={`${showMobileCart ? 'hidden lg:block' : 'block'} flex-1 overflow-y-auto no-scrollbar pb-24`}>
              <div className="flex items-center gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-[25px] border border-slate-200 dark:border-slate-800">
                 <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if(activeTabId === 'shortcut-payment' && onClearShortcut) onClearShortcut(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                 </button>
                 
                 {isRenamingTab ? (
                    <div className="flex-1 flex gap-2">
                       <input 
                          autoFocus
                          value={newTabName}
                          onChange={e => setNewTabName(e.target.value)}
                          placeholder="NOVO NOME..."
                          className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl font-black uppercase outline-none border-2 border-red-500"
                          onKeyDown={e => e.key === 'Enter' && handleRenameTab()}
                       />
                       <button onClick={handleRenameTab} className="bg-red-600 text-white px-4 rounded-xl font-black text-[10px] uppercase">OK</button>
                       <button onClick={() => setIsRenamingTab(false)} className="text-slate-400 font-black text-[10px] uppercase px-2">X</button>
                    </div>
                 ) : (
                    <div className="flex-1 flex items-center gap-2">
                       <h2 className={`text-xl font-black uppercase italic ${activeTab?.name.startsWith('EXPRESSA') ? 'text-emerald-600' : 'text-red-600'}`}>
                          {activeTab?.name}
                       </h2>
                       {activeTabId !== 'shortcut-payment' && (
                          <button onClick={() => { setNewTabName(activeTab?.name || ''); setIsRenamingTab(true); }} className="text-slate-300 hover:text-slate-600 transition-colors p-1">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                       )}
                    </div>
                 )}
              </div>
              <POSProductGrid products={products} onAddProduct={addToTab} stockTransactions={stockTransactions} />
           </div>

           <div className={`${!showMobileCart ? 'hidden lg:flex' : 'fixed inset-0 z-[500] flex'} lg:relative w-full lg:w-[420px] flex-col bg-white dark:bg-slate-900 border-l-2 border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-300`}>
              <div className={`p-6 text-white flex justify-between items-center shrink-0 ${activeTab?.name.startsWith('EXPRESSA') ? 'bg-emerald-700' : 'bg-slate-900'}`}>
                 <div className="flex items-center gap-2">
                    <h3 className="font-black uppercase tracking-tighter italic">Itens na Comanda</h3>
                    {activeTab?.name.startsWith('EXPRESSA') && <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded">MODO RÁPIDO</span>}
                 </div>
                 <button onClick={() => setShowMobileCart(false)} className="lg:hidden p-2 bg-white/10 rounded-xl">✕</button>
              </div>

              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                      <button onClick={() => setIsClosingTab(true)} disabled={tabItems.length === 0} className={`w-full py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30 text-white ${activeTab?.name.startsWith('EXPRESSA') ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>Fechar Conta</button>
                      <button onClick={handleSaideira} disabled={tabItems.length === 0} className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-emerald-500 transition-all flex items-center justify-center gap-2">
                        <span>🍻</span>
                        <span>Repetir Saideira</span>
                      </button>
                     <button onClick={() => setTabToDelete(activeTab!)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
                        Descartar Venda
                     </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <POSPaymentPanel activeTabId={activeTabId} tabTotal={tabTotal} onBack={() => setIsClosingTab(false)} onComplete={processCompletion} shortcutCheckout={activeTabId === 'shortcut-payment' ? shortcutCheckout : null} />
                </div>
              )}
           </div>

           {activeTabId && !showMobileCart && !isClosingTab && (
             <button 
               onClick={() => setShowMobileCart(true)}
               className={`lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 text-white px-8 py-5 rounded-[30px] shadow-2xl flex items-center gap-4 z-[400] animate-in slide-in-from-bottom-10 ${activeTab?.name.startsWith('EXPRESSA') ? 'bg-emerald-900' : 'bg-slate-900'}`}
             >
                <div className="flex flex-col text-left">
                   <span className="text-[8px] font-black uppercase opacity-60">Ver Carrinho</span>
                   <span className="text-lg font-black italic leading-none">{formatCurrency(tabTotal)}</span>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${activeTab?.name.startsWith('EXPRESSA') ? 'bg-emerald-500' : 'bg-red-600'}`}>{tabItems.length}</div>
             </button>
           )}
        </div>
      )}

      {tabToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setTabToDelete(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-[1010] text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Anular Venda?</h3>
             <p className="text-sm text-slate-500 mb-8 leading-relaxed">Você está prestes a descartar "{tabToDelete.name}". Esta ação é irreversível.</p>
             <div className="flex flex-col gap-3">
                <button onClick={handleConfirmDelete} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Sim, Descartar</button>
                <button onClick={() => setTabToDelete(null)} className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      <WeightModal product={weightModalProduct} onConfirm={(w) => { executeAddItem(weightModalProduct!, w); setWeightModalProduct(null); }} onClose={() => setWeightModalProduct(null)} showFeedback={showFeedback} />
      <UpsellModal data={modifierModalData} onConfirm={(opt) => modifierModalData && executeAddItem(modifierModalData.product, modifierModalData.quantity, opt)} onClose={() => setModifierModalData(null)} />
    </div>
  );
};

export default POS;
