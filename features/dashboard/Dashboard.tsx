import React, { useState, useMemo } from 'react';
import { Sale, Product, Theme, formatCurrency, getBusinessDateStart, PaymentMethod } from '../../types';
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
    
    return (sales || []).filter(s => {
      if (s.deleted) return false;
      const saleStart = getBusinessDateStart(s.timestamp);
      
      switch (activePeriod) {
        case 'HOJE': return saleStart === todayStart;
        case 'ONTEM': return saleStart === todayStart - 86400000;
        case 'SEMANA': return s.timestamp >= todayStart - (6 * 86400000);
        case 'MÊS':
          const d = new Date(todayStart);
          return s.timestamp >= new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        case 'ANO':
          const y = new Date(todayStart);
          return s.timestamp >= new Date(y.getFullYear(), 0, 1).getTime();
        default: return true;
      }
    });
  }, [sales, activePeriod]);

  const realizedRevenue = useMemo(() => 
    filteredSales.reduce((acc, s) => {
       if (s.payments) {
          const paidAmount = s.payments
             .filter(p => p.method !== PaymentMethod.PENDURA)
             .reduce((sum, p) => sum + p.amount, 0);
          return acc + paidAmount;
       } else {
          return acc + (s.paymentMethod !== PaymentMethod.PENDURA ? (s.total ?? 0) : 0);
       }
    }, 0)
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

  const chartColor = '#ef4444';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 animate-in fade-in duration-700">
         <div className="w-24 h-24 mb-6 relative">
            <img src="https://img.icons8.com/fluency/512/empty-box.png" className="w-full h-full grayscale opacity-20" alt="Vazio" />
         </div>
         <p className="font-black uppercase tracking-[0.3em] text-[10px] italic">Aguardando as primeiras vendas do bar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col items-center gap-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Relatório de Performance</p>
        <div className="flex p-1.5 border shadow-sm w-fit bg-white dark:bg-slate-900 rounded-[24px] border-slate-200 dark:border-slate-800">
          {(['HOJE', 'ONTEM', 'SEMANA', 'MÊS', 'ANO'] as Period[]).map(p => (
            <button key={p} onClick={() => setActivePeriod(p)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activePeriod === p ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Faturamento Líquido', val: formatCurrency(realizedRevenue), sub: 'Liquidez Real', color: 'text-emerald-500' },
          { label: 'Tickets Realizados', val: operationalOrders, sub: 'Volume de Atendimento', color: 'text-blue-500' },
          { label: 'Ticket Médio', val: formatCurrency(avgOrder), sub: 'Consumo por Mesa', color: 'text-indigo-500' },
          { label: 'Status Sistema', val: 'Estável', sub: 'Rede Operacional', color: 'text-emerald-500' }
        ].map((stat, i) => (
          <div key={i} className="p-6 border shadow-sm bg-white dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform cursor-default">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stat.val}</p>
            <div className="flex items-center gap-1 mt-2">
               <span className={`w-1.5 h-1.5 rounded-full ${stat.color.replace('text', 'bg')}`}></span>
               <p className={`text-[9px] font-black uppercase tracking-widest italic ${stat.color}`}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
        <div className="p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-8 text-slate-500">Curva ABC (Top 5 Produtos)</h3>
          <div className="h-[300px]">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: '900' }} />
                  <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', borderRadius: '16px', color: isDark ? '#fff' : '#000' }} />
                  <Bar dataKey="count" fill={chartColor} radius={[0, 10, 10, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center italic text-slate-400 text-[10px] font-black uppercase">Faltam dados para o gráfico</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;