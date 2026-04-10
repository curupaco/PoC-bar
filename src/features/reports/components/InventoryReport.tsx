
import React, { useMemo } from 'react';
import { Product, Sale, StockTransaction, formatCurrency, Theme } from '../../../types';

interface InventoryReportProps {
  stockTransactions: StockTransaction[];
  products: Product[];
  sales: Sale[];
  theme?: Theme;
}

const InventoryReport: React.FC<InventoryReportProps> = ({ stockTransactions, products, sales, theme }) => {
  
  const balances = useMemo(() => {
    const b: Record<string, number> = {};
    stockTransactions.forEach(t => {
      b[t.productId] = (b[t.productId] || 0) + t.quantity;
    });
    return b;
  }, [stockTransactions]);

  const profitStats = useMemo(() => {
    const stats: Record<string, { name: string, qty: number, revenue: number, cost: number, profit: number }> = {};
    
    sales.forEach(s => {
      if (s.items) {
        s.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          const costPrice = product?.lastCostPrice || 0;
          
          if (!stats[item.productId]) {
            stats[item.productId] = { 
                name: item.productName, 
                qty: 0, 
                revenue: 0, 
                cost: 0, 
                profit: 0 
            };
          }
          
          stats[item.productId].qty += item.quantity;
          stats[item.productId].revenue += item.totalPrice;
          stats[item.productId].cost += costPrice * item.quantity;
          stats[item.productId].profit += item.totalPrice - (costPrice * item.quantity);
        });
      }
    });

    return Object.values(stats).sort((a, b) => b.profit - a.profit);
  }, [sales, products]);

  const totalProfit = profitStats.reduce((acc, s) => acc + s.profit, 0);
  const totalRevenue = profitStats.reduce((acc, s) => acc + s.revenue, 0);
  const totalCost = profitStats.reduce((acc, s) => acc + s.cost, 0);

  const stockValue = products.reduce((acc, p) => {
    const balance = balances[p.id] || 0;
    if (balance <= 0) return acc;
    return acc + (balance * (p.lastCostPrice || 0));
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro Bruto Total</p>
          <p className={`text-2xl font-black italic tracking-tighter ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatCurrency(totalProfit)}
          </p>
          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">No período selecionado</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Margem Média</p>
          <p className="text-2xl font-black italic tracking-tighter text-slate-800 dark:text-white">
            {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Sobre as vendas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor em Estoque</p>
          <p className="text-2xl font-black italic tracking-tighter text-indigo-500">
            {formatCurrency(stockValue)}
          </p>
          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Custo total parado</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CPV Total</p>
          <p className="text-2xl font-black italic tracking-tighter text-slate-500">
            {formatCurrency(totalCost)}
          </p>
          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Custo das mercadorias vendidas</p>
        </div>
      </div>

      {/* PROFIT BY PRODUCT */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Análise de Lucratividade por Produto</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Comparativo entre custo de entrada e preço de venda</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Produto</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Vendas</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Custo Un.</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Venda Un.</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Lucro Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {profitStats.map(s => {
                        const unitCost = s.qty > 0 ? s.cost / s.qty : 0;
                        const unitPrice = s.qty > 0 ? s.revenue / s.qty : 0;
                        return (
                            <tr key={s.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-8 py-4">
                                    <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{s.name}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <p className="text-xs font-black text-slate-600 dark:text-slate-400">{s.qty}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="text-xs font-bold text-slate-400">{formatCurrency(unitCost)}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">{formatCurrency(unitPrice)}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className={`text-sm font-black italic tracking-tighter ${s.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(s.profit)}</p>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
