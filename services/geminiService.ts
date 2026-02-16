
import { GoogleGenAI, Modality } from "@google/genai";

export const generateDevotionalText = async (prompt: string, model: string = 'gemini-flash-latest') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.9,
      topP: 0.95,
      topK: 64,
    }
  });
  return response.text;
};

export const generateDeepDive = async (content: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as an expert theologian and historical researcher with a deep commitment to Biblical truth. 
  Perform a Theological and Historical Deep Dive on the following briefing. 
  
  Focus on: 
  1. Original language (Greek/Hebrew) insights.
  2. Historical context that illuminates the scripture.
  3. Archetypal patterns rooted in Biblical history.
  
  BRIEFING CONTENT:
  ${content}

  Format: Highly structured with headers. Use bullet points for readability. 
  CONSTRAINT: STRICTLY NO EM DASHES (—). Use a colon or hyphen instead. Ensure everything is Christ-centered and Biblically faithful.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt
  });
  return response.text;
};

export const generateAudio = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with warm, authentic, personal affection as if recording a voice note for someone you deeply care about: ${text}` }] }],
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
