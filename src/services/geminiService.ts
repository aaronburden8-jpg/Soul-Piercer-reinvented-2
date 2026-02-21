import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";

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
        contents: prompt,
        config: {
          systemInstruction: "You are a spiritual guide. Do not use long em dashes (—) in your output. Use standard dashes (-) or double dashes (--) instead.",
          temperature: 0.8,
          topP: 0.95,
        }
      });
      
      const text = response.text?.replace(/—/g, '--');
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

export const generateDevotionalStream = async (prompt: string, onChunk: (text: string) => void, model: string = 'gemini-3-pro-preview') => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Sanctuary Key not detected.");
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        systemInstruction: "You are a spiritual guide. Do not use long em dashes (—) in your output. Use standard dashes (-) or double dashes (--) instead.",
        temperature: 0.8,
        topP: 0.95,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text?.replace(/—/g, '--');
      if (text) onChunk(text);
    }
  } catch (err: any) {
    throw err;
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
      contents: prompt,
      config: {
        systemInstruction: "You are an expert theologian. Do not use long em dashes (—) in your output. Use standard dashes (-) or double dashes (--) instead.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text?.replace(/—/g, '--');
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

export const generateSpeech = async (text: string, voice: string = 'Kore') => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Sanctuary Key missing.");

  const ai = new GoogleGenAI({ apiKey });
  
  // Clean markdown and truncate to avoid TTS limits (approx 4000 chars is safe)
  const cleanText = text
    .replace(/###\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/-\s+/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .trim()
    .slice(0, 4000);

  let attempts = 3;
  let waitTime = 2000;

  while (attempts > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this devotional with a soulful, peaceful, and reverent tone: ${cleanText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      // Search all parts for inlineData
      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
      const base64Audio = audioPart?.inlineData?.data;
      
      if (base64Audio) {
        return `data:audio/wav;base64,${base64Audio}`;
      }
      
      // If no audio but we have text, it might be a refusal or explanation
      const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
      if (textPart?.text) {
        throw new Error(`Sanctuary voice refused: ${textPart.text}`);
      }

      throw new Error("No audio data received from the archives.");
    } catch (err: any) {
      const errStr = String(err).toLowerCase();
      const isRetryable = errStr.includes('429') || errStr.includes('quota') || errStr.includes('timeout') || errStr.includes('deadline');
      
      if (isRetryable && attempts > 1) {
        console.warn(`[TTS_RETRY] Conjuring voice failed. Retrying in ${waitTime}ms... (${attempts} remaining)`);
        await sleep(waitTime);
        attempts--;
        waitTime *= 2;
        continue;
      }
      console.error("TTS Error:", err);
      throw err;
    }
  }
  throw new Error("Failed to conjure voice after multiple attempts.");
};
