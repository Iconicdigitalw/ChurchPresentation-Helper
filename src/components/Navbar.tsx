import React, { useState, useEffect } from 'react';
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
  MousePointer,
  User,
  Monitor,
  Info,
  Building,
  Mail,
  CheckCircle,
  ShieldAlert,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { QuickState, ViewMode, SearchMode } from '../types';
import { 
  ShortcutBinding,
  DEFAULT_SHORTCUTS,
  saveShortcuts,
  AppSettings,
  getAppSettings,
  saveAppSettings,
  getUserProfileSettings,
  saveUserProfileSettings,
  UserProfileSettings,
  UiTheme,
  UiThemePreset,
  UI_THEME_PRESETS,
  getUiTheme,
  saveUiTheme,
  getUiThemePreset,
  saveUiThemePreset,
  applyTheme
} from '../data/settingsAndTemplates';
import { openLiveProjectorWindow } from '../utils/liveDisplayManager';

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
  /** Lets the console suppress global shortcuts while a Navbar overlay is open. */
  onOverlayOpenChange?: (open: boolean) => void;
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
  onOverlayOpenChange,
  setShortcuts
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'triggers'>('shortcuts');
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [keyBuffer, setKeyBuffer] = useState('');

  // Logo Dropdown & Modals State
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfileSettings>(getUserProfileSettings());

  const [uiTheme, setUiTheme] = useState<UiTheme>(() => getUiTheme());
  const [uiThemePreset, setUiThemePreset] = useState<UiThemePreset>(() => getUiThemePreset());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Briefly enable colour transitions so a theme swap eases rather than snaps.
  const easeThemeChange = () => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 240);
  };

  const applyMode = (next: UiTheme) => {
    easeThemeChange();
    applyTheme(uiThemePreset, next);
    saveUiTheme(next);
    setUiTheme(next);
  };

  const applyPreset = (next: UiThemePreset) => {
    // Each theme is designed around a mode, so adopt it on first switch.
    const preferred = UI_THEME_PRESETS.find(p => p.id === next)?.preferredMode ?? uiTheme;
    easeThemeChange();
    applyTheme(next, preferred);
    saveUiThemePreset(next);
    saveUiTheme(preferred);
    setUiThemePreset(next);
    setUiTheme(preferred);
  };

  const toggleUiTheme = () => applyMode(uiTheme === 'light' ? 'dark' : 'light');

  // Any of these covering the console must suppress global shortcuts, or a
  // keystroke aimed at the dialog repaints the projector behind it.
  const isAnyOverlayOpen =
    showSettingsModal ||
    isProfileModalOpen ||
    isMonitorModalOpen ||
    isAboutModalOpen ||
    isLogoMenuOpen ||
    isThemeMenuOpen;

  useEffect(() => {
    onOverlayOpenChange?.(isAnyOverlayOpen);
  }, [isAnyOverlayOpen, onOverlayOpenChange]);

  // Escape closes whichever overlay is open - operators reach for it by habit.
  useEffect(() => {
    if (!isAnyOverlayOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setShowSettingsModal(false);
      setIsProfileModalOpen(false);
      setIsMonitorModalOpen(false);
      setIsAboutModalOpen(false);
      setIsLogoMenuOpen(false);
      setIsThemeMenuOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isAnyOverlayOpen]);

  // Close the theme menu on outside click / Escape.
  useEffect(() => {
    if (!isThemeMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('.theme-menu-root')) setIsThemeMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsThemeMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [isThemeMenuOpen]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserProfileSettings(userProfile);
    setIsProfileModalOpen(false);
  };

  const handleLaunchProjectorWindow = () => {
    openLiveProjectorWindow(userProfile);
    setIsLiveOutputOn(true);
    setIsMonitorModalOpen(false);
  };

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
    // Merge rather than rewrite: this used to clobber every other app setting.
    saveAppSettings({ ...getAppSettings(), slideActivationMode: mode });
  };

  return (
    <>
      <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-40 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0">
        {/* Brand & App Title with Interactive Settings Dropdown */}
        <div className="relative z-50">
          <button
            onClick={() => setIsLogoMenuOpen(!isLogoMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all text-left cursor-pointer group"
            title="Click logo for profile, monitor, & settings dropdown"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-slate-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-wider text-slate-100 flex items-center gap-1">
                WorshiPal<span className="text-amber-400 font-bold text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">.com</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform ${isLogoMenuOpen ? 'rotate-180' : ''}`} />
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 hidden sm:inline">{userProfile.churchName || 'Church Media Studio'}</span>
            </div>
          </button>

          {/* Logo Dropdown Menu */}
          {isLogoMenuOpen && (
            <div 
              className="absolute left-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
            >
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs font-bold text-amber-400">{userProfile.churchName}</p>
                <p className="text-[11px] text-slate-400 truncate">{userProfile.operatorName} • {userProfile.userEmail}</p>
              </div>

              <button
                onClick={() => {
                  setIsLogoMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-colors text-left"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span>Edit Profile & Church</span>
              </button>

              <button
                onClick={() => {
                  setIsLogoMenuOpen(false);
                  setIsMonitorModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-colors text-left"
              >
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span>Multi-Monitor Display Setup</span>
              </button>

              <button
                onClick={() => {
                  setIsLogoMenuOpen(false);
                  setShowSettingsModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-slate-100 hover:bg-slate-800 transition-colors text-left"
              >
                <SettingsIcon className="w-4 h-4 text-purple-400" />
                <span>Shortcuts & Triggers</span>
              </button>

              <div className="my-1 border-t border-slate-800/80" />

              <button
                onClick={() => {
                  setIsLogoMenuOpen(false);
                  setIsAboutModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors text-left"
              >
                <Info className="w-4 h-4 text-emerald-400" />
                <span>About WorshiPal.com</span>
              </button>
            </div>
          )}
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

        {/* Right Toolbar Controls: Theme, Keyboard Shortcuts, Info Alert, AI Live Listener on Extreme Right */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Console theme picker */}
          <div className="relative theme-menu-root">
            <button
              onClick={() => setIsThemeMenuOpen(open => !open)}
              className="p-2 text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-all"
              title="Console theme & appearance"
              aria-label="Console theme and appearance"
              aria-haspopup="true"
              aria-expanded={isThemeMenuOpen}
            >
              <Palette className="w-4.5 h-4.5 text-indigo-400" />
            </button>

            {isThemeMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                role="menu"
              >
                <div className="px-4 pt-3.5 pb-2">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Console Theme
                  </h4>
                </div>

                <div className="px-2.5 pb-2 space-y-1.5">
                  {UI_THEME_PRESETS.map(preset => {
                    const isActive = preset.id === uiThemePreset;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset.id)}
                        role="menuitemradio"
                        aria-checked={isActive}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-indigo-500/15 border-indigo-500/50'
                            : 'bg-slate-950 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold ${
                              isActive ? 'text-indigo-300' : 'text-slate-200'
                            }`}
                          >
                            {preset.name}
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 pt-2.5 pb-2 border-t border-slate-800">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Appearance
                  </h4>
                </div>

                <div className="px-2.5 pb-3.5">
                  <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                    {(['dark', 'light'] as UiTheme[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => applyMode(mode)}
                        role="menuitemradio"
                        aria-checked={uiTheme === mode}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          uiTheme === mode
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                        }`}
                      >
                        {mode === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                        <span>{mode === 'dark' ? 'Dark' : 'Light'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick light/dark flip without opening the menu */}
          <button
            onClick={toggleUiTheme}
            className="p-2 text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-all"
            title={
              uiTheme === 'light'
                ? 'Switch to dark mode (booth lighting)'
                : 'Switch to light mode (bright room)'
            }
            aria-label={uiTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-pressed={uiTheme === 'light'}
          >
            {uiTheme === 'light' ? (
              <Moon className="w-4.5 h-4.5 text-indigo-400" />
            ) : (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            )}
          </button>

          {/* Settings & Keyboard Shortcuts */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-all"
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
                  <h3 className="text-base font-bold text-slate-100">Keyboard Shortcuts & Trigger Settings</h3>
                  <p className="text-xs text-slate-400">Customize key bindings and slide live activation behavior</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
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
                          <p className="font-bold text-slate-100">{sc.label}</p>
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
                              className="p-1 text-slate-400 hover:text-slate-100 text-[10px]"
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
                    <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
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
                            ? 'bg-indigo-950/60 border-indigo-500 text-slate-100 ring-1 ring-indigo-500'
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
                            ? 'bg-indigo-950/60 border-indigo-500 text-slate-100 ring-1 ring-indigo-500'
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PROFILE & CHURCH DETAILS MODAL                            */}
      {/* ========================================================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-slate-100 text-sm">Edit Operator Profile & Church</h3>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Operator Name
                </label>
                <input
                  type="text"
                  value={userProfile.operatorName}
                  onChange={(e) => setUserProfile({ ...userProfile, operatorName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Media Director / John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={userProfile.userEmail}
                  onChange={(e) => setUserProfile({ ...userProfile, userEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. info@iconicdigitalworld.com"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  Church / Ministry Name
                </label>
                <input
                  type="text"
                  value={userProfile.churchName}
                  onChange={(e) => setUserProfile({ ...userProfile, churchName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Grace Community Church"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Service Title
                </label>
                <input
                  type="text"
                  value={userProfile.serviceTitle}
                  onChange={(e) => setUserProfile({ ...userProfile, serviceTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Sunday Morning Worship"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MULTI-MONITOR DISPLAY SETUP MODAL                         */}
      {/* ========================================================= */}
      {isMonitorModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-slate-100 text-sm">Multi-Monitor & Projector Setup</h3>
              </div>
              <button 
                onClick={() => setIsMonitorModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <p className="text-slate-400 leading-relaxed">
                Select where WorshiPal.com sends live audience slides and scripture text. Launching the external window will create a dedicated 16:9 full-screen window for your main church projector or TV monitor.
              </p>

              <div className="space-y-2.5">
                {/* Secondary Monitor */}
                <div 
                  onClick={() => setUserProfile({ ...userProfile, selectedMonitor: 'secondary' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    userProfile.selectedMonitor === 'secondary'
                      ? 'bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-indigo-400" />
                      Secondary Extended Monitor / Projector (Recommended)
                    </span>
                    {userProfile.selectedMonitor === 'secondary' && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Target Screen 2 (1920x1080) automatically. Ideal for dual-monitor computer setups.
                  </p>
                </div>

                {/* Stage Confidence Monitor */}
                <div 
                  onClick={() => setUserProfile({ ...userProfile, selectedMonitor: 'stage' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    userProfile.selectedMonitor === 'stage'
                      ? 'bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-emerald-400" />
                      Stage Confidence Display (Screen 3)
                    </span>
                    {userProfile.selectedMonitor === 'stage' && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Target 3rd Screen / Stage Monitor for worship leaders, speakers, and vocalists.
                  </p>
                </div>

                {/* Primary Window */}
                <div 
                  onClick={() => setUserProfile({ ...userProfile, selectedMonitor: 'primary' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    userProfile.selectedMonitor === 'primary'
                      ? 'bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-amber-400" />
                      Windowed Popout Display
                    </span>
                    {userProfile.selectedMonitor === 'primary' && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Open in a separate popout window for single-monitor setups or testing.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    saveUserProfileSettings(userProfile);
                    setIsMonitorModalOpen(false);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Save Settings
                </button>

                <button
                  type="button"
                  onClick={handleLaunchProjectorWindow}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-100 font-extrabold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Live Monitor Window</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABOUT WORSHIPAL.COM MODAL                                 */}
      {/* ========================================================= */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-slate-100 text-sm">About WorshiPal.com</h3>
              </div>
              <button 
                onClick={() => setIsAboutModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Flame className="w-6 h-6 text-slate-100" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-100">WorshiPal.com</h4>
                  <p className="text-[10px] text-amber-400 font-semibold">Version 2.5 • Church Presentation Studio</p>
                </div>
              </div>

              <p>
                WorshiPal.com is a full-featured church media and presentation software designed for seamless worship services, live scripture lookup, song slides, AI sermon document parsing, and multi-monitor projection control.
              </p>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Multi-Monitor Dual Display Projection</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instant Scripture Lookup (NIV, KJV, ESV, NLT, NASB)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Interactive Worship Song Library & Slide Builder</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>AI Sermon & Document Slide Converter</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-slate-800">
                <button
                  onClick={() => setIsAboutModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
