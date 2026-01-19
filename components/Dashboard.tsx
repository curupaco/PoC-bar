
import React, { useState, useMemo } from 'react';
import { Sale, Product, Theme, formatCurrency, getBusinessDateStart, PaymentMethod } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  theme: Theme;
}

type Period = 'HOJE' | 'ONTEM' | 'SEMANA' | 'MÊS' | 'ANO';

const Dashboard: React.FC<DashboardProps> = ({ sales = [], products = [], theme }) => {
  const isDark = theme === 'dark';
  const [activePeriod, setActivePeriod] = useState<Period>('HOJE');

  const filteredSales = useMemo(() => {
    const nowTs = Date.now();
    const todayStart = getBusinessDateStart(nowTs);
    
    return sales.filter(s => {
      const saleStart = getBusinessDateStart(s.timestamp);
      
      switch (activePeriod) {
        case 'HOJE':
          return saleStart === todayStart;
        case 'ONTEM':
          return saleStart === todayStart - 86400000;
        case 'SEMANA':
          return s.timestamp >= todayStart - (6 * 86400000);
        case 'MÊS':
          const d = new Date(todayStart);
          const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
          return s.timestamp >= startOfMonth;
        case 'ANO':
          const y = new Date(todayStart);
          const startOfYear = new Date(y.getFullYear(), 0, 1).getTime();
          return s.timestamp >= startOfYear;
        default:
          return true;
      }
    });
  }, [sales, activePeriod]);

  const realizedRevenue = useMemo(() => 
    filteredSales
      .filter(s => s.paymentMethod !== PaymentMethod.PENDURA)
      .reduce((acc, s) => acc + (s.total ?? 0), 0)
  , [filteredSales]);

  const operationalOrders = useMemo(() => 
    filteredSales.filter(s => !s.items?.some(i => i.productId === 'quitacao')).length
  , [filteredSales]);

  const avgOrder = operationalOrders > 0 ? realizedRevenue / operationalOrders : 0;

  const barData = useMemo(() => {
    const counts = filteredSales
      .filter(s => !s.items?.some(it => it.productId === 'quitacao'))
      .flatMap(s => s.items ?? [])
      .reduce((acc: Record<string, number>, item) => {
        acc[item.productName] = (acc[item.productName] || 0) + (item.quantity ?? 0);
        return acc;
      }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredSales]);

  const salesTrend = useMemo(() => {
    return [...filteredSales]
      .filter(s => s.paymentMethod !== PaymentMethod.PENDURA)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
      .map((s) => ({
        name: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        total: s.total ?? 0
      }));
  }, [filteredSales]);

  const chartColor = '#ef4444';
  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto`}>
      <div className="flex flex-col items-center gap-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Performance Geral</p>
        <div className={`flex p-1.5 border shadow-sm w-fit overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 rounded-[24px] border-slate-200 dark:border-slate-800`}>
          {(['HOJE', 'ONTEM', 'SEMANA', 'MÊS', 'ANO'] as Period[]).map(p => (
            <button key={p} onClick={() => setActivePeriod(p)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activePeriod === p ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Lucro Realizado', val: formatCurrency(realizedRevenue), sub: 'Entrada Efetiva', color: 'text-emerald-500' },
          { label: 'Comandas', val: operationalOrders, sub: 'Vendas Fechadas', color: 'text-blue-500' },
          { label: 'Ticket Médio', val: formatCurrency(avgOrder), sub: 'Média / Venda', color: 'text-indigo-500' },
          { label: 'Status Bar', val: 'Sincronizado', sub: 'v3.9.12', color: 'text-emerald-500' }
        ].map((stat, i) => (
          <div key={i} className={`p-6 border shadow-sm transition-all hover:shadow-md bg-white dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stat.val}</p>
            <div className="flex items-center gap-1 mt-2">
               <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${stat.color.replace('text', 'bg')}`}></span>
               <p className={`text-[9px] font-black uppercase tracking-widest italic ${stat.color}`}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
        <div className={`p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800`}>
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-8 text-slate-400">Produtos Mais Saídos</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: -10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: '900', fontFamily: 'Inter' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: (isDark ? '#020617' : '#fff'), border: `1px solid ${gridColor}`, borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="count" fill={chartColor} radius={[0, 10, 10, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800`}>
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-8 text-slate-400">Movimento (Horário)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/><stop offset="95%" stopColor={chartColor} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: '700', fontFamily: 'Inter' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: '700', fontFamily: 'Inter' }} />
                <Tooltip contentStyle={{ backgroundColor: (isDark ? '#020617' : '#fff'), border: `1px solid ${gridColor}`, borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="total" stroke={chartColor} fillOpacity={1} fill="url(#colorTotal)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
