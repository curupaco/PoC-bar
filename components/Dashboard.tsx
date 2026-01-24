
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
  const isDark = true; // Sempre dark por preferência do usuário
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

  const chartColor = '#ef4444';
  const gridColor = '#1e293b';
  const textColor = '#94a3b8';

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
         <img src="https://img.icons8.com/fluency/512/empty-box.png" className="w-24 h-24 mb-4 grayscale opacity-20" />
         <p className="font-black uppercase tracking-widest text-xs">Sem dados para exibir ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto dark">
      <div className="flex flex-col items-center gap-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Performance do Bar</p>
        <div className="flex p-1.5 border shadow-sm w-fit bg-slate-900 rounded-[24px] border-slate-800">
          {(['HOJE', 'ONTEM', 'SEMANA', 'MÊS', 'ANO'] as Period[]).map(p => (
            <button key={p} onClick={() => setActivePeriod(p)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activePeriod === p ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Faturamento Líquido', val: formatCurrency(realizedRevenue), sub: 'Dinheiro/Cartão/Pix', color: 'text-emerald-500' },
          { label: 'Vendas Realizadas', val: operationalOrders, sub: 'Total de Comandas', color: 'text-blue-500' },
          { label: 'Ticket Médio', val: formatCurrency(avgOrder), sub: 'Média por Cliente', color: 'text-indigo-500' },
          { label: 'Sincronização', val: 'Ativa', sub: 'v4.0.5 Stable', color: 'text-emerald-500' }
        ].map((stat, i) => (
          <div key={i} className="p-6 border shadow-sm bg-slate-900 rounded-3xl border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter text-white">{stat.val}</p>
            <div className="flex items-center gap-1 mt-2">
               <span className={`w-1.5 h-1.5 rounded-full ${stat.color.replace('text', 'bg')}`}></span>
               <p className={`text-[9px] font-black uppercase tracking-widest italic ${stat.color}`}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
        <div className="p-8 border shadow-sm bg-slate-900 rounded-[40px] border-slate-800">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-8 text-slate-500">Produtos Mais Vendidos</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: '900' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff' }} />
                <Bar dataKey="count" fill={chartColor} radius={[0, 10, 10, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
