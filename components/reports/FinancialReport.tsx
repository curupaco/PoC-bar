
import React from 'react';
import { formatCurrency } from '../../types';

interface FinancialReportProps {
  reportData: any;
}

const FinancialReport: React.FC<FinancialReportProps> = ({ reportData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
       <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-200 dark:border-slate-800">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Fluxo por Pagamento</h3>
          <div className="space-y-4">
             {(Object.entries(reportData.totalsByMethod) as [string, { count: number, total: number }][]).map(([method, data]) => (
               data.total > 0 ? (
                 <div key={method} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <span className="text-sm font-bold uppercase text-slate-500">{method}</span>
                    <span className="font-black text-slate-900 dark:text-white">{formatCurrency(data.total)}</span>
                 </div>
               ) : null
             ))}
             <div className="pt-6 flex justify-between items-center text-4xl font-black text-emerald-600 tracking-tighter italic">
                <span className="text-[10px] text-slate-400 uppercase">Faturamento Bruto</span>
                <span>{formatCurrency(reportData.grandTotal)}</span>
             </div>
          </div>
       </div>
       <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-200 dark:border-slate-800 flex flex-col justify-center text-center space-y-4 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ticket Médio (Vendas)</p>
          <p className="text-8xl font-black text-slate-900 dark:text-white tracking-tighter italic">{formatCurrency(reportData.avgTicket)}</p>
          <div className="h-px bg-slate-100 dark:bg-slate-800 w-1/3 mx-auto"></div>
          <p className="text-[10px] text-slate-400 font-bold uppercase italic opacity-50">Base: {reportData.operationalCount} registros de venda</p>
       </div>
    </div>
  );
};

export default FinancialReport;
