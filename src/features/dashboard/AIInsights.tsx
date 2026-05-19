import React, { useMemo } from 'react';
import { Product, Sale } from '../../types';
import { useProductIntelligence, ProductInsight } from '../../hooks/useProductIntelligence';

interface AIInsightsProps {
  products: Product[];
  sales: Sale[];
  stockBalances: Record<string, number>;
}

const AIInsights: React.FC<AIInsightsProps> = ({ products, sales, stockBalances }) => {
  const { insights } = useProductIntelligence(products, sales, stockBalances);

  // Radar de Reposição / Alta Demanda
  const stockAlerts = useMemo(() => {
    return Object.values(insights as Record<string, ProductInsight>)
      .filter(i => i.isCritical || i.isHighVolumeWarning)
      .sort((a, b) => (a.isCritical === b.isCritical ? 0 : a.isCritical ? -1 : 1));
  }, [insights]);

  // Radar de Prejuízo
  const lossAlerts = useMemo(() => {
    return Object.values(insights as Record<string, ProductInsight>)
      .filter(i => i.isLowMarginHighVolume)
      .sort((a, b) => (a.profitMargin || 0) - (b.profitMargin || 0));
  }, [insights]);

  if (stockAlerts.length === 0 && lossAlerts.length === 0) {
    return (
      <div className="p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800 xl:col-span-2">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">🧠 Inteligência Botequista</h3>
         </div>
         <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
             <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center text-sm mb-3">✓</div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center px-10">Tudo sob controle. Margens saudáveis e estoque girando bem.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:col-span-2">
      {/* Radar de Prejuízo */}
      {lossAlerts.length > 0 && (
        <div className="p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800 animate-in fade-in">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">📉 Radar de Prejuízo</h3>
              <p className="text-[10px] font-black text-red-500 uppercase italic tracking-widest animate-pulse">Atenção às Margens</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lossAlerts.map((item, i) => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div key={i} className="p-5 rounded-3xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 flex flex-col gap-2 relative overflow-hidden transition-all hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><span className="text-4xl">💸</span></div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center">⚠️</div>
                      <p className="text-xs font-black uppercase text-slate-800 dark:text-white truncate pr-8">{product?.name}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2 z-10">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-500">Margem Atual</p>
                        <p className="text-lg font-black text-red-600 tracking-tighter">{item.profitMargin?.toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-slate-500">Giro Semanal</p>
                        <p className="text-sm font-black text-slate-800 dark:text-white">{item.averageWeeklySales} un</p>
                      </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {/* Radar de Reposição / Alta Demanda */}
      {stockAlerts.length > 0 && (
        <div className="p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800 animate-in fade-in">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">📡 Radar de Demanda & Estoque</h3>
              <p className="text-[10px] font-black text-orange-500 uppercase italic tracking-widest animate-pulse">Monitoramento em Tempo Real</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stockAlerts.map((item, i) => {
                const product = products.find(p => p.id === item.productId);
                // Bifurcação visual para quem usa estoque vs quem não usa
                const isRealStockAlert = item.isCritical && product?.trackStock !== false;
                
                return (
                  <div key={i} className={`p-5 rounded-3xl border flex items-center justify-between transition-all hover:scale-[1.01] ${isRealStockAlert ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${isRealStockAlert ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600'}`}>
                        {isRealStockAlert ? '🚨' : '🔥'}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-800 dark:text-white leading-none mb-1">{product?.name}</p>
                        <p className={`text-[9px] font-black uppercase tracking-tighter italic ${isRealStockAlert ? 'text-red-600' : 'text-orange-600'}`}>
                          {isRealStockAlert 
                            ? `Acaba em aprox. ${item.estimatedHoursLeft?.toFixed(1)}h` 
                            : 'Alta Demanda (Saindo rápido)'}
                        </p>
                      </div>
                    </div>
                    {/* Só mostra a quantidade de estoque se for um alerta de estoque real (trackStock !== false) */}
                    {product?.trackStock !== false && (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Estoque</p>
                        <p className={`text-lg font-black tracking-tighter ${isRealStockAlert ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                          {item.currentStock} {product?.sellType === 'weight' ? 'kg' : 'un'}
                        </p>
                      </div>
                    )}
                    {product?.trackStock === false && (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                        <p className="text-sm font-black tracking-tighter text-orange-600 uppercase">Hot Item</p>
                      </div>
                    )}
                  </div>
                );
              })}
           </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
