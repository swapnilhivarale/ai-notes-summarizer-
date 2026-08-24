import React from 'react';
import { AlertTriangle, Upload, RefreshCw } from 'lucide-react';

interface LowContentAlertProps {
  message?: string;
  onUploadNew: () => void;
}

export const LowContentAlert: React.FC<LowContentAlertProps> = ({
  message,
  onUploadNew,
}) => {
  return (
    <div
      id="low-content-warning-card"
      className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 my-6"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold text-amber-950 dark:text-amber-100">
            Limited Content Detected in Notes
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
            {message ||
              'The uploaded notes were very short or contained minimal recognizable text. To ensure high accuracy without making up information, please upload a more detailed document or add more lecture notes.'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onUploadNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload More Complete Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
