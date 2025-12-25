import React, { useState } from 'react';
import { generateScriptSection } from '../services/geminiService';
import { PROMPTS } from '../constants';
import { Chat } from '@google/genai';

interface ScriptGeneratorProps {
  chat: Chat;
  structure: string;
  style: string;
  onScriptComplete: (fullScript: string) => void;
}

const STORAGE_KEY = 'prompt_generation_instruction';

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ chat, structure, style, onScriptComplete }) => {
  const [scriptParts, setScriptParts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  
  // Prompt State
  const [baseInstruction, setBaseInstruction] = useState(() => 
    localStorage.getItem(STORAGE_KEY) || PROMPTS.GENERATION_INSTRUCTION
  );
  const [showPrompt, setShowPrompt] = useState(false);

  const handlePromptChange = (val: string) => {
    setBaseInstruction(val);
    localStorage.setItem(STORAGE_KEY, val);
  };

  const handleGenerateNext = async () => {
    setLoading(true);
    try {
      // Reinforce style in every request to prevent drift
      const styleReminder = `\n\nВАЖНОЕ НАПОМИНАНИЕ О СТИЛЕ:\nПиши СТРОГО в следующем стиле:\n${style}`;
      
      // Combine the edited base instruction with any user-typed custom instruction
      const combinedInstruction = customInstruction.trim() 
        ? `${baseInstruction}\n\nДОПОЛНИТЕЛЬНАЯ ИНСТРУКЦИЯ ОТ ПОЛЬЗОВАТЕЛЯ:\n${customInstruction}${styleReminder}` 
        : `${baseInstruction}\nПродолжай строго по утвержденному плану. Напиши следующий логический блок/эпизод. Не пиши весь сценарий сразу, только один блок.${styleReminder}`;
      
      const result = await generateScriptSection(chat, combinedInstruction);
      setScriptParts(prev => [...prev, result]);
      setCustomInstruction('');
    } catch (error) {
      console.error(error);
      alert('Ошибка при генерации части сценария.');
    } finally {
      setLoading(false);
    }
  };

  const fullScript = scriptParts.join('\n\n***\n\n');

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in h-[calc(100vh-200px)]">
      {/* Left: Structure Reference */}
      <div className="lg:w-1/3 bg-gray-850 p-4 rounded-lg border border-gray-700 flex flex-col">
        <h3 className="text-md font-bold text-gray-300 mb-2">План Сценария</h3>
        <div className="flex-1 overflow-y-auto pr-2 text-sm text-gray-400 font-mono whitespace-pre-wrap">
          {structure}
        </div>
      </div>

      {/* Right: Generation Area */}
      <div className="lg:w-2/3 flex flex-col gap-4">
        <div className="flex-1 bg-gray-850 p-4 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-md font-bold text-indigo-300">Сценарий</h3>
             <button 
                onClick={() => setShowPrompt(!showPrompt)}
                className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-400 transition-colors"
            >
                {showPrompt ? 'Скрыть конфиг' : '⚙️ Конфиг генерации'}
            </button>
          </div>

          {showPrompt && (
              <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-700 border-l-4 border-l-indigo-500 shrink-0">
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">Базовая инструкция (применяется к каждому блоку)</label>
                  <textarea 
                    value={baseInstruction}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    className="w-full h-24 bg-gray-950 text-gray-300 text-xs font-mono p-2 rounded border border-gray-800 focus:border-indigo-500 outline-none"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    * Стиль автора автоматически добавляется к каждому запросу.
                  </div>
              </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {scriptParts.length === 0 && (
              <div className="text-gray-500 italic text-center mt-20">
                Нажмите "Генерировать Блок", чтобы начать написание сценария по плану.
              </div>
            )}
            {scriptParts.map((part, idx) => (
              <div key={idx} className="bg-gray-900 p-4 rounded border border-gray-800 text-gray-200 whitespace-pre-wrap">
                <div className="text-xs text-indigo-500 mb-2 font-bold uppercase tracking-wider">Блок {idx + 1}</div>
                {part}
              </div>
            ))}
            {loading && (
              <div className="animate-pulse bg-gray-900 p-4 rounded border border-gray-800 h-32 flex items-center justify-center">
                 <span className="text-indigo-400">Пишу...</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 flex flex-col gap-3">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Доп. инструкция для ЭТОГО блока (опционально)..."
                    className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateNext()}
                />
                 <button
                    onClick={handleGenerateNext}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded font-medium whitespace-nowrap"
                >
                    {loading ? 'Пишу...' : 'Генерировать Блок'}
                </button>
            </div>
            
            <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                <span className="text-xs text-gray-500">Генерируйте по частям для лучшего контроля.</span>
                <button
                    onClick={() => onScriptComplete(fullScript)}
                    disabled={scriptParts.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded font-medium"
                >
                    Завершить и Обработать &rarr;
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;