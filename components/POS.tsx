
import React, { useState } from 'react';
import { Product, Sale, SaleItem, PaymentMethod, Tab } from '../types';

interface POSProps {
  products: Product[];
  openTabs: Tab[];
  onUpdateTabs: (tabs: Tab[]) => void;
  onCompleteSale: (sale: Sale) => void;
}

const POS: React.FC<POSProps> = ({ products, openTabs, onUpdateTabs, onCompleteSale }) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTabName, setNewTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.CASH);
  
  // Peso modal state
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [inputGrams, setInputGrams] = useState('');

  const activeTab = openTabs.find(t => t.id === activeTabId);

  const handleCreateTab = () => {
    if (!newTabName.trim()) return;
    const newTab: Tab = {
      id: Date.now().toString(),
      name: newTabName,
      items: [],
      openedAt: Date.now()
    };
    onUpdateTabs([...openTabs, newTab]);
    setActiveTabId(newTab.id);
    setNewTabName('');
    setIsAddingTab(false);
  };

  const addToTab = (product: Product, quantity: number = 1) => {
    if (!activeTabId) return;

    const tabs = openTabs.map(tab => {
      if (tab.id === activeTabId) {
        const existing = tab.items.find(i => i.productId === product.id);
        if (existing && product.sellType === 'unit') {
          return {
            ...tab,
            items: tab.items.map(i => i.productId === product.id 
              ? { ...i, quantity: i.quantity + quantity, totalPrice: (i.quantity + quantity) * i.unitPrice }
              : i
            )
          };
        }
        return {
          ...tab,
          items: [...tab.items, {
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            unitPrice: product.price,
            totalPrice: quantity * product.price
          }]
        };
      }
      return tab;
    });
    onUpdateTabs(tabs);
  };

  const removeFromTab = (productId: string) => {
    const tabs = openTabs.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, items: tab.items.filter(i => i.productId !== productId) };
      }
      return tab;
    });
    onUpdateTabs(tabs);
  };

  const finishSale = () => {
    if (!activeTab || activeTab.items.length === 0) return;
    
    const total = activeTab.items.reduce((acc, i) => acc + i.totalPrice, 0);
    const sale: Sale = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      items: activeTab.items,
      paymentMethod: selectedPayment,
      total,
      tabName: activeTab.name
    };

    onCompleteSale(sale);
    onUpdateTabs(openTabs.filter(t => t.id !== activeTabId));
    setActiveTabId(null);
    alert('Comanda fechada com sucesso!');
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = Array.from(new Set(products.map(p => p.category)));

  if (!activeTabId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Comandas Abertas</h2>
          {!isAddingTab && (
            <button onClick={() => setIsAddingTab(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg">
              Abrir Nova Mesa
            </button>
          )}
        </div>

        {isAddingTab && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-500 shadow-xl flex gap-3 animate-in fade-in zoom-in-95">
            <input 
              autoFocus
              value={newTabName} 
              onChange={e => setNewTabName(e.target.value)}
              placeholder="Nome da mesa ou cliente (Ex: Mesa 05)"
              className="flex-1 px-4 py-2 rounded-xl dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-800"
              onKeyDown={e => e.key === 'Enter' && handleCreateTab()}
            />
            <button onClick={handleCreateTab} className="bg-red-600 text-white px-6 rounded-xl font-bold">Criar</button>
            <button onClick={() => setIsAddingTab(false)} className="text-slate-400 font-bold px-4">Cancelar</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {openTabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-600 transition-all text-left group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">🍺</span>
                <span className="text-[10px] font-bold text-slate-400">ABERTA HÁ {Math.floor((Date.now() - tab.openedAt) / 60000)} MIN</span>
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase truncate">{tab.name}</h3>
              <p className="text-red-600 dark:text-red-400 font-black mt-2">
                R$ {tab.items.reduce((acc, i) => acc + i.totalPrice, 0).toFixed(2)}
              </p>
              <div className="mt-4 text-xs text-slate-400 font-bold uppercase">{tab.items.length} ITENS</div>
            </button>
          ))}
          {openTabs.length === 0 && !isAddingTab && (
            <div className="col-span-full py-20 text-center text-slate-400 italic">
              Nenhuma comanda aberta no momento. Clique em "Abrir Nova Mesa" para começar.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative">
      {/* Botão Voltar */}
      <button 
        onClick={() => setActiveTabId(null)}
        className="lg:hidden bg-slate-200 dark:bg-slate-800 p-2 rounded-lg mb-2 self-start font-bold text-xs"
      >
        ← Voltar para mesas
      </button>

      {/* Menu de Produtos */}
      <div className="flex-1 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <button onClick={() => setActiveTabId(null)} className="hidden lg:flex bg-slate-100 dark:bg-slate-800 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
             🔙
          </button>
          <input 
            type="text" 
            placeholder="Pesquisar no cardápio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none dark:text-white font-medium"
          />
        </div>

        {categories.map(cat => (
          <div key={cat} className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">{cat}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.filter(p => p.category === cat).map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.sellType === 'weight') {
                      setWeightModalProduct(p);
                    } else {
                      addToTab(p, 1);
                    }
                  }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 active:scale-95 transition-all text-left"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 truncate">{p.name}</p>
                  <p className="text-sm font-black text-red-600">R$ {p.price.toFixed(2)}{p.sellType === 'weight' ? '/kg' : ''}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detalhe da Comanda / Carrinho */}
      <div className="w-full lg:w-96 flex flex-col h-auto lg:h-[calc(100vh-140px)] sticky top-24">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-red-600 text-white flex justify-between items-center">
            <h3 className="font-black uppercase tracking-tighter">{activeTab?.name}</h3>
            <span className="text-[10px] bg-black/20 px-2 py-1 rounded-full">ID: {activeTab?.id}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab?.items.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.productName}</p>
                  <p className="text-[10px] text-slate-400">
                    {item.quantity >= 1 && Number.isInteger(item.quantity) 
                      ? `${item.quantity} unidades` 
                      : `${(item.quantity * 1000).toFixed(0)}g`
                    } à R$ {item.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-black dark:text-white">R$ {item.totalPrice.toFixed(2)}</p>
                  <button onClick={() => removeFromTab(item.productId)} className="text-red-500 hover:bg-red-50 p-1 rounded-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
            {activeTab?.items.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center opacity-40 text-slate-500 italic text-sm text-center">
                Comanda vazia.<br/>Toque nos produtos ao lado para adicionar.
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-slate-400">SUBTOTAL</span>
               <span className="text-2xl font-black text-slate-900 dark:text-white">
                 R$ {activeTab?.items.reduce((acc, i) => acc + i.totalPrice, 0).toFixed(2)}
               </span>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase">Forma de Recebimento</label>
               <div className="grid grid-cols-2 gap-2">
                 {Object.values(PaymentMethod).map(m => (
                   <button 
                     key={m} 
                     onClick={() => setSelectedPayment(m)}
                     className={`py-2 rounded-lg text-[10px] font-black border transition-all ${selectedPayment === m ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                   >
                     {m}
                   </button>
                 ))}
               </div>
             </div>

             <button 
               disabled={!activeTab || activeTab.items.length === 0}
               onClick={finishSale}
               className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
             >
               FECHAR COMANDA
             </button>
          </div>
        </div>
      </div>

      {/* Modal de Peso */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase mb-1">{weightModalProduct.name}</h4>
            <p className="text-sm text-slate-500 mb-6">Informe o peso em gramas (ex: 350 para 350g)</p>
            
            <div className="relative mb-6">
              <input 
                autoFocus
                type="number" 
                value={inputGrams}
                onChange={e => setInputGrams(e.target.value)}
                placeholder="0"
                className="w-full text-4xl font-black p-4 text-center rounded-2xl bg-slate-100 dark:bg-slate-950 dark:text-white border-2 border-red-500"
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputGrams) {
                    const kg = parseFloat(inputGrams) / 1000;
                    addToTab(weightModalProduct, kg);
                    setWeightModalProduct(null);
                    setInputGrams('');
                  }
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">gramas</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  if (!inputGrams) return;
                  const kg = parseFloat(inputGrams) / 1000;
                  addToTab(weightModalProduct, kg);
                  setWeightModalProduct(null);
                  setInputGrams('');
                }}
                className="bg-red-600 text-white py-3 rounded-xl font-bold"
              >
                Confirmar
              </button>
              <button 
                onClick={() => { setWeightModalProduct(null); setInputGrams(''); }}
                className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-3 rounded-xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
