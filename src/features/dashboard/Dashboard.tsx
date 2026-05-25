import React, { useState, useMemo } from 'react';
import { Sale, Product, User, Theme, formatCurrency, getBusinessDateStart, PaymentMethod } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import AIInsights from './AIInsights';
import DemandForecast from './DemandForecast';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  users: User[];
  theme: Theme;
  stockBalances: Record<string, number>;
}

type Period = 'HOJE' | 'ONTEM' | 'SEMANA' | 'MÊS' | 'ANO';

const Dashboard: React.FC<DashboardProps> = ({ sales = [], products = [], users = [], theme, stockBalances = {} }) => {
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

  const previousFilteredSales = useMemo(() => {
    const nowTs = Date.now();
    const todayStart = getBusinessDateStart(nowTs);
    
    return (sales || []).filter(s => {
      if (s.deleted) return false;
      const saleStart = getBusinessDateStart(s.timestamp);
      
      switch (activePeriod) {
        case 'HOJE': return saleStart === todayStart - 86400000;
        case 'ONTEM': return saleStart === todayStart - (2 * 86400000);
        case 'SEMANA': 
          const weekAgo = todayStart - (6 * 86400000);
          return s.timestamp >= weekAgo - (7 * 86400000) && s.timestamp < weekAgo;
        case 'MÊS':
          const dMonth = new Date(todayStart);
          const firstThisMonth = new Date(dMonth.getFullYear(), dMonth.getMonth(), 1).getTime();
          const firstLastMonth = new Date(dMonth.getFullYear(), dMonth.getMonth() - 1, 1).getTime();
          return s.timestamp >= firstLastMonth && s.timestamp < firstThisMonth;
        case 'ANO':
          const yYear = new Date(todayStart);
          const firstThisYear = new Date(yYear.getFullYear(), 0, 1).getTime();
          const firstLastYear = new Date(yYear.getFullYear() - 1, 0, 1).getTime();
          return s.timestamp >= firstLastYear && s.timestamp < firstThisYear;
        default: return false;
      }
    });
  }, [sales, activePeriod]);

  const getStats = (salesList: Sale[]) => {
    const revenue = salesList.reduce((acc, s) => {
       if (s.payments) {
          const paidAmount = s.payments
             .filter(p => p.method !== PaymentMethod.PENDURA)
             .reduce((sum, p) => sum + p.amount, 0);
          return acc + paidAmount;
       } else {
          return acc + (s.paymentMethod !== PaymentMethod.PENDURA ? (s.total ?? 0) : 0);
       }
    }, 0);
    const orders = salesList.filter(s => !s.items?.some(i => i.productId === 'quitacao')).length;
    const avg = orders > 0 ? revenue / orders : 0;
    return { revenue, orders, avg };
  };

  const currentStats = useMemo(() => getStats(filteredSales), [filteredSales]);
  const previousStats = useMemo(() => getStats(previousFilteredSales), [previousFilteredSales]);

  const avgOrderChange = useMemo(() => {
    if (previousStats.avg === 0) return null;
    return ((currentStats.avg - previousStats.avg) / previousStats.avg) * 100;
  }, [currentStats.avg, previousStats.avg]);

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

  const garcomData = useMemo(() => {
    const revenueByUser = filteredSales.reduce((acc: Record<string, number>, s) => {
      const user = users.find(u => u.id === s.userId);
      const name = user?.displayName || s.userId || 'Sistema';
      acc[name] = (acc[name] || 0) + (s.total || 0);
      return acc;
    }, {});

    return Object.entries(revenueByUser)
      .map(([name, total]) => ({ name, total: Number(total) }))
      .sort((a, b) => b.total - a.total);
  }, [filteredSales, users]);

  const heatmapData = useMemo(() => {
    const hours = Array.from({ length: 24 }).map((_, i) => ({ hour: `${i}h`, v: 0 }));
    filteredSales.forEach(s => {
      const h = new Date(s.timestamp).getHours();
      hours[h].v += 1;
    });
    return hours;
  }, [filteredSales]);

  const combosData = useMemo(() => {
    const pairCounts: Record<string, number> = {};
    
    filteredSales.forEach(sale => {
      if (sale.deleted || !sale.items || sale.items.length < 2) return;
      
      const productNames = Array.from(new Set(
        sale.items
          .filter(i => i.productId !== 'quitacao')
          .map(i => i.productName)
      )).sort();

      if (productNames.length < 2) return;
      
      for (let i = 0; i < productNames.length; i++) {
        for (let j = i + 1; j < productNames.length; j++) {
          const pair = `${productNames[i]} + ${productNames[j]}`;
          pairCounts[pair] = (pairCounts[pair] || 0) + 1;
        }
      }
    });

    return Object.entries(pairCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
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
          { label: 'Faturamento Líquido', val: formatCurrency(currentStats.revenue), sub: 'Liquidez Real', color: 'text-emerald-500' },
          { label: 'Tickets Realizados', val: currentStats.orders, sub: 'Volume de Atendimento', color: 'text-blue-500' },
          { 
            label: 'Ticket Médio', 
            val: formatCurrency(currentStats.avg), 
            sub: avgOrderChange !== null 
              ? `${avgOrderChange >= 0 ? '↑' : '↓'} ${Math.abs(avgOrderChange).toFixed(1)}% vs anterior`
              : 'Consumo por Mesa', 
            color: avgOrderChange !== null ? (avgOrderChange >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-indigo-500' 
          },
          { label: 'Status Sistema', val: 'Estável', sub: 'Rede Operacional', color: 'text-emerald-500' }
        ].map((stat, i) => (
          <div key={i} className="p-6 border shadow-sm bg-white dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform cursor-default">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stat.val}</p>
            <div className="flex items-center gap-1 mt-2">
               <span className={`w-1.5 h-1.5 rounded-full ${stat.color.replace('text', 'bg')}`}></span>
               <p className={`text-[10px] font-black uppercase tracking-widest italic ${stat.color}`}>{stat.sub}</p>
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

        <div className="p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-8 text-slate-500">Ranking de Atendimento</h3>
          <div className="h-[300px]">
             {garcomData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={garcomData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 9, fontWeight: '900' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 9 }} />
                    <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', borderRadius: '16px' }} />
                    <Bar dataKey="total" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center italic text-slate-400 text-[10px] font-black uppercase">Sem dados de equipe</div>
             )}
          </div>
        </div>

        <div className="xl:col-span-2 p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800">
           <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-8 text-slate-500">Mapa de Calor (Horário de Pico)</h3>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heatmapData}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', borderRadius: '16px' }} />
                  <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorV)" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 9, fontWeight: '900' }} interval={2} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <DemandForecast sales={sales} products={products} />

        <AIInsights products={products} sales={sales} stockBalances={stockBalances} />

        <div className="xl:col-span-2 p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">🔥 Insights de Venda: Combos Populares</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Baseado em itens vendidos juntos</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {combosData.length > 0 ? combosData.map((combo, i) => (
                <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center relative overflow-hidden group hover:border-red-500/30 transition-colors">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-4xl">🎯</span>
                  </div>
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center font-black text-xs mb-4">
                    #{i + 1}
                  </div>
                  <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-tight mb-2">
                    {combo.name.split(' + ').map((n, idx) => (
                      <React.Fragment key={idx}>
                        {n}
                        {idx === 0 && <br />}
                        {idx === 0 && <span className="text-[9px] text-slate-400 inline-block my-1">+</span>}
                        {idx === 0 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 w-full">
                    {combo.count} {combo.count === 1 ? 'Ocorrência' : 'Ocorrências'}
                  </p>
                </div>
              )) : (
                <div className="md:col-span-3 py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Ainda não detectamos combos frequentes no período.</p>
                </div>
              )}
           </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;