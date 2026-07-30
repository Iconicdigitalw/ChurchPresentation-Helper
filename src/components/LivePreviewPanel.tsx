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
    <aside className="w-full lg:w-80 xl:w-96 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto shrink-0 select-none custom-scrollbar text-slate-800">
      {/* 1. LIVE OUTPUT DISPLAY */}
      <div className="p-4 border-b border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Program Output
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openStageView}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md transition-colors"
              title="Open Stage / Confidence Monitor Display"
            >
              <span>Stage View</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {isLiveOutputOn ? (
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                OFFLINE
              </span>
            )}
          </div>
        </div>

        {/* The Actual Display Preview Box (16:9 Aspect Ratio) */}
        <div
          className={`relative aspect-video w-full rounded-xl overflow-hidden border shadow-lg transition-all flex flex-col justify-between p-4 ${
            !isLiveOutputOn || quickState === 'black'
              ? 'bg-black border-slate-800'
              : quickState === 'clearBg'
              ? 'bg-slate-950 border-slate-700'
              : liveSlide?.bgImageUrl
              ? 'bg-cover bg-center border-slate-700'
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
              <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 mb-2">
                <Flame className="w-8 h-8 text-indigo-400" />
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
              <div className="relative z-10 flex items-center justify-between text-[10px] font-semibold text-indigo-300">
                <span className="uppercase tracking-widest drop-shadow">
                  {quickState === 'clearText' ? '' : liveSlide.header}
                </span>
                {liveSlide.reference && quickState !== 'clearText' && (
                  <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10 text-white">
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
                    <ul className="mt-2 space-y-1 text-[11px] font-medium text-indigo-100 text-left max-w-xs mx-auto">
                      {liveSlide.bulletPoints.map((bp, i) => (
                        <li key={i} className="flex items-start gap-1.5 drop-shadow">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Footer Badge */}
              <div className="relative z-10 text-[8px] text-white/50 text-right uppercase tracking-widest">
                LOGOS AI Live
              </div>
            </>
          )}

          {/* Alert Overlay Banner */}
          {alertOverlay && alertOverlay.show && (
            <div className="absolute bottom-2 left-2 right-2 bg-red-600 text-white border border-red-400 p-2.5 rounded-lg shadow-2xl flex items-center justify-between gap-2 z-30 animate-bounce">
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                <span>{alertOverlay.message}</span>
              </div>
              <button
                onClick={onClearAlert}
                className="text-[10px] bg-black/40 hover:bg-black/60 px-2 py-0.5 rounded font-semibold text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Muted / Offline State */}
          {!isLiveOutputOn && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-slate-500">
              <EyeOff className="w-8 h-8 mb-1 text-slate-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Program Offline
              </span>
              <span className="text-[10px] text-slate-500">Click GO LIVE to project</span>
            </div>
          )}
        </div>

        {/* Quick Action Keys Bar */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <button
            onClick={() => setQuickState(quickState === 'clearText' ? 'normal' : 'clearText')}
            className={`py-2 px-1 rounded-md text-[10px] font-bold border transition-colors ${
              quickState === 'clearText'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            F2: Clear Text
          </button>
          <button
            onClick={() => setQuickState(quickState === 'clearBg' ? 'normal' : 'clearBg')}
            className={`py-2 px-1 rounded-md text-[10px] font-bold border transition-colors ${
              quickState === 'clearBg'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            F3: Clear BG
          </button>
          <button
            onClick={() => setQuickState(quickState === 'black' ? 'normal' : 'black')}
            className={`py-2 px-1 rounded-md text-[10px] font-bold border transition-colors ${
              quickState === 'black'
                ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            F4: Black
          </button>
          <button
            onClick={() => setQuickState(quickState === 'logo' ? 'normal' : 'logo')}
            className={`py-2 px-1 rounded-md text-[10px] font-bold border transition-colors ${
              quickState === 'logo'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            F5: Logo
          </button>
        </div>
      </div>

      {/* 2. NEXT SLIDE STAGED PREVIEW */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <ChevronRight className="w-4 h-4 text-indigo-600" />
            <span>Next Staged Slide</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full">
            Auto-Staged
          </span>
        </div>

        {nextSlide ? (
          <div
            className={`aspect-video w-full rounded-xl border border-slate-300 p-3 flex flex-col justify-between overflow-hidden shadow-xs opacity-95 ${getThemeClass(
              nextSlide.themeStyle
            )}`}
          >
            <div className="text-[9px] font-bold text-indigo-300 uppercase">
              {nextSlide.header}
            </div>
            <div className="text-xs text-white/95 text-center font-medium line-clamp-3 my-auto">
              {nextSlide.body}
            </div>
            <div className="text-[9px] text-white/60 text-right font-semibold">
              {nextSlide.reference || 'Next Slide'}
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
            End of schedule item
          </div>
        )}

        {/* Prev / Next Keyboard Navigation Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onGoPrevSlide}
            className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            ← Previous Slide
          </button>
          <button
            onClick={onGoNextSlide}
            className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            Next Slide (Space) →
          </button>
        </div>
      </div>
    </aside>
  );
};
