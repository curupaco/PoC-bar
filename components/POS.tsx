import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  onSaveTab: (tab: Tab) => void;
  onUpdateTabItem?: (tabId: string, item: SaleItem) => void; 
  onDeleteTab: (id: string) => void;
  onCompleteSale: (sale: Sale | Sale[], tabIdToClose?: string) => void; 
  shortcutCheckout?: { name: string; amount: number } | null;
  onClearShortcut?: () => void;
  activeShift?: Shift;
  onViewChange?: (view: any) => void;
  theme?: string;
  dbStatus?: string;
}

const POS: React.FC<POSProps> = ({ 
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
  dbStatus
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isClosingTab, setIsClosingTab] = useState(false);
  
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
  
  const [modifierModalData, setModifierModalData] = useState<{ product: Product, group: ModifierGroup, quantity: number } | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ tabId: string, itemId: string, prevQty: number } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Limpa o botão de desfazer após 5 segundos
  useEffect(() => {
    if (lastAction) {
      const t = setTimeout(() => setLastAction(null), 5000);
      return () => clearTimeout(t);
    }
  }, [lastAction]);

  const showFeedback = useCallback((msg: string) => setToast(msg), []);

  useEffect(() => {
    setIsClosingTab(false);
    setShowMobileCart(false);
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
  const tabTotal = useMemo(() => shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0), [shortcutCheckout, tabItems]);

  const handleQuickDelete = useCallback((tabId: string, name: string) => {
    setDeleteConfirmId({ id: tabId, name });
  }, []);

  const handleUndo = () => {
    if (!lastAction) return;
    const { tabId, itemId, prevQty } = lastAction;
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;

    const item = tab.items.find(i => i.id === itemId);
    if (item) {
      const updatedItem = { 
        ...item, 
        quantity: prevQty, 
        totalPrice: safeFloat(prevQty * item.unitPrice) 
      };
      if (onUpdateTabItem) {
        onUpdateTabItem(tabId, updatedItem);
      }
      showFeedback("AÇÃO REVERTIDA");
    }
    setLastAction(null);
  };

  const executeAddItem = useCallback((product: Product, quantity: number, modifier?: ModifierOption) => {
    if (!activeTab) return;

    const items = [...(activeTab.items ?? [])];
    const modPrice = modifier ? modifier.price : 0;
    const effectiveUnitPrice = safeFloat(product.price + modPrice);

    if (editingWeightIndex !== null) {
      const currentItem = items[editingWeightIndex];
      const prevQty = currentItem.quantity;
      const newItem = { 
        ...currentItem, 
        quantity: quantity, 
        totalPrice: safeFloat(quantity * currentItem.unitPrice)
      };
      
      if (onUpdateTabItem) {
          onUpdateTabItem(activeTabId!, newItem);
          setLastAction({ tabId: activeTabId!, itemId: newItem.id, prevQty });
      } else {
          items[editingWeightIndex] = newItem;
          onSaveTab({ ...activeTab, items });
      }
      showFeedback(`${product.name} ATUALIZADO`);
    } else {
      const existingItem = items.find(i => 
         i.productId === product.id && 
         (i.modifier?.name === modifier?.name)
      );

      if (existingItem && product.sellType === 'unit') {
        const prevQty = existingItem.quantity;
        const newQty = existingItem.quantity + quantity;
        const updatedItem = { 
           ...existingItem, 
           quantity: newQty, 
           totalPrice: safeFloat(newQty * effectiveUnitPrice)
        };
        
        if (onUpdateTabItem) {
            onUpdateTabItem(activeTabId!, updatedItem);
            setLastAction({ tabId: activeTabId!, itemId: updatedItem.id, prevQty });
        } else {
            const idx = items.indexOf(existingItem);
            items[idx] = updatedItem;
            onSaveTab({ ...activeTab, items });
        }
        showFeedback(`+1 ${product.name}`);
      } else {
        const newItem: SaleItem = { 
          id: generateUniqueId('it'),
          productId: product.id, 
          productName: product.name, 
          category: product.category || 'GERAL',
          quantity: quantity, 
          unitPrice: effectiveUnitPrice, 
          totalPrice: safeFloat(quantity * effectiveUnitPrice),
          modifier: modifier 
        };
        
        if (onUpdateTabItem) {
            onUpdateTabItem(activeTabId!, newItem);
            setLastAction({ tabId: activeTabId!, itemId: newItem.id, prevQty: 0 });
        } else {
            items.push(newItem);
            onSaveTab({ ...activeTab, items });
        }
        showFeedback(`${product.name} ADICIONADO`);
      }
    }

    setEditingWeightIndex(null);
    setWeightModalProduct(null);
    setModifierModalData(null);
  }, [activeTab, activeTabId, editingWeightIndex, onSaveTab, onUpdateTabItem, showFeedback]);

  const addToTab = useCallback((product: Product, quantity: number = 1, weightConfirmed: boolean = false) => {
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
  }, [activeTabId, editingWeightIndex, categoryModifiers, modifierGroups, executeAddItem]);

  const updateItemQty = useCallback((index: number, delta: number) => {
    if (!activeTab) return;
    const items = [...activeTab.items];
    const item = items[index];
    const prod = products.find(p => p.id === item.productId);
    
    if (prod?.sellType === 'weight' && delta === 0) {
       setWeightModalProduct(prod);
       setEditingWeightIndex(index);
       return;
    }

    const prevQty = item.quantity;
    const newQty = item.quantity + delta;
    const updatedItem = { ...item, quantity: newQty, totalPrice: safeFloat(newQty * item.unitPrice) };

    if (newQty <= 0) {
       showFeedback(`${item.productName} REMOVIDO`);
    } else {
       showFeedback(`${item.productName}: ${newQty}x`);
    }
    
    if (onUpdateTabItem) {
        onUpdateTabItem(activeTabId!, updatedItem);
        setLastAction({ tabId: activeTabId!, itemId: updatedItem.id, prevQty });
    } else {
        if (newQty <= 0) items.splice(index, 1);
        else items[index] = updatedItem;
        onSaveTab({ ...activeTab, items });
    }
  }, [activeTab, activeTabId, products, onSaveTab, onUpdateTabItem, showFeedback]);

  const processCompletion = useCallback((payments: { method: PaymentMethod, amount: number, customerName?: string }[]) => {
    const isShortcut = activeTabId === 'shortcut-payment';
    const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    const mainMethod = payments.length === 1 ? payments[0].method : PaymentMethod.MULTIPLE;
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
       payments: payments,
       total: totalAmount,
       tabName: activeTab.name,
       customerName: customerName,
       userId: '', 
       shiftId: activeShift?.id || ''
    };

    const tabIdToClose = !isShortcut ? activeTabId! : undefined;
    onCompleteSale([newSale], tabIdToClose);

    if (isShortcut && onClearShortcut) onClearShortcut();
    
    setActiveTabId(null);
    setIsClosingTab(false);
    showFeedback("VENDA FINALIZADA");
    setLastAction(null);
  }, [activeTab, activeTabId, activeShift, tabItems, shortcutCheckout, onCompleteSale, onClearShortcut, showFeedback]);

  const createTab = () => {
    if (newTabName.trim()) {
        const nid = generateUniqueId('tab');
        onSaveTab({id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()});
        setActiveTabId(nid);
        setNewTabName('');
        setIsAddingTab(false);
    }
  };

  if (!activeShift) {
    if (dbStatus === 'loading' || dbStatus === 'idle') {
       return (
         <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Validando turno ativo...</p>
         </div>
       );
    }

    if (dbStatus === 'error' || dbStatus === 'offline') {
       return (
         <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="max-w-xs mx-auto">
               <h3 className="text-xl font-black uppercase italic">Conexão Instável</h3>
               <p className="text-slate-500 text-sm mt-2">Não conseguimos validar o turno. Tente atualizar a página ou verificar sua internet.</p>
            </div>
         </div>
       );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in fade-in duration-700">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-red-600/10 rounded-[40px] md:rounded-[60px] flex items-center justify-center border border-red-500/20 shadow-xl">
          <svg className="w-16 h-16 md:w-20 md:h-20 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
        <div className="max-w-xs md:max-w-md space-y-3">
           <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Abrir Turno</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-base md:text-lg px-4">O caixa está encerrado. Inicie um novo turno para vender.</p>
        </div>
        <button onClick={() => onViewChange && onViewChange('shifts')} className="bg-red-600 text-white px-10 md:px-16 py-4 md:py-6 rounded-[24px] md:rounded-[28px] font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl active:scale-95 transition-all">Começar Agora</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 relative">
      {(toast || lastAction) && (
        <div className="fixed bottom-24 md:bottom-auto md:top-20 left-1/2 -translate-x-1/2 z-[600] flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4 md:slide-in-from-top-4 transition-all">
           {toast && <div className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-2xl">{toast}</div>}
           {lastAction && (
             <button onClick={handleUndo} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-2xl flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                Desfazer Última Ação
             </button>
           )}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[35px] md:rounded-[40px] p-8 md:p-10 shadow-2xl relative z-[710] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-2 italic">Apagar Mesa?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
               Remover a mesa <span className="font-bold text-slate-800 dark:text-white">"{deleteConfirmId.name}"</span> definitivamente?
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={() => {
                   onDeleteTab(deleteConfirmId.id);
                   if (normalizeId(activeTabId) === normalizeId(deleteConfirmId.id)) { setActiveTabId(null); }
                   setDeleteConfirmId(null);
                   showFeedback(`MESA REMOVIDA`);
                }} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Sim, Remover</button>
                
                <button onClick={() => {
                   onDeleteTab(deleteConfirmId.id);
                   if (normalizeId(activeTabId) === normalizeId(deleteConfirmId.id)) { setActiveTabId(null); }
                   setDeleteConfirmId(null);
                   showFeedback(`LIMPEZA FORÇADA APLICADA`);
                }} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                   Mesa Travada? (Forçar Limpeza)
                </button>

                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {!activeTabId ? (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Mesas Abertas</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{openTabs.length} contas ativas</p>
            </div>
            {!isAddingTab && <button onClick={() => setIsAddingTab(true)} className="w-full sm:w-auto bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] md:text-xs shadow-lg active:scale-95 transition-all">Abrir Nova Mesa</button>}
          </div>
          
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="NOME OU NÚMERO..." className="flex-1 px-5 md:px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-base md:text-lg tracking-widest outline-none shadow-inner" onKeyDown={e => e.key === 'Enter' && createTab()} />
              <button onClick={createTab} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Criar</button>
              <button onClick={() => setIsAddingTab(false)} className="md:hidden py-2 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
            </div>
          )}

          {openTabs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] opacity-40">
               <svg className="w-16 h-16 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               <p className="font-black uppercase text-xs tracking-widest italic">Nenhuma mesa aberta. Bora vender?</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {openTabs.map(tab => (
                <div key={tab.id} className="relative group bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-xl transition-all h-36 md:h-44 flex flex-col justify-between" onClick={() => setActiveTabId(tab.id)}>
                  <button onClick={(e) => { e.stopPropagation(); handleQuickDelete(tab.id, tab.name); }} className="absolute top-2 right-2 p-2 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-all z-10"><svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  <div className="pr-6"><h3 className="text-xs md:text-sm font-black uppercase truncate tracking-tight">{tab.name}</h3><span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">{(tab.items || []).length} ITENS</span></div>
                  <p className="text-red-600 dark:text-red-400 font-black text-xl md:text-2xl tracking-tighter italic">{formatCurrency((tab.items || []).reduce((acc: number, i: any) => acc + i.totalPrice, 0))}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300">
           <div className={`${showMobileCart ? 'hidden lg:block' : 'block'} flex-1`}>
             <POSProductGrid products={products} onAddProduct={addToTab} />
           </div>

           <div className={`${!showMobileCart ? 'hidden lg:flex' : 'flex'} w-full lg:w-96 bg-white dark:bg-slate-900 rounded-[30px] md:rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl flex-col overflow-hidden h-[75vh] md:h-[85vh] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24`}>
              <div className="p-4 md:p-5 bg-red-600 text-white font-black uppercase text-[10px] md:text-xs flex justify-between items-center shrink-0 shadow-lg">
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                  <button onClick={() => showMobileCart ? setShowMobileCart(false) : setActiveTabId(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </button>
                  <span className="truncate italic">PEDIDO: {activeTab?.name}</span>
                </div>
                <button onClick={() => handleQuickDelete(activeTabId!, activeTab?.name || 'Mesa')} className="text-white/50 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5} /></svg></button>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {tabItems.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="bg-slate-50 dark:bg-slate-800/20 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col flex-1 mr-2">
                             <p className="text-[10px] md:text-[11px] font-black uppercase leading-tight">{item.productName}</p>
                             {item.modifier && <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-1">+ {item.modifier.name}</span>}
                          </div>
                          <p className="text-[11px] md:text-xs font-black text-red-600">{formatCurrency(item.totalPrice)}</p>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-1 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                           <div className="flex items-center gap-1">
                              <button onClick={() => updateItemQty(idx, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 font-black">-</button>
                              <span className="text-[9px] md:text-[10px] font-black w-10 text-center">{item.quantity}x</span>
                              <button onClick={() => updateItemQty(idx, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 font-black">+</button>
                           </div>
                           <button onClick={() => updateItemQty(idx, -item.quantity)} className="text-red-500 p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
                        </div>
                      </div>
                    ))}
                    {tabItems.length === 0 && <div className="flex flex-col items-center justify-center py-12 md:py-20 opacity-20 italic text-[9px] md:text-[10px] uppercase font-black text-center">Nenhum item lançado</div>}
                    {showMobileCart && (
                       <button onClick={() => setShowMobileCart(false)} className="w-full py-4 text-[10px] font-black text-blue-600 uppercase border-2 border-dashed border-blue-500/20 rounded-2xl">+ Adicionar Mais Itens</button>
                    )}
                  </div>
                  <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-auto pb-8 md:pb-12">
                    <div className="flex justify-between items-center mb-4"><span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400">Total</span><span className="text-xl md:text-2xl font-black italic">{formatCurrency(tabTotal)}</span></div>
                    <button onClick={() => setIsClosingTab(true)} disabled={tabItems.length === 0 && !shortcutCheckout} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] md:text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">FINALIZAR CONTA</button>
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

           {!isClosingTab && !showMobileCart && activeTabId && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm lg:hidden z-[100] animate-in slide-in-from-bottom-6">
                <button 
                  onClick={() => setShowMobileCart(true)}
                  className="w-full bg-red-600 text-white p-5 rounded-[25px] shadow-2xl flex justify-between items-center border-4 border-white dark:border-slate-900 active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center font-black text-xs">
                        {tabItems.reduce((acc, i) => acc + i.quantity, 0)}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest">Ver Pedido</span>
                  </div>
                  <span className="text-xl font-black italic">{formatCurrency(tabTotal)}</span>
                </button>
              </div>
           )}
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