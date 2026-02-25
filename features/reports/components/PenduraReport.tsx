
import React, { useState } from 'react';
import { formatCurrency, sanitizeCurrencyInput, parseCurrencyValue } from '../../../types';

interface PenduraReportProps {
  reportData: any;
  onQuitarPendura: (name: string, amount: number) => void;
  canSettle: boolean;
}

const PenduraReport: React.FC<PenduraReportProps> = ({ reportData, onQuitarPendura, canSettle }) => {
  const [quitarData, setQuitarData] = useState<{ name: string; total: number; amount: string } | null>(null);

  const handleQuitar = () => {
    if (!quitarData) return;
    const numericAmount = parseCurrencyValue(quitarData.amount);
    if (numericAmount <= 0) {
      alert("Informe um valor válido para quitação.");
      return;
    }
    if (numericAmount > quitarData.total + 0.05) {
       alert("O valor pago não pode ser maior que a dívida.");
       return;
    }
    onQuitarPendura(quitarData.name, numericAmount);
    setQuitarData(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-500">
       <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-orange-50/30 dark:bg-orange-900/10">
          <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic">Carteira Global de Devedores (Ativos)</h3>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
             <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[10px]">
                   <th className="px-10 py-6 text-left">Nome do Cliente</th>
                   <th className="px-10 py-6 text-right">Saldo Devedor</th>
                   <th className="px-10 py-6 text-right">Gestão</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {reportData.activePenduras.map((p: any, idx: number) => (
                   <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-10 py-6 font-black text-slate-800 dark:text-white uppercase">{p.name}</td>
                      <td className="px-10 py-6 text-right font-black text-red-600">{formatCurrency(p.amount)}</td>
                      <td className="px-10 py-6 text-right">
                         <button 
                           onClick={() => setQuitarData({ name: p.name, total: p.amount, amount: p.amount.toFixed(2).replace('.', ',') })} 
                           disabled={!canSettle} 
                           className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all shadow-md shadow-red-600/20"
                         >
                           Quitar
                         </button>
                      </td>
                   </tr>
                ))}
                {reportData.activePenduras.length === 0 && (
                  <tr><td colSpan={3} className="px-10 py-24 text-center text-slate-400 font-bold uppercase opacity-30 italic">Nenhum devedor no radar.</td></tr>
                )}
             </tbody>
          </table>
       </div>

       {quitarData && (
         <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setQuitarData(null)} />
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
               <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Quitar Pendura</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{quitarData.name} deve {formatCurrency(quitarData.total)}</p>
               
               <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl mb-8 border border-slate-100 dark:border-slate-800">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quanto ele está pagando hoje?</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">R$</span>
                     <input 
                        autoFocus
                        type="text" 
                        inputMode="decimal"
                        value={quitarData.amount} 
                        onChange={e => setQuitarData({ ...quitarData, amount: sanitizeCurrencyInput(e.target.value) })}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 font-black text-2xl outline-none shadow-inner text-red-600" 
                        placeholder="0,00" 
                     />
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <button onClick={handleQuitar} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Confirmar Recebimento</button>
                  <button onClick={() => setQuitarData(null)} className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Cancelar</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default PenduraReport;
