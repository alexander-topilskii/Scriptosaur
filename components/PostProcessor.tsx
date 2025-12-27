import React, { useState, useEffect } from 'react';
import { reviewScript, detectCliches, fixCliches, applyHumor, freeTextEdit } from '../services/geminiService';
import { PROMPTS } from '../constants';
import { ClicheItem, PostProcessOption } from '../types';

interface PostProcessorProps {
  model: string;
  script: string;
  style: string;
  onUpdateScript: (newScript: string) => void;
}

const KEYS = {
    REVIEW: 'prompt_review',
    HUMOR: 'prompt_humor',
    CLICHE_DETECT: 'prompt_cliche_detect',
    CLICHE_FIX: 'prompt_cliche_fix',
    FREE_EDIT: 'prompt_free_edit'
};

const SEPARATOR = '\n\n***\n\n';

const PostProcessor: React.FC<PostProcessorProps> = ({ model, script, style, onUpdateScript }) => {
  // Parse script into blocks based on the separator used in ScriptGenerator
  const [blocks, setBlocks] = useState<string[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  useEffect(() => {
    // Initial split only if blocks are empty (on mount)
    if (script && blocks.length === 0) {
        const parts = script.split(SEPARATOR);
        setBlocks(parts);
    }
  }, [script]);

  const updateBlock = (index: number, val: string) => {
      const newBlocks = [...blocks];
      newBlocks[index] = val;
      setBlocks(newBlocks);
      onUpdateScript(newBlocks.join(SEPARATOR));
  };

  const updateAllBlocks = (newFullScript: string) => {
      const parts = newFullScript.split(SEPARATOR);
      setBlocks(parts);
      onUpdateScript(newFullScript);
  };

  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [reviewResult, setReviewResult] = useState<string>('');
  
  // Prompt State
  const [prompts, setPrompts] = useState({
      review: localStorage.getItem(KEYS.REVIEW) || PROMPTS.REVIEW_SYSTEM,
      humor: localStorage.getItem(KEYS.HUMOR) || PROMPTS.HUMOR_SYSTEM,
      clicheDetect: localStorage.getItem(KEYS.CLICHE_DETECT) || PROMPTS.CLICHE_DETECTION_SYSTEM,
      clicheFix: localStorage.getItem(KEYS.CLICHE_FIX) || PROMPTS.CLICHE_FIX_SYSTEM,
      freeEdit: localStorage.getItem(KEYS.FREE_EDIT) || 'Перепиши этот текст, сделав его более...',
  });
  const [showPrompt, setShowPrompt] = useState(false);

  const savePrompt = (key: string, field: keyof typeof prompts, val: string) => {
      setPrompts(prev => ({ ...prev, [field]: val }));
      localStorage.setItem(key, val);
  };

  // Cliche State
  const [cliches, setCliches] = useState<ClicheItem[]>([]);
  const [clicheStep, setClicheStep] = useState<'detect' | 'fix'>('detect');

  const tools: PostProcessOption[] = [
    { id: 'free_edit', label: 'Свободное редактирование', description: 'Свой промт к блоку', icon: '✏️' },
    { id: 'cliche', label: 'Убрать AI-клише', description: 'Находит и убирает "воду"', icon: '🧹' },
    { id: 'humor', label: 'Добавить юмора', description: 'Шутки по стилю', icon: '🎭' },
    { id: 'review', label: 'Рецензия', description: 'Анализ текста', icon: '🧐' },
  ];

  const handleToolClick = async (toolId: string) => {
    setActiveTool(toolId);
    setShowPrompt(true); // Open prompt by default so user can edit instructions
    setReviewResult('');
    setCliches([]);
    setClicheStep('detect');
  };

  const toggleCliche = (id: number) => {
    setCliches(prev => prev.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ));
  };

  // --- Execution Logic ---

  const getTargetText = () => {
      if (selectedBlockIndex !== null) {
          return blocks[selectedBlockIndex];
      }
      return blocks.join(SEPARATOR);
  };

  const handleResult = (resultText: string) => {
      if (selectedBlockIndex !== null) {
          updateBlock(selectedBlockIndex, resultText);
      } else {
          updateAllBlocks(resultText);
      }
  };

  const runFreeEdit = async (instruction: string) => {
      setProcessing(true);
      try {
          const text = getTargetText();
          const result = await freeTextEdit(model, text, style, instruction);
          handleResult(result);
          setActiveTool(null);
      } catch (e) {
          alert('Ошибка редактирования');
      } finally {
          setProcessing(false);
      }
  };

  const runReview = async (promptText: string) => {
    setProcessing(true);
    try {
        // Reviews usually analyze, not rewrite, so we don't update text
        const text = getTargetText();
        const result = await reviewScript(model, text, promptText);
        setReviewResult(result);
    } catch (e) {
        alert('Ошибка рецензии');
    } finally {
        setProcessing(false);
    }
  };

  const runHumor = async (promptText: string) => {
    setProcessing(true);
    try {
        const text = getTargetText();
        const result = await applyHumor(model, text, style, promptText);
        handleResult(result);
        alert('Юмор добавлен!');
        setActiveTool(null);
    } catch (e) {
        alert('Ошибка добавления юмора');
    } finally {
        setProcessing(false);
    }
  };

  const runClicheDetection = async (promptText: string) => {
    setProcessing(true);
    try {
        const text = getTargetText();
        const jsonStr = await detectCliches(model, text, promptText);
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const items = JSON.parse(cleanJson);
        setCliches(items.map((i: any) => ({ ...i, selected: i.severity >= 7 })));
        setClicheStep('fix');
    } catch (e) {
        console.error(e);
        alert('Не удалось распознать клише. Попробуйте снова.');
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
        const text = getTargetText();
        const fixed = await fixCliches(model, text, instructions, prompts.clicheFix);
        handleResult(fixed);
        setActiveTool(null);
    } catch (e) {
        alert('Ошибка исправления');
    } finally {
        setProcessing(false);
    }
  };

  const copyFullText = () => {
      const fullText = blocks.join('\n\n'); // Copy with clean line breaks
      navigator.clipboard.writeText(fullText);
      alert('Весь текст скопирован в буфер обмена!');
  };

  // Helper to render prompt editor
  const renderPromptEditor = () => {
      if (!activeTool) return null;

      let key = '';
      let field: keyof typeof prompts | null = null;
      let label = '';
      let action: () => void = () => {};
      
      if (activeTool === 'review') {
          key = KEYS.REVIEW; field = 'review'; label = 'Промт Рецензента';
          action = () => runReview(prompts.review);
      } else if (activeTool === 'humor') {
          key = KEYS.HUMOR; field = 'humor'; label = 'Промт Юмора';
          action = () => runHumor(prompts.humor);
      } else if (activeTool === 'free_edit') {
          key = KEYS.FREE_EDIT; field = 'freeEdit'; label = 'Инструкция для редактирования';
          action = () => runFreeEdit(prompts.freeEdit);
      } else if (activeTool === 'cliche') {
          if (clicheStep === 'detect') {
            key = KEYS.CLICHE_DETECT; field = 'clicheDetect'; label = 'Промт Поиска Клише';
            action = () => runClicheDetection(prompts.clicheDetect);
          } else {
            key = KEYS.CLICHE_FIX; field = 'clicheFix'; label = 'Промт Исправления Клише';
            action = () => runClicheFix();
          }
      }

      if (!field) return null;

      return (
          <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-700 border-l-4 border-l-yellow-500 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider">{label}</label>
                 <span className="text-xs text-gray-500">
                    {selectedBlockIndex !== null ? `Применяется к Блоку ${selectedBlockIndex + 1}` : "Применяется ко всему тексту"}
                 </span>
              </div>
              <textarea 
                value={prompts[field]}
                onChange={(e) => savePrompt(key, field!, e.target.value)}
                className="w-full h-32 bg-gray-950 text-gray-300 text-xs font-mono p-2 rounded border border-gray-800 focus:border-yellow-500 outline-none"
                placeholder={activeTool === 'free_edit' ? "Например: Перепиши этот абзац более агрессивно..." : ""}
              />
              <button 
                onClick={action}
                disabled={processing}
                className="self-end bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-4 py-2 rounded font-bold uppercase tracking-wide"
              >
                {processing ? 'Выполняю...' : 'Выполнить'}
              </button>
          </div>
      );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in h-auto lg:h-[calc(100vh-200px)]">
      {/* Editor Column */}
      <div className="w-full lg:flex-1 flex flex-col gap-4 min-w-0 h-[500px] lg:h-auto">
        <div className="flex justify-between items-center bg-gray-850 p-2 rounded-t-lg border border-gray-700 border-b-0">
             <h3 className="text-gray-300 font-bold px-2">Финальный Текст (По блокам)</h3>
             <button 
                onClick={copyFullText}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
             >
                📋 Копировать всё
             </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-10 bg-gray-900/50 rounded-lg p-2">
            {blocks.map((block, idx) => (
                <div 
                    key={idx}
                    onClick={() => setSelectedBlockIndex(idx === selectedBlockIndex ? null : idx)}
                    className={`relative group rounded-lg border transition-all cursor-text
                        ${idx === selectedBlockIndex 
                            ? 'border-indigo-500 bg-gray-900 ring-1 ring-indigo-500' 
                            : 'border-gray-800 bg-gray-850 hover:border-gray-600'}`}
                >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                             {idx === selectedBlockIndex ? 'Выбрано' : 'Нажмите для выбора'}
                         </span>
                    </div>
                    <div className="absolute top-2 left-2 text-xs text-gray-600 font-mono select-none">
                        #{idx + 1}
                    </div>
                    <textarea 
                        className="w-full bg-transparent text-gray-300 p-8 pt-6 pb-2 rounded-lg font-mono text-sm resize-none outline-none min-h-[150px]"
                        value={block}
                        onChange={(e) => updateBlock(idx, e.target.value)}
                    />
                </div>
            ))}
        </div>
      </div>

      {/* Tools Column */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Tool Selection */}
        <div className="bg-gray-850 p-4 rounded-lg border border-gray-700">
            <h3 className="text-white font-bold mb-4">Инструменты</h3>
            
            <div className="mb-4 text-xs bg-gray-900 p-2 rounded border border-gray-800 text-indigo-300">
                {selectedBlockIndex !== null 
                    ? `🎯 Выбран блок #${selectedBlockIndex + 1}. Инструменты применятся только к нему.` 
                    : `📄 Блок не выбран. Инструменты применятся ко всему тексту.`}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
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
                        <span className="text-xl">{tool.icon}</span>
                        <div>
                            <div className="text-white font-medium text-sm">{tool.label}</div>
                            <div className="text-xs text-gray-400">{tool.description}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Active Tool Area */}
        {activeTool && (
            <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 flex-1 overflow-y-auto h-[400px] lg:h-auto">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-sm font-bold text-indigo-300">Настройки</h4>
                   <button 
                        onClick={() => setShowPrompt(!showPrompt)}
                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-400 transition-colors"
                    >
                        {showPrompt ? 'Скрыть промпт' : '⚙️ Настроить промпт'}
                    </button>
                </div>
                
                {showPrompt && renderPromptEditor()}

                {processing && <div className="text-center py-10 text-indigo-400 animate-pulse">AI работает над текстом...</div>}
                
                {!processing && activeTool === 'review' && (
                    <div className="whitespace-pre-wrap text-sm text-gray-300 border-t border-gray-700 pt-2">{reviewResult}</div>
                )}

                {!processing && activeTool === 'cliche' && clicheStep === 'fix' && (
                    <div className="flex flex-col h-full">
                         <div className="mb-2 text-xs text-gray-500">Найдено клише: {cliches.length}</div>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[200px]">
                            {cliches.length === 0 ? (
                                <p className="text-green-400 text-center text-sm">Клише не найдено!</p>
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
                                        <div className="text-gray-500 italic">Fix: {c.suggestion}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button 
                            onClick={runClicheFix}
                            disabled={cliches.filter(c => c.selected).length === 0}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded font-medium text-sm"
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