
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency } from '../types';

interface POSProps {
  products: Product[];
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
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
  const [inputGrams, setInputGrams] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string, hasItems: boolean} | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // RESET TOTAL AO TROCAR DE MESA OU SAIR DO PDV
  useEffect(() => {
    setCurrentPayments([]);
    setPaymentAmountInput('');
    setIsClosingTab(false);
    setValidationError(null);
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

  const activeTab = shortcutCheckout 
    ? { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() }
    : openTabs.find(t => normalizeId(t.id) === normalizeId(activeTabId));
    
  const tabItems = activeTab?.items ?? [];
  const tabTotal = shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  
  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, tabTotal - paidSoFar);

  useEffect(() => {
    if (activeTabId && activeTabId !== 'shortcut-payment' && !openTabs.some(t => normalizeId(t.id) === normalizeId(activeTabId))) {
      setActiveTabId(null);
      setIsClosingTab(false);
      setCurrentPayments([]);
    }
  }, [openTabs, activeTabId]);

  useEffect(() => {
    if (isClosingTab && paymentAmountInput === '') {
      setPaymentAmountInput(remainingBalance > 0 ? remainingBalance.toFixed(2).replace('.', ',') : '');
    }
  }, [isClosingTab, currentPayments]);

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-[32px] flex items-center justify-center text-red-500 shadow-xl">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <div className="max-w-md space-y-4">
           <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Vendas Bloqueadas</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium">O PDV está bloqueado porque não há um turno ativo. Inicie um turno para começar a vender.</p>
           {onViewChange && (
             <button onClick={() => onViewChange('shifts')} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95">Abrir Turno Agora</button>
           )}
        </div>
      </div>
    );
  }

  const handleCreateTab = () => {
    if (!newTabName.trim()) return;
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = { id: newId, name: newTabName.toUpperCase(), items: [], openedAt: Date.now() };
    onUpdateTabs(prev => [...(prev || []), newTab]);
    setActiveTabId(newId);
    setNewTabName('');
    setIsAddingTab(false);
  };

  const addToTab = (product: Product, quantity: number = 1) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    onUpdateTabs(prev => (prev || []).map(tab => {
      if (normalizeId(tab.id) === normalizeId(activeTabId)) {
        const items = [...(tab.items ?? [])];
        if (editingWeightIndex !== null) {
          items[editingWeightIndex] = { ...items[editingWeightIndex], quantity: quantity, totalPrice: quantity * items[editingWeightIndex].unitPrice };
        } else {
          const existingIndex = items.findIndex(i => i.productId === product.id);
          if (existingIndex > -1 && product.sellType === 'unit') {
            const newQty = items[existingIndex].quantity + quantity;
            items[existingIndex] = { ...items[existingIndex], quantity: newQty, totalPrice: newQty * product.price };
          } else {
            items.push({ productId: product.id, productName: product.name, quantity: quantity, unitPrice: product.price, totalPrice: quantity * product.price });
          }
        }
        return { ...tab, items };
      }
      return tab;
    }));
    setEditingWeightIndex(null);
    setWeightModalProduct(null);
    setInputGrams('');
  };

  const handlePaymentInputChange = (val: string) => {
    const cleaned = val.replace(/[^0-9,]/g, '');
    const parts = cleaned.split(',');
    if (parts.length > 2) return;
    setPaymentAmountInput(cleaned);
  };

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const favorites = filteredProducts.filter(p => p.isFavorite);
  const categories = Array.from(new Set(filteredProducts.map(p => p.category))).sort();

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {/* MODAL DE EXCLUSÃO DE MESA */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[32px] p-8 shadow-2xl relative z-20 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase text-center mb-2 tracking-tighter leading-none">Fechar Mesa?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-8">
               {deleteConfirmId.hasItems 
                 ? `A mesa "${deleteConfirmId.name}" tem consumo. Deseja REALMENTE APAGAR TUDO e remover a comanda?` 
                 : `Deseja excluir a mesa "${deleteConfirmId.name}"?`}
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={() => {
                   onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(deleteConfirmId.id)));
                   if (normalizeId(activeTabId) === normalizeId(deleteConfirmId.id)) { setActiveTabId(null); setIsClosingTab(false); }
                   setDeleteConfirmId(null);
                }} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Sim, Excluir Mesa</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {/* TOAST DE ERRO */}
      {validationError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4">
           {validationError}
        </div>
      )}

      {!activeTabId ? (
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Comandas Abertas</h2>
            {!isAddingTab && (
              <button onClick={() => setIsAddingTab(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-black shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest">Abrir Mesa</button>
            )}
          </div>
          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-red-500 shadow-xl flex gap-3 animate-in fade-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder="Nome da mesa ou cliente" className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-red-500 font-bold uppercase" onKeyDown={e => e.key === 'Enter' && handleCreateTab()} />
              <button onClick={handleCreateTab} className="bg-red-600 text-white px-6 rounded-xl font-black hover:bg-red-700 transition-colors uppercase text-xs">Criar</button>
              <button onClick={() => setIsAddingTab(false)} className="text-slate-400 font-bold px-4 hover:text-slate-600 transition-colors uppercase text-xs">Cancelar</button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(openTabs || []).map(tab => (
              <div key={tab.id} className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative h-44 group">
                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId({ id: tab.id, name: tab.name, hasItems: tab.items.length > 0 }); }} className="absolute top-0 right-0 p-4 z-20 text-slate-300 hover:text-red-500 transition-all hover:scale-125">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <div onClick={() => { setActiveTabId(tab.id); }} className="p-5 cursor-pointer flex-1 flex flex-col justify-between">
                  <div className="pr-10">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 mb-2 transition-colors group-hover:bg-red-50 dark:group-hover:bg-red-900/10 group-hover:text-red-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-8-3V7l8-3 8 3v11l-8 3zM12 21V7M12 7l8-3-8-3-8 3 8 3z" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase truncate tracking-tight leading-normal">{tab.name}</h3>
                    <p className="text-red-600 dark:text-red-400 font-black text-xl mt-1">{formatCurrency((tab.items ?? []).reduce((acc, i) => acc + (i.totalPrice ?? 0), 0))}</p>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-50 dark:border-slate-800/50 pt-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{(tab.items ?? []).length} ITENS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-8 pb-20">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if (onClearShortcut) onClearShortcut(); }} className="flex bg-slate-100 dark:bg-slate-800 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <div className="flex-1 flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Buscar produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white font-black uppercase text-xs" disabled={!!shortcutCheckout} />
              </div>
            </div>

            {shortcutCheckout ? (
              <div className="bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800 rounded-3xl p-12 text-center space-y-6 animate-in zoom-in-95">
                 <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-4"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Recebimento de Pendura</h2>
                 <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">Recebendo pagamento de <span className="text-red-600 font-black">{shortcutCheckout.name}</span> no valor de <span className="font-black">{formatCurrency(shortcutCheckout.amount)}</span>.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* SEÇÃO FAVORITOS */}
                {favorites.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] pl-2 flex items-center gap-2">
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                       MAIS VENDIDOS / FAVORITOS
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {favorites.map(p => (
                        <button key={p.id} onClick={() => p.sellType === 'weight' ? setWeightModalProduct(p) : addToTab(p, 1)} className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border-2 border-amber-200 dark:border-amber-900/30 shadow-sm hover:bg-amber-100 transition-all text-left group relative overflow-hidden">
                          <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                             <svg className="w-12 h-12 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          </div>
                          <p className="text-xs font-black text-amber-900 dark:text-amber-100 mb-1 truncate leading-tight uppercase">{p.name}</p>
                          <p className="text-lg font-black text-amber-600">{formatCurrency(p.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* DEMAIS CATEGORIAS */}
                {categories.map(cat => (
                  <div key={cat} className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-2 border-l-4 border-slate-200 dark:border-slate-800 ml-1">{cat}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {filteredProducts.filter(p => p.category === cat).map(p => (
                        <button key={p.id} onClick={() => p.sellType === 'weight' ? setWeightModalProduct(p) : addToTab(p, 1)} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 active:scale-95 transition-all text-left">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 mb-1 truncate leading-tight uppercase">{p.name}</p>
                          <p className="text-lg font-black text-red-600">{formatCurrency(p.price)}{p.sellType === 'weight' ? '/kg' : ''}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-full lg:w-96 flex flex-col h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
              <div className="p-5 bg-red-600 text-white shrink-0">
                <h3 className="font-black uppercase tracking-tight truncate leading-normal mb-2">{activeTab?.name}</h3>
                <button type="button" onClick={() => setDeleteConfirmId({ id: activeTabId, name: activeTab?.name || 'Comanda', hasItems: tabItems.length > 0 })} className="w-full py-2 bg-black/20 hover:bg-black/40 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Abandonar Mesa</button>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px]">
                    {tabItems.map((item, idx) => (
                      <div key={`${item.productId}-${idx}`} className="bg-slate-50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600">
                               {products.find(p => p.id === item.productId)?.sellType === 'unit' ? `${item.quantity}x` : `${(item.quantity * 1000).toFixed(0)}g`}
                            </div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate">{item.productName}</p>
                          </div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      </div>
                    ))}
                    {tabItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 opacity-30 italic text-sm text-center">Nenhum item lançado</div>
                    )}
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(tabTotal)}</span>
                    </div>
                    {(tabItems.length > 0 || shortcutCheckout) && (
                      <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 transition-all uppercase text-xs tracking-widest">FECHAR CONTA</button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      <button onClick={() => { setIsClosingTab(false); setCurrentPayments([]); }} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 hover:text-red-500 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Voltar / Limpar Divisão
                      </button>
                      <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Faltando</p>
                        <p className="text-3xl font-black text-red-600">{formatCurrency(remainingBalance)}</p>
                      </div>
                      <div className="space-y-2">
                        <select value={paymentMethodInput} onChange={e => setPaymentMethodInput(e.target.value as any)} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-red-500">
                          {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        {(paymentMethodInput === PaymentMethod.PENDURA || shortcutCheckout) && (
                          <input type="text" value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-xs outline-none focus:ring-2 focus:ring-red-500 uppercase" placeholder="Nome do Cliente" />
                        )}
                        <div className="flex gap-2">
                          <input type="text" inputMode="decimal" value={paymentAmountInput} onChange={e => handlePaymentInputChange(e.target.value)} className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-black text-xl outline-none focus:ring-2 focus:ring-red-500" placeholder="0,00" />
                          <button onClick={() => {
                             const val = parseFloat(paymentAmountInput.replace(',', '.'));
                             if (isNaN(val) || val <= 0) return;
                             if ((paymentMethodInput === PaymentMethod.PENDURA || shortcutCheckout) && !customerNameInput.trim()) {
                               setValidationError("NOME OBRIGATÓRIO PARA PENDURA!");
                               setTimeout(() => setValidationError(null), 3000);
                               return;
                             }
                             setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val, customerName: customerNameInput.toUpperCase() || undefined }]);
                             setPaymentAmountInput('');
                             if (!shortcutCheckout) setCustomerNameInput('');
                          }} className="bg-black text-white px-4 rounded-xl font-black hover:bg-slate-800 transition-colors">+</button>
                        </div>
                      </div>
                      {currentPayments.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamentos:</p>
                           {currentPayments.map((p, idx) => (
                             <div key={idx} className="flex justify-between items-center text-[10px] font-black text-slate-700 dark:text-slate-300">
                                <span className="uppercase">{p.method} {p.customerName ? `(${p.customerName})` : ''}</span>
                                <span>{formatCurrency(p.amount)}</span>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                   <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                      <button onClick={() => {
                        const isShortcut = activeTabId === 'shortcut-payment';
                        const canFinish = isShortcut ? paidSoFar > 0 : remainingBalance <= 0.01;
                        if (!activeTab || (!isShortcut && tabItems.length === 0) || !canFinish) return;
                        currentPayments.forEach((p, index) => {
                           const sale: Sale = {
                              id: `${Date.now()}-${index}`,
                              timestamp: Date.now(),
                              openedAt: activeTab.openedAt,
                              items: isShortcut ? [{ productId: 'quitacao', productName: 'Abatimento de Pendura', quantity: 1, unitPrice: p.amount, totalPrice: p.amount }] : (index === 0 ? tabItems : []),
                              paymentMethod: p.method,
                              total: p.amount,
                              tabName: activeTab.name,
                              customerName: p.customerName || (isShortcut ? shortcutCheckout?.name : undefined),
                              userId: '', 
                              shiftId: activeShift.id
                           };
                           onCompleteSale(sale);
                        });
                        if (isShortcut) { if (onClearShortcut) onClearShortcut(); }
                        else onUpdateTabs(prev => (prev || []).filter(t => normalizeId(t.id) !== normalizeId(activeTabId)));
                        setActiveTabId(null);
                        setIsClosingTab(false);
                        setCurrentPayments([]);
                      }} disabled={remainingBalance > 0.01} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">Finalizar Venda</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {(weightModalProduct || editingWeightIndex !== null) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-8 shadow-2xl text-center border border-slate-200 dark:border-slate-800">
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-4 tracking-tighter italic">Lançar Peso (Gramas)</h4>
            <div className="relative">
               <input autoFocus type="number" inputMode="numeric" value={inputGrams} onChange={e => setInputGrams(e.target.value)} className="w-full text-5xl font-black p-6 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-red-500 outline-none" />
               <span className="absolute right-6 bottom-6 text-xs font-black text-red-500 opacity-50 uppercase">gramas</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => { if (!inputGrams) return; addToTab(weightModalProduct!, parseFloat(inputGrams) / 1000); }} className="bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Lançar</button>
              <button onClick={() => { setWeightModalProduct(null); setEditingWeightIndex(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
