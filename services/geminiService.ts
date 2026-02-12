
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Use process.env.API_KEY directly as required by guidelines. 
// Do not generate UI for API keys or fallback to other methods.

export const generateDevotionalText = async (prompt: string, model: string = 'gemini-3-flash-preview') => {
  // Always instantiate GoogleGenAI right before the call to ensure latest API key usage.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
    }
  });
  return response.text;
};

export const generateDeepDive = async (content: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Deep Dive (Theology/History/Greek/Context) on this content:\n\n${content}\n\nNote: Provide a highly structured, academic but accessible breakdown. Do not use em dashes. Use headers and bullets.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      // Set a larger thinking budget for complex tasks as recommended.
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  return response.text;
};

export const generateAudio = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with warm, personal affection as if recording a voice note for a loved one: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
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

export const playAudioBuffer = async (data: Uint8Array, audioCtx: AudioContext) => {
  // Guidelines state that audio bytes from the API are raw PCM data.
  const dataInt16 = new Int16Array(data.buffer);
  const numChannels = 1;
  const sampleRate = 24000;
  const frameCount = dataInt16.length / numChannels;
  const buffer = audioCtx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
};
