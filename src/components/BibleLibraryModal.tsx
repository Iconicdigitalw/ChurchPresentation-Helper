import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  X, 
  Tv, 
  Plus, 
  Zap,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Layers,
  Check,
  Mic,
  MicOff,
  Keyboard,
  Settings
} from 'lucide-react';
import { ScheduleItem, Slide } from '../types';
import { searchLocalBible, ALL_BIBLE_BOOKS } from '../data/localBibleDatabase';

interface BibleVerseItem {
  verseNumber: number;
  text: string;
}

interface BibleChapterResult {
  reference: string;
  book: string;
  chapter: number;
  targetVerse?: number;
  translation: string;
  chapterVerses: BibleVerseItem[];
}

interface BibleLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddScriptureItem: (item: ScheduleItem) => void;
  onPushSlideToLive: (slide: Slide) => void;
  initialQuery?: string;
}

export const BibleLibraryModal: React.FC<BibleLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddScriptureItem,
  onPushSlideToLive,
  initialQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedVersion, setSelectedVersion] = useState('NIV');
  const [activeChapter, setActiveChapter] = useState<BibleChapterResult | null>(null);
  const [autoCompleteSuggestion, setAutoCompleteSuggestion] = useState<string | null>(null);

  // Microphone & Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [shortcutMode, setShortcutMode] = useState<'ctrl_win' | 'ctrl_space' | 'alt_m' | 'ctrl_shift_v'>('ctrl_win');
  const [showShortcutSettings, setShowShortcutSettings] = useState(false);
  const recognitionRef = useRef<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const targetVerseRef = useRef<HTMLDivElement>(null);

  // Helper to convert spoken words e.g., "John chapter 3 verse 16" or "John two four" -> "John 2:4"
  const parseSpokenBibleReference = (transcript: string): string => {
    let text = transcript.toLowerCase().trim();

    // Standardize ordinal prefixes
    text = text.replace(/\b(first|1st)\b/g, '1');
    text = text.replace(/\b(second|2nd)\b/g, '2');
    text = text.replace(/\b(third|3rd)\b/g, '3');

    // Clean spoken punctuation & fillers
    text = text.replace(/[:,.]/g, ' ');
    text = text.replace(/\bchapter\b/g, ' ');
    text = text.replace(/\bverses?\b/g, ' ');
    text = text.replace(/\bof\b/g, ' ');

    const wordToNum: Record<string, string> = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
      'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
      'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20',
      'thirty': '30', 'forty': '40', 'fifty': '50'
    };

    for (const [w, n] of Object.entries(wordToNum)) {
      const reg = new RegExp(`\\b${w}\\b`, 'g');
      text = text.replace(reg, n);
    }

    text = text.replace(/\s+/g, ' ').trim();

    // Parse book name and numbers
    const match = text.match(/^((?:\d\s+)?[a-z]+)\s+(.+)$/i);
    if (match) {
      const bookPart = match[1];
      const rest = match[2].trim();

      // If rest is a 2, 3, or 4 digit concatenation (e.g. "24", "316", "146") without spaces
      if (/^\d{2,4}$/.test(rest)) {
        const numVal = parseInt(rest, 10);

        const maxChapters: Record<string, number> = {
          "john": 21, "matthew": 28, "mark": 16, "luke": 24, "acts": 28, "romans": 16,
          "1 corinthians": 16, "2 corinthians": 13, "galatians": 6, "ephesians": 6,
          "philippians": 4, "colossians": 4, "1 thessalonians": 5, "2 thessalonians": 3,
          "1 timothy": 6, "2 timothy": 4, "titus": 3, "philemon": 1, "hebrews": 13,
          "james": 5, "1 peter": 5, "2 peter": 3, "1 john": 5, "2 john": 1, "3 john": 1,
          "jude": 1, "revelation": 22, "genesis": 50, "exodus": 40, "psalms": 150, "proverbs": 31,
          "jeremiah": 52, "isaiah": 66, "daniel": 12
        };

        const matchedBookKey = Object.keys(maxChapters).find(b => bookPart.toLowerCase().startsWith(b) || b.startsWith(bookPart.toLowerCase()));
        const maxChap = matchedBookKey ? maxChapters[matchedBookKey] : 21;

        // If number exceeds max chapters (e.g. John 24 > 21) or is 2-digit format spoken as "two four"
        if (numVal > maxChap || rest.length === 2 || rest.length === 3 || rest.length === 4) {
          if (rest.length === 2) {
            return `${bookPart} ${rest[0]}:${rest[1]}`;
          } else if (rest.length === 3) {
            return `${bookPart} ${rest[0]}:${rest.slice(1)}`;
          } else if (rest.length === 4) {
            return `${bookPart} ${rest.slice(0, 2)}:${rest.slice(2)}`;
          }
        }
      } else if (/^\d+\s+\d+$/.test(rest)) {
        // e.g. "2 4" -> "2:4"
        const [c, v] = rest.split(/\s+/);
        return `${bookPart} ${c}:${v}`;
      }
    }

    return text;
  };

  // Toggle Microphone recording
  const toggleMicrophone = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setVoiceTranscript(currentTranscript);
        const parsed = parseSpokenBibleReference(currentTranscript);
        if (parsed) {
          setSearchQuery(parsed);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Keyboard shortcut listener for Microphone voice typing
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const code = e.code;
      const isCtrl = e.ctrlKey;
      const isMeta = e.metaKey || e.key === 'Meta';
      const isAlt = e.altKey;
      const isShift = e.shiftKey;

      let trigger = false;

      if (shortcutMode === 'ctrl_win') {
        if (isCtrl && (isMeta || key === 'meta')) trigger = true;
      } else if (shortcutMode === 'ctrl_space') {
        if (isCtrl && code === 'Space') trigger = true;
      } else if (shortcutMode === 'alt_m') {
        if (isAlt && key === 'm') trigger = true;
      } else if (shortcutMode === 'ctrl_shift_v') {
        if (isCtrl && isShift && key === 'v') trigger = true;
      }

      if (trigger) {
        e.preventDefault();
        toggleMicrophone();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, isListening, shortcutMode]);

  // Focus & initial instant search on modal open
  useEffect(() => {
    if (isOpen) {
      const q = initialQuery || 'John 3 16';
      setSearchQuery(q);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(q.length, q.length);
        }
      }, 50);

      performInstantSearch(q, selectedVersion);
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      setIsListening(false);
    }
  }, [isOpen]);

  // Real-time instant search as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setAutoCompleteSuggestion(null);
      return;
    }

    const trimmed = searchQuery.trim();
    // Compute Autocomplete suggestion
    const matchBook = ALL_BIBLE_BOOKS.find(b => 
      b.toLowerCase().startsWith(trimmed.toLowerCase()) && b.toLowerCase() !== trimmed.toLowerCase()
    );
    setAutoCompleteSuggestion(matchBook || null);

    // Perform instant local search
    performInstantSearch(searchQuery, selectedVersion);
  }, [searchQuery, selectedVersion]);

  const scrollToTargetVerse = () => {
    setTimeout(() => {
      if (targetVerseRef.current) {
        targetVerseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const performInstantSearch = (queryStr: string, version: string) => {
    if (!queryStr.trim()) return;
    const result = searchLocalBible(queryStr, version);

    setActiveChapter({
      reference: result.reference,
      book: result.book,
      chapter: result.chapter,
      targetVerse: result.targetVerse,
      translation: result.translation,
      chapterVerses: result.chapterVerses
    });

    scrollToTargetVerse();
  };

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (activeChapter && activeChapter.chapterVerses.length > 0) {
        e.preventDefault();
        const nextVerseNum = Math.min(activeChapter.chapterVerses.length, activeChapter.targetVerse + 1);
        setActiveChapter(prev => prev ? {
          ...prev,
          targetVerse: nextVerseNum,
          reference: `${prev.book} ${prev.chapter}:${nextVerseNum}`
        } : null);
        scrollToTargetVerse();
      }
    } else if (e.key === 'ArrowUp') {
      if (activeChapter && activeChapter.chapterVerses.length > 0) {
        e.preventDefault();
        const prevVerseNum = Math.max(1, activeChapter.targetVerse - 1);
        setActiveChapter(prev => prev ? {
          ...prev,
          targetVerse: prevVerseNum,
          reference: `${prev.book} ${prev.chapter}:${prevVerseNum}`
        } : null);
        scrollToTargetVerse();
      }
    } else if ((e.key === 'Tab' || e.key === ' ') && autoCompleteSuggestion) {
      const parts = searchQuery.trim().split(/\s+/);
      const isJustBook = parts.length === 1 || (parts.length === 2 && ['1', '2', '3'].includes(parts[0]));

      if (isJustBook) {
        e.preventDefault();
        const completed = autoCompleteSuggestion + ' ';
        setSearchQuery(completed);
        setAutoCompleteSuggestion(null);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeChapter) {
        const currentVerseObj = activeChapter.chapterVerses.find(v => v.verseNumber === activeChapter.targetVerse);
        if (currentVerseObj) {
          handlePushVerseLive(currentVerseObj.verseNumber, currentVerseObj.text);
        }
      }
    }
  };

  const applyAutoComplete = () => {
    if (autoCompleteSuggestion) {
      setSearchQuery(autoCompleteSuggestion + ' ');
      setAutoCompleteSuggestion(null);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleVersionChange = (newVersion: string) => {
    setSelectedVersion(newVersion);
    performInstantSearch(searchQuery, newVersion);
  };

  const handleAddVerseToSchedule = (verseNum: number, text: string) => {
    if (!activeChapter) return;
    const refStr = `${activeChapter.book} ${activeChapter.chapter}:${verseNum}`;

    const newItem: ScheduleItem = {
      id: `scripture-${Date.now()}`,
      title: `Scripture: ${refStr}`,
      subtitle: `${selectedVersion} Translation`,
      type: 'scripture',
      activeSlideIndex: 0,
      slides: [
        {
          id: `scrip-s-${Date.now()}`,
          type: 'scripture',
          header: refStr,
          body: text,
          reference: `${refStr} (${selectedVersion})`,
          themeStyle: 'nature-serene'
        }
      ]
    };

    onAddScriptureItem(newItem);
    onClose();
  };

  const handlePushVerseLive = (verseNum: number, text: string) => {
    if (!activeChapter) return;
    const refStr = `${activeChapter.book} ${activeChapter.chapter}:${verseNum}`;

    const slide: Slide = {
      id: `live-scrip-${Date.now()}`,
      type: 'scripture',
      header: refStr,
      body: text,
      reference: `${refStr} (${selectedVersion})`,
      themeStyle: 'nature-serene'
    };

    onPushSlideToLive(slide);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Live Bible Passage & Verse Lookup</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>Instant Local Database (0ms)</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">Type reference or passage (e.g., <code className="text-amber-300 bg-slate-900 px-1 rounded">John 3 16</code> or <code className="text-amber-300 bg-slate-900 px-1 rounded">John 3:16</code>)</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Autocomplete Strip */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-2 shrink-0">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-3 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type or speak book, chapter, verse (e.g. John 3 16, Psalm 23, Romans 8:28)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-24 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />

              {/* Voice Microphone Toggle & Shortcut Selector Badge inside input */}
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  title={isListening ? "Stop Voice Listening" : "Start Voice Dictation"}
                  className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                    isListening 
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50' 
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {isListening ? <Mic className="w-3.5 h-3.5 animate-bounce" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="text-[10px] hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
                </button>

                {/* Shortcut key badge & settings menu toggle */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowShortcutSettings(prev => !prev)}
                    title="Change Voice Microphone Shortcut"
                    className="p-1 rounded-md bg-slate-950 border border-slate-800 text-amber-300 font-mono text-[9px] hover:border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Keyboard className="w-3 h-3 text-slate-400" />
                    <span>
                      {shortcutMode === 'ctrl_win' && 'Ctrl+Win'}
                      {shortcutMode === 'ctrl_space' && 'Ctrl+Space'}
                      {shortcutMode === 'alt_m' && 'Alt+M'}
                      {shortcutMode === 'ctrl_shift_v' && 'Ctrl+Shift+V'}
                    </span>
                  </button>

                  {/* Shortcut Settings Dropdown Popover */}
                  {showShortcutSettings && (
                    <div className="absolute right-0 top-8 z-50 w-52 bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-2xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <span className="font-bold text-white text-[11px] flex items-center gap-1">
                          <Settings className="w-3 h-3 text-amber-400" />
                          <span>Voice Shortcut</span>
                        </span>
                        <button onClick={() => setShowShortcutSettings(false)} className="text-slate-400 hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-1 pt-1">
                        {[
                          { id: 'ctrl_win', label: 'Ctrl + Win / Cmd (Default)' },
                          { id: 'ctrl_space', label: 'Ctrl + Space' },
                          { id: 'alt_m', label: 'Alt + M' },
                          { id: 'ctrl_shift_v', label: 'Ctrl + Shift + V' }
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setShortcutMode(s.id as any);
                              setShowShortcutSettings(false);
                            }}
                            className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center justify-between cursor-pointer ${
                              shortcutMode === s.id 
                                ? 'bg-blue-600 text-white font-bold' 
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>{s.label}</span>
                            {shortcutMode === s.id && <Check className="w-3 h-3 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Version Translator Selector */}
            <select
              value={selectedVersion}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs font-bold text-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
              title="Switch translation version"
            >
              <option value="NIV">NIV (New International)</option>
              <option value="KJV">KJV (King James Version)</option>
              <option value="ESV">ESV (English Standard)</option>
              <option value="NKJV">NKJV (New King James)</option>
              <option value="NLT">NLT (New Living Trans.)</option>
            </select>

            <button
              onClick={() => performInstantSearch(searchQuery, selectedVersion)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-950/50 transition-all cursor-pointer"
            >
              <span>Find Verse</span>
            </button>
          </div>

          {/* Voice Dictation Live Banner */}
          {isListening && (
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="font-bold text-white">Listening...</span>
                <span className="text-slate-300 italic text-[11px]">
                  {voiceTranscript ? `"${voiceTranscript}"` : 'Speak passage or verse e.g., "John chapter 3 verse 16"'}
                </span>
              </div>
              <button 
                onClick={toggleMicrophone}
                className="px-2 py-0.5 bg-rose-800 hover:bg-rose-700 text-white text-[10px] font-bold rounded-md"
              >
                Stop
              </button>
            </div>
          )}

          {/* Autocomplete Suggestion & Navigation Hint Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            {autoCompleteSuggestion ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Autocomplete Suggestion:</span>
                <button
                  onClick={applyAutoComplete}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800/80 hover:bg-blue-900 text-xs font-bold transition-all"
                >
                  <span>{autoCompleteSuggestion}</span>
                  <span className="text-[9px] bg-blue-900 text-blue-200 px-1 rounded uppercase">Press Tab / Space</span>
                </button>
              </div>
            ) : <div />}

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium ml-auto">
              <span className="bg-slate-900 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">↑ / ↓</span>
              <span>Navigate Verses</span>
              <span className="text-slate-600">•</span>
              <span className="bg-slate-900 text-amber-300 border border-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">Enter</span>
              <span>Go Live</span>
            </div>
          </div>
        </div>

        {/* Passage Display & Verse-by-Verse List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50">
          {activeChapter ? (
            <div className="space-y-3">
              {/* Chapter Header Banner */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                    <span>{activeChapter.book} Chapter {activeChapter.chapter}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-semibold">
                      {selectedVersion}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click on any verse below to push live or add to service schedule
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Target: Verse {activeChapter.targetVerse}</span>
                </div>
              </div>

              {/* Verse Cards List */}
              <div className="space-y-2.5">
                {activeChapter.chapterVerses.map((v, idx) => {
                  const isTarget = v.verseNumber === activeChapter.targetVerse;

                  return (
                    <div
                      key={`verse-${v.verseNumber}-${idx}`}
                      ref={isTarget ? targetVerseRef : undefined}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isTarget
                          ? 'bg-amber-950/30 border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className={`px-2 py-1 rounded-lg text-xs font-extrabold shrink-0 ${
                          isTarget ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          v.{v.verseNumber}
                        </span>

                        <p className={`text-xs md:text-sm font-serif leading-relaxed italic ${
                          isTarget ? 'text-amber-100 font-semibold' : 'text-slate-200'
                        }`}>
                          "{v.text}"
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                        <button
                          onClick={() => handleAddVerseToSchedule(v.verseNumber, v.text)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                          title="Add this verse to service schedule"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-400" />
                          <span>+ Schedule</span>
                        </button>

                        <button
                          onClick={() => handlePushVerseLive(v.verseNumber, v.text)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg flex items-center gap-1 shadow-md transition-all"
                          title="Send verse live on stage immediately"
                        >
                          <Tv className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Go Live</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold">Enter a scripture reference above to load the full chapter and verses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
