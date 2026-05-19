import { useMemo } from 'react';
import { Product, Sale, StockTransaction } from '../types';

export interface ProductInsight {
  productId: string;
  currentStock: number;
  avgSalesPerHour: number;
  estimatedHoursLeft: number | null;
  isCritical: boolean;
  isHighVolumeWarning: boolean; // Para quem não tem estoque ligado
  recommendedRestock: number;
  averageWeeklySales: number;
  profitMargin: number | null;
  isLowMarginHighVolume: boolean;
}

export const useProductIntelligence = (
  products: Product[],
  sales: Sale[],
  stockBalances: Record<string, number>
) => {
  const insights = useMemo(() => {
    const result: Record<string, ProductInsight> = {};
    
    // Período para cálculo de velocidade (últimas 24h de atividade)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Filtra vendas recentes para velocidade
    const recentSales = sales.filter(s => s.timestamp > oneDayAgo && !s.deleted);
    const weeklySales = sales.filter(s => s.timestamp > sevenDaysAgo && !s.deleted);

    // Mapeia vendas por produto
    const productSalesDay: Record<string, number> = {};
    const productSalesWeek: Record<string, number> = {};

    recentSales.forEach(s => {
      s.items?.forEach(item => {
        productSalesDay[item.productId] = (productSalesDay[item.productId] || 0) + item.quantity;
      });
    });

    weeklySales.forEach(s => {
      s.items?.forEach(item => {
        productSalesWeek[item.productId] = (productSalesWeek[item.productId] || 0) + item.quantity;
      });
    });

    products.forEach(p => {
      const dayQty = productSalesDay[p.id] || 0;
      const weekQty = productSalesWeek[p.id] || 0;
      
      const avgSalesPerHour = dayQty / 24;
      const avgSalesPerDay = weekQty / 7;
      const currentStock = stockBalances[p.id] || 0;
      
      let estimatedHoursLeft: number | null = null;
      if (p.trackStock !== false && avgSalesPerHour > 0) {
        estimatedHoursLeft = currentStock / avgSalesPerHour;
      }

      const isCritical = p.trackStock !== false && estimatedHoursLeft !== null && estimatedHoursLeft < 4;
      
      // Lógica para quem não tem estoque: se vendeu hoje > 80% da média diária da semana
      // (Simplificação: se vendeu nas últimas 24h > média diária dos últimos 7 dias)
      const isHighVolumeWarning = p.trackStock === false && dayQty > (avgSalesPerDay * 0.8) && dayQty > 0;

      // Recomendação de reposição (para cobrir 7 dias com margem de 20%)
      const targetStock = avgSalesPerDay * 7 * 1.2;
      const recommendedRestock = Math.max(0, Math.ceil(targetStock - currentStock));

      // Lógica de Margem de Lucro (Radar de Prejuízo)
      const cost = p.lastCostPrice || 0;
      const price = p.price || 0;
      let profitMargin: number | null = null;
      let isLowMarginHighVolume = false;

      if (price > 0 && cost > 0) {
        profitMargin = ((price - cost) / price) * 100;
        // Alerta se margem for menor que 30% e estiver girando (pelo menos 5 itens na semana)
        isLowMarginHighVolume = profitMargin < 30 && weekQty >= 5;
      }

      result[p.id] = {
        productId: p.id,
        currentStock,
        avgSalesPerHour,
        estimatedHoursLeft,
        isCritical,
        isHighVolumeWarning,
        recommendedRestock,
        averageWeeklySales: weekQty,
        profitMargin,
        isLowMarginHighVolume
      };
    });

    return result;
  }, [products, sales, stockBalances]);

  return { insights };
};
