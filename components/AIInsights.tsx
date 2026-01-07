
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Potencialize seu Bar com IA</h2>
          <p className="text-indigo-100 max-w-xl mb-6 font-medium leading-relaxed">
            Analisamos seu histórico de vendas para sugerir promoções inteligentes e otimizar seu lucro.
          </p>
          <button 
            onClick={fetchInsights}
            disabled={loading || sales.length === 0}
            className={`bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black transition-all shadow-lg uppercase text-xs tracking-widest ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:scale-105 active:scale-95'
            }`}
          >
            {loading ? 'Analisando dados...' : 'Gerar Insights'}
          </button>
          {sales.length === 0 && (
              <p className="mt-3 text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Aguardando primeira venda...</p>
          )}
        </div>
        <div className="absolute top-0 right-0 p-8 text-indigo-400/20">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5,2L9,9L2,11.5L9,14L11.5,21L14,14L21,11.5L14,9L11.5,2M11.5,18.3L10.5,15.5L7.7,14.5L10.5,13.5L11.5,10.7L12.5,13.5L15.3,14.5L12.5,15.5L11.5,18.3M18,3.5L19.1,6.5L22.1,7.6L19.1,8.7L18,11.7L16.9,8.7L13.9,7.6L16.9,6.5L18,3.5Z" /></svg>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">O Gemini está estudando seu negócio...</p>
        </div>
      )}

      {!loading && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors flex flex-col">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black mb-4 text-xs">
                {idx + 1}
              </div>
              <h3 className="font-black text-slate-800 dark:text-white mb-2 uppercase text-xs tracking-tight">{insight.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">{insight.description}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && insights.length === 0 && !sales.length && (
         <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 font-medium italic text-sm">
            Comece a vender para ver recomendações da IA aqui!
         </div>
      )}
    </div>
  );
};

export default AIInsights;
