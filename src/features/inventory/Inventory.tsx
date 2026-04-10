
import React, { useState, useMemo } from 'react';
import { Product, StockTransaction, User, formatCurrency, generateUniqueId, parseCurrencyValue, sanitizeCurrencyInput } from '../../types';

interface InventoryProps {
  products: Product[];
  stockTransactions: StockTransaction[];
  onUpdateStock: (transaction: StockTransaction) => Promise<void>;
  currentUser: User;
  activeUnitId: string;
}

const Inventory: React.FC<InventoryProps> = ({ products, stockTransactions, onUpdateStock, currentUser, activeUnitId }) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'HISTORY'>('STOCK');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form States
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [reason, setReason] = useState('Quebra');
  const [isSaving, setIsSaving] = useState(false);

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

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (p.trackStock !== false) && 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm]);

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
      price: type === 'IN' ? numericCost : undefined,
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
    setQty('');
    setCost('');
  };

  const isAdmin = currentUser.username === 'admin' || currentUser.permissions.includes('franchise_admin');

  return (
    <div className="max-w-7xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Controle de Estoque</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão transacional de mercadorias</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
             <button 
                onClick={() => { setSelectedProduct(null); setShowEntryModal(true); }}
                className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
             >
                + Entrada
             </button>
             <button 
                onClick={() => { setSelectedProduct(null); setShowLossModal(true); }}
                className="flex-1 md:flex-none bg-red-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-900/20 active:scale-95 transition-all"
             >
                - Perda
             </button>
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <button onClick={() => setActiveTab('STOCK')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'STOCK' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Saldo Atual</button>
        <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Movimentações</button>
      </div>

      {activeTab === 'STOCK' ? (
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <input 
                type="text" 
                placeholder="BUSCAR PRODUTO OU CATEGORIA..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent p-2 font-black uppercase text-xs outline-none text-slate-800 dark:text-white"
             />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(p => {
                const balance = stockBalances[p.id] || 0;
                
                return (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{p.category}</span>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm mt-1">{p.name}</h4>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-black italic tracking-tighter ${balance > 0 ? 'text-slate-800 dark:text-white' : (balance < 0 ? 'text-red-500' : 'text-slate-300')}`}>
                                {balance.toLocaleString()}
                            </p>
                            <p className="text-[8px] font-black uppercase text-slate-400">Em Estoque</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Último Custo</p>
                            <p className="text-xs font-black text-slate-600 dark:text-slate-300">{formatCurrency(p.lastCostPrice || 0)}</p>
                        </div>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => { setSelectedProduct(p); setShowEntryModal(true); setCost((p.lastCostPrice || 0).toFixed(2).replace('.', ',')); }}
                                title="Lançar Entrada"
                                className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button 
                                onClick={() => { setSelectedProduct(p); setShowLossModal(true); }}
                                title="Lançar Perda"
                                className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                            </button>
                            {isAdmin && (
                                <button 
                                    onClick={() => { setSelectedProduct(p); setQty(balance.toString()); setShowAdjustModal(true); }}
                                    title="Ajustar Estoque"
                                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                                </button>
                            )}
                        </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
      )}

      {(showEntryModal || showLossModal || showAdjustModal) && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => { setShowEntryModal(false); setShowLossModal(false); setShowAdjustModal(false); setSelectedProduct(null); }} />
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                        {showEntryModal ? 'Lançar Entrada' : (showLossModal ? 'Registrar Perda' : 'Ajustar Saldo')}
                    </h3>
                    <button onClick={() => { setShowEntryModal(false); setShowLossModal(false); setShowAdjustModal(false); setSelectedProduct(null); }} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold">✕</button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione o Produto</label>
                        <div className="relative group">
                            <input 
                                type="text"
                                placeholder="BUSCAR PRODUTO..."
                                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all pl-10"
                                onChange={(e) => {
                                    const search = e.target.value.toLowerCase();
                                    const found = products.find(p => p.trackStock !== false && p.name.toLowerCase() === search);
                                    if (found) setSelectedProduct(found);
                                }}
                                list="inventory-prod-list"
                            />
                            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <datalist id="inventory-prod-list">
                                {products.filter(p => p.trackStock !== false).map(p => (
                                    <option key={p.id} value={p.name}>{p.category}</option>
                                ))}
                            </datalist>
                        </div>
                        {selectedProduct && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-top-1">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter italic">Selecionado: {selectedProduct.name}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{showAdjustModal ? 'Novo Saldo Real' : 'Quantidade'}</label>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={qty} 
                                onChange={e => setQty(sanitizeCurrencyInput(e.target.value))} 
                                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                                placeholder="0" 
                            />
                        </div>
                        {showEntryModal && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço de Custo</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                                    <input 
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo</label>
                                <select 
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
    </div>
  );
};

export default Inventory;
