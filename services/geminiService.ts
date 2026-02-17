
import { GoogleGenAI, Modality } from "@google/genai";

// Using gemini-flash-latest for standard devotional generation for maximum stability and speed.
export const generateDevotionalText = async (prompt: string, model: string = 'gemini-flash-latest') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
    }
  });
  return response.text;
};

/**
 * Perform a Theological and Historical Deep Dive via Streaming.
 * Using gemini-flash-latest to match the stable performance of the rest of the app.
 */
export const generateDeepDiveStream = async (content: string, onChunk: (text: string) => void) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Act as an expert theologian and historical researcher. 
  Perform a Theological and Historical Deep Dive on the following briefing. 
  
  Focus on: 
  1. Original language (Greek/Hebrew) insights.
  2. Historical context.
  3. Biblical archetypes.
  
  BRIEFING CONTENT:
  ${content}

  Format: Clear headers (###), bullet points. No em-dashes. Be concise but profound.`;
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-flash-latest',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  } catch (error) {
    console.error("Deep Dive Stream Error:", error);
    throw error;
  }
};

// Simplified non-streaming version (fallback)
export const generateDeepDive = async (content: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Perform a deep theological dive on: ${content}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      temperature: 0.7
    }
  });
  return response.text;
};

// Audio generation remains on the specialized TTS model.
export const generateAudio = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with warm, authentic affection: ${text}` }] }],
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (err) {
    console.error("Audio generation failed:", err);
    return null;
  }
};

export const decodeBase64Audio = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const playAudioBuffer = async (data: Uint8Array, audioCtx: AudioContext) => {
  const buffer = await decodeAudioData(data, audioCtx, 24000, 1);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
};
