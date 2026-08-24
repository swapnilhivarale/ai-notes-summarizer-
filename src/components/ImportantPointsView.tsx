import React, { useState } from 'react';
import {
  KeyPoint,
  KeyPointCategory,
} from '../types';
import {
  Sparkles,
  BookOpen,
  CheckCircle,
  Circle,
  Search,
  Filter,
  Lightbulb,
  Hash,
  Calendar,
  Bookmark,
  Zap,
} from 'lucide-react';

interface ImportantPointsViewProps {
  keyPoints: KeyPoint[];
  topicSubject?: string;
}

const CATEGORY_META: Record<
  KeyPointCategory,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  concept: {
    label: 'Core Concept',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: Lightbulb,
  },
  definition: {
    label: 'Definition',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: BookOpen,
  },
  formula: {
    label: 'Formula / Principle',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: Hash,
  },
  date_fact: {
    label: 'Key Fact / Date',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Calendar,
  },
  takeaway: {
    label: 'Takeaway',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: Zap,
  },
};

export const ImportantPointsView: React.FC<ImportantPointsViewProps> = ({
  keyPoints,
  topicSubject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  const toggleMastered = (id: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredPoints = keyPoints.filter((kp) => {
    const matchesCategory =
      selectedCategory === 'all' || kp.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      kp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kp.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (kp.highlightFact && kp.highlightFact.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const masteredCount = keyPoints.filter((kp) => masteredIds.has(kp.id)).length;
  const progressPercent = Math.round((masteredCount / (keyPoints.length || 1)) * 100);

  return (
    <div className="space-y-5">
      {/* Header with Progress Tracker */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              High-Yield Key Points ({keyPoints.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Check off key points as you master definitions, formulas, and concepts.
          </p>
        </div>

        {/* Progress Bar Badge */}
        <div className="w-full sm:w-64 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-600 dark:text-slate-300">Reviewed</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {masteredCount} / {keyPoints.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            All ({keyPoints.length})
          </button>
          {(['concept', 'definition', 'formula', 'date_fact', 'takeaway'] as KeyPointCategory[]).map(
            (cat) => {
              const meta = CATEGORY_META[cat];
              const count = keyPoints.filter((kp) => kp.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {meta.label} ({count})
                </button>
              );
            }
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Key Points Cards List */}
      {filteredPoints.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No important points found matching your search filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPoints.map((kp) => {
            const isMastered = masteredIds.has(kp.id);
            const meta = CATEGORY_META[kp.category || 'concept'] || CATEGORY_META.concept;
            const CategoryIcon = meta.icon;

            return (
              <div
                key={kp.id}
                id={`point-card-${kp.id}`}
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  isMastered
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Mastered Checkbox Button */}
                  <button
                    onClick={() => toggleMastered(kp.id)}
                    aria-label={isMastered ? 'Mark as unreviewed' : 'Mark as reviewed'}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                  >
                    {isMastered ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Header with Title and Category Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <h4
                        className={`text-base font-bold transition-colors ${
                          isMastered
                            ? 'text-slate-500 dark:text-slate-400 line-through'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {kp.title}
                      </h4>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}
                      >
                        <CategoryIcon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </div>

                    {/* Explanation */}
                    <p
                      className={`text-sm leading-relaxed ${
                        isMastered
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {kp.explanation}
                    </p>

                    {/* Highlight Fact or Quote if present */}
                    {kp.highlightFact && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">Key Fact:</span>
                        <span className="italic">"{kp.highlightFact}"</span>
                      </div>
                    )}

                    {/* Tags */}
                    {kp.tags && kp.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        {kp.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
