
import React, { useState, useMemo, useRef } from 'react';
import { Sale, Product, PaymentMethod, formatCurrency, SaleItem } from '../types';
import * as htmlToImage from 'html-to-image';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const DrinkBorder = ({ position }: { position: 'top' | 'bottom' }) => (
  <div className={`absolute left-0 right-0 flex justify-around items-center px-2 overflow-hidden h-4 pointer-events-none opacity-40 ${position === 'top' ? '-top-4' : '-bottom-4 rotate-180'}`}>
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="flex gap-2 text-white scale-75">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A2,2 0 0,1 14,4V7H10V4A2,2 0 0,1 12,2M15,10V22H9V10H15M14,8H10V9H14V8Z" /></svg>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M4,2H18A2,2 0 0,1 20,4V6H22V11A2,2 0 0,1 20,13V18A2,2 0 0,1 18,20H4A2,2 0 0,1 2,18V4A2,2 0 0,1 4,2M20,6H18V11H20V6M4,4V18H18V4H4Z" /></svg>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3,2L5,20.23C5.13,21.23 5.97,22 7,22H17C18.03,22 18.87,21.23 19,20.23L21,2V4H3V2Z" /></svg>
      </div>
    ))}
  </div>
);

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  onQuitarPendura: (customerName: string, amount: number) => void;
}

