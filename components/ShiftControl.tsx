
import React, { useState, useMemo } from 'react';
import { Shift, User, Sale, formatCurrency, PaymentMethod } from '../types';

interface ShiftControlProps {
  shifts: Shift[];
  onUpdateShifts: (shifts: Shift[]) => void;
  currentUser: User;
  sales: Sale[];
}

const ShiftControl: React.FC<ShiftControlProps> = ({ shifts = [], onUpdateShifts, currentUser, sales = [] }) => {
  const activeShift = shifts.find(s => s.status === 'open');
  const [showConferral, setShowConferral] = useState(false);
  
  const [valPrimary, setValPrimary] = useState('0');
  const [valChange, setValChange] = useState('0');
  const [valSecondary, setValSecondary] = useState('0');

  const canOpen = currentUser.username === 'admin' || currentUser.permissions.includes('open_shift');
  const canClose = currentUser.username === 'admin' || currentUser.permissions.includes('close_shift');

  const shiftSales = useMemo(() => {
    if (!activeShift) return [];
    return (sales || []).filter(s => s.shiftId === activeShift.id);
  }, [activeShift, sales]);

  const totalSoldInShift = shiftSales.reduce((acc, s) => acc + (s.total || 0), 0);
  
  const cashMovements = useMemo(() => {
    const cashSalesOnly = shiftSales
      .filter(s => s.paymentMethod === PaymentMethod.CASH && !s.items?.some(i => i.productId === 'quitacao'))
      .reduce((acc, s) => acc + s.total, 0);

    const cashSettlementsOnly = shiftSales
      .filter(s => s.paymentMethod === PaymentMethod.CASH && s.items?.some(i => i.productId === 'quitacao'))
      .reduce((acc, s) => acc + s.total, 0);

    return {
      sales: cashSalesOnly,
      settlements: cashSettlementsOnly,
      total: cashSalesOnly + cashSettlementsOnly
    };
  }, [shiftSales]);

  const handleOpenShift = () => {
    if (!canOpen) return;
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      startTime: Date.now(),
      openedBy: currentUser.username,
      status: 'open',
      cashPrimary: parseFloat(valPrimary.replace(',', '.')) || 0,
      cashChange: parseFloat(valChange.replace(',', '.')) || 0,
      cashSecondary: parseFloat(valSecondary.replace(',', '.')) || 0
    };
    onUpdateShifts([newShift, ...shifts]);
    setValPrimary('0');
    setValChange('0');
    setValSecondary('0');
  };

  const handleConfirmClose = () => {
    if (!canClose || !activeShift) return;

    const estimatedChange = (activeShift.cashChange || 0) + cashMovements.total;
    const updatedShifts = shifts.map(s => s.id === activeShift.id ? { 
      ...s, 
      status: 'closed' as const, 
      endTime: Date.now(), 
      closedBy: currentUser.username,
      finalCashPrimary: s.cashPrimary,
      finalCashChange: estimatedChange,
      finalCashSecondary: s.cashSecondary
    } : s);
    
    onUpdateShifts(updatedShifts);
    setShowConferral(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
      {showConferral && activeShift && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-0 lg:p-12 animate-in fade-in zoom-in-95 duration-500">
           <div className="bg-white dark:bg-slate-900 w-full h-full max-w-4xl lg:rounded-[60px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="p-8 lg:p-12 bg-red-600 text-white shrink-0">
                 <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter italic">Conferência Final</h2>
                 <p className="text-xs lg:text-sm font-black uppercase tracking-widest mt-2 opacity-80">Validação de Valores para Fechamento de Turno</p>
              </div>
              <div className="flex-1 p-8 lg:p-20 overflow-y-auto space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Resumo de Movimentações</h3>
                       <div className="space-y-4 font-mono text-lg">
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                             <span className="text-slate-500 uppercase">Fundo Inicial</span>
                             <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(activeShift.cashChange)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                             <span className="text-slate-500 uppercase">Vendas Dinheiro</span>
                             <span className="font-bold text-emerald-500">+{formatCurrency(cashMovements.sales)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                             <span className="text-slate-500 uppercase">Quitações Recebidas</span>
                             <span className="font-bold text-blue-500">+{formatCurrency(cashMovements.settlements)}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 flex flex-col justify-center text-center space-y-4">
                       <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Saldo Esperado na Gaveta</p>
                       <p className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter underline decoration-red-600 decoration-8 underline-offset-8">
                          {formatCurrency(activeShift.cashChange + cashMovements.total)}
                       </p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 italic">Conferir antes de confirmar</p>
                    </div>
                 </div>
              </div>
              <div className="p-8 lg:p-12 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 shrink-0">
                 <button onClick={handleConfirmClose} className="flex-1 bg-red-600 text-white py-6 rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-red-600/30 active:scale-95 transition-all">EFETIVAR FECHAMENTO</button>
                 <button onClick={() => setShowConferral(false)} className="lg:w-64 bg-white dark:bg-slate-900 text-slate-500 py-6 rounded-3xl font-black uppercase text-sm tracking-widest border border-slate-200 dark:border-slate-800 active:scale-95 transition-all">CANCELAR</button>
              </div>
           </div>
        </div>
      )}

      {activeShift ? (
        <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-center">
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Turno Ativo</h2>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Responsável: @{activeShift.openedBy}</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Total Turno</p>
                    <p className="text-3xl font-black text-white">{formatCurrency(totalSoldInShift)}</p>
                 </div>
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Vendas Dinheiro</p>
                    <p className="text-3xl font-black text-emerald-400">{formatCurrency(cashMovements.sales)}</p>
                 </div>
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Gaveta (Dinheiro)</p>
                    <p className="text-3xl font-black text-blue-400">{formatCurrency(activeShift.cashChange + cashMovements.total)}</p>
                 </div>
              </div>
              <div className="pt-4">
                <button onClick={() => setShowConferral(true)} className="w-full bg-red-600 hover:bg-red-700 py-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-red-900/40">FECHAR TURNO</button>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center animate-in fade-in duration-500">
           <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4">Abertura de Turno</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10 text-left">
              {[
                { label: 'Fundo Principal', val: valPrimary, set: setValPrimary },
                { label: 'Troco da Gaveta', val: valChange, set: setValChange },
                { label: 'Caixa Reserva', val: valSecondary, set: setValSecondary }
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{item.label}</label>
                   <input 
                    type="text" 
                    inputMode="decimal" 
                    value={item.val} 
                    onChange={e => item.set(e.target.value.replace(/[^0-9,]/g, ''))} 
                    className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 font-black text-xl outline-none focus:ring-2 focus:ring-blue-500" 
                   />
                   {parseFloat(item.val.replace(',', '.')) > 0 && (
                     <p className="text-[10px] font-black text-blue-500 uppercase ml-2">
                       Confirmando: {formatCurrency(parseFloat(item.val.replace(',', '.')))}
                     </p>
                   )}
                </div>
              ))}
           </div>
           <button onClick={handleOpenShift} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">Iniciar Turno</button>
        </div>
      )}
    </div>
  );
};

export default ShiftControl;
