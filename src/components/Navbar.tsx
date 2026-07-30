import React, { useState } from 'react';
import { 
  Tv, 
  Sparkles, 
  Mic, 
  BookOpen, 
  Music, 
  Image as ImageIcon, 
  Presentation,
  Play, 
  Square, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Layers,
  Settings as SettingsIcon,
  Flame,
  HelpCircle,
  X,
  Radio,
  Keyboard,
  Search,
  Zap,
  ChevronDown,
  RotateCcw,
  Check,
  MousePointer
} from 'lucide-react';
import { QuickState, ViewMode, SearchMode } from '../types';
import { 
  ShortcutBinding, 
  DEFAULT_SHORTCUTS, 
  saveShortcuts, 
  AppSettings, 
  saveAppSettings 
} from '../data/settingsAndTemplates';

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
  // New props for shortcut and slide activation settings
  slideActivationMode: 'double_click' | 'single_click';
  setSlideActivationMode: (mode: 'double_click' | 'single_click') => void;
  shortcuts: ShortcutBinding[];
  setShortcuts: React.Dispatch<React.SetStateAction<ShortcutBinding[]>>;
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
  openQuickSearchWithMode,
  slideActivationMode,
  setSlideActivationMode,
  shortcuts,
  setShortcuts
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'triggers'>('shortcuts');
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [keyBuffer, setKeyBuffer] = useState('');

  const handleStartEditShortcut = (id: string) => {
    setEditingShortcutId(id);
    setKeyBuffer('');
  };

  const handleSaveKeyForShortcut = (id: string, newKey: string) => {
    if (!newKey.trim()) return;
    const updated = shortcuts.map(s => s.id === id ? { ...s, key: newKey.trim() } : s);
    setShortcuts(updated);
    saveShortcuts(updated);
    setEditingShortcutId(null);
    setKeyBuffer('');
  };

  const handleResetShortcuts = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    saveShortcuts(DEFAULT_SHORTCUTS);
  };

  const handleToggleSlideTrigger = (mode: 'double_click' | 'single_click') => {
    setSlideActivationMode(mode);
    saveAppSettings({
      slideActivationMode: mode,
      autoLiveSearchOnlineSongs: true,
      stageDisplayFontSize: 'large'
    });
  };

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

        {/* Search Mode Selector Dropdown & Speed Search Unit */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 p-1 rounded-2xl shadow-inner backdrop-blur-sm">
          <div className="flex items-center gap-1.5 pl-2 pr-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 hidden sm:flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400/20" />
              <span>Search Mode:</span>
            </span>

            <div className="relative flex items-center">
              {searchMode === 'bible' && <BookOpen className="w-3.5 h-3.5 text-blue-300 absolute left-2.5 pointer-events-none z-10" />}
              {searchMode === 'songs' && <Music className="w-3.5 h-3.5 text-purple-300 absolute left-2.5 pointer-events-none z-10" />}
              {searchMode === 'visuals' && <ImageIcon className="w-3.5 h-3.5 text-emerald-300 absolute left-2.5 pointer-events-none z-10" />}
              {searchMode === 'deck' && <Presentation className="w-3.5 h-3.5 text-amber-300 absolute left-2.5 pointer-events-none z-10" />}

              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value as SearchMode)}
                className={`pl-8 pr-7 py-1 rounded-xl text-xs font-bold transition-all appearance-none cursor-pointer focus:outline-none border ${
                  searchMode === 'bible'
                    ? 'bg-blue-600/90 hover:bg-blue-600 text-white border-blue-400/80 shadow-md shadow-blue-950/40'
                    : searchMode === 'songs'
                    ? 'bg-purple-600/90 hover:bg-purple-600 text-white border-purple-400/80 shadow-md shadow-purple-950/40'
                    : searchMode === 'visuals'
                    ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border-emerald-400/80 shadow-md shadow-emerald-950/40'
                    : 'bg-amber-600/90 hover:bg-amber-600 text-slate-950 border-amber-400/80 shadow-md shadow-amber-950/40'
                }`}
                title="Select Search Mode: Bible, Songs, Visuals, or Deck"
              >
                <option value="bible" className="bg-slate-900 text-blue-300 font-bold py-1">
                  Bible Mode
                </option>
                <option value="songs" className="bg-slate-900 text-purple-300 font-bold py-1">
                  Songs Mode
                </option>
                <option value="visuals" className="bg-slate-900 text-emerald-300 font-bold py-1">
                  Visuals Mode
                </option>
                <option value="deck" className="bg-slate-900 text-amber-300 font-bold py-1">
                  Deck / Slideshow Mode
                </option>
              </select>

              <ChevronDown className="w-3.5 h-3.5 text-white/80 absolute right-2 pointer-events-none z-10" />
            </div>
          </div>

          <div className="w-[1px] h-4 bg-slate-800 hidden md:block" />

          {/* Speed-Typing Trigger Button */}
          <button
            onClick={openQuickSearchWithMode}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/60 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-semibold transition-all shadow-inner"
            title="Start typing anytime to trigger quick search mode"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Type to Search</span>
            <kbd className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              /
            </kbd>
          </button>
        </div>

        {/* Right Toolbar Controls: Keyboard Shortcuts, Info Alert, AI Live Listener on Extreme Right */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Settings & Keyboard Shortcuts */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
            title="Customizable Keyboard Shortcuts & Trigger Settings"
          >
            <Keyboard className="w-4.5 h-4.5 text-indigo-400" />
          </button>

          {/* Quick Alert Generator / Info Icon */}
          <button
            onClick={openAlertModal}
            className="p-2 text-amber-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-amber-500/50 rounded-xl transition-all shadow-sm"
            title="Send Stage Alert / Nursery Calling / Banner"
          >
            <AlertCircle className="w-4.5 h-4.5" />
          </button>

          {/* AI Live Listener at extreme right */}
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
      </header>

      {/* Settings & Keyboard Shortcuts Customizer Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Keyboard Shortcuts & Trigger Settings</h3>
                  <p className="text-xs text-slate-400">Customize key bindings and slide live activation behavior</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('shortcuts')}
                className={`px-4 py-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'shortcuts'
                    ? 'border-indigo-500 text-indigo-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Custom Keyboard Shortcuts</span>
              </button>
              <button
                onClick={() => setActiveTab('triggers')}
                className={`px-4 py-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'triggers'
                    ? 'border-indigo-500 text-indigo-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5 text-amber-400" />
                <span>Slide Live Trigger Settings</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {activeTab === 'shortcuts' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Click on any key box to rebind your shortcut</span>
                    <button
                      onClick={handleResetShortcuts}
                      className="text-[11px] font-bold text-slate-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Defaults</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {shortcuts.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-white">{sc.label}</p>
                          <span className="text-[10px] text-slate-500">{sc.category}</span>
                        </div>

                        {editingShortcutId === sc.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={keyBuffer}
                              onChange={(e) => setKeyBuffer(e.target.value)}
                              onKeyDown={(e) => {
                                e.preventDefault();
                                if (e.key === 'Escape') {
                                  setEditingShortcutId(null);
                                  return;
                                }
                                if (e.key === 'Enter' && keyBuffer) {
                                  handleSaveKeyForShortcut(sc.id, keyBuffer);
                                  return;
                                }
                                const parts: string[] = [];
                                if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
                                if (e.shiftKey && e.key !== 'Shift') parts.push('Shift');
                                if (e.altKey && e.key !== 'Alt') parts.push('Alt');

                                if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
                                  const k = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
                                  parts.push(k);
                                }

                                const combo = parts.join('+');
                                if (combo) {
                                  setKeyBuffer(combo);
                                }
                              }}
                              placeholder="Press keys (e.g. Shift+M)"
                              autoFocus
                              className="w-36 bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-amber-300 font-mono focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveKeyForShortcut(sc.id, keyBuffer || sc.key)}
                              className="px-2 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingShortcutId(null)}
                              className="p-1 text-slate-400 hover:text-white text-[10px]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditShortcut(sc.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-bold rounded-lg border border-slate-700 text-xs shadow-inner flex items-center gap-1.5 cursor-pointer"
                            title="Click to edit shortcut key"
                          >
                            <span>{sc.key}</span>
                            <span className="text-[9px] font-normal text-slate-400 underline">Change</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Slide Trigger Settings */
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <MousePointer className="w-4 h-4 text-amber-400" />
                      <span>Slide Preview Live Activation Trigger</span>
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Choose how slide thumbnails in the grid activate and push content to the live presentation output.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {/* Double Click Option */}
                      <div
                        onClick={() => handleToggleSlideTrigger('double_click')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          slideActivationMode === 'double_click'
                            ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-amber-300">Double-Click (Default)</span>
                          {slideActivationMode === 'double_click' && (
                            <Check className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <p className="text-[11px] leading-snug text-slate-300">
                          Single-click previews & selects slide safely. Double-click pushes slide LIVE to stage screen.
                        </p>
                      </div>

                      {/* Single Click Option */}
                      <div
                        onClick={() => handleToggleSlideTrigger('single_click')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          slideActivationMode === 'single_click'
                            ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-amber-300">Single-Click</span>
                          {slideActivationMode === 'single_click' && (
                            <Check className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <p className="text-[11px] leading-snug text-slate-300">
                          Single-click immediately pushes selected slide LIVE to the screen with zero extra clicks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
