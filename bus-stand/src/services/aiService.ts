import axios from 'axios';
import { CONFIG } from '../constants/config';

// ✅ OpenRouter API Endpoint for Gemini
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * AI Service to handle intelligent features like estimating travel time
 * or predicting delays based on historical data.
 */
export const AIService = {
  /**
   * Estimates travel time between two locations using Gemini AI
   * @param from - Start Location Name
   * @param to - End Location Name
   * @param distance - Distance in KM
   * @returns Estimated time string (e.g., "45 mins")
   */
  async estimateTravelTime(from: string, to: string, distance: number): Promise<string> {
    try {
      const prompt = `Calculate the estimated bus travel time between ${from} and ${to} considering the distance is ${distance}km. 
      Assume average bus speed of 40km/h on Indian roads. 
      Return ONLY the time format like "1hr 20m" or "45m". No extra text.`;

      const response = await axios.post(
        API_URL,
        {
          model: "google/gemini-2.0-flash-lite-preview-02-05:free", // Using the model from your key
          messages: [
            { role: "user", content: prompt }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${CONFIG.GEMINI_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://busstand.app', // Required by OpenRouter
            'X-Title': 'Bus Stand App',
          }
        }
      );

      const aiResponse = response.data?.choices?.[0]?.message?.content;
      return aiResponse ? aiResponse.trim() : 'N/A';
    } catch (error) {
      console.error('❌ AI Service Error:', error);
      // Fallback logic if AI fails: (Distance / Speed) * 60
      const minutes = Math.round((distance / 40) * 60);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}hr ${mins}m` : `${mins}m`;
    }
  }
};
