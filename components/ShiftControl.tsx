
import React, { useState, useMemo } from 'react';
import { Shift, User, Sale, formatCurrency, PaymentMethod, sanitizeCurrencyInput, parseCurrencyValue, generateUniqueId } from '../types';

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
  const [valSecondary, setValSecondary] = useState('');
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
    if (!activeShift || !activeShift.transactions) return 0;
    const incoming = activeShift.transactions.filter(t => t.to === 'Change').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const outgoing = activeShift.transactions.filter(t => t.from === 'Change').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    return incoming - outgoing;
  }, [activeShift]);

  const openingBalance = Number(activeShift?.openingCashChange) || 0;
  const expectedCashInDrawer = openingBalance + cashMovements.total + internalTransfers;

  const handleOpenShift = async () => {
    if (!canOpen) return;
    setOpenError(null);
    const pVal = parseCurrencyValue(valPrimary);
    const cVal = parseCurrencyValue(valChange);
    const sVal = parseCurrencyValue(valSecondary);
    if (pVal === 0 && cVal === 0 && sVal === 0) {
      setOpenError("NÃO É PERMITIDO ABRIR UM TURNO COM TODOS OS VALORES ZERADOS.");
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
      cashSecondary: sVal,
      openingCashPrimary: pVal,
      openingCashChange: cVal,
      openingCashSecondary: sVal,
      transactions: []
    };
    onUpdateShifts([newShift, ...shifts], newShift);
    setValPrimary(''); setValChange(''); setValSecondary('');
    setIsProcessing(false);
  };

  const handleConfirmClose = () => {
    if (!canClose || !activeShift) return;
    const actualCounted = parseCurrencyValue(actualCountedInput);
    const calculatedPrimary = (activeShift.openingCashPrimary || 0) + 
        (activeShift.transactions?.filter(t => t.to === 'Primary').reduce((sum, t) => sum + t.amount, 0) || 0) -
        (activeShift.transactions?.filter(t => t.from === 'Primary').reduce((sum, t) => sum + t.amount, 0) || 0);
    const calculatedSecondary = (activeShift.openingCashSecondary || 0) +
        (activeShift.transactions?.filter(t => t.to === 'Secondary').reduce((sum, t) => sum + t.amount, 0) || 0) -
        (activeShift.transactions?.filter(t => t.from === 'Secondary').reduce((sum, t) => sum + t.amount, 0) || 0);
    const difference = actualCounted - expectedCashInDrawer;
    
    const closedShift: Shift = { 
      ...activeShift, status: 'closed', endTime: Date.now(), closedBy: currentUser.username,
      finalCashPrimary: calculatedPrimary, finalCashChange: expectedCashInDrawer, 
      finalCashSecondary: calculatedSecondary, actualCashCounted: actualCounted, cashDifference: difference
    };
    onUpdateShifts(shifts.map(s => s.id === activeShift.id ? closedShift : s), closedShift);
    setShowConferral(false); setActualCountedInput('');
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
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center animate-in fade-in duration-500">
           <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4 italic">Abertura de Turno</h2>
           <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">Informe os valores iniciais para começar a operar</p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8 text-left">
              {[
                { label: 'Fundo Principal', val: valPrimary, set: setValPrimary },
                { label: 'Troco da Gaveta', val: valChange, set: setValChange },
                { label: 'Caixa Reserva', val: valSecondary, set: setValSecondary }
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{item.label}</label>
                   <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                      <input 
                        type="text" inputMode="decimal" value={item.val} onChange={e => { setOpenError(null); item.set(sanitizeCurrencyInput(e.target.value)); }} 
                        className="w-full bg-slate-50 dark:bg-slate-950 pl-12 pr-6 py-6 rounded-3xl border border-slate-200 dark:border-slate-800 font-black text-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                        placeholder="0,00"
                      />
                   </div>
                </div>
              ))}
           </div>
           
           {openError && (
              <div className="max-w-4xl mx-auto mb-8 animate-in slide-in-from-top-2 duration-300">
                 <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-4 rounded-2xl flex items-center justify-center gap-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{openError}</p>
                 </div>
              </div>
           )}

           <button onClick={handleOpenShift} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50">
              {isProcessing ? 'Abrindo...' : 'Iniciar Atividades do Turno'}
           </button>
        </div>
      )}

      {showConferral && activeShift && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl animate-in fade-in" onClick={() => setShowConferral(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-[710] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="mb-6">
               <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Fechamento de Caixa</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Conferência final de valores</p>
             </div>
             <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl mb-8 border border-slate-200 dark:border-slate-800">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor Contado (Físico)</label>
               <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">R$</span>
                  <input autoFocus type="text" inputMode="decimal" value={actualCountedInput} onChange={e => setActualCountedInput(sanitizeCurrencyInput(e.target.value))} className="w-full pl-16 pr-6 py-5 rounded-2xl bg-white dark:bg-slate-900 font-black text-3xl outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" placeholder="0,00" />
               </div>
             </div>
             <button onClick={handleConfirmClose} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">Confirmar Fechamento</button>
             <button onClick={() => setShowConferral(false)} className="mt-4 text-slate-400 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors">Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftControl;
