
import React, { useState } from 'react';
import { Sale, Product } from '../types';
import { getAIInsights } from '../services/geminiService';

interface AIInsightsProps {
  sales: Sale[];
  products: Product[];
}

interface Insight {
  title: string;
  description: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ sales, products }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await getAIInsights(sales, products);
      setInsights(data.insights);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Potencialize seu Bar com Inteligência Artificial</h2>
          <p className="text-indigo-100 max-w-xl mb-6">
            Nossa IA analisa seu histórico de vendas e comportamento dos clientes para sugerir promoções, otimizar estoque e aumentar seu lucro.
          </p>
          <button 
            onClick={fetchInsights}
            disabled={loading || sales.length === 0}
            className={`bg-white text-indigo-600 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:scale-105 active:scale-95'
            }`}
          >
            {loading ? 'Analisando dados...' : 'Gerar Insights Agora'}
          </button>
          {sales.length === 0 && (
              <p className="mt-2 text-xs text-indigo-200">Você precisa de pelo menos uma venda para gerar insights.</p>
          )}
        </div>
        <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 rotate-12">✨</div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">O Gemini está estudando seu negócio...</p>
        </div>
      )}

      {!loading && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors flex flex-col">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold mb-4">
                {idx + 1}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{insight.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && insights.length === 0 && !sales.length && (
         <div className="bg-slate-100 rounded-2xl p-12 text-center text-slate-500">
            <p>Comece a vender para ver recomendações da IA aqui!</p>
         </div>
      )}
    </div>
  );
};

export default AIInsights;
