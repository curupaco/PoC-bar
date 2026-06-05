import React, { useState, useMemo } from 'react';
import { Product, Sale, StockTransaction, AuditLog, Shift, User, Tab, formatCurrency, parseCurrencyValue, sanitizeCurrencyInput } from '../../types';

interface OwnerAssistantProps {
  products: Product[];
  sales: Sale[];
  stockTransactions: StockTransaction[];
  auditLogs: AuditLog[];
  shifts: Shift[];
  users: User[];
  handleUpdateProducts: (updater: any) => Promise<void>;
  activeUnitId: string | null;
  openTabs: Tab[];
}

type BCGQuadrant = 'estrela' | 'vaca_leiteira' | 'quebra_cabeca' | 'abacaxi';

export const OwnerAssistant: React.FC<OwnerAssistantProps> = ({
  products = [],
  sales = [],
  stockTransactions = [],
  auditLogs = [],
  shifts = [],
  users = [],
  handleUpdateProducts,
  activeUnitId,
  openTabs = []
}) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<BCGQuadrant | null>(null);
  const [editingCosts, setEditingCosts] = useState<Record<string, string>>({});
  const [isSavingCosts, setIsSavingCosts] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estados do Precificador
  const [simulatedCost, setSimulatedCost] = useState('');
  const [simulatedCategory, setSimulatedCategory] = useState('');

  // Helpers de Mensagem Rápida (Toast)
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeSales = useMemo(() => sales.filter(s => !s.deleted), [sales]);

  // ----------------------------------------------------
  // 1. CÁLCULOS E PAINEL DE RESUMO FINANCEIRO
  // ----------------------------------------------------
  const financialStats = useMemo(() => {
    const totalRevenue = activeSales.reduce((sum, s) => sum + s.total, 0);
    const totalServiceTax = activeSales.reduce((sum, s) => sum + (s.serviceTax || 0), 0);
    const consumedRevenue = Math.max(0, totalRevenue - totalServiceTax);

    const totalCMV = activeSales.reduce((sum, s) => {
      const saleCMV = (s.items || []).reduce((itemSum, item) => {
        if (item.productId === 'quitacao' || item.productId === '_debt_settlement') return itemSum;
        const product = products.find(p => p.id === item.productId);
        const cost = item.costPrice !== undefined ? item.costPrice : (product?.lastCostPrice || 0);
        return itemSum + (cost * item.quantity);
      }, 0);
      return sum + saleCMV;
    }, 0);

    const grossProfit = Math.max(0, consumedRevenue - totalCMV);
    const consolidatedMargin = consumedRevenue > 0 ? (grossProfit / consumedRevenue) * 100 : 0;

    return {
      consumedRevenue,
      totalCMV,
      grossProfit,
      consolidatedMargin
    };
  }, [activeSales, products]);

  // ----------------------------------------------------
  // 2. MATRIZ BCG DO CARDÁPIO (Cálculos de Giro e Margem)
  // ----------------------------------------------------
  const thirtyDaysAgo = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);
  
  // Volume vendido (últimos 30 dias)
  const productVolume = useMemo(() => {
    const volumeMap: Record<string, number> = {};
    activeSales.forEach(s => {
      if (s.timestamp >= thirtyDaysAgo) {
        (s.items || []).forEach(item => {
          if (item.productId === 'quitacao' || item.productId === '_debt_settlement') return;
          volumeMap[item.productId] = (volumeMap[item.productId] || 0) + item.quantity;
        });
      }
    });
    return volumeMap;
  }, [activeSales, thirtyDaysAgo]);

  // Mediana de Giro (Volume) de produtos com controle de estoque ativo
  const medianGiro = useMemo(() => {
    const volumes = products
      .filter(p => p.trackStock !== false)
      .map(p => productVolume[p.id] || 0)
      .sort((a, b) => a - b);

    if (volumes.length === 0) return 0;
    const mid = Math.floor(volumes.length / 2);
    return volumes.length % 2 !== 0 ? volumes[mid] : (volumes[mid - 1] + volumes[mid]) / 2;
  }, [products, productVolume]);

  // Média de Margem de todos os produtos com custo cadastrado
  const averageMargin = useMemo(() => {
    const margins = products
      .filter(p => p.price > 0 && p.lastCostPrice !== undefined && p.lastCostPrice > 0)
      .map(p => ((p.price - p.lastCostPrice) / p.price) * 100);

    if (margins.length === 0) return 0;
    return margins.reduce((acc, m) => acc + m, 0) / margins.length;
  }, [products]);

  // Categorização BCG
  const bcgProducts = useMemo(() => {
    const categories: Record<BCGQuadrant, Product[]> = {
      estrela: [],
      vaca_leiteira: [],
      quebra_cabeca: [],
      abacaxi: []
    };

    products.forEach(p => {
      // Exclui produtos sem preço de custo cadastrado ou sem controle de estoque
      if (p.trackStock === false || !p.lastCostPrice || p.lastCostPrice <= 0 || p.price <= 0) return;

      const giro = productVolume[p.id] || 0;
      const margin = ((p.price - p.lastCostPrice) / p.price) * 100;

      const isHighGiro = giro >= medianGiro;
      const isHighMargin = margin >= averageMargin;

      if (isHighGiro && isHighMargin) {
        categories.estrela.push(p);
      } else if (isHighGiro && !isHighMargin) {
        categories.vaca_leiteira.push(p);
      } else if (!isHighGiro && isHighMargin) {
        categories.quebra_cabeca.push(p);
      } else {
        categories.abacaxi.push(p);
      }
    });

    return categories;
  }, [products, productVolume, medianGiro, averageMargin]);

  // Lista de produtos pendentes de cadastro de preço de custo
  const pendingCostProducts = useMemo(() => {
    return products.filter(p => p.trackStock !== false && p.price > 0 && (!p.lastCostPrice || p.lastCostPrice <= 0));
  }, [products]);

  // Lógica para salvar custos em lote
  const handleSavePendingCosts = async () => {
    setIsSavingCosts(true);
    try {
      await handleUpdateProducts((prevProducts: Product[]) => {
        return prevProducts.map(p => {
          const newCostInput = editingCosts[p.id];
          if (newCostInput !== undefined && newCostInput !== '') {
            return { ...p, lastCostPrice: parseCurrencyValue(newCostInput) };
          }
          return p;
        });
      });
      setEditingCosts({});
      showToast("CUSTOS ATUALIZADOS COM SUCESSO! 💸");
    } catch (e) {
      showToast("ERRO AO SALVAR CUSTOS");
    } finally {
      setIsSavingCosts(false);
    }
  };

  // Estratégias Comerciais Sugeridas
  const quadrantInfo = {
    estrela: {
      title: '⭐ Estrelas (Campeões)',
      desc: 'Alta margem e alto giro de vendas. Estes itens trazem receita e lucro bruto consistentes ao bar.',
      action: 'Mantenha estes produtos no topo do cardápio visual e físico. Garanta a padronização e qualidade, e evite alterar sua receita. Use-os como carro-chefe nas promoções de atração.'
    },
    vaca_leiteira: {
      title: '🐄 Vacas Leiteiras (Giro Alto / Margem Baixa)',
      desc: 'Alto giro de vendas mas margem abaixo da média. Costumam ser cervejas comerciais ou marcas famosas.',
      action: 'Tente reajustar o preço de venda de forma sutil (+5% a +10%). Faça pacotes ou combos associando estes itens populares a petiscos ou sobremesas de alta margem (Estrelas ou Quebra-Cabeças) para elevar o ticket médio lucrativo.'
    },
    quebra_cabeca: {
      title: '🧩 Quebra-Cabeças (Giro Baixo / Margem Alta)',
      desc: 'Margem excelente mas volume de vendas tímido. Drinks autorais ou petiscos gourmet costumam cair aqui.',
      action: 'Ofereça comissão/premiação rápida à equipe de garçons por vendas extras deste produto. Promova-o na lousa do bar, posicione no meio do menu físico e dê desconto exclusivo no Happy Hour para impulsionar a primeira compra.'
    },
    abacaxi: {
      title: '🍍 Abacaxis (Giro Baixo / Margem Baixa)',
      desc: 'Baixa margem e pouca saída. Consomem capital parado no estoque sem trazer retorno financeiro.',
      action: 'Negocie melhor a compra ou reavalie a composição técnica do item para reduzir custos. Caso persista, aumente a margem de forma agressiva ou elimine-o definitivamente do menu para simplificar o controle de compras.'
    }
  };

  // ----------------------------------------------------
  // 3. PRECIFICADOR INTELIGENTE (Simulador de Margem Alvo)
  // ----------------------------------------------------
  const availableCategories = useMemo(() => {
    const cats = products.map(p => p.category.toUpperCase().trim());
    return Array.from(new Set(cats)).sort();
  }, [products]);

  const simulatedCategoryStats = useMemo(() => {
    if (!simulatedCategory) return { avgMargin: 0, count: 0 };
    const catProducts = products.filter(p => p.category.toUpperCase().trim() === simulatedCategory.toUpperCase().trim());
    const margins = catProducts
      .filter(p => p.price > 0 && p.lastCostPrice !== undefined && p.lastCostPrice > 0)
      .map(p => ((p.price - p.lastCostPrice) / p.price) * 100);

    const avgMargin = margins.length > 0 ? margins.reduce((acc, m) => acc + m, 0) / margins.length : 0;
    return { avgMargin, count: catProducts.length };
  }, [products, simulatedCategory]);

  const simulatedPricingResults = useMemo(() => {
    const cost = parseCurrencyValue(simulatedCost);
    if (cost <= 0) return null;

    const calculatePrice = (marginPercent: number) => {
      const price = cost / (1 - marginPercent / 100);
      const profit = price - cost;
      return { price, profit };
    };

    return {
      margin50: calculatePrice(50),
      margin60: calculatePrice(60),
      margin70: calculatePrice(70)
    };
  }, [simulatedCost]);

  // ----------------------------------------------------
  // 4. RANKING DE UPSELL DA EQUIPE
  // ----------------------------------------------------
  const waiterUpsellRanking = useMemo(() => {
    // Mapeia produtos que são de alta margem (Estrelas ou Quebra-Cabeças)
    const highMarginProducts = new Set<string>();
    products.forEach(p => {
      if (p.price > 0 && p.lastCostPrice && p.lastCostPrice > 0) {
        const giro = productVolume[p.id] || 0;
        const margin = ((p.price - p.lastCostPrice) / p.price) * 100;
        const isHighMargin = margin >= averageMargin;
        if (isHighMargin) {
          highMarginProducts.add(p.id);
        }
      }
    });

    const userSalesMap: Record<string, { totalItems: number; highMarginItems: number; totalSoldBRL: number }> = {};

    activeSales.forEach(s => {
      const userId = s.userId || 'system';
      if (!userSalesMap[userId]) {
        userSalesMap[userId] = { totalItems: 0, highMarginItems: 0, totalSoldBRL: 0 };
      }
      
      const stats = userSalesMap[userId];
      stats.totalSoldBRL += s.total;

      (s.items || []).forEach(item => {
        if (item.productId === 'quitacao' || item.productId === '_debt_settlement') return;
        stats.totalItems += item.quantity;
        if (highMarginProducts.has(item.productId)) {
          stats.highMarginItems += item.quantity;
        }
      });
    });

    return Object.entries(userSalesMap)
      .map(([userId, stats]) => {
        const userObj = users.find(u => u.id === userId);
        const name = userObj ? userObj.displayName : userId === 'system' ? 'Sistema / QR Code' : 'Funcionário';
        const upsellRatio = stats.totalItems > 0 ? (stats.highMarginItems / stats.totalItems) * 100 : 0;

        let badge = '📋 Atendente Standard';
        let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-500';

        if (upsellRatio >= 50) {
          badge = '🏆 Mestre do Upsell';
          badgeColor = 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800';
        } else if (upsellRatio >= 35) {
          badge = '⭐ Promotor Premium';
          badgeColor = 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800';
        }

        return {
          userId,
          name,
          totalItems: stats.totalItems,
          highMarginItems: stats.highMarginItems,
          totalSoldBRL: stats.totalSoldBRL,
          upsellRatio,
          badge,
          badgeColor
        };
      })
      .sort((a, b) => b.upsellRatio - a.upsellRatio);
  }, [activeSales, products, averageMargin, productVolume, users]);

  // ----------------------------------------------------
  // 5. ALERTA DE RUPTURA PREDITIVO (Estoque)
  // ----------------------------------------------------
  const currentStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    stockTransactions.forEach(t => {
      if (t.unitId === activeUnitId) {
        map[t.productId] = (map[t.productId] || 0) + t.quantity;
      }
    });
    return map;
  }, [stockTransactions, activeUnitId]);

  const stockRuptureAlerts = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const productSales7d: Record<string, number> = {};

    activeSales.forEach(s => {
      if (s.timestamp >= sevenDaysAgo) {
        (s.items || []).forEach(item => {
          productSales7d[item.productId] = (productSales7d[item.productId] || 0) + item.quantity;
        });
      }
    });

    return products
      .filter(p => p.trackStock !== false)
      .map(p => {
        const stock = currentStockMap[p.id] || 0;
        const weeklySales = productSales7d[p.id] || 0;
        const avgSalesPerDay = weeklySales / 7;
        
        let daysLeft = 999;
        if (avgSalesPerDay > 0) {
          daysLeft = stock / avgSalesPerDay;
        }

        return {
          product: p,
          stock,
          avgSalesPerDay,
          daysLeft
        };
      })
      .filter(item => item.avgSalesPerDay > 0 && item.daysLeft <= 4) // Menos de 4 dias de estoque
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [products, currentStockMap, activeSales]);

  // ----------------------------------------------------
  // 6. ALERTA DE AUDITORIA OPERACIONAL (Prevenção de Fraudes)
  // ----------------------------------------------------
  const operationalAudits = useMemo(() => {
    const alerts: { title: string; desc: string; type: 'warning' | 'critical' }[] = [];

    // Auditoria 1: Turnos com diferença física de fechamento alta
    const closedShifts = shifts.filter(s => s.status === 'closed');
    closedShifts.forEach(s => {
      if (s.cashDifference !== undefined && Math.abs(s.cashDifference) > 0.05) {
        const expected = Number(s.finalCashChange) || 0;
        const ratio = expected > 0 ? (Math.abs(s.cashDifference) / expected) * 100 : 0;
        if (ratio > 5) {
          alerts.push({
            title: `Diferença de Caixa no Turno`,
            desc: `O turno fechado por @${s.closedBy || s.openedBy} apresentou quebra/sobra física de ${formatCurrency(s.cashDifference)} (${ratio.toFixed(1)}% do esperado).`,
            type: ratio > 12 ? 'critical' : 'warning'
          });
        }
      }
    });

    // Auditoria 2: Cancelamentos elevados (vendas ou mesas excluídas) nos últimos 7 dias
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = auditLogs.filter(log => log.timestamp >= sevenDaysAgo);
    
    const deletionCounts: Record<string, { username: string; count: number }> = {};
    recentLogs.forEach(log => {
      if (log.action === 'TAB_DELETE' || log.action === 'SALE_DELETE') {
        const uid = log.userId;
        if (!deletionCounts[uid]) {
          deletionCounts[uid] = { username: log.username, count: 0 };
        }
        deletionCounts[uid].count += 1;
      }
    });

    Object.values(deletionCounts).forEach(item => {
      if (item.count >= 4) {
        alerts.push({
          title: `Volume Alto de Exclusões`,
          desc: `O operador @${item.username} realizou ${item.count} exclusões de comandas/vendas nos últimos 7 dias.`,
          type: item.count >= 7 ? 'critical' : 'warning'
        });
      }
    });

    return alerts;
  }, [shifts, auditLogs]);


  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl animate-bounce border border-slate-200 dark:border-slate-800">
          {toastMessage}
        </div>
      )}

      {/* Título Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Assistente do Dono</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Módulo Premium • Consultoria Financeira e Inteligência Local
          </p>
        </div>
        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg shadow-orange-500/10">
          💎 PREMIUM ATIVO
        </span>
      </div>

      {/* 1. CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Faturamento Consumido</p>
          <p className="text-3xl font-black italic tracking-tighter text-slate-800 dark:text-white">
            {formatCurrency(financialStats.consumedRevenue)}
          </p>
          <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Exclui 10% de taxa de serviço</p>
        </div>
        <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">CMV (Custo de Vendas)</p>
          <p className="text-3xl font-black italic tracking-tighter text-red-500">
            {formatCurrency(financialStats.totalCMV)}
          </p>
          <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Gasto histórico em insumos</p>
        </div>
        <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Lucro Bruto Real</p>
          <p className="text-3xl font-black italic tracking-tighter text-emerald-600">
            {formatCurrency(financialStats.grossProfit)}
          </p>
          <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Sobra após custo de CMV</p>
        </div>
        <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Margem Média Geral</p>
          <p className="text-3xl font-black italic tracking-tighter text-indigo-500">
            {financialStats.consolidatedMargin.toFixed(1)}%
          </p>
          <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Meta recomendada: &gt; 55%</p>
        </div>
      </div>

      {/* 2. ENGENHARIA DE CARDÁPIO (MATRIZ BCG 2x2) */}
      <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Matriz de Engenharia de Cardápio (BCG)</h3>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5">
            Corte de Giro Semanal: <span className="text-red-500 font-bold">{medianGiro} un</span> | Corte de Margem: <span className="text-red-500 font-bold">{averageMargin.toFixed(1)}%</span>
          </p>
        </div>

        {/* Layout 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ESTRELA */}
          <div 
            onClick={() => setSelectedQuadrant('estrela')}
            className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[160px] relative overflow-hidden
              ${selectedQuadrant === 'estrela' 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-xl shadow-emerald-500/5' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-emerald-300'}`}
          >
            <div className="absolute right-4 top-4 text-4xl opacity-10">⭐</div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded">Quadrante Alto Lucro / Alto Giro</span>
              <h4 className="text-base font-black uppercase text-slate-800 dark:text-white mt-2">⭐ Estrelas ({bcgProducts.estrela.length})</h4>
            </div>
            <p className="text-[10px] font-bold text-slate-500 truncate mt-4">
              {bcgProducts.estrela.map(p => p.name).join(', ') || 'Nenhum produto'}
            </p>
          </div>

          {/* QUEBRA CABEÇA */}
          <div 
            onClick={() => setSelectedQuadrant('quebra_cabeca')}
            className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[160px] relative overflow-hidden
              ${selectedQuadrant === 'quebra_cabeca' 
                ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-500 shadow-xl shadow-indigo-500/5' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-indigo-300'}`}
          >
            <div className="absolute right-4 top-4 text-4xl opacity-10">🧩</div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-500 text-white px-2 py-0.5 rounded">Quadrante Alto Lucro / Baixo Giro</span>
              <h4 className="text-base font-black uppercase text-slate-800 dark:text-white mt-2">🧩 Quebra-Cabeças ({bcgProducts.quebra_cabeca.length})</h4>
            </div>
            <p className="text-[10px] font-bold text-slate-500 truncate mt-4">
              {bcgProducts.quebra_cabeca.map(p => p.name).join(', ') || 'Nenhum produto'}
            </p>
          </div>

          {/* VACA LEITEIRA */}
          <div 
            onClick={() => setSelectedQuadrant('vaca_leiteira')}
            className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[160px] relative overflow-hidden
              ${selectedQuadrant === 'vaca_leiteira' 
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 shadow-xl shadow-amber-500/5' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-amber-300'}`}
          >
            <div className="absolute right-4 top-4 text-4xl opacity-10">🐄</div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500 text-white px-2 py-0.5 rounded">Quadrante Baixo Lucro / Alto Giro</span>
              <h4 className="text-base font-black uppercase text-slate-800 dark:text-white mt-2">🐄 Vacas Leiteiras ({bcgProducts.vaca_leiteira.length})</h4>
            </div>
            <p className="text-[10px] font-bold text-slate-500 truncate mt-4">
              {bcgProducts.vaca_leiteira.map(p => p.name).join(', ') || 'Nenhum produto'}
            </p>
          </div>

          {/* ABACAXI */}
          <div 
            onClick={() => setSelectedQuadrant('abacaxi')}
            className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[160px] relative overflow-hidden
              ${selectedQuadrant === 'abacaxi' 
                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 shadow-xl shadow-rose-500/5' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-rose-300'}`}
          >
            <div className="absolute right-4 top-4 text-4xl opacity-10">🍍</div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest bg-rose-500 text-white px-2 py-0.5 rounded">Quadrante Baixo Lucro / Baixo Giro</span>
              <h4 className="text-base font-black uppercase text-slate-800 dark:text-white mt-2">🍍 Abacaxis ({bcgProducts.abacaxi.length})</h4>
            </div>
            <p className="text-[10px] font-bold text-slate-500 truncate mt-4">
              {bcgProducts.abacaxi.map(p => p.name).join(', ') || 'Nenhum produto'}
            </p>
          </div>
        </div>

        {/* Modal / Detalhamento de Estratégias */}
        {selectedQuadrant && (
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mt-4 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-sm font-black uppercase italic tracking-tight text-slate-800 dark:text-white">
                Estratégia Recomendada: {quadrantInfo[selectedQuadrant].title}
              </h4>
              <button 
                onClick={() => setSelectedQuadrant(null)} 
                className="text-xs font-black text-slate-400 hover:text-red-500 uppercase tracking-widest"
              >
                Fechar
              </button>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {quadrantInfo[selectedQuadrant].desc}
            </p>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-6">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Ação de Negócio Sugerida</p>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed">
                {quadrantInfo[selectedQuadrant].action}
              </p>
            </div>
            
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Produtos Cadastrados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {bcgProducts[selectedQuadrant].map(p => {
                const giro = productVolume[p.id] || 0;
                const margin = ((p.price - p.lastCostPrice!) / p.price) * 100;
                return (
                  <div key={p.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{p.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Preço: {formatCurrency(p.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-800 dark:text-white">{giro} un</p>
                      <p className="text-[7.5px] font-black text-emerald-600">{margin.toFixed(1)}% margem</p>
                    </div>
                  </div>
                );
              })}
              {bcgProducts[selectedQuadrant].length === 0 && (
                <p className="text-xs font-bold text-slate-400 italic">Nenhum produto listado neste quadrante no momento.</p>
              )}
            </div>
          </div>
        )}

        {/* Cadastro de Custos Faltantes (CMV) */}
        {pendingCostProducts.length > 0 && (
          <div className="p-6 rounded-3xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/5 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">💸</span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-amber-700 dark:text-amber-500">Produtos Pendentes de Custo ({pendingCostProducts.length})</h4>
                <p className="text-[8.5px] font-bold text-slate-400 uppercase mt-0.5">Defina o preço de custo para integrá-los à análise de margens e lucro</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {pendingCostProducts.slice(0, 6).map(p => (
                <div key={p.id} className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate">{p.name}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Venda: {formatCurrency(p.price)}</p>
                  </div>
                  <div className="relative shrink-0 w-24">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">R$</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={editingCosts[p.id] || ''}
                      onChange={e => setEditingCosts(prev => ({ ...prev, [p.id]: sanitizeCurrencyInput(e.target.value) }))}
                      placeholder="0,00"
                      className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-black text-right outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {pendingCostProducts.length > 6 && (
              <p className="text-[8.5px] font-bold text-amber-600 uppercase mb-4 italic">+ {pendingCostProducts.length - 6} outros itens pendentes de custo. Atualize estes primeiro.</p>
            )}

            <button
              onClick={handleSavePendingCosts}
              disabled={isSavingCosts || Object.keys(editingCosts).length === 0}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-md disabled:opacity-40 transition-all"
            >
              {isSavingCosts ? 'SALVANDO CUSTOS...' : 'SALVAR CUSTOS DIGITADOS'}
            </button>
          </div>
        )}
      </div>

      {/* 3. PRECIFICADOR INTELIGENTE (Simulador) */}
      <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/80 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Precificador Inteligente</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5">
              Simulador local de markup e margem por categoria
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="sim-category" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria de Comparação</label>
              <select
                id="sim-category"
                value={simulatedCategory}
                onChange={e => setSimulatedCategory(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value="">Selecione a Categoria...</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sim-cost" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço de Custo (CMV)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">R$</span>
                <input 
                  id="sim-cost"
                  type="text" 
                  inputMode="decimal"
                  value={simulatedCost}
                  onChange={e => setSimulatedCost(sanitizeCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {simulatedCategory && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Margem Real do Bar nesta Categoria</span>
              <span className="text-xs font-black text-indigo-600">{simulatedCategoryStats.avgMargin.toFixed(1)}% média</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center gap-4">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Projeção de Preço e Lucro Sugerido</p>
          
          {simulatedPricingResults ? (
            <div className="space-y-3">
              {/* Margem 50% */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[8px] font-black uppercase text-slate-400">Preço p/ Margem de 50%</span>
                  <p className="text-base font-black text-slate-800 dark:text-white leading-none mt-1">
                    {formatCurrency(simulatedPricingResults.margin50.price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase text-slate-400">Lucro</span>
                  <p className="text-xs font-black text-emerald-600 leading-none mt-1">
                    + {formatCurrency(simulatedPricingResults.margin50.profit)}
                  </p>
                </div>
              </div>

              {/* Margem 60% */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/30 flex justify-between items-center relative overflow-hidden">
                <div className="absolute right-0 top-0 bg-indigo-500 text-white text-[6px] font-black uppercase px-2 py-0.5 rounded-bl">RECOMENDADO</div>
                <div>
                  <span className="text-[8px] font-black uppercase text-slate-400">Preço p/ Margem de 60%</span>
                  <p className="text-base font-black text-indigo-600 leading-none mt-1">
                    {formatCurrency(simulatedPricingResults.margin60.price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase text-slate-400">Lucro</span>
                  <p className="text-xs font-black text-emerald-600 leading-none mt-1">
                    + {formatCurrency(simulatedPricingResults.margin60.profit)}
                  </p>
                </div>
              </div>

              {/* Margem 70% */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[8px] font-black uppercase text-slate-400">Preço p/ Margem de 70%</span>
                  <p className="text-base font-black text-slate-800 dark:text-white leading-none mt-1">
                    {formatCurrency(simulatedPricingResults.margin70.price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase text-slate-400">Lucro</span>
                  <p className="text-xs font-black text-emerald-600 leading-none mt-1">
                    + {formatCurrency(simulatedPricingResults.margin70.profit)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic opacity-40">
              Digite um preço de custo ao lado para calcular
            </div>
          )}
        </div>
      </div>

      {/* 4. RANKING DE UPSELL DA EQUIPE */}
      <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Métricas de Equipe: Conversão de Upsell</h3>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5">
            Mapeia quem vende itens de Alta Margem (Estrelas / Quebra-Cabeças) versus volume geral
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Atendente</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Nível de Upsell</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Produtos Vendidos</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Itens Alta Margem</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Taxa de Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {waiterUpsellRanking.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{row.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase leading-none ${row.badgeColor}`}>
                      {row.badge}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">{row.totalItems} un</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">{row.highMarginItems} un</td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black italic tracking-tighter text-indigo-600">{row.upsellRatio.toFixed(1)}%</p>
                  </td>
                </tr>
              ))}
              {waiterUpsellRanking.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic opacity-40">Sem dados de vendas registrados neste turno</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. AVISOS DE AUDITORIA & RUPTURA DE ESTOQUE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alerta de Ruptura Preditivo */}
        <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Ruptura de Estoque Preditiva</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5">
              Itens que vão esgotar nas próximas 24h a 72h baseado na velocidade de venda
            </p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {stockRuptureAlerts.map((item, idx) => {
              const isCritical = item.daysLeft <= 1;
              return (
                <div key={idx} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${isCritical ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30' : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30'}`}>
                  <div>
                    <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                      {isCritical ? '🚨 RUPTURA IMINENTE' : '⚠️ ESTOQUE BAIXO'}
                    </span>
                    <p className="text-xs font-black uppercase text-slate-800 dark:text-white mt-1.5">{item.product.name}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Média de Saída: {item.avgSalesPerDay.toFixed(1)} un/dia</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tracking-tighter ${isCritical ? 'text-red-600' : 'text-amber-500'}`}>
                      {item.daysLeft <= 0 ? 'Zerado' : `${item.daysLeft.toFixed(1)} Dias`}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Estoque: {item.stock} un</p>
                  </div>
                </div>
              );
            })}
            {stockRuptureAlerts.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic opacity-40 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                Nenhuma ruptura de estoque detectada para os próximos dias
              </div>
            )}
          </div>
        </div>

        {/* Auditoria Operacional Antifraude */}
        <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Auditoria de Prevenção de Risco</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5">
              Anomalias e alertas de integridade financeira e operacional do bar
            </p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {/* Comandas inativas (Análise estática local) */}
            {openTabs.map((tab) => {
              const lastActivity = tab.lastItemAddedAt || tab.openedAt;
              const ocioso = Date.now() - lastActivity > 4 * 60 * 60 * 1000;
              if (ocioso) {
                return (
                  <div key={tab.id} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 flex justify-between items-center">
                    <div>
                      <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500 text-white">⚠️ COMANDA INATIVA</span>
                      <p className="text-xs font-black uppercase text-slate-800 dark:text-white mt-1.5">{tab.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Sem pedidos adicionados há {Math.floor((Date.now() - lastActivity) / 3600000)}h</p>
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {operationalAudits.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border flex justify-between items-center ${item.type === 'critical' ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'}`}>
                <div>
                  <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${item.type === 'critical' ? 'bg-red-600 text-white' : 'bg-slate-500 text-white'}`}>
                    {item.type === 'critical' ? '🚨 CRÍTICO' : '⚠️ ANOMALIA'}
                  </span>
                  <p className="text-xs font-black uppercase text-slate-800 dark:text-white mt-1.5">{item.title}</p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-normal mt-1 max-w-[280px]">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}

            {operationalAudits.length === 0 && !openTabs.some(t => Date.now() - (t.lastItemAddedAt || t.openedAt) > 4 * 60 * 60 * 1000) && (
              <div className="text-center py-12 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic opacity-40 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                Nenhuma anomalia operacional detectada na auditoria local
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default OwnerAssistant;
