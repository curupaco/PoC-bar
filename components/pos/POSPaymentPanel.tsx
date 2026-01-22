
import React, { useState, useMemo, useEffect } from 'react';
import { PaymentMethod, formatCurrency, sanitizeCurrencyInput, parseCurrencyValue, safeFloat } from '../../types';

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  customerName?: string;
  change?: number;
}

interface POSPaymentPanelProps {
  activeTabId: string | null;
  tabTotal: number;
  onBack: () => void;
  onComplete: (payments: PaymentEntry[]) => void;
  shortcutCheckout?: { name: string; amount: number } | null;
}

const POSPaymentPanel: React.FC<POSPaymentPanelProps> = ({ 
  activeTabId, 
  tabTotal, 
  onBack, 
  onComplete,
  shortcutCheckout
}) => {
  const [currentPayments, setCurrentPayments] = useState<PaymentEntry[]>([]);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // CORREÇÃO CRÍTICA (Mantida): Impede limpeza agressiva no modo atalho
  // ATUALIZAÇÃO: Preenche automaticamente o saldo restante para agilizar o fluxo
  useEffect(() => {
    if (activeTabId === 'shortcut-payment') {
      if (shortcutCheckout) {
        setCustomerNameInput(shortcutCheckout.name);
        setPaymentAmountInput(shortcutCheckout.amount.toString().replace('.', ','));
        setPaymentMethodInput(PaymentMethod.CASH);
      }
    } else {
      // Limpa tudo se mudar de aba normal
      setCurrentPayments([]);
      // Define o valor a pagar como o total da comanda por padrão para acelerar o fechamento
      setPaymentAmountInput(tabTotal.toFixed(2).replace('.', ','));
      setCashReceivedInput('');
      setCustomerNameInput('');
      setValidationError(null);
    }
  }, [activeTabId, shortcutCheckout, tabTotal]);

  const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingBalance = Math.max(0, safeFloat(tabTotal - paidSoFar));

  const handleAddPayment = () => {
    const amountToPay = parseCurrencyValue(paymentAmountInput);
    
    if (amountToPay <= 0) { setToast("VALOR INVÁLIDO"); return; }
    if (amountToPay > remainingBalance + 0.05) { setToast("VALOR MAIOR QUE O RESTANTE"); return; }
    if (paymentMethodInput === PaymentMethod.PENDURA && !customerNameInput.trim()) { setValidationError("NOME DO CLIENTE OBRIGATÓRIO PARA PENDURA!"); return; }

    let change = 0;
    if (paymentMethodInput === PaymentMethod.CASH) {
       const handed = parseCurrencyValue(cashReceivedInput);
       if (handed > amountToPay) change = safeFloat(handed - amountToPay);
    }

    setCurrentPayments(prev => [...prev, {
      method: paymentMethodInput,
      amount: amountToPay,
      customerName: customerNameInput.trim() || undefined,
      change: change > 0 ? change : undefined
    }]);

    setPaymentAmountInput('');
    setCashReceivedInput('');
    if (paymentMethodInput !== PaymentMethod.PENDURA && activeTabId !== 'shortcut-payment') setCustomerNameInput('');
    setToast("PAGAMENTO ADICIONADO");
  };

  const handleFinishSale = () => {
    // Fluxo Rápido: Se não adicionou parciais, tenta usar o input atual
    if (currentPayments.length === 0) {
        const val = parseCurrencyValue(paymentAmountInput);
        if (val >= remainingBalance - 0.05 || (!paymentAmountInput && paymentMethodInput === PaymentMethod.CASH)) {
             if (paymentMethodInput === PaymentMethod.PENDURA && !customerNameInput.trim()) {
                setValidationError("NOME DO CLIENTE OBRIGATÓRIO!");
                return;
             }
             const finalAmount = val > 0 ? val : remainingBalance;
             onComplete([{
                method: paymentMethodInput,
                amount: finalAmount,
                customerName: customerNameInput.trim() || undefined
             }]);
             return;
        }
    }

    if (remainingBalance > 0.05) {
       setValidationError(`FALTAM ${formatCurrency(remainingBalance)}! ADICIONE O PAGAMENTO.`);
       return;
    }

    onComplete(currentPayments);
  };

  const liveChange = useMemo(() => {
    if (paymentMethodInput !== PaymentMethod.CASH) return 0;
    
    // UX FIX: Se o usuário não digitou quanto quer cobrar, assumimos o saldo restante
    const inputVal = parseCurrencyValue(paymentAmountInput);
    const toPay = inputVal > 0 ? inputVal : remainingBalance;
    
    const handed = parseCurrencyValue(cashReceivedInput);
    if (handed <= 0) return 0;
    return Math.max(0, safeFloat(handed - toPay));
  }, [paymentAmountInput, cashReceivedInput, paymentMethodInput, remainingBalance]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 animate-in slide-in-from-right-4 duration-300 relative">
       {toast && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[50] bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{toast}</div>}
       {validationError && <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[50] bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-xl cursor-pointer" onClick={() => setValidationError(null)}>{validationError}</div>}

       <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-32">
          <button onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 hover:text-red-500">← Voltar à comanda</button>
          
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
  );
};

export default POSPaymentPanel;
