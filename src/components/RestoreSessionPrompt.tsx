import React from 'react';
import { History, X } from 'lucide-react';
import { describeSavedAt } from '../data/schedulePersistence';

interface RestoreSessionPromptProps {
  savedAt: string;
  itemCount: number;
  onRestore: () => void;
  onDismiss: () => void;
}

/**
 * Offered on load when an autosaved running order is found, so a refresh or a
 * crash mid-service does not cost the operator their service plan.
 */
export const RestoreSessionPrompt: React.FC<RestoreSessionPromptProps> = ({
  savedAt,
  itemCount,
  onRestore,
  onDismiss
}) => (
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(30rem,calc(100%-2rem))]">
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl">
      <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 shrink-0">
        <History className="w-5 h-5 text-amber-400" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-slate-100">Restore your last service plan?</h3>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
          An autosaved running order with {itemCount} item{itemCount === 1 ? '' : 's'} was found from{' '}
          {describeSavedAt(savedAt)}.
        </p>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onRestore}
            className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition-all"
          >
            Restore
          </button>
          <button
            onClick={onDismiss}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:text-slate-100 transition-all"
          >
            Start fresh
          </button>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);
