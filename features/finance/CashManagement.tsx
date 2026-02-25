import React, { useState, useMemo, useEffect } from 'react';
import { Shift, User, Sale, formatCurrency, PaymentMethod, CashTransaction, generateUniqueId } from '../../types';

interface CashManagementProps {
  shifts: Shift[];
  onUpdateShifts: (shifts: Shift[], changedItem?: Shift) => void;
  onRegisterTransaction?: (shiftId: string, transaction: CashTransaction) => void;
  sales: Sale[];
  currentUser: User;
  onViewChange?: (view: any) => void;
}

type OperationType = 'SANGRIA' | 'SUPPLY' | null;

const CashManagement: React.FC<CashManagementProps> = ({ shifts, onUpdateShifts, sales, currentUser, onViewChange }) => {
  const activeShift = shifts.find(s => s.status === 'open');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // States para o novo fluxo ATM
  const [operation, setOperation] = useState<OperationType>(null);
  const [keypadValue, setKeypadValue] = useState<string>('');

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

  const currentDrawerBalance = (activeShift?.cashChange || 0) + totalCashSales;
  const isDrawerOverflowing = currentDrawerBalance > 1000; // Alerta visual se passar de 1000

  // Formata o valor digitado no teclado numérico (ex: "1250" -> 12,50)
  const displayValue = useMemo(() => {
    if (!keypadValue) return '0,00';
    const num = parseInt(keypadValue) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [keypadValue]);

  const handleKeypadPress = (key: string) => {
    if (key === 'C') {
        setKeypadValue('');
        return;
    }
    if (key === 'back') {
        setKeypadValue(prev => prev.slice(0, -1));
        return;
    }
    if (key === '00') {
        setKeypadValue(prev => {
            if (!prev) return '';
            if (prev.length > 7) return prev;
            return prev + '00';
        });
        return;
    }
    // Limite de segurança de caracteres
    if (keypadValue.length > 8) return;
    setKeypadValue(prev => prev + key);
  };

  const executeTransaction = () => {
    if (!activeShift || !operation) return;
    
    const rawValue = parseInt(keypadValue) / 100;
    if (isNaN(rawValue) || rawValue <= 0) {
        setToast({ msg: "VALOR INVÁLIDO", type: 'error' });
        return;
    }

    let fromBox: 'Primary' | 'Change';
    let toBox: 'Primary' | 'Change';

    // Definição contextual das caixas baseada na operação
    switch (operation) {
        case 'SANGRIA': // Gaveta -> Cofre
            fromBox = 'Change';
            toBox = 'Primary';
            // Validação de saldo (Considerando vendas em dinheiro)
            if (currentDrawerBalance < rawValue) {
                setToast({ msg: "SALDO INSUFICIENTE NA GAVETA", type: 'error' });
                return;
            }
            break;
        case 'SUPPLY': // Cofre -> Gaveta
            fromBox = 'Primary';
            toBox = 'Change';
            if (activeShift.cashPrimary < rawValue) {
                setToast({ msg: "SALDO INSUFICIENTE NO COFRE", type: 'error' });
                return;
            }
            break;
        default: return;
    }

    const transaction: CashTransaction = { 
        id: generateUniqueId('tx'), 
        timestamp: Date.now(), 
        type: 'transfer', 
        from: fromBox, 
        to: toBox, 
        amount: rawValue, 
        user: currentUser.username 
    };

    // Atualiza os saldos no objeto Shift (para persistência correta, devemos subtrair do saldo base da Gaveta se for Sangria, mas como o saldo visual da gaveta é composto, manipulamos o cashChange base)
    // Nota: O cashChange no Shift representa o Fundo + Suprimentos - Sangrias. As Vendas são somadas dinamicamente.
    // Portanto, ao fazer Sangria, reduzimos o cashChange. Se ele ficar negativo, significa que tiramos dinheiro das vendas (o que é matematicamente correto para o balanço final).
    
    const sourceKey = `cash${fromBox}` as keyof Shift;
    const destKey = `cash${toBox}` as keyof Shift;

    const updatedShift: Shift = { 
        ...activeShift, 
        [sourceKey]: (activeShift[sourceKey] as number) - rawValue, 
        [destKey]: (activeShift[destKey] as number) + rawValue, 
        transactions: [transaction, ...(activeShift.transactions || [])] 
    };

    onUpdateShifts(shifts.map(s => s.id === activeShift.id ? updatedShift : s), updatedShift);
    
    setToast({ msg: "OPERAÇÃO REALIZADA COM SUCESSO", type: 'success' });
    setOperation(null);
    setKeypadValue('');
  };

  const getOperationLabel = (op: OperationType) => {
      switch(op) {
          case 'SANGRIA': return 'Realizar Sangria';
          case 'SUPPLY': return 'Enviar Suprimento';
          default: return '';
      }
  };

  const getOperationColor = (op: OperationType) => {
      switch(op) {
          case 'SANGRIA': return 'text-red-600';
          case 'SUPPLY': return 'text-emerald-500';
          default: return 'text-slate-800';
      }
  };

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
         <div className="relative group">
            <div className="absolute inset-0 bg-red-600/20 blur-[60px] rounded-full group-hover:bg-red-600/30 transition-all"></div>
            <div className="w-48 h-48 bg-white dark:bg-slate-900 rounded-[50px] flex items-center justify-center border-4 border-slate-100 dark:border-slate-800 shadow-2xl relative z-10 -rotate-3 transition-transform hover:-rotate-6 hover:scale-105">
               <span className="text-8xl filter drop-shadow-lg">💸</span>
            </div>
         </div>
         <div className="space-y-3 relative z-10">
            <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Cofre Fechado!</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nada entra, nada sai. Abra o turno para mexer na bufunfa.</p>
         </div>
         <button onClick={() => onViewChange && onViewChange('shifts')} className="bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all relative z-10">Abrir Turno</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 animate-in fade-in relative">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-10 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>{toast.msg}</div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
         <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Terminal de Tesouraria</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão de Numerário e Transferências</p>
         </div>
         <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-slate-500">Turno de @{activeShift.openedBy}</span>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUNA 1 & 2: CARDS DE CAIXA */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* GAVETA DE TROCO (ESTILO CARTEIRA/DINÂMICO) */}
            <div className={`relative p-8 rounded-[40px] border-2 transition-all duration-500 group overflow-hidden ${isDrawerOverflowing ? 'bg-orange-50 border-orange-300 dark:bg-orange-900/10 dark:border-orange-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
               <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${isDrawerOverflowing ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        💵
                     </div>
                     <div>
                        <h3 className={`text-sm font-black uppercase tracking-widest ${isDrawerOverflowing ? 'text-orange-600' : 'text-slate-500'}`}>Gaveta Operacional</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Dinheiro Vivo Disponível</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`text-4xl font-black tracking-tighter ${isDrawerOverflowing ? 'text-orange-600 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
                        {formatCurrency(currentDrawerBalance)}
                     </p>
                  </div>
               </div>
               
               <div className="mt-8 flex gap-4 relative z-10">
                  <button 
                    onClick={() => { setOperation('SANGRIA'); setKeypadValue(''); }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                     Realizar Sangria
                  </button>
               </div>
            </div>

            {/* COFRE PRINCIPAL (ESTILO FORTE/SEGURO) */}
            <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group w-full border border-slate-800">
               <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl text-slate-400 shadow-inner">🔒</div>
                     <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Cofre</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Reserva Segura</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-4xl font-black tracking-tighter text-white">{formatCurrency(activeShift.cashPrimary)}</p>
                  </div>
               </div>
               
               <div className="mt-8 relative z-10">
                  <button 
                    onClick={() => { setOperation('SUPPLY'); setKeypadValue(''); }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                     Enviar Suprimento
                  </button>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            </div>
        </div>

        {/* COLUNA 3: TIMELINE DE AUDITORIA */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px] lg:h-auto">
           <div className="mb-6 px-2">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Últimas Movimentações</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Feed de Auditoria em Tempo Real</p>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {activeShift.transactions && activeShift.transactions.length > 0 ? (
                 [...activeShift.transactions].reverse().map(t => (
                    <div key={t.id} className="flex gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 relative group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-lg shadow-sm ${t.from === 'Change' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {t.from === 'Change' ? '📤' : '📥'}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                             <span className={`text-[10px] font-black uppercase tracking-wide ${t.from === 'Change' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {t.from === 'Change' ? 'SANGRIA' : (t.to === 'Change' ? 'SUPRIMENTO' : 'TRANSF. INTERNA')}
                             </span>
                             <span className="text-[9px] font-bold text-slate-400">{new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-lg font-black text-slate-800 dark:text-white leading-none">{formatCurrency(t.amount)}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Autor: @{t.user}</p>
                       </div>
                    </div>
                 ))
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                       <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nenhuma movimentação</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* MODAL / TECLADO NUMÉRICO ESTILO ATM */}
      {operation && (
         <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
               
               <div className="flex justify-between items-center mb-8">
                  <div>
                     <h3 className={`text-xl font-black uppercase tracking-tighter italic ${getOperationColor(operation)}`}>{getOperationLabel(operation)}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Digite o valor da operação</p>
                  </div>
                  <button onClick={() => { setOperation(null); setKeypadValue(''); }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors font-bold">✕</button>
               </div>

               {/* VISOR */}
               <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 mb-6 text-right border-2 border-slate-100 dark:border-slate-800 shadow-inner relative overflow-hidden">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300 uppercase">R$</span>
                  <p className={`text-5xl font-black tracking-tighter ${keypadValue ? 'text-slate-800 dark:text-white' : 'text-slate-300'}`}>
                     {displayValue}
                  </p>
               </div>

               {/* TECLADO GRID */}
               <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                     <button 
                        key={num} 
                        onClick={() => handleKeypadPress(num.toString())}
                        className="h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-2xl font-black text-slate-700 dark:text-white active:scale-95 active:bg-slate-100 dark:active:bg-slate-700 transition-all"
                     >
                        {num}
                     </button>
                  ))}
                  <button onClick={() => handleKeypadPress('C')} className="h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-xs font-black text-red-600 uppercase tracking-widest active:scale-95 transition-all">Limpar</button>
                  <button onClick={() => handleKeypadPress('0')} className="h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-2xl font-black text-slate-700 dark:text-white active:scale-95 transition-all">0</button>
                  <button onClick={() => handleKeypadPress('back')} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 active:scale-95 transition-all flex items-center justify-center">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
                  </button>
               </div>

               <button 
                  onClick={executeTransaction}
                  disabled={!keypadValue || parseInt(keypadValue) === 0}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
               >
                  Confirmar Operação
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default CashManagement;