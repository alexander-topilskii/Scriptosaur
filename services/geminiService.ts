import { GoogleGenAI, Chat, HarmBlockThreshold, HarmCategory } from "@google/genai";

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const getApiKey = (): string => {
  const cookies = document.cookie.split(';');
  const apiKeyCookie = cookies.find(c => c.trim().startsWith('GEMINI_API_KEY='));
  return apiKeyCookie ? apiKeyCookie.split('=')[1] : (process.env.API_KEY || '');
};

export const createClient = () => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};

export const generateStyleAnalysis = async (model: string, bloggerName: string, systemPrompt: string): Promise<string> => {
  const ai = createClient();
  const response = await ai.models.generateContent({
    model: model,
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

export const createScriptChat = (model: string, style: string, topic: string, personaPrompt: string): Chat => {
  const ai = createClient();
  const systemInstruction = personaPrompt
    .replace('{TOPIC}', topic)
    .replace('{STYLE}', style);
    
  return ai.chats.create({
    model: model,
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

export const reviewScript = async (model: string, script: string, prompt: string): Promise<string> => {
  const ai = createClient();
  const response = await ai.models.generateContent({
    model: model,
    contents: `Проанализируй следующий сценарий:\n\n${script}`,
    config: {
      systemInstruction: prompt,
      safetySettings: SAFETY_SETTINGS,
    }
  });
  return response.text || "Не удалось провести рецензию.";
};

export const detectCliches = async (model: string, script: string, prompt: string): Promise<string> => {
  const ai = createClient();
  const response = await ai.models.generateContent({
    model: model,
    contents: `Текст для анализа:\n${script}`,
    config: {
      systemInstruction: prompt,
      responseMimeType: "application/json",
    }
  });
  return response.text || "[]";
};

export const fixCliches = async (model: string, script: string, instructions: string, prompt: string): Promise<string> => {
  const ai = createClient();
  const response = await ai.models.generateContent({
    model: model,
    contents: `Оригинальный текст:\n${script}\n\nИнструкции по исправлению:\n${instructions}`,
    config: {
      systemInstruction: prompt,
    }
  });
  return response.text || script;
};

export const applyHumor = async (model: string, script: string, style: string, prompt: string): Promise<string> => {
  const ai = createClient();
  const response = await ai.models.generateContent({
    model: model,
    contents: `Текст:\n${script}\n\nКонтекст стиля:\n${style}`,
    config: {
      systemInstruction: prompt,
    }
  });
  return response.text || script;
};

export const freeTextEdit = async (model: string, script: string, style: string, instruction: string): Promise<string> => {
    const ai = createClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: `ИСХОДНЫЙ ТЕКСТ:\n${script}\n\nЗАДАЧА ПО РЕДАКТИРОВАНИЮ:\n${instruction}`,
      config: {
        systemInstruction: `Ты — профессиональный редактор. Твоя задача — отредактировать текст согласно инструкции пользователя.
        Стиль, которого нужно придерживаться (если инструкция не говорит об обратном):
        ${style}
        
        Верни ТОЛЬКО отредактированный текст.`,
        safetySettings: SAFETY_SETTINGS,
      }
    });
    return response.text || script;
  };