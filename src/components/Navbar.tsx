import React, { useState } from 'react';
import { 
  Tv, 
  Sparkles, 
  Mic, 
  BookOpen, 
  Music, 
  Image as ImageIcon, 
  Play, 
  Square, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Layers,
  Settings,
  Flame,
  HelpCircle,
  X,
  Radio,
  Keyboard,
  Search,
  Zap
} from 'lucide-react';
import { QuickState, ViewMode, SearchMode } from '../types';

interface NavbarProps {
  isLiveOutputOn: boolean;
  setIsLiveOutputOn: (val: boolean) => void;
  quickState: QuickState;
  setQuickState: (st: QuickState) => void;
  activeViewMode: ViewMode;
  setActiveViewMode: (mode: ViewMode) => void;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  openSermonConverter: () => void;
  openLiveCompanion: () => void;
  openBibleLibrary: () => void;
  openSongLibrary: () => void;
  openMediaGenerator: () => void;
  openAlertModal: () => void;
  isMicActive: boolean;
  openQuickSearchWithMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isLiveOutputOn,
  setIsLiveOutputOn,
  quickState,
  setQuickState,
  activeViewMode,
  setActiveViewMode,
  searchMode,
  setSearchMode,
  openSermonConverter,
  openLiveCompanion,
  openBibleLibrary,
  openSongLibrary,
  openMediaGenerator,
  openAlertModal,
  isMicActive,
  openQuickSearchWithMode
}) => {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  return (
    <>
      <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-40 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-wider text-white flex items-center gap-1.5">
                LOGOS <span className="text-amber-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 hidden sm:inline">Church Media & Presentation Studio</span>
            </div>
          </div>
        </div>

        {/* Search Mode Selector (Speed Typing Active Mode) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 pl-2 pr-1 hidden xl:flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Search Mode:
            </span>

            <button
              onClick={() => setSearchMode('bible')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                searchMode === 'bible'
                  ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Search Mode: Bible. Typing anywhere automatically searches scriptures."
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-300" />
              <span>Bible</span>
            </button>

            <button
              onClick={() => setSearchMode('songs')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                searchMode === 'songs'
                  ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Search Mode: Songs. Typing anywhere automatically searches songs."
            >
              <Music className="w-3.5 h-3.5 text-purple-300" />
              <span>Songs</span>
            </button>

            <button
              onClick={() => setSearchMode('visuals')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                searchMode === 'visuals'
                  ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Search Mode: Visuals. Typing anywhere automatically opens AI Visuals Generator."
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-300" />
              <span>Visuals</span>
            </button>
          </div>

          {/* Speed-Typing Trigger Button */}
          <button
            onClick={openQuickSearchWithMode}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs font-semibold transition-all shadow-sm"
            title="Start typing anytime to trigger quick search mode"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Type to Search</span>
            <kbd className="text-[9px] bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              Type or /
            </kbd>
          </button>
        </div>

        {/* AI Tools Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 custom-scrollbar">
          <button
            onClick={openSermonConverter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-md shrink-0"
            title="Convert Pastor Notes / Word Docs into Slide Decks instantly with AI"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>AI Sermon Deck</span>
          </button>

          <button
            onClick={openLiveCompanion}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              isMicActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse shadow-lg shadow-rose-950/50'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30'
            }`}
            title="Listen to sermon live & suggest mentioned Scriptures automatically"
          >
            <Mic className={`w-4 h-4 ${isMicActive ? 'text-rose-400' : 'text-indigo-400'}`} />
            <span>AI Live Listener</span>
            {isMicActive && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          </button>
        </div>

        {/* Presentation Controls & Master Indicators */}
        <div className="flex items-center gap-2.5">
          {/* Live Output Toggle */}
          <button
            onClick={() => setIsLiveOutputOn(!isLiveOutputOn)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wider transition-all border ${
              isLiveOutputOn
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-950/50'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title="Toggle Live Program Output to Stage & Main Projectors"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isLiveOutputOn ? 'bg-white animate-ping' : 'bg-slate-600'}`} />
            <span>{isLiveOutputOn ? 'PROGRAM LIVE' : 'OFFLINE'}</span>
          </button>

          {/* View Mode Switcher */}
          <div className="hidden sm:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveViewMode('operator')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeViewMode === 'operator'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Operator
            </button>
            <button
              onClick={() => setActiveViewMode('confidence')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeViewMode === 'confidence'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Stage View
            </button>
          </div>

          {/* Quick Alert Generator */}
          <button
            onClick={openAlertModal}
            className="p-2 text-amber-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-amber-500/50 rounded-xl transition-all shadow-sm"
            title="Send Stage Alert / Nursery Calling / Banner"
          >
            <AlertCircle className="w-4.5 h-4.5" />
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
            title="View Keyboard Shortcuts"
          >
            <Keyboard className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Advance to Next Slide</span>
                <kbd className="px-2 py-1 bg-slate-800 text-amber-300 font-bold rounded border border-slate-700">Spacebar / Arrow Right</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Previous Slide</span>
                <kbd className="px-2 py-1 bg-slate-800 text-slate-300 font-bold rounded border border-slate-700">Arrow Left / Page Up</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Toggle Clear Text</span>
                <kbd className="px-2 py-1 bg-slate-800 text-slate-300 font-bold rounded border border-slate-700">F2</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Toggle Clear Background</span>
                <kbd className="px-2 py-1 bg-slate-800 text-slate-300 font-bold rounded border border-slate-700">F3</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Toggle Black Screen</span>
                <kbd className="px-2 py-1 bg-slate-800 text-slate-300 font-bold rounded border border-slate-700">F4</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Toggle Church Logo Screen</span>
                <kbd className="px-2 py-1 bg-slate-800 text-slate-300 font-bold rounded border border-slate-700">F5</kbd>
              </div>
            </div>

            <button
              onClick={() => setShowKeyboardHelp(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl text-white transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

