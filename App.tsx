import React, { useState, useEffect } from 'react';
import { AppState, AppStep } from './types';
import StepIndicator from './components/StepIndicator';
import StyleAnalyzer from './components/StyleAnalyzer';
import StructureBuilder from './components/StructureBuilder';
import ScriptGenerator from './components/ScriptGenerator';
import PostProcessor from './components/PostProcessor';
import { Chat } from '@google/genai';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: AppStep.SETUP,
    apiKey: process.env.API_KEY || '',
    bloggerName: '',
    bloggerStyle: '',
    topic: '',
    structure: '',
    generatedScript: '',
    chatSession: null,
  });

  useEffect(() => {
    if (process.env.API_KEY) {
      setState(prev => ({ 
        ...prev, 
        apiKey: process.env.API_KEY!, 
        step: AppStep.STYLE_ANALYSIS 
      }));
    }
  }, []);

  // Setup Step
  if (state.step === AppStep.SETUP) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
         <div className="max-w-md w-full bg-gray-850 p-8 rounded-lg border border-gray-700 shadow-2xl text-center">
            <h1 className="text-3xl font-bold text-indigo-500 mb-6">ScriptGenius AI</h1>
            <p className="text-gray-400 mb-6">
              {process.env.API_KEY ? 'Loading...' : 'API Key not found in environment variables.'}
            </p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ScriptGenius AI
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            {state.bloggerName && <span className="mr-4">Автор: {state.bloggerName}</span>}
            {state.topic && <span>Тема: {state.topic}</span>}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <StepIndicator currentStep={state.step} />

        {state.step === AppStep.STYLE_ANALYSIS && (
          <StyleAnalyzer 
            apiKey={state.apiKey}
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
            apiKey={state.apiKey}
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
            apiKey={state.apiKey}
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