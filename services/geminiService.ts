import { GoogleGenAI, Chat, HarmBlockThreshold, HarmCategory } from "@google/genai";

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export const createClient = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

export const generateStyleAnalysis = async (apiKey: string, bloggerName: string, systemPrompt: string): Promise<string> => {
  const ai = createClient(apiKey);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `ВХОДНЫЕ ДАННЫЕ:
Имя человека / название канала: ${bloggerName}
Язык: русский`,
    config: {
      systemInstruction: systemPrompt,
      safetySettings: SAFETY_SETTINGS,
    }
  });
  return response.text || "Не удалось сгенерировать анализ стиля.";
};

export const createScriptChat = (apiKey: string, style: string, topic: string, personaPrompt: string): Chat => {
  const ai = createClient(apiKey);
  const systemInstruction = personaPrompt
    .replace('{TOPIC}', topic)
    .replace('{STYLE}', style);
    
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
      safetySettings: SAFETY_SETTINGS,
    }
  });
};

export const generateStructure = async (chat: Chat, prompt: string): Promise<string> => {
  const response = await chat.sendMessage({ message: prompt });
  return response.text || "Не удалось сгенерировать структуру.";
};

export const generateScriptSection = async (chat: Chat, instruction: string): Promise<string> => {
  const response = await chat.sendMessage({ message: instruction });
  return response.text || "Не удалось сгенерировать часть сценария.";
};

export const reviewScript = async (apiKey: string, script: string, prompt: string): Promise<string> => {
  const ai = createClient(apiKey);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Проанализируй следующий сценарий:\n\n${script}`,
    config: {
      systemInstruction: prompt,
      safetySettings: SAFETY_SETTINGS,
    }
  });
  return response.text || "Не удалось провести рецензию.";
};

export const detectCliches = async (apiKey: string, script: string, prompt: string): Promise<string> => {
  const ai = createClient(apiKey);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Текст для анализа:\n${script}`,
    config: {
      systemInstruction: prompt,
      responseMimeType: "application/json",
    }
  });
  return response.text || "[]";
};

export const fixCliches = async (apiKey: string, script: string, instructions: string, prompt: string): Promise<string> => {
  const ai = createClient(apiKey);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Оригинальный текст:\n${script}\n\nИнструкции по исправлению:\n${instructions}`,
    config: {
      systemInstruction: prompt,
    }
  });
  return response.text || script;
};

export const applyHumor = async (apiKey: string, script: string, style: string, prompt: string): Promise<string> => {
  const ai = createClient(apiKey);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Текст:\n${script}\n\nКонтекст стиля:\n${style}`,
    config: {
      systemInstruction: prompt,
    }
  });
  return response.text || script;
};