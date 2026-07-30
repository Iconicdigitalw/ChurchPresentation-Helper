import React from 'react';
import { Slide, QuickState, AlertOverlay, ViewMode } from '../types';
import { THEME_PRESETS } from '../data/mockData';
import { 
  Tv, 
  Eye, 
  ChevronRight, 
  Square, 
  EyeOff, 
  Sparkles, 
  AlertTriangle, 
  Flame, 
  Clock, 
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';

interface LivePreviewPanelProps {
  liveSlide: Slide | null;
  nextSlide: Slide | null;
  isLiveOutputOn: boolean;
  quickState: QuickState;
  setQuickState: (state: QuickState) => void;
  alertOverlay: AlertOverlay | null;
  onClearAlert: () => void;
  onGoNextSlide: () => void;
  onGoPrevSlide: () => void;
  openStageView: () => void;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  liveSlide,
  nextSlide,
  isLiveOutputOn,
  quickState,
  setQuickState,
  alertOverlay,
  onClearAlert,
  onGoNextSlide,
  onGoPrevSlide,
  openStageView
}) => {
  const getThemeClass = (style?: string) => {
    const preset = THEME_PRESETS.find(p => p.id === style);
    return preset ? preset.bgClass : 'bg-slate-900';
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto shrink-0 select-none custom-scrollbar text-slate-100">
      {/* 1. LIVE OUTPUT DISPLAY */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Live Program Output
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openStageView}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition-colors"
              title="Open Stage / Confidence Monitor Display"
            >
              <span>Stage View</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {isLiveOutputOn ? (
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-white bg-rose-600 border border-rose-500 px-2.5 py-1 rounded-full animate-pulse shadow-md shadow-rose-950/50">
                <span className="w-2 h-2 rounded-full bg-white" />
                LIVE
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                OFFLINE
              </span>
            )}
          </div>
        </div>

        {/* The Actual Display Preview Box (16:9 Aspect Ratio) */}
        <div
          className={`relative aspect-video w-full rounded-2xl overflow-hidden border shadow-2xl transition-all flex flex-col justify-between p-4 ${
            !isLiveOutputOn || quickState === 'black'
              ? 'bg-black border-slate-800'
              : quickState === 'clearBg'
              ? 'bg-slate-950 border-slate-800'
              : liveSlide?.bgImageUrl
              ? 'bg-cover bg-center border-slate-800'
              : getThemeClass(liveSlide?.themeStyle)
          }`}
          style={
            isLiveOutputOn && quickState !== 'black' && quickState !== 'clearBg' && liveSlide?.bgImageUrl
              ? { backgroundImage: `url(${liveSlide.bgImageUrl})` }
              : undefined
          }
        >
          {/* Logo Quick State */}
          {quickState === 'logo' && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/40 mb-2">
                <Flame className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-base font-extrabold text-white tracking-wider">
                LOGOS CHURCH
              </h2>
              <p className="text-[10px] text-slate-400">Welcome to Worship</p>
            </div>
          )}

          {/* Normal Slide Content rendering */}
          {isLiveOutputOn && quickState !== 'black' && quickState !== 'logo' && liveSlide && (
            <>
              {/* Optional Background Overlay if image */}
              {liveSlide.bgImageUrl && quickState !== 'clearBg' && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
              )}

              {/* Header / Scripture Tag */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-amber-300">
                <span className="uppercase tracking-widest drop-shadow-md">
                  {quickState === 'clearText' ? '' : liveSlide.header}
                </span>
                {liveSlide.reference && quickState !== 'clearText' && (
                  <span className="bg-black/60 px-2 py-0.5 rounded border border-white/10 text-white font-semibold">
                    {liveSlide.reference}
                  </span>
                )}
              </div>

              {/* Main Text Content */}
              {quickState !== 'clearText' && (
                <div className="relative z-10 my-auto text-center px-2 py-1">
                  <p className="text-sm md:text-base font-extrabold text-white leading-snug drop-shadow-lg whitespace-pre-line">
                    {liveSlide.body}
                  </p>

                  {/* Bullet points if any */}
                  {liveSlide.bulletPoints && liveSlide.bulletPoints.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11px] font-medium text-slate-200 text-left max-w-xs mx-auto">
                      {liveSlide.bulletPoints.map((bp, i) => (
                        <li key={i} className="flex items-start gap-1.5 drop-shadow">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Footer Badge */}
              <div className="relative z-10 text-[8px] text-white/50 text-right uppercase tracking-widest font-semibold">
                LOGOS AI Live
              </div>
            </>
          )}

          {/* Alert Overlay Banner */}
          {alertOverlay && alertOverlay.show && (
            <div className="absolute bottom-2 left-2 right-2 bg-rose-600 text-white border border-rose-400 p-2.5 rounded-xl shadow-2xl flex items-center justify-between gap-2 z-30 animate-bounce">
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                <span>{alertOverlay.message}</span>
              </div>
              <button
                onClick={onClearAlert}
                className="text-[10px] bg-black/50 hover:bg-black/80 px-2 py-0.5 rounded font-bold text-white border border-white/20"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Muted / Offline State */}
          {!isLiveOutputOn && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-slate-500">
              <EyeOff className="w-8 h-8 mb-1 text-slate-600" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Live Program Offline
              </span>
              <span className="text-[10px] text-slate-500">Click PROGRAM LIVE to enable projection</span>
            </div>
          )}
        </div>

        {/* Quick Master Control Keys Bar (F2-F5) */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <button
            onClick={() => setQuickState(quickState === 'clearText' ? 'normal' : 'clearText')}
            className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
              quickState === 'clearText'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            F2: Clear Text
          </button>
          <button
            onClick={() => setQuickState(quickState === 'clearBg' ? 'normal' : 'clearBg')}
            className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
              quickState === 'clearBg'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            F3: Clear BG
          </button>
          <button
            onClick={() => setQuickState(quickState === 'black' ? 'normal' : 'black')}
            className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
              quickState === 'black'
                ? 'bg-rose-600 text-white border-rose-500 font-extrabold shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            F4: Black
          </button>
          <button
            onClick={() => setQuickState(quickState === 'logo' ? 'normal' : 'logo')}
            className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
              quickState === 'logo'
                ? 'bg-indigo-600 text-white border-indigo-500 font-extrabold shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            F5: Logo
          </button>
        </div>
      </div>

      {/* 2. NEXT SLIDE STAGED PREVIEW */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              <ChevronRight className="w-4 h-4 text-indigo-400" />
              <span>Next Staged Slide</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
              Auto-Staged
            </span>
          </div>

          {nextSlide ? (
            <div
              className={`aspect-video w-full rounded-2xl border border-slate-800 p-3.5 flex flex-col justify-between overflow-hidden shadow-xl opacity-90 ${getThemeClass(
                nextSlide.themeStyle
              )}`}
            >
              <div className="text-[9px] font-bold text-amber-300 uppercase">
                {nextSlide.header}
              </div>
              <div className="text-xs text-white text-center font-semibold line-clamp-3 my-auto drop-shadow">
                {nextSlide.body}
              </div>
              <div className="text-[9px] text-white/60 text-right font-semibold">
                {nextSlide.reference || 'Next Slide'}
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl border border-dashed border-slate-800 bg-slate-900 flex flex-col items-center justify-center text-slate-500 text-xs font-medium">
              End of schedule items
            </div>
          )}
        </div>

        {/* Prev / Next Keyboard Navigation Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onGoPrevSlide}
            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            ← Prev Slide
          </button>
          <button
            onClick={onGoNextSlide}
            className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-950/40"
          >
            NEXT SLIDE (SPACE) →
          </button>
        </div>
      </div>
    </aside>
  );
};

