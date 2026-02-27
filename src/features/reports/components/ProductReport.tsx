import React from 'react';
import { formatCurrency } from '../../../types';

interface ProductReportProps {
  reportData: any;
}

const ProductReport: React.FC<ProductReportProps> = ({ reportData }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-500">
       <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-900/10">
          <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Mix de Saída (Curva ABC Financeira)</h3>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[10px]">
                <th className="px-10 py-6">Item do Menu</th>
                <th className="px-10 py-6 text-center">Qtde Vendida</th>
                <th className="px-10 py-6 text-right">Faturamento Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {reportData.topProducts.map((p: any, idx: number) => (
                <tr key={idx} className="optimize-render hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-10 py-6 font-black text-slate-800 dark:text-white uppercase">{p.name}</td>
                  <td className="px-10 py-6 text-center font-bold text-slate-500">{p.qty.toFixed(0)}x</td>
                  <td className="px-10 py-6 text-right font-black text-emerald-600">{formatCurrency(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default ProductReport;