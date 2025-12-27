import React, { useState, useEffect } from 'react';
import { AppState, AppStep } from './types';
import StepIndicator from './components/StepIndicator';
import StyleAnalyzer from './components/StyleAnalyzer';
import StructureBuilder from './components/StructureBuilder';
import ScriptGenerator from './components/ScriptGenerator';
import PostProcessor from './components/PostProcessor';

const MODELS = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
  { value: 'gemini-2.5-flash-latest', label: 'Gemini 2.5 Flash' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: AppStep.SETUP,
    selectedModel: 'gemini-3-flash-preview',
    bloggerName: '',
    bloggerStyle: '',
    topic: '',
    structure: '',
    generatedScript: '',
    chatSession: null,
  });

  // Setup Step
  if (state.step === AppStep.SETUP) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
         <div className="max-w-md w-full bg-gray-850 p-6 md:p-8 rounded-lg border border-gray-700 shadow-2xl">
            <h1 className="text-3xl font-bold text-indigo-500 mb-6 text-center">Scriptosaur 🦕</h1>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Model</label>
                <select 
                  value={state.selectedModel}
                  onChange={(e) => setState(prev => ({ ...prev, selectedModel: e.target.value }))}
                  className="w-full bg-gray-950 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => {
                  setState(prev => ({ ...prev, step: AppStep.STYLE_ANALYSIS }));
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded transition-colors mt-6"
              >
                Начать (Start)
              </button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦕</span>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hidden xs:block">
              Scriptosaur
            </h1>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2 md:gap-4">
             <div className="relative group max-w-[150px] md:max-w-none">
                <select 
                  value={state.selectedModel}
                  onChange={(e) => setState(prev => ({ ...prev, selectedModel: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer w-full"
                >
                  {MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
             </div>
            {state.bloggerName && <span className="mr-4 hidden md:inline truncate max-w-[200px]">Автор: {state.bloggerName}</span>}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        <StepIndicator currentStep={state.step} />

        {state.step === AppStep.STYLE_ANALYSIS && (
          <StyleAnalyzer 
            model={state.selectedModel}
            onStyleConfirmed={(name, style) => {
              setState(prev => ({ 
                ...prev, 
                bloggerName: name, 
                bloggerStyle: style, 
                step: AppStep.STRUCTURE 
              }));
            }}
          />
        )}

        {state.step === AppStep.STRUCTURE && (
          <StructureBuilder 
            model={state.selectedModel}
            bloggerStyle={state.bloggerStyle}
            onStructureConfirmed={(topic, structure, chat) => {
              setState(prev => ({
                ...prev,
                topic,
                structure,
                chatSession: chat,
                step: AppStep.GENERATION
              }));
            }}
          />
        )}

        {state.step === AppStep.GENERATION && state.chatSession && (
          <ScriptGenerator 
            chat={state.chatSession}
            structure={state.structure}
            style={state.bloggerStyle}
            onScriptComplete={(fullScript) => {
              setState(prev => ({
                ...prev,
                generatedScript: fullScript,
                step: AppStep.POST_PROCESSING
              }));
            }}
          />
        )}

        {state.step === AppStep.POST_PROCESSING && (
          <PostProcessor 
            model={state.selectedModel}
            script={state.generatedScript}
            style={state.bloggerStyle}
            onUpdateScript={(newScript) => {
              setState(prev => ({ ...prev, generatedScript: newScript }));
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;