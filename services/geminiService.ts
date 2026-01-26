
import { GoogleGenAI } from "@google/genai";

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
        contents: `Analyze the following sales data from a bar management system and provide strategic insights: ${salesData}`,
        config: {
          systemInstruction: "You are a professional business consultant specializing in the food and beverage industry. Provide actionable insights based on the provided data.",
        }
      });
      return response.text || '';
    } catch (error) {
      console.error('Error getting business insights from Gemini:', error);
      throw error;
    }
  }
};
