
import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Product, PaymentMethod, User, Shift, Theme, formatDateToISO } from '../types';
import { getFirebaseToken } from '../services/firebaseService'; // Import necessário para Issue 1
import ClosingReport from './reports/ClosingReport';
import FinancialReport from './reports/FinancialReport';
import PenduraReport from './reports/PenduraReport';
import TeamReport from './reports/TeamReport';
import ProductReport from './reports/ProductReport';
import OperationalReport from './reports/OperationalReport';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  users: User[];
  shifts: Shift[];
  currentUser: User;
  onQuitarPendura: (customerName: string, amount: number) => void;
  theme?: Theme;
  penduraThreshold?: number;
  activeUnitId?: string | null;
  syncConfig?: { url: string; key: string; email: string; pass: string }; // Config recebida do App
}

type ReportCategory = 'FECHAMENTO' | 'FINANCEIRO' | 'PENDURAS' | 'EQUIPE' | 'OPERACIONAL' | 'PRODUTOS';

const Reports: React.FC<ReportsProps> = ({ sales = [], products = [], users = [], shifts = [], currentUser, onQuitarPendura, theme, penduraThreshold = 500, activeUnitId, syncConfig }) => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('FECHAMENTO');
  const [toast, setToast] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState(() => formatDateToISO(new Date()));
  const [endDate, setEndDate] = useState(() => formatDateToISO(new Date()));
  const [periodLabel, setPeriodLabel] = useState('HOJE');

  const [selectedShiftId, setSelectedShiftId] = useState<string>('');

  const [cloudSales, setCloudSales] = useState<Sale[] | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // FIX ISSUE 1 & 3: Busca segura com Headers e Filtro de Data
  useEffect(() => {
     const fetchCloudHistory = async () => {
        if (!activeUnitId || !syncConfig) return;
        
        setIsLoadingCloud(true);
        try {
           // Obtém token atualizado
           const token = await getFirebaseToken(syncConfig.email, syncConfig.pass, syncConfig.key);
           
           // LÓGICA DE CORREÇÃO DE PENDURAS:
           // Se estiver na aba PENDURAS, ignoramos o filtro visual de data e buscamos 6 meses para trás.
           // Isso garante que dívidas antigas sejam computadas no saldo.
           let queryStartDate = startDate;
           let queryEndDate = endDate;

           if (activeCategory === 'PENDURAS') {
              const d = new Date();
              d.setMonth(d.getMonth() - 6); // Retrocede 6 meses
              queryStartDate = formatDateToISO(d);
              queryEndDate = formatDateToISO(new Date()); // Até hoje
           }

           // Envia headers seguros e datas para a Cloud Function (Issue 1 & 3)
           const res = await fetch(`/api/reports?unitId=${activeUnitId}&startDate=${queryStartDate}&endDate=${queryEndDate}`, {
              headers: {
                 'x-fb-url': syncConfig.url,
                 'x-fb-token': token || ''
              }
           });

           if (res.ok) {
              const data = await res.json();
              if (data.fullHistory) {
                 setCloudSales(data.fullHistory);
              }
           } else {
              console.warn("Cloud Report: Status", res.status);
           }
        } catch (e) {
           console.log("Cloud report fetch failed, using local cache.", e);
        } finally {
           setIsLoadingCloud(false);
        }
     };

     // CORREÇÃO ITEM 2: Adicionada categoria 'FECHAMENTO' para garantir que relatórios de turno carreguem vendas antigas
     // CORREÇÃO PENDURAS: Adicionado 'PENDURAS' para disparar o fetch estendido
     if (periodLabel === 'MÊS' || periodLabel === 'ANO' || activeCategory === 'FINANCEIRO' || activeCategory === 'FECHAMENTO' || activeCategory === 'PENDURAS') {
         fetchCloudHistory();
     }
  }, [activeUnitId, periodLabel, startDate, endDate, activeCategory, syncConfig]);

  // Restante do componente mantido, apenas usando cloudSales se disponível
  const activeDataSource = cloudSales || sales;
  
  useEffect(() => {
    if (!selectedShiftId && shifts && shifts.length > 0) {
      setSelectedShiftId(shifts[0].id);
    }
  }, [shifts, selectedShiftId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

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
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Fim do mês
    }

    setStartDate(formatDateToISO(start));
    setEndDate(formatDateToISO(end));
    setPeriodLabel(type);
    showToast(`FILTRO: ${type}`);
  };

  const filteredSales = useMemo<Sale[]>(() => {
    // Se temos cloudSales, elas já vieram filtradas do backend pelo range de datas (Issue 3)
    // Então só precisamos filtrar localmente se estivermos usando dados locais ou para garantir precisão de hora
    const safeParse = (dateStr: string, hour: number, min: number, sec: number) => {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day, hour, min, sec).getTime();
    };

    const startTs = safeParse(startDate, 0, 0, 0);
    const endTs = safeParse(endDate, 23, 59, 59);
    
    return (activeDataSource || []).filter((s: Sale) => {
      if (s.deleted) return false;
      return s.timestamp >= startTs && s.timestamp <= endTs;
    });
  }, [activeDataSource, startDate, endDate]);

  const reportData = useMemo(() => {
    const selectedShift = (shifts || []).find(sh => sh.id === selectedShiftId);
    const shiftSales = (activeDataSource || []).filter((s: Sale) => s.shiftId === selectedShiftId && !s.deleted);

    const totalsByMethod = Object.values(PaymentMethod).reduce((acc: Record<string, { count: number, total: number }>, method) => {
      acc[method] = { count: 0, total: 0 };
      return acc;
    }, {} as Record<string, { count: number, total: number }>);

    filteredSales.forEach((sale: Sale) => {
      if (sale.payments) {
        sale.payments.forEach(p => {
           if (totalsByMethod[p.method]) {
             totalsByMethod[p.method].total += p.amount;
             totalsByMethod[p.method].count += 1; 
           }
        });
      } else if (totalsByMethod[sale.paymentMethod]) {
        totalsByMethod[sale.paymentMethod].count += 1;
        totalsByMethod[sale.paymentMethod].total += sale.total;
      }
    });

    const grandTotal = Object.values(totalsByMethod)
      .filter((_, idx) => Object.keys(totalsByMethod)[idx] !== PaymentMethod.PENDURA)
      .reduce((acc, curr) => acc + curr.total, 0);

    const operationalCount = filteredSales.filter(s => !s.items?.some(i => i.productId === 'quitacao')).length;
    const avgTicket = operationalCount > 0 ? grandTotal / operationalCount : 0;

    const shiftTotalsByMethod = Object.values(PaymentMethod).reduce((acc: Record<string, number>, method) => {
      acc[method] = 0;
      return acc;
    }, {} as Record<string, number>);

    shiftSales.forEach((s: Sale) => {
       if (s.payments) {
          s.payments.forEach(p => {
             if (shiftTotalsByMethod[p.method] !== undefined) {
                shiftTotalsByMethod[p.method] += p.amount;
             }
          });
       } else if (shiftTotalsByMethod[s.paymentMethod] !== undefined) {
          shiftTotalsByMethod[s.paymentMethod] += s.total;
       }
    });

    const shiftTotalRevenue = Object.entries(shiftTotalsByMethod)
       .filter(([method]) => method !== PaymentMethod.PENDURA)
       .reduce((acc, [_, total]) => acc + total, 0);

    const teamStats = (users || []).map(u => {
      const uSales = filteredSales.filter((s: Sale) => s.userId === u.id);
      return {
        name: u.displayName,
        count: uSales.length,
        total: uSales.reduce((acc: number, s: Sale) => acc + s.total, 0)
      };
    }).filter(u => u.count > 0 || u.total > 0).sort((a, b) => b.total - a.total);

    const productStats = filteredSales.flatMap((s: Sale) => s.items || [])
      .filter(item => item.productId !== 'quitacao')
      .reduce((acc: Record<string, { name: string, qty: number, total: number }>, item) => {
      if (!acc[item.productName]) acc[item.productName] = { name: item.productName, qty: 0, total: 0 };
      acc[item.productName].qty += item.quantity;
      acc[item.productName].total += item.totalPrice;
      return acc;
    }, {} as Record<string, { name: string, qty: number, total: number }>);

    const topProducts = (Object.values(productStats) as { name: string, qty: number, total: number }[]).sort((a, b) => b.total - a.total);

    const hourlyMap = Array.from({ length: 24 }).map((_, i) => ({ hour: `${i}h`, count: 0 }));
    filteredSales.forEach((s: Sale) => {
      const h = new Date(s.timestamp).getHours();
      hourlyMap[h].count += 1;
    });

    const penduraDebts = (activeDataSource || []).reduce((acc: Record<string, number>, s: Sale) => {
      if (s.deleted) return acc;
      if (!s.customerName) return acc;
      const name = s.customerName.trim().toUpperCase();
      
      let debtAmount = 0;
      if (s.payments) {
         const penduraPart = s.payments.find(p => p.method === PaymentMethod.PENDURA);
         if (penduraPart) debtAmount = penduraPart.amount;
      } else if (s.paymentMethod === PaymentMethod.PENDURA) {
         debtAmount = s.total;
      }

      if (debtAmount > 0) acc[name] = (acc[name] || 0) + debtAmount;
      if (s.items?.some(item => item.productId === 'quitacao')) acc[name] = (acc[name] || 0) - s.total;
      
      return acc;
    }, {} as Record<string, number>);

    const activePenduras = (Object.entries(penduraDebts) as [string, number][])
      .filter(([_, amount]) => amount > 0.05)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { 
      totalsByMethod, grandTotal, avgTicket, activePenduras, selectedShift, shiftTotalsByMethod, shiftTotalRevenue,
      teamStats, topProducts, hourlyMap, operationalCount, activeDataSource
    };
  }, [filteredSales, activeDataSource, shifts, selectedShiftId, users, products]);

  const totalPenduraDebt = useMemo(() => {
    return reportData.activePenduras.reduce((sum: number, p: any) => sum + p.amount, 0);
  }, [reportData.activePenduras]);

  const renderActiveReport = () => {
    if (isLoadingCloud) {
       return (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Calculando números na nuvem...</p>
          </div>
       );
    }

    if (filteredSales.length === 0 && activeCategory !== 'PENDURAS' && activeCategory !== 'FECHAMENTO') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-black uppercase tracking-[0.3em] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] animate-in fade-in italic">
          <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} /></svg>
          Sem registros para {startDate.split('-').reverse().join('/')}
        </div>
      );
    }

    switch(activeCategory) {
      case 'FECHAMENTO': return <ClosingReport shifts={shifts} selectedShiftId={selectedShiftId} setSelectedShiftId={setSelectedShiftId} reportData={reportData} canExport={canExport} showToast={showToast} theme={theme} />;
      case 'FINANCEIRO': return <FinancialReport reportData={reportData} />;
      case 'PENDURAS': return <PenduraReport reportData={reportData} onQuitarPendura={onQuitarPendura} canSettle={canSettle} />;
      case 'EQUIPE': return <TeamReport reportData={reportData} />;
      case 'PRODUTOS': return <ProductReport reportData={reportData} />;
      case 'OPERACIONAL': return <OperationalReport reportData={reportData} theme={theme} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 relative">
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4">{toast}</div>}

      <div className="flex flex-col items-center gap-6">
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
          {(['HOJE', 'ONTEM', 'SEMANA', 'MÊS'] as const).map(type => (
            <button key={type} onClick={() => setPreset(type)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${periodLabel === type ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{type}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 italic">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Intervalo: {startDate.split('-').reverse().join('/')} até {endDate.split('-').reverse().join('/')}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
        <div className="flex flex-wrap justify-center bg-white dark:bg-slate-900 p-2 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm gap-1">
          {(['FECHAMENTO', 'FINANCEIRO', 'PENDURAS', 'EQUIPE', 'OPERACIONAL', 'PRODUTOS'] as ReportCategory[]).map(cat => {
            const isAlert = cat === 'PENDURAS' && totalPenduraDebt > penduraThreshold;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeCategory === cat ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : isAlert ? 'bg-orange-50 text-orange-600 border border-orange-200 animate-pulse' : 'text-slate-500 hover:text-red-500'}`}>
                {isAlert && <span>⚠️</span>} {cat}
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-[500px]">{renderActiveReport()}</div>
    </div>
  );
};

export default Reports;
