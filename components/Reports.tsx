
import React, { useState, useMemo, useRef } from 'react';
import { Sale, Product, PaymentMethod, formatCurrency, SaleItem, User, Shift } from '../types';
import * as htmlToImage from 'html-to-image';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  users: User[];
  shifts: Shift[];
  onQuitarPendura: (customerName: string, amount: number) => void;
}

type ReportCategory = 'FINANCEIRO' | 'EQUIPE' | 'OPERACIONAL' | 'PRODUTOS';

const Reports: React.FC<ReportsProps> = ({ sales = [], products = [], users = [], shifts = [], onQuitarPendura }) => {
  const fechamentoRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('FINANCEIRO');
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [periodLabel, setPeriodLabel] = useState('DIA');

  const filteredSales = useMemo(() => {
    const start = new Date(startDate + 'T00:00:00').getTime();
    const end = new Date(endDate + 'T23:59:59').getTime();
    return (sales || []).filter(s => s.timestamp >= start && s.timestamp <= end);
  }, [sales, startDate, endDate]);

  const reportData = useMemo(() => {
    const totalsByMethod = Object.values(PaymentMethod).reduce((acc, method) => {
      acc[method] = { count: 0, total: 0 };
      return acc;
    }, {} as Record<string, { count: number, total: number }>);

    filteredSales.forEach(sale => {
      if (totalsByMethod[sale.paymentMethod]) {
        totalsByMethod[sale.paymentMethod].count += 1;
        totalsByMethod[sale.paymentMethod].total += (sale.total || 0);
      }
    });

    const grandTotal = filteredSales.reduce((acc, s) => acc + (s.total ?? 0), 0);
    const avgTicket = filteredSales.length > 0 ? grandTotal / filteredSales.length : 0;

    // Vendas por Usuário
    const salesByUser = filteredSales.reduce((acc: Record<string, number>, s) => {
      const user = users.find(u => u.id === s.userId)?.displayName || 'Desconhecido';
      acc[user] = (acc[user] || 0) + (s.total || 0);
      return acc;
    }, {} as Record<string, number>);

    // Fix: Added explicit return type to map to resolve 'unknown' property access in sort (Fixing line 101 error)
    const userChartData = Object.entries(salesByUser)
      .map(([name, total]): { name: string; total: number } => ({ name, total: Number(total) }))
      .sort((a, b) => b.total - a.total);

    // Vendas por Categoria
    const productMap = products.reduce((acc, p) => { acc[p.id] = p.category; return acc; }, {} as Record<string, string>);
    const categoryAgg = filteredSales.flatMap(s => s.items || []).reduce((acc: Record<string, number>, item: SaleItem) => {
      const cat = productMap[item.productId] || 'Geral';
      acc[cat] = (acc[cat] || 0) + (item.totalPrice || 0);
      return acc;
    }, {} as Record<string, number>);

    // Fix: Added explicit return type to map to resolve 'unknown' property access in sort (Fixing line 104 error)
    const categoryData = Object.entries(categoryAgg)
      .map(([name, total]): { name: string; total: number } => ({ name, total: Number(total) }))
      .sort((a, b) => b.total - a.total);

    return { 
      totalsByMethod, 
      grandTotal, 
      avgTicket,
      userChartData,
      categoryData
    };
  }, [filteredSales, users, products]);

  const setPreset = (type: 'HOJE' | 'ONTEM' | 'SEMANA' | 'MÊS') => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (type === 'ONTEM') { start.setDate(now.getDate() - 1); end.setDate(now.getDate() - 1); }
    else if (type === 'SEMANA') { start.setDate(now.getDate() - now.getDay()); }
    else if (type === 'MÊS') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setPeriodLabel(type);
  };

  const renderActiveReport = () => {
    switch(activeCategory) {
      case 'FINANCEIRO':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Faturamento por Método</h3>
                <div className="space-y-4">
                   {Object.entries(reportData.totalsByMethod).map(([method, data]) => (data.total > 0 && (
                     <div key={method} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <span className="text-sm font-bold uppercase text-slate-600 dark:text-slate-400">{method}</span>
                        <span className="font-black text-slate-900 dark:text-white">{formatCurrency(data.total)}</span>
                     </div>
                   )))}
                   <div className="pt-4 flex justify-between items-center text-xl font-black">
                      <span className="uppercase text-[10px] tracking-widest">Total Líquido</span>
                      <span className="text-red-600">{formatCurrency(reportData.grandTotal)}</span>
                   </div>
                </div>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Médio</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(reportData.avgTicket)}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase">Baseado em {filteredSales.length} comandas</p>
             </div>
          </div>
        );
      case 'EQUIPE':
        return (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Performance de Vendas por Colaborador</h3>
             <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={reportData.userChartData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 11}} />
                      <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={24}>
                         {reportData.userChartData.map((_, index) => (
                           <Cell key={index} fill={index === 0 ? '#ef4444' : '#475569'} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        );
      case 'OPERACIONAL':
        return (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Eficiência por Turno</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4">Turno/Data</th>
                      <th className="px-6 py-4">Operador</th>
                      <th className="px-6 py-4 text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {shifts.slice(-10).reverse().map(s => {
                      const sTotal = (sales || []).filter(sa => sa.shiftId === s.id).reduce((acc, sa) => acc + sa.total, 0);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-4 font-bold">{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="px-6 py-4 uppercase font-black text-slate-400">@{s.openedBy}</td>
                          <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(sTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        );
      case 'PRODUTOS':
        return (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Faturamento por Categoria de Produto</h3>
             <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={reportData.categoryData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 11}} />
                      <Bar dataKey="total" fill="#ef4444" radius={[0, 10, 10, 0]} barSize={24} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {(['FINANCEIRO', 'EQUIPE', 'OPERACIONAL', 'PRODUTOS'] as ReportCategory[]).map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
           {['HOJE', 'ONTEM', 'SEMANA', 'MÊS'].map(p => (
             <button key={p} onClick={() => setPreset(p as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${periodLabel === p ? 'bg-black text-white border-black' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>{p}</button>
           ))}
        </div>
      </div>

      <div className="min-h-[500px]">
        {renderActiveReport()}
      </div>

      {activeCategory === 'FINANCEIRO' && (
        <div className="flex justify-center">
          <button onClick={() => setPreset('HOJE')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Zerar filtros e ver hoje</button>
        </div>
      )}
    </div>
  );
};

export default Reports;
