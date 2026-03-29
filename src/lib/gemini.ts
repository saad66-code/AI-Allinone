import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export type AIModelMode = 'fast' | 'balanced' | 'power';

export const models = {
  fast: "gemini-3.1-flash-lite-preview",
  balanced: "gemini-3-flash-preview",
  power: "gemini-3.1-pro-preview",
  image: "gemini-2.5-flash-image",
  tts: "gemini-2.5-flash-preview-tts",
};

export async function generateAIContent(
  prompt: string,
  config?: any,
  mode: AIModelMode = 'balanced'
) {
  const response = await ai.models.generateContent({
    model: models[mode],
    contents: prompt,
    config: config
  });
  return response.text;
}

export async function generateChatResponse(
  prompt: string, 
  history: { role: "user" | "model", parts: { text: string }[] }[],
  mode: AIModelMode = 'balanced'
) {
  const chat = ai.chats.create({
    model: models[mode],
    config: {
      systemInstruction: "You are a helpful AI assistant. You can handle multiple tasks like chatting, coding, and idea analysis. Respond in the language the user uses.",
    },
    history: history,
  });

  const result = await chat.sendMessage({ message: prompt });
  return result.text;
}

export async function* generateChatResponseStream(
  prompt: string, 
  history: { role: "user" | "model", parts: { text: string }[] }[],
  mode: AIModelMode = 'balanced'
) {
  const chat = ai.chats.create({
    model: models[mode],
    config: {
      systemInstruction: "You are a helpful AI assistant. You can handle multiple tasks like chatting, coding, and idea analysis. Respond in the language the user uses.",
    },
    history: history,
  });

  const result = await chat.sendMessageStream({ message: prompt });
  for await (const chunk of result) {
    const c = chunk as GenerateContentResponse;
    yield c.text;
  }
}

export function parseJSON(res: string) {
  try {
    let cleanRes = res.trim();
    if (cleanRes.startsWith('```json')) {
      cleanRes = cleanRes.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanRes.startsWith('```')) {
      cleanRes = cleanRes.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    // Replace unescaped control characters in string literals
    cleanRes = cleanRes.replace(/[\u0000-\u001F]+/g, function (match) {
      if (match === '\n') return '\\n';
      if (match === '\r') return '\\r';
      if (match === '\t') return '\\t';
      return '';
    });
    return JSON.parse(cleanRes);
  } catch (e) {
    console.error("Failed to parse JSON:", e, res);
    throw e;
  }
}

export async function generateCode(prompt: string, mode: AIModelMode = 'power') {
  return generateAIContent(
    `Generate code for: ${prompt}. Provide the code and a step-by-step explanation.`,
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING, description: "The generated code." },
          language: { type: Type.STRING, description: "The programming language." },
          explanation: { type: Type.STRING, description: "Step-by-step explanation." },
        },
        required: ["code", "language", "explanation"],
      },
    },
    mode
  ).then(res => parseJSON(res));
}

export async function generateImage(prompt: string, style: string = "realistic") {
  const fullPrompt = `Generate a ${style} image of: ${prompt}`;
  const response = await ai.models.generateContent({
    model: models.image,
    contents: { parts: [{ text: fullPrompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

export async function analyzeIdea(idea: string, mode: AIModelMode = 'balanced') {
  return generateAIContent(
    `Analyze this idea: ${idea}. Predict success/failure, give improvement suggestions, and provide a success score (0-100).`,
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING, description: "Detailed analysis." },
          score: { type: Type.NUMBER, description: "Success score from 0 to 100." },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Improvement suggestions." },
        },
        required: ["analysis", "score", "suggestions"],
      },
    },
    mode
  ).then(res => parseJSON(res));
}

export async function textToSpeech(text: string) {
  const response = await ai.models.generateContent({
    model: models.tts,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export async function analyzeFile(fileData: string, mimeType: string, prompt: string = "Analyze this file content.") {
  const response = await ai.models.generateContent({
    model: models.balanced,
    contents: {
      parts: [
        { inlineData: { data: fileData, mimeType } },
        { text: prompt },
      ],
    },
  });

  return response.text;
}

export async function fetchTrends(country: string = "Global", language: string = "English"): Promise<any[]> {
  const prompt = `List the top 6 current trending topics in ${country} (Language: ${language}) based on Google Trends. For each trend, provide a title, a short description, a growth percentage (e.g., +85%), a category tag (e.g., News, Tech, Entertainment, Sports), a lucide-react icon name (e.g., Zap, Cpu, Shield, Globe, Layers, Sparkles, TrendingUp, BarChart3), and a relevant URL for more information. Return the result as a JSON array.`;
  
  return generateAIContent(
    prompt,
    {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            desc: { type: Type.STRING },
            growth: { type: Type.STRING },
            tag: { type: Type.STRING },
            iconName: { type: Type.STRING },
            url: { type: Type.STRING, description: "A relevant URL for more information about the trend." }
          },
          required: ["title", "desc", "growth", "tag", "iconName", "url"]
        }
      }
    },
    'balanced'
  ).then(res => {
    try {
      return parseJSON(res);
    } catch (e) {
      console.error("Failed to parse trends:", e);
      return [];
    }
  });
}
