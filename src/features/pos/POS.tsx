
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, Unit, formatCurrency, generateUniqueId, ModifierGroup, ModifierOption, safeFloat, PRODUCT_ID_DEBT_SETTLEMENT, isHappyHourActive } from '../../types';
import { validateItemName } from '../../utils/wordValidator';
import WeightModal from './components/modals/WeightModal';
import UpsellModal from './components/modals/UpsellModal';
import POSProductGrid from './components/POSProductGrid';
import POSPaymentPanel from './components/POSPaymentPanel';
import { useProductIntelligence } from '../../hooks/useProductIntelligence';

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
  stockBalances?: Record<string, number>;
  sales?: Sale[];
  activeUnit?: Unit;
  isEventMode?: boolean;
  setIsEventMode?: (val: boolean) => void;
}

const formatElapsedTime = (openedAt: number) => {
  const diff = Date.now() - openedAt;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
};

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
  stockTransactions = [],
  stockBalances = {},
  sales = [],
  activeUnit,
  isEventMode: propIsEventMode,
  setIsEventMode: propSetIsEventMode
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [isRenamingTab, setIsRenamingTab] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [isWideMode, setIsWideMode] = useState(false);
  const [localIsEventMode, localSetIsEventMode] = useState(false);
  const isEventMode = propIsEventMode !== undefined ? propIsEventMode : localIsEventMode;
  const setIsEventMode = propSetIsEventMode !== undefined ? propSetIsEventMode : localSetIsEventMode;
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [modifierModalData, setModifierModalData] = useState<{ product: Product, group: ModifierGroup, quantity: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tabToDelete, setTabToDelete] = useState<Tab | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (shortcutCheckout) {
      setActiveTabId('shortcut-payment');
      setIsClosingTab(true);
      setShowMobileCart(true);
    }
  }, [shortcutCheckout]);

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
    if (isEventMode && !activeTabId) {
      handleQuickSale();
    }
  }, [isEventMode, activeTabId]);

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

  const { insights } = useProductIntelligence(products, sales, stockBalances);
    
  const tabItems: SaleItem[] = useMemo(() => {
    if (!activeTab?.items) return [];
    const items = activeTab.items;
    return (Array.isArray(items) ? items : (Object.values(items) as SaleItem[]));
  }, [activeTab]);

  const tabTotal = useMemo(() => {
    if (activeTabId === 'shortcut-payment' && shortcutCheckout) return shortcutCheckout.amount;
    return tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  }, [activeTabId, shortcutCheckout, tabItems]);
  
  const serviceTaxAmount = useMemo(() => {
    if (activeUnit?.serviceTaxEnabled && activeUnit.serviceTaxPercentage && activeTabId !== 'shortcut-payment') {
        return safeFloat(tabTotal * (activeUnit.serviceTaxPercentage / 100));
    }
    return 0;
  }, [tabTotal, activeUnit, activeTabId]);

  const grandTotal = safeFloat(tabTotal + serviceTaxAmount);

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
            totalPrice: safeFloat(newQty * existingItem.unitPrice),
            ...(product.toKitchen ? { productionStatus: 'PENDING' } : {})
        };
        if (onUpdateTabItem) await onUpdateTabItem(activeTabId, updatedItem);
        showFeedback(`+${quantity} ${product.name}`);
    } else {
        const isHH = isHappyHourActive(product);
        const basePrice = isHH && product.happyHourPrice ? product.happyHourPrice : product.price;
        const modPrice = modifier ? modifier.price : 0;
        const effectiveUnitPrice = safeFloat(basePrice + modPrice);
        const newItem: SaleItem = { 
          id: generateUniqueId('it'), 
          productId: product.id, 
          productName: product.name, 
          category: product.category || 'GERAL', 
          quantity, 
          unitPrice: effectiveUnitPrice, 
          totalPrice: safeFloat(quantity * effectiveUnitPrice), 
          costPrice: product.lastCostPrice,
          modifier,
          ...(product.toKitchen ? { productionStatus: 'PENDING' } : {})
        };
        if (onUpdateTabItem) await onUpdateTabItem(activeTabId, newItem);
        showFeedback(`+${quantity} ${product.name}`);
    }

    setModifierModalData(null);
  }, [activeTabId, tabItems, onUpdateTabItem, showFeedback, activeTab, onSaveTab]);

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
    if (newQty <= 0) {
       // Opcional: remover item se chegar a zero? Por enquanto mantemos como o original.
    }
    const prod = products.find(p => p.id === item.productId);
    const updatedItem: SaleItem = { 
      ...item, 
      quantity: newQty, 
      totalPrice: safeFloat(newQty * item.unitPrice),
      ...(prod?.toKitchen && delta > 0 ? { productionStatus: 'PENDING' } : {})
    };
    if (onUpdateTabItem) await onUpdateTabItem(activeTabId, updatedItem);
  }, [activeTabId, activeTab, tabItems, onUpdateTabItem, products]);

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
       shiftId: activeShift?.id || '',
       serviceTax: serviceTaxAmount > 0 ? serviceTaxAmount : undefined
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
            <div className="flex w-full sm:w-auto gap-3 items-center flex-wrap sm:flex-nowrap">
              <button onClick={() => setShowShortcutsModal(true)} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold uppercase text-[10px] tracking-widest transition-colors mr-2">
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">?</span>
                <span className="hidden md:inline">Atalhos</span>
              </button>
              
              <button 
                onClick={() => setIsEventMode(!isEventMode)}
                className={`flex items-center gap-2 px-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-2 ${isEventMode ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400'}`}
              >
                <span>🎉</span>
                <span className="hidden md:inline">Modo Evento</span>
              </button>

              <button onClick={handleQuickSale} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-2">
                <span>⚡</span>
                <span className="hidden sm:inline">Venda Rápida</span>
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
                
                const idleLimit = (longDurationThreshold || 30) * 60 * 1000;
                const lastActivity = tab.lastItemAddedAt || tab.openedAt;
                const isIdle = Date.now() - lastActivity > idleLimit;
                const isVeryIdle = Date.now() - lastActivity > idleLimit * 2;

                const tabItemsList = Array.isArray(tab.items) ? tab.items : (Object.values(tab.items || {}) as SaleItem[]);
                const hasReadyItems = tabItemsList.some(item => item.productionStatus === 'READY');

                return (
                  <div key={tab.id} className="relative group">
                    <div onClick={() => setActiveTabId(tab.id)} className={`p-6 rounded-[35px] border-2 cursor-pointer transition-all flex flex-col justify-between h-40 shadow-sm hover:shadow-xl 
                       ${isExpress ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-500' : 
                         isVeryIdle ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900 animate-pulse' :
                         isIdle ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900 border-dashed' :
                         'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-500'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col min-w-0 max-w-[80%]">
                           <div className="flex items-center gap-2">
                              <h3 className="font-black uppercase text-sm truncate">{tab.name}</h3>
                              {hasReadyItems && (
                                 <span className="animate-bounce bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 p-1 rounded-lg text-xs leading-none shrink-0" title="Prato Pronto! 🛎️">🛎️</span>
                              )}
                           </div>
                           <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                 <span className="text-[10px] font-bold text-slate-500 opacity-70" title="Tempo total aberta">{formatElapsedTime(tab.openedAt)}</span>
                                 {isIdle && (
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isVeryIdle ? 'text-red-600' : 'text-amber-600'}`} title={isVeryIdle ? "Mesa sem atividade prolongada (crítico)" : "Mesa sem pedidos recentes"}>
                                       {isVeryIdle ? '⚠️ TRAVADA' : 'OCIOSA'}
                                    </span>
                                 )}
                              </div>
                              {isIdle && (
                                 <span className="text-[7px] font-black text-slate-400 uppercase opacity-80">
                                    Último pedido há {formatElapsedTime(lastActivity)}
                                 </span>
                              )}
                           </div>
                        </div>
                        {isExpress && <span className="text-[8px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded ml-1">⚡</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className={`font-black text-xl italic ${isExpress ? 'text-emerald-600' : isIdle ? (isVeryIdle ? 'text-red-600' : 'text-amber-600') : 'text-red-600'}`}>
                          {formatCurrency(
                            (Array.isArray(tab.items) ? tab.items : (Object.values(tab.items || {}) as SaleItem[]))
                              .reduce((acc: number, item: SaleItem) => acc + (item.totalPrice || 0), 0)
                          )}
                        </p>
                        {isVeryIdle && (
                          <span className="text-[7px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full w-fit animate-bounce mt-1">
                             SUGERIR SAIDEIRA 🍻
                          </span>
                        )}
                      </div>
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
            {!isClosingTab && (
              <div className={`${showMobileCart ? 'hidden lg:block' : 'block'} flex-1 overflow-y-auto no-scrollbar pb-24`}>
                 <div className="flex items-center gap-3 mb-6 bg-white dark:bg-slate-900 p-3 rounded-[20px] border border-slate-200 dark:border-slate-800">
                     <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if(activeTabId === 'shortcut-payment' && onClearShortcut) onClearShortcut(); }} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                     </button>
                     
                     <div className="flex-1 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center text-red-600 font-bold text-xs italic">
                           {activeTab?.name.substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Mesa Selecionada</span>
                           <h2 className={`text-sm font-black uppercase italic leading-none ${activeTab?.name.startsWith('EXPRESSA') ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}`}>
                              {activeTab?.name}
                           </h2>
                        </div>
                     </div>

                     <button onClick={() => setIsWideMode(!isWideMode)} className={`hidden lg:flex w-10 h-10 items-center justify-center rounded-xl transition-all ${isWideMode ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`} title="Alternar Largura">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                     </button>
                  </div>
                 <POSProductGrid products={products} onAddProduct={addToTab} stockTransactions={stockTransactions} insights={insights} />
              </div>
            )}

            <div className={`${!showMobileCart && !isClosingTab ? 'hidden lg:flex' : 'fixed inset-0 z-[500] flex'} lg:relative ${isClosingTab ? 'flex-1' : (isWideMode ? 'lg:w-[850px]' : 'lg:w-[420px]')} flex-col bg-white dark:bg-slate-900 border-l-2 border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-300 transition-all overflow-hidden`}>
              <div className={`p-6 text-white flex justify-between items-center shrink-0 ${activeTab?.name.startsWith('EXPRESSA') ? 'bg-emerald-700' : 'bg-slate-900'}`}>
                 <div className="flex items-center gap-2">
                    <h3 className="font-black uppercase tracking-tighter italic">{isClosingTab ? `Fechamento: ${activeTab?.name}` : 'Itens na Comanda'}</h3>
                    {activeTab?.name.startsWith('EXPRESSA') && <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded">MODO RÁPIDO</span>}
                 </div>
                 <button onClick={() => { setIsClosingTab(false); setShowMobileCart(false); }} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">✕</button>
              </div>

              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1.5 no-scrollbar min-h-0">
                    {tabItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 font-black uppercase text-[10px] italic opacity-50">Comanda Vazia</div>
                    ) : (
                      <div className={`grid ${isWideMode && !isClosingTab ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
                        {tabItems.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between items-center group transition-all hover:border-red-500/30">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-[10px] font-black uppercase leading-tight truncate text-slate-800 dark:text-slate-200">{item.productName}</p>
                              {item.modifier && <p className="text-[8px] font-bold text-slate-400 truncate leading-none mt-0.5">({item.modifier.name})</p>}
                              <p className="text-[9px] font-black text-red-600 mt-0.5">{formatCurrency(item.totalPrice)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                               <button onClick={() => updateItemQty(idx, -1)} className="w-5 h-5 flex items-center justify-center font-black text-slate-400 hover:text-red-600 transition-colors">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M20 12H4" /></svg>
                               </button>
                               <span className="text-[9px] font-black min-w-[10px] text-center">{item.quantity}</span>
                               <button onClick={() => updateItemQty(idx, 1)} className="w-5 h-5 flex items-center justify-center font-black text-slate-400 hover:text-emerald-600 transition-colors">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M12 4v16m8-8H4" /></svg>
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 space-y-3 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                      <div className="flex justify-between items-end">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Consumido</span>
                            <span className="text-2xl font-black italic tracking-tighter leading-none">{formatCurrency(tabTotal)}</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Itens</span>
                            <span className="text-xl font-black italic text-red-600 leading-none">{tabItems.length}</span>
                         </div>
                      </div>
                      
                      <button onClick={() => setIsClosingTab(true)} disabled={tabItems.length === 0} className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30 text-white ${activeTab?.name.startsWith('EXPRESSA') ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>Fechar Conta</button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleSaideira} disabled={tabItems.length === 0} className="py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-black uppercase text-[7px] tracking-widest hover:border-emerald-500 transition-all flex items-center justify-center gap-1 opacity-70 hover:opacity-100">
                           <span>🍻</span> <span>Saideira</span>
                        </button>
                        <button onClick={() => setTabToDelete(activeTab!)} className="py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-black uppercase text-[7px] tracking-widest hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center gap-1 opacity-70 hover:opacity-100">
                           <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
                           Anular
                        </button>
                      </div>
                   </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    <POSPaymentPanel activeTabId={activeTabId} tabTotal={grandTotal} serviceTax={serviceTaxAmount} onBack={() => setIsClosingTab(false)} onComplete={processCompletion} shortcutCheckout={shortcutCheckout} />
                  </div>
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
      
      {/* Modal de Atalhos */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowShortcutsModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">⌨️ Atalhos do PDV</h3>
               <button onClick={() => setShowShortcutsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors font-bold">✕</button>
             </div>
             
             <div className="space-y-4">
               {[
                 { key: 'F1', desc: 'Iniciar Venda Rápida' },
                 { key: 'F2', desc: 'Abrir Mesa' },
                 { key: 'ESPAÇO', desc: 'Fechar Conta (Tela de Pagamento)' },
                 { key: 'ESC', desc: 'Cancelar / Voltar' },
               ].map((shortcut, idx) => (
                 <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{shortcut.desc}</span>
                    <span className="px-3 py-1 bg-white dark:bg-slate-950 text-slate-800 dark:text-emerald-400 font-black rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 tracking-widest text-[10px]">{shortcut.key}</span>
                 </div>
               ))}
             </div>
             
             <button onClick={() => setShowShortcutsModal(false)} className="w-full mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Entendi</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
