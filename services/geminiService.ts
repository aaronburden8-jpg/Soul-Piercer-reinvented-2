import { GoogleGenAI, Modality } from "@google/genai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Senior Engineer Note: We instantiation GoogleGenAI inside each function to ensure it always
 * retrieves the most up-to-date process.env.API_KEY.
 */
export const generateDevotionalText = async (prompt: string, model: string = 'gemini-3-pro-preview') => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Sanctuary Key not detected.");
  
  const ai = new GoogleGenAI({ apiKey });
  let attempts = 5; 
  let waitTime = 3000;
  
  while (attempts > 0) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          temperature: 0.8,
          topP: 0.95,
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Empty response received.");
      return text;
    } catch (err: any) {
      const errStr = String(err).toLowerCase();
      const isQuota = errStr.includes('429') || errStr.includes('quota') || errStr.includes('exhausted');
      
      if (isQuota && attempts > 1) {
        console.warn(`[QUOTA_RECOVERY] Overcrowded archives. Retrying in ${waitTime}ms... (${attempts} remaining)`);
        await sleep(waitTime);
        attempts--;
        waitTime *= 2; // Exponential backoff
        continue;
      }
      throw err;
    }
  }
};

export const generateDeepDiveStream = async (content: string, onChunk: (text: string) => void) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Sanctuary Key missing.");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Act as an expert theologian. 
  Perform a profound Theological Context analysis on the following devotional briefing. 
  Focus on original Greek/Hebrew meanings and archetypal significance.
  BRIEFING: ${content}
  Format with ### headers and clean bullet points.`;
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) onChunk(text);
    }
  } catch (err: any) {
    const errStr = String(err).toLowerCase();
    if (errStr.includes('429') || errStr.includes('quota')) {
       console.warn("[QUOTA] Deep dive stream hit rate limit.");
    }
    throw err;
  }
};