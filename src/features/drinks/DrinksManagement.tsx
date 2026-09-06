import React, { useState, useMemo } from 'react';
import { Product, BatchProduction, WasteLog, User, formatCurrency, sanitizeCurrencyInput } from '../../types';

interface DrinksManagementProps {
  products: Product[];
  onUpdateProducts?: (products: Product[]) => void;
  batchProductions: BatchProduction[];
  wasteLogs: WasteLog[];
  stockBalances: Record<string, number>;
  onProduceBatch: (subRecipeId: string, quantity: number, customShelfLifeDays?: number) => void;
  onRegisterWaste: (productId: string, quantity: number, reason: 'EXPIRED' | 'SPILL_BREAK' | 'TASTING' | 'OTHER', notes?: string) => void;
  currentUser: User | null;
  onViewChange?: (view: any) => void;
  activeUnitId: string | null;
}

export const DrinksManagement: React.FC<DrinksManagementProps> = ({
  products,
  batchProductions,
  wasteLogs,
  stockBalances,
  onProduceBatch,
  onRegisterWaste,
  onViewChange,
}) => {
  const [activeTab, setActiveTab] = useState<'ENGINEERING' | 'BATCHES' | 'WASTE'>('ENGINEERING');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Produzir Lote
  const [isProduceModalOpen, setIsProduceModalOpen] = useState(false);
  const [selectedSubRecipeId, setSelectedSubRecipeId] = useState('');
  const [produceQuantity, setProduceQuantity] = useState('');
  const [customShelfDays, setCustomShelfDays] = useState('7');

  // Modal Registrar Descarte/Perda
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [selectedWasteProductId, setSelectedWasteProductId] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState('');
  const [wasteReason, setWasteReason] = useState<'EXPIRED' | 'SPILL_BREAK' | 'TASTING' | 'OTHER'>('EXPIRED');
  const [wasteNotes, setWasteNotes] = useState('');

  // 1. Drinks com Ficha Técnica
  const drinksWithRecipe = useMemo(() => {
    return products.filter(p => !p.isRawMaterial && p.recipe && p.recipe.length > 0);
  }, [products]);

  // 2. Sub-preparos (Xaropes, Infusões, Premixes)
  const subRecipes = useMemo(() => {
    return products.filter(p => p.isRawMaterial && p.isSubRecipe);
  }, [products]);

  // 3. Cálculos de Engenharia de Cardápio e CMV
  const drinksAnalysis = useMemo(() => {
    return drinksWithRecipe.map(drink => {
      const recipeCost = (drink.recipe || []).reduce((sum, item) => {
        const ing = products.find(p => p.id === item.productId);
        return sum + ((ing?.lastCostPrice || 0) * item.quantity);
      }, 0);

      const price = drink.price || 0;
      const cmvPercent = price > 0 ? (recipeCost / price) * 100 : 0;
      const grossProfit = price - recipeCost;
      const marginPercent = price > 0 ? (grossProfit / price) * 100 : 0;

      let status: 'EXCELLENT' | 'GOOD' | 'CRITICAL' = 'GOOD';
      if (marginPercent >= 70) status = 'EXCELLENT';
      else if (marginPercent < 55) status = 'CRITICAL';

      return {
        ...drink,
        recipeCost,
        cmvPercent,
        grossProfit,
        marginPercent,
        status
      };
    });
  }, [drinksWithRecipe, products]);

  // Filtro de Drinks
  const filteredDrinks = useMemo(() => {
    if (!searchTerm) return drinksAnalysis;
    const term = searchTerm.toLowerCase();
    return drinksAnalysis.filter(d => 
      d.name.toLowerCase().includes(term) || 
      d.category.toLowerCase().includes(term)
    );
  }, [drinksAnalysis, searchTerm]);

  // KPIs Superiores
  const kpis = useMemo(() => {
    if (drinksAnalysis.length === 0) {
      return {
        avgCmv: 0,
        avgMargin: 0,
        criticalCount: 0,
        starDrink: null,
        totalLoss: wasteLogs.reduce((sum, w) => sum + (w.cost || 0), 0)
      };
    }

    const totalCmv = drinksAnalysis.reduce((sum, d) => sum + d.cmvPercent, 0);
    const totalMargin = drinksAnalysis.reduce((sum, d) => sum + d.marginPercent, 0);
    const criticalCount = drinksAnalysis.filter(d => d.status === 'CRITICAL').length;
    const starDrink = [...drinksAnalysis].sort((a, b) => b.grossProfit - a.grossProfit)[0] || null;
    const totalLoss = wasteLogs.reduce((sum, w) => sum + (w.cost || 0), 0);

    return {
      avgCmv: totalCmv / drinksAnalysis.length,
      avgMargin: totalMargin / drinksAnalysis.length,
      criticalCount,
      starDrink,
      totalLoss
    };
  }, [drinksAnalysis, wasteLogs]);

  // Sub-preparo Selecionado para Produção
  const activeSubRecipe = useMemo(() => {
    return subRecipes.find(s => s.id === selectedSubRecipeId) || null;
  }, [subRecipes, selectedSubRecipeId]);

  // Cálculos de Produção do Lote
  const batchCalculation = useMemo(() => {
    if (!activeSubRecipe || !activeSubRecipe.recipe) return null;
    const qty = parseFloat(produceQuantity.replace(',', '.')) || 0;
    const baseYield = activeSubRecipe.yieldQuantity && activeSubRecipe.yieldQuantity > 0 ? activeSubRecipe.yieldQuantity : 1;
    const ratio = qty > 0 ? qty / baseYield : 1;

    const ingredientsWithConsumption = activeSubRecipe.recipe.map(item => {
      const ing = products.find(p => p.id === item.productId);
      const neededQty = item.quantity * ratio;
      const currentStock = stockBalances[item.productId] || 0;
      const isShortage = currentStock < neededQty;
      const itemCost = (ing?.lastCostPrice || 0) * neededQty;

      return {
        product: ing,
        neededQty,
        currentStock,
        isShortage,
        itemCost,
        unitLabel: ing?.unitLabel || 'un'
      };
    });

    const totalBatchCost = ingredientsWithConsumption.reduce((sum, i) => sum + i.itemCost, 0);
    const unitCost = qty > 0 ? totalBatchCost / qty : 0;
    const hasAnyShortage = ingredientsWithConsumption.some(i => i.isShortage);

    return {
      ingredientsWithConsumption,
      totalBatchCost,
      unitCost,
      hasAnyShortage,
      ratio
    };
  }, [activeSubRecipe, produceQuantity, products, stockBalances]);

  // Produto selecionado para descarte
  const activeWasteProduct = useMemo(() => {
    return products.find(p => p.id === selectedWasteProductId) || null;
  }, [products, selectedWasteProductId]);

  const wasteEstimatedCost = useMemo(() => {
    if (!activeWasteProduct) return 0;
    const qty = parseFloat(wasteQuantity.replace(',', '.')) || 0;
    return (activeWasteProduct.lastCostPrice || 0) * qty;
  }, [activeWasteProduct, wasteQuantity]);

  // Executar Produção
  const handleConfirmProduce = () => {
    if (!activeSubRecipe) return;
    const qty = parseFloat(produceQuantity.replace(',', '.'));
    if (isNaN(qty) || qty <= 0) {
      alert('Informe uma quantidade válida para produzir');
      return;
    }

    const shelf = parseInt(customShelfDays, 10) || activeSubRecipe.shelfLifeDays || 7;
    onProduceBatch(activeSubRecipe.id, qty, shelf);
    setIsProduceModalOpen(false);
    setSelectedSubRecipeId('');
    setProduceQuantity('');
  };

  // Executar Descarte
  const handleConfirmWaste = () => {
    if (!activeWasteProduct) return;
    const qty = parseFloat(wasteQuantity.replace(',', '.'));
    if (isNaN(qty) || qty <= 0) {
      alert('Informe uma quantidade válida para descarte');
      return;
    }

    onRegisterWaste(activeWasteProduct.id, qty, wasteReason, wasteNotes.trim() || undefined);
    setIsWasteModalOpen(false);
    setSelectedWasteProductId('');
    setWasteQuantity('');
    setWasteNotes('');
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[32px] shadow-2xl border border-indigo-900/30">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍸</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic">
                Coquetelaria & Insumos Fracionados
              </h1>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
                Gestão Financeira, CMV, Produção de Batches & Fichas Técnicas
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              if (subRecipes.length === 0) {
                alert('Cadastre um Sub-preparo no menu de Produtos primeiro.');
                return;
              }
              setSelectedSubRecipeId(subRecipes[0].id);
              setProduceQuantity(String(subRecipes[0].yieldQuantity || 1000));
              setCustomShelfDays(String(subRecipes[0].shelfLifeDays || 7));
              setIsProduceModalOpen(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
          >
            <span>⚡</span>
            <span>Produzir Lote</span>
          </button>

          <button
            onClick={() => {
              setIsWasteModalOpen(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black text-xs uppercase tracking-wider border border-slate-700 active:scale-95 transition-all"
          >
            <span>🗑️</span>
            <span>Registrar Perda</span>
          </button>
        </div>
      </div>

      {/* KPIS DE PERFORMANCE FINANCEIRA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CMV Médio */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">CMV Médio da Casa</span>
            <span className="text-base">📊</span>
          </div>
          <p className={`text-2xl font-black ${kpis.avgCmv <= 30 ? 'text-emerald-600' : kpis.avgCmv <= 45 ? 'text-amber-600' : 'text-rose-600'}`}>
            {kpis.avgCmv.toFixed(1)}%
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Meta Ideal: &lt; 30%</p>
        </div>

        {/* Margem Bruta Média */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Margem Bruta Média</span>
            <span className="text-base">💰</span>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {kpis.avgMargin.toFixed(1)}%
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Lucro bruto sobre drinks</p>
        </div>

        {/* Drink Campeão */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Campeão de Lucro</span>
            <span className="text-base">⭐</span>
          </div>
          <p className="text-base font-black text-slate-800 dark:text-white uppercase truncate">
            {kpis.starDrink ? kpis.starDrink.name : 'Nenhum'}
          </p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">
            {kpis.starDrink ? `+${formatCurrency(kpis.starDrink.grossProfit)} / drink` : '-'}
          </p>
        </div>

        {/* Perdas e Desperdício */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Prejuízo com Perdas</span>
            <span className="text-base">📉</span>
          </div>
          <p className="text-2xl font-black text-rose-600">
            {formatCurrency(kpis.totalLoss)}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
            {wasteLogs.length} descarte(s) registrado(s)
          </p>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setActiveTab('ENGINEERING')}
          className={`flex-1 min-w-[160px] py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'ENGINEERING'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <span>🍸</span>
          <span>Engenharia de Cardápio ({drinksAnalysis.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BATCHES')}
          className={`flex-1 min-w-[160px] py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'BATCHES'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <span>🧪</span>
          <span>Sub-preparos & Batches ({subRecipes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('WASTE')}
          className={`flex-1 min-w-[160px] py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'WASTE'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <span>📉</span>
          <span>Prevenção de Perdas ({wasteLogs.length})</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: ENGENHARIA DE CARDÁPIO */}
      {activeTab === 'ENGINEERING' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-80">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="BUSCAR DRINK NO CARDÁPIO..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent font-black uppercase text-xs outline-none text-slate-800 dark:text-white placeholder-slate-400"
              />
            </div>

            {onViewChange && (
              <button
                onClick={() => onViewChange('products')}
                className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-end sm:self-auto"
              >
                <span>➕ Cadastrar Novo Drink ou Insumo</span>
                <span>→</span>
              </button>
            )}
          </div>

          {filteredDrinks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[32px] border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <span className="text-4xl">🍸</span>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase">Nenhum Drink com Ficha Técnica Encontrado</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto font-medium">
                Vá até o menu de <strong>Produtos</strong>, crie ou edite um drink e adicione os insumos e doses na seção <strong>Ficha Técnica</strong> para calcular o CMV automaticamente.
              </p>
              {onViewChange && (
                <button
                  onClick={() => onViewChange('products')}
                  className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase"
                >
                  Ir para Cadastro de Produtos
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDrinks.map(drink => (
                <div
                  key={drink.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header do Card */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {drink.category}
                        </span>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-base mt-1">
                          {drink.name}
                        </h4>
                      </div>
                      <span
                        className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${
                          drink.status === 'EXCELLENT'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : drink.status === 'GOOD'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}
                      >
                        {drink.status === 'EXCELLENT' ? '⭐ Estrela' : drink.status === 'GOOD' ? '⚖️ Saudável' : '🚨 Margem Baixa'}
                      </span>
                    </div>

                    {/* Ficha Técnica Resumida */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Ingredientes da Receita:</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar pr-1">
                        {(drink.recipe || []).map((r, idx) => {
                          const ing = products.find(p => p.id === r.productId);
                          const ingCost = (ing?.lastCostPrice || 0) * r.quantity;
                          return (
                            <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                                {ing?.isSubRecipe ? '🧪 ' : ''}{ing?.name || 'Insumo'}
                              </span>
                              <span className="text-slate-800 dark:text-slate-200">
                                {r.quantity}{ing?.unitLabel || 'un'} <span className="text-[8px] text-slate-400 font-normal">({formatCurrency(ingCost)})</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Métricas Financeiras */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Preço Venda</p>
                        <p className="text-xs font-black text-slate-800 dark:text-white">{formatCurrency(drink.price)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Custo (CMV)</p>
                        <p className={`text-xs font-black ${drink.cmvPercent <= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {formatCurrency(drink.recipeCost)} ({drink.cmvPercent.toFixed(0)}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Lucro Líq.</p>
                        <p className="text-xs font-black text-emerald-600">+{formatCurrency(drink.grossProfit)}</p>
                      </div>
                    </div>
                  </div>

                  {onViewChange && (
                    <button
                      onClick={() => onViewChange('products')}
                      className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-colors"
                    >
                      Ajustar Ficha / Preço
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: SUB-PREPAROS & BATCHES */}
      {activeTab === 'BATCHES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-purple-50/50 dark:bg-purple-950/20 p-6 rounded-3xl border border-purple-200 dark:border-purple-900/40">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-purple-900 dark:text-purple-300">
                🧪 Sub-preparos & Premixes Artesanais
              </h3>
              <p className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                Xaropes, infusões e pré-misturas com receita própria. Produza lotes refrigerados com cálculo de validade e baixa automática nos insumos.
              </p>
            </div>
            {onViewChange && (
              <button
                onClick={() => onViewChange('products')}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider"
              >
                + Criar Sub-preparo
              </button>
            )}
          </div>

          {/* Cards de Sub-preparos Cadastrados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subRecipes.map(sub => {
              const currentStock = stockBalances[sub.id] || 0;
              return (
                <div key={sub.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] font-black uppercase text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-md">
                          Batch / Sub-preparo
                        </span>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-base mt-1">
                          {sub.name}
                        </h4>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${currentStock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {currentStock} {sub.unitLabel || 'ml'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl text-[10px] space-y-1 font-bold text-slate-600 dark:text-slate-400">
                      <p>Rendimento Padrão: <strong>{sub.yieldQuantity || 1000} {sub.unitLabel || 'ml'}</strong></p>
                      <p>Validade Refrigerada: <strong>{sub.shelfLifeDays || 7} dias</strong></p>
                      <p>Custo Unitário Atual: <strong>R$ {(sub.lastCostPrice || 0).toFixed(4)} / {sub.unitLabel || 'ml'}</strong></p>
                    </div>

                    {/* Ingredientes do Sub-preparo */}
                    <div className="text-[9px] text-slate-400">
                      <p className="font-bold uppercase tracking-wider mb-1">Receita Básica:</p>
                      <div className="flex flex-wrap gap-1">
                        {(sub.recipe || []).map((r, i) => {
                          const ing = products.find(p => p.id === r.productId);
                          return (
                            <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {ing?.name}: {r.quantity}{ing?.unitLabel || 'un'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSubRecipeId(sub.id);
                      setProduceQuantity(String(sub.yieldQuantity || 1000));
                      setCustomShelfDays(String(sub.shelfLifeDays || 7));
                      setIsProduceModalOpen(true);
                    }}
                    className="mt-5 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>⚡</span>
                    <span>Produzir Lote</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Histórico de Lotes Produzidos */}
          <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
              <span>📋</span> Lotes Produzidos Recentemente
            </h4>

            {batchProductions.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold uppercase py-4 text-center">Nenhum lote produzido ainda.</p>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[8px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-2.5">Sub-preparo</th>
                      <th className="py-2.5">Qtd Produzida</th>
                      <th className="py-2.5">Data Produção</th>
                      <th className="py-2.5">Validade</th>
                      <th className="py-2.5">Custo Total</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    {batchProductions.slice(0, 10).map(bat => {
                      const expDate = new Date(bat.expiresAt);
                      const now = new Date();
                      const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / 86400000);
                      const isExpired = daysLeft <= 0;

                      return (
                        <tr key={bat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 font-black text-slate-900 dark:text-white uppercase">{bat.subRecipeName}</td>
                          <td className="py-3">{bat.quantityProduced}</td>
                          <td className="py-3">{new Date(bat.producedAt).toLocaleDateString('pt-BR')}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              isExpired 
                                ? 'bg-rose-100 text-rose-700' 
                                : daysLeft <= 2 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {isExpired ? '🚨 VENCIDO' : daysLeft === 1 ? 'Vence Amanhã' : `Vence em ${daysLeft}d`}
                            </span>
                          </td>
                          <td className="py-3">{formatCurrency(bat.totalCost)}</td>
                          <td className="py-3">
                            <span className="text-[9px] font-black uppercase text-emerald-600">ATIVO</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: PREVENÇÃO DE PERDAS & DESCARTE */}
      {activeTab === 'WASTE' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-rose-50/50 dark:bg-rose-950/20 p-6 rounded-3xl border border-rose-200 dark:border-rose-900/40">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-rose-900 dark:text-rose-300">
                📉 Auditoria de Perdas, Quebras e Vencimentos
              </h3>
              <p className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                Monitore garrafas quebradas, derramamentos no balcão e lotes de xaropes vencidos para apurar o prejuízo real do bar.
              </p>
            </div>
            <button
              onClick={() => setIsWasteModalOpen(true)}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30"
            >
              + Registrar Descarte
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
              <span>📋</span> Histórico de Descarte & Perdas
            </h4>

            {wasteLogs.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold uppercase py-8 text-center">Nenhum registro de perda cadastrado.</p>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[8px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-2.5">Item / Insumo</th>
                      <th className="py-2.5">Qtd Descartada</th>
                      <th className="py-2.5">Motivo</th>
                      <th className="py-2.5">Prejuízo (R$)</th>
                      <th className="py-2.5">Data</th>
                      <th className="py-2.5">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    {wasteLogs.map(w => {
                      const reasonMap = {
                        EXPIRED: '🚨 Vencimento',
                        SPILL_BREAK: '🍾 Quebra/Derramamento',
                        TASTING: '🍸 Degustação/Cortesia',
                        OTHER: 'Outro'
                      };

                      return (
                        <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 font-black text-slate-900 dark:text-white uppercase">{w.productName}</td>
                          <td className="py-3">{w.quantity}</td>
                          <td className="py-3">{reasonMap[w.reason] || w.reason}</td>
                          <td className="py-3 text-rose-600 font-black">{formatCurrency(w.cost)}</td>
                          <td className="py-3">{new Date(w.timestamp).toLocaleDateString('pt-BR')}</td>
                          <td className="py-3 text-slate-400 text-[10px]">{w.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PRODUZIR LOTE */}
      {isProduceModalOpen && activeSubRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-black uppercase text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-md">
                  Ordem de Produção
                </span>
                <h3 className="text-xl font-black uppercase text-slate-800 dark:text-white mt-1">
                  Produzir {activeSubRecipe.name}
                </h3>
              </div>
              <button
                onClick={() => setIsProduceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Qtd a Produzir ({activeSubRecipe.unitLabel || 'ml'})</label>
                <input
                  type="text"
                  value={produceQuantity}
                  onChange={e => setProduceQuantity(sanitizeCurrencyInput(e.target.value))}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-base outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Validade Refrigerada (Dias)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customShelfDays}
                  onChange={e => setCustomShelfDays(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-base outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Consumo de Insumos Calculado */}
            {batchCalculation && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Insumos que serão baixados do estoque:</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pr-1">
                  {batchCalculation.ingredientsWithConsumption.map((ingItem, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">
                        {ingItem.product?.name || 'Insumo'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${ingItem.isShortage ? 'text-rose-600 font-black' : 'text-slate-400'}`}>
                          Saldo: {ingItem.currentStock} {ingItem.unitLabel}
                        </span>
                        <span className="text-rose-600 font-black">
                          -{ingItem.neededQty.toFixed(1)} {ingItem.unitLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-black">
                  <span className="text-slate-500 uppercase">Custo Total do Lote:</span>
                  <span className="text-emerald-600">{formatCurrency(batchCalculation.totalBatchCost)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsProduceModalOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold uppercase text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmProduce}
                className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
              >
                Confirmar Produção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR DESCARTE / PERDA */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-md">
                  Controle de Desperdício
                </span>
                <h3 className="text-xl font-black uppercase text-slate-800 dark:text-white mt-1">
                  Registrar Quebra / Descarte
                </h3>
              </div>
              <button
                onClick={() => setIsWasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Item / Insumo</label>
                <select
                  value={selectedWasteProductId}
                  onChange={e => setSelectedWasteProductId(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase outline-none"
                >
                  <option value="">Selecione o produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.unitLabel ? `(${p.unitLabel})` : ''} - Saldo: {stockBalances[p.id] || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Qtd Descartada</label>
                  <input
                    type="text"
                    placeholder="Ex: 50"
                    value={wasteQuantity}
                    onChange={e => setWasteQuantity(sanitizeCurrencyInput(e.target.value))}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Motivo</label>
                  <select
                    value={wasteReason}
                    onChange={e => setWasteReason(e.target.value as any)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs outline-none"
                  >
                    <option value="EXPIRED">🚨 Vencimento</option>
                    <option value="SPILL_BREAK">🍾 Quebra / Derramamento</option>
                    <option value="TASTING">🍸 Degustação / Cortesia</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Observações (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Garrafa caiu no chão durante o pico do turno"
                  value={wasteNotes}
                  onChange={e => setWasteNotes(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium text-xs outline-none"
                />
              </div>

              {activeWasteProduct && wasteEstimatedCost > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs font-black flex justify-between items-center text-rose-700 dark:text-rose-400">
                  <span>Prejuízo Financeiro Estimado:</span>
                  <span>{formatCurrency(wasteEstimatedCost)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsWasteModalOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold uppercase text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmWaste}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
              >
                Confirmar Descarte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrinksManagement;
