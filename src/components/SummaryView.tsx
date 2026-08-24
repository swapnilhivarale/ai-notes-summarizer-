import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  RotateCw,
  Clock,
  FileText,
  Bookmark,
  GraduationCap,
  Sparkles,
  Zap,
} from 'lucide-react';
import { NoteAnalysis, SummaryLength } from '../types';
import { exportStudyNotesToPdf } from '../utils/pdfExport';

interface SummaryViewProps {
  analysis: NoteAnalysis;
  onRegenerateSummary: (length: SummaryLength) => void;
  isRegenerating: boolean;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  analysis,
  onRegenerateSummary,
  isRegenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [currentLength, setCurrentLength] = useState<SummaryLength>(analysis.lengthOption || 'medium');

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadPdf = () => {
    exportStudyNotesToPdf(analysis);
  };

  const handleLengthChange = (length: SummaryLength) => {
    setCurrentLength(length);
    onRegenerateSummary(length);
  };

  // Convert markdown bolding (**term**) into highlighted styled spans for readability
  const renderFormattedSummary = (text: string) => {
    const paragraphs = text.split('\n\n').filter((p) => p.trim());

    return paragraphs.map((para, pIdx) => {
      // Check if it's a heading
      if (para.startsWith('# ') || para.startsWith('## ') || para.startsWith('### ')) {
        const cleanHeading = para.replace(/^#+\s*/, '');
        return (
          <h4
            key={pIdx}
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2 first:mt-0 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            {cleanHeading}
          </h4>
        );
      }

      // Check if it's bullet list items
      if (para.includes('\n- ') || para.startsWith('- ')) {
        const items = para.split('\n').filter((line) => line.trim());
        return (
          <ul key={pIdx} className="space-y-2 my-3 pl-2">
            {items.map((item, iIdx) => {
              const cleanItem = item.replace(/^-\s*/, '');
              return (
                <li key={iIdx} className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <span>{parseBoldSpans(cleanItem)}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      return (
        <p
          key={pIdx}
          className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4 last:mb-0"
        >
          {parseBoldSpans(para)}
        </p>
      );
    });
  };

  const parseBoldSpans = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong
            key={idx}
            className="font-bold text-slate-900 dark:text-white bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-100/60 dark:border-indigo-900/40"
          >
            {inner}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-5">
      {/* Bento Main Summary Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col">
        {/* Bento Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
              Summary Complete
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Executive Overview
            </h2>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              id="copy-summary-btn"
              onClick={handleCopy}
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              id="download-pdf-btn"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Summary Content Body */}
        <div className="py-6 overflow-y-auto">
          {isRegenerating ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <RotateCw className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Re-synthesizing note summary ({currentLength} format)...</p>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-sm space-y-4">
              {renderFormattedSummary(analysis.summary)}
            </div>
          )}
        </div>

        {/* Footer info pill */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Length mode: <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{currentLength}</span></span>
          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
            <Sparkles className="w-3 h-3" /> Grounded in provided notes
          </span>
        </div>
      </div>

      {/* Bento Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Reading Time
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            ~{analysis.overviewStats?.estimatedReadTimeMinutes || 3} min
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Subject
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {analysis.overviewStats?.topicSubject || 'Study Notes'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Difficulty
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {analysis.overviewStats?.difficultyLevel || 'Intermediate'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            Volume
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            ~{analysis.overviewStats?.wordCountEstimate || 450} words
          </p>
        </div>
      </div>
    </div>
  );
};
