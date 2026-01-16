
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab, Shift, formatCurrency, generateUniqueId, sanitizeCurrencyInput, parseCurrencyValue } from '../types';

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
  const [receivedValueInput, setReceivedValueInput] = useState<number | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
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
    setCurrentPayments([]);
    setPaymentAmountInput('');
    setReceivedValueInput(null);
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

  const activeTab = useMemo(() => {
    if (shortcutCheckout) return { id: 'shortcut-payment', name: `Quitação: ${shortcutCheckout.name}`, items: [], openedAt: Date.now() };
    return openTabs.find(t => String(t.id) === String(activeTabId));
  }, [activeTabId, openTabs, shortcutCheckout]);
    
  const tabItems = activeTab?.items ?? [];
  const tabTotal = shortcutCheckout ? shortcutCheckout.amount : tabItems.reduce((acc, i) => acc + (i.totalPrice ?? 0), 0);
  const remainingBalance = Math.max(0, tabTotal - currentPayments.reduce((acc, p) => acc + p.amount, 0));

  const handleAddPayment = () => {
    const val = parseCurrencyValue(paymentAmountInput) || remainingBalance;
    if (isNaN(val) || val <= 0) return;
    if ((paymentMethodInput === PaymentMethod.PENDURA || shortcutCheckout) && !customerNameInput.trim()) {
      setValidationError("NOME DO CLIENTE OBRIGATÓRIO!");
      return;
    }
    setCurrentPayments(prev => [...prev, { method: paymentMethodInput, amount: val, customerName: customerNameInput.toUpperCase() || undefined }]);
    setPaymentAmountInput('');
    setReceivedValueInput(null);
    if (!shortcutCheckout) setCustomerNameInput('');
    setValidationError(null);
    showFeedback("PAGAMENTO ADICIONADO");
  };

  const handleWeightConfirm = () => {
    const grams = parseFloat(inputGrams);
    if (!inputGrams || isNaN(grams) || grams <= 0) {
      showFeedback("PESO INVÁLIDO!");
      return;
    }
    addToTab(weightModalProduct!, grams / 1000);
    setWeightModalProduct(null);
    setEditingWeightIndex(null);
    setInputGrams('');
  };

  const addToTab = (product: Product, quantity: number = 1) => {
    if (!activeTabId || activeTabId === 'shortcut-payment') return;
    onUpdateTabs(prev => prev.map(tab => {
      if (String(tab.id) === String(activeTabId)) {
        const items = [...(tab.items ?? [])];
        const existingIndex = items.findIndex(i => i.productId === product.id);
        if (existingIndex > -1 && product.sellType === 'unit') {
          const newQty = items[existingIndex].quantity + quantity;
          items[existingIndex] = { ...items[existingIndex], quantity: newQty, totalPrice: Number((newQty * product.price).toFixed(2)) };
        } else {
          items.push({ productId: product.id, productName: product.name, category: product.category || 'GERAL', quantity: quantity, unitPrice: product.price, totalPrice: Number((quantity * product.price).toFixed(2)) });
        }
        return { ...tab, items };
      }
      return tab;
    }));
    showFeedback(`${product.name} LANÇADO`);
  };

  const handleFinishSale = () => {
    if (!activeTab || (activeTabId !== 'shortcut-payment' && tabItems.length === 0)) return;
    
    let finalPayments = [...currentPayments];
    
    // Se não houver pagamentos adicionados mas houver recebido no dinheiro, adiciona automaticamente
    if (finalPayments.length === 0 && paymentMethodInput === PaymentMethod.CASH && receivedValueInput) {
       finalPayments.push({ method: PaymentMethod.CASH, amount: tabTotal });
    }
    
    const paidTotal = finalPayments.reduce((acc, p) => acc + p.amount, 0);
    if (paidTotal < tabTotal - 0.05 && activeTabId !== 'shortcut-payment') {
      setValidationError(`FALTAM ${formatCurrency(tabTotal - paidTotal)}!`);
      return;
    }

    finalPayments.forEach((p, idx) => {
      onCompleteSale({
        id: generateUniqueId('sale'),
        timestamp: Date.now(),
        openedAt: activeTab.openedAt,
        items: activeTabId === 'shortcut-payment' ? [{ productId: 'quitacao', productName: 'Quitação Fiado', category: 'FIADO', quantity: 1, unitPrice: p.amount, totalPrice: p.amount }] : (idx === 0 ? tabItems : []),
        paymentMethod: p.method,
        total: p.amount,
        tabName: activeTab.name,
        customerName: p.customerName || (activeTabId === 'shortcut-payment' ? shortcutCheckout?.name : undefined),
        userId: '', shiftId: activeShift?.id || ''
      });
    });

    if (activeTabId !== 'shortcut-payment') onUpdateTabs(prev => prev.filter(t => String(t.id) !== String(activeTabId)));
    else if (onClearShortcut) onClearShortcut();

    setActiveTabId(null);
    setIsClosingTab(false);
    setCurrentPayments([]);
    showFeedback("VENDA FINALIZADA");
  };

  if (!activeShift) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic">Operação Bloqueada</h2>
      <p className="text-slate-500 max-w-xs">Abra um novo turno para começar a vender.</p>
      <button onClick={() => onViewChange?.('shifts')} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl animate-bounce shadow-red-500/20">Abrir Turno Agora</button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative h-full">
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top-4">{toast}</div>}
      {validationError && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4" onClick={() => setValidationError(null)}>{validationError}</div>}

      {!activeTabId ? (
        <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Mesas em Aberto</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{openTabs.length} mesas monitoradas</p>
            </div>
            <button onClick={() => setIsAddingTab(true)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest">Abrir Mesa</button>
          </div>

          {isAddingTab && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-4 border-red-500 shadow-2xl flex flex-col md:flex-row gap-4 animate-in zoom-in-95">
              <input autoFocus value={newTabName} onChange={e => setNewTabName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (() => { if(newTabName.trim()){ const nid = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(nid); setNewTabName(''); setIsAddingTab(false); } })()} placeholder="IDENTIFICAÇÃO DA MESA..." className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black uppercase text-lg outline-none" />
              <div className="flex gap-2">
                <button onClick={() => { if(newTabName.trim()){ const nid = generateUniqueId('tab'); onUpdateTabs(p => [...p, {id: nid, name: newTabName.toUpperCase(), items: [], openedAt: Date.now()}]); setActiveTabId(nid); setNewTabName(''); setIsAddingTab(false); } }} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Criar</button>
                <button onClick={() => setIsAddingTab(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-400 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Sair</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {openTabs.map(tab => (
              <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 cursor-pointer shadow-sm hover:shadow-xl transition-all h-48 flex flex-col justify-between animate-in zoom-in-95 group">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{tab.name}</h3>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{tab.items.length} ITENS</span>
                </div>
                <p className="text-red-600 dark:text-red-400 font-black text-2xl tracking-tighter">{formatCurrency(tab.items.reduce((a, i) => a + i.totalPrice, 0))}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 pb-40 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 sticky top-0 z-20">
              <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); if (onClearShortcut) onClearShortcut(); }} className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <input type="text" placeholder="LOCALIZAR PRODUTO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 py-4 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none outline-none text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500" disabled={!!shortcutCheckout} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <button key={p.id} onClick={() => p.sellType === 'weight' ? setWeightModalProduct(p) : addToTab(p, 1)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 transition-all text-center h-24 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase truncate px-1 w-full">{p.name}</p>
                  <p className="text-2xl font-black text-red-600 leading-none">{p.price.toFixed(2).replace('.', ',')}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-96 flex flex-col h-[calc(100vh-140px)] lg:sticky lg:top-24 z-10 animate-in slide-in-from-right-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] overflow-hidden flex flex-col h-full shadow-2xl">
              <div className="p-5 bg-red-600 text-white flex justify-between items-center shadow-lg">
                <h3 className="font-black uppercase tracking-tight text-xs">{activeTab?.name}</h3>
                <button onClick={() => { setActiveTabId(null); setIsClosingTab(false); }} className="p-2 opacity-50 hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              
              {!isClosingTab ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {tabItems.map((item, idx) => (
                      <div key={`${item.productId}-${idx}`} className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                           <div className="flex-1 pr-2">
                             <p className="text-[11px] font-black uppercase text-slate-800 dark:text-white truncate">{item.productName}</p>
                             <p className="text-[10px] font-black text-red-600 mt-1">{formatCurrency(item.totalPrice)}</p>
                           </div>
                           <div className="flex items-center gap-1.5 font-black text-[11px] text-slate-500">
                             <span>{item.quantity}{products.find(p => p.id === item.productId)?.sellType === 'weight' ? 'kg' : 'x'}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                    {tabItems.length === 0 && <div className="py-20 text-center text-[10px] font-black uppercase opacity-30 italic">Mesa vazia</div>}
                  </div>
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Saldo Devedor</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(tabTotal)}</span>
                    </div>
                    {(tabItems.length > 0 || shortcutCheckout) && <button onClick={() => setIsClosingTab(true)} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest active:scale-95 transition-all shadow-red-500/20">RECEBER PAGAMENTO</button>}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 p-5 space-y-5 overflow-y-auto no-scrollbar">
                   <button onClick={() => setIsClosingTab(false)} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500">← Retornar à comanda</button>
                   <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl text-center border border-slate-200 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Aguardando Recebimento</p>
                      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(remainingBalance)}</p>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Método</label>
                        <select value={paymentMethodInput} onChange={e => setPaymentMethodInput(e.target.value as any)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-red-500 transition-all">
                          {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      
                      {(paymentMethodInput === PaymentMethod.PENDURA || shortcutCheckout) && (
                        <div className="space-y-1 animate-in slide-in-from-right-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Identificar Cliente</label>
                          <input autoFocus type="text" value={customerNameInput} onChange={e => setCustomerNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPayment()} placeholder="NOME DO CLIENTE..." className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Lançar Valor</label>
                        <div className="flex gap-2">
                          <input type="text" inputMode="decimal" value={paymentAmountInput} onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))} onKeyDown={e => e.key === 'Enter' && handleAddPayment()} placeholder={remainingBalance.toFixed(2).replace('.', ',')} className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xl outline-none border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" />
                          <button onClick={handleAddPayment} className="bg-black text-white px-6 rounded-2xl font-black active:scale-95 text-xl shadow-lg">+</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {currentPayments.map((p, i) => (
                          <div key={i} className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 animate-in slide-in-from-bottom-2">
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase">{p.method} {p.customerName ? `(${p.customerName})` : ''}</span>
                            <span className="text-xs font-black text-emerald-600">{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="mt-auto pt-6 space-y-4">
                      {paymentMethodInput === PaymentMethod.CASH && receivedValueInput && (
                        <div className="bg-emerald-600 text-white p-4 rounded-3xl text-center shadow-xl animate-in zoom-in-95 border-2 border-emerald-500">
                           <span className="text-[9px] font-black uppercase opacity-80">Troco a devolver:</span>
                           <span className="block text-4xl font-black tracking-tighter">{formatCurrency(Math.max(0, receivedValueInput - (parseCurrencyValue(paymentAmountInput) || remainingBalance)))}</span>
                        </div>
                      )}
                      <button onClick={handleFinishSale} className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all shadow-emerald-500/20">CONCLUIR OPERAÇÃO</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {weightModalProduct && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl text-center border border-slate-200 dark:border-slate-800">
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 italic tracking-tighter">Lançar Gramas</h4>
            <input autoFocus type="number" inputMode="numeric" value={inputGrams} onChange={e => setInputGrams(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWeightConfirm()} className="w-full text-5xl font-black p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-4 border-red-500 outline-none shadow-inner" placeholder="0" />
            <p className="text-[10px] font-black text-slate-400 uppercase mt-6 tracking-widest">Ex: 500 = 0.5kg | 1000 = 1.0kg</p>
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={handleWeightConfirm} className="bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 shadow-red-500/20">Lançar</button>
              <button onClick={() => { setWeightModalProduct(null); setInputGrams(''); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs active:scale-95">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
