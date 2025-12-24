import React, { useState } from 'react';
import { generateScriptSection } from '../services/geminiService';
import { PROMPTS } from '../constants';
import { Chat } from '@google/genai';

interface ScriptGeneratorProps {
  chat: Chat;
  structure: string;
  onScriptComplete: (fullScript: string) => void;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ chat, structure, onScriptComplete }) => {
  const [scriptParts, setScriptParts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');

  // Extract blocks (simplistic approach - splitting by newlines isn't great, so we rely on user guidance)
  // Or better, we just tell AI "Write next block"
  
  const handleGenerateNext = async () => {
    setLoading(true);
    try {
      const instruction = customInstruction.trim() 
        ? customInstruction 
        : `${PROMPTS.GENERATION_INSTRUCTION}\nПродолжай строго по утвержденному плану. Напиши следующий логический блок/эпизод. Не пиши весь сценарий сразу, только один блок.`;
      
      const result = await generateScriptSection(chat, instruction);
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
          <h3 className="text-md font-bold text-indigo-300 mb-2">Сценарий</h3>
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
                    placeholder="Доп. инструкция (опционально): 'Пиши про пункт 2', 'Добавь шутку'..."
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