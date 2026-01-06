
import React, { useState, useMemo } from 'react';
import { Sale, PaymentMethod } from '../types';

interface ReportsProps {
  sales: Sale[];
}

const Reports: React.FC<ReportsProps> = ({ sales }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const filteredSales = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;
    return sales.filter(s => s.timestamp >= start && s.timestamp <= end);
  }, [sales, startDate, endDate]);

  const reportData = useMemo(() => {
    const totalsByMethod = Object.values(PaymentMethod).reduce((acc, method) => {
      acc[method] = { count: 0, total: 0 };
      return acc;
    }, {} as Record<string, { count: number, total: number }>);

    filteredSales.forEach(sale => {
      if (totalsByMethod[sale.paymentMethod]) {
        totalsByMethod[sale.paymentMethod].count += 1;
        totalsByMethod[sale.paymentMethod].total += sale.total;
      }
    });

    const grandTotal = filteredSales.reduce((acc, s) => acc + s.total, 0);

    return { totalsByMethod, grandTotal };
  }, [filteredSales]);

  const aggregations = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const daily = sales.filter(s => s.timestamp >= startOfToday).reduce((acc, s) => acc + s.total, 0);
    const weekly = sales.filter(s => s.timestamp >= startOfWeek).reduce((acc, s) => acc + s.total, 0);
    const monthly = sales.filter(s => s.timestamp >= startOfMonth).reduce((acc, s) => acc + s.total, 0);

    return { daily, weekly, monthly };
  }, [sales]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-l-4 border-red-600 shadow-sm transition-colors">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-wider">Faturamento Hoje</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">R$ {aggregations.daily.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-l-4 border-black dark:border-slate-100 shadow-sm transition-colors">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-wider">Esta Semana</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">R$ {aggregations.weekly.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-l-4 border-red-600 shadow-sm transition-colors">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-wider">Este Mês</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">R$ {aggregations.monthly.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-end transition-colors">
        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Início</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Fim</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
        <div className="w-full md:w-auto">
          <button className="w-full bg-black dark:bg-red-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-red-700 transition-colors">
            Filtrar Período
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Consolidado Financeiro</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">Consolidado no Período Selecionado</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-6 py-4">Forma de Pagamento</th>
                <th className="px-6 py-4">Qtd. Vendas</th>
                <th className="px-6 py-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {Object.entries(reportData.totalsByMethod).map(([method, data]) => {
                const typedData = data as { count: number; total: number };
                return (
                  <tr key={method} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                        method === 'Pendura' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{typedData.count} vendas</td>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-slate-100">R$ {typedData.total.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-900 dark:bg-black text-white font-black">
                <td className="px-6 py-6">FATURAMENTO TOTAL</td>
                <td className="px-6 py-6">{filteredSales.length} total</td>
                <td className="px-6 py-6 text-right text-2xl text-red-500">
                  R$ {reportData.grandTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
