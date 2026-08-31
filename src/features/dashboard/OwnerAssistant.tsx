import React, { useState, useMemo, useCallback } from 'react';
import { Product, Sale, StockTransaction, AuditLog, Shift, User, Tab, formatCurrency, parseCurrencyValue, sanitizeCurrencyInput, SubscriptionPlan, Subscriber, SubscriptionLog, generateUniqueId } from '../../types';

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
  subscriptionPlans?: SubscriptionPlan[];
  subscribers?: Subscriber[];
  subscriptionLogs?: SubscriptionLog[];
  onSavePlan?: (plan: SubscriptionPlan) => Promise<void>;
  onDeletePlan?: (planId: string) => Promise<void>;
  onSaveSubscriber?: (subscriber: Subscriber) => Promise<void>;
  onDeleteSubscriber?: (subscriberId: string) => Promise<void>;
  onRenewSubscriber?: (subscriberId: string) => Promise<void>;
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
  openTabs = [],
  subscriptionPlans = [],
  subscribers = [],
  subscriptionLogs = [],
  onSavePlan,
  onDeletePlan,
  onSaveSubscriber,
  onDeleteSubscriber,
  onRenewSubscriber
}) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<BCGQuadrant | null>(null);
  const [editingCosts, setEditingCosts] = useState<Record<string, string>>({});
  const [isSavingCosts, setIsSavingCosts] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'insights' | 'subscriptions' | 'antifraud'>('insights');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  // States for Plan Form
  const [planId, setPlanId] = useState('');
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planSelectedProducts, setPlanSelectedProducts] = useState<string[]>([]);
  const [planDailyLimit, setPlanDailyLimit] = useState('1');

  // States for Subscriber Form
  const [subId, setSubId] = useState('');
  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subCpf, setSubCpf] = useState('');
  const [subPlanId, setSubPlanId] = useState('');
  const [subStatus, setSubStatus] = useState<'active' | 'suspended' | 'expired'>('active');

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

  const priceProjections = useMemo(() => {
    if (!simulatedPricingResults) return [];
    return [
      { target: 50, price: simulatedPricingResults.margin50.price, profit: simulatedPricingResults.margin50.profit, cmv: 50 },
      { target: 60, price: simulatedPricingResults.margin60.price, profit: simulatedPricingResults.margin60.profit, cmv: 40 },
      { target: 70, price: simulatedPricingResults.margin70.price, profit: simulatedPricingResults.margin70.profit, cmv: 30 }
    ];
  }, [simulatedPricingResults]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic text-left">Assistente do Dono</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-left">
            Módulo Premium • Consultoria Financeira e Inteligência Local
          </p>
        </div>
        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg shadow-orange-500/10">
          💎 PREMIUM ATIVO
        </span>
      </div>

      {/* Selector de Abas Premium */}
      <div className="flex border-b border-slate-250 dark:border-slate-800 gap-4 pb-2 shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'insights', label: '📊 Insights & Margens', desc: 'Matriz BCG e CMV' },
          { id: 'subscriptions', label: '👤 Clube de Assinaturas', desc: 'Recorrência CRM' },
          { id: 'antifraud', label: '🛡️ Prevenção de Fraudes', desc: 'Score de Operador' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-start px-6 py-4 rounded-3xl transition-all shrink-0 text-left ${activeTab === tab.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xl shadow-slate-950/10' : 'text-slate-400 hover:text-slate-650 hover:bg-slate-105 dark:hover:bg-slate-800/30'}`}
          >
            <span className="text-xs font-black uppercase tracking-wider">{tab.label}</span>
            <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-1">{tab.desc}</span>
          </button>
        ))}
      </div>

      {activeTab === 'insights' && (
        <div className="space-y-10 animate-in fade-in duration-300">
          {/* 1. CARDS DE RESUMO FINANCEIRO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800/80 shadow-sm text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Faturamento Consumido</p>
              <p className="text-3xl font-black italic tracking-tighter text-slate-800 dark:text-white">
                {formatCurrency(financialStats.consumedRevenue)}
              </p>
              <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Exclui 10% de taxa de serviço</p>
            </div>
            <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800/80 shadow-sm text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">CMV (Custo de Vendas)</p>
              <p className="text-3xl font-black italic tracking-tighter text-red-500">
                {formatCurrency(financialStats.totalCMV)}
              </p>
              <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Gasto histórico em insumos</p>
            </div>
            <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800/80 shadow-sm text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Lucro Bruto Real</p>
              <p className="text-3xl font-black italic tracking-tighter text-emerald-600">
                {formatCurrency(financialStats.grossProfit)}
              </p>
              <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Sobra após custo de CMV</p>
            </div>
            <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800/80 shadow-sm text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Margem Média Geral</p>
              <p className="text-3xl font-black italic tracking-tighter text-indigo-500">
                {financialStats.consolidatedMargin.toFixed(1)}%
              </p>
              <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Meta recomendada: &gt; 55%</p>
            </div>
          </div>

          {/* 2. ENGENHARIA DE CARDÁPIO (MATRIZ BCG 2x2) */}
          <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6 text-left">
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
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-500 shadow-xl shadow-red-500/5' 
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-red-300'}`}
              >
                <div className="absolute right-4 top-4 text-4xl opacity-10">🍍</div>
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-red-500 text-white px-2 py-0.5 rounded">Quadrante Baixo Lucro / Baixo Giro</span>
                  <h4 className="text-base font-black uppercase text-slate-800 dark:text-white mt-2">🍍 Abacaxis ({bcgProducts.abacaxi.length})</h4>
                </div>
                <p className="text-[10px] font-bold text-slate-500 truncate mt-4">
                  {bcgProducts.abacaxi.map(p => p.name).join(', ') || 'Nenhum produto'}
                </p>
              </div>
            </div>

            {/* Quadrant Detail & Actions */}
            {selectedQuadrant && (
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-150 dark:border-slate-900 space-y-4 animate-in slide-in-from-top duration-300">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black uppercase text-slate-850 dark:text-white italic">
                    {selectedQuadrant === 'estrela' && '⭐ Detalhes das Estrelas'}
                    {selectedQuadrant === 'vaca_leiteira' && '🐄 Detalhes das Vacas Leiteiras'}
                    {selectedQuadrant === 'quebra_cabeca' && '🧩 Detalhes dos Quebra-Cabeças'}
                    {selectedQuadrant === 'abacaxi' && '🍍 Detalhes dos Abacaxis'}
                  </h4>
                  <button onClick={() => setSelectedQuadrant(null)} className="text-slate-450 hover:text-slate-655 font-bold text-xs">Fechar</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {bcgProducts[selectedQuadrant].map(p => {
                    const weeklyVol = productVolume[p.id] || 0;
                    const margin = p.price > 0 ? ((p.price - (p.lastCostPrice || 0)) / p.price) * 100 : 0;
                    return (
                      <div key={p.id} className="bg-white dark:bg-[#0B1120] p-4 rounded-2xl border border-slate-150 dark:border-slate-900/60 shadow-sm flex flex-col justify-between min-h-[90px]">
                        <div>
                          <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{p.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Vendas (30d): {weeklyVol} un</p>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <p className="text-[10px] font-black italic text-emerald-600">Margem: {margin.toFixed(0)}%</p>
                          <p className="text-xs font-black text-slate-700 dark:text-white">{formatCurrency(p.price)}</p>
                        </div>
                      </div>
                    );
                  })}
                  {bcgProducts[selectedQuadrant].length === 0 && (
                    <div className="col-span-full py-6 text-center text-slate-400 font-bold uppercase text-[9px] tracking-widest italic opacity-40">Sem itens registrados neste quadrante</div>
                  )}
                </div>

                {/* Estratégias Sugeridas */}
                <div className="bg-slate-900 text-slate-200 dark:bg-white dark:text-slate-900 p-6 rounded-2xl border border-transparent dark:border-slate-800">
                  <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500 text-white px-2 py-0.5 rounded">Recomendação Estratégica</span>
                  <p className="text-xs leading-relaxed mt-2.5 font-bold uppercase text-white dark:text-slate-900">
                    {selectedQuadrant === 'estrela' && 'Manter preço e destacar visibilidade no cardápio público. Garantir que nunca falte estoque.'}
                    {selectedQuadrant === 'vaca_leiteira' && 'Tentar criar combos (ex: Cerveja Vaca Leiteira + Porção Estrela) ou aplicar leves aumentos de preço. Reduzir custos de aquisição.'}
                    {selectedQuadrant === 'quebra_cabeca' && 'Promover através de ofertas ou Happy Hour (Modo Happy Hour automático). Fazer venda consultiva / sugestão de garçom.'}
                    {selectedQuadrant === 'abacaxi' && 'Reavaliar permanência no menu. Considerar aumento de margem/preço, CMV menor ou exclusão total para simplificar a operação.'}
                  </p>
                </div>
              </div>
            )}

            {/* Inserção de Custos CMV em Lote */}
            {pendingCostProducts.length > 0 && (
              <div className="bg-red-50/20 dark:bg-red-950/5 border border-red-500/30 p-6 rounded-3xl space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-red-600 dark:text-red-400 leading-none">⚠️ Produtos Sem Preço de Custo (CMV)</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Insira os custos para liberar relatórios de lucro bruto reais e Matriz BCG precisa</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {pendingCostProducts.slice(0, 6).map(p => (
                    <div key={p.id} className="bg-white dark:bg-[#0B1120] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-700 dark:text-white truncate max-w-[130px]">{p.name}</span>
                      <div className="flex items-center gap-1.5 max-w-[90px]">
                        <span className="text-[10px] font-bold text-slate-400">R$</span>
                        <input 
                          type="text" 
                          placeholder="0,00"
                          value={editingCosts[p.id] || ''}
                          onChange={(e) => setEditingCosts(prev => ({ ...prev, [p.id]: sanitizeCurrencyInput(e.target.value) }))}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-850 dark:text-white text-right focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleSavePendingCosts}
                  disabled={isSavingCosts || Object.keys(editingCosts).length === 0}
                  className="bg-red-600 text-white font-black uppercase text-[9px] tracking-widest px-6 py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSavingCosts ? 'Salvando Custos...' : 'Salvar CMV em Lote'}
                </button>
              </div>
            )}
          </div>

          {/* 3. SIMULADOR E PRECIFICADOR DE MARGEM ALVO */}
          <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Precificador Inteligente e Simulador de Margem Alvo</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5">Configure o custo de insumos e projete preços ideais de venda para lucros saudáveis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Form de entrada */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-905">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Custo Unitário da Mercadoria (CMV)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                    <input 
                      type="text" 
                      placeholder="0,00"
                      value={simulatedCost}
                      onChange={(e) => setSimulatedCost(sanitizeCurrencyInput(e.target.value))}
                      className="w-full bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-4 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Categoria Sugerida</label>
                  <select 
                    value={simulatedCategory}
                    onChange={(e) => setSimulatedCategory(e.target.value)}
                    className="w-full bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 px-4 py-4 rounded-2xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="CERVEJAS">Cervejas (Alvo: 50% Margem)</option>
                    <option value="PORÇÕES">Porções (Alvo: 70% Margem)</option>
                    <option value="DRINKS">Drinks / Coquetéis (Alvo: 75% Margem)</option>
                  </select>
                </div>
              </div>

              {/* Resultados */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {priceProjections.map((proj, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[30px] border border-slate-100 dark:border-slate-900 flex flex-col justify-between min-h-[140px]">
                    <div>
                      <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${proj.target === 50 ? 'bg-indigo-500 text-white' : proj.target === 60 ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                        Margem Alvo: {proj.target}%
                      </span>
                      <h4 className="text-2xl font-black italic tracking-tighter text-slate-800 dark:text-white mt-3">{formatCurrency(proj.price)}</h4>
                    </div>
                    <div className="border-t border-slate-205 dark:border-slate-800/80 pt-3 mt-3">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Lucro Bruto: {formatCurrency(proj.profit)}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">CMV: {proj.cmv.toFixed(1)}% do faturamento</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. RANKING DE UPSELL DA EQUIPE */}
          <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6 text-left">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
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
                        <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isCritical ? 'bg-red-650 text-white' : 'bg-amber-500 text-white'}`}>
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
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-8 animate-in fade-in duration-300 text-left">
          {/* Recorrência KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Assinantes Ativos</p>
              <p className="text-3xl font-black italic tracking-tighter text-slate-800 dark:text-white">
                {subscribers.filter(s => s.status === 'active').length} <span className="text-xs font-bold text-slate-400">/ {subscribers.length}</span>
              </p>
              <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Clientes ativos no clube</p>
            </div>
            
            <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">MRR (Faturamento Estimado)</p>
              <p className="text-3xl font-black italic tracking-tighter text-emerald-600">
                {formatCurrency(
                  subscribers
                    .filter(s => s.status === 'active')
                    .reduce((sum, s) => {
                      const plan = subscriptionPlans.find(p => p.id === s.planId);
                      return sum + (plan?.price || 0);
                    }, 0)
                )}
              </p>
              <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Receita Recorrente Mensal</p>
            </div>

            <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Consumos Realizados</p>
              <p className="text-3xl font-black italic tracking-tighter text-indigo-500">
                {subscriptionLogs.length} <span className="text-xs font-bold text-slate-400">un</span>
              </p>
              <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Copos/drinks retirados</p>
            </div>

            <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Planos do Clube</p>
              <p className="text-3xl font-black italic tracking-tighter text-amber-500">
                {subscriptionPlans.length} <span className="text-xs font-bold text-slate-400">Planos</span>
              </p>
              <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Categorias ativas de assinatura</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna 1: Planos */}
            <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col">
              <div className="flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-base font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Planos do Clube</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Modelos de cota de bebida</p>
                </div>
                <button
                  onClick={() => {
                    setPlanId('');
                    setPlanName('');
                    setPlanPrice('');
                    setPlanSelectedProducts([]);
                    setPlanDailyLimit('1');
                    setShowPlanModal(true);
                  }}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all active:scale-95"
                >
                  + Novo Plano
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar max-h-[450px]">
                {subscriptionPlans.map((plan) => (
                  <div key={plan.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-850 dark:text-white leading-none">{plan.name}</h4>
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 inline-block">Limite: {plan.dailyLimit} un / dia</span>
                      </div>
                      <span className="text-xs font-black text-emerald-500 italic leading-none">{formatCurrency(plan.price)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {plan.products.map(pid => {
                        const prod = products.find(p => p.id === pid);
                        return (
                          <span key={pid} className="text-[7px] font-black uppercase bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                            {prod?.name || 'Item'}
                          </span>
                        );
                      })}
                      {plan.products.length === 0 && (
                        <span className="text-[7px] font-bold text-red-500 uppercase">Sem produtos</span>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-1 shrink-0">
                      <button
                        onClick={() => {
                          setPlanId(plan.id);
                          setPlanName(plan.name);
                          setPlanPrice(plan.price.toString());
                          setPlanSelectedProducts(plan.products);
                          setPlanDailyLimit(plan.dailyLimit.toString());
                          setShowPlanModal(true);
                        }}
                        className="text-slate-450 hover:text-slate-650 dark:hover:text-white font-black uppercase text-[8px] tracking-wider"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Deletar este plano?")) {
                            if (onDeletePlan) onDeletePlan(plan.id);
                          }
                        }}
                        className="text-red-500 font-black uppercase text-[8px] tracking-wider"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
                {subscriptionPlans.length === 0 && (
                  <div className="text-center py-10 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic opacity-40 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                    Nenhum plano cadastrado
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Assinantes */}
            <div className="lg:col-span-2 bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col">
              <div className="flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-base font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Cadastro de Assinantes</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Banco de dados de parceiros do clube</p>
                </div>
                <button
                  onClick={() => {
                    setSubId('');
                    setSubName('');
                    setSubPhone('');
                    setSubCpf('');
                    setSubPlanId(subscriptionPlans[0]?.id || '');
                    setSubStatus('active');
                    setShowSubModal(true);
                  }}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all active:scale-95"
                >
                  + Novo Assinante
                </button>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 max-h-[450px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Nome</th>
                      <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Plano</th>
                      <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Status / Vencimento</th>
                      <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subscribers.map((sub) => {
                      const plan = subscriptionPlans.find(p => p.id === sub.planId);
                      const isExpired = sub.status === 'expired' || sub.expiresAt < Date.now();
                      const statusLabel = sub.status === 'active' && !isExpired ? 'Ativo' : sub.status === 'suspended' ? 'Suspenso' : 'Vencido';
                      const badgeColor = statusLabel === 'Ativo' ? 'bg-emerald-500/10 text-emerald-600' : statusLabel === 'Suspenso' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500';
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-xs font-black uppercase text-slate-800 dark:text-white leading-none mb-1">{sub.name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">CPF: {sub.cpf} | Tel: {sub.phone}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{plan?.name || 'Desconhecido'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase leading-none inline-block ${badgeColor}`}>
                              {statusLabel}
                            </span>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Expira: {new Date(sub.expiresAt).toLocaleDateString('pt-BR')}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  if (onRenewSubscriber) onRenewSubscriber(sub.id);
                                }}
                                className="text-emerald-650 hover:text-emerald-700 font-black uppercase text-[8px] tracking-wider"
                                title="Registrar mensalidade e estender prazo"
                              >
                                Renovar
                              </button>
                              <button
                                onClick={() => {
                                  setSubId(sub.id);
                                  setSubName(sub.name);
                                  setSubPhone(sub.phone);
                                  setSubCpf(sub.cpf);
                                  setSubPlanId(sub.planId);
                                  setSubStatus(sub.status);
                                  setShowSubModal(true);
                                }}
                                className="text-slate-450 hover:text-slate-655 dark:hover:text-white font-black uppercase text-[8px] tracking-wider"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Excluir este assinante?")) {
                                    if (onDeleteSubscriber) onDeleteSubscriber(sub.id);
                                  }
                                }}
                                className="text-red-500 font-black uppercase text-[8px] tracking-wider"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {subscribers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic opacity-40">Sem assinantes cadastrados</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Histórico de Consumo */}
          <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Log de Consumo das Assinaturas</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Histórico de copos e bebidas retiradas nas mesas</p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 max-h-[300px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Horário</th>
                    <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Assinante</th>
                    <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Plano</th>
                    <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Bebida Consumida</th>
                    <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Mesa / Comanda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subscriptionLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-slate-800 dark:text-white">{log.subscriberName}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{log.planName}</td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-slate-800 dark:text-emerald-400">{log.productName}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{log.tabName || 'Mesa'}</td>
                    </tr>
                  ))}
                  {subscriptionLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic opacity-40">Sem consumos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'antifraud' && (
        <div className="space-y-8 animate-in fade-in duration-300 text-left">
          {/* Antifraude KPI Cards */}
          {(() => {
            const criticalAlerts = auditLogs.filter(log => log.action === 'TAB_ITEM_REMOVE_AFTER_PRINT' || log.action === 'SALE_DELETE').length;
            const commonDeletions = auditLogs.filter(log => log.action === 'TAB_ITEM_REMOVE' || log.action === 'TAB_DELETE').length;
            const shiftDiscrepancies = shifts.filter(s => s.status === 'closed' && s.cashDifference !== undefined && Math.abs(s.cashDifference) > 5).length;
            const integrityIndex = Math.max(0, 100 - (criticalAlerts * 10 + shiftDiscrepancies * 15));

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Cancelamentos Pós-Pré-Conta</p>
                  <p className={`text-3xl font-black italic tracking-tighter ${criticalAlerts > 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                    {criticalAlerts} <span className="text-xs font-bold text-slate-400">Incidentes</span>
                  </p>
                  <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Exclusão crítica de comanda impressa</p>
                </div>
                
                <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Exclusões Gerais de Itens</p>
                  <p className="text-3xl font-black italic tracking-tighter text-amber-500">
                    {commonDeletions} <span className="text-xs font-bold text-slate-400">Ações</span>
                  </p>
                  <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Remoções comuns antes da pré-conta</p>
                </div>

                <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Diferenças Críticas de Turno</p>
                  <p className={`text-3xl font-black italic tracking-tighter ${shiftDiscrepancies > 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                    {shiftDiscrepancies} <span className="text-xs font-bold text-slate-400">Turnos</span>
                  </p>
                  <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Conferências com diferença &gt; 5%</p>
                </div>

                <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[35px] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Índice Geral de Integridade</p>
                  <p className={`text-3xl font-black italic tracking-tighter ${integrityIndex < 85 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {integrityIndex.toFixed(0)}%
                  </p>
                  <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Média ponderada do estabelecimento</p>
                </div>
              </div>
            );
          })()}

          {/* Grid de Risco por Atendente */}
          <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Avaliação de Risco Operacional por Atendente</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
                Mapeamento algorítmico de desvios, erros e comportamento de cancelamento por operador
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const userStats: Record<string, {
                  username: string;
                  displayName: string;
                  salesCount: number;
                  cancelCount: number;
                  criticalCancelCount: number;
                  shiftDiffCount: number;
                }> = {};

                const allOperators = [{ id: 'admin', displayName: 'Administrador (Admin)', username: 'admin' }, ...users];

                allOperators.forEach(u => {
                  userStats[u.username] = {
                    username: u.username,
                    displayName: u.displayName,
                    salesCount: 0,
                    cancelCount: 0,
                    criticalCancelCount: 0,
                    shiftDiffCount: 0
                  };
                });

                sales.filter(s => !s.deleted).forEach(s => {
                  const creator = users.find(u => u.id === s.userId) || (s.userId === 'admin' ? { username: 'admin' } : null);
                  if (creator) {
                    if (!userStats[creator.username]) {
                      userStats[creator.username] = { username: creator.username, displayName: creator.username, salesCount: 0, cancelCount: 0, criticalCancelCount: 0, shiftDiffCount: 0 };
                    }
                    userStats[creator.username].salesCount += 1;
                  }
                });

                auditLogs.forEach(log => {
                  if (!userStats[log.username]) {
                    userStats[log.username] = { username: log.username, displayName: log.username, salesCount: 0, cancelCount: 0, criticalCancelCount: 0, shiftDiffCount: 0 };
                  }
                  if (log.action === 'TAB_ITEM_REMOVE_AFTER_PRINT') {
                    userStats[log.username].criticalCancelCount += 1;
                  } else if (log.action === 'TAB_ITEM_REMOVE' || log.action === 'TAB_DELETE') {
                    userStats[log.username].cancelCount += 1;
                  }
                });

                shifts.filter(s => s.status === 'closed').forEach(s => {
                  if (s.cashDifference !== undefined && Math.abs(s.cashDifference) > 5) {
                    const closer = s.closedBy || s.openedBy || 'admin';
                    if (userStats[closer]) {
                      userStats[closer].shiftDiffCount += 1;
                    }
                  }
                });

                return Object.values(userStats).map((stats, idx) => {
                  const riskScore = Math.min(100, stats.criticalCancelCount * 30 + stats.cancelCount * 6 + stats.shiftDiffCount * 25);
                  const isHighRisk = riskScore >= 70;
                  const isMediumRisk = riskScore >= 30 && riskScore < 70;
                  const statusLabel = isHighRisk ? 'Risco Crítico 🚨' : isMediumRisk ? 'Atenção ⚠️' : 'Integridade Alta ✅';
                  const gaugeColor = isHighRisk ? 'bg-red-650' : isMediumRisk ? 'bg-amber-500' : 'bg-emerald-600';
                  const textColor = isHighRisk ? 'text-red-500' : isMediumRisk ? 'text-amber-500' : 'text-emerald-600';

                  return (
                    <div key={idx} className="p-6 rounded-[30px] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white leading-none">{stats.displayName}</h4>
                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 inline-block">ID: @{stats.username}</span>
                          </div>
                          <span className={`text-[8px] font-black uppercase leading-none ${textColor}`}>{statusLabel}</span>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 mb-1">
                            <span>Risk Score</span>
                            <span>{riskScore} / 100</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${gaugeColor}`} style={{ width: `${Math.max(5, riskScore)}%` }}></div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1.5 border-t border-slate-100 dark:border-slate-900 pt-3">
                          <div className="flex justify-between text-[9px] font-bold text-slate-500">
                            <span>Vendas Finalizadas</span>
                            <span className="font-black text-slate-700 dark:text-white">{stats.salesCount} un</span>
                          </div>
                          <div className="flex justify-between text-[9px] font-bold text-slate-500">
                            <span>Cancelamento pós-impressão</span>
                            <span className={`font-black ${stats.criticalCancelCount > 0 ? 'text-red-500' : 'text-slate-700 dark:text-white'}`}>{stats.criticalCancelCount}x</span>
                          </div>
                          <div className="flex justify-between text-[9px] font-bold text-slate-500">
                            <span>Remoções de comanda</span>
                            <span className="font-black text-slate-700 dark:text-white">{stats.cancelCount}x</span>
                          </div>
                          <div className="flex justify-between text-[9px] font-bold text-slate-500">
                            <span>Quebras de caixa</span>
                            <span className="font-black text-slate-700 dark:text-white">{stats.shiftDiffCount}x</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Registro de Auditoria Antifraude */}
          <div className="bg-white dark:bg-[#0B1120] p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Logs Críticos de Auditoria Operacional</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Ações de risco capturadas em tempo de execução no salão</p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 max-h-[350px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Data / Hora</th>
                    <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Tipo</th>
                    <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Operador</th>
                    <th className="px-6 py-4 text-[8px] font-black uppercase text-slate-400 tracking-widest">Ação / Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs
                    .filter(log => log.action === 'TAB_ITEM_REMOVE_AFTER_PRINT' || log.action === 'SALE_DELETE' || log.action === 'TAB_DELETE' || log.action === 'TAB_ITEM_REMOVE' || log.action === 'SHIFT_CLOSE')
                    .map((log) => {
                      const isCritical = log.action === 'TAB_ITEM_REMOVE_AFTER_PRINT' || log.action === 'SALE_DELETE';
                      const badgeText = isCritical ? 'Crítico 🚨' : 'Atenção ⚠️';
                      const badgeStyle = isCritical ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500';
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase leading-none inline-block ${badgeStyle}`}>
                              {badgeText}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-black uppercase text-slate-805 dark:text-white">@{log.username}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-650 dark:text-slate-350 leading-relaxed max-w-sm">{log.details}</td>
                        </tr>
                      );
                    })}
                  {auditLogs.filter(log => log.action === 'TAB_ITEM_REMOVE_AFTER_PRINT' || log.action === 'SALE_DELETE' || log.action === 'TAB_DELETE' || log.action === 'TAB_ITEM_REMOVE' || log.action === 'SHIFT_CLOSE').length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400 font-bold uppercase text-[9px] tracking-widest italic opacity-40">Nenhum evento de risco detectado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar Plano */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowPlanModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[85vh] text-left">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                {planId ? '✏️ Editar Plano' : '✨ Novo Plano de Clube'}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors font-bold">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome do Plano</label>
                <input 
                  type="text" 
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Ex: Clube de Cerveja VIP"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 px-5 py-4 rounded-2xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mensalidade (R$)</label>
                <input 
                  type="number" 
                  value={planPrice}
                  onChange={(e) => setPlanPrice(e.target.value)}
                  placeholder="59.90"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 px-5 py-4 rounded-2xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Limite Diário (Cota)</label>
                <input 
                  type="number" 
                  value={planDailyLimit}
                  onChange={(e) => setPlanDailyLimit(e.target.value)}
                  placeholder="1"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 px-5 py-4 rounded-2xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Produtos Elegíveis</label>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 space-y-2.5 max-h-[160px] overflow-y-auto no-scrollbar">
                  {products.map(p => {
                    const isChecked = planSelectedProducts.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setPlanSelectedProducts(prev => prev.filter(x => x !== p.id));
                            } else {
                              setPlanSelectedProducts(prev => [...prev, p.id]);
                            }
                          }}
                          className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                        />
                        <span>{p.name} ({formatCurrency(p.price)})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                if (!planName || !planPrice) {
                  showToast("Preencha todos os campos obrigatórios");
                  return;
                }
                const newPlan: SubscriptionPlan = {
                  id: planId || generateUniqueId('plan'),
                  name: planName,
                  price: Number(planPrice),
                  products: planSelectedProducts,
                  dailyLimit: Number(planDailyLimit) || 1
                };
                if (onSavePlan) {
                  await onSavePlan(newPlan);
                  showToast(planId ? "Plano atualizado!" : "Plano criado com sucesso!");
                  setShowPlanModal(false);
                }
              }}
              className="w-full mt-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-98 transition-all shrink-0"
            >
              Salvar Plano
            </button>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar Assinante */}
      {showSubModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowSubModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[85vh] text-left">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                {subId ? '✏️ Editar Assinante' : '👤 Novo Assinante'}
              </h3>
              <button onClick={() => setShowSubModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors font-bold">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="Ex: Carlos Roberto da Silva"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 px-5 py-4 rounded-2xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Telefone</label>
                <input 
                  type="text" 
                  value={subPhone}
                  onChange={(e) => setSubPhone(e.target.value)}
                  placeholder="Ex: 11988887777"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 px-5 py-4 rounded-2xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">CPF</label>
                <input 
                  type="text" 
                  value={subCpf}
                  onChange={(e) => setSubCpf(e.target.value)}
                  placeholder="Ex: 12345678900"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 px-5 py-4 rounded-2xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plano Vinculado</label>
                <select 
                  value={subPlanId}
                  onChange={(e) => setSubPlanId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 px-5 py-4 rounded-2xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="">Selecione um plano...</option>
                  {subscriptionPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} ({formatCurrency(plan.price)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status da Assinatura</label>
                <select 
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 px-5 py-4 rounded-2xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="active">Ativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="expired">Expirado / Vencido</option>
                </select>
              </div>
            </div>

            <button
              onClick={async () => {
                if (!subName || !subPhone || !subPlanId) {
                  showToast("Preencha todos os campos obrigatórios");
                  return;
                }
                const newSub: Subscriber = {
                  id: subId || generateUniqueId('sub'),
                  name: subName,
                  phone: subPhone,
                  cpf: subCpf,
                  planId: subPlanId,
                  status: subStatus,
                  createdAt: subId ? subscribers.find(s => s.id === subId)?.createdAt || Date.now() : Date.now(),
                  expiresAt: subId ? subscribers.find(s => s.id === subId)?.expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000) : (Date.now() + 30 * 24 * 60 * 60 * 1000)
                };
                if (onSaveSubscriber) {
                  await onSaveSubscriber(newSub);
                  showToast(subId ? "Assinante atualizado!" : "Assinante cadastrado!");
                  setShowSubModal(false);
                }
              }}
              className="w-full mt-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-98 transition-all shrink-0"
            >
              Salvar Assinante
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerAssistant;
