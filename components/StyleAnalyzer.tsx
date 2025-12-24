import React, { useState } from 'react';
import { generateStyleAnalysis } from '../services/geminiService';
import { PROMPTS } from '../constants';

interface StyleAnalyzerProps {
  apiKey: string;
  onStyleConfirmed: (name: string, style: string) => void;
}

const StyleAnalyzer: React.FC<StyleAnalyzerProps> = ({ apiKey, onStyleConfirmed }) => {
  const [name, setName] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const result = await generateStyleAnalysis(apiKey, name, PROMPTS.STYLE_ANALYSIS_SYSTEM);
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
      <div className="bg-gray-850 p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">1. Анализ Стиля</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Введите имя блогера или название канала. AI создаст подробный промпт описывающий его стиль.
        </p>
        
        <div className="flex gap-4">
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
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {loading ? 'Анализ...' : 'Анализировать'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-gray-850 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-indigo-300">Результат Анализа (Редактируемый)</h3>
          <p className="text-xs text-gray-500 mb-4">Вы можете подправить описание стиля перед продолжением.</p>
          <textarea
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            className="w-full h-96 bg-gray-950 border border-gray-700 rounded-md p-4 text-gray-300 text-sm font-mono leading-relaxed focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onStyleConfirmed(name, analysis)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-bold transition-colors shadow-lg shadow-green-900/20"
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