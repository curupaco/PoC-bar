
import React from 'react';
import { formatCurrency } from '../../types';

interface TeamReportProps {
  reportData: any;
}

const TeamReport: React.FC<TeamReportProps> = ({ reportData }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-500">
       <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-900/10">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Ranking de Performance Individual</h3>
       </div>
       <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[10px]">
              <th className="px-10 py-6">Colaborador</th>
              <th className="px-10 py-6 text-center">Volume Vendas</th>
              <th className="px-10 py-6 text-right">Faturamento Gerado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {reportData.teamStats.map((u: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-10 py-6 font-black text-slate-800 dark:text-white uppercase flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 text-[10px]">@{idx+1}</div>
                   @{u.name}
                </td>
                <td className="px-10 py-6 text-center font-bold text-slate-500">{u.count} tickets</td>
                <td className="px-10 py-6 text-right font-black text-blue-600">{formatCurrency(u.total)}</td>
              </tr>
            ))}
          </tbody>
       </table>
    </div>
  );
};

export default TeamReport;
