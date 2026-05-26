import React, { useState, useMemo, useEffect } from 'react';
import { Franchise, Unit, User, Sale, formatCurrency, PaymentMethod } from '../../types';
import { getFirebaseToken, loadFromFirebase } from '../../services/firebaseService';
import { safeLocalStorage } from '../../utils/storage';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

interface FranchiseDashboardProps {
  units: Unit[];
  franchises: Franchise[];
  currentUser: User;
  syncConfig: { url: string; key: string; email: string; pass: string };
}

type Period = 'HOJE' | 'SEMANA' | 'MÊS';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const FranchiseDashboard: React.FC<FranchiseDashboardProps> = ({ units, franchises, currentUser, syncConfig }) => {
  const [activePeriod, setActivePeriod] = useState<Period>('HOJE');
  const [loading, setLoading] = useState(false);
  const [franchiseSales, setFranchiseSales] = useState<Record<string, Sale[]>>({});

  const userFranchise = useMemo(() => {
    if (currentUser.username === 'admin') return franchises[0]; // Admin vê a primeira ou pode mudar
    return franchises.find(f => f.id === currentUser.franchiseId);
  }, [franchises, currentUser]);

  const unitsInFranchise = useMemo(() => {
    if (!userFranchise) return [];
    return units.filter(u => u.franchiseId === userFranchise.id);
  }, [units, userFranchise]);

  useEffect(() => {
    const CACHE_KEY = `btq_cache_network_${userFranchise?.id || 'admin'}`;
    
    const fetchAllData = async () => {
      if (unitsInFranchise.length === 0) return;
      setLoading(true);
      try {
        const token = await getFirebaseToken(syncConfig.email, syncConfig.pass, syncConfig.key);
        
        const promises = unitsInFranchise.map(async (unit) => {
          try {
            const path = `data/units/${unit.id}/sales`;
            // Aumentamos o limite para 5000 para cobrir períodos maiores com segurança na rede
            const query = `orderBy="$key"&limitToLast=5000`;
            const data = await loadFromFirebase(syncConfig.url, undefined, token, path, query);
            
            if (data) {
              const arr = Array.isArray(data) ? data : Object.entries(data).map(([k, v]: [string, any]) => ({ ...v, id: k }));
              return { unitId: unit.id, sales: arr.filter(Boolean) as Sale[] };
            }
          } catch (e) {
            console.warn(`Erro ao carregar unidade ${unit.name}:`, e);
          }
          return { unitId: unit.id, sales: [] };
        });

        const results = await Promise.all(promises);
        const map: Record<string, Sale[]> = {};
        results.forEach(r => { map[r.unitId] = r.sales; });
        
        // Salva em cache para uso offline ou falha futura
        safeLocalStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: map }));
        setFranchiseSales(map);
      } catch (e) {
        console.error("Failed to fetch franchise data", e);
        // Fallback para cache local se o fetch principal falhar
        const cached = safeLocalStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          setFranchiseSales(data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [unitsInFranchise, syncConfig, userFranchise]);

  const aggregatedMetrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const statsByUnit: any[] = [];
    let totalRevenue = 0;
    let totalOrders = 0;

    unitsInFranchise.forEach(unit => {
      const sales = (franchiseSales[unit.id] || []).filter(s => {
        if (s.deleted) return false;
        const sDate = new Date(s.timestamp).toISOString().split('T')[0];
        if (activePeriod === 'HOJE') return sDate === todayStr;
        if (activePeriod === 'SEMANA') return s.timestamp >= weekAgo;
        if (activePeriod === 'MÊS') return s.timestamp >= monthStart;
        return true;
      });

      const unitRevenue = sales.reduce((acc, s) => {
        if (s.payments) {
          return acc + s.payments.filter(p => p.method !== PaymentMethod.PENDURA).reduce((sum, p) => sum + p.amount, 0);
        }
        return acc + (s.paymentMethod !== PaymentMethod.PENDURA ? (s.total || 0) : 0);
      }, 0);

      const unitOrders = sales.filter(s => !s.items?.some(i => i.productId === 'quitacao')).length;

      statsByUnit.push({
        id: unit.id,
        name: unit.name,
        revenue: unitRevenue,
        orders: unitOrders,
        avgTicket: unitOrders > 0 ? unitRevenue / unitOrders : 0
      });

      totalRevenue += unitRevenue;
      totalOrders += unitOrders;
    });

    return {
      totalRevenue,
      totalOrders,
      avgTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      statsByUnit: statsByUnit.sort((a, b) => b.revenue - a.revenue)
    };
  }, [franchiseSales, unitsInFranchise, activePeriod]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Consolidando dados da rede...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
           <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Painel da Rede</h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Distribuição de Performance • {userFranchise?.name || 'Geral'}</p>
        </div>
        
        <div className="flex p-1.5 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
          {(['HOJE', 'SEMANA', 'MÊS'] as Period[]).map(p => (
            <button key={p} onClick={() => setActivePeriod(p)} className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activePeriod === p ? 'bg-red-600 text-white shadow-xl shadow-red-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Faturamento Total', val: formatCurrency(aggregatedMetrics.totalRevenue), sub: 'Receita Líquida Rede', color: 'text-emerald-500' },
          { label: 'Total de Vendas', val: aggregatedMetrics.totalOrders, sub: 'Volume Consolidado', color: 'text-blue-500' },
          { label: 'Ticket Médio Rede', val: formatCurrency(aggregatedMetrics.avgTicket), sub: 'Média por Unidade', color: 'text-indigo-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
            <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{stat.val}</p>
            <p className={`text-[9px] font-black uppercase mt-3 ${stat.color}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-10">Ranking por Unidade (Faturamento)</h3>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregatedMetrics.statsByUnit} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="revenue" fill="#ef4444" radius={[0, 12, 12, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-10">Market Share (Volume de Pedidos)</h3>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aggregatedMetrics.statsByUnit}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="orders"
                  >
                    {aggregatedMetrics.statsByUnit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {aggregatedMetrics.statsByUnit.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-[9px] font-black uppercase text-slate-500">{u.name}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/50">
              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">Unidade</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Faturamento</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Vendas</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Tkt Médio</th>
            </tr>
          </thead>
          <tbody>
            {aggregatedMetrics.statsByUnit.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-8 py-6 font-black text-slate-800 dark:text-white uppercase text-sm">
                   {u.name}
                </td>
                <td className="px-8 py-6 font-black text-slate-800 dark:text-white text-sm text-right">
                   {formatCurrency(u.revenue)}
                </td>
                <td className="px-8 py-6 font-bold text-slate-500 text-sm text-right">
                   {u.orders}
                </td>
                <td className="px-8 py-6 font-bold text-slate-500 text-sm text-right">
                   {formatCurrency(u.avgTicket)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FranchiseDashboard;
