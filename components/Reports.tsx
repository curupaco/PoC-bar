
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sale, Product, PaymentMethod, formatCurrency, User, Shift, getBusinessDateStart } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as htmlToImage from 'html-to-image';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  users: User[];
  shifts: Shift[];
  currentUser: User;
  onQuitarPendura: (customerName: string, amount: number) => void;
}

type ReportCategory = 'FECHAMENTO' | 'FINANCEIRO' | 'PENDURAS' | 'EQUIPE' | 'OPERACIONAL' | 'PRODUTOS';

const Reports: React.FC<ReportsProps> = ({ sales = [], products = [], users = [], shifts = [], currentUser, onQuitarPendura }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('FECHAMENTO');
  const [toast, setToast] = useState<string | null>(null);
  
  // FIX: toLocaleDateString('en-CA') garante YYYY-MM-DD no fuso local do navegador.
  const [startDate, setStartDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [periodLabel, setPeriodLabel] = useState('HOJE');

  const [selectedShiftId, setSelectedShiftId] = useState<string>('');

  useEffect(() => {
    if (!selectedShiftId && shifts && shifts.length > 0) {
      setSelectedShiftId(shifts[0].id);
    }
  }, [shifts, selectedShiftId]);

  const canExport = currentUser.username === 'admin' || currentUser.permissions.includes('export_report');
  const canSettle = currentUser.username === 'admin' || currentUser.permissions.includes('clear_fiado');

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const setPreset = (type: 'HOJE' | 'ONTEM' | 'SEMANA' | 'MÊS') => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (type === 'ONTEM') { 
      start.setDate(now.getDate() - 1); 
      end.setDate(now.getDate() - 1); 
    }
    else if (type === 'SEMANA') { 
      start.setDate(now.getDate() - now.getDay()); 
    }
    else if (type === 'MÊS') { 
      start = new Date(now.getFullYear(), now.getMonth(), 1); 
    }

    setStartDate(start.toLocaleDateString('en-CA'));
    setEndDate(end.toLocaleDateString('en-CA'));
    setPeriodLabel(type);
    showToast(`FILTRO APLICADO: ${type}`);
  };

  const filteredSales = useMemo<Sale[]>(() => {
    // startTs em 00:00:00 e endTs em 23:59:59 do dia local selecionado
    const startTs = new Date(`${startDate}T00:00:00`).getTime();
    const endTs = new Date(`${endDate}T23:59:59`).getTime();
    return (sales || []).filter((s: Sale) => s.timestamp >= startTs && s.timestamp <= endTs);
  }, [sales, startDate, endDate]);

  const reportData = useMemo(() => {
    const selectedShift = (shifts || []).find(sh => sh.id === selectedShiftId);
    const shiftSales = (sales || []).filter((s: Sale) => s.shiftId === selectedShiftId);

    // Totais por Método (Turno Selecionado)
    const shiftTotalsByMethod = Object.values(PaymentMethod).reduce((acc: Record<string, number>, method) => {
      acc[method] = shiftSales.filter((s: Sale) => s.paymentMethod === method).reduce((sum: number, s: Sale) => sum + s.total, 0);
      return acc;
    }, {} as Record<string, number>);

    // Totais por Método (Período Filtrado)
    const totalsByMethod = Object.values(PaymentMethod).reduce((acc: Record<string, { count: number, total: number }>, method) => {
      acc[method] = { count: 0, total: 0 };
      return acc;
    }, {} as Record<string, { count: number, total: number }>);

    filteredSales.forEach((sale: Sale) => {
      if (totalsByMethod[sale.paymentMethod]) {
        totalsByMethod[sale.paymentMethod].count += 1;
        totalsByMethod[sale.paymentMethod].total += sale.total;
      }
    });

    const grandTotal = filteredSales.filter(s => s.paymentMethod !== PaymentMethod.PENDURA).reduce((acc: number, s: Sale) => acc + s.total, 0);
    const operationalCount = filteredSales.filter(s => !s.items?.some(i => i.productId === 'quitacao')).length;
    const avgTicket = operationalCount > 0 ? grandTotal / operationalCount : 0;

    // Performance de Equipe (Período Filtrado)
    const teamStats = (users || []).map(u => {
      const uSales = filteredSales.filter((s: Sale) => s.userId === u.id);
      return {
        name: u.displayName,
        count: uSales.length,
        total: uSales.reduce((acc: number, s: Sale) => acc + s.total, 0)
      };
    }).sort((a, b) => b.total - a.total);

    // Mix de Produtos (Período Filtrado)
    const productStats = filteredSales.flatMap((s: Sale) => s.items || []).reduce((acc: Record<string, { name: string, qty: number, total: number }>, item) => {
      if (!acc[item.productName]) acc[item.productName] = { name: item.productName, qty: 0, total: 0 };
      acc[item.productName].qty += item.quantity;
      acc[item.productName].total += item.totalPrice;
      return acc;
    }, {} as Record<string, { name: string, qty: number, total: number }>);

    const topProducts = (Object.values(productStats) as { name: string, qty: number, total: number }[]).sort((a, b) => b.total - a.total);

    // Operacional / Fluxo Horário (Período Filtrado)
    const hourlyStats = Array.from({ length: 24 }).map((_, i) => ({ hour: `${i}h`, count: 0 }));
    filteredSales.forEach((s: Sale) => {
      const h = new Date(s.timestamp).getHours();
      hourlyStats[h].count += 1;
    });

    // Gestão de Penduras (Saldo Real Histórico)
    const penduraDebts = (sales || []).reduce((acc: Record<string, number>, s: Sale) => {
      if (!s.customerName) return acc;
      const name = s.customerName.trim().toUpperCase();
      if (s.paymentMethod === PaymentMethod.PENDURA) {
        acc[name] = (acc[name] || 0) + s.total;
      }
      if (s.items?.some(item => item.productId === 'quitacao')) {
        acc[name] = (acc[name] || 0) - s.total;
      }
      return acc;
    }, {} as Record<string, number>);

    const activePenduras = (Object.entries(penduraDebts) as [string, number][])
      .filter(([_, amount]) => amount > 0.05)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { 
      totalsByMethod, grandTotal, avgTicket, activePenduras, selectedShift, shiftTotalsByMethod,
      teamStats, topProducts, hourlyStats, operationalCount
    };
  }, [filteredSales, sales, shifts, selectedShiftId, users, products]);

  const exportAsImage = () => {
    if (!canExport || !reportRef.current) return;
    showToast("GERANDO CUPOM...");
    htmlToImage.toPng(reportRef.current, { backgroundColor: '#000000', pixelRatio: 2 })
    .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `fechamento-turno-${selectedShiftId.slice(-6)}.png`;
        link.href = dataUrl;
        link.click();
        showToast("CUPOM SALVO COM SUCESSO!");
    });
  };

  const renderActiveReport = () => {
    if (filteredSales.length === 0 && activeCategory !== 'PENDURAS' && activeCategory !== 'FECHAMENTO') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] animate-in fade-in">
          Nenhum dado para o período: {startDate.split('-').reverse().join('/')}
        </div>
      );
    }

    switch(activeCategory) {
      case 'FECHAMENTO':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
               <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2">Seletor de Turno</label>
                  <select value={selectedShiftId} onChange={e => setSelectedShiftId(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold uppercase text-xs outline-none">
                    <option value="">Escolha um turno...</option>
                    {shifts.map(s => <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - @{s.openedBy}</option>)}
                  </select>
               </div>
               <button onClick={exportAsImage} disabled={!canExport || !selectedShiftId} className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all">Salvar Cupom (PNG)</button>
            </div>

            {reportData.selectedShift ? (
              <div className="flex justify-center py-10">
                <div ref={reportRef} className="bg-black text-white w-full max-w-[400px] p-10 shadow-2xl space-y-6 font-mono text-xs">
                   <div className="text-center">
                      <h2 className="text-3xl font-black italic uppercase italic">Botequista</h2>
                      <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Protocolo de Fechamento</p>
                   </div>
                   <div className="text-[10px] leading-tight space-y-1 text-slate-400 border-t border-dashed border-slate-800 pt-4">
                      <p>TURNO: {reportData.selectedShift.id.slice(-8).toUpperCase()}</p>
                      <p>OPERADOR: @{reportData.selectedShift.openedBy.toUpperCase()}</p>
                      <p>ABERTURA: {new Date(reportData.selectedShift.startTime).toLocaleString('pt-BR')}</p>
                      {reportData.selectedShift.endTime && <p>FECHAMENTO: {new Date(reportData.selectedShift.endTime).toLocaleString('pt-BR')}</p>}
                   </div>
                   <div className="border-t border-dashed border-slate-800 pt-4 space-y-2">
                      <div className="text-[10px] font-black uppercase text-center mb-2">RESUMO FINANCEIRO</div>
                      { (Object.entries(reportData.shiftTotalsByMethod) as [string, number][]).map(([method, total]) => (
                         <div key={method} className="flex justify-between text-[11px]">
                            <span className="text-slate-500 uppercase">{method}</span>
                            <span className="font-bold">{formatCurrency(total)}</span>
                         </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center opacity-30 italic font-black uppercase text-[10px]">Aguardando seleção de turno...</div>
            )}
          </div>
        );
      case 'FINANCEIRO':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-200 dark:border-slate-800">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Fluxo por Pagamento</h3>
                <div className="space-y-4">
                   {(Object.entries(reportData.totalsByMethod) as [string, { count: number, total: number }][]).map(([method, data]) => (
                     data.total > 0 ? (
                       <div key={method} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                          <span className="text-sm font-bold uppercase text-slate-500">{method}</span>
                          <span className="font-black text-slate-900 dark:text-white">{formatCurrency(data.total)}</span>
                       </div>
                     ) : null
                   ))}
                   <div className="pt-6 flex justify-between items-center text-3xl font-black text-emerald-600 tracking-tighter italic">
                      <span className="text-[10px] text-slate-400 uppercase">Faturamento Realizado</span>
                      <span>{formatCurrency(reportData.grandTotal)}</span>
                   </div>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-200 dark:border-slate-800 flex flex-col justify-center text-center space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ticket Médio (Vendas)</p>
                <p className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter italic">{formatCurrency(reportData.avgTicket)}</p>
                <div className="h-px bg-slate-100 dark:bg-slate-800 w-1/3 mx-auto"></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase italic opacity-50">Base: {reportData.operationalCount} registros</p>
             </div>
          </div>
        );
      case 'PENDURAS':
        return (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-orange-50/30 dark:bg-orange-900/10 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic">Carteira Global de Devedores</h3>
             </div>
             <table className="w-full text-left text-xs">
                <thead>
                   <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[10px]">
                      <th className="px-10 py-6">Cliente / Conta</th>
                      <th className="px-10 py-6 text-right">Saldo Devedor</th>
                      <th className="px-10 py-6 text-right">Ação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                   {reportData.activePenduras.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                         <td className="px-10 py-6 font-black text-slate-800 dark:text-white uppercase">{p.name}</td>
                         <td className="px-10 py-6 text-right font-black text-red-600">{formatCurrency(p.amount)}</td>
                         <td className="px-10 py-6 text-right">
                            <button onClick={() => onQuitarPendura(p.name, p.amount)} disabled={!canSettle} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all">Quitar</button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        );
      case 'EQUIPE':
        return (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-900/10">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Performance por Operador</h3>
             </div>
             <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[10px]">
                    <th className="px-10 py-6">Colaborador</th>
                    <th className="px-10 py-6 text-center">Atendimentos</th>
                    <th className="px-10 py-6 text-right">Faturamento Gerado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {reportData.teamStats.map((u, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-10 py-6 font-black text-slate-800 dark:text-white uppercase">@{u.name}</td>
                      <td className="px-10 py-6 text-center font-bold text-slate-500">{u.count} vendas</td>
                      <td className="px-10 py-6 text-right font-black text-blue-600">{formatCurrency(u.total)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        );
      case 'PRODUTOS':
        return (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-900/10">
                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Ranking Financeiro de Produtos</h3>
             </div>
             <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[10px]">
                    <th className="px-10 py-6">Item do Cardápio</th>
                    <th className="px-10 py-6 text-center">Volume</th>
                    <th className="px-10 py-6 text-right">Faturamento Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {reportData.topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-10 py-6 font-black text-slate-800 dark:text-white uppercase">{p.name}</td>
                      <td className="px-10 py-6 text-center font-bold text-slate-500">{p.qty.toFixed(0)}x</td>
                      <td className="px-10 py-6 text-right font-black text-emerald-600">{formatCurrency(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        );
      case 'OPERACIONAL':
        const peakHour = reportData.hourlyStats.reduce((prev, current) => (prev.count > current.count) ? prev : current);
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 italic text-center">Fluxo Horário (Volume de Vendas)</h3>
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.hourlyStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} />
                      <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '900'}} />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                        {reportData.hourlyStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.count === peakHour.count ? '#ef4444' : '#e2e8f0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center space-y-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Pico de Movimento</p>
              <p className="text-8xl font-black text-red-600 tracking-tighter italic">{peakHour.hour}</p>
              <div className="h-px bg-slate-100 dark:bg-slate-800 mx-auto w-1/2"></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">Base de {reportData.operationalCount} atendimentos</p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 relative">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4">
           {toast}
        </div>
      )}

      {/* FILTROS DE PERÍODO */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
          {(['HOJE', 'ONTEM', 'SEMANA', 'MÊS'] as const).map(type => (
            <button key={type} onClick={() => setPreset(type)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${periodLabel === type ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{type}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 italic">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Intervalo: {startDate.split('-').reverse().join('/')} até {endDate.split('-').reverse().join('/')}
        </div>
      </div>

      {/* SELETOR DE CATEGORIA */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
        <div className="flex flex-wrap justify-center bg-white dark:bg-slate-900 p-2 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm gap-1">
          {(['FECHAMENTO', 'FINANCEIRO', 'PENDURAS', 'EQUIPE', 'OPERACIONAL', 'PRODUTOS'] as ReportCategory[]).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-red-500'}`}>{cat}</button>
          ))}
        </div>
      </div>
      
      {/* RENDERIZAÇÃO ATIVA */}
      <div className="min-h-[500px] animate-in fade-in duration-700">{renderActiveReport()}</div>
    </div>
  );
};

export default Reports;
