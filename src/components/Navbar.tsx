import React from 'react';
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
  Flame
} from 'lucide-react';
import { QuickState, ViewMode } from '../types';

interface NavbarProps {
  isLiveOutputOn: boolean;
  setIsLiveOutputOn: (val: boolean) => void;
  quickState: QuickState;
  setQuickState: (st: QuickState) => void;
  activeViewMode: ViewMode;
  setActiveViewMode: (mode: ViewMode) => void;
  openSermonConverter: () => void;
  openLiveCompanion: () => void;
  openBibleLibrary: () => void;
  openSongLibrary: () => void;
  openMediaGenerator: () => void;
  openAlertModal: () => void;
  isMicActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isLiveOutputOn,
  setIsLiveOutputOn,
  quickState,
  setQuickState,
  activeViewMode,
  setActiveViewMode,
  openSermonConverter,
  openLiveCompanion,
  openBibleLibrary,
  openSongLibrary,
  openMediaGenerator,
  openAlertModal,
  isMicActive
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xs shrink-0">
      {/* Brand & App Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">LOGOS AI</span>
        </div>
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          EasyWorship + AI Presentation Suite
        </span>
      </div>

      {/* AI Superpowers Quick Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        <button
          onClick={openSermonConverter}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-2xs"
          title="Convert Pastor Notes / Word Docs into Slide Decks instantly with AI"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>AI Sermon Deck</span>
        </button>

        <button
          onClick={openLiveCompanion}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isMicActive
              ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
          }`}
          title="Listen to sermon live & suggest mentioned Scriptures automatically"
        >
          <Mic className={`w-4 h-4 ${isMicActive ? 'text-red-600' : 'text-indigo-600'}`} />
          <span>AI Live Listener</span>
          {isMicActive && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />}
        </button>

        <button
          onClick={openBibleLibrary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-600" />
          <span>Bibles</span>
        </button>

        <button
          onClick={openSongLibrary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <Music className="w-3.5 h-3.5 text-slate-600" />
          <span>Songs</span>
        </button>

        <button
          onClick={openMediaGenerator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
          <span>AI Visuals</span>
        </button>
      </div>

      {/* Presentation Control & Live Output Indicator */}
      <div className="flex items-center gap-3">
        {/* View Switcher */}
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveViewMode('operator')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeViewMode === 'operator'
                ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operator
          </button>
          <button
            onClick={() => setActiveViewMode('confidence')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeViewMode === 'confidence'
                ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stage View
          </button>
        </div>

        {/* Quick Alert Generator */}
        <button
          onClick={openAlertModal}
          className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
          title="Send Overlay Banner / Nursery Alert / Timer"
        >
          <AlertCircle className="w-4 h-4" />
        </button>

        {/* Live Output Switch */}
        <button
          onClick={() => setIsLiveOutputOn(!isLiveOutputOn)}
          className={`flex items-center gap-2 px-5 py-2 rounded-md font-bold text-xs tracking-wide transition-all shadow-sm ${
            isLiveOutputOn
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
          }`}
        >
          {isLiveOutputOn ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>GO LIVE</span>
            </>
          ) : (
            <>
              <Square className="w-3.5 h-3.5 fill-slate-500 text-slate-500" />
              <span>OFFLINE</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
