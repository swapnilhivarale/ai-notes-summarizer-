import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ProcessingState } from './components/ProcessingState';
import { SummaryView } from './components/SummaryView';
import { ImportantPointsView } from './components/ImportantPointsView';
import { QuizView } from './components/QuizView';
import { LowContentAlert } from './components/LowContentAlert';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { NoteAnalysis, SummaryLength } from './types';
import { SampleNote, SAMPLE_STUDY_NOTES } from './data/sampleNotes';
import {
  FileText,
  Sparkles,
  ListOrdered,
  HelpCircle,
  UploadCloud,
  AlertCircle,
  RotateCw,
  RefreshCw,
  PlusCircle,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{
    payload: any;
    length: SummaryLength;
  } | null>(null);

  const [activeAnalysis, setActiveAnalysis] = useState<NoteAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState<boolean>(false);
  const [isGeneratingNewQuiz, setIsGeneratingNewQuiz] = useState<boolean>(false);
  const [processingFileName, setProcessingFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'key_points' | 'quiz'>('summary');
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');

  // Helper to safely parse API responses without HTML syntax crashes
  const parseApiResponse = async (res: Response) => {
    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('File is too large for processing. Please select a document under 50MB.');
        }
        if (res.status === 504 || res.status === 502) {
          throw new Error('The analysis server timed out. Please try again with a slightly shorter note section or retry.');
        }
        if (res.status === 503) {
          throw new Error('AI service is temporarily busy. Please wait a few moments and try again.');
        }
        throw new Error(`Server returned HTTP ${res.status}. Please try again.`);
      }
      throw new Error('Received an unexpected response format from server. Please try again.');
    }

    if (!res.ok || data?.error) {
      throw new Error(data?.error || `Request failed with HTTP status ${res.status}.`);
    }

    return data;
  };

  // Main Analyze handler
  const handleAnalyzeNotes = async (
    payload: {
      fileName: string;
      fileType: 'pdf' | 'text' | 'image';
      mimeType: string;
      base64Data?: string;
      textContent?: string;
      pageImages?: string[];
      isScanned?: boolean;
      pageCount?: number;
      fileSize?: number;
    },
    length: SummaryLength
  ) => {
    if (!user) {
      setPendingPayload({ payload, length });
      setIsAuthModalOpen(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setProcessingFileName(payload.fileName);

    try {
      const res = await fetch('/api/analyze-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePayload: payload,
          length,
        }),
      });

      const data = await parseApiResponse(res);

      const newAnalysis: NoteAnalysis = {
        ...data,
        storedFilePayload: payload,
      };

      setActiveAnalysis(newAnalysis);
      setActiveTab('summary');
      setSummaryLength(length);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while processing your notes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate summary with updated length
  const handleRegenerateSummary = async (newLength: SummaryLength) => {
    if (!activeAnalysis?.storedFilePayload) {
      // If we don't have stored payload, just update length
      setSummaryLength(newLength);
      return;
    }

    setIsRegeneratingSummary(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/regenerate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePayload: activeAnalysis.storedFilePayload,
          length: newLength,
          previousSummary: activeAnalysis.summary,
        }),
      });

      const data = await parseApiResponse(res);

      setActiveAnalysis((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          summary: data.summary,
          lengthOption: newLength,
          overviewStats: {
            ...prev.overviewStats,
            estimatedReadTimeMinutes: data.estimatedReadTimeMinutes || prev.overviewStats.estimatedReadTimeMinutes,
          },
        };
      });
      setSummaryLength(newLength);
    } catch (err: any) {
      console.error('Regenerate summary error:', err);
      setErrorMessage(err.message || 'Failed to regenerate summary.');
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  // Generate new quiz questions
  const handleGenerateNewQuiz = async () => {
    if (!activeAnalysis?.storedFilePayload) return;

    setIsGeneratingNewQuiz(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePayload: activeAnalysis.storedFilePayload,
          count: 5,
        }),
      });

      const data = await parseApiResponse(res);

      setActiveAnalysis((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          quiz: data.quiz || prev.quiz,
        };
      });
      setActiveTab('quiz');
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setErrorMessage(err.message || 'Failed to generate new quiz.');
    } finally {
      setIsGeneratingNewQuiz(false);
    }
  };

  const handleUploadAnother = () => {
    setActiveAnalysis(null);
    setErrorMessage(null);
    setActiveTab('summary');
  };

  // Auto resume pending analysis when user logs in
  useEffect(() => {
    if (user && pendingPayload) {
      const { payload, length } = pendingPayload;
      setPendingPayload(null);
      handleAnalyzeNotes(payload, length);
    }
  }, [user, pendingPayload]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Header Navigation */}
      <Header
        onSelectSampleNote={(sample) => {
          handleAnalyzeNotes(
            {
              fileName: sample.fileName,
              fileType: 'text',
              mimeType: 'text/plain',
              textContent: sample.content,
            },
            summaryLength
          );
        }}
        onUploadNewFile={handleUploadAnother}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        hasActiveAnalysis={!!activeAnalysis}
        currentFileName={activeAnalysis?.fileName}
      />

      {/* Auth Modal Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        customTitle="Sign In to Generate Notes"
        customSubtitle="Create a free account or sign in to analyze your documents, generate high-yield summaries, and practice quizzes."
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Banner if any */}
        {errorMessage && (
          <div
            id="global-error-banner"
            className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold">Error Notice</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* STATE 1: LOADING / PROCESSING STATE */}
        {isLoading ? (
          <ProcessingState fileName={processingFileName} onCancel={() => setIsLoading(false)} />
        ) : !activeAnalysis ? (
          /* STATE 2: HOME / UPLOAD STATE */
          <UploadZone
            onAnalyze={handleAnalyzeNotes}
            isLoading={isLoading}
            selectedLength={summaryLength}
            onChangeLength={setSummaryLength}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onSelectSample={(sample) => {
              handleAnalyzeNotes(
                {
                  fileName: sample.fileName,
                  fileType: 'text',
                  mimeType: 'text/plain',
                  textContent: sample.content,
                },
                summaryLength
              );
            }}
          />
        ) : (
          /* STATE 3: RESULTS BENTO GRID DASHBOARD */
          <div className="space-y-6">
            {/* Low content warning if flagged */}
            {activeAnalysis.isLowContent && (
              <LowContentAlert
                message={activeAnalysis.lowContentMessage}
                onUploadNew={handleUploadAnother}
              />
            )}

            {/* Bento Grid layout container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Bento Column (Col 4): Source, Settings & Quick Actions */}
              <section className="lg:col-span-4 flex flex-col gap-5">
                {/* Bento Card 1: Upload Source Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Upload Source
                    </h3>
                    <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                      Analyzed
                    </span>
                  </div>

                  {/* Active File Badge */}
                  <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0 border border-indigo-100 dark:border-slate-700">
                      {activeAnalysis.fileType.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-slate-900 dark:text-white" title={activeAnalysis.fileName}>
                        {activeAnalysis.fileName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeAnalysis.fileSize ? `${(activeAnalysis.fileSize / 1024).toFixed(1)} KB` : `~${activeAnalysis.overviewStats?.wordCountEstimate || 450} words`} • {new Date(activeAnalysis.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={handleUploadAnother}
                      title="Upload different file"
                      className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stats snippet */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Subject</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                        {activeAnalysis.overviewStats?.topicSubject || 'General'}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Read Time</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                        ~{activeAnalysis.overviewStats?.estimatedReadTimeMinutes || 3} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bento Card 2: Settings & Actions */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-5 flex-1 shadow-sm">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      Summary Detail
                    </h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-700">
                      {(['short', 'medium', 'detailed'] as SummaryLength[]).map((len) => (
                        <button
                          key={len}
                          id={`bento-length-${len}`}
                          onClick={() => {
                            setSummaryLength(len);
                            handleRegenerateSummary(len);
                          }}
                          disabled={isRegeneratingSummary}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                            summaryLength === len
                              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          {len === 'detailed' ? 'Full' : len}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      id="bento-regenerate-summary-btn"
                      onClick={() => handleRegenerateSummary(summaryLength)}
                      disabled={isRegeneratingSummary}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className={`w-4 h-4 ${isRegeneratingSummary ? 'animate-spin' : ''}`} />
                      <span>{isRegeneratingSummary ? 'Synthesizing...' : 'Regenerate Summary'}</span>
                    </button>

                    <button
                      id="bento-generate-quiz-btn"
                      onClick={handleGenerateNewQuiz}
                      disabled={isGeneratingNewQuiz}
                      className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate New Practice Quiz</span>
                    </button>

                    <button
                      id="bento-upload-new-btn"
                      onClick={handleUploadAnother}
                      className="w-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Upload Another Document</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Right Bento Column (Col 8): Main Tabbed Workspace */}
              <section className="lg:col-span-8 flex flex-col gap-5">
                {/* Bento Tabs Header Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm flex items-center gap-2">
                  <button
                    id="results-tab-summary"
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'summary'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Executive Overview</span>
                  </button>

                  <button
                    id="results-tab-points"
                    onClick={() => setActiveTab('key_points')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'key_points'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <ListOrdered className="w-4 h-4" />
                    <span>Important Points</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTab === 'key_points'
                          ? 'bg-indigo-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {activeAnalysis.keyPoints.length}
                    </span>
                  </button>

                  <button
                    id="results-tab-quiz"
                    onClick={() => setActiveTab('quiz')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'quiz'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Practice Quiz</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTab === 'quiz'
                          ? 'bg-indigo-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {activeAnalysis.quiz.length}
                    </span>
                  </button>
                </div>

                {/* Tab Views */}
                {activeTab === 'summary' && (
                  <SummaryView
                    analysis={activeAnalysis}
                    onRegenerateSummary={handleRegenerateSummary}
                    isRegenerating={isRegeneratingSummary}
                  />
                )}

                {activeTab === 'key_points' && (
                  <ImportantPointsView
                    keyPoints={activeAnalysis.keyPoints}
                    topicSubject={activeAnalysis.overviewStats?.topicSubject}
                  />
                )}

                {activeTab === 'quiz' && (
                  <QuizView
                    quiz={activeAnalysis.quiz}
                    onGenerateNewQuiz={handleGenerateNewQuiz}
                    isGeneratingNewQuiz={isGeneratingNewQuiz}
                    onUploadAnother={handleUploadAnother}
                  />
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Clean Bento Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Lumina AI Notes • Bento Grid Study Workspace</p>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini 3.7 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
