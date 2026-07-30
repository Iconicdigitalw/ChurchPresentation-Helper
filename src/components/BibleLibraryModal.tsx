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
  Check
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

  const inputRef = useRef<HTMLInputElement>(null);
  const targetVerseRef = useRef<HTMLDivElement>(null);

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

    // Smooth scroll to target verse
    setTimeout(() => {
      if (targetVerseRef.current) {
        targetVerseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === ' ' || e.key === 'ArrowRight') && autoCompleteSuggestion) {
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
      performInstantSearch(searchQuery, selectedVersion);
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
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type book, chapter, verse (e.g. John 3 16, Psalm 23, Romans 8:28)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />
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

          {/* Autocomplete Suggestion Hint Bar */}
          {autoCompleteSuggestion && (
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="text-slate-400 text-[11px]">Autocomplete Suggestion:</span>
              <button
                onClick={applyAutoComplete}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800/80 hover:bg-blue-900 text-xs font-bold transition-all"
              >
                <span>{autoCompleteSuggestion}</span>
                <span className="text-[9px] bg-blue-900 text-blue-200 px-1 rounded uppercase">Press Tab / Space</span>
              </button>
            </div>
          )}
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
