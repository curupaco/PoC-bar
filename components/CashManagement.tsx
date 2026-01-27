
import React, { useState, useMemo, useEffect } from 'react';
import { Shift, User, Sale, formatCurrency, PaymentMethod, sanitizeCurrencyInput, parseCurrencyValue, CashTransaction, generateUniqueId } from '../types';

interface CashManagementProps {
  shifts: Shift[];
  onUpdateShifts: (shifts: Shift[], changedItem?: Shift) => void;
  onRegisterTransaction?: (shiftId: string, transaction: CashTransaction) => void;
  sales: Sale[];
  currentUser: User;
  onViewChange?: (view: any) => void;
}

const CashManagement: React.FC<CashManagementProps> = ({ shifts, onUpdateShifts, onRegisterTransaction, sales, currentUser, onViewChange }) => {
  const activeShift = shifts.find(s => s.status === 'open');
  const [fromBox, setFromBox] = useState<'Primary' | 'Change' | 'Secondary'>('Primary');
  const [toBox, setToBox] = useState<'Primary' | 'Change' | 'Secondary'>('Change');
  const [transferValue, setTransferValue] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const totalCashSales = useMemo(() => {
    if (!activeShift) return 0;
    return sales.filter(s => s.shiftId === activeShift.id && !s.deleted).reduce((acc, s) => {
        if (s.payments) { const cashPart = s.payments.find(p => p.method === PaymentMethod.CASH); return acc + (cashPart ? cashPart.amount : 0); }
        return acc + (s.paymentMethod === PaymentMethod.CASH ? s.total : 0);
    }, 0);
  }, [activeShift, sales]);

  const handleTransfer = () => {
    if (!activeShift) return;
    const value = parseCurrencyValue(transferValue);
    if (isNaN(value) || value <= 0) { setToast({ msg: "VALOR INVÁLIDO", type: 'error' }); return; }
    if (fromBox === toBox) { setToast({ msg: "CAIXAS DEVEM SER DIFERENTES", type: 'error' }); return; }
    const sourceKey = `cash${fromBox}` as keyof Shift;
    const destKey = `cash${toBox}` as keyof Shift;
    if ((activeShift[sourceKey] as number) < value) { setToast({ msg: "SALDO INSUFICIENTE", type: 'error' }); return; }

    const transaction: CashTransaction = { id: generateUniqueId('tx'), timestamp: Date.now(), type: 'transfer', from: fromBox, to: toBox, amount: value, user: currentUser.username };
    const updatedShift: Shift = { ...activeShift, [sourceKey]: (activeShift[sourceKey] as number) - value, [destKey]: (activeShift[destKey] as number) + value, transactions: [...(activeShift.transactions || []), transaction] };
    onUpdateShifts(shifts.map(s => s.id === activeShift.id ? updatedShift : s), updatedShift);
    setTransferValue(''); setToast({ msg: "CONCLUÍDO", type: 'success' });
  };

  // UI PROFISSIONAL PARA ACESSO RESTRITO
  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-12 animate-in fade-in duration-1000">
        <div className="relative group">
           <div className="absolute inset-0 bg-red-600/10 blur-[100px] rounded-full group-hover:bg-red-600/20 transition-all"></div>
           <div className="w-56 h-56 bg-white dark:bg-slate-900 rounded-[70px] flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 shadow-2xl relative z-10">
              <svg className="w-28 h-28 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
        </div>
        <div className="max-w-md space-y-4">
           <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Tesouraria Bloqueada</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-xl px-12 leading-relaxed">Não é possível realizar movimentações financeiras sem um <span className="text-red-600 font-black">turno aberto</span>.</p>
        </div>
        <button onClick={() => onViewChange && onViewChange('shifts')} className="bg-red-600 hover:bg-red-700 text-white px-20 py-6 rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-red-500/30 active:scale-95 transition-all">Ir para Gestão de Turnos</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32 animate-in fade-in">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-10 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>{toast.msg}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-red-500/20">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cofre Principal</p>
           <p className="text-4xl font-black">{formatCurrency(activeShift.cashPrimary)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border-2 border-blue-500/30 shadow-xl shadow-blue-500/5">
           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Gaveta de Troco</p>
           <p className="text-4xl font-black">{formatCurrency(activeShift.cashChange + totalCashSales)}</p>
           <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase italic opacity-60">Fundo Inicial + Entradas em Dinheiro</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-red-500/20">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reserva Secundária</p>
           <p className="text-4xl font-black">{formatCurrency(activeShift.cashSecondary)}</p>
        </div>
      </div>
      <div className="bg-slate-100 dark:bg-slate-900/50 p-12 rounded-[50px] border-2 border-dashed border-slate-200 dark:border-slate-800">
         <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center">
               <h3 className="text-2xl font-black uppercase tracking-tighter italic">Movimentação Auditada</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Sangrias, Suprimentos e Transferências</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Origem</label>
                  <select value={fromBox} onChange={e => setFromBox(e.target.value as any)} className="w-full bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 font-black uppercase text-[11px] outline-none shadow-sm focus:ring-2 focus:ring-blue-500">
                     <option value="Primary">Cofre Principal</option>
                     <option value="Change">Gaveta / Troco</option>
                     <option value="Secondary">Reserva</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Destino</label>
                  <select value={toBox} onChange={e => setToBox(e.target.value as any)} className="w-full bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 font-black uppercase text-[11px] outline-none shadow-sm focus:ring-2 focus:ring-blue-500">
                     <option value="Primary">Cofre Principal</option>
                     <option value="Change">Gaveta / Troco</option>
                     <option value="Secondary">Reserva</option>
                  </select>
               </div>
            </div>
            <div className="space-y-3 relative">
               <label className="text-[10px] font-black text-slate-400 uppercase text-center block tracking-widest">Valor da Operação</label>
               <div className="relative">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-400">R$</span>
                  <input type="text" inputMode="decimal" value={transferValue} onChange={e => setTransferValue(sanitizeCurrencyInput(e.target.value))} className="w-full bg-white dark:bg-slate-950 pl-24 pr-8 py-8 rounded-[35px] border-4 border-transparent focus:border-blue-500 font-black text-5xl outline-none transition-all shadow-2xl" placeholder="0,00" />
               </div>
            </div>
            <button onClick={handleTransfer} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-xl shadow-blue-500/20 transition-all active:scale-95">Registrar no Caixa</button>
         </div>
      </div>
    </div>
  );
};

export default CashManagement;
