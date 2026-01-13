
import React, { useState, useMemo, useEffect } from 'react';
import { Shift, User, Sale, formatCurrency, PaymentMethod, sanitizeCurrencyInput, parseCurrencyValue } from '../types';

interface CashManagementProps {
  shifts: Shift[];
  onUpdateShifts: (shifts: Shift[]) => void;
  sales: Sale[];
  currentUser: User;
  onViewChange?: (view: any) => void;
}

const CashManagement: React.FC<CashManagementProps> = ({ shifts, onUpdateShifts, sales, currentUser, onViewChange }) => {
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
    return sales
      .filter(s => s.shiftId === activeShift.id && s.paymentMethod === PaymentMethod.CASH)
      .reduce((acc, s) => acc + s.total, 0);
  }, [activeShift, sales]);

  const handleTransfer = () => {
    if (!activeShift) return;
    const value = parseCurrencyValue(transferValue);
    if (isNaN(value) || value <= 0) {
      setToast({ msg: "VALOR INVÁLIDO", type: 'error' });
      return;
    }
    if (fromBox === toBox) {
      setToast({ msg: "CAIXAS DEVEM SER DIFERENTES", type: 'error' });
      return;
    }

    const sourceKey = `cash${fromBox}` as keyof Shift;
    const destKey = `cash${toBox}` as keyof Shift;

    const sourceCurrent = activeShift[sourceKey] as number;
    if (sourceCurrent < value) {
      setToast({ msg: "SALDO INSUFICIENTE NA ORIGEM", type: 'error' });
      return;
    }

    onUpdateShifts(shifts.map(s => s.id === activeShift.id ? {
      ...s,
      [sourceKey]: (s[sourceKey] as number) - value,
      [destKey]: (s[destKey] as number) + value
    } : s));

    setTransferValue('');
    setToast({ msg: "TRANSFERÊNCIA CONCLUÍDA", type: 'success' });
  };

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-[32px] flex items-center justify-center text-red-600 shadow-xl border border-red-200 dark:border-red-900/30">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-2 border-white dark:border-slate-900 animate-ping opacity-20"></div>
        </div>
        
        <div className="max-w-xs space-y-4">
           <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none italic">Acesso Restrito</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium text-sm px-4">
             O sistema está bloqueado. Para gerenciar tesouraria, você precisa <span className="text-red-600 dark:text-red-400 font-bold">abrir um novo turno</span>.
           </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[240px]">
           {onViewChange && (
             <button 
               onClick={() => onViewChange('shifts')} 
               className="bg-red-600 hover:bg-red-700 text-white w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all animate-bounce"
             >
               Abrir Turno Agora
             </button>
           )}
           <button 
             onClick={() => window.location.reload()}
             className="text-slate-400 dark:text-slate-600 font-black uppercase text-[10px] tracking-widest py-2"
           >
             Recarregar Sistema
           </button>
        </div>
      </div>
    );
  }

  const numericValue = parseCurrencyValue(transferValue);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 relative">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
           {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Caixa Primário</p>
           <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(activeShift.cashPrimary)}</p>
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-blue-200 dark:border-blue-900/40 shadow-sm relative overflow-hidden group transition-all">
           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Gaveta / Troco</p>
           <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(activeShift.cashChange + totalCashSales)}</p>
           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Fundo + Vendas em Dinheiro</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Caixa Secundário</p>
           <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(activeShift.cashSecondary)}</p>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-900/50 p-8 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-500">
         <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center">
               <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Movimentação Interna</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transferência entre compartimentos de valores</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sair de:</label>
                  <select value={fromBox} onChange={e => setFromBox(e.target.value as any)} className="w-full bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-inner">
                     <option value="Primary">Caixa Primário</option>
                     <option value="Change">Gaveta / Troco</option>
                     <option value="Secondary">Secundário</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Entrar em:</label>
                  <select value={toBox} onChange={e => setToBox(e.target.value as any)} className="w-full bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-inner">
                     <option value="Primary">Caixa Primário</option>
                     <option value="Change">Gaveta / Troco</option>
                     <option value="Secondary">Secundário</option>
                  </select>
               </div>
            </div>

            <div className="space-y-2 relative">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-2 text-center block">Valor da Transferência</label>
               <div className="relative flex items-center">
                  <span className="absolute left-6 text-2xl font-black text-slate-400">R$</span>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    value={transferValue} 
                    onChange={e => setTransferValue(sanitizeCurrencyInput(e.target.value))} 
                    className="w-full bg-white dark:bg-slate-950 pl-20 pr-6 py-6 rounded-3xl border-2 border-transparent focus:border-blue-500 font-black text-3xl outline-none transition-all shadow-inner" 
                    placeholder="0,00" 
                  />
               </div>
               {numericValue > 0 && (
                 <p className="text-center font-black text-blue-500 text-xs animate-in fade-in slide-in-from-top-2 uppercase tracking-widest mt-2">
                   Confirmando: {formatCurrency(numericValue)}
                 </p>
               )}
            </div>

            <button onClick={handleTransfer} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95">
               Confirmar Movimentação
            </button>
         </div>
      </div>
    </div>
  );
};

export default CashManagement;
