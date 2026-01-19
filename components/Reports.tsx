
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sale, Product, PaymentMethod, formatCurrency, User, Shift, getBusinessDateStart } from '../types';
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
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
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
    const todayTs = Date.now();
    const todayStart = getBusinessDateStart(todayTs);
    
    let start = todayStart;
    let end = todayStart + 86399999;
    
    if (type === 'ONTEM') { 
      start = todayStart - 86400000;
      end = start + 86399999;
    } else if (type === 'SEMANA') { 
      start = todayStart - (6 * 86400000);
    } else if (type === 'MÊS') { 
      const d = new Date(todayStart);
      start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    }

    setStartDate(new Date(start).toISOString().split('T')[0]);
    setEndDate(new Date(end).toISOString().split('T')[0]);
    setPeriodLabel(type);
    showToast(`FILTRO COMERCIAL ATIVADO: ${type}`);
  };

  const filteredSales = useMemo<Sale[]>(() => {
    const startTs = new Date(`${startDate}T00:00:00`).getTime();
    const endTs = new Date(`${endDate}T23:59:59`).getTime();
    return (sales || []).filter((s: Sale) => s.timestamp >= startTs && s.timestamp <= endTs);
  }, [sales, startDate, endDate]);

  const reportData = useMemo(() => {
    const selectedShift = (shifts || []).find(sh => sh.id === selectedShiftId);
    const shiftSales = (sales || []).filter((s: Sale) => s.shiftId === selectedShiftId);

    // CORREÇÃO: Resumo por método ignora inflação de pendura no faturamento realizado
    const shiftTotalsByMethod = Object.values(PaymentMethod).reduce((acc: Record<string, number>, method) => {
      acc[method] = shiftSales
        .filter((s: Sale) => s.paymentMethod === method)
        .reduce((sum: number, s: Sale) => sum + s.total, 0);
      return acc;
    }, {} as Record<string, number>);

    // Total Efetivo: Dinheiro que entrou de verdade (ignora Pendura, inclui Quitações)
    const shiftTotalRevenue = shiftSales
      .filter(s => s.paymentMethod !== PaymentMethod.PENDURA)
      .reduce((acc: number, s: Sale) => acc + s.total, 0);

    const shiftCategoryStats = shiftSales
      .filter(s => !s.items?.some(i => i.productId === 'quitacao'))
      .flatMap(s => s.items || [])
      .reduce((acc, item) => {
        let catName = (item.category || 'GERAL').toUpperCase().trim();
        acc[catName] = (acc[catName] || 0) + (item.totalPrice || 0);
        return acc;
      }, {} as Record<string, number>);

    const shiftConsumptionTotal = Object.values(shiftCategoryStats).reduce((a: number, b: number) => a + b, 0);

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

    const realizedGrandTotal = filteredSales
      .filter(s => s.paymentMethod !== PaymentMethod.PENDURA)
      .reduce((acc: number, s: Sale) => acc + s.total, 0);
      
    const operationalCount = filteredSales.filter(s => !s.items?.some(i => i.productId === 'quitacao')).length;
    const avgTicket = operationalCount > 0 ? realizedGrandTotal / operationalCount : 0;

    // OTIMIZAÇÃO: Cálculo de Penduras Saldo Real Histórico
    const penduraDebts = (sales || []).reduce((acc: Map<string, number>, s: Sale) => {
      if (!s.customerName) return acc;
      const name = s.customerName.trim().toUpperCase();
      const current = acc.get(name) || 0;
      
      if (s.paymentMethod === PaymentMethod.PENDURA) {
        acc.set(name, current + s.total);
      } else if (s.items?.some(item => item.productId === 'quitacao')) {
        acc.set(name, current - s.total);
      }
      return acc;
    }, new Map<string, number>());

    const activePenduras = Array.from(penduraDebts.entries())
      .filter(([_, amount]) => amount > 0.01)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { 
      totalsByMethod, realizedGrandTotal, avgTicket, activePenduras, selectedShift, shiftSales, shiftTotalsByMethod,
      shiftCategoryStats, shiftTotalRevenue, shiftConsumptionTotal, operationalCount
    };
  }, [filteredSales, sales, shifts, selectedShiftId, products]);

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
          Nenhum dado para o período: {startDate} até {endDate}
        </div>
      );
    }

    switch(activeCategory) {
      case 'FECHAMENTO':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
               <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2">Selecionar Turno para Detalhar</label>
                  <select value={selectedShiftId} onChange={e => setSelectedShiftId(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold uppercase text-xs outline-none">
                    <option value="">Escolha um turno...</option>
                    {shifts.map(s => <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - @{s.openedBy}</option>)}
                  </select>
               </div>
               <button onClick={exportAsImage} disabled={!canExport || !selectedShiftId} className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50">Salvar Cupom (PNG)</button>
            </div>

            {reportData.selectedShift ? (
              <div className="flex justify-center py-10">
                <div ref={reportRef} className="bg-black text-white w-full max-w-[400px] p-10 serrated-top-black serrated-bottom-black shadow-2xl space-y-6 font-mono">
                   <div className="text-center">
                      <h2 className="text-3xl font-black font-barrio leading-none uppercase tracking-tighter">Botequista</h2>
                      <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Comprovante de Fechamento</p>
                   </div>
                   <div className="text-[11px] leading-tight space-y-1 text-slate-400 border-t border-dashed border-slate-800 pt-4">
                      <p>TURNO: {reportData.selectedShift.id.slice(-6).toUpperCase()}</p>
                      <p>OPERADOR: @{reportData.selectedShift.openedBy.toUpperCase()}</p>
                      <p>ABERTURA: {new Date(reportData.selectedShift.startTime).toLocaleString('pt-BR')}</p>
                      {reportData.selectedShift.endTime && <p>FECHAMENTO: {new Date(reportData.selectedShift.endTime).toLocaleString('pt-BR')}</p>}
                   </div>
                   
                   <div className="border-t border-dashed border-slate-800 pt-4 space-y-2">
                      <div className="text-xs font-black uppercase text-center mb-2">RESUMO POR MÉTODO</div>
                      { (Object.entries(reportData.shiftTotalsByMethod) as [string, number][]).map(([method, total]) => (
                         <div key={method} className="flex justify-between text-[11px]">
                            <span className="text-slate-500 uppercase">{method}</span>
                            <span className="font-bold">{formatCurrency(total)}</span>
                         </div>
                      ))}
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-emerald-400">
                         <span>REALIZADO (CAIXA):</span>
                         <span>{formatCurrency(reportData.shiftTotalRevenue)}</span>
                      </div>
                   </div>

                   <div className="border-t border-dashed border-slate-800 pt-4 space-y-4">
                      <div className="text-xs font-black uppercase text-center mb-1">MIX DE VENDAS (CATEGORIAS)</div>
                      <div className="space-y-4">
                         {(Object.entries(reportData.shiftCategoryStats) as [string, number][])
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, val]) => {
                               const percentage = reportData.shiftConsumptionTotal > 0 ? (val / reportData.shiftConsumptionTotal) * 100 : 0;
                               return (
                                  <div key={cat} className="space-y-1.5">
                                     <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="text-slate-200">{cat}</span>
                                        <span className="text-white">{formatCurrency(val)} ({percentage.toFixed(0)}%)</span>
                                     </div>
                                     <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                        <div 
                                           className="h-full bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]" 
                                           style={{ width: `${Math.max(2, percentage)}%` }}
                                        />
                                     </div>
                                  </div>
                               );
                            })
                         }
                      </div>
                   </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      case 'FINANCEIRO':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Recebimentos Totais</h3>
                <div className="space-y-4">
                   {(Object.entries(reportData.totalsByMethod) as [string, { count: number, total: number }][]).map(([method, data]) => (
                     data.total > 0 ? (
                       <div key={method} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                          <span className="text-sm font-bold uppercase text-slate-500">{method}</span>
                          <span className={`font-black ${method === PaymentMethod.PENDURA ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(data.total)}</span>
                       </div>
                     ) : null
                   ))}
                   <div className="pt-4 flex justify-between items-center text-2xl font-black text-emerald-600">
                      <span className="text-[10px] text-slate-400 uppercase">REALIZADO LÍQUIDO</span>
                      <span>{formatCurrency(reportData.realizedGrandTotal)}</span>
                   </div>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 flex flex-col justify-center text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Médio Realizado</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(reportData.avgTicket)}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase">Base: {reportData.operationalCount} comandas</p>
             </div>
          </div>
        );
      case 'PENDURAS':
        return (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-orange-50/30 dark:bg-orange-900/10 flex justify-between items-center">
                <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest">Controle de Fiados Ativos (Saldo Real Histórico)</h3>
             </div>
             <table className="w-full text-left text-xs">
                <thead>
                   <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                      <th className="px-8 py-5">Cliente</th>
                      <th className="px-8 py-5 text-right">Saldo Devedor</th>
                      <th className="px-8 py-5 text-right">Ação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                   {reportData.activePenduras.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                         <td className="px-8 py-5 font-black text-slate-800 dark:text-white uppercase">{p.name}</td>
                         <td className="px-8 py-5 text-right font-black text-red-500">{formatCurrency(p.amount)}</td>
                         <td className="px-8 py-5 text-right">
                            <button onClick={() => { onQuitarPendura(p.name, p.amount); showToast(`QUITANDO PENDURA DE ${p.name}`); }} disabled={!canSettle} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase disabled:opacity-50">Receber / Quitar</button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 relative">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4">
           {toast}
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Período do Relatório</p>
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {(['HOJE', 'ONTEM', 'SEMANA', 'MÊS'] as const).map(type => (
            <button 
              key={type} 
              onClick={() => setPreset(type)} 
              className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${periodLabel === type ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
        <div className="flex flex-wrap justify-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {(['FECHAMENTO', 'FINANCEIRO', 'PENDURAS', 'EQUIPE', 'OPERACIONAL', 'PRODUTOS'] as ReportCategory[]).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{cat}</button>
          ))}
        </div>
      </div>
      
      <div className="min-h-[500px] animate-in fade-in duration-500">{renderActiveReport()}</div>
    </div>
  );
};

export default Reports;
