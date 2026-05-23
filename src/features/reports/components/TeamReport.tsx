import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../types';

interface TeamReportProps {
  reportData: any;
}

const TeamReport: React.FC<TeamReportProps> = ({ reportData }) => {
  const [sortBy, setSortBy] = useState<'total' | 'average'>('total');

  const statsWithAverage = useMemo(() => {
    return (reportData.teamStats || []).map((u: any) => ({
      ...u,
      average: u.count > 0 ? u.total / u.count : 0
    }));
  }, [reportData.teamStats]);

  const sortedStats = useMemo(() => {
    return [...statsWithAverage].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [statsWithAverage, sortBy]);

  const highestAverageUser = useMemo(() => {
    const validUsers = statsWithAverage.filter((u: any) => u.count > 0);
    if (validUsers.length === 0) return null;
    return validUsers.reduce((prev: any, current: any) => (prev.average > current.average) ? prev : current);
  }, [statsWithAverage]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-500">
       <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-900/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
             <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic leading-none">Ranking de Performance Individual</h3>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Estimule a venda de acompanhamentos, combos e adicionais</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
             <button
                onClick={() => setSortBy('total')}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'total' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
             >
                Faturamento
             </button>
             <button
                onClick={() => setSortBy('average')}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${sortBy === 'average' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
             >
                Ticket Médio 💡
             </button>
          </div>
       </div>
       <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[10px]">
              <th className="px-10 py-6">Colaborador</th>
              <th className="px-10 py-6 text-center">Volume Vendas</th>
              <th className="px-10 py-6 text-right">Ticket Médio</th>
              <th className="px-10 py-6 text-right">Faturamento Gerado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {sortedStats.map((u: any, idx: number) => {
              const isSmartWaiter = highestAverageUser && u.name === highestAverageUser.name;
              return (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-10 py-6 font-black text-slate-800 dark:text-white uppercase flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 text-[10px]">@{idx+1}</div>
                     <div className="flex flex-col">
                       <span className="flex items-center gap-1.5">
                         @{u.name}
                         {isSmartWaiter && (
                           <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-900/40 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                             🏆 Garçom Esperto
                           </span>
                         )}
                       </span>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-center font-bold text-slate-500">{u.count} tickets</td>
                  <td className="px-10 py-6 text-right font-black text-emerald-600">{formatCurrency(u.average)}</td>
                  <td className="px-10 py-6 text-right font-black text-blue-600">{formatCurrency(u.total)}</td>
                </tr>
              );
            })}
            {sortedStats.length === 0 && (
              <tr>
                <td colSpan={4} className="px-10 py-24 text-center text-slate-400 font-bold uppercase opacity-30 italic">
                  Nenhuma venda realizada pela equipe neste período.
                </td>
              </tr>
            )}
          </tbody>
       </table>
    </div>
  );
};

export default TeamReport;
