import React, { useState } from 'react';
import { reviewScript, detectCliches, fixCliches, applyHumor } from '../services/geminiService';
import { PROMPTS } from '../constants';
import { ClicheItem, PostProcessOption } from '../types';

interface PostProcessorProps {
  apiKey: string;
  model: string;
  script: string;
  style: string;
  onUpdateScript: (newScript: string) => void;
}

const PostProcessor: React.FC<PostProcessorProps> = ({ apiKey, model, script, style, onUpdateScript }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [reviewResult, setReviewResult] = useState<string>('');
  
  // Cliche State
  const [cliches, setCliches] = useState<ClicheItem[]>([]);
  const [clicheStep, setClicheStep] = useState<'detect' | 'fix'>('detect');

  // Editor State
  const [currentScript, setCurrentScript] = useState(script);

  const tools: PostProcessOption[] = [
    { id: 'cliche', label: 'Убрать AI-клише', description: 'Находит и убирает "воду" и штампы', icon: '🧹' },
    { id: 'humor', label: 'Добавить юмора', description: 'Добавляет шутки согласно стилю', icon: '🎭' },
    { id: 'review', label: 'Рецензия', description: 'Глубокий анализ сценария', icon: '🧐' },
  ];

  const handleToolClick = async (toolId: string) => {
    setActiveTool(toolId);
    setReviewResult('');
    setCliches([]);
    setClicheStep('detect');
    
    if (toolId === 'cliche') {
        await runClicheDetection();
    } else if (toolId === 'review') {
        await runReview();
    } else if (toolId === 'humor') {
        await runHumor();
    }
  };

  const runReview = async () => {
    setProcessing(true);
    try {
        const result = await reviewScript(apiKey, model, currentScript, PROMPTS.REVIEW_SYSTEM);
        setReviewResult(result);
    } catch (e) {
        alert('Ошибка рецензии');
    } finally {
        setProcessing(false);
    }
  };

  const runHumor = async () => {
    setProcessing(true);
    try {
        const result = await applyHumor(apiKey, model, currentScript, style, PROMPTS.HUMOR_SYSTEM);
        setCurrentScript(result);
        onUpdateScript(result);
        alert('Юмор добавлен!');
        setActiveTool(null);
    } catch (e) {
        alert('Ошибка добавления юмора');
    } finally {
        setProcessing(false);
    }
  };

  const runClicheDetection = async () => {
    setProcessing(true);
    try {
        const jsonStr = await detectCliches(apiKey, model, currentScript, PROMPTS.CLICHE_DETECTION_SYSTEM);
        // Clean markdown code blocks if present
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const items = JSON.parse(cleanJson);
        setCliches(items.map((i: any) => ({ ...i, selected: i.severity >= 7 })));
        setClicheStep('fix');
    } catch (e) {
        console.error(e);
        alert('Не удалось распознать клише (AI вернул некорректный формат). Попробуйте снова.');
        setActiveTool(null);
    } finally {
        setProcessing(false);
    }
  };

  const runClicheFix = async () => {
    const selected = cliches.filter(c => c.selected);
    if (selected.length === 0) return;

    setProcessing(true);
    const instructions = selected.map(c => `ID ${c.id}: ${c.text} -> Исправить (${c.suggestion})`).join('\n');
    
    try {
        const fixed = await fixCliches(apiKey, model, currentScript, instructions, PROMPTS.CLICHE_FIX_SYSTEM);
        setCurrentScript(fixed);
        onUpdateScript(fixed);
        setActiveTool(null);
    } catch (e) {
        alert('Ошибка исправления');
    } finally {
        setProcessing(false);
    }
  };

  const toggleCliche = (id: number) => {
    setCliches(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in h-[calc(100vh-200px)]">
      {/* Editor Column */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 flex-1 flex flex-col">
            <h3 className="text-gray-300 font-bold mb-2">Финальный Текст</h3>
            <textarea 
                className="flex-1 bg-gray-950 text-gray-300 p-4 rounded border border-gray-800 font-mono text-sm resize-none focus:outline-none focus:border-indigo-500"
                value={currentScript}
                onChange={(e) => {
                    setCurrentScript(e.target.value);
                    onUpdateScript(e.target.value);
                }}
            />
        </div>
      </div>

      {/* Tools Column */}
      <div className="lg:w-96 flex flex-col gap-4">
        {/* Tool Selection */}
        <div className="bg-gray-850 p-4 rounded-lg border border-gray-700">
            <h3 className="text-white font-bold mb-4">Инструменты</h3>
            <div className="space-y-2">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        disabled={processing}
                        className={`w-full text-left p-3 rounded-md border transition-all flex items-center gap-3
                            ${activeTool === tool.id 
                                ? 'bg-indigo-900/50 border-indigo-500 ring-1 ring-indigo-500' 
                                : 'bg-gray-900 border-gray-700 hover:bg-gray-800'}`}
                    >
                        <span className="text-2xl">{tool.icon}</span>
                        <div>
                            <div className="text-white font-medium">{tool.label}</div>
                            <div className="text-xs text-gray-400">{tool.description}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Active Tool Area */}
        {activeTool && (
            <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 flex-1 overflow-y-auto">
                {processing && <div className="text-center py-10 text-indigo-400 animate-pulse">AI работает...</div>}
                
                {!processing && activeTool === 'review' && (
                    <div className="whitespace-pre-wrap text-sm text-gray-300">{reviewResult}</div>
                )}

                {!processing && activeTool === 'cliche' && clicheStep === 'fix' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {cliches.length === 0 ? (
                                <p className="text-green-400 text-center">Клише не найдено!</p>
                            ) : (
                                cliches.map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => toggleCliche(c.id)}
                                        className={`p-2 rounded border cursor-pointer text-xs ${c.selected ? 'bg-red-900/30 border-red-500' : 'bg-gray-900 border-gray-700'}`}
                                    >
                                        <div className="flex justify-between mb-1">
                                            <span className={`font-bold ${c.severity > 6 ? 'text-red-400' : 'text-yellow-400'}`}>
                                                {c.type} ({c.severity}/10)
                                            </span>
                                            <input type="checkbox" checked={c.selected} readOnly />
                                        </div>
                                        <div className="text-gray-300 mb-1">"{c.text}"</div>
                                        <div className="text-gray-500 italic">Suggestion: {c.suggestion}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button 
                            onClick={runClicheFix}
                            disabled={cliches.filter(c => c.selected).length === 0}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded font-medium"
                        >
                            Исправить Выбранное
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default PostProcessor;
