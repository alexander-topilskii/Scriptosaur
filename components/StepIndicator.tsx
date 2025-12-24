import React from 'react';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.STYLE_ANALYSIS, label: 'Стиль' },
  { id: AppStep.STRUCTURE, label: 'Структура' },
  { id: AppStep.GENERATION, label: 'Генерация' },
  { id: AppStep.POST_PROCESSING, label: 'Обработка' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center w-full mb-8">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 
              ${isActive ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10' : 
                isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-gray-600 text-gray-600'}`}>
              {isCompleted ? '✓' : index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;