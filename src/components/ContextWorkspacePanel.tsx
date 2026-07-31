import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Tv, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Music, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Zap, 
  FileText,
  Check,
  X,
  Volume2,
  Book,
  ArrowRight
} from 'lucide-react';
import { ScheduleItem, Slide, SongItem } from '../types';
import { 
  searchLocalBible, 
  searchBibleSmart, 
  SmartBibleSearchResult, 
  LocalBibleVerseMatch, 
  LocalBibleChapterResult,
  ALL_BIBLE_BOOKS,
  BIBLE_BOOK_MAX_CHAPTERS
} from '../data/localBibleDatabase';
import { PRESET_SONGS } from '../data/mockData';
import { getSavedCustomSongs } from '../data/settingsAndTemplates';

interface ContextWorkspacePanelProps {
  currentItem: ScheduleItem | null;
  activeSlideIndex: number;
  liveSlide: Slide | null;
  schedule: ScheduleItem[];
  onPushSlideToLive: (slide: Slide) => void;
  onPreviewSlide?: (slide: Slide) => void;
  onAddScriptureItem?: (item: ScheduleItem) => void;
  onAddSongItem?: (item: ScheduleItem) => void;
  onSelectScheduleItem?: (id: string) => void;
  onSelectSlideInItem?: (slideIdx: number, goLive: boolean) => void;
}

type TabType = 'bible' | 'songs' | 'presentation';

