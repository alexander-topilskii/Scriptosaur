import React, { useState } from 'react';
import { generateStyleAnalysis } from '../services/geminiService';
import { PROMPTS } from '../constants';

interface StyleAnalyzerProps {
  model: string;
  onStyleConfirmed: (name: string, style: string) => void;
}

const STORAGE_KEY = 'prompt_style_analysis';

const StyleAnalyzer: React.FC<StyleAnalyzerProps> = ({ model, onStyleConfirmed }) => {
  const [name, setName] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  // Prompt State
  const [systemPrompt, setSystemPrompt] = useState(() => 
    localStorage.getItem(STORAGE_KEY) || PROMPTS.STYLE_ANALYSIS_SYSTEM
  );
  const [showPrompt, setShowPrompt] = useState(false);

  const handlePromptChange = (val: string) => {
    setSystemPrompt(val);
    localStorage.setItem(STORAGE_KEY, val);
  };

  const resetPrompt = () => {
    setSystemPrompt(PROMPTS.STYLE_ANALYSIS_SYSTEM);
    localStorage.setItem(STORAGE_KEY, PROMPTS.STYLE_ANALYSIS_SYSTEM);
  };

  const handleAnalyze = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const result = await generateStyleAnalysis(model, name, systemPrompt);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      alert('Ошибка при анализе стиля. Проверьте API ключ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gray-850 p-4 md:p-6 rounded-lg border border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
          <div>
            <h2 className="text-xl font-bold text-white">1. Анализ Стиля</h2>
            <p className="text-gray-400 text-sm mt-1">
              Введите имя блогера или название канала. AI создаст подробный промпт описывающий его стиль.
            </p>
          </div>
          <button 
            onClick={() => setShowPrompt(!showPrompt)}
            className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-400 transition-colors whitespace-nowrap mt-2 md:mt-0"
          >
            {showPrompt ? 'Скрыть промпт' : '⚙️ Настроить промпт'}
          </button>
        </div>

        {showPrompt && (
          <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-700 border-l-4 border-l-indigo-500">
             <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Системный Промт для AI</label>
                <button onClick={resetPrompt} className="text-xs text-red-400 hover:text-red-300">Сбросить</button>
             </div>
             <textarea 
               value={systemPrompt}
               onChange={(e) => handlePromptChange(e.target.value)}
               className="w-full h-40 bg-gray-950 text-gray-300 text-xs font-mono p-2 rounded border border-gray-800 focus:border-indigo-500 outline-none"
             />
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Utopia Show, Ян Топлес, Kuplinov..."
            className="flex-1 bg-gray-950 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !name}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 md:py-2 rounded-md font-medium transition-colors w-full md:w-auto"
          >
            {loading ? 'Анализ...' : 'Анализировать'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-gray-850 p-4 md:p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-indigo-300">Результат Анализа (Редактируемый)</h3>
          <p className="text-xs text-gray-500 mb-4">Вы можете подправить описание стиля перед продолжением.</p>
          <textarea
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            className="w-full h-80 md:h-96 bg-gray-950 border border-gray-700 rounded-md p-4 text-gray-300 text-sm font-mono leading-relaxed focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onStyleConfirmed(name, analysis)}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-bold transition-colors shadow-lg shadow-green-900/20"
            >
              Принять Стиль и Продолжить &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleAnalyzer;