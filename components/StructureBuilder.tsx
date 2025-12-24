import React, { useState } from 'react';
import { createScriptChat, generateStructure } from '../services/geminiService';
import { PROMPTS } from '../constants';
import { Chat } from '@google/genai';

interface StructureBuilderProps {
  apiKey: string;
  bloggerStyle: string;
  onStructureConfirmed: (topic: string, structure: string, chat: Chat) => void;
}

const StructureBuilder: React.FC<StructureBuilderProps> = ({ apiKey, bloggerStyle, onStructureConfirmed }) => {
  const [topic, setTopic] = useState('');
  const [structure, setStructure] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      // Initialize the chat session with the Persona + Style
      const newChat = createScriptChat(apiKey, bloggerStyle, topic, PROMPTS.GENERATOR_PERSONA);
      setChat(newChat);

      // Ask for structure
      const result = await generateStructure(newChat, PROMPTS.STRUCTURE_REQUEST);
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
      <div className="bg-gray-850 p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">2. Тема и Структура</h2>
        <p className="text-gray-400 mb-4 text-sm">
          О чем будет ваше видео? AI предложит поэпизодный план.
        </p>
        
        <div className="flex gap-4">
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
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {loading ? 'Создание плана...' : 'Создать План'}
          </button>
        </div>
      </div>

      {structure && (
        <div className="bg-gray-850 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-indigo-300">Поэпизодный План</h3>
          <p className="text-xs text-gray-500 mb-4">Отредактируйте план, чтобы AI следовал ему при генерации.</p>
          <textarea
            value={structure}
            onChange={(e) => setStructure(e.target.value)}
            className="w-full h-96 bg-gray-950 border border-gray-700 rounded-md p-4 text-gray-300 text-sm font-mono leading-relaxed focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => chat && onStructureConfirmed(topic, structure, chat)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-bold transition-colors shadow-lg shadow-green-900/20"
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