import React, { useEffect, useState } from 'react';
import { Sparkles, Brain, FileCheck, HelpCircle, Loader2 } from 'lucide-react';

interface ProcessingStateProps {
  fileName: string;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, label: 'Reading and parsing document contents...', icon: FileCheck },
  { id: 2, label: 'Extracting key concepts, formulas & definitions...', icon: Brain },
  { id: 3, label: 'Synthesizing concise structured summary...', icon: Sparkles },
  { id: 4, label: 'Formulating multiple-choice practice quiz...', icon: HelpCircle },
];

export const ProcessingState: React.FC<ProcessingStateProps> = ({ fileName, onCancel }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStepIndex(1), 600);
    const timer2 = setTimeout(() => setCurrentStepIndex(2), 1200);
    const timer3 = setTimeout(() => setCurrentStepIndex(3), 1900);

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto py-12 px-4 text-center">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-7 sm:p-9 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Animated Icon */}
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 dark:bg-indigo-400/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Brain className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Analyzing Study Notes
        </h3>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate max-w-xs mx-auto">
          {fileName}
        </p>

        {/* Step Progress List */}
        <div className="mt-6 space-y-2.5 text-left">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-200 ${
                  isCurrent
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 text-indigo-900 dark:text-indigo-200 font-medium'
                    : isCompleted
                    ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 opacity-80'
                    : 'text-slate-400 dark:text-slate-600 opacity-40'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {isCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isCompleted ? '✓' : idx + 1}
                </div>
                <span className="text-xs sm:text-sm">{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Synthesizing ({seconds}s)...</span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
