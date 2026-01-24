
import React, { useState, useMemo } from 'react';
import { Shift, User, Sale, formatCurrency, PaymentMethod, sanitizeCurrencyInput, parseCurrencyValue, generateUniqueId } from '../types';

interface ShiftControlProps {
  shifts: Shift[];
  onUpdateShifts: (shifts: Shift[]) => void;
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

  const canOpen = currentUser.username === 'admin' || currentUser.permissions.includes('open_shift');
  const canClose = currentUser.username === 'admin' || currentUser.permissions.includes('close_shift');

  const shiftSales = useMemo(() => {
    if (!activeShift) return [];
    return (sales || []).filter(s => s.shiftId === activeShift.id && !s.deleted);
  }, [activeShift, sales]);

  const deletedSalesTotal = useMemo(() => {
    if (!activeShift) return 0;
    return (sales || [])
      .filter(s => s.shiftId === activeShift.id && s.deleted)
      .reduce((acc, s) => acc + (s.total || 0), 0);
  }, [activeShift, sales]);

  const totalSoldInShift = shiftSales.reduce((acc, s) => acc + (s.total || 0), 0);
  
  // LÓGICA DE MOVIMENTAÇÃO DE VENDAS (Dinheiro e Quitações)
  const cashMovements = useMemo(() => {
    let salesTotal = 0;
    let settlementsTotal = 0;

    shiftSales.forEach(s => {
       // Cenário 1: Venda com Pagamentos Múltiplos (Split Payment)
       if (s.payments && s.payments.length > 0) {
          s.payments.forEach(p => {
             if (p.method === PaymentMethod.CASH) {
                // Se o item for "quitacao", conta como recebimento de dívida, senão é venda normal
                if (s.items?.some(i => i.productId === 'quitacao')) {
                   settlementsTotal += p.amount;
                } else {
                   salesTotal += p.amount;
                }
             }
          });
       } 
       // Cenário 2: Venda Simples (Legado ou Pagamento Único)
       else {
          if (s.paymentMethod === PaymentMethod.CASH) {
             if (s.items?.some(i => i.productId === 'quitacao')) {
                settlementsTotal += s.total;
             } else {
                salesTotal += s.total;
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

  // LÓGICA DE TRANSFERÊNCIAS INTERNAS (Sangrias e Suprimentos)
  const internalTransfers = useMemo(() => {
    if (!activeShift || !activeShift.transactions) return 0;
    
    // Entradas na Gaveta (Suprimento vindo do Cofre ou Primário)
    const incoming = activeShift.transactions
      .filter(t => t.to === 'Change')
      .reduce((acc, t) => acc + t.amount, 0);

    // Saídas da Gaveta (Sangria para Cofre ou Primário)
    const outgoing = activeShift.transactions
      .filter(t => t.from === 'Change')
      .reduce((acc, t) => acc + t.amount, 0);

    return incoming - outgoing;
  }, [activeShift]);

  // CÁLCULO DO SALDO ESPERADO (Auditável)
  // Fix: Usa estritamente 'openingCashChange'. Se não existir, assume 0 para não corromper o cálculo com o saldo atual.
  const openingBalance = activeShift?.openingCashChange ?? 0;
  
  // Fórmula: O que começou + O que vendeu em dinheiro + (O que entrou de troco - O que saiu de sangria)
  const expectedCashInDrawer = openingBalance + cashMovements.total + internalTransfers;

  const handleOpenShift = () => {
    if (!canOpen) return;
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
      openingCashChange: cVal, // Snapshot crítico para auditoria
      openingCashSecondary: sVal,
      transactions: []
    };
    onUpdateShifts([newShift, ...shifts]);
    setValPrimary('');
    setValChange('');
    setValSecondary('');
  };

  const handleTryClose = () => {
    if (!canClose) return;
    setShowConferral(true);
  };

  const handleConfirmClose = () => {
    if (!canClose || !activeShift) return;

    const actualCounted = parseCurrencyValue(actualCountedInput);
    const difference = actualCounted - expectedCashInDrawer;

    const updatedShifts = shifts.map(s => s.id === activeShift.id ? { 
      ...s, 
      status: 'closed' as const, 
      endTime: Date.now(), 
      closedBy: currentUser.username,
      finalCashPrimary: s.cashPrimary,
      finalCashChange: expectedCashInDrawer, // Registra o teórico no fechamento
      finalCashSecondary: s.cashSecondary,
      actualCashCounted: actualCounted,      // Registra o físico contado
      cashDifference: difference             // Registra a quebra
    } : s);
    
    onUpdateShifts(updatedShifts);
    setShowConferral(false);
    setActualCountedInput('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 relative">
      {showConferral && activeShift && (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 lg:p-12 animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-white dark:bg-slate-900 w-full h-full max-w-4xl lg:rounded-[60px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="p-8 lg:p-12 bg-red-600 text-white shrink-0">
                 <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter italic leading-none">Conferência de Caixa</h2>
                 <p className="text-xs lg:text-sm font-black uppercase tracking-widest mt-4 opacity-80">Validação Física de Valores na Gaveta</p>
              </div>
              <div className="flex-1 p-8 lg:p-20 overflow-y-auto space-y-12 no-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Auditoria de Valores (Sistema)</h3>
                       <div className="space-y-4 font-mono text-lg">
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                             <span className="text-slate-500 uppercase text-[10px] font-black">Fundo de Abertura</span>
                             <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(openingBalance)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                             <span className="text-slate-500 uppercase text-[10px] font-black">Vendas/Recebimentos (Dinheiro)</span>
                             <span className="font-bold text-emerald-500">+{formatCurrency(cashMovements.total)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                             <span className="text-slate-500 uppercase text-[10px] font-black">Movimentações (Sangrias/Sup)</span>
                             <span className={`font-bold ${internalTransfers >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                {internalTransfers >= 0 ? '+' : ''}{formatCurrency(internalTransfers)}
                             </span>
                          </div>
                          <div className="pt-4 flex justify-between text-2xl font-black text-slate-900 dark:text-white">
                             <span className="text-[10px] self-center font-black uppercase">SALDO ESPERADO:</span>
                             <span>{formatCurrency(expectedCashInDrawer)}</span>
                          </div>

                          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                             <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                   <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vendas Anuladas:</span>
                                </div>
                                <span className="text-sm font-black text-red-500">{formatCurrency(deletedSalesTotal)}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-6 flex flex-col justify-center">
                       <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">Quanto dinheiro tem na gaveta agora?</p>
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">R$</span>
                          <input 
                             autoFocus
                             type="text" 
                             inputMode="decimal" 
                             value={actualCountedInput} 
                             onChange={e => setActualCountedInput(sanitizeCurrencyInput(e.target.value))} 
                             className="w-full bg-white dark:bg-slate-950 pl-20 pr-6 py-8 rounded-3xl border-4 border-red-500 font-black text-4xl outline-none text-center shadow-inner" 
                             placeholder="0,00"
                          />
                       </div>
                       {actualCountedInput && (
                          <div className={`text-center p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest animate-in zoom-in-95 ${Math.abs(parseCurrencyValue(actualCountedInput) - expectedCashInDrawer) < 0.05 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                             {Math.abs(parseCurrencyValue(actualCountedInput) - expectedCashInDrawer) < 0.05 ? 'CONCILIAÇÃO PERFEITA' : `QUEBRA DE CAIXA: ${formatCurrency(parseCurrencyValue(actualCountedInput) - expectedCashInDrawer)}`}
                          </div>
                       )}
                    </div>
                 </div>
              </div>
              <div className="p-8 lg:p-12 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 shrink-0">
                 <button onClick={handleConfirmClose} disabled={!actualCountedInput} className="flex-1 bg-red-600 text-white py-6 rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-red-600/30 active:scale-95 transition-all disabled:opacity-50">EFETIVAR FECHAMENTO</button>
                 <button onClick={() => { setShowConferral(false); setActualCountedInput(''); }} className="lg:w-64 bg-white dark:bg-slate-900 text-slate-500 py-6 rounded-3xl font-black uppercase text-sm tracking-widest border border-slate-200 dark:border-slate-800 active:scale-95 transition-all">CANCELAR</button>
              </div>
           </div>
        </div>
      )}

      {activeShift ? (
        <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-800">
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-center">
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">Turno Ativo</h2>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Responsável: @{activeShift.openedBy}</p>
                 </div>
                 <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Total Bruto</p>
                    <p className="text-3xl font-black text-white">{formatCurrency(totalSoldInShift)}</p>
                 </div>
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Entradas Dinheiro</p>
                    <p className="text-3xl font-black text-emerald-400">{formatCurrency(cashMovements.sales)}</p>
                 </div>
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Gaveta (Previsto)</p>
                    <p className="text-3xl font-black text-blue-400">{formatCurrency(expectedCashInDrawer)}</p>
                 </div>
              </div>
              <div className="pt-4">
                <button onClick={handleTryClose} className="w-full bg-red-600 hover:bg-red-700 py-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-red-900/40 active:scale-95">FECHAR TURNO E CONFERIR CAIXA</button>
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
                        type="text" 
                        inputMode="decimal" 
                        value={item.val} 
                        onChange={e => item.set(sanitizeCurrencyInput(e.target.value))} 
                        className="w-full bg-slate-50 dark:bg-slate-950 pl-12 pr-6 py-6 rounded-3xl border border-slate-200 dark:border-slate-800 font-black text-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                        placeholder="0,00"
                      />
                   </div>
                </div>
              ))}
           </div>
           <button onClick={handleOpenShift} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Iniciar Atividades do Turno</button>
        </div>
      )}
    </div>
  );
};

export default ShiftControl;
