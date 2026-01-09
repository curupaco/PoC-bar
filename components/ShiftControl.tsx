
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
  
  const [valPrimary, setValPrimary] = useState('0');
  const [valChange, setValChange] = useState('0');
  const [valSecondary, setValSecondary] = useState('0');

  // Permissões: Admin sempre tem acesso total
  const canOpen = currentUser.username === 'admin' || currentUser.permissions.includes('open_shift');
  const canClose = currentUser.username === 'admin' || currentUser.permissions.includes('close_shift');

  const shiftSales = useMemo(() => {
    if (!activeShift) return [];
    return (sales || []).filter(s => s.shiftId === activeShift.id);
  }, [activeShift, sales]);

  const totalSoldInShift = shiftSales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalCashSales = shiftSales
    .filter(s => s.paymentMethod === PaymentMethod.CASH)
    .reduce((acc, s) => acc + (s.total || 0), 0);

  const handleOpenShift = () => {
    if (!canOpen) {
      alert("Você não tem permissão para abrir o turno.");
      return;
    }
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      startTime: Date.now(),
      openedBy: currentUser.username,
      status: 'open',
      cashPrimary: parseFloat(valPrimary) || 0,
      cashChange: parseFloat(valChange) || 0,
      cashSecondary: parseFloat(valSecondary) || 0
    };
    onUpdateShifts([newShift, ...shifts]);
    setValPrimary('0');
    setValChange('0');
    setValSecondary('0');
  };

  const handleCloseShift = () => {
    if (!canClose) {
      alert("Você não tem permissão para fechar o turno.");
      return;
    }
    if (!activeShift) {
      alert("Nenhum turno ativo encontrado para encerrar.");
      return;
    }

    const baseChange = activeShift.cashChange || 0;
    const estimatedChange = baseChange + totalCashSales;

    const confirmMsg = `Deseja encerrar o turno?\n\n` +
                       `Resumo do Caixa (Dinheiro):\n` +
                       `Fundo de Troco Inicial: ${formatCurrency(baseChange)}\n` +
                       `Vendas em Dinheiro: ${formatCurrency(totalCashSales)}\n` +
                       `Total esperado no Troco: ${formatCurrency(estimatedChange)}\n\n` +
                       `Confirma o fechamento?`;

    if (window.confirm(confirmMsg)) {
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
      alert("Turno encerrado com sucesso!");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {activeShift ? (
        <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
           <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 2.02c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12.5 7h-1.5v6l4.25 2.5.75-1.25-3.5-2.25z"/></svg>
           </div>
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-center">
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Turno em Curso</h2>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Responsável: @{activeShift.openedBy}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Aberto em</p>
                    <p className="font-mono text-sm">{new Date(activeShift.startTime).toLocaleDateString()} {new Date(activeShift.startTime).toLocaleTimeString()}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Vendas Totais do Turno</p>
                    <p className="text-4xl font-black text-emerald-400">{formatCurrency(totalSoldInShift)}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Todos os métodos de pagamento</p>
                 </div>
                 <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col justify-center backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Dinheiro Físico Esperado</p>
                    <p className="text-4xl font-black text-blue-400">{formatCurrency((activeShift.cashChange || 0) + totalCashSales)}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Base: {formatCurrency(activeShift.cashChange || 0)} | Vendas: {formatCurrency(totalCashSales)}</p>
                 </div>
              </div>

              <div className="pt-4">
                {canClose ? (
                  <button 
                    onClick={handleCloseShift} 
                    className="w-full bg-red-600 hover:bg-red-700 py-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl shadow-red-900/40"
                  >
                    Encerrar Turno e Gerar Conferência
                  </button>
                ) : (
                  <div className="w-full bg-slate-800 text-slate-500 py-6 rounded-2xl font-black uppercase text-center text-xs tracking-widest cursor-not-allowed">
                    Acesso Negado: Sem permissão para fechar
                  </div>
                )}
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center animate-in fade-in duration-500">
           <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
           </div>
           <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4">Abertura de Turno</h2>
           <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium">Configure os caixas para iniciar a operação e liberar o PDV.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10 text-left">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Caixa Primário (Fundo)</label>
                 <input type="number" value={valPrimary} onChange={e => setValPrimary(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 font-black text-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Troco / Float (Gaveta)</label>
                 <input type="number" value={valChange} onChange={e => setValChange(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 font-black text-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Secundário (Reserva)</label>
                 <input type="number" value={valSecondary} onChange={e => setValSecondary(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 font-black text-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
           </div>

           {canOpen ? (
             <button onClick={handleOpenShift} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 shadow-blue-500/20">
               Iniciar Novo Turno
             </button>
           ) : (
             <div className="text-red-500 font-black uppercase text-xs tracking-widest border-2 border-red-500/20 p-4 rounded-2xl inline-block">
               Seu usuário não possui permissão para abrir turnos
             </div>
           )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">Histórico de Turnos Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Abertura</th>
                <th className="px-6 py-4">Operador</th>
                <th className="px-6 py-4 text-right">Faturamento</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shifts.slice(0, 10).map(s => {
                const shiftSales = (sales || []).filter(sa => sa.shiftId === s.id);
                const total = shiftSales.reduce((acc, sa) => acc + (sa.total || 0), 0);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-black block">{new Date(s.startTime).toLocaleDateString()}</span>
                      <span className="text-[9px] text-slate-400 uppercase">
                        {new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                        {s.endTime ? ` — ${new Date(s.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : ' (Ativo)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold uppercase text-slate-500">@{s.openedBy}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(total)}</td>
                    <td className="px-6 py-4 text-center">
                       <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${s.status === 'open' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                         {s.status === 'open' ? 'Aberto' : 'Fechado'}
                       </span>
                    </td>
                  </tr>
                );
              })}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest italic">Nenhum turno registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShiftControl;
