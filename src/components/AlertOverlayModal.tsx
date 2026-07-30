import React, { useState } from 'react';
import { 
  AlertCircle, 
  X, 
  Bell, 
  Clock, 
  Send, 
  Trash2 
} from 'lucide-react';
import { AlertOverlay } from '../types';

interface AlertOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendAlert: (alert: AlertOverlay) => void;
  onClearAlert: () => void;
  currentAlert: AlertOverlay | null;
}

export const AlertOverlayModal: React.FC<AlertOverlayModalProps> = ({
  isOpen,
  onClose,
  onSendAlert,
  onClearAlert,
  currentAlert
}) => {
  const [alertMessage, setAlertMessage] = useState('Nursery Alert: Child #402');
  const [alertType, setAlertType] = useState<'nursery' | 'urgent' | 'announcement'>('nursery');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!alertMessage.trim()) return;
    onSendAlert({
      show: true,
      message: alertMessage,
      type: alertType
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Send Screen Alert Overlay</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Alert Preset Type
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAlertType('nursery');
                  setAlertMessage('Nursery Alert: Child #402');
                }}
                className={`p-2 rounded-lg border font-semibold text-center transition-all ${
                  alertType === 'nursery'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Nursery #
              </button>
              <button
                type="button"
                onClick={() => {
                  setAlertType('urgent');
                  setAlertMessage('Parking Alert: Vehicle ABC-1234 lights on');
                }}
                className={`p-2 rounded-lg border font-semibold text-center transition-all ${
                  alertType === 'urgent'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Urgent Notice
              </button>
              <button
                type="button"
                onClick={() => {
                  setAlertType('announcement');
                  setAlertMessage('Youth Group Meeting after service in Fellowship Hall');
                }}
                className={`p-2 rounded-lg border font-semibold text-center transition-all ${
                  alertType === 'announcement'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Announcement
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Alert Banner Text
            </label>
            <input
              type="text"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder="e.g. Nursery #402 or Vehicle Lights On"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {currentAlert && currentAlert.show && (
            <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-amber-300 block">Active Alert on Screen:</span>
                <span className="text-slate-300">{currentAlert.message}</span>
              </div>
              <button
                onClick={onClearAlert}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
              >
                Remove Alert
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/50"
            >
              <Send className="w-3.5 h-3.5 fill-slate-950" />
              <span>Send to Screen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
