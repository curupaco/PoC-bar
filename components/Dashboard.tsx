
import React from 'react';
import { Sale, Product, Theme, formatCurrency } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  theme: Theme;
}

const Dashboard: React.FC<DashboardProps> = ({ sales = [], products = [], theme }) => {
  const isDark = theme === 'dark';
  const safeSales = sales ?? [];
  
  const totalRevenue = safeSales.reduce((acc, s) => acc + (s.total ?? 0), 0);
  const totalOrders = safeSales.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Cálculo de Tempo Médio de Permanência
  const salesWithTime = safeSales.filter(s => s.openedAt && s.timestamp);
  const totalStayTimeMs = salesWithTime.reduce((acc, s) => acc + (s.timestamp - (s.openedAt || 0)), 0);
  const avgStayTimeMs = salesWithTime.length > 0 ? totalStayTimeMs / salesWithTime.length : 0;
  
  const formatStayTime = (ms: number) => {
    if (ms <= 0) return "--";
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const productCounts = safeSales.flatMap(s => s.items ?? []).reduce((acc: Record<string, number>, item) => {
    acc[item.productName] = (acc[item.productName] || 0) + (item.quantity ?? 0);
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(productCounts)
    .map(([name, count]) => ({ name, count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const salesTrend = safeSales.slice(-10).reverse().map((s) => ({
    name: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    total: s.total ?? 0
  }));

  const chartColor = isDark ? '#ef4444' : '#ef4444';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
          <p className="text-[10px] text-emerald-500 font-bold mt-2">↑ Em tempo real</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mesas</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalOrders}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-2">Registros totais</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tempo Médio</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{formatStayTime(avgStayTimeMs)}</p>
          <p className="text-[10px] text-blue-400 font-bold mt-2">Permanência</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(avgOrder)}</p>
          <p className="text-[10px] text-indigo-400 font-bold mt-2">Por cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <h3 className="font-black text-xs uppercase text-slate-400 tracking-widest mb-8">Top 5 Produtos</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: -10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: textColor, fontSize: 10, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: isDark ? '#020617' : '#fff', border: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${value} unid.`, 'Vendas']}
                />
                <Bar dataKey="count" fill={chartColor} radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <h3 className="font-black text-xs uppercase text-slate-400 tracking-widest mb-8">Fluxo de Vendas Recentes</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: textColor, fontSize: 9, fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: textColor, fontSize: 9, fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#020617' : '#fff', border: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Total']} 
                />
                <Area type="monotone" dataKey="total" stroke={chartColor} fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
