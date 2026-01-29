
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client using the API_KEY from environment variables.
// Use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Service to interact with the Gemini API for various AI tasks.
 */
export const geminiService = {
  /**
   * Generates a text response from a prompt using the Gemini 3 Flash model.
   * @param prompt The prompt to send to the model.
   * @returns The generated text response.
   */
  async generateText(prompt: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || '';
    } catch (error) {
      console.error('Error generating content with Gemini:', error);
      throw error;
    }
  },

  /**
   * Analyzes sales data and provides business insights.
   * @param salesData Serialized sales data for analysis.
   * @returns Generated insights as a string.
   */
  async getBusinessInsights(salesData: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze the following sales data from a bar management system and provide 3 short, strategic, and actionable insights (bullet points) to improve revenue or efficiency. Keep it professional but friendly (Bar owner persona). Data: ${salesData}`,
        config: {
          systemInstruction: "You are an expert bar consultant. Focus on practical advice.",
        }
      });
      return response.text || '';
    } catch (error) {
      console.error('Error getting business insights from Gemini:', error);
      throw error;
    }
  },

  /**
   * Generates a list of product suggestions based on a bar style.
   * @param style The style of the bar (e.g., "Pub", "Boteco", "Wine Bar").
   * @returns Array of product objects.
   */
  async generateMenuSuggestions(style: string): Promise<any[]> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a list of 10 popular products for a "${style}". 
                   Include realistic prices in BRL (Brazilian Real).
                   Categories should be standard like: CERVEJAS, DRINKS, PETISCOS, DOSES, SEM ALCOOL.
                   The 'sellType' should be 'unit' for most items, or 'weight' for self-service food.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING },
                sellType: { type: Type.STRING, enum: ['unit', 'weight'] }
              }
            }
          }
        }
      });
      
      const text = response.text || '[]';
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating menu with Gemini:', error);
      return [];
    }
  }
};
