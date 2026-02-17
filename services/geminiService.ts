
import { GoogleGenAI, Modality } from "@google/genai";

// Use gemini-3-pro-preview for complex reasoning tasks as per guidelines.
export const generateDevotionalText = async (prompt: string, model: string = 'gemini-3-pro-preview') => {
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
  // Use .text property as per guidelines.
  return response.text;
};

// Use gemini-3-pro-preview for advanced reasoning and theological analysis.
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
    model: 'gemini-3-pro-preview',
    contents: prompt
  });
  // Use .text property as per guidelines.
  return response.text;
};

// generateAudio remains on gemini-2.5-flash-preview-tts as it is specifically for TTS.
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

    // Extracting audio bytes from candidates correctly.
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (err) {
    console.error("Audio generation failed:", err);
    return null;
  }
};

// Manual implementation of base64 decoding as recommended.
export const decodeBase64Audio = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Split audio processing into decoding and playing following the guidelines.
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
