import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode,
  FileType,
  Sparkles,
  Clipboard,
  Check,
  AlertCircle,
  Clock,
  Zap,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { SummaryLength } from '../types';
import { SAMPLE_STUDY_NOTES, SampleNote } from '../data/sampleNotes';
import { extractTextFromPdf } from '../lib/pdfExtractor';
import { useAuth } from '../context/AuthContext';

interface UploadZoneProps {
  onAnalyze: (payload: {
    fileName: string;
    fileType: 'pdf' | 'text' | 'image';
    mimeType: string;
    base64Data?: string;
    textContent?: string;
    pageImages?: string[];
    isScanned?: boolean;
    pageCount?: number;
    fileSize?: number;
  }, length: SummaryLength) => void;
  isLoading: boolean;
  selectedLength: SummaryLength;
  onChangeLength: (length: SummaryLength) => void;
  onSelectSample?: (sample: SampleNote) => void;
  onRequireAuth?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onAnalyze,
  isLoading,
  selectedLength,
  onChangeLength,
  onSelectSample,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Reading & analyzing document...');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stagedFile, setStagedFile] = useState<{
    file: File;
    name: string;
    size: number;
    type: 'pdf' | 'text' | 'image';
    mimeType: string;
    base64Data?: string;
    textContent?: string;
    pageImages?: string[];
    isScanned?: boolean;
    pageCount?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Validate size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 50MB limit. Please upload a document up to 50MB.');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.webp');
    const isText =
      file.type.startsWith('text/') ||
      file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.md') ||
      file.name.toLowerCase().endsWith('.rtf') ||
      file.name.toLowerCase().endsWith('.csv') ||
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.docx');

    if (!isPdf && !isText && !isImage) {
      setErrorMessage('Please upload a PDF document, study photo, or text notes (.pdf, .png, .jpg, .txt, .md).');
      return;
    }

    if (isPdf) {
      setIsProcessingPdf(true);
      setProcessingMessage('Reading document pages & structure...');
      try {
        // High-speed client extraction + visual page rendering for scanned documents
        const extracted = await extractTextFromPdf(file, (msg) => setProcessingMessage(msg));
        
        let base64Clean: string | undefined = undefined;

        // If file is small (< 8MB) and text wasn't extracted and no page images, load as base64
        if (!extracted.hasExtractedText && (!extracted.pageImages || extracted.pageImages.length === 0) && file.size <= 8 * 1024 * 1024) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1]);
            };
            reader.onerror = () => reject(new Error('Failed to read PDF binary'));
            reader.readAsDataURL(file);
          });
          base64Clean = await base64Promise.catch(() => undefined);
        }

        setStagedFile({
          file,
          name: file.name,
          size: file.size,
          type: 'pdf',
          mimeType: 'application/pdf',
          base64Data: base64Clean,
          textContent: extracted.text && extracted.text.trim().length > 30 ? extracted.text : undefined,
          pageImages: extracted.pageImages,
          isScanned: extracted.isScanned,
          pageCount: extracted.pageCount > 0 ? extracted.pageCount : 1,
        });
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        // Fallback: load as binary base64 if under 15MB
        if (file.size <= 15 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            setStagedFile({
              file,
              name: file.name,
              size: file.size,
              type: 'pdf',
              mimeType: 'application/pdf',
              base64Data: res.split(',')[1],
              pageCount: 1,
            });
          };
          reader.onerror = () => {
            setErrorMessage('Failed to read PDF document. Please try another file.');
          };
          reader.readAsDataURL(file);
        } else {
          setErrorMessage('Could not process this PDF. Please check the file and try again.');
        }
      } finally {
        setIsProcessingPdf(false);
      }
    } else if (isImage) {
      // Direct image upload (e.g. photo of notes, slides, blackboard)
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setStagedFile({
          file,
          name: file.name,
          size: file.size,
          type: 'image',
          mimeType: file.type || 'image/jpeg',
          base64Data: result.split(',')[1],
          pageCount: 1,
        });
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read image file.');
      };
      reader.readAsDataURL(file);
    } else {
      // Text file
      const textReader = new FileReader();
      textReader.onload = () => {
        const text = textReader.result as string;
        if (!text || text.trim().length < 5) {
          setErrorMessage('The uploaded text file appears to be empty or unreadable.');
          return;
        }
        setStagedFile({
          file,
          name: file.name,
          size: file.size,
          type: 'text',
          mimeType: file.type || 'text/plain',
          textContent: text,
        });
      };
      textReader.onerror = () => {
        setErrorMessage('Failed to read text file content.');
      };
      textReader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    setErrorMessage(null);

    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    if (activeTab === 'upload') {
      if (!stagedFile) {
        setErrorMessage('Please select or drop a PDF or text file first.');
        return;
      }
      onAnalyze(
        {
          fileName: stagedFile.name,
          fileType: stagedFile.type,
          mimeType: stagedFile.mimeType,
          base64Data: stagedFile.base64Data,
          textContent: stagedFile.textContent,
          pageImages: stagedFile.pageImages,
          isScanned: stagedFile.isScanned,
          pageCount: stagedFile.pageCount,
          fileSize: stagedFile.size,
        },
        selectedLength
      );
    } else {
      // Paste tab
      if (!pastedText.trim()) {
        setErrorMessage('Please paste or type your lecture or study notes.');
        return;
      }
      if (pastedText.trim().length < 15) {
        setErrorMessage('Notes are too brief. Please enter at least a few sentences for a meaningful summary and quiz.');
        return;
      }
      const title = pasteTitle.trim() || 'Pasted_Study_Notes.txt';
      onAnalyze(
        {
          fileName: title.endsWith('.txt') ? title : `${title}.txt`,
          fileType: 'text',
          mimeType: 'text/plain',
          textContent: pastedText,
          fileSize: new Blob([pastedText]).size,
        },
        selectedLength
      );
    }
  };

  const loadSample = (sample: SampleNote) => {
    setErrorMessage(null);
    setActiveTab('paste');
    setPasteTitle(sample.title);
    setPastedText(sample.content);
  };

  return (
    <div className="w-full py-4 sm:py-6">
      {/* Bento Grid Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3 border border-indigo-100 dark:border-indigo-800">
          <Sparkles className="w-3.5 h-3.5" />
          Bento Study Workspace
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Turn Study Notes into Fast Understanding
        </h2>
        <p className="mt-2.5 text-base sm:text-lg text-slate-600 dark:text-slate-300">
          Upload class notes or PDF slides to instantly generate structured overviews, key formulas, and grounded practice quizzes.
        </p>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Bento Column (Settings & Features) */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          {/* Card 1: Summary Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Settings & Detail
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                Summary Detail Level
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-700">
                <button
                  id="length-short-btn"
                  type="button"
                  onClick={() => onChangeLength('short')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedLength === 'short'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Short
                </button>
                <button
                  id="length-medium-btn"
                  type="button"
                  onClick={() => onChangeLength('medium')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedLength === 'medium'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Medium
                </button>
                <button
                  id="length-detailed-btn"
                  type="button"
                  onClick={() => onChangeLength('detailed')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedLength === 'detailed'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Full
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Supported formats</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">PDF, TXT, MD</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Max file size</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">50 MB</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">AI Engine</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Gemini 3.7 Flash</span>
              </div>
            </div>
          </div>

          {/* Card 2: High Yield Modules */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-3.5 shadow-sm flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              What You Get
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Executive Overview</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Synthesized summaries tailored to your preferred depth.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Important Points</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Key formulas, definitions, principles, and dates checklist.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Practice Quiz</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Grounded multiple-choice questions with instant scoring.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Bento Column (Upload & Ingestion Zone) */}
        <section className="lg:col-span-8 flex flex-col gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col flex-1">
            {/* Upload Mode Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-700 mb-6">
              <button
                id="tab-upload-file"
                onClick={() => {
                  setActiveTab('upload');
                  setErrorMessage(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                Upload PDF or Document
              </button>
              <button
                id="tab-paste-notes"
                onClick={() => {
                  setActiveTab('paste');
                  setErrorMessage(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Paste Text Notes
              </button>
            </div>

            {/* TAB 1: File Drag & Drop */}
            {activeTab === 'upload' && (
              <div className="flex-1 flex flex-col">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.rtf,.doc,.docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload-input"
                />

                {isProcessingPdf ? (
                  <div
                    id="dropzone-processing"
                    className="border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-8 sm:p-12 text-center bg-indigo-50/50 dark:bg-indigo-950/30 flex-1 flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-3 shadow-inner">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {processingMessage}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Processing digital text, visual pages, formulas, and diagrams
                    </p>
                  </div>
                ) : !stagedFile ? (
                  <div
                    id="dropzone-area"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex-1 flex flex-col items-center justify-center ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-850 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-3 shadow-inner">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Drop PDF, Scanned Document, Image, or Notes here
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Up to 50MB • All PDFs supported (Digital, Scanned, Handwritten, Textbook Slides)
                    </p>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Browse Files
                    </button>
                  </div>
                ) : (
                  /* Staged File Bento Card */
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 my-auto">
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <div className="w-11 h-11 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase shrink-0 border border-indigo-100 dark:border-slate-700">
                        {stagedFile.type === 'pdf' ? (stagedFile.isScanned ? 'SCAN' : 'PDF') : stagedFile.type === 'image' ? 'IMG' : 'TXT'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-sm">
                          {stagedFile.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-2 mt-0.5">
                          <span>{formatFileSize(stagedFile.size)}</span>
                          {stagedFile.pageCount && (
                            <>
                              <span>•</span>
                              <span>{stagedFile.pageCount} {stagedFile.pageCount === 1 ? 'page' : 'pages'}</span>
                            </>
                          )}
                          {stagedFile.isScanned && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Visual OCR Ready</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ready
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        id="change-file-btn"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        Change
                      </button>
                      <button
                        id="remove-staged-file-btn"
                        type="button"
                        onClick={() => setStagedFile(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Direct Paste Notes */}
            {activeTab === 'paste' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Topic / Note Title (Optional)
                  </label>
                  <input
                    id="paste-title-input"
                    type="text"
                    placeholder="e.g. Intro to Cognitive Psychology (Lecture 1)"
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Study Notes / Transcript
                    </label>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {pastedText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    id="paste-textarea"
                    rows={8}
                    placeholder="Paste lecture notes, study guide bullets, definitions, or textbook excerpts..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full flex-1 min-h-[180px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div
                id="upload-error-alert"
                className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-bold">Unable to process file</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                {activeTab === 'upload'
                  ? (stagedFile ? 'Click analyze to process document' : 'Select a file to begin')
                  : (pastedText.trim() ? `${pastedText.split(/\s+/).filter(Boolean).length} words ready for synthesis` : 'Type or paste notes above')}
              </p>

              <button
                id="analyze-notes-submit-btn"
                type="button"
                disabled={isLoading || (activeTab === 'upload' && !stagedFile) || (activeTab === 'paste' && !pastedText.trim())}
                onClick={handleSubmit}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-xs sm:text-sm text-white transition-all cursor-pointer ${
                  isLoading || (activeTab === 'upload' && !stagedFile) || (activeTab === 'paste' && !pastedText.trim())
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-200 dark:shadow-none'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {user ? 'Generate Summary & Quiz' : 'Log In to Generate Notes'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Bento Row 2: 1-Click Sample Notes */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Quick-Start Sample Study Notes
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SAMPLE_STUDY_NOTES.map((sample) => (
            <button
              key={sample.id}
              id={`sample-card-${sample.id}`}
              onClick={() => loadSample(sample)}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/60">
                    {sample.category}
                  </span>
                  <span className="text-[10px] text-slate-400">Sample Material</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {sample.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {sample.subject} • High-yield study notes with definitions & formulas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Load into workspace</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
