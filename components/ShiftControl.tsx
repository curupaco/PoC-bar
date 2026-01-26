
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
  const [viewingHistoryShift, setViewingHistoryShift] = useState<Shift | null>(null);
  
  const [valPrimary, setValPrimary] = useState('');
  const [valChange, setValChange] = useState('');
  const [valSecondary, setValSecondary] = useState('');
  const [actualCountedInput, setActualCountedInput] = useState('');
  
  // FIX 4: Feedback Tátil - Loading state
  const [isProcessing, setIsProcessing] = useState(false);

  const canOpen = currentUser.username === 'admin' || currentUser.permissions.includes('open_shift');
  const canClose = currentUser.username === 'admin' || currentUser.permissions.includes('close_shift');

  // FIX: Fallback de horário para vendas sem shiftId (Sincronização Lenta ou Bar 2)
  const shiftSales = useMemo(() => {
    if (!activeShift) return [];
    return (sales || []).filter(s => {
       if (s.deleted) return false;
       // 1. Match Exato de ID
       if (s.shiftId === activeShift.id) return true;
       // 2. Fallback de Segurança (Se perdeu o ID na sync, mas o horário bate)
       if (!s.shiftId && s.timestamp >= activeShift.startTime) {
          // Se o turno ainda está aberto, pega tudo depois da abertura
          if (!activeShift.endTime) return true;
          // Se já fechou, respeita o limite
          return s.timestamp <= activeShift.endTime;
       }
       return false;
    });
  }, [activeShift, sales]);

  const deletedSalesTotal = useMemo(() => {
    if (!activeShift) return 0;
    return (sales || [])
      .filter(s => s.shiftId === activeShift.id && s.deleted)
      .reduce((acc, s) => acc + (s.total || 0), 0);
  }, [activeShift, sales]);

  const totalSoldInShift = shiftSales.reduce((acc, s) => acc + (s.total || 0), 0);
  
  // FIX: Garantia de Tipagem Numérica e Soma Robusta
  const cashMovements = useMemo(() => {
    let salesTotal = 0;
    let settlementsTotal = 0;

    shiftSales.forEach(s => {
       // Tratamento de Split Payment
       if (s.payments && s.payments.length > 0) {
          s.payments.forEach(p => {
             if (p.method === PaymentMethod.CASH) {
                const amount = Number(p.amount) || 0; // Force Number
                if (s.items?.some(i => i.productId === 'quitacao')) {
                   settlementsTotal += amount;
                } else {
                   salesTotal += amount;
                }
             }
          });
       } 
       // Tratamento Legado / Pagamento Único
       else {
          if (s.paymentMethod === PaymentMethod.CASH) {
             const amount = Number(s.total) || 0; // Force Number
             if (s.items?.some(i => i.productId === 'quitacao')) {
                settlementsTotal += amount;
             } else {
                salesTotal += amount;
             }
          }
       }
    });

    return {
      sales: salesTotal,
      settlements: settlementsTotal,
      total: salesTotal + settlementsTotal
    };
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
    setIsProcessing(true);
    
    // Pequeno delay artificial para feedback visual (tactile feel)
    await new Promise(r => setTimeout(r, 400));

    const pVal = parseCurrencyValue(valPrimary);
    const cVal = parseCurrencyValue(valChange);
    const sVal = parseCurrencyValue(valSecondary);

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
      ...activeShift, 
      status: 'closed', 
      endTime: Date.now(), 
      closedBy: currentUser.username,
      finalCashPrimary: calculatedPrimary, 
      finalCashChange: expectedCashInDrawer, 
      finalCashSecondary: calculatedSecondary, 
      actualCashCounted: actualCounted, 
      cashDifference: difference
    };

    const updatedShifts = shifts.map(s => s.id === activeShift.id ? closedShift : s);
    onUpdateShifts(updatedShifts, closedShift);
    setShowConferral(false); setActualCountedInput('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 relative">
      {viewingHistoryShift && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setViewingHistoryShift(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative z-[610] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
               <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Detalhes do Turno</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fechado em: {new Date(viewingHistoryShift.endTime || 0).toLocaleString()}</p>
               </div>
               <button onClick={() => setViewingHistoryShift(null)} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-all">✕</button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Abertura</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">@{viewingHistoryShift.openedBy}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(viewingHistoryShift.startTime).toLocaleTimeString()}</p>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Fechamento</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">@{viewingHistoryShift.closedBy || '?'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{viewingHistoryShift.endTime ? new Date(viewingHistoryShift.endTime).toLocaleTimeString() : '-'}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeShift ? (
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-center">
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">Turno Ativo</h2>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Responsável: @{activeShift.openedBy}</p>
                 </div>
                 <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Total Bruto</p>
                    <p className="text-3xl font-black">{formatCurrency(totalSoldInShift)}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Entradas Dinheiro</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(cashMovements.sales)}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Gaveta (Previsto)</p>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(expectedCashInDrawer)}</p>
                 </div>
              </div>
              <div className="pt-4">
                <button onClick={() => setShowConferral(true)} className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-red-900/40 active:scale-95">FECHAR TURNO E CONFERIR CAIXA</button>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center animate-in fade-in duration-500">
           <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4 italic">Abertura de Turno</h2>
           <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">Informe os valores iniciais para começar a operar</p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12 text-left">
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
                        type="text" inputMode="decimal" value={item.val} onChange={e => item.set(sanitizeCurrencyInput(e.target.value))} 
                        className="w-full bg-slate-50 dark:bg-slate-950 pl-12 pr-6 py-6 rounded-3xl border border-slate-200 dark:border-slate-800 font-black text-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                        placeholder="0,00"
                      />
                   </div>
                </div>
              ))}
           </div>
           <button onClick={handleOpenShift} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:scale-100">
              {isProcessing && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isProcessing ? 'Abrindo...' : 'Iniciar Atividades do Turno'}
           </button>
        </div>
      )}

      {showConferral && activeShift && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl animate-in fade-in" onClick={() => setShowConferral(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-10 shadow-2xl relative z-[710] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="mb-8">
               <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Conferência Cega</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Conte o dinheiro físico da gaveta</p>
             </div>
             
             <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-3xl mb-8 border border-slate-200 dark:border-slate-800">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor Encontrado (Dinheiro)</label>
               <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">R$</span>
                  <input 
                    autoFocus
                    type="text" 
                    inputMode="decimal"
                    value={actualCountedInput}
                    onChange={e => setActualCountedInput(sanitizeCurrencyInput(e.target.value))}
                    className="w-full pl-16 pr-6 py-5 rounded-2xl bg-white dark:bg-slate-900 font-black text-3xl outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="0,00"
                  />
               </div>
             </div>

             <button onClick={handleConfirmClose} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all">
               Confirmar Fechamento
             </button>
             <button onClick={() => setShowConferral(false)} className="mt-4 text-slate-400 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors">
               Voltar / Contar Novamente
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftControl;
