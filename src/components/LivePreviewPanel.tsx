import React from 'react';
import { Slide, QuickState, AlertOverlay, ViewMode } from '../types';
import { SlideCanvas } from './SlideCanvas';
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
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Operator
              </button>
              <button
                onClick={() => setPreviewMode('stage')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                  previewMode === 'stage'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100'
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
          <div className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 shadow-2xl flex flex-col justify-between p-3 select-none text-slate-100 ${
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

            {/* Center Live Slide Text (same canvas the stage monitor renders) */}
            <div className="flex-1 min-h-0 flex items-center justify-center py-1.5">
              <div className="h-full" style={{ aspectRatio: '16 / 9' }}>
                <SlideCanvas
                  slide={liveSlide}
                  variant="stage"
                  quickState={!isLiveOutputOn ? 'black' : quickState}
                  emptyMessage="[ NO LIVE SLIDE ]"
                  className="rounded-lg"
                />
              </div>
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
          /* Main Program Live Output Preview Box - the exact audience canvas */
          <div className="relative w-full">
            <SlideCanvas
              slide={liveSlide}
              quickState={isLiveOutputOn ? quickState : 'black'}
              alertMessage={alertOverlay && alertOverlay.show ? alertOverlay.message : null}
              emptyMessage="[ NO LIVE SLIDE ]"
              className={`rounded-2xl shadow-2xl transition-all ${
                isLiveOutputOn
                  ? 'border-2 border-rose-500 ring-2 ring-rose-500/30 shadow-rose-950/50'
                  : 'border border-slate-800'
              }`}
            />

            {/* Operator-only alert dismiss affordance (never on the projector) */}
            {alertOverlay && alertOverlay.show && (
              <button
                onClick={onClearAlert}
                className="theme-locked-dark absolute bottom-2 right-2 z-30 text-[10px] bg-black/70 hover:bg-black px-2 py-0.5 rounded font-bold text-slate-100 border border-white/20 flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-amber-300" />
                <span>Dismiss</span>
              </button>
            )}

            {/* Muted / Offline State */}
            {!isLiveOutputOn && (
              <div className="absolute inset-0 rounded-2xl bg-slate-950/95 flex flex-col items-center justify-center text-slate-500">
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
            <SlideCanvas
              slide={nextSlide}
              className="rounded-2xl border border-slate-800 shadow-xl opacity-90"
            />
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

