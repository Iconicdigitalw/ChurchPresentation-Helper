import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  request: ConfirmRequest | null;
  onClose: () => void;
}

/**
 * Guard for irreversible actions. A misclick during a live service used to drop
 * a slide - or a whole schedule item - with no way back.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ request, onClose }) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!request) return;

    // Default focus to Cancel so a stray Enter cannot confirm a deletion.
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [request, onClose]);

  if (!request) return null;

  const handleConfirm = () => {
    request.onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="confirm-dialog-title" className="text-base font-bold text-slate-100">
              {request.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{request.message}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 p-4 bg-slate-950">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-slate-100 transition-all"
          >
            {request.cancelLabel || 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all"
          >
            {request.confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
