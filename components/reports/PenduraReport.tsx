
import React from 'react';
import { formatCurrency } from '../../types';

interface PenduraReportProps {
  reportData: any;
  onQuitarPendura: (name: string, amount: number) => void;
  canSettle: boolean;
}

const PenduraReport: React.FC<PenduraReportProps> = ({ reportData, onQuitarPendura, canSettle }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-500">
       <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-orange-50/30 dark:bg-orange-900/10">
          <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic">Carteira Global de Devedores (Ativos)</h3>
       </div>
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
                      <button onClick={() => onQuitarPendura(p.name, p.amount)} disabled={!canSettle} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all">Quitar</button>
                   </td>
                </tr>
             ))}
             {reportData.activePenduras.length === 0 && (
               <tr><td colSpan={3} className="px-10 py-24 text-center text-slate-400 font-bold uppercase opacity-30 italic">Nenhum devedor no radar.</td></tr>
             )}
          </tbody>
       </table>
    </div>
  );
};

export default PenduraReport;
