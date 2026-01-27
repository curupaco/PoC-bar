
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
  penduraThreshold?: number;
  longDurationThreshold?: number;
  activeDebtors?: Set<string>;
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
  dbStatus,
  penduraThreshold = 500,
  longDurationThreshold = 4,
  activeDebtors = new Set()
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isClosingTab, setIsClosingTab] = useState(false);
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
  const [modifierModalData, setModifierModalData] = useState<{ product: Product, group: ModifierGroup, quantity: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showFeedback = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const activeTab = useMemo<any>(() => {
    if (shortcutCheckout) {
      return { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() };
    }
    return openTabs.find(t => String(t.id).trim() === String(activeTabId).trim());
  }, [activeTabId, openTabs, shortcutCheckout]);
    
  const tabItems: SaleItem[] = useMemo(() => {
    if (!activeTab?.items) return [];
    return Array.isArray(activeTab.items) ? activeTab.items : (Object.values(activeTab.items) as SaleItem[]);
  }, [activeTab]);

  const tabTotal = useMemo(() => {
    if (shortcutCheckout) return shortcutCheckout.amount;
    return tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  }, [shortcutCheckout, tabItems]);

  const executeAddItem = useCallback((product: Product, quantity: number, modifier?: ModifierOption) => {
    if (!activeTab) return;
    const items = Array.isArray(activeTab.items) ? [...activeTab.items] : (Object.values(activeTab.items || {}) as SaleItem[]);
    const modPrice = modifier ? modifier.price : 0;
    const effectiveUnitPrice = safeFloat(product.price + modPrice);

    if (editingWeightIndex !== null) {
      const currentItem = items[editingWeightIndex];
      const newItem: SaleItem = { ...currentItem, quantity: quantity, totalPrice: safeFloat(quantity * currentItem.unitPrice) };
      if (onUpdateTabItem) onUpdateTabItem(activeTabId!, newItem);
      showFeedback("PESO ATUALIZADO");
    } else {
      const existingItem = items.find((i: SaleItem) => i.productId === product.id && (i.modifier?.name === modifier?.name));
      if (existingItem && product.sellType === 'unit') {
        const updatedItem: SaleItem = { ...existingItem, quantity: existingItem.quantity + quantity, totalPrice: safeFloat((existingItem.quantity + quantity) * effectiveUnitPrice) };
        if (onUpdateTabItem) onUpdateTabItem(activeTabId!, updatedItem);
        showFeedback(`+${quantity} ${product.name}`);
      } else {
        const newItem: SaleItem = { id: generateUniqueId('it'), productId: product.id, productName: product.name, category: product.category || 'GERAL', quantity: quantity, unitPrice: effectiveUnitPrice, totalPrice: safeFloat(quantity * effectiveUnitPrice), modifier: modifier };
        if (onUpdateTabItem) onUpdateTabItem(activeTabId!, newItem);
        showFeedback("ADICIONADO");
      }
    }
    setEditingWeightIndex(null); setWeightModalProduct(null); setModifierModalData(null);
  }, [activeTab, activeTabId, editingWeightIndex, onUpdateTabItem, showFeedback]);

  const addToTab = useCallback((product: Product, quantity: number = 1, weightConfirmed: boolean = false) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    if (product.sellType === 'weight' && !weightConfirmed) { setWeightModalProduct(product); return; }
    let groupId = product.modifierGroupId || categoryModifiers[product.category?.toUpperCase().trim()];
    if (groupId) {
        const group = modifierGroups.find(g => g.id === groupId);
        if (group && group.options.length > 0) { setModifierModalData({ product, group, quantity }); return; }
    }
    executeAddItem(product, quantity);
  }, [activeTabId, categoryModifiers, modifierGroups, executeAddItem]);

  const updateItemQty = useCallback((index: number, delta: number) => {
    if (!activeTab) return;
    const items = Array.isArray(activeTab.items) ? [...activeTab.items] : (Object.values(activeTab.items || {}) as SaleItem[]);
    const item = items[index];
    const updatedItem: SaleItem = { ...item, quantity: item.quantity + delta, totalPrice: safeFloat((item.quantity + delta) * item.unitPrice) };
    if (onUpdateTabItem) onUpdateTabItem(activeTabId!, updatedItem);
    showFeedback(delta > 0 ? "ADICIONADO" : "REMOVIDO");
  }, [activeTab, activeTabId, onUpdateTabItem, showFeedback]);

  const processCompletion = useCallback((payments: any[]) => {
    const isShortcut = activeTabId === 'shortcut-payment';
    const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    const newSale: Sale = {
       id: generateUniqueId('sale'), timestamp: Date.now(), openedAt: activeTab.openedAt,
       items: isShortcut ? [{ id: generateUniqueId('it'), productId: 'quitacao', productName: 'Quitação Fiado', category: 'FIADO', quantity: 1, unitPrice: totalAmount, totalPrice: totalAmount }] : tabItems,
       paymentMethod: payments.length === 1 ? payments[0].method : PaymentMethod.MULTIPLE,
       payments: payments, total: totalAmount, tabName: activeTab.name, customerName: payments.find(p => p.customerName)?.customerName || (isShortcut ? shortcutCheckout?.name : undefined),
       userId: '', shiftId: activeShift?.id || ''
    };
    onCompleteSale([newSale], !isShortcut ? activeTabId! : undefined);
    if (isShortcut && onClearShortcut) onClearShortcut();
    setActiveTabId(null); setIsClosingTab(false); showFeedback("VENDA FINALIZADA");
  }, [activeTab, activeTabId, activeShift, tabItems, shortcutCheckout, onCompleteSale, onClearShortcut, showFeedback]);

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-10 animate-in fade-in duration-700">
        <div className="relative group">
           <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full group-hover:bg-red-600/30 transition-all"></div>
           <div className="w-40 h-40 md:w-56 md:h-56 bg-white dark:bg-slate-900 rounded-[50px] md:rounded-[70px] flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 shadow-2xl relative z-10">
              <svg className="w-20 h-20 md:w-28 md:h-28 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           </div>
        </div>
        <div className="max-w-md space-y-4">
           <h2 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Turno Fechado</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-lg px-4 leading-relaxed">Abra um novo turno para lançar comandas.</p>
        </div>
        <button onClick={() => onViewChange && onViewChange('shifts')} className="bg-red-600 hover:bg-red-700 text-white px-16 py-6 rounded-[30px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-red-500/30 active:scale-95 transition-all">Abrir Turno Agora</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] animate-in slide-in-from-top-4">
           <div className="bg-slate-900 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl">{toast}</div>
        </div>
      )}

      {!activeTabId ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Comandas</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{openTabs.length} mesas em atendimento</p>
            </div>
            {!isAddingTab && <button onClick={() => setIsAddingTab(true)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Abrir Nova Mesa</button>}
          </div>
          
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="NOME OU NÚMERO DA MESA..." className="flex-1 px-8 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-xl outline-none shadow-inner" onKeyDown={e => e.key === 'Enter' && (newTabName.trim() ? (onSaveTab({id: generateUniqueId('tab'), name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}), setActiveTabId(generateUniqueId('tab')), setNewTabName(''), setIsAddingTab(false)) : null)} />
              <button onClick={() => { if(newTabName.trim()){ const nid = generateUniqueId('tab'); onSaveTab({id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}); setActiveTabId(nid); setNewTabName(''); setIsAddingTab(false); } }} className="bg-red-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Confirmar</button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {openTabs.map(tab => {
              const itemsList = Array.isArray(tab.items) ? tab.items : (Object.values(tab.items || {}) as SaleItem[]);
              const total = itemsList.reduce((acc: number, i: SaleItem) => acc + (i.totalPrice || 0), 0);
              return (
                <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="relative bg-white dark:bg-slate-900 p-6 rounded-[40px] border-2 border-slate-200 dark:border-slate-800 transition-all h-44 flex flex-col justify-between cursor-pointer hover:border-red-500 hover:shadow-2xl hover:scale-[1.02]">
                  <div>
                    <h3 className="text-sm font-black uppercase truncate leading-none">{tab.name}</h3>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{itemsList.length} itens lançados</p>
                  </div>
                  <p className="font-black text-2xl text-red-600 dark:text-red-400 italic tracking-tighter">{formatCurrency(total)}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in duration-300">
           <div className={`${showMobileCart ? 'hidden lg:block' : 'block'} flex-1`}>
             <POSProductGrid products={products} onAddProduct={addToTab} />
           </div>
           <div className={`${!showMobileCart ? 'hidden lg:flex' : 'flex'} w-full lg:w-[450px] bg-white dark:bg-slate-900 rounded-[50px] border-2 border-slate-200 dark:border-slate-800 shadow-2xl flex-col overflow-hidden h-[85vh] lg:sticky lg:top-10`}>
              <div className="p-6 bg-red-600 text-white flex justify-between items-center shadow-xl relative z-10">
                <div className="flex items-center gap-4">
                  <button onClick={() => showMobileCart ? setShowMobileCart(false) : setActiveTabId(null)} className="p-2 hover:bg-white/20 rounded-2xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                  <h4 className="font-black uppercase italic tracking-tighter text-lg">{activeTab?.name}</h4>
                </div>
              </div>
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {tabItems.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="p-5 rounded-[30px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col gap-4 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                             <p className="text-xs font-black uppercase text-slate-800 dark:text-white leading-tight">{item.productName}</p>
                             {item.modifier && <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">+{item.modifier.name}</span>}
                          </div>
                          <span className="font-black text-red-600">{formatCurrency(item.totalPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1.5 rounded-2xl shadow-sm">
                              <button onClick={() => updateItemQty(idx, -1)} className="w-10 h-10 flex items-center justify-center text-slate-400 font-black hover:text-red-500">-</button>
                              <span className="text-sm font-black w-8 text-center">{item.quantity}</span>
                              <button onClick={() => updateItemQty(idx, 1)} className="w-10 h-10 flex items-center justify-center text-slate-400 font-black hover:text-emerald-500">+</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-8 bg-slate-100 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex justify-between items-center text-3xl font-black italic tracking-tighter"><span className="text-xs font-black uppercase not-italic text-slate-400">Total Geral</span><span>{formatCurrency(tabTotal)}</span></div>
                    <button onClick={() => setIsClosingTab(true)} disabled={tabItems.length === 0} className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50">Fechar Conta</button>
                  </div>
                </>
              ) : (
                <POSPaymentPanel activeTabId={activeTabId} tabTotal={tabTotal} onBack={() => setIsClosingTab(false)} onComplete={processCompletion} shortcutCheckout={shortcutCheckout} />
              )}
           </div>
        </div>
      )}
      <WeightModal product={weightModalProduct} initialWeight={editingWeightIndex !== null ? (tabItems[editingWeightIndex]?.quantity ?? 0) : undefined} onConfirm={(w) => addToTab(weightModalProduct!, w, true)} onClose={() => { setWeightModalProduct(null); setEditingWeightIndex(null); }} showFeedback={showFeedback} />
      <UpsellModal data={modifierModalData} onConfirm={(opt) => modifierModalData && executeAddItem(modifierModalData.product, modifierModalData.quantity, opt)} onClose={() => setModifierModalData(null)} />
    </div>
  );
};

export default POS;
