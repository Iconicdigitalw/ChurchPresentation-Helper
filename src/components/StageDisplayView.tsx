import React, { useState, useEffect } from 'react';
import { Slide, QuickState, AlertOverlay } from '../types';
import { THEME_PRESETS } from '../data/mockData';
import { Clock, Tv, X, Flame, AlertCircle } from 'lucide-react';

interface StageDisplayViewProps {
  liveSlide: Slide | null;
  nextSlide: Slide | null;
  quickState: QuickState;
  alertOverlay: AlertOverlay | null;
  onExitStageView: () => void;
}

export const StageDisplayView: React.FC<StageDisplayViewProps> = ({
  liveSlide,
  nextSlide,
  quickState,
  alertOverlay,
  onExitStageView
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="theme-locked-dark fixed inset-0 z-50 bg-black text-slate-100 flex flex-col justify-between p-6 font-sans select-none overflow-hidden">
      {/* Top Bar: Stage Clock & Indicator */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest">
            <Flame className="w-4 h-4 fill-slate-950" />
            <span>STAGE CONFIDENCE MONITOR</span>
          </div>
          <span className="text-xs text-zinc-400 font-semibold">
            {liveSlide?.reference ? `Scripture: ${liveSlide.reference}` : 'PraiseFlow Live'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-xl font-mono text-base font-bold text-amber-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={onExitStageView}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-slate-100 border border-zinc-800 transition-colors"
            title="Return to Operator Console"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center: CURRENT LIVE SLIDE (High-Contrast Large Text for Pastor) */}
      <div className="flex-1 my-6 flex flex-col justify-center items-center text-center px-8 bg-zinc-950 rounded-2xl border border-zinc-900 shadow-2xl relative p-8">
        {quickState === 'black' ? (
          <div className="text-zinc-600 font-bold text-2xl uppercase tracking-widest">
            [ SCREEN IS BLACK ]
          </div>
        ) : quickState === 'clearText' ? (
          <div className="text-zinc-600 font-bold text-2xl uppercase tracking-widest">
            [ TEXT CLEARED BY OPERATOR ]
          </div>
        ) : liveSlide ? (
          <div className="max-w-5xl space-y-4">
            {liveSlide.header && (
              <h2 className="text-2xl md:text-3xl font-black text-amber-400 uppercase tracking-wide">
                {liveSlide.header}
              </h2>
            )}

            <p className="text-3xl md:text-5xl font-black text-slate-100 leading-tight whitespace-pre-line tracking-tight drop-shadow-md">
              {liveSlide.body}
            </p>

            {liveSlide.bulletPoints && liveSlide.bulletPoints.length > 0 && (
              <div className="pt-4 max-w-2xl mx-auto space-y-2 text-left">
                {liveSlide.bulletPoints.map((bp, i) => (
                  <div key={i} className="flex items-start gap-3 text-xl md:text-2xl font-bold text-amber-200">
                    <span className="text-amber-400">•</span>
                    <span>{bp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-zinc-600 font-bold text-2xl">
            [ NO LIVE SLIDE SELECTED ]
          </div>
        )}

        {/* Stage Message Overlay if active */}
        {alertOverlay && alertOverlay.show && (
          <div className="absolute top-4 left-4 right-4 bg-rose-600 text-white font-extrabold text-lg py-3 px-6 rounded-xl border border-rose-400 shadow-2xl flex items-center justify-center gap-3 animate-pulse">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span>STAGE ALERT: {alertOverlay.message}</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: NEXT SLIDE PREVIEW FOR SPEAKER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-6">
        <div className="text-xs font-black uppercase text-amber-400 tracking-wider shrink-0">
          NEXT SLIDE:
        </div>

        <div className="flex-1 text-sm font-bold text-zinc-300 truncate">
          {nextSlide ? (
            <span>
              <span className="text-amber-300 mr-2">[{nextSlide.header || 'Next'}]</span>
              {nextSlide.body.replace(/\n/g, ' ')}
            </span>
          ) : (
            <span className="text-zinc-600">[ END OF SERVICE DECK ]</span>
          )}
        </div>

        <div className="text-xs text-zinc-500 font-mono shrink-0">
          PraiseFlow Stage View
        </div>
      </div>
    </div>
  );
};
