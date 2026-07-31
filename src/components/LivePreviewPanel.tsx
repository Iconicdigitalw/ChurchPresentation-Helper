import React from 'react';
import { Slide, QuickState, AlertOverlay, ViewMode } from '../types';
import { THEME_PRESETS } from '../data/mockData';
import { 
  Tv, 
  Eye, 
  ChevronRight, 
  ChevronLeft,
  Play,
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
  onToggleLiveOutput?: () => void;
  quickState: QuickState;
  setQuickState: (state: QuickState) => void;
  alertOverlay: AlertOverlay | null;
  onClearAlert: () => void;
  onGoNextSlide: () => void;
  onGoPrevSlide: () => void;
  onPushLive?: () => void;
  openStageView: () => void;
  activeViewMode?: ViewMode;
  setActiveViewMode?: (mode: ViewMode) => void;
  customWidth?: number;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  liveSlide,
  nextSlide,
  isLiveOutputOn,
  onToggleLiveOutput,
  quickState,
  setQuickState,
  alertOverlay,
  onClearAlert,
  onGoNextSlide,
  onGoPrevSlide,
  onPushLive,
  openStageView,
  customWidth
}) => {
  const [previewMode, setPreviewMode] = React.useState<'operator' | 'stage'>('operator');

  const getThemeClass = (style?: string) => {
    const preset = THEME_PRESETS.find(p => p.id === style);
    return preset ? preset.bgClass : 'bg-slate-900';
  };

  return (
    <aside 
      style={customWidth ? { width: `${customWidth}px` } : undefined}
      className={`w-full ${customWidth ? '' : 'lg:w-80 xl:w-96'} bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto shrink-0 select-none custom-scrollbar text-slate-100`}
    >
      {/* 1. LIVE OUTPUT DISPLAY */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Live Output
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher Pill */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setPreviewMode('operator')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                  previewMode === 'operator'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Operator
              </button>
              <button
                onClick={() => setPreviewMode('stage')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                  previewMode === 'stage'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Stage View
              </button>
              <button
                onClick={openStageView}
                className="p-1 text-slate-400 hover:text-amber-300 transition-colors"
                title="Open Fullscreen Stage View"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => onToggleLiveOutput && onToggleLiveOutput()}
              className={`flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                isLiveOutputOn
                  ? 'text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-md shadow-rose-950/50 animate-pulse'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
              }`}
              title={isLiveOutputOn ? 'Click to turn Live Output OFFLINE' : 'Click to turn Live Output ONLINE'}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveOutputOn ? 'bg-white animate-ping' : 'bg-slate-500'}`} />
              <span>{isLiveOutputOn ? 'LIVE' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>

        {/* The Actual Display Preview Box (16:9 Aspect Ratio) */}
        {previewMode === 'stage' ? (
          /* Stage / Confidence Monitor Preview Box */
          <div className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 shadow-2xl flex flex-col justify-between p-3 select-none text-white ${
            isLiveOutputOn ? 'border-2 border-rose-500 ring-2 ring-rose-500/30' : 'border border-zinc-800'
          }`}>
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <div className="flex items-center gap-1 bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                <Flame className="w-2.5 h-2.5 fill-slate-950" />
                <span>STAGE MONITOR</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300 font-bold">
                <Clock className="w-2.5 h-2.5 text-amber-400" />
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Center Live Slide Text */}
            <div className="my-auto text-center px-2 py-1">
              {!isLiveOutputOn || quickState === 'black' ? (
                <p className="text-xs font-extrabold text-zinc-600 tracking-wider uppercase">[ SCREEN BLACK ]</p>
              ) : quickState === 'clearText' ? (
                <p className="text-xs font-extrabold text-zinc-600 tracking-wider uppercase">[ TEXT CLEARED ]</p>
              ) : liveSlide ? (
                <div className="space-y-0.5">
                  {liveSlide.header && (
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-wide">{liveSlide.header}</p>
                  )}
                  <p className="text-xs font-black text-white leading-snug whitespace-pre-line tracking-tight drop-shadow">
                    {liveSlide.body}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-extrabold text-zinc-600">[ NO LIVE SLIDE ]</p>
              )}
            </div>

            {/* Bottom Next Slide Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 flex items-center justify-between text-[9px]">
              <span className="font-extrabold text-amber-400 uppercase mr-1 shrink-0">NEXT:</span>
              <span className="truncate text-zinc-300 font-semibold flex-1">
                {nextSlide ? `${nextSlide.header ? `[${nextSlide.header}] ` : ''}${nextSlide.body.replace(/\n/g, ' ')}` : '[ END OF DECK ]'}
              </span>
            </div>

            {/* Alert Banner */}
            {alertOverlay && alertOverlay.show && (
              <div className="absolute top-1 left-1 right-1 bg-rose-600 text-white font-extrabold text-[10px] p-1.5 rounded border border-rose-400 flex items-center justify-between animate-pulse z-20">
                <span>STAGE ALERT: {alertOverlay.message}</span>
                <button onClick={onClearAlert} className="text-[9px] bg-black/50 px-1.5 py-0.5 rounded hover:bg-black">X</button>
              </div>
            )}
          </div>
        ) : (
          /* Main Program Live Output Preview Box */
          <div
            className={`relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl transition-all flex flex-col justify-between p-4 ${
              isLiveOutputOn
                ? 'border-2 border-rose-500 ring-2 ring-rose-500/30 shadow-rose-950/50'
                : 'border border-slate-800'
            } ${
              !isLiveOutputOn || quickState === 'black'
                ? 'bg-black'
                : quickState === 'clearBg'
                ? 'bg-slate-950'
                : liveSlide?.bgImageUrl
                ? 'bg-cover bg-center'
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
                    <p className={`text-sm md:text-base leading-snug drop-shadow-lg whitespace-pre-line ${
                      liveSlide.type === 'scripture' 
                        ? 'font-serif italic font-semibold text-amber-100/95 tracking-wide leading-relaxed' 
                        : 'font-extrabold text-white'
                    }`}>
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
                <span className="text-[10px] text-slate-500">Click LIVE to enable projection</span>
              </div>
            )}
          </div>
        )}

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
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onGoPrevSlide}
              className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1"
              title="Navigate Preview to Previous Slide (Left Arrow)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>← Prev</span>
            </button>
            <button
              onClick={onGoNextSlide}
              className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1"
              title="Navigate Preview to Next Slide (Right Arrow or Space)"
            >
              <span>Next →</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

