
import React from 'react';
import { Sale, Product, PaymentMethod, Theme } from '../types';
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">R$ {totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-500 font-bold mt-2">↑ Em tempo real</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pedidos</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{totalOrders}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-2">Registros totais</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sm:col-span-2 lg:col-span-1 transition-colors">
          <p className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">R$ {avgOrder.toFixed(2)}</p>
          <p className="text-[10px] text-indigo-400 font-bold mt-2">Por cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="font-bold text-sm lg:text-base text-slate-800 dark:text-white mb-6">Top 5 Produtos</h3>
          <div className="h-[250px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '10px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="font-bold text-sm lg:text-base text-slate-800 dark:text-white mb-6">Vendas Recentes</h3>
          <div className="h-[250px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 9 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 9 }}
                />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#ef4444" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
