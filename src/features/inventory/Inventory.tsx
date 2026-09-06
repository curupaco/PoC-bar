
import React, { useState, useMemo } from 'react';
import { Product, StockTransaction, User, Sale, Unit, formatCurrency, generateUniqueId, parseCurrencyValue, sanitizeCurrencyInput, ConsignedEvent } from '../../types';
import { useProductIntelligence, ProductInsight } from '../../hooks/useProductIntelligence';

interface InventoryProps {
  products: Product[];
  stockTransactions: StockTransaction[];
  onUpdateStock: (transaction: StockTransaction) => Promise<void>;
  currentUser: User;
  activeUnitId: string;
  sales: Sale[];
  units: Unit[];
  consignedEvents?: ConsignedEvent[];
  setConsignedEvents?: React.Dispatch<React.SetStateAction<ConsignedEvent[]>>;
  persist?: (node: string, data: any, id?: string) => Promise<void>;
  drinksEnabled?: boolean;
}

const Inventory: React.FC<InventoryProps> = ({ 
  products, 
  stockTransactions, 
  onUpdateStock, 
  currentUser, 
  activeUnitId, 
  sales, 
  units, 
  consignedEvents = [], 
  setConsignedEvents, 
  persist,
  drinksEnabled = true
}) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'HISTORY' | 'SUGGESTION' | 'CONSIGNMENT'>('STOCK');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyDeadProducts, setShowOnlyDeadProducts] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  
  // Form States
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [reason, setReason] = useState('Quebra');
  const [isSaving, setIsSaving] = useState(false);

  // Consignment Event States
  const [showConsignModal, setShowConsignModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [consignEventName, setConsignEventName] = useState('');
  const [consignEventType, setConsignEventType] = useState<'NORMAL' | 'OPEN_BAR'>('NORMAL');
  const [consignContractValue, setConsignContractValue] = useState('');
  const [consignItems, setConsignItems] = useState<{ productId: string; loadedQty: number }[]>([]);
  const [tempConsignProductId, setTempConsignProductId] = useState('');
  const [tempConsignQty, setTempConsignQty] = useState('');

  // Reconcile Event States
  const [reconcilingEvent, setReconcilingEvent] = useState<ConsignedEvent | null>(null);
  const [reconcileReturnedMap, setReconcileReturnedMap] = useState<Record<string, string>>({});
  const [reconcileStaff, setReconcileStaff] = useState<{ name: string; amount: number }[]>([]);
  const [tempStaffName, setTempStaffName] = useState('');
  const [tempStaffAmount, setTempStaffAmount] = useState('');

  // Autocomplete para seleção de produto no modal
  const modalFilteredProducts = useMemo(() => {
    if (!modalSearchTerm.trim()) return [];
    const term = modalSearchTerm.toLowerCase();
    return products
      .filter(p => p.trackStock !== false && p.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [products, modalSearchTerm]);

  // Calcula o saldo atual de cada produto
  const stockBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    stockTransactions.forEach(t => {
      if (t.unitId === activeUnitId) {
        balances[t.productId] = (balances[t.productId] || 0) + t.quantity;
      }
    });
    return balances;
  }, [stockTransactions, activeUnitId]);

  const unit = useMemo(() => units.find(u => u.id === activeUnitId), [units, activeUnitId]);
  const isStockEnabled = unit?.useStock !== false;

  // Identifica produtos que não tiveram venda nos últimos 15 dias
  const deadProductIds = useMemo(() => {
    const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);
    const recentSales = sales.filter(s => s.timestamp > fifteenDaysAgo && !s.deleted);
    
    const soldIds = new Set<string>();
    recentSales.forEach(s => {
      s.items?.forEach(item => soldIds.add(item.productId));
    });

    return new Set(
      products
        .filter(p => {
          const balance = stockBalances[p.id] || 0;
          const hasNoSales = !soldIds.has(p.id);
          
          if (isStockEnabled) {
             return balance > 0 && hasNoSales;
          } else {
             return hasNoSales;
          }
        })
        .map(p => p.id)
    );
  }, [products, sales, stockBalances, isStockEnabled]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isDead = deadProductIds.has(p.id);
      if (showOnlyDeadProducts && !isDead) return false;

      return (p.trackStock !== false) && matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, deadProductIds, showOnlyDeadProducts]);

  const history = useMemo(() => {
    return [...stockTransactions]
      .filter(t => t.unitId === activeUnitId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [stockTransactions, activeUnitId]);

  const handleSaveTransaction = async (type: 'IN' | 'LOSS' | 'ADJUST') => {
    if (!selectedProduct) return;
    const numericQty = parseFloat(qty.replace(',', '.'));
    const numericCost = parseCurrencyValue(cost);

    if (isNaN(numericQty) || (type !== 'ADJUST' && numericQty <= 0)) {
        alert("Quantidade inválida");
        return;
    }

    setIsSaving(true);

    let finalQty = numericQty;
    if (type === 'LOSS') finalQty = -numericQty;
    if (type === 'ADJUST') {
        const currentBalance = stockBalances[selectedProduct.id] || 0;
        finalQty = numericQty - currentBalance;
    }

    const transaction: StockTransaction = {
      id: generateUniqueId('stk'),
      productId: selectedProduct.id,
      unitId: activeUnitId,
      quantity: finalQty,
      price: type === 'IN' ? numericCost : (selectedProduct.lastCostPrice || 0),
      type: type === 'LOSS' ? 'LOSS' : (type === 'ADJUST' ? 'ADJUST' : 'IN'),
      reason: type === 'LOSS' ? reason : (type === 'ADJUST' ? 'Ajuste Manual' : undefined),
      timestamp: Date.now(),
      userId: currentUser.id
    };

    await onUpdateStock(transaction);
    
    setIsSaving(false);
    setShowEntryModal(false);
    setShowLossModal(false);
    setShowAdjustModal(false);
    setSelectedProduct(null);
    setModalSearchTerm('');
    setQty('');
    setCost('');
  };

  const handleCreateConsignment = async () => {
    if (!consignEventName.trim()) {
      alert("Nome do evento é obrigatório.");
      return;
    }
    if (consignItems.length === 0) {
      alert("Adicione pelo menos um item à consignação.");
      return;
    }

    setIsSaving(true);
    try {
      const timestamp = Date.now();
      const eventNameUpper = consignEventName.toUpperCase().trim();

      // 1. Gera as transações de saída de estoque para os itens consignados
      for (const item of consignItems) {
        const product = products.find(p => p.id === item.productId);
        const transaction: StockTransaction = {
          id: generateUniqueId('stk'),
          productId: item.productId,
          unitId: activeUnitId,
          quantity: -item.loadedQty,
          price: product?.lastCostPrice || 0,
          type: 'OUT',
          reason: `Carga Consignada: ${eventNameUpper}`,
          timestamp,
          userId: currentUser.id
        };
        await onUpdateStock(transaction);
      }

      // 2. Cria o objeto do evento consignado
      const newEvent: ConsignedEvent = {
        id: generateUniqueId('evt'),
        name: eventNameUpper,
        date: timestamp,
        status: 'PENDING',
        type: consignEventType,
        contractValue: consignEventType === 'OPEN_BAR' ? (parseCurrencyValue(consignContractValue) || 0) : undefined,
        items: consignItems.map(item => ({
          productId: item.productId,
          loadedQty: item.loadedQty
        })),
        unitId: activeUnitId,
        createdAt: timestamp,
        userId: currentUser.id
      };

      // 3. Atualiza estado e persiste
      if (setConsignedEvents && persist) {
        setConsignedEvents(prev => [newEvent, ...prev]);
        await persist('consignedEvents', newEvent, newEvent.id);
      }

      // 4. Limpa estados
      setConsignEventName('');
      setConsignEventType('NORMAL');
      setConsignContractValue('');
      setConsignItems([]);
      setShowConsignModal(false);
    } catch (e) {
      alert("Erro ao salvar consignação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReconcileConsignment = async () => {
    if (!reconcilingEvent) return;

    setIsSaving(true);
    try {
      const timestamp = Date.now();

      // 1. Gera as transações de retorno para o estoque principal (sobras)
      const reconciledItems = reconcilingEvent.items.map(item => {
        const rawRet = reconcileReturnedMap[item.productId] || '0';
        const retQty = parseFloat(rawRet.replace(',', '.'));
        const finalRetQty = isNaN(retQty) ? 0 : Math.min(retQty, item.loadedQty);

        return {
          ...item,
          returnedQty: finalRetQty,
          consumedQty: item.loadedQty - finalRetQty
        };
      });

      for (const item of reconciledItems) {
        if (item.returnedQty && item.returnedQty > 0) {
          const product = products.find(p => p.id === item.productId);
          const transaction: StockTransaction = {
            id: generateUniqueId('stk'),
            productId: item.productId,
            unitId: activeUnitId,
            quantity: item.returnedQty,
            price: product?.lastCostPrice || 0,
            type: 'IN',
            reason: `Retorno Consignado: ${reconcilingEvent.name}`,
            timestamp,
            userId: currentUser.id
          };
          await onUpdateStock(transaction);
        }
      }

      // 2. Atualiza o objeto de evento para RECONCILED
      const updatedEvent: ConsignedEvent = {
        ...reconcilingEvent,
        status: 'RECONCILED',
        reconciledAt: timestamp,
        items: reconciledItems,
        staffExpenses: reconcileStaff
      };

      // 3. Atualiza estado e persiste
      if (setConsignedEvents && persist) {
        setConsignedEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
        await persist('consignedEvents', updatedEvent, updatedEvent.id);
      }

      // 4. Limpa estados
      setReconcilingEvent(null);
      setReconcileReturnedMap({});
      setReconcileStaff([]);
      setShowReconcileModal(false);
    } catch (e) {
      alert("Erro ao reconciliar consignação.");
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = currentUser.username === 'admin' || currentUser.permissions.includes('franchise_admin');
  const canManageStock = currentUser.username === 'admin' || currentUser.permissions.includes('inventory_manage') || currentUser.permissions.includes('products');

  const { insights } = useProductIntelligence(products, sales, stockBalances);
  
  const suggestions = useMemo(() => {
    return Object.values(insights as Record<string, ProductInsight>)
      .filter(i => i.recommendedRestock > 0)
      .sort((a, b) => b.recommendedRestock - a.recommendedRestock);
  }, [insights]);

  if (!isStockEnabled) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-950/30 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-900/10 animate-pulse">
          <span className="text-4xl">📦</span>
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Controle de Estoque Inativo</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4 max-w-lg mx-auto leading-relaxed">
          Esta unidade está configurada para não utilizar o controle de estoque. Para habilitar o inventário, entradas de mercadorias, registro de perdas e relatórios de desperdício:
        </p>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[32px] shadow-sm max-w-md mx-auto mt-8 text-left space-y-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Passo a passo para ativação:</p>
          <ol className="text-xs font-bold text-slate-600 dark:text-slate-300 space-y-3 list-decimal list-inside uppercase tracking-tight">
            <li>Acesse a tela de <strong className="text-red-600">Ajustes</strong> no menu lateral</li>
            <li>Encontre a seção de <strong className="text-red-600">Gerenciamento de Unidades</strong></li>
            <li>Clique no botão para ativar o <strong className="text-red-600">Controle de Estoque</strong> para a unidade ativa</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Controle de Estoque</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão transacional de mercadorias</p>
        </div>
        {canManageStock && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
               <button 
                  onClick={() => { setSelectedProduct(null); setShowEntryModal(true); }}
                  className="flex-1 sm:flex-initial sm:w-36 h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
               >
                  <span>+</span> <span>Entrada</span>
               </button>
               <button 
                  onClick={() => { setSelectedProduct(null); setShowLossModal(true); }}
                  className="flex-1 sm:flex-initial sm:w-36 h-11 sm:h-12 bg-red-600 hover:bg-red-500 text-white px-4 rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest shadow-lg shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
               >
                  <span>-</span> <span>Perda</span>
               </button>
          </div>
        )}
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 bg-white dark:bg-slate-900 p-2 rounded-2xl sm:rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <button onClick={() => setActiveTab('STOCK')} className={`flex-1 min-w-[120px] h-11 sm:h-12 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-[11px] tracking-widest transition-all flex items-center justify-center ${activeTab === 'STOCK' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Saldo Atual</button>
        <button onClick={() => setActiveTab('SUGGESTION')} className={`flex-1 min-w-[120px] h-11 sm:h-12 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-[11px] tracking-widest transition-all flex items-center justify-center ${activeTab === 'SUGGESTION' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Reposição Inteligente</button>
        {drinksEnabled && (
          <button onClick={() => setActiveTab('CONSIGNMENT')} className={`flex-1 min-w-[120px] h-11 sm:h-12 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-[11px] tracking-widest transition-all flex items-center justify-center ${activeTab === 'CONSIGNMENT' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Consignações</button>
        )}
        <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 min-w-[120px] h-11 sm:h-12 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-[11px] tracking-widest transition-all flex items-center justify-center ${activeTab === 'HISTORY' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Movimentações</button>
      </div>

      {activeTab === 'STOCK' ? (
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3 sm:gap-4">
             <div className="flex-1 flex items-center gap-3 w-full px-2">
                <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                    type="text" 
                    placeholder="BUSCAR PRODUTO OU CATEGORIA..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent py-2.5 font-black uppercase text-xs outline-none text-slate-800 dark:text-white"
                    aria-label="Buscar produto ou categoria"
                />
             </div>
             
             <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

             <button 
                onClick={() => setShowOnlyDeadProducts(!showOnlyDeadProducts)}
                className={`w-full md:w-auto h-11 sm:h-12 flex items-center justify-center gap-2 px-4 rounded-2xl transition-all ${showOnlyDeadProducts ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 border border-orange-200 dark:border-orange-800/50' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent'}`}
                aria-label="Filtrar produtos sem giro"
             >
                <div className={`w-2 h-2 rounded-full shrink-0 ${deadProductIds.size > 0 ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Itens Parados ({deadProductIds.size})</span>
             </button>
           </div>

           {deadProductIds.size > 0 && !showOnlyDeadProducts && (
               <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-4 rounded-2xl border border-orange-500/20 animate-in slide-in-from-top-2">
                   <div className="flex items-center gap-3">
                       <span className="text-xl">💡</span>
                       <p className="text-[11px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-tight">
                           Detectamos **{deadProductIds.size} itens** sem giro nos últimos 15 dias. Clique em "Itens Parados" para analisar.
                       </p>
                   </div>
               </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(p => {
                const balance = stockBalances[p.id] || 0;
                
                return (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{p.category}</span>
                                {p.isRawMaterial && (
                                    <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-md">Insumo</span>
                                )}
                                {deadProductIds.has(p.id) && (
                                    <span className="text-[8px] font-black uppercase text-white bg-orange-500 px-2 py-0.5 rounded-md animate-pulse">🚨 Parado</span>
                                )}
                            </div>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm mt-1">{p.name}</h4>
                        </div>
                        <div className="text-right">
                            <p className={`text-xl font-black italic tracking-tighter ${balance > 0 ? 'text-slate-800 dark:text-white' : (balance < 0 ? 'text-red-500' : 'text-slate-300')}`}>
                                {balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} <span className="text-xs normal-case">{p.unitLabel || 'un'}</span>
                            </p>
                            <p className="text-[8px] font-black uppercase text-slate-400">Em Estoque</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Último Custo</p>
                            <p className="text-xs font-black text-slate-600 dark:text-slate-300">{formatCurrency(p.lastCostPrice || 0)}</p>
                        </div>
                        {canManageStock && (
                          <div className="flex gap-1">
                              <button 
                                  onClick={() => { setSelectedProduct(p); setShowEntryModal(true); setCost((p.lastCostPrice || 0).toFixed(2).replace('.', ',')); }}
                                  title="Lançar Entrada"
                                  aria-label={`Lançar entrada para ${p.name}`}
                                  className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                              </button>
                              <button 
                                  onClick={() => { setSelectedProduct(p); setShowLossModal(true); }}
                                  title="Lançar Perda"
                                  aria-label={`Lançar perda para ${p.name}`}
                                  className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                              </button>
                              {isAdmin && (
                                  <button 
                                      onClick={() => { setSelectedProduct(p); setQty(balance.toString()); setShowAdjustModal(true); }}
                                      title="Ajustar Estoque"
                                      aria-label={`Ajustar estoque para ${p.name}`}
                                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all"
                                  >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                                  </button>
                              )}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      ) : activeTab === 'SUGGESTION' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="bg-gradient-to-r from-red-600 to-red-900 p-8 rounded-[40px] text-white shadow-xl shadow-red-900/20">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Sugestão de Reposição Inteligente</h3>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest max-w-2xl">Baseado na média de vendas dos últimos 7 dias com margem de segurança de 20% para cobrir a próxima semana.</p>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {suggestions.length > 0 ? suggestions.map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div key={item.productId} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center group hover:border-red-500 transition-all">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{product?.category}</p>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase leading-none italic">{product?.name}</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Média Semanal: {item.averageWeeklySales.toFixed(1)} {product?.sellType === 'weight' ? 'kg' : 'un'}</p>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Comprar</p>
                        <p className="text-3xl font-black text-red-600 italic tracking-tighter">+{item.recommendedRestock}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const text = `🛒 *LISTA DE COMPRAS - BOTEQUISTA*\n\nProduto: ${product?.name}\nSugestão: ${item.recommendedRestock} ${product?.sellType === 'weight' ? 'kg' : 'un'}\nEstoque Atual: ${item.currentStock}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        aria-label="Enviar lista de compras pelo WhatsApp"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2c-5.508 0-9.987 4.479-9.987 9.988 0 1.757.455 3.409 1.251 4.848l-1.276 4.656 4.75-1.246c1.408.766 3.013 1.206 4.717 1.206 5.508 0 9.988-4.479 9.988-9.988 0-5.509-4.48-9.988-9.988-9.988zm5.292 13.513c-.224.633-1.136 1.173-1.566 1.226-.419.051-.771.126-2.836-.693-2.496-.989-4.091-3.52-4.217-3.69-.127-.17-1.017-1.351-1.017-2.576 0-1.224.633-1.827.859-2.08.225-.253.493-.317.658-.317.164 0 .328.002.473.01.15.006.353-.058.552.423.2.483.684 1.666.743 1.786.059.12.098.26.019.414-.079.155-.118.252-.236.387-.118.136-.247.303-.35.408-.114.116-.233.243-.1.472.134.228.594.98 1.272 1.584.873.778 1.611 1.019 1.839 1.133.227.113.361.095.494-.059.134-.153.574-.668.728-.897.153-.228.307-.191.513-.113.205.077 1.309.617 1.533.729.224.112.373.168.429.262.056.094.056.546-.168 1.179z"/></svg>
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="lg:col-span-2 py-24 flex flex-col items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] opacity-50">
                  <span className="text-6xl mb-6">📉</span>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400">Sem recomendações no momento</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">Continue vendendo para alimentar a inteligência do bar.</p>
                </div>
              )}
            </div>
         </div>
      ) : activeTab === 'CONSIGNMENT' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-black uppercase text-slate-800 dark:text-white italic">Eventos Externos / Consignações</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Carga e reconciliação de estoque por evento</p>
            </div>
            <button 
              onClick={() => {
                setConsignEventName('');
                setConsignEventType('NORMAL');
                setConsignContractValue('');
                setConsignItems([]);
                setShowConsignModal(true);
              }}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all w-full md:w-auto"
            >
              Nova Consignação
            </button>
          </div>

          <div className="space-y-6">
            {consignedEvents.filter(e => e.unitId === activeUnitId).length > 0 ? (
              consignedEvents.filter(e => e.unitId === activeUnitId).map(event => {
                // Calculate P&L if reconciled
                const eventSales = sales.filter(s => s.eventId === event.id && !s.deleted);
                const salesTotal = eventSales.reduce((sum, s) => sum + s.total, 0);
                const contractVal = event.contractValue || 0;
                const totalRevenue = salesTotal + contractVal;
                const cmvTotal = event.items.reduce((sum, item) => {
                  const prod = products.find(p => p.id === item.productId);
                  const costPrice = prod?.lastCostPrice || 0;
                  const consumed = item.consumedQty || 0;
                  return sum + (consumed * costPrice);
                }, 0);
                const staffExpTotal = event.staffExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
                const netProfit = totalRevenue - cmvTotal - staffExpTotal;

                return (
                  <div key={event.id} className={`bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 ${event.status === 'PENDING' ? 'border-l-amber-500' : 'border-l-emerald-500'} space-y-6`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${event.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {event.status === 'PENDING' ? 'Pendente' : 'Reconciliado'}
                          </span>
                          <span className="text-[8px] font-black uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 px-2 py-0.5 rounded">
                            {event.type === 'OPEN_BAR' ? 'OPEN BAR 🍸' : 'NORMAL 💵'}
                          </span>
                          {event.contractValue !== undefined && (
                            <span className="text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                              Contrato: {formatCurrency(event.contractValue)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-slate-800 dark:text-white uppercase mt-1 italic tracking-tight">{event.name}</h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{new Date(event.date).toLocaleDateString('pt-BR')} às {new Date(event.date).toLocaleTimeString('pt-BR')}</p>
                      </div>

                      {event.status === 'PENDING' ? (
                        <button 
                          onClick={() => {
                            setReconcilingEvent(event);
                            const initialReturned: Record<string, string> = {};
                            event.items.forEach(it => {
                              initialReturned[it.productId] = '0';
                            });
                            setReconcileReturnedMap(initialReturned);
                            setReconcileStaff([]);
                            setShowReconcileModal(true);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-md active:scale-95 transition-all w-full md:w-auto"
                        >
                          Reconciliar Estoque
                        </button>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Resultado Evento</span>
                          <span className={`text-xl font-black italic tracking-tighter ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {formatCurrency(netProfit)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tabela de Itens Consignados */}
                    <div className="overflow-x-auto no-scrollbar border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-black uppercase text-[8px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="p-3">Produto</th>
                            <th className="p-3 text-center">Carga Inicial</th>
                            {event.status === 'RECONCILED' && (
                              <>
                                <th className="p-3 text-center">Sobras (Retorno)</th>
                                <th className="p-3 text-center">Consumo Líquido</th>
                                <th className="p-3 text-right">Preço Custo (CMV)</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                          {event.items.map(it => {
                            const prod = products.find(p => p.id === it.productId);
                            return (
                              <tr key={it.productId} className="border-b border-slate-50 dark:border-slate-800 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="p-3">{prod?.name || 'Item Removido'}</td>
                                <td className="p-3 text-center">{it.loadedQty} {prod?.unitLabel || 'un'}</td>
                                {event.status === 'RECONCILED' && (
                                  <>
                                    <td className="p-3 text-center text-amber-600">{it.returnedQty ?? 0} {prod?.unitLabel || 'un'}</td>
                                    <td className="p-3 text-center text-emerald-600 font-black">{it.consumedQty ?? 0} {prod?.unitLabel || 'un'}</td>
                                    <td className="p-3 text-right text-slate-400">{formatCurrency((it.consumedQty ?? 0) * (prod?.lastCostPrice || 0))}</td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* DRE / P&L Card se Reconciliado */}
                    {event.status === 'RECONCILED' && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Faturamento (Contrato + POS)</p>
                          <p className="text-base font-black text-slate-800 dark:text-white italic">{formatCurrency(totalRevenue)}</p>
                          <p className="text-[7px] font-medium text-slate-400">Contrato: {formatCurrency(contractVal)} | PDV: {formatCurrency(salesTotal)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase">CMV Real dos Insumos</p>
                          <p className="text-base font-black text-red-500 italic">-{formatCurrency(cmvTotal)}</p>
                          <p className="text-[7px] font-medium text-slate-400">Baseado no custo de compra</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Despesas de Equipe</p>
                          <p className="text-base font-black text-red-500 italic">-{formatCurrency(staffExpTotal)}</p>
                          <p className="text-[7px] font-medium text-slate-400">{event.staffExpenses?.length || 0} prestadores pagos</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Lucro Líquido</p>
                          <p className={`text-base font-black italic ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {formatCurrency(netProfit)}
                          </p>
                          <p className="text-[7px] font-medium text-slate-400">Margem: {totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(0)}%` : '0%'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-24 flex flex-col items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] opacity-50">
                <span className="text-6xl mb-6">🚚</span>
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Sem eventos consignados registrados</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">Cadastre um evento externo para controlar estoque e lucratividade.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Visualização de Tabela para Desktop */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Data/Hora</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Produto</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Qtd</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Custo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.slice(0, 100).map(t => {
                    const product = products.find(p => p.id === t.productId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{new Date(t.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{product?.name || 'Item Removido'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            t.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 
                            (t.type === 'LOSS' ? 'bg-red-100 text-red-600' : 
                            (t.type === 'OUT' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'))
                          }`}>
                            {t.type === 'IN' ? 'Entrada' : (t.type === 'LOSS' ? `Perda (${t.reason})` : (t.type === 'OUT' ? 'Venda' : 'Ajuste'))}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-xs font-black text-right ${t.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {t.quantity > 0 ? '+' : ''}{t.quantity}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 text-right">
                          {t.price ? formatCurrency(t.price) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visualização de Cards para Mobile */}
          <div className="block md:hidden space-y-3 animate-in fade-in">
            {history.slice(0, 50).map(t => {
              const product = products.find(p => p.id === t.productId);
              const isPositive = t.quantity > 0;
              const borderAccentColor = t.type === 'IN' ? 'border-l-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5' : 
                                       t.type === 'LOSS' ? 'border-l-red-500 bg-red-50/10 dark:bg-red-950/5' : 
                                       t.type === 'OUT' ? 'border-l-blue-500 bg-blue-50/10 dark:bg-blue-950/5' : 
                                       'border-l-slate-400 bg-slate-50/20 dark:bg-slate-900/10';
              
              return (
                <div key={t.id} className={`p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 border-l-4 ${borderAccentColor} flex flex-col gap-3 shadow-sm`}>
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">{product?.category || 'GERAL'}</p>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase truncate mt-1">{product?.name || 'Item Removido'}</h4>
                      <p className="text-[9px] font-bold text-slate-400 mt-1">
                        {new Date(t.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-base font-black italic tracking-tighter leading-none ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{t.quantity}
                      </p>
                      {t.price && (
                        <p className="text-[9px] font-bold text-slate-400 mt-1.5">{formatCurrency(t.price)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/50">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      t.type === 'IN' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-400' : 
                      (t.type === 'LOSS' ? 'bg-red-100 text-red-600 dark:bg-red-950/45 dark:text-red-400' : 
                      (t.type === 'OUT' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/45 dark:text-blue-400' : 
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'))
                    }`}>
                      {t.type === 'IN' ? 'Entrada' : (t.type === 'LOSS' ? `Perda (${t.reason})` : (t.type === 'OUT' ? 'Venda' : 'Ajuste'))}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400">Op: {t.userId ? 'Funcionário' : 'Admin'}</span>
                  </div>
                </div>
              );
            })}
            {history.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-bold uppercase text-[10px] tracking-widest italic opacity-40">Nenhuma movimentação registrada</div>
            )}
          </div>
        </div>
      )}

      {(showEntryModal || showLossModal || showAdjustModal) && (
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => { setShowEntryModal(false); setShowLossModal(false); setShowAdjustModal(false); setSelectedProduct(null); setModalSearchTerm(''); }} />
            <div className="bg-white dark:bg-slate-900 w-full max-w-full md:max-w-lg rounded-t-[40px] md:rounded-[40px] p-8 md:p-10 shadow-2xl relative z-10 border-t md:border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom md:zoom-in-95 transition-all max-h-[92vh] md:max-h-auto overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                        {showEntryModal ? 'Lançar Entrada' : (showLossModal ? 'Registrar Perda' : 'Ajustar Saldo')}
                    </h3>
                    <button onClick={() => { setShowEntryModal(false); setShowLossModal(false); setShowAdjustModal(false); setSelectedProduct(null); setModalSearchTerm(''); }} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold" aria-label="Fechar modal de estoque">✕</button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="inventory-product-search" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione o Produto</label>
                        <div className="relative">
                            <input 
                                id="inventory-product-search"
                                type="text"
                                placeholder="DIGITE PARA BUSCAR PRODUTO..."
                                value={selectedProduct ? selectedProduct.name : modalSearchTerm}
                                onChange={(e) => {
                                    const search = e.target.value;
                                    if (selectedProduct) {
                                      setSelectedProduct(null);
                                    }
                                    setModalSearchTerm(search);
                                }}
                                autoFocus
                                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all pl-10"
                            />
                            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            
                            {selectedProduct && (
                              <button 
                                onClick={() => {
                                  setSelectedProduct(null);
                                  setModalSearchTerm('');
                                }} 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-wider"
                                title="Limpar seleção"
                                type="button"
                              >
                                Limpar
                              </button>
                            )}
                        </div>

                        {/* Autocomplete sugerido para mobile/desktop */}
                        {!selectedProduct && modalSearchTerm && (
                          <div className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 animate-in fade-in slide-in-from-top-1 max-h-48 overflow-y-auto no-scrollbar animate-duration-200">
                            {modalFilteredProducts.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setModalSearchTerm('');
                                  if (showEntryModal) {
                                    setCost((p.lastCostPrice || 0).toFixed(2).replace('.', ','));
                                  }
                                }}
                                className="w-full text-left p-3.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all flex items-center justify-between text-xs font-black uppercase text-slate-700 dark:text-slate-300"
                              >
                                <span>{p.name}</span>
                                <span className="text-[8px] font-black uppercase bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{p.category}</span>
                              </button>
                            ))}
                            {modalFilteredProducts.length === 0 && (
                              <p className="text-[9px] font-bold text-slate-400 text-center py-4 uppercase italic">Nenhum produto encontrado</p>
                            )}
                          </div>
                        )}
                        
                        {selectedProduct && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-top-1">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter italic">✓ Produto Selecionado: {selectedProduct.name}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="inventory-qty-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{showAdjustModal ? 'Novo Saldo Real' : 'Quantidade'}</label>
                            <div className="relative">
                                <input 
                                    id="inventory-qty-input"
                                    type="text" 
                                    inputMode="decimal"
                                    value={qty} 
                                    onChange={e => setQty(sanitizeCurrencyInput(e.target.value))} 
                                    className="w-full pr-16 pl-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                                    placeholder="0" 
                                />
                                {selectedProduct?.unitLabel && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400 uppercase">
                                        {selectedProduct.unitLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                        {showEntryModal && (
                            <div className="space-y-2">
                                <label htmlFor="inventory-cost-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço de Custo</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                                    <input 
                                        id="inventory-cost-input"
                                        type="text" 
                                        inputMode="decimal"
                                        value={cost} 
                                        onChange={e => setCost(sanitizeCurrencyInput(e.target.value))} 
                                        className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                                        placeholder="0,00" 
                                    />
                                </div>
                            </div>
                        )}
                        {showLossModal && (
                            <div className="space-y-2">
                                <label htmlFor="inventory-reason-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo</label>
                                <select 
                                    id="inventory-reason-select"
                                    value={reason} 
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                >
                                    <option value="Quebra">Quebra</option>
                                    <option value="Vencimento">Vencimento</option>
                                    <option value="Consumo Equipe">Consumo Equipe</option>
                                    <option value="Erro de Preparo">Erro de Preparo</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <button 
                        disabled={isSaving || !selectedProduct || !qty}
                        onClick={() => handleSaveTransaction(showEntryModal ? 'IN' : (showLossModal ? 'LOSS' : 'ADJUST'))}
                        className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all ${
                            showEntryModal ? 'bg-emerald-600 text-white' : (showLossModal ? 'bg-red-600 text-white' : 'bg-slate-900 text-white')
                        } disabled:opacity-50`}
                    >
                        {isSaving ? 'Salvando...' : 'Confirmar Registro'}
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* MODAL DE NOVA CONSIGNAÇÃO */}
      {showConsignModal && (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setShowConsignModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-full md:max-w-lg rounded-t-[40px] md:rounded-[40px] p-8 md:p-10 shadow-2xl relative z-10 border-t md:border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom md:zoom-in-95 transition-all max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col">
            
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Nova Consignação</h3>
              <button onClick={() => setShowConsignModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold">✕</button>
            </div>

            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Evento</label>
                <input 
                  type="text" 
                  value={consignEventName} 
                  onChange={e => setConsignEventName(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                  placeholder="EX: CASAMENTO ANA & PEDRO" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                  <select 
                    value={consignEventType} 
                    onChange={e => setConsignEventType(e.target.value as 'NORMAL' | 'OPEN_BAR')}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  >
                    <option value="NORMAL">Normal (Preço Bar)</option>
                    <option value="OPEN_BAR">Open Bar (Preço R$ 0)</option>
                  </select>
                </div>
                {consignEventType === 'OPEN_BAR' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Contrato (Receita)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={consignContractValue} 
                        onChange={e => setConsignContractValue(sanitizeCurrencyInput(e.target.value))} 
                        className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-base outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                        placeholder="0,00" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form de adicionar item à carga */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Adicionar Produtos para Carga</label>
                <div className="flex gap-2">
                  <select
                    value={tempConsignProductId}
                    onChange={e => setTempConsignProductId(e.target.value)}
                    className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase outline-none"
                  >
                    <option value="">Selecionar Produto...</option>
                    {products
                      .filter(p => p.trackStock !== false && !consignItems.some(i => i.productId === p.id))
                      .map(p => {
                        const bal = stockBalances[p.id] || 0;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} (Saldo: {bal} {p.unitLabel || 'un'})
                          </option>
                        );
                      })}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Qtd"
                    value={tempConsignQty}
                    onChange={e => setTempConsignQty(sanitizeCurrencyInput(e.target.value))}
                    className="w-20 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-sm text-center outline-none"
                  />
                  <button
                    onClick={() => {
                      const qtyVal = parseFloat(tempConsignQty.replace(',', '.'));
                      if (!tempConsignProductId) return;
                      if (isNaN(qtyVal) || qtyVal <= 0) return;
                      setConsignItems(prev => [...prev, { productId: tempConsignProductId, loadedQty: qtyVal }]);
                      setTempConsignProductId('');
                      setTempConsignQty('');
                    }}
                    className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lista de carga atual */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Itens Consignados ({consignItems.length})</label>
                {consignItems.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-48 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-950 p-2 space-y-2">
                    {consignItems.map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-black uppercase">
                          <span className="text-slate-800 dark:text-white truncate max-w-[200px]">{prod?.name}</span>
                          <div className="flex items-center gap-3">
                            <span>{item.loadedQty} {prod?.unitLabel || 'un'}</span>
                            <button 
                              onClick={() => setConsignItems(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 font-bold p-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400 text-center py-6 uppercase bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">Carga vazia. Adicione itens acima.</p>
                )}
              </div>

              <button 
                disabled={isSaving || !consignEventName || consignItems.length === 0}
                onClick={handleCreateConsignment}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 mt-4"
              >
                {isSaving ? 'Salvando...' : 'Confirmar Envio (Carga)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECONCILIAÇÃO */}
      {showReconcileModal && reconcilingEvent && (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setShowReconcileModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-full md:max-w-xl rounded-t-[40px] md:rounded-[40px] p-8 md:p-10 shadow-2xl relative z-10 border-t md:border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom md:zoom-in-95 transition-all max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col">
            
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Reconciliar Estoque</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Evento: {reconcilingEvent.name}</p>
              </div>
              <button onClick={() => setShowReconcileModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold">✕</button>
            </div>

            <div className="space-y-6 flex-1">
              {/* Lista de itens para digitar o retorno */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Insira a Quantidade que Sobrou (Retornou Fechada)</label>
                <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar pr-1">
                  {reconcilingEvent.items.map(it => {
                    const prod = products.find(p => p.id === it.productId);
                    return (
                      <div key={it.productId} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-black uppercase gap-4">
                        <div className="flex-1">
                          <span className="text-slate-800 dark:text-white truncate block">{prod?.name}</span>
                          <span className="text-[9px] font-bold text-slate-400">Enviado: {it.loadedQty} {prod?.unitLabel || 'un'}</span>
                        </div>
                        <div className="relative w-32 shrink-0">
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={reconcileReturnedMap[it.productId] || ''}
                            onChange={e => setReconcileReturnedMap(prev => ({ ...prev, [it.productId]: sanitizeCurrencyInput(e.target.value) }))}
                            className="w-full pr-12 pl-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-center text-sm outline-none"
                            placeholder="0"
                          />
                          {prod?.unitLabel && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400">{prod.unitLabel}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Registro de despesas de staff */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Lançar Despesa de Staff (Equipe / Garçom)</label>
                
                {reconcileStaff.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                    {reconcileStaff.map((st, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-[10px] font-bold uppercase border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300">{st.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-500 font-black">{formatCurrency(st.amount)}</span>
                          <button onClick={() => setReconcileStaff(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 font-bold" type="button">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome (ex: Garçom João)"
                    value={tempStaffName}
                    onChange={e => setTempStaffName(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase outline-none"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Valor"
                      value={tempStaffAmount}
                      onChange={e => setTempStaffAmount(sanitizeCurrencyInput(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-xs outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const amountVal = parseCurrencyValue(tempStaffAmount);
                      if (!tempStaffName.trim()) return;
                      if (isNaN(amountVal) || amountVal <= 0) return;
                      setReconcileStaff(prev => [...prev, { name: tempStaffName.toUpperCase().trim(), amount: amountVal }]);
                      setTempStaffName('');
                      setTempStaffAmount('');
                    }}
                    className="px-3 py-2.5 bg-red-600 text-white font-black uppercase text-[10px] rounded-xl"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                disabled={isSaving}
                onClick={handleReconcileConsignment}
                className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all mt-4"
              >
                {isSaving ? 'Salvando...' : 'Confirmar Reconciliação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