const Reports: React.FC<ReportsProps> = ({ sales = [], products = [], onQuitarPendura }) => {
  const safeSales = sales ?? [];
  const fechamentoRef = useRef<HTMLDivElement>(null);
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [periodLabel, setPeriodLabel] = useState('DIA');

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    summary: false,
    financial: false,
    penduras: false,
    dailyClosing: false
  });

  const toggleSection = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredSales = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;
    return safeSales.filter(s => s.timestamp >= start && s.timestamp <= end);
  }, [safeSales, startDate, endDate]);

  const reportData = useMemo(() => {
    const totalsByMethod = Object.values(PaymentMethod).reduce((acc, method) => {
      acc[method] = { count: 0, total: 0 };
      return acc;
    }, {} as Record<string, { count: number, total: number }>);

    filteredSales.forEach(sale => {
      if (totalsByMethod[sale.paymentMethod]) {
        totalsByMethod[sale.paymentMethod].count += 1;
        const currentVal = totalsByMethod[sale.paymentMethod].total || 0;
        const addVal = sale.total || 0;
        totalsByMethod[sale.paymentMethod].total = currentVal + addVal;
      }
    });

    const grandTotal = filteredSales.reduce((acc, s) => acc + (s.total ?? 0), 0);

    const pendurasByCustomer = filteredSales
      .reduce((acc: Record<string, number>, s) => {
        const name = s.customerName;
        if (!name) return acc;
        const currentBalance = Number(acc[name] || 0);
        const saleTotal = Number(s.total ?? 0);
        if (s.paymentMethod === PaymentMethod.PENDURA) {
          acc[name] = currentBalance + saleTotal;
        } else {
          acc[name] = currentBalance - saleTotal;
        }
        return acc;
      }, {} as Record<string, number>);

    const activePenduras = (Object.entries(pendurasByCustomer) as [string, number][])
      .filter(([_, balance]) => balance > 0.01)
      .reduce((acc, [name, balance]) => {
        acc[name] = balance;
        return acc;
      }, {} as Record<string, number>);

    const productMap = products.reduce((acc, p) => { acc[p.id] = p.category; return acc; }, {} as Record<string, string>);
    const categoryAgg = filteredSales.flatMap(s => s.items || []).reduce((acc: Record<string, number>, item: SaleItem) => {
      const cat = productMap[item.productId] || 'Geral';
      const current = Number(acc[cat] || 0);
      const itemPrice = Number(item.totalPrice || 0);
      acc[cat] = current + itemPrice;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryAgg)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    const pendurasInPeriod = filteredSales
      .filter(s => s.paymentMethod === PaymentMethod.PENDURA)
      .reduce((acc: Record<string, number>, s) => {
        const name = s.customerName || 'Cliente Oculto';
        const currentSum = Number(acc[name] || 0);
        const amountToAdd = Number(s.total ?? 0);
        acc[name] = currentSum + amountToAdd;
        return acc;
      }, {} as Record<string, number>);

    return { 
      totalsByMethod, 
      grandTotal, 
      pendurasByCustomer: activePenduras, 
      categoryData,
      pendurasInPeriod,
      itemsCount: filteredSales.reduce((acc, s) => acc + (s.items?.length ?? 0), 0)
    };
  }, [filteredSales, products]);

  const aggregations = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const daily = safeSales.filter(s => s.timestamp >= startOfToday).reduce((acc, s) => acc + (s.total ?? 0), 0);
    const weekly = safeSales.filter(s => s.timestamp >= startOfWeek).reduce((acc, s) => acc + (s.total ?? 0), 0);
    const monthly = safeSales.filter(s => s.timestamp >= startOfMonth).reduce((acc, s) => acc + (s.total ?? 0), 0);

    return { daily, weekly, monthly };
  }, [safeSales]);

  const setPreset = (type: 'HOJE' | 'ONTEM' | 'SEMANA' | 'MÊS') => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (type === 'HOJE') {
      setPeriodLabel('DIA');
    } else if (type === 'ONTEM') {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
      setPeriodLabel('ONTEM');
    } else if (type === 'SEMANA') {
      start.setDate(now.getDate() - now.getDay());
      setPeriodLabel('SEMANA');
    } else if (type === 'MÊS') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      setPeriodLabel('MÊS');
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const exportAsImage = async () => {
    if (!fechamentoRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(fechamentoRef.current, { backgroundColor: '#000000', cacheBust: true });
      const link = document.createElement('a');
      link.download = `fechamento_${periodLabel}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      alert('Não foi possível gerar a imagem.');
    }
  };

  const SectionHeader = ({ title, section, icon }: { title: string, section: string, icon: React.ReactNode }) => (
    <button 
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
          {icon}
        </div>
        <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm">{title}</h3>
      </div>
      <svg className={`w-5 h-5 text-slate-400 transition-transform ${expanded[section] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      
      {/* Atalhos de Período Fixos no Topo */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-2 justify-center">
        {['HOJE', 'ONTEM', 'SEMANA', 'MÊS'].map(p => (
          <button 
            key={p} 
            onClick={() => setPreset(p as any)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${
              (periodLabel === p || (p === 'MÊS' && periodLabel === 'MÊS') || (p === 'HOJE' && periodLabel === 'DIA'))
                ? 'bg-red-600 border-red-600 text-white shadow-red-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Resumo Financeiro */}
      <div>
        <SectionHeader 
          title="Resumo Financeiro" 
          section="summary" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} 
        />
        {expanded.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-l-4 border-red-600 shadow-sm transition-colors">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-wider">Hoje</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(aggregations.daily)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-l-4 border-black dark:border-slate-100 shadow-sm transition-colors">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-wider">Esta Semana</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(aggregations.weekly)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-l-4 border-red-600 shadow-sm transition-colors">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-wider">Este Mês</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(aggregations.monthly)}</p>
            </div>
          </div>
        )}
      </div>

      {/* FECHAMENTO (RECEIPT STYLE - BLACK THEME) */}
      <div>
        <SectionHeader 
          title="Fechamento" 
          section="dailyClosing" 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
        />
        {expanded.dailyClosing && (
          <div className="animate-in slide-in-from-top-2 flex flex-col items-center gap-12 py-10">
            <div ref={fechamentoRef} className="bg-black w-full max-w-sm p-8 shadow-2xl border-t-[10px] border-emerald-500 font-mono text-white flex flex-col relative">
              <DrinkBorder position="top" />
              
              <div className="text-center mb-6 space-y-0.5">
                <h2 className="text-2xl font-black font-barrio tracking-tighter uppercase leading-none">Botequista</h2>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">SISTEMA DE GESTÃO INTELIGENTE</p>
                <div className="h-2 border-b-2 border-dashed border-slate-800 my-4"></div>
                <p className="text-lg font-black uppercase text-red-500 tracking-tighter">FECHAMENTO {periodLabel}</p>
                <p className="text-[9px] uppercase font-bold text-slate-500">
                  {new Date(startDate).toLocaleDateString('pt-BR')} {startDate !== endDate ? `- ${new Date(endDate).toLocaleDateString('pt-BR')}` : ''}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] uppercase font-black">
                  <span>Operações:</span>
                  <span>{filteredSales.length} Vendas</span>
                </div>
                <div className="flex justify-between text-[11px] uppercase font-black">
                  <span>Itens Vendidos:</span>
                  <span>{reportData.itemsCount} unid.</span>
                </div>
                
                <div className="h-px border-b border-dashed border-slate-800 my-2"></div>
                
                <div className="space-y-0.5">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Resumo Financeiro:</p>
                  {(Object.entries(reportData.totalsByMethod) as [string, {total: number}][]).map(([method, data]) => data.total > 0 && (
                    <div key={method} className="mb-1">
                      <div className="flex justify-between text-[11px] font-black uppercase">
                        <span>{method}</span>
                        <span>{formatCurrency(data.total)}</span>
                      </div>
                      {method === PaymentMethod.PENDURA && Object.keys(reportData.pendurasInPeriod).length > 0 && (
                        <div className="pl-3 border-l-2 border-slate-800 space-y-0 mt-0.5">
                           {(Object.entries(reportData.pendurasInPeriod) as [string, number][]).map(([name, val]) => (
                             <div key={name} className="flex justify-between text-[10px] text-slate-500 font-black italic uppercase leading-tight">
                               <span className="truncate pr-2">• {name}</span>
                               <span className="shrink-0">{formatCurrency(val)}</span>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 mt-4 border-t border-dashed border-slate-800">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-3 text-center">Consumo por Categoria</p>
                  <div className="h-[200px] w-full bg-slate-900/40 rounded-xl p-2 border border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={reportData.categoryData} 
                        layout="vertical" 
                        margin={{ left: -15, right: 15, top: 10, bottom: 10 }}
                        categoryGap={2}
                      >
                         <XAxis type="number" hide />
                         <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={110}
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fill: '#ffffff', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }} 
                          />
                         <Bar 
                           dataKey="total" 
                           fill="#94a3b8" 
                           radius={[0, 4, 4, 0]} 
                           barSize={18}
                         />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="h-2 border-b-4 border-double border-slate-800 my-4"></div>
                
                <div className="flex justify-between items-center text-xl font-black">
                  <span className="uppercase text-[10px] tracking-widest">Total</span>
                  <span className="text-emerald-500">{formatCurrency(reportData.grandTotal)}</span>
                </div>
              </div>

              <div className="mt-10 pt-4 border-t border-dashed border-slate-800 text-center space-y-0.5">
                <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Botequista v2.5</p>
                <p className="text-[9px] uppercase font-black text-slate-600">{new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR')}</p>
              </div>

              <DrinkBorder position="bottom" />
            </div>

            <button 
              onClick={exportAsImage}
              className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-3xl font-black shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Exportar PNG
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <SectionHeader 
            title="Detalhamento Técnico" 
            section="financial" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
          />
          {expanded.financial && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors animate-in slide-in-from-top-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                      <th className="px-6 py-4">Método</th>
                      <th className="px-6 py-4">Qtd</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-sm">
                    {Object.entries(reportData.totalsByMethod).map(([method, data]) => {
                      const typedData = data as { count: number; total: number };
                      return (
                        <tr key={method} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">{method}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{typedData.count}</td>
                          <td className="px-6 py-4 text-right text-slate-900 dark:text-slate-100 font-black">{formatCurrency(typedData.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SectionHeader 
            title="Saldos Devedores Ativos" 
            section="penduras" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
          />
          {expanded.penduras && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors animate-in slide-in-from-top-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4 text-right">Saldo Total</th>
                      <th className="px-6 py-4 text-right">Receber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-sm">
                    {(Object.entries(reportData.pendurasByCustomer) as [string, number][]).map(([customer, total]) => (
                      <tr key={customer} className="hover:bg-orange-50/30 dark:hover:bg-orange-900/5 transition-colors group">
                        <td className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 uppercase">{customer}</td>
                        <td className="px-6 py-4 text-right text-red-600 font-black">{formatCurrency(total)}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => onQuitarPendura(customer, total)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 shadow-sm"
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {Object.keys(reportData.pendurasByCustomer).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">Nenhum saldo pendente encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
