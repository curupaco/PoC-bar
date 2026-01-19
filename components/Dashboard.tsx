
import React, { useState, useMemo } from 'react';
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

type Period = 'HOJE' | 'ONTEM' | 'SEMANA' | 'MÊS' | 'ANO';

const Dashboard: React.FC<DashboardProps> = ({ sales = [], products = [], theme }) => {
  const isDark = theme === 'dark';
  const [activePeriod, setActivePeriod] = useState<Period>('HOJE');

  // LÓGICA DE DIA COMERCIAL (CUTOFF 05:00 AM)
  const filteredSales = useMemo(() => {
    const now = new Date();
    const CUTOFF_HOUR = 5;
    
    // Se agora for antes das 5h, o "dia de hoje" comercial começou ontem às 5h
    const getBusinessStart = (date: Date) => {
      const d = new Date(date);
      if (d.getHours() < CUTOFF_HOUR) {
        d.setDate(d.getDate() - 1);
      }
      d.setHours(CUTOFF_HOUR, 0, 0, 0);
      return d.getTime();
    };

    const businessStartToday = getBusinessStart(now);
    const endOfToday = businessStartToday + 86399999;
    
    return sales.filter(s => {
      const saleDate = s.timestamp;
      
      switch (activePeriod) {
        case 'HOJE':
          return saleDate >= businessStartToday && saleDate <= endOfToday;
        
        case 'ONTEM': {
          const startOfYesterday = businessStartToday - 86400000;
          const endOfYesterday = businessStartToday - 1;
          return saleDate >= startOfYesterday && saleDate <= endOfYesterday;
        }
        
        case 'SEMANA': {
          const d = new Date(businessStartToday);
          const dayOfWeek = d.getDay();
          const startOfWeek = businessStartToday - (dayOfWeek * 86400000);
          return saleDate >= startOfWeek;
        }
        
        case 'MÊS': {
          const d = new Date(businessStartToday);
          const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1, CUTOFF_HOUR, 0, 0).getTime();
          return saleDate >= startOfMonth;
        }
        
        case 'ANO': {
          const d = new Date(businessStartToday);
          const startOfYear = new Date(d.getFullYear(), 0, 1, CUTOFF_HOUR, 0, 0).getTime();
          return saleDate >= startOfYear;
        }
        
        default:
          return true;
      }
    });
  }, [sales, activePeriod]);

  // MÉTRICAS CALCULADAS
  const totalRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + (s.total ?? 0), 0), [filteredSales]);
  const totalOrders = filteredSales.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const salesWithTime = useMemo(() => filteredSales.filter(s => s.openedAt && s.timestamp), [filteredSales]);
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

  const barData = useMemo(() => {
    const counts = filteredSales.flatMap(s => s.items ?? []).reduce((acc: Record<string, number>, item) => {
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
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)
      .map((s) => ({
        name: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        total: s.total ?? 0
      }));
  }, [filteredSales]);

  const chartColor = '#ef4444';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col items-center gap-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Período de Análise</p>
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm w-fit overflow-x-auto no-scrollbar">
          {(['HOJE', 'ONTEM', 'SEMANA', 'MÊS', 'ANO'] as Period[]).map(p => (
            <button key={p} onClick={() => setActivePeriod(p)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activePeriod === p ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento {activePeriod}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(totalRevenue)}</p>
          <div className="flex items-center gap-1 mt-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <p className="text-[9px] text-emerald-500 font-black uppercase">Consolidado</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Pedidos</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{totalOrders}</p>
          <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">Comandas no período</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tempo Médio</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatStayTime(avgStayTimeMs)}</p>
          <p className="text-[9px] text-blue-400 font-bold mt-2 uppercase">Permanência na Mesa</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(avgOrder)}</p>
          <p className="text-[9px] text-indigo-400 font-bold mt-2 uppercase">Gasto por Comanda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em] mb-8">Top 5 Mais Vendidos ({activePeriod})</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: -10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: '900' }} />
                <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: isDark ? '#020617' : '#fff', border: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }} formatter={(value: any) => [`${value} unid.`, 'Volume']} />
                <Bar dataKey="count" fill={chartColor} radius={[0, 10, 10, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em] mb-8">Curva de Faturamento (Recente)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/><stop offset="95%" stopColor={chartColor} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: '700' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10, fontWeight: '700' }} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#020617' : '#fff', border: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }} formatter={(value: any) => [formatCurrency(Number(value)), 'Total']} />
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
