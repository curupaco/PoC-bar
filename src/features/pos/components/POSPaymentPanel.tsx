
import React, { useState, useMemo, useEffect } from 'react';
import { PaymentMethod, formatCurrency, sanitizeCurrencyInput, parseCurrencyValue, safeFloat } from '../../../types';

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
   activeDebtors?: Set<string>;
}

const POSPaymentPanel: React.FC<POSPaymentPanelProps> = ({
   activeTabId,
   tabTotal,
   onBack,
   onComplete,
   shortcutCheckout,
   activeDebtors = new Set()
}) => {
   const [currentPayments, setCurrentPayments] = useState<PaymentEntry[]>([]);
   const [paymentAmountInput, setPaymentAmountInput] = useState('');
   const [cashReceivedInput, setCashReceivedInput] = useState('');
   const [customerNameInput, setCustomerNameInput] = useState('');
   const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>(PaymentMethod.CASH);
   const [validationError, setValidationError] = useState<string | null>(null);
   const [toast, setToast] = useState<string | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);

   const isQuickSale = useMemo(() => {
      return activeTabId?.startsWith('tab-express') || false;
   }, [activeTabId]);

   useEffect(() => {
      if (toast) {
         const t = setTimeout(() => setToast(null), 2000);
         return () => clearTimeout(t);
      }
   }, [toast]);

   useEffect(() => {
      if (activeTabId === 'shortcut-payment') {
         if (shortcutCheckout) {
            setCustomerNameInput(shortcutCheckout.name);
            setPaymentAmountInput(shortcutCheckout.amount.toString().replace('.', ','));
            setPaymentMethodInput(PaymentMethod.CASH);
         }
      } else {
         setCurrentPayments([]);
         setPaymentAmountInput(tabTotal.toFixed(2).replace('.', ','));
         setCashReceivedInput('');
         setCustomerNameInput('');
         setValidationError(null);
         setIsProcessing(false);
         setPaymentMethodInput(PaymentMethod.CASH);
      }
   }, [activeTabId, shortcutCheckout, tabTotal]);

   const paidSoFar = currentPayments.reduce((acc, p) => acc + p.amount, 0);
   const remainingBalance = Math.max(0, safeFloat(tabTotal - paidSoFar));

   const isCurrentCustomerDevedor = useMemo(() => {
      return activeDebtors.has(customerNameInput.trim().toUpperCase());
   }, [customerNameInput, activeDebtors]);

   const availableMethods = useMemo(() => {
      const all = Object.values(PaymentMethod);
      if (isQuickSale) {
         return all.filter(m => m !== PaymentMethod.PENDURA && m !== PaymentMethod.MULTIPLE);
      }
      return all;
   }, [isQuickSale]);

   const handleAddPayment = () => {
      if (isQuickSale) return;
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

   const handleFinishSale = async () => {
      if (isProcessing) return;
      if (isQuickSale || currentPayments.length === 0) {
         const val = parseCurrencyValue(paymentAmountInput);
         const handed = parseCurrencyValue(cashReceivedInput);
         const finalAmount = val > 0 ? val : remainingBalance;
         let change = 0;

         if (paymentMethodInput === PaymentMethod.CASH && handed > finalAmount) {
            change = safeFloat(handed - finalAmount);
         }

         if (finalAmount < remainingBalance - 0.05) {
            setValidationError("VALOR INSUFICIENTE PARA FINALIZAR.");
            return;
         }

         if (paymentMethodInput === PaymentMethod.PENDURA && !customerNameInput.trim()) {
            setValidationError("NOME DO CLIENTE OBRIGATÓRIO!");
            return;
         }

         setIsProcessing(true);
         await new Promise(r => setTimeout(r, 600));
         onComplete([{
            method: paymentMethodInput,
            amount: finalAmount,
            customerName: customerNameInput.trim() || undefined,
            change: change > 0 ? change : undefined
         }]);
         setIsProcessing(false);
         return;
      }

      if (remainingBalance > 0.05) {
         setValidationError(`FALTAM ${formatCurrency(remainingBalance)}! ADICIONE O PAGAMENTO.`);
         return;
      }

      setIsProcessing(true);
      await new Promise(r => setTimeout(r, 600));
      onComplete(currentPayments);
      setIsProcessing(false);
   };

   const liveChange = useMemo(() => {
      if (paymentMethodInput !== PaymentMethod.CASH) return 0;
      const inputVal = parseCurrencyValue(paymentAmountInput);
      const toPay = inputVal > 0 ? inputVal : remainingBalance;
      const handed = parseCurrencyValue(cashReceivedInput);
      if (handed <= 0) return 0;
      return Math.max(0, safeFloat(handed - toPay));
   }, [paymentAmountInput, cashReceivedInput, paymentMethodInput, remainingBalance]);

   return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 animate-in slide-in-from-right-4 duration-300 overflow-hidden">
         {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl animate-bounce">{toast}</div>}
         {validationError && <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-10 py-5 rounded-[30px] font-black uppercase text-xs shadow-2xl cursor-pointer animate-in zoom-in-95" onClick={() => setValidationError(null)}>{validationError}</div>}

         <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="p-6 lg:p-10 flex flex-col lg:flex-row gap-10">
               
               {/* LADO ESQUERDO: CONTROLES DE PAGAMENTO */}
               <div className="flex-1 space-y-8">
                  <div className="flex items-center justify-between">
                     <button onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        Voltar à comanda
                     </button>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total da Venda</p>
                        <p className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">{formatCurrency(tabTotal)}</p>
                     </div>
                  </div>

                  <div className={`p-8 rounded-[40px] border text-center transition-all ${isQuickSale ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{isQuickSale ? 'Venda de Balcão' : 'Saldo devedor'}</p>
                     <p className={`text-6xl font-black tracking-tighter ${isQuickSale ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(remainingBalance)}</p>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Como o cliente vai pagar?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                           {availableMethods.map(m => (
                              <button
                                 key={m}
                                 onClick={() => setPaymentMethodInput(m)}
                                 className={`py-6 rounded-3xl font-black text-xs uppercase border-2 transition-all ${paymentMethodInput === m ? 'bg-red-600 text-white border-red-600 shadow-xl shadow-red-600/20 scale-105 z-10' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-red-200'}`}
                              >
                                 {m}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Cobrado</label>
                           <div className="relative group">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">R$</span>
                              <input
                                 type="text"
                                 inputMode="decimal"
                                 value={paymentAmountInput}
                                 onChange={e => setPaymentAmountInput(sanitizeCurrencyInput(e.target.value))}
                                 className="w-full pl-16 pr-6 py-6 rounded-[30px] bg-slate-50 dark:bg-slate-800 font-black text-3xl outline-none border-4 border-transparent focus:border-red-500 transition-all shadow-inner"
                              />
                           </div>
                        </div>

                        {paymentMethodInput === PaymentMethod.CASH && (
                           <div className="space-y-2 animate-in slide-in-from-right-4">
                              <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2">Dinheiro Entregue</label>
                              <div className="relative">
                                 <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-400 text-xl">R$</span>
                                 <input
                                    type="text"
                                    inputMode="decimal"
                                    value={cashReceivedInput}
                                    onChange={e => setCashReceivedInput(sanitizeCurrencyInput(e.target.value))}
                                    className="w-full pl-16 pr-6 py-6 rounded-[30px] bg-emerald-50 dark:bg-emerald-950/20 font-black text-3xl outline-none border-4 border-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner"
                                 />
                              </div>
                           </div>
                        )}
                     </div>

                     {(paymentMethodInput === PaymentMethod.PENDURA || activeTabId === 'shortcut-payment') && (
                        <div className="space-y-2 animate-in slide-in-from-bottom-4">
                           <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-2">Identificação do Cliente</label>
                           <input
                              type="text"
                              value={customerNameInput}
                              onChange={e => activeTabId !== 'shortcut-payment' && setCustomerNameInput(e.target.value)}
                              readOnly={activeTabId === 'shortcut-payment'}
                              className={`w-full px-8 py-6 rounded-[30px] bg-slate-50 dark:bg-slate-800 font-black uppercase text-xl outline-none border-4 ${activeTabId === 'shortcut-payment' ? 'border-slate-100 text-slate-400' : 'border-red-100 focus:border-red-500'}`}
                              placeholder="NOME DO FIADO..."
                           />
                        </div>
                     )}

                     {!isQuickSale && (
                        <button onClick={handleAddPayment} disabled={remainingBalance <= 0.05} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-[30px] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-4">
                           <span>ADICIONAR AO RECEBIMENTO</span>
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" /></svg>
                        </button>
                     )}
                  </div>
               </div>

               {/* LADO DIREITO: RESUMO E CONCLUSÃO */}
               <div className="lg:w-[350px] space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 flex flex-col h-full min-h-[400px]">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Recebimentos Atuais</h3>
                     
                     <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar mb-6">
                        {currentPayments.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-center opacity-30 italic">
                              <span className="text-4xl mb-2">💸</span>
                              <p className="text-[10px] font-black uppercase">Nenhum pagamento<br/>adicionado ainda</p>
                           </div>
                        ) : (
                           currentPayments.map((p, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm">
                                 <div>
                                    <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{p.method}</p>
                                    <p className="text-[11px] font-black text-red-600 italic">{formatCurrency(p.amount)}</p>
                                 </div>
                                 <button onClick={() => setCurrentPayments(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 </button>
                              </div>
                           ))
                        )}
                     </div>

                     {liveChange > 0 && (
                        <div className="bg-emerald-600 text-white p-6 rounded-3xl text-center shadow-lg animate-in zoom-in-95 mb-6 border-4 border-emerald-400">
                           <p className="text-[9px] font-black uppercase tracking-widest opacity-80">TROCO OBRIGATÓRIO</p>
                           <p className="text-3xl font-black tracking-tighter">{formatCurrency(liveChange)}</p>
                        </div>
                     )}

                     <div className="space-y-3">
                        {!isQuickSale && (
                           <button 
                              onClick={() => {
                                 const text = `*BOTEQUISTA - COMPROVANTE*%0AValor: *${formatCurrency(tabTotal)}*%0AStatus: PAGO%0AData: ${new Date().toLocaleString()}`;
                                 window.open(`https://wa.me/?text=${text}`, '_blank');
                              }}
                              className="w-full py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800"
                           >
                              <span>📱</span> Comprovante WhatsApp
                           </button>
                        )}
                        <button
                           onClick={handleFinishSale}
                           disabled={(!isQuickSale && remainingBalance > 0.05) || isProcessing}
                           className={`w-full py-8 rounded-[30px] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1 
                           ${isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : isQuickSale ? 'bg-emerald-600 text-white' : (remainingBalance <= 0.05 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50')}`}
                        >
                           <span className="text-xs">{isProcessing ? 'PROCESSANDO...' : isQuickSale ? 'FECHAR BALCÃO' : 'FINALIZAR CONTA'}</span>
                           <span className="text-[10px] opacity-70 italic tracking-normal font-bold uppercase">{formatCurrency(tabTotal)}</span>
                        </button>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </div>
   );
};

export default POSPaymentPanel;