export const ContextWorkspacePanel: React.FC<ContextWorkspacePanelProps> = ({
  currentItem,
  activeSlideIndex,
  liveSlide,
  schedule,
  onPushSlideToLive,
  onPreviewSlide,
  onAddScriptureItem,
  onAddSongItem,
  onSelectScheduleItem,
  onSelectSlideInItem
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('bible');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('NIV');
  const [isExpanded, setIsExpanded] = useState(false);
  const [dockHeight, setDockHeight] = useState(280);

  // Drag handler for manual vertical height adjustment
  const handleDockResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = dockHeight;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      setDockHeight(Math.min(Math.max(startH + delta, 120), 650));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Bible State
  const [activeBook, setActiveBook] = useState('John');
  const [activeChapterNum, setActiveChapterNum] = useState(3);
  const [activeVerseNum, setActiveVerseNum] = useState(16);
  const [chapterData, setChapterData] = useState<LocalBibleChapterResult | null>(null);
  const [smartBibleResult, setSmartBibleResult] = useState<SmartBibleSearchResult | null>(null);

  // Songs State
  const [songSearchQuery, setSongSearchQuery] = useState('');

  // Combine songs catalog
  const allSongs = React.useMemo<SongItem[]>(() => {
    const customSongs = getSavedCustomSongs();
    return [...PRESET_SONGS, ...customSongs.map(cs => ({
      id: cs.id,
      title: cs.title,
      artist: cs.artist || 'Custom Catalog',
      key: cs.key || 'G',
      ccli: cs.ccli,
      rawLyrics: cs.slides.map(s => s.body).join('\n\n'),
      slides: cs.slides
    }))];
  }, []);

  const filteredSongs = React.useMemo<SongItem[]>(() => {
    return songSearchQuery.trim()
      ? allSongs.filter(s => 
          s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) || 
          s.artist.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
          s.rawLyrics.toLowerCase().includes(songSearchQuery.toLowerCase())
        )
      : allSongs;
  }, [songSearchQuery, allSongs]);
  
  // Refs for auto-scrolling to active verse
  const activeVerseRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically detect active context from live slide or current slide
  useEffect(() => {
    const slideToInspect = liveSlide || (currentItem?.slides ? currentItem.slides[activeSlideIndex] : null);

    if (slideToInspect) {
      if (slideToInspect.type === 'scripture' || currentItem?.type === 'scripture') {
        setActiveTab('bible');
        const refStr = slideToInspect.reference || slideToInspect.header || currentItem?.title || '';
        if (refStr) {
          parseAndLoadScriptureReference(refStr);
        }
      } else if (slideToInspect.type === 'song' || currentItem?.type === 'song') {
        setActiveTab('songs');
      } else {
        setActiveTab('presentation');
      }
    }
  }, [liveSlide, currentItem, activeSlideIndex]);

  // Load Bible Chapter when activeBook, activeChapterNum, or selectedVersion changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      const refQuery = `${activeBook} ${activeChapterNum}:${activeVerseNum}`;
      const res = searchLocalBible(refQuery, selectedVersion);
      setChapterData(res);
      setSmartBibleResult(null);
    }
  }, [activeBook, activeChapterNum, selectedVersion, searchQuery]);

  // Handle keyboard arrow navigation inside Context Workspace (Bible, Songs, Deck)
  useEffect(() => {
    const handleContextKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      const targetEl = e.target as HTMLElement;

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetEl?.tagName)) {
        return;
      }

      const isInsidePanel = targetEl?.closest('.context-workspace-panel') !== null || activeEl?.closest('.context-workspace-panel') !== null;
      if (!isInsidePanel) return;

      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();

        if (activeTab === 'bible' && chapterData?.chapterVerses && chapterData.chapterVerses.length > 0) {
          const currentIdx = chapterData.chapterVerses.findIndex(v => v.verseNumber === activeVerseNum);
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            if (currentIdx >= 0 && currentIdx < chapterData.chapterVerses.length - 1) {
              const nextV = chapterData.chapterVerses[currentIdx + 1];
              handlePushVerseLiveDirect(nextV.verseNumber, nextV.text);
            }
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            if (currentIdx > 0) {
              const prevV = chapterData.chapterVerses[currentIdx - 1];
              handlePushVerseLiveDirect(prevV.verseNumber, prevV.text);
            }
          }
        } else if (activeTab === 'songs' && filteredSongs.length > 0) {
          const allStanzas: Slide[] = [];
          filteredSongs.forEach(song => {
            if (song.slides) {
              song.slides.forEach(s => allStanzas.push(s));
            }
          });

          if (allStanzas.length > 0) {
            const currentIdx = allStanzas.findIndex(s => s.body === liveSlide?.body || s.id === liveSlide?.id);
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
              const nextIdx = currentIdx >= 0 && currentIdx < allStanzas.length - 1 ? currentIdx + 1 : 0;
              onPushSlideToLive(allStanzas[nextIdx]);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
              const prevIdx = currentIdx > 0 ? currentIdx - 1 : 0;
              onPushSlideToLive(allStanzas[prevIdx]);
            }
          }
        } else if (activeTab === 'presentation' && schedule.length > 0) {
          const allSlides: Slide[] = [];
          schedule.forEach(item => {
            if (item.slides) {
              item.slides.forEach(s => allSlides.push(s));
            }
          });

          if (allSlides.length > 0) {
            const currentIdx = allSlides.findIndex(s => s.id === liveSlide?.id || s.body === liveSlide?.body);
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
              const nextIdx = currentIdx >= 0 && currentIdx < allSlides.length - 1 ? currentIdx + 1 : 0;
              onPushSlideToLive(allSlides[nextIdx]);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
              const prevIdx = currentIdx > 0 ? currentIdx - 1 : 0;
              onPushSlideToLive(allSlides[prevIdx]);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleContextKeyDown, true);
    return () => window.removeEventListener('keydown', handleContextKeyDown, true);
  }, [activeTab, chapterData, activeVerseNum, filteredSongs, schedule, liveSlide, onPushSlideToLive]);

  // Scroll active verse into center view ONLY on chapter load or tab switch (NOT on single verse click)
  useEffect(() => {
    if (activeVerseRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        activeVerseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [chapterData, activeTab]);

  const parseAndLoadScriptureReference = (refStr: string) => {
    const res = searchLocalBible(refStr, selectedVersion);
    if (res) {
      setActiveBook(res.book);
      setActiveChapterNum(res.chapter);
      setActiveVerseNum(res.targetVerse || 1);
      setChapterData(res);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (activeTab === 'bible') {
      if (val.trim().length > 1) {
        const smartRes = searchBibleSmart(val, selectedVersion);
        setSmartBibleResult(smartRes);
        if (smartRes.searchType === 'reference' && smartRes.chapterResult) {
          setActiveBook(smartRes.chapterResult.book);
          setActiveChapterNum(smartRes.chapterResult.chapter);
          setActiveVerseNum(smartRes.chapterResult.targetVerse || 1);
          setChapterData(smartRes.chapterResult);
        }
      } else {
        setSmartBibleResult(null);
      }
    } else if (activeTab === 'songs') {
      setSongSearchQuery(val);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSongSearchQuery('');
    setSmartBibleResult(null);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      if (activeTab === 'bible') {
        const smartRes = searchBibleSmart(searchQuery.trim(), selectedVersion);
        if (smartRes.searchType === 'reference' && smartRes.chapterResult) {
          const { book, chapter, targetVerse, chapterVerses } = smartRes.chapterResult;
          const targetVNum = targetVerse || 1;
          const verseObj = chapterVerses.find(v => v.verseNumber === targetVNum) || chapterVerses[0];
          if (verseObj) {
            setActiveBook(book);
            setActiveChapterNum(chapter);
            setActiveVerseNum(verseObj.verseNumber);
            setChapterData(smartRes.chapterResult);

            const verseRef = `${book} ${chapter}:${verseObj.verseNumber}`;
            const slide: Slide = {
              id: `live-scrip-${Date.now()}`,
              type: 'scripture',
              header: verseRef,
              body: verseObj.text,
              reference: `${verseRef} (${selectedVersion})`,
              themeStyle: 'nature-serene'
            };
            onPushSlideToLive(slide);
          }
        } else if (smartRes.searchType === 'content' && smartRes.contentMatches && smartRes.contentMatches.length > 0) {
          const firstMatch = smartRes.contentMatches[0];
          setActiveBook(firstMatch.book);
          setActiveChapterNum(firstMatch.chapter);
          setActiveVerseNum(firstMatch.verseNumber);

          const chapRes = searchLocalBible(`${firstMatch.book} ${firstMatch.chapter}:${firstMatch.verseNumber}`, selectedVersion);
          setChapterData(chapRes);

          const verseRef = `${firstMatch.book} ${firstMatch.chapter}:${firstMatch.verseNumber}`;
          const slide: Slide = {
            id: `live-scrip-${Date.now()}`,
            type: 'scripture',
            header: verseRef,
            body: firstMatch.text,
            reference: `${verseRef} (${selectedVersion})`,
            themeStyle: 'nature-serene'
          };
          onPushSlideToLive(slide);
        }
      }
    }
  };

  const handleSelectVerse = (verseNumber: number, verseText: string) => {
    setActiveVerseNum(verseNumber);
    const verseRef = `${activeBook} ${activeChapterNum}:${verseNumber}`;
    const slide: Slide = {
      id: `scrip-${Date.now()}`,
      type: 'scripture',
      header: verseRef,
      body: verseText,
      reference: `${verseRef} (${selectedVersion})`,
      themeStyle: 'nature-serene'
    };
    if (onPreviewSlide) {
      onPreviewSlide(slide);
    }
  };

  const handlePushVerseLiveDirect = (verseNumber: number, verseText: string) => {
    setActiveVerseNum(verseNumber);
    const verseRef = `${activeBook} ${activeChapterNum}:${verseNumber}`;
    const slide: Slide = {
      id: `live-scrip-${Date.now()}`,
      type: 'scripture',
      header: verseRef,
      body: verseText,
      reference: `${verseRef} (${selectedVersion})`,
      themeStyle: 'nature-serene'
    };
    onPushSlideToLive(slide);
  };

  const handleAddVerseToSchedule = (verseNumber: number, verseText: string) => {
    if (!onAddScriptureItem) return;
    const verseRef = `${activeBook} ${activeChapterNum}:${verseNumber}`;
    const newItem: ScheduleItem = {
      id: `scripture-${Date.now()}`,
      title: `Scripture: ${verseRef}`,
      subtitle: `${selectedVersion} Translation`,
      type: 'scripture',
      activeSlideIndex: 0,
      slides: [{
        id: `scrip-s-${Date.now()}`,
        type: 'scripture',
        header: verseRef,
        body: verseText,
        reference: `${verseRef} (${selectedVersion})`,
        themeStyle: 'nature-serene'
      }]
    };
    onAddScriptureItem(newItem);
  };

  const handleAddCustomVerseToSchedule = (refStr: string, verseText: string) => {
    if (!onAddScriptureItem) return;
    const newItem: ScheduleItem = {
      id: `scripture-${Date.now()}`,
      title: `Scripture: ${refStr}`,
      subtitle: `${selectedVersion} Translation`,
      type: 'scripture',
      activeSlideIndex: 0,
      slides: [{
        id: `scrip-s-${Date.now()}`,
        type: 'scripture',
        header: refStr,
        body: verseText,
        reference: `${refStr} (${selectedVersion})`,
        themeStyle: 'nature-serene'
      }]
    };
    onAddScriptureItem(newItem);
  };

  const handlePrevChapter = () => {
    if (activeChapterNum > 1) {
      setActiveChapterNum(prev => prev - 1);
      setActiveVerseNum(1);
    } else {
      const currentBookIdx = ALL_BIBLE_BOOKS.indexOf(activeBook);
      if (currentBookIdx > 0) {
        const prevBook = ALL_BIBLE_BOOKS[currentBookIdx - 1];
        const maxCh = BIBLE_BOOK_MAX_CHAPTERS[prevBook] || 1;
        setActiveBook(prevBook);
        setActiveChapterNum(maxCh);
        setActiveVerseNum(1);
      }
    }
  };

  const handleNextChapter = () => {
    const maxCh = BIBLE_BOOK_MAX_CHAPTERS[activeBook] || 20;
    if (activeChapterNum < maxCh) {
      setActiveChapterNum(prev => prev + 1);
      setActiveVerseNum(1);
    } else {
      const currentBookIdx = ALL_BIBLE_BOOKS.indexOf(activeBook);
      if (currentBookIdx < ALL_BIBLE_BOOKS.length - 1) {
        const nextBook = ALL_BIBLE_BOOKS[currentBookIdx + 1];
        setActiveBook(nextBook);
        setActiveChapterNum(1);
        setActiveVerseNum(1);
      }
    }
  };

  const handleOpenChapterFromSearchResult = (m: LocalBibleVerseMatch) => {
    setActiveBook(m.book);
    setActiveChapterNum(m.chapter);
    setActiveVerseNum(m.verseNumber);
    setSearchQuery('');
    setSmartBibleResult(null);
  };

  // Active song object
  const activeSongObj = currentItem?.type === 'song' 
    ? allSongs.find(s => s.title.toLowerCase() === currentItem.title.toLowerCase()) || allSongs[0]
    : allSongs[0];

  return (
    <div 
      style={{ height: `${isExpanded ? 480 : dockHeight}px` }}
      className="context-workspace-panel bg-slate-900 border-t border-slate-800 flex flex-col transition-all duration-150 relative z-30 shadow-2xl shrink-0"
    >
      {/* Dock Top Drag Resizer Handle */}
      <div 
        onMouseDown={handleDockResizeStart}
        className="h-2 w-full bg-slate-900 hover:bg-amber-500/80 active:bg-amber-500 cursor-row-resize flex items-center justify-center group transition-colors shrink-0 z-40 border-b border-slate-800/60"
        title="Drag up or down to adjust bottom dock height"
      >
        <div className="w-12 h-1 rounded-full bg-slate-700 group-hover:bg-slate-950 transition-colors" />
      </div>

      {/* Dock Control Bar */}
      <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => { setActiveTab('bible'); setSearchQuery(''); }}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'bible'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Bible Context</span>
          </button>

          <button
            onClick={() => { setActiveTab('songs'); setSearchQuery(''); }}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'songs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Songs Catalog</span>
          </button>

          <button
            onClick={() => { setActiveTab('presentation'); setSearchQuery(''); }}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'presentation'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Deck Slides</span>
          </button>
        </div>

        {/* Quick Search Field */}
        <div className="flex-1 max-w-md relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              activeTab === 'bible'
                ? "Search scripture phrase or verse (e.g., 'in the beginning' or 'John 3:16')..."
                : activeTab === 'songs'
                ? "Search song titles or lyrics..."
                : "Search slides or presentations..."
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-7 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Translation Selector & Resize Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'bible' && (
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="bg-slate-900 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="NIV">NIV</option>
              <option value="KJV">KJV</option>
              <option value="NKJV">NKJV</option>
              <option value="ESV">ESV</option>
              <option value="NLT">NLT</option>
            </select>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? "Collapse Dock" : "Expand Dock"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-950/70">
        {/* ========================================================= */}
        {/* TAB 1: BIBLE READER & PHRASE SEARCH                      */}
        {/* ========================================================= */}
        {activeTab === 'bible' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Phrase Search Matches (If search query active) */}
            {smartBibleResult?.searchType === 'content' && smartBibleResult.contentMatches ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Phrase Matches ({smartBibleResult.contentMatches.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Click any verse to go live or view full chapter</span>
                </div>

                {smartBibleResult.contentMatches.map((m, idx) => (
                  <div
                    key={`dock-match-${m.reference}-${idx}`}
                    onClick={() => handleOpenChapterFromSearchResult(m)}
                    onDoubleClick={() => handlePushVerseLiveDirect(m.verseNumber, m.text)}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800/80 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                    title="Single-click to open chapter. Double-click to project verse live."
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-extrabold text-amber-400 mr-2">
                        {m.reference}
                      </span>
                      <span className="text-xs font-serif italic text-slate-200">
                        "{m.text}"
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      {onAddScriptureItem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddCustomVerseToSchedule(m.reference, m.text);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-lg transition-colors cursor-pointer"
                          title="Add to Service Schedule"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Full Chapter Context Reader with Active Verse Highlighted */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Chapter Navigation Bar */}
                <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevChapter}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="Previous Chapter"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <h4 className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                      <span>{activeBook} Chapter {activeChapterNum}</span>
                    </h4>

                    <button
                      onClick={handleNextChapter}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="Next Chapter"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Active Target: Verse {activeVerseNum}</span>
                  </div>
                </div>

                {/* Verses Scroll List */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar"
                >
                  {chapterData?.chapterVerses && chapterData.chapterVerses.length > 0 ? (
                    chapterData.chapterVerses.map((v) => {
                      const isActive = v.verseNumber === activeVerseNum;

                      return (
                        <div
                          key={`reader-v-${v.verseNumber}`}
                          ref={isActive ? activeVerseRef : null}
                          onClick={() => handleSelectVerse(v.verseNumber, v.text)}
                          onDoubleClick={() => handlePushVerseLiveDirect(v.verseNumber, v.text)}
                          className={`py-0.5 px-1.5 rounded transition-colors flex items-baseline justify-between gap-2 cursor-pointer group hover:bg-slate-900/80 ${
                            isActive ? 'text-amber-400 font-bold' : 'text-slate-300'
                          }`}
                          title="Single-click to select. Double-click to go live."
                        >
                          {/* Verse Text */}
                          <div className="flex items-baseline gap-2 min-w-0 flex-1">
                            <span className={`text-[11px] font-mono shrink-0 ${
                              isActive ? 'text-amber-400 font-black' : 'text-slate-500 font-bold'
                            }`}>
                              v{v.verseNumber}
                            </span>

                            <p className={`text-xs md:text-sm font-serif leading-snug transition-colors ${
                              isActive ? 'text-amber-300 font-bold' : 'text-slate-200 font-normal'
                            }`}>
                              {v.text}
                            </p>
                          </div>

                          {/* Quick Add (+) Action */}
                          <div className="flex items-center shrink-0 justify-end">
                            {onAddScriptureItem && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddVerseToSchedule(v.verseNumber, v.text);
                                }}
                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                                title="Add to Service Schedule"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Loading scripture context...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SONGS CATALOG & SEARCHABLE LYRICS                  */}
        {/* ========================================================= */}
        {activeTab === 'songs' && (
          <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
            <div className="pb-2 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <h4 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Worship Songs Catalog ({filteredSongs.length})</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Search all worship songs, view stanzas, or project lyrics live directly
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
              {filteredSongs.length > 0 ? (
                filteredSongs.map((song) => {
                  const isCurrentActiveSong = currentItem?.title.toLowerCase() === song.title.toLowerCase();

                  return (
                    <div
                      key={song.id}
                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                        isCurrentActiveSong
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-100 shadow-lg'
                          : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {/* Song Header & Key Info */}
                      <div 
                        onDoubleClick={() => song.slides && song.slides.length > 0 && onPushSlideToLive(song.slides[0])}
                        className="flex flex-wrap items-center justify-between gap-2 cursor-pointer"
                        title="Double-click to project song live"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-slate-100">{song.title}</h4>
                            {song.key && (
                              <span className="text-[10px] bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded font-bold border border-indigo-700/50">
                                Key: {song.key}
                              </span>
                            )}
                            {isCurrentActiveSong && (
                              <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                                In Schedule
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {song.artist} • {song.slides?.length || 0} stanzas {song.ccli ? `• CCLI #${song.ccli}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (onAddSongItem) {
                                const newItem: ScheduleItem = {
                                  id: `song-item-${Date.now()}`,
                                  title: song.title,
                                  subtitle: `${song.artist} (Key: ${song.key})`,
                                  type: 'song',
                                  activeSlideIndex: 0,
                                  slides: song.slides || [{
                                    id: `s-${Date.now()}`,
                                    type: 'song',
                                    header: song.title,
                                    body: song.rawLyrics,
                                    themeStyle: 'purple-majesty'
                                  }]
                                };
                                onAddSongItem(newItem);
                              }
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer border border-slate-700"
                            title="Add song to service schedule"
                          >
                            <Plus className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Add to Schedule</span>
                          </button>

                          {song.slides && song.slides.length > 0 && (
                            <button
                              onClick={() => onPushSlideToLive(song.slides![0])}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                              title="Project first stanza live"
                            >
                              <Tv className="w-3.5 h-3.5 fill-current" />
                              <span>Go Live</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stanzas / Lyrics Preview Cards */}
                      {song.slides && song.slides.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {song.slides.map((s, sIdx) => {
                            const isLiveThisSlide = liveSlide?.body === s.body;

                            return (
                              <div
                                key={`song-${song.id}-s-${s.id || sIdx}`}
                                onDoubleClick={() => onPushSlideToLive(s)}
                                className={`p-2 rounded-lg border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                                  isLiveThisSlide
                                    ? 'bg-indigo-600/30 border-indigo-400 text-white ring-1 ring-indigo-400'
                                    : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                                }`}
                                title="Double-click to project stanza live"
                              >
                                <div className="min-w-0 flex-1">
                                  {s.header && (
                                    <span className="text-[10px] font-extrabold uppercase text-indigo-300 block mb-0.5">
                                      {s.header}
                                    </span>
                                  )}
                                  <p className="text-[11px] font-medium leading-relaxed whitespace-pre-line line-clamp-3">
                                    {s.body}
                                  </p>
                                </div>

                                <button
                                  onClick={() => onPushSlideToLive(s)}
                                  className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded shrink-0 flex items-center gap-1 cursor-pointer mt-0.5"
                                  title="Project this stanza live"
                                >
                                  <Tv className="w-3 h-3 fill-current" />
                                  <span>Live</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No worship songs matched "{songSearchQuery || searchQuery}". Try searching for another title or artist.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SEARCHABLE SERVICE DECK SLIDES                     */}
        {/* ========================================================= */}
        {activeTab === 'presentation' && (
          <div className="flex-1 flex flex-col min-h-0 p-3 space-y-2">
            <div className="pb-1.5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <h4 className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Service Deck Slides</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  All slides across {schedule.length} presentation items in active schedule
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {schedule.map((item, itemIdx) => {
                const itemQuery = searchQuery.toLowerCase().trim();
                const itemMatches = !itemQuery || 
                  item.title.toLowerCase().includes(itemQuery) ||
                  item.slides.some(s => 
                    (s.header && s.header.toLowerCase().includes(itemQuery)) ||
                    (s.body && s.body.toLowerCase().includes(itemQuery))
                  );

                if (!itemMatches) return null;

                const isSelectedItem = item.id === currentItem?.id;

                return (
                  <div 
                    key={`deck-item-${item.id}-${itemIdx}`}
                    className={`rounded-xl border p-2.5 space-y-2 ${
                      isSelectedItem
                        ? 'bg-purple-950/20 border-purple-500/40'
                        : 'bg-slate-900/80 border-slate-800/80'
                    }`}
                  >
                    {/* Item Title Bar */}
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-700/50">
                          Item #{itemIdx + 1}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-100">{item.title}</h4>
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({item.type} • {item.slides.length} slides)
                        </span>
                      </div>

                      {onSelectScheduleItem && (
                        <button
                          onClick={() => onSelectScheduleItem(item.id)}
                          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                        >
                          Select Deck Item
                        </button>
                      )}
                    </div>

                    {/* Grid of Slides inside this item */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {item.slides.map((s, slideIdx) => {
                        const isLiveThisSlide = liveSlide?.id === s.id || (liveSlide?.body === s.body && liveSlide?.header === s.header);
                        const slideQuery = searchQuery.toLowerCase().trim();
                        const isMatchedSlide = !slideQuery ||
                          (s.header && s.header.toLowerCase().includes(slideQuery)) ||
                          (s.body && s.body.toLowerCase().includes(slideQuery));

                        if (!isMatchedSlide) return null;

                        return (
                          <div
                            key={`item-${item.id}-slide-${s.id}-${slideIdx}`}
                            onDoubleClick={() => {
                              if (isSelectedItem && onSelectSlideInItem) {
                                onSelectSlideInItem(slideIdx, true);
                              } else {
                                onPushSlideToLive(s);
                              }
                            }}
                            className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                              isLiveThisSlide
                                ? 'bg-purple-600/30 border-purple-400 text-purple-100 shadow-md ring-1 ring-purple-400'
                                : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700'
                            }`}
                            title="Double-click to project slide live"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  #{slideIdx + 1}
                                </span>
                                {s.header && (
                                  <span className="text-[10px] font-extrabold text-amber-300 uppercase truncate max-w-[120px]">
                                    {s.header}
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] leading-snug line-clamp-3 ${s.type === 'scripture' ? 'font-serif italic text-amber-100' : 'font-medium text-slate-200'}`}>
                                {s.body}
                              </p>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800/60">
                              {onPreviewSlide && (
                                <button
                                  onClick={() => onPreviewSlide(s)}
                                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded cursor-pointer"
                                  title="Preview in Operator Next Window"
                                >
                                  Preview
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (isSelectedItem && onSelectSlideInItem) {
                                    onSelectSlideInItem(slideIdx, true);
                                  } else {
                                    onPushSlideToLive(s);
                                  }
                                }}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-extrabold rounded flex items-center gap-1 cursor-pointer shadow-sm"
                              >
                                <Tv className="w-3 h-3 fill-current" />
                                <span>Go Live</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
