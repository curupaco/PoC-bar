
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale } from "../types";

const getApiKey = () => {
  try { return process.env.API_KEY || ""; } catch (e) { return ""; }
};

export const getAIInsights = async (sales: Sale[], products: Product[]) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { insights: [{ title: "Configuração Pendente", description: "A chave da IA não foi configurada no ambiente. Adicione a variável API_KEY na Vercel para ativar as dicas." }] };
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const safeSales = sales ?? [];
  const summary = {
    totalRevenue: safeSales.reduce((acc, s) => acc + (s.total ?? 0), 0),
    totalSales: safeSales.length,
    topProducts: safeSales.flatMap(s => s.items ?? []).reduce((acc, item) => {
      acc[item.productName] = (acc[item.productName] || 0) + (item.quantity ?? 0);
      return acc;
    }, {} as Record<string, number>),
    paymentMix: safeSales.reduce((acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const prompt = `Analise estes dados de um bar e dê 3 dicas práticas para aumentar o lucro:
    Faturamento: R$ ${summary.totalRevenue.toFixed(2)}
    Vendas: ${summary.totalSales}
    Produtos mais vendidos: ${JSON.stringify(summary.topProducts)}
    Pagamentos: ${JSON.stringify(summary.paymentMix)}
    
    Retorne apenas JSON no formato: {"insights": [{"title": "...", "description": "..."}]}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"insights": []}');
  } catch (error) {
    console.error("AI Insight Error:", error);
    return { insights: [{ title: "Dica de Gestão", description: "Mantenha seu estoque sempre atualizado e analise quais produtos têm maior margem de lucro para criar promoções." }] };
  }
};
