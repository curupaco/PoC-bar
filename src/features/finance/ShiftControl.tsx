import React, { useState, useMemo } from 'react';
import { Shift, User, Sale, formatCurrency, PaymentMethod, sanitizeCurrencyInput, parseCurrencyValue, generateUniqueId } from '../../types';

interface ShiftControlProps {
   shifts: Shift[];
   onUpdateShifts: (shifts: Shift[], changedItem?: Shift) => void;
   currentUser: User;
   sales: Sale[];
   activeTabsCount: number;
}

const ShiftControl: React.FC<ShiftControlProps> = ({ shifts = [], onUpdateShifts, currentUser, sales = [], activeTabsCount }) => {
   const activeShift = shifts.find(s => s.status === 'open');
   const [showConferral, setShowConferral] = useState(false);

   const [valPrimary, setValPrimary] = useState('');
   const [valChange, setValChange] = useState('');
   const [actualCountedInput, setActualCountedInput] = useState('');

   const [isProcessing, setIsProcessing] = useState(false);
   const [openError, setOpenError] = useState<string | null>(null);

   const canOpen = currentUser.username === 'admin' || currentUser.permissions.includes('open_shift');
   const canClose = currentUser.username === 'admin' || currentUser.permissions.includes('close_shift');

   const shiftSales = useMemo(() => {
      if (!activeShift) return [];
      return (sales || []).filter(s => {
         if (s.deleted) return false;
         if (s.shiftId === activeShift.id) return true;
         if (!s.shiftId && s.timestamp >= activeShift.startTime) {
            if (!activeShift.endTime) return true;
            return s.timestamp <= activeShift.endTime;
         }
         return false;
      });
   }, [activeShift, sales]);

   const shiftStats = useMemo(() => {
      const totals: Record<string, number> = {
         [PaymentMethod.PIX]: 0,
         [PaymentMethod.DEBITO]: 0,
         [PaymentMethod.CREDITO]: 0,
         [PaymentMethod.CASH]: 0,
         [PaymentMethod.PENDURA]: 0,
      };
      let totalItems = 0;

      shiftSales.forEach(s => {
         if (s.payments) {
            s.payments.forEach(p => { if (totals[p.method] !== undefined) totals[p.method] += p.amount; });
         } else {
            if (totals[s.paymentMethod] !== undefined) totals[s.paymentMethod] += s.total;
         }
         s.items?.forEach(i => totalItems += i.quantity);
      });

      return { totals, totalItems, ticketCount: shiftSales.length };
   }, [shiftSales]);

   const totalSoldInShift = shiftSales.reduce((acc, s) => acc + (s.total || 0), 0);

   const cashMovements = useMemo(() => {
      let salesTotal = 0;
      let settlementsTotal = 0;
      shiftSales.forEach(s => {
         if (s.payments && s.payments.length > 0) {
            s.payments.forEach(p => {
               if (p.method === PaymentMethod.CASH) {
                  const amount = Number(p.amount) || 0;
                  if (s.items?.some(i => i.productId === 'quitacao')) settlementsTotal += amount;
                  else salesTotal += amount;
               }
            });
         } else {
            if (s.paymentMethod === PaymentMethod.CASH) {
               const amount = Number(s.total) || 0;
               if (s.items?.some(i => i.productId === 'quitacao')) settlementsTotal += amount;
               else salesTotal += amount;
            }
         }
      });
      return { sales: salesTotal, settlements: settlementsTotal, total: salesTotal + settlementsTotal };
   }, [shiftSales]);

   const internalTransfers = useMemo(() => {
      if (!activeShift || !activeShift.transactions) return { incoming: 0, outgoing: 0, net: 0 };
      const incoming = activeShift.transactions.filter(t => t.to === 'Change').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      const outgoing = activeShift.transactions.filter(t => t.from === 'Change').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      return { incoming, outgoing, net: incoming - outgoing };
   }, [activeShift]);

   const openingBalance = Number(activeShift?.openingCashChange) || 0;
   const expectedCashInDrawer = openingBalance + cashMovements.total + internalTransfers.net;

   // Cálculo da diferença em tempo real para o modal
   const currentDifference = useMemo(() => {
      const counted = parseCurrencyValue(actualCountedInput);
      return counted - expectedCashInDrawer;
   }, [actualCountedInput, expectedCashInDrawer]);

   // Cálculo do Total de Abertura (Item 3 do Plano)
   const totalOpeningCapital = useMemo(() => {
      return parseCurrencyValue(valPrimary) + parseCurrencyValue(valChange);
   }, [valPrimary, valChange]);

   const handleOpenShift = async () => {
      if (!canOpen) return;
      setOpenError(null);
      const pVal = parseCurrencyValue(valPrimary);
      const cVal = parseCurrencyValue(valChange);

      if (pVal === 0 && cVal === 0) {
         setOpenError("ABRIR ZERADO? NEM PENSAR! INFORME O FUNDO DE CAIXA. 💸");
         return;
      }
      setIsProcessing(true);
      await new Promise(r => setTimeout(r, 400));
      const newShift: Shift = {
         id: generateUniqueId('shift'),
         startTime: Date.now(),
         openedBy: currentUser.username,
         status: 'open',
         cashPrimary: pVal,
         cashChange: cVal,
         cashSecondary: 0, // Desativado
         openingCashPrimary: pVal,
         openingCashChange: cVal,
         openingCashSecondary: 0, // Desativado
         transactions: [],
         version: 1
      };

      console.log(`[TURNO_ABERTURA] ID: ${newShift.id} | Usuário: ${newShift.openedBy} | Fundo: ${formatCurrency(pVal + cVal)}`);

      onUpdateShifts([newShift, ...shifts], newShift);
      setValPrimary(''); setValChange('');
      setIsProcessing(false);
   };

   const handleConfirmClose = async () => {
      if (!canClose || !activeShift || isProcessing) return;

      setIsProcessing(true);
      // Pequeno delay para garantir que o estado da UI reflita a trava
      await new Promise(r => setTimeout(r, 600));

      const actualCounted = parseCurrencyValue(actualCountedInput);
      const calculatedPrimary = (activeShift.openingCashPrimary || 0) +
         (activeShift.transactions?.filter(t => t.to === 'Primary').reduce((sum, t) => sum + t.amount, 0) || 0) -
         (activeShift.transactions?.filter(t => t.from === 'Primary').reduce((sum, t) => sum + t.amount, 0) || 0);

      const difference = actualCounted - expectedCashInDrawer;

      const closedShift: Shift = {
         ...activeShift, status: 'closed', endTime: Date.now(), closedBy: currentUser.username,
         finalCashPrimary: calculatedPrimary, finalCashChange: expectedCashInDrawer,
         finalCashSecondary: 0, actualCashCounted: actualCounted, cashDifference: difference,
         version: (activeShift.version || 1) + 1
      };

      console.log(`[TURNO_FECHAMENTO] ID: ${closedShift.id} | Usuário: ${closedShift.closedBy} | Total Vendas: ${formatCurrency(totalSoldInShift)} | Diferença: ${formatCurrency(difference)}`);

      onUpdateShifts(shifts.map(s => s.id === activeShift.id ? closedShift : s), closedShift);
      setShowConferral(false); setActualCountedInput('');
      setIsProcessing(false);
   };

   const getCompartmentIcon = (index: number) => {
      switch (index) {
         case 0: return '🔐'; // Cofre (Segurança)
         case 1: return '💸'; // Gaveta (Fluxo)
         default: return '💰';
      }
   };

   return (
      <div className="max-w-6xl mx-auto space-y-8 pb-32 relative">
         {activeShift ? (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-10">
                     <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Monitor de Turno</h2>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                           <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Responsável: @{activeShift.openedBy} • Aberto às {new Date(activeShift.startTime).toLocaleTimeString()}</p>
                        </div>
                     </div>
                     <button onClick={() => setShowConferral(true)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95">Fechar Turno</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Faturamento Bruto</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{formatCurrency(totalSoldInShift)}</p>
                        <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase italic">{shiftStats.ticketCount} tickets emitidos</p>
                     </div>
                     <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Entradas Dinheiro</p>
                        <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(cashMovements.sales)}</p>
                        <p className="text-[9px] font-bold text-emerald-600/60 mt-1 uppercase italic">Gaveta Física</p>
                     </div>
                     <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                        <p className="text-[9px] font-black text-blue-600 uppercase mb-2">Esperado Gaveta</p>
                        <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(expectedCashInDrawer)}</p>
                        <p className="text-[9px] font-bold text-blue-600/60 mt-1 uppercase italic">Fundo + Vendas</p>
                     </div>
                     <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                        <p className="text-[9px] font-black text-indigo-600 uppercase mb-2">Itens Lançados</p>
                        <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400">{shiftStats.totalItems}</p>
                        <p className="text-[9px] font-bold text-indigo-600/60 mt-1 uppercase italic">Volume de saída</p>
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
               {/* Item 1: Container "Card Físico" Sólido e Arredondado */}
               <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800">

                  <div className="text-center mb-10">
                     <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-3">Abertura de Turno</h2>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Configure o capital inicial do dia</p>
                  </div>

                  {/* Item 3: Totalizador Automático */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 mb-10 flex flex-col items-center">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capital Inicial Total</span>
                     <span className={`text-4xl font-black tracking-tighter transition-all ${totalOpeningCapital > 0 ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}>
                        {formatCurrency(totalOpeningCapital)}
                     </span>
                  </div>

                  {/* Item 2: Inputs transformados em "Cards de Compartimento" */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-2xl mx-auto">
                     {[
                        { label: 'Fundo Cofre', val: valPrimary, set: setValPrimary, color: 'border-slate-200 focus-within:border-slate-400' },
                        { label: 'Troco Gaveta', val: valChange, set: setValChange, color: 'border-emerald-200 focus-within:border-emerald-500 bg-emerald-50/30' }
                     ].map((item, idx) => (
                        <div
                           key={idx}
                           className={`group relative p-6 rounded-[28px] border-2 transition-all duration-300 ${item.color} bg-white dark:bg-slate-950 shadow-sm hover:shadow-lg`}
                        >
                           <div className="flex justify-between items-start mb-4">
                              <span className="text-4xl drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300">{getCompartmentIcon(idx)}</span>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right leading-tight">{item.label}</label>
                           </div>

                           <div className="relative">
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">R$</span>
                              <input
                                 type="text"
                                 inputMode="decimal"
                                 value={item.val}
                                 onChange={e => { setOpenError(null); item.set(sanitizeCurrencyInput(e.target.value)); }}
                                 className="w-full text-right bg-transparent font-black text-2xl outline-none text-slate-800 dark:text-white placeholder-slate-200"
                                 placeholder="0,00"
                              />
                           </div>
                        </div>
                     ))}
                  </div>

                  {openError && (
                     <div className="mb-8 animate-in slide-in-from-top-2 duration-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-4 rounded-2xl flex items-center justify-center gap-3">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{openError}</p>
                     </div>
                  )}

                  {/* Item 4: Adequação da Paleta de Cores (Botão Vermelho) */}
                  <button
                     onClick={handleOpenShift}
                     disabled={isProcessing}
                     className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:shadow-xl shadow-red-600/20"
                  >
                     {isProcessing ? (
                        'Processando...'
                     ) : (
                        <>
                           <span>Iniciar Operação</span>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </>
                     )}
                  </button>
               </div>
            </div>
         )}

         {showConferral && activeShift && (
            <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl animate-in fade-in" onClick={() => setShowConferral(false)} />
               <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] p-8 shadow-2xl relative z-[710] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 flex flex-col md:flex-row gap-8">

                  {/* COLUNA DA ESQUERDA: EXTRATO DO SISTEMA */}
                  <div className="flex-1 space-y-6">
                     <div className="mb-4">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Fechamento</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Demonstrativo do Sistema</p>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                           <span className="font-bold text-slate-500 uppercase">Fundo de Abertura</span>
                           <span className="font-black text-slate-700 dark:text-slate-300">{formatCurrency(openingBalance)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="font-bold text-slate-500 uppercase">Vendas Dinheiro</span>
                           <span className="font-black text-emerald-600">+ {formatCurrency(cashMovements.total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="font-bold text-slate-500 uppercase">Suprimentos</span>
                           <span className="font-black text-blue-500">+ {formatCurrency(internalTransfers.incoming)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="font-bold text-slate-500 uppercase">Sangrias</span>
                           <span className="font-black text-red-500">- {formatCurrency(internalTransfers.outgoing)}</span>
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Saldo Esperado na Gaveta</span>
                           <span className="font-black text-slate-900 dark:text-white text-lg">{formatCurrency(expectedCashInDrawer)}</span>
                        </div>
                     </div>

                     <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outros (Cartão/Pix)</span>
                        <span className="text-xs font-black text-slate-600 dark:text-slate-400">{formatCurrency(totalSoldInShift - cashMovements.total)}</span>
                     </div>
                  </div>

                  {/* COLUNA DA DIREITA: CONFERÊNCIA FÍSICA */}
                  <div className="flex-1 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 md:pl-8 pt-6 md:pt-0">
                     <div className="space-y-6">
                        <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor Contado (Físico)</label>
                           <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">R$</span>
                              <input
                                 autoFocus
                                 type="text"
                                 inputMode="decimal"
                                 value={actualCountedInput}
                                 onChange={e => setActualCountedInput(sanitizeCurrencyInput(e.target.value))}
                                 className="w-full pl-16 pr-6 py-5 rounded-2xl bg-white dark:bg-slate-900 font-black text-3xl outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner text-emerald-600"
                                 placeholder="0,00"
                              />
                           </div>
                        </div>

                        {/* Indicador de Diferença em Tempo Real */}
                        <div className={`p-4 rounded-2xl flex justify-between items-center border ${currentDifference === 0 ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : currentDifference > 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'}`}>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${currentDifference === 0 ? 'text-slate-400' : currentDifference > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {currentDifference === 0 ? 'Caixa Batido' : currentDifference > 0 ? 'Sobra de Caixa' : 'Quebra de Caixa'}
                           </span>
                           <span className={`text-xl font-black ${currentDifference === 0 ? 'text-slate-400' : currentDifference > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {formatCurrency(Math.abs(currentDifference))}
                           </span>
                        </div>
                     </div>

                     <div className="mt-8 flex flex-col gap-3">
                        <button
                           onClick={handleConfirmClose}
                           disabled={isProcessing}
                           className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                        >
                           {isProcessing ? 'PROCESSANDO...' : 'Confirmar Fechamento'}
                        </button>
                        <button onClick={() => setShowConferral(false)} className="text-slate-400 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors py-3">Voltar</button>
                     </div>
                  </div>

               </div>
            </div>
         )}
      </div>
   );
};

export default ShiftControl;