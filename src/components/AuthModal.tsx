import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialMode?: 'signin' | 'signup';
  customTitle?: string;
  customSubtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  customTitle,
  customSubtitle,
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, authError, setAuthError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setAuthError(null);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      if (onClose) onClose();
    } catch {
      // Error handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      if (onClose) onClose();
    } catch {
      // Error handled in auth context
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        id="auth-dialog-card"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
      >
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 p-6 text-white text-center relative">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            {customTitle || (mode === 'signup' ? 'Create Your Lumina Account' : 'Welcome to Lumina AI Notes')}
          </h3>
          <p className="text-xs text-indigo-100/90 mt-1 max-w-xs mx-auto">
            {customSubtitle ||
              (mode === 'signup'
                ? 'Sign up to synthesize your lecture notes, generate quizzes, and save study material.'
                : 'Sign in to access your study notes, quizzes, and instant AI summaries.')}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {authError && (
            <div
              id="auth-error-banner"
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Quick Google Sign In */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleSubmitting || isSubmitting}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isGoogleSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Or with email
            </span>
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full h-11 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Account & Start' : 'Sign In & Access Notes'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  id="switch-to-signup-btn"
                  onClick={() => {
                    setMode('signup');
                    setAuthError(null);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  id="switch-to-signin-btn"
                  onClick={() => {
                    setMode('signin');
                    setAuthError(null);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
