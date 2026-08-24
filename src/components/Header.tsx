import React, { useState } from 'react';
import { PlusCircle, LogIn, LogOut } from 'lucide-react';
import { SAMPLE_STUDY_NOTES, SampleNote } from '../data/sampleNotes';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onSelectSampleNote?: (sample: SampleNote) => void;
  onUploadNewFile?: () => void;
  onOpenAuthModal?: () => void;
  hasActiveAnalysis: boolean;
  currentFileName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSampleNote,
  onUploadNewFile,
  onOpenAuthModal,
  hasActiveAnalysis,
  currentFileName,
}) => {
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full h-16 px-4 sm:px-8 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 transition-colors"
    >
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-500/20">
            Σ
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Lumina AI <span className="text-indigo-600 dark:text-indigo-400">Notes</span>
            </span>
            <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
              Bento AI
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick sample notes buttons when on initial screen */}
          {!hasActiveAnalysis && onSelectSampleNote && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mr-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">Samples:</span>
              {SAMPLE_STUDY_NOTES.map((sample) => (
                <button
                  key={sample.id}
                  id={`sample-btn-${sample.id}`}
                  onClick={() => onSelectSampleNote(sample)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-all text-xs font-medium cursor-pointer"
                  title={`Load ${sample.title}`}
                >
                  {sample.category}
                </button>
              ))}
            </div>
          )}

          {/* Upload Another File Button (Visible when viewing analysis) */}
          {hasActiveAnalysis && onUploadNewFile && (
            <button
              id="header-upload-another-btn"
              onClick={onUploadNewFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Source</span>
              <span className="sm:hidden">New</span>
            </button>
          )}

          {/* User Auth Profile / Login Button */}
          {user ? (
            <div className="relative">
              <button
                id="header-profile-btn"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              {showProfileMenu && (
                <div
                  id="profile-dropdown-menu"
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-fade-in text-xs"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName || 'Learner'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  <button
                    id="profile-logout-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="header-login-btn"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
