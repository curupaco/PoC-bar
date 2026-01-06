
import React, { useState } from 'react';
import { Product, Sale, SaleItem, PaymentMethod } from '../types';

interface POSProps {
  products: Product[];
  onCompleteSale: (sale: Sale) => void;
}

const POS: React.FC<POSProps> = ({ products, onCompleteSale }) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  const handleFinishSale = () => {
    if (cart.length === 0) return;

    const newSale: Sale = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      items: [...cart],
      paymentMethod: selectedPayment,
      total: cartTotal
    };

    onCompleteSale(newSale);
    setCart([]);
    alert('Venda registrada com sucesso!');
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 pb-20 lg:pb-0">
      {/* Seleção de Produtos */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-3 lg:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors sticky top-20 lg:static z-20">
          <input 
            type="text" 
            placeholder="Pesquisar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 lg:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-white border-none focus:ring-2 focus:ring-red-500 text-sm lg:text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {filteredProducts.map(p => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-400 dark:hover:border-red-600 active:scale-95 transition-all text-left group flex lg:block items-center justify-between"
            >
              <div className="flex items-center lg:block">
                <div className="h-10 w-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 lg:mb-3 mr-3 lg:mr-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  🍺
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-0.5">{p.name}</h4>
                  <p className="text-red-600 dark:text-red-400 font-bold text-xs lg:text-sm">R$ {p.price.toFixed(2)}</p>
                </div>
              </div>
              <span className="lg:hidden text-slate-300 dark:text-slate-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Carrinho / Comanda */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl lg:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col lg:h-[calc(100vh-140px)] lg:sticky lg:top-24 transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-base lg:text-lg font-bold text-slate-800 dark:text-slate-100">Comanda</h3>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 font-bold">
            {cart.length} itens
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] lg:max-h-none">
          {cart.map(item => (
            <div key={item.productId} className="flex items-center justify-between group animate-in fade-in slide-in-from-right-1">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-200">{item.productName}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <button 
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-red-100 active:scale-90"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-4 text-center dark:text-slate-300">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-red-100 active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">R$ {item.totalPrice.toFixed(2)}</p>
                <button 
                  onClick={() => removeFromCart(item.productId)}
                  className="text-[10px] text-rose-500 font-bold uppercase lg:opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-2 opacity-60">
              <span className="text-3xl lg:text-4xl">🛒</span>
              <p className="text-xs lg:text-sm font-medium text-center">Nenhum item adicionado.</p>
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pagamento</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 lg:gap-2">
              {Object.values(PaymentMethod).map(method => (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  className={`px-1 py-2 text-[9px] lg:text-[10px] font-black rounded-lg border transition-all ${
                    selectedPayment === method 
                      ? 'bg-red-600 border-red-600 text-white shadow-md' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Total</span>
            <span className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">R$ {cartTotal.toFixed(2)}</span>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleFinishSale}
            className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${
              cart.length === 0 
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            FINALIZAR VENDA
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
