import React, { useState } from 'react';
import { createScriptChat, generateStructure } from '../services/geminiService';
import { PROMPTS } from '../constants';
import { Chat } from '@google/genai';

interface StructureBuilderProps {
  model: string;
  bloggerStyle: string;
  onStructureConfirmed: (topic: string, structure: string, chat: Chat) => void;
}

const KEY_PERSONA = 'prompt_persona';
const KEY_STRUCTURE = 'prompt_structure';

const StructureBuilder: React.FC<StructureBuilderProps> = ({ model, bloggerStyle, onStructureConfirmed }) => {
  const [topic, setTopic] = useState('');
  const [structure, setStructure] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);

  // Prompt States
  const [personaPrompt, setPersonaPrompt] = useState(() => localStorage.getItem(KEY_PERSONA) || PROMPTS.GENERATOR_PERSONA);
  const [structureRequestPrompt, setStructureRequestPrompt] = useState(() => localStorage.getItem(KEY_STRUCTURE) || PROMPTS.STRUCTURE_REQUEST);
  const [showPrompts, setShowPrompts] = useState(false);

  const savePrompt = (key: string, val: string, setter: (v: string) => void) => {
    setter(val);
    localStorage.setItem(key, val);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      // Initialize the chat session with the customized Persona + Style
      const newChat = createScriptChat(model, bloggerStyle, topic, personaPrompt);
      setChat(newChat);

      // Ask for structure using customized request
      const result = await generateStructure(newChat, structureRequestPrompt);
      setStructure(result);
    } catch (error) {
      console.error(error);
      alert('Ошибка при создании структуры.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gray-850 p-4 md:p-6 rounded-lg border border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
            <div>
                <h2 className="text-xl font-bold text-white">2. Тема и Структура</h2>
                <p className="text-gray-400 text-sm mt-1">
                О чем будет ваше видео? AI предложит поэпизодный план.
                </p>
            </div>
            <button 
                onClick={() => setShowPrompts(!showPrompts)}
                className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-400 transition-colors whitespace-nowrap mt-2 md:mt-0"
            >
                {showPrompts ? 'Скрыть промпты' : '⚙️ Настроить промпты'}
            </button>
        </div>

        {showPrompts && (
            <div className="grid grid-cols-1 gap-4 mb-6">
                 <div className="p-4 bg-gray-900 rounded border border-gray-700 border-l-4 border-l-purple-500">
                    <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Промт Роли (Persona)</label>
                    <textarea 
                        value={personaPrompt}
                        onChange={(e) => savePrompt(KEY_PERSONA, e.target.value, setPersonaPrompt)}
                        className="w-full h-32 bg-gray-950 text-gray-300 text-xs font-mono p-2 rounded border border-gray-800 focus:border-purple-500 outline-none"
                    />
                 </div>
                 <div className="p-4 bg-gray-900 rounded border border-gray-700 border-l-4 border-l-indigo-500">
                    <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Промт Запроса Структуры</label>
                    <textarea 
                        value={structureRequestPrompt}
                        onChange={(e) => savePrompt(KEY_STRUCTURE, e.target.value, setStructureRequestPrompt)}
                        className="w-full h-24 bg-gray-950 text-gray-300 text-xs font-mono p-2 rounded border border-gray-800 focus:border-indigo-500 outline-none"
                    />
                 </div>
            </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Тема видео (например: Почему мы боимся темноты?)"
            className="flex-1 bg-gray-950 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 md:py-2 rounded-md font-medium transition-colors w-full md:w-auto"
          >
            {loading ? 'Создание плана...' : 'Создать План'}
          </button>
        </div>
      </div>

      {structure && (
        <div className="bg-gray-850 p-4 md:p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-indigo-300">Поэпизодный План</h3>
          <p className="text-xs text-gray-500 mb-4">Отредактируйте план, чтобы AI следовал ему при генерации.</p>
          <textarea
            value={structure}
            onChange={(e) => setStructure(e.target.value)}
            className="w-full h-80 md:h-96 bg-gray-950 border border-gray-700 rounded-md p-4 text-gray-300 text-sm font-mono leading-relaxed focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => chat && onStructureConfirmed(topic, structure, chat)}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-bold transition-colors shadow-lg shadow-green-900/20"
            >
              Утвердить План и Начать Писать &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StructureBuilder;