import React, { useState } from 'react';
import {
  QuizQuestion,
} from '../types';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
  BookCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizViewProps {
  quiz: QuizQuestion[];
  onGenerateNewQuiz: () => void;
  isGeneratingNewQuiz: boolean;
  onUploadAnother: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quiz,
  onGenerateNewQuiz,
  isGeneratingNewQuiz,
  onUploadAnother,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'step_by_step' | 'all_at_once'>('step_by_step');

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        score += 1;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const score = calculateScore();
    const percent = Math.round((score / (quiz.length || 1)) * 100);

    if (percent >= 70) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Fallback silently if confetti cannot render
      }
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentQuestionIndex(0);
  };

  const score = calculateScore();
  const total = quiz.length;
  const percentage = Math.round((score / (total || 1)) * 100);
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === total;

  if (!quiz || quiz.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          No Quiz Questions Available
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto mb-5">
          Generate custom multiple-choice questions grounded strictly in your study notes.
        </p>
        <button
          onClick={onGenerateNewQuiz}
          disabled={isGeneratingNewQuiz}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Generate Practice Quiz
        </button>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-5">
      {/* Top Bento Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Practice Quiz ({quiz.length} Questions)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test your knowledge with multiple-choice questions grounded in your notes.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('step_by_step')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'step_by_step'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Step by Step
            </button>
            <button
              onClick={() => setViewMode('all_at_once')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'all_at_once'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Questions
            </button>
          </div>

          <button
            id="generate-new-quiz-btn"
            onClick={onGenerateNewQuiz}
            disabled={isGeneratingNewQuiz}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            title="Generate a fresh set of questions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingNewQuiz ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isGeneratingNewQuiz ? 'Generating...' : 'New Quiz'}</span>
          </button>
        </div>
      </div>

      {/* Score Summary Card (When submitted) */}
      {isSubmitted && (
        <div
          id="quiz-score-card"
          className="p-6 sm:p-8 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none text-center relative overflow-hidden"
        >
          <div className="relative z-10 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3 text-amber-300">
              <Trophy className="w-7 h-7" />
            </div>
            <h4 className="text-2xl font-black">Quiz Completed!</h4>
            <p className="text-indigo-100 text-sm mt-1">
              You scored <span className="font-bold text-white text-lg">{score}</span> out of{' '}
              <span className="font-bold text-white text-lg">{total}</span> ({percentage}%)
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                id="retake-quiz-btn"
                onClick={handleResetQuiz}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs shadow-sm hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Quiz
              </button>
              <button
                id="generate-new-quiz-score-btn"
                onClick={onGenerateNewQuiz}
                disabled={isGeneratingNewQuiz}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-800/90 hover:bg-indigo-900 text-white font-bold text-xs border border-indigo-400/40 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate New Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 1: STEP-BY-STEP SINGLE QUESTION VIEW */}
      {viewMode === 'step_by_step' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          {/* Progress Bar & Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Question {currentQuestionIndex + 1} of {quiz.length}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {answeredCount} of {total} answered
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mb-6 overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%`,
              }}
            />
          </div>

          {/* Current Question */}
          {(() => {
            const currentQ = quiz[currentQuestionIndex];
            const selectedOption = selectedAnswers[currentQ.id];

            return (
              <div key={currentQ.id} className="space-y-5">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {currentQ.question}
                </h4>

                {/* Options List */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrect = optIdx === currentQ.correctOptionIndex;

                    let optionStyle =
                      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700';

                    if (isSubmitted) {
                      if (isCorrect) {
                        optionStyle =
                          'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        optionStyle =
                          'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                      } else {
                        optionStyle =
                          'border-slate-200 dark:border-slate-800 opacity-60 text-slate-500';
                      }
                    } else if (isSelected) {
                      optionStyle =
                        'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium shadow-sm';
                    }

                    return (
                      <button
                        key={optIdx}
                        id={`step-q-${currentQ.id}-opt-${optIdx}`}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              isSubmitted && isCorrect
                                ? 'bg-emerald-600 text-white'
                                : isSubmitted && isSelected && !isCorrect
                                ? 'bg-rose-600 text-white'
                                : isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {optionLetters[optIdx]}
                          </span>
                          <span className="text-sm">{opt}</span>
                        </div>

                        {isSubmitted && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {isSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card (When Submitted) */}
                {isSubmitted && (
                  <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs sm:text-sm">
                    <p className="font-bold text-indigo-900 dark:text-indigo-300">Explanation & Reference:</p>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{currentQ.explanation}</p>
                    {currentQ.referenceFact && (
                      <p className="text-slate-500 dark:text-slate-400 italic mt-1.5">
                        Source Note: "{currentQ.referenceFact}"
                      </p>
                    )}
                  </div>
                )}

                {/* Step Navigation Controls */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {currentQuestionIndex < quiz.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.length - 1, prev + 1))}
                        className="inline-flex items-center gap-1 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Next Question →
                      </button>
                    ) : !isSubmitted ? (
                      <button
                        id="submit-quiz-step-btn"
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                        className={`px-6 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
                          allAnswered
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Submit Answers
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* MODE 2: ALL QUESTIONS LIST VIEW */}
      {viewMode === 'all_at_once' && (
        <div className="space-y-4">
          {quiz.map((q, qIdx) => {
            const selectedOption = selectedAnswers[q.id];

            return (
              <div
                key={q.id}
                id={`all-q-card-${q.id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    <span className="text-indigo-600 dark:text-indigo-400 mr-2">Q{qIdx + 1}.</span>
                    {q.question}
                  </h4>
                  {isSubmitted && (
                    <span className="shrink-0">
                      {selectedOption === q.correctOptionIndex ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrect = optIdx === q.correctOptionIndex;

                    let optionStyle =
                      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700';

                    if (isSubmitted) {
                      if (isCorrect) {
                        optionStyle =
                          'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        optionStyle =
                          'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                      } else {
                        optionStyle =
                          'border-slate-200 dark:border-slate-800 opacity-60 text-slate-500';
                      }
                    } else if (isSelected) {
                      optionStyle =
                        'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium shadow-sm';
                    }

                    return (
                      <button
                        key={optIdx}
                        id={`all-q-${q.id}-opt-${optIdx}`}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              isSubmitted && isCorrect
                                ? 'bg-emerald-600 text-white'
                                : isSubmitted && isSelected && !isCorrect
                                ? 'bg-rose-600 text-white'
                                : isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {optionLetters[optIdx]}
                          </span>
                          <span className="text-xs sm:text-sm">{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-indigo-700 dark:text-indigo-300">Explanation:</p>
                    <p className="mt-0.5">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {!isSubmitted && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {answeredCount} of {total} questions answered
              </span>
              <button
                id="submit-all-quiz-btn"
                onClick={handleSubmit}
                disabled={!allAnswered}
                className={`px-8 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
                  allAnswered
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                Submit Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
