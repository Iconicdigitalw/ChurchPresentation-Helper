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
  Settings,
  Upload,
  FileText,
  CheckCircle2,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { ScheduleItem, Slide } from '../types';
import {
  getVerseSplitMode,
  saveVerseSplitMode,
  VerseSplitMode
} from '../data/settingsAndTemplates';
import {
  searchLocalBible, 
  searchBibleSmart,
  SmartBibleSearchResult,
  LocalBibleVerseMatch,
  ALL_BIBLE_BOOKS, 
  getCustomBibleVersions, 
  saveCustomBibleVersion, 
  removeCustomBibleVersion,
  CustomBibleVersion
} from '../data/localBibleDatabase';

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
  notice?: string;
}

interface BibleLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: some callers only ever push live and never build the schedule. */
  onAddScriptureItem?: (item: ScheduleItem) => void;
  onPushSlideToLive: (slide: Slide) => void;
  initialQuery?: string;
  /** Alias used by the console shell. */
  initialSearchQuery?: string;
}

/** "Isaiah 40:30-31" for a contiguous run, "Isaiah 40:30,33" when it has gaps. */
function formatVerseRangeReference(verseNumbers: number[], book: string, chapter: number): string {
  const ordered = Array.from(new Set(verseNumbers)).sort((a, b) => a - b);
  if (ordered.length === 0) return `${book} ${chapter}`;
  if (ordered.length === 1) return `${book} ${chapter}:${ordered[0]}`;

  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const isContiguous = last - first === ordered.length - 1;

  return isContiguous
    ? `${book} ${chapter}:${first}-${last}`
    : `${book} ${chapter}:${ordered.join(',')}`;
}

export const BibleLibraryModal: React.FC<BibleLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddScriptureItem,
  onPushSlideToLive,
  initialQuery = '',
  initialSearchQuery = ''
}) => {
  const seedQuery = initialQuery || initialSearchQuery;

  // Adding to the schedule is optional; never blow up when it is not wired.
  const addScriptureItem = (item: ScheduleItem) => {
    if (onAddScriptureItem) {
      onAddScriptureItem(item);
    } else {
      console.warn('BibleLibraryModal: onAddScriptureItem was not provided; item not added.', item);
    }
  };

  const [searchQuery, setSearchQuery] = useState(seedQuery);
  const [selectedVersion, setSelectedVersion] = useState('NIV');
  const [activeChapter, setActiveChapter] = useState<BibleChapterResult | null>(null);
  const [smartResult, setSmartResult] = useState<SmartBibleSearchResult | null>(null);
  const [autoCompleteSuggestion, setAutoCompleteSuggestion] = useState<string | null>(null);

  // Multi-verse selection & how a range becomes slides (remembered per operator)
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [verseSplitMode, setVerseSplitMode] = useState<VerseSplitMode>(getVerseSplitMode());
  const lastToggledVerseRef = useRef<number | null>(null);

  // Custom Uploaded Versions & Modal state
  const [customVersions, setCustomVersions] = useState<CustomBibleVersion[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCode, setUploadCode] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadTextContent, setUploadTextContent] = useState('');
  const [uploadStatusMsg, setUploadStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom versions on mount / open
  useEffect(() => {
    if (isOpen) {
      setCustomVersions(getCustomBibleVersions());
    }
  }, [isOpen]);

  // Handle uploading/parsing custom Bible files (.json, .txt, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, "");
    if (!uploadCode) {
      setUploadCode(fileName.substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, ''));
    }
    if (!uploadName) {
      setUploadName(fileName.replace(/[_-]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setUploadTextContent(content);
        setUploadStatusMsg({ type: 'success', text: `Loaded file "${file.name}" (${(file.size / 1024).toFixed(1)} KB)` });
      }
    };
    reader.readAsText(file);
  };

  const processAndSaveCustomVersion = () => {
    const code = uploadCode.trim().toUpperCase() || 'CUSTOM';
    const name = uploadName.trim() || `Custom Bible (${code})`;

    if (!uploadTextContent.trim()) {
      setUploadStatusMsg({ type: 'error', text: 'Please select a file or paste Bible text / JSON content.' });
      return;
    }

    const verseMap: Record<string, string> = {};

    try {
      // 1. Try parsing JSON
      if (uploadTextContent.trim().startsWith('{') || uploadTextContent.trim().startsWith('[')) {
        const parsed = JSON.parse(uploadTextContent);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          const sourceObj = parsed.verses || parsed.data || parsed;
          for (const [key, val] of Object.entries(sourceObj)) {
            if (typeof val === 'string') {
              verseMap[key] = val;
            } else if (typeof val === 'object' && val !== null && (val as any).text) {
              verseMap[key] = (val as any).text;
            }
          }
        } else if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.reference && item.text) {
              verseMap[item.reference] = item.text;
            } else if (item.book && item.chapter && item.verse && item.text) {
              verseMap[`${item.book} ${item.chapter}:${item.verse}`] = item.text;
            }
          });
        }
      } else {
        // 2. Parse text / CSV lines e.g. "John 3:16 For God so loved..." or "John,3,16,Text"
        const lines = uploadTextContent.split(/\r?\n/);
        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;

          // Match "Book C:V Text" e.g. "John 3:16 For God so loved..."
          const lineMatch = trimmed.match(/^((?:\d\s+)?[a-zA-Z\s]+)\s+(\d+)[:\s]+(\d+)\s+(.+)$/);
          if (lineMatch) {
            const b = lineMatch[1].trim();
            const c = lineMatch[2];
            const v = lineMatch[3];
            const txt = lineMatch[4].trim();
            verseMap[`${b} ${c}:${v}`] = txt;
          } else {
            // CSV split fallback
            const csvParts = trimmed.split(',');
            if (csvParts.length >= 2) {
              const ref = csvParts[0].trim().replace(/^"|"$/g, '');
              const txt = csvParts.slice(1).join(',').trim().replace(/^"|"$/g, '');
              if (ref && txt) {
                verseMap[ref] = txt;
              }
            }
          }
        });
      }

      if (Object.keys(verseMap).length === 0) {
        // Fallback demo map if format was non-standard
        verseMap['John 3:16'] = uploadTextContent.substring(0, 300);
      }

      const newVer: CustomBibleVersion = {
        id: code,
        name: name,
        isCustom: true,
        verses: verseMap
      };

      saveCustomBibleVersion(newVer);
      const updatedList = getCustomBibleVersions();
      setCustomVersions(updatedList);
      setSelectedVersion(code);
      setShowUploadModal(false);
      setUploadCode('');
      setUploadName('');
      setUploadTextContent('');
      setUploadStatusMsg(null);

      // Perform search immediately with new version
      performInstantSearch(searchQuery || 'John 3:16', code);
    } catch (e) {
      setUploadStatusMsg({ type: 'error', text: 'Error parsing Bible file format. Ensure valid JSON, TXT, or CSV format.' });
    }
  };

  const handleDeleteCustomVersion = (codeToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeCustomBibleVersion(codeToDelete);
    const updated = getCustomBibleVersions();
    setCustomVersions(updated);
    if (selectedVersion === codeToDelete) {
      setSelectedVersion('NIV');
      performInstantSearch(searchQuery, 'NIV');
    }
  };

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

  const isCompleteReference = (query: string): boolean => {
    const trimmed = query.trim();
    if (!trimmed) return false;
    // Matches references with book + chapter [+ verse]
    // e.g., "John 3 16", "John 3:16", "1 John 3:16", "Genesis 1:1", "Psalm 23", "Deuteronomy 6 4"
    return /^((?:\d\s+)?[a-zA-Z\s]+)\s+\d+([\s:]\d+)?$/.test(trimmed);
  };

  // Focus & initial instant search on modal open
  useEffect(() => {
    if (isOpen) {
      const q = seedQuery || 'John 3 16';
      setSearchQuery(q);
      setVerseSplitMode(getVerseSplitMode());
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (!seedQuery) {
            inputRef.current.select();
          } else {
            inputRef.current.setSelectionRange(q.length, q.length);
          }
        }
      }, 50);

      performInstantSearch(q, selectedVersion);
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      setIsListening(false);
    }
  }, [isOpen, seedQuery]);

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

  /**
   * Pulls a verse range out of a typed reference, e.g. "Isaiah 40:30-31" or
   * "Isaiah 40 30 - 31". Returns null for single-verse references.
   */
  const parseRequestedVerseRange = (query: string): { start: number; end: number } | null => {
    const match = query.trim().match(/(\d+)\s*[:.\s]\s*(\d+)\s*[-–—]\s*(\d+)\s*$/);
    if (!match) return null;
    const start = parseInt(match[2], 10);
    const end = parseInt(match[3], 10);
    if (!start || !end || end <= start) return null;
    return { start, end };
  };

  const performInstantSearch = (queryStr: string, version: string) => {
    if (!queryStr.trim()) return;
    const result = searchBibleSmart(queryStr, version);
    setSmartResult(result);

    if (result.searchType === 'reference' && result.chapterResult) {
      const chapterResult = result.chapterResult;
      setActiveChapter({
        reference: chapterResult.reference,
        book: chapterResult.book,
        chapter: chapterResult.chapter,
        targetVerse: chapterResult.targetVerse,
        translation: chapterResult.translation,
        chapterVerses: chapterResult.chapterVerses,
        notice: chapterResult.notice
      });

      // A typed range ("Isaiah 40:30-31") pre-selects those verses so the
      // split choice is offered straight away.
      const requestedRange = parseRequestedVerseRange(queryStr);
      const lastVerse = chapterResult.chapterVerses.length;
      if (requestedRange && requestedRange.start <= lastVerse) {
        const rangeEnd = Math.min(requestedRange.end, lastVerse);
        const verses: number[] = [];
        for (let v = requestedRange.start; v <= rangeEnd; v++) verses.push(v);
        setSelectedVerses(verses);
      } else {
        setSelectedVerses([]);
      }
      lastToggledVerseRef.current = null;

      scrollToTargetVerse();
    }
  };

  const handleOpenChapterFromMatch = (match: LocalBibleVerseMatch) => {
    const refStr = `${match.book} ${match.chapter}:${match.verseNumber}`;
    setSearchQuery(refStr);
    performInstantSearch(refStr, selectedVersion);
  };

  /**
   * Single builder for every "add scripture" path so combined and per-verse
   * ranges (and plain single verses) always produce consistent slides.
   */
  const buildScriptureSlides = (
    verses: BibleVerseItem[],
    book: string,
    chapter: number,
    mode: VerseSplitMode
  ): Slide[] => {
    const ordered = [...verses].sort((a, b) => a.verseNumber - b.verseNumber);
    const stamp = Date.now();

    // One slide per verse, each carrying its own reference
    if (mode === 'per_verse' && ordered.length > 1) {
      return ordered.map(v => {
        const verseRef = `${book} ${chapter}:${v.verseNumber}`;
        return {
          id: `scrip-s-${stamp}-${v.verseNumber}`,
          type: 'scripture',
          header: verseRef,
          body: v.text,
          reference: `${verseRef} (${selectedVersion})`,
          themeStyle: 'nature-serene'
        };
      });
    }

    // One combined slide keeping the full range reference
    const rangeRef = formatVerseRangeReference(ordered.map(v => v.verseNumber), book, chapter);
    return [{
      id: `scrip-s-${stamp}`,
      type: 'scripture',
      header: rangeRef,
      body: ordered.map(v => v.text).join(' '),
      reference: `${rangeRef} (${selectedVersion})`,
      themeStyle: 'nature-serene'
    }];
  };

  const buildScriptureItem = (
    verses: BibleVerseItem[],
    book: string,
    chapter: number,
    mode: VerseSplitMode
  ): ScheduleItem => {
    const slides = buildScriptureSlides(verses, book, chapter, mode);
    const rangeRef = formatVerseRangeReference(verses.map(v => v.verseNumber), book, chapter);

    return {
      id: `scripture-${Date.now()}`,
      title: `Scripture: ${rangeRef}`,
      subtitle: `${selectedVersion} Translation${slides.length > 1 ? ` • ${slides.length} slides` : ''}`,
      type: 'scripture',
      activeSlideIndex: 0,
      slides
    };
  };

  // Phrase-search results are always a single card, so they stay one slide and
  // keep the curated reference string exactly as it is indexed.
  const handleAddMatchedVerseToSchedule = (ref: string, text: string) => {
    const newItem: ScheduleItem = {
      id: `scripture-${Date.now()}`,
      title: `Scripture: ${ref}`,
      subtitle: `${selectedVersion} Translation`,
      type: 'scripture',
      activeSlideIndex: 0,
      slides: [{
        id: `scrip-s-${Date.now()}`,
        type: 'scripture',
        header: ref,
        body: text,
        reference: `${ref} (${selectedVersion})`,
        themeStyle: 'nature-serene'
      }]
    };
    addScriptureItem(newItem);
    onClose();
  };

  const handlePushMatchedVerseLive = (ref: string, text: string) => {
    const liveSlideItem: Slide = {
      id: `live-scrip-${Date.now()}`,
      type: 'scripture',
      header: ref,
      body: text,
      reference: `${ref} (${selectedVersion})`,
      themeStyle: 'nature-serene'
    };
    onPushSlideToLive(liveSlideItem);
    onClose();
  };

  const highlightSearchQuery = (text: string, query: string) => {
    if (!query.trim()) return text;
    const terms = query.trim().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) return text;

    const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(pattern);

    return parts.map((part, i) => 
      terms.some(t => t.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If user starts typing a single letter (a-z, A-Z) and search box contains a complete verse/passage reference, replace the query
    const isSingleLetter = /^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey;
    if (isSingleLetter && isCompleteReference(searchQuery)) {
      const inputEl = inputRef.current;
      const isEntirelySelected = inputEl && inputEl.selectionStart === 0 && inputEl.selectionEnd === searchQuery.length;
      if (!isEntirelySelected) {
        e.preventDefault();
        setSearchQuery(e.key);
        return;
      }
    }

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
      if (smartResult?.searchType === 'content' && smartResult.contentMatches && smartResult.contentMatches.length > 0) {
        const topMatch = smartResult.contentMatches[0];
        handlePushMatchedVerseLive(topMatch.reference, topMatch.text);
      } else if (activeChapter) {
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

    const newItem = buildScriptureItem(
      [{ verseNumber: verseNum, text }],
      activeChapter.book,
      activeChapter.chapter,
      'combined'
    );

    addScriptureItem(newItem);
    onClose();
  };

  // ---- Multi-verse selection (range → combined slide or slide per verse) ----

  const selectedVerseItems: BibleVerseItem[] = activeChapter
    ? activeChapter.chapterVerses.filter(v => selectedVerses.includes(v.verseNumber))
    : [];

  const selectionReference = activeChapter
    ? formatVerseRangeReference(selectedVerses, activeChapter.book, activeChapter.chapter)
    : '';

  // A split choice is only meaningful once the selection spans 2+ verses
  const canSplitSelection = selectedVerseItems.length > 1;
  const effectiveSplitMode: VerseSplitMode = canSplitSelection ? verseSplitMode : 'combined';
  const selectionSlideCount = effectiveSplitMode === 'per_verse' ? selectedVerseItems.length : 1;

  const toggleVerseSelection = (verseNum: number, extendRange: boolean) => {
    // Read the anchor before moving it: the state updater runs on the next
    // render, by which point the ref would already point at this verse.
    const anchorVerse = lastToggledVerseRef.current;
    lastToggledVerseRef.current = verseNum;

    setSelectedVerses(prev => {
      // Shift-click extends from the last toggled verse to this one
      if (extendRange && anchorVerse !== null) {
        const from = Math.min(anchorVerse, verseNum);
        const to = Math.max(anchorVerse, verseNum);
        const merged = new Set<number>(prev);
        for (let v = from; v <= to; v++) merged.add(v);
        return Array.from(merged).sort((a, b) => a - b);
      }

      return prev.includes(verseNum)
        ? prev.filter(v => v !== verseNum)
        : [...prev, verseNum].sort((a, b) => a - b);
    });
  };

  const handleChangeSplitMode = (mode: VerseSplitMode) => {
    setVerseSplitMode(mode);
    // Remember the operator's last choice as next time's default
    saveVerseSplitMode(mode);
  };

  const handleAddSelectionToSchedule = () => {
    if (!activeChapter || selectedVerseItems.length === 0) return;

    const newItem = buildScriptureItem(
      selectedVerseItems,
      activeChapter.book,
      activeChapter.chapter,
      effectiveSplitMode
    );

    addScriptureItem(newItem);
    onClose();
  };

  const handlePushSelectionLive = () => {
    if (!activeChapter || selectedVerseItems.length === 0) return;

    const slides = buildScriptureSlides(
      selectedVerseItems,
      activeChapter.book,
      activeChapter.chapter,
      effectiveSplitMode
    );

    onPushSlideToLive({ ...slides[0], id: `live-scrip-${Date.now()}` });
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
                <h2 className="text-base font-bold text-slate-100">Live Bible Passage & Verse Lookup</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>Instant Local Database (0ms)</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">Type reference, passage or range (e.g., <code className="text-amber-300 bg-slate-900 px-1 rounded">John 3 16</code>, <code className="text-amber-300 bg-slate-900 px-1 rounded">John 3:16</code> or <code className="text-amber-300 bg-slate-900 px-1 rounded">Isaiah 40:30-31</code>)</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
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
                onFocus={(e) => e.target.select()}
                onKeyDown={handleKeyDown}
                placeholder="Type or speak book, chapter, verse (e.g. John 3 16, Psalm 23, Romans 8:28)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-24 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500 shadow-inner"
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
                      : 'bg-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-700'
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
                        <span className="font-bold text-slate-100 text-[11px] flex items-center gap-1">
                          <Settings className="w-3 h-3 text-amber-400" />
                          <span>Voice Shortcut</span>
                        </span>
                        <button onClick={() => setShowShortcutSettings(false)} className="text-slate-400 hover:text-slate-100">
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
                            {shortcutMode === s.id && <Check className="w-3 h-3 text-slate-100" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Version Translator Selector & Upload Button */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedVersion}
                onChange={(e) => handleVersionChange(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs font-bold text-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                title="Switch translation version"
              >
                <optgroup label="Standard Free Translations">
                  <option value="NIV">NIV (New International Version)</option>
                  <option value="KJV">KJV (King James Version - Public Domain)</option>
                  <option value="ESV">ESV (English Standard Version)</option>
                  <option value="NKJV">NKJV (New King James Version)</option>
                  <option value="NLT">NLT (New Living Translation)</option>
                  <option value="CSB">CSB (Christian Standard Bible)</option>
                  <option value="NASB">NASB (New American Standard)</option>
                  <option value="WEB">WEB (World English Bible - Free)</option>
                  <option value="BBE">BBE (Bible in Basic English - Free)</option>
                  <option value="AMP">AMP (Amplified Bible)</option>
                  <option value="MSG">MSG (The Message Bible)</option>
                </optgroup>

                {customVersions.length > 0 && (
                  <optgroup label="Custom Uploaded Versions">
                    {customVersions.map(cv => (
                      <option key={cv.id} value={cv.id}>
                        ⚡ {cv.id} - {cv.name} ({Object.keys(cv.verses).length} verses)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                title="Upload custom Bible translation file (.json, .txt, .csv)"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">+ Upload Bible</span>
              </button>

              {/* If current selected version is custom, show delete option */}
              {customVersions.some(cv => cv.id === selectedVersion) && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteCustomVersion(selectedVersion, e)}
                  className="p-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 rounded-xl transition-all cursor-pointer"
                  title={`Delete custom version ${selectedVersion}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

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
                <span className="font-bold text-slate-100">Listening...</span>
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
          {smartResult?.searchType === 'content' && smartResult.contentMatches && smartResult.contentMatches.length > 0 ? (
            <div className="space-y-3">
              {/* Search Header Banner */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Verse Matches for "{smartResult.query}"</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-semibold">
                      {selectedVersion}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Found {smartResult.contentMatches.length} matching scripture verse{smartResult.contentMatches.length === 1 ? '' : 's'}. Click "View Chapter" to load full passage.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-lg shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Smart Phrase Search</span>
                </div>
              </div>

              {/* Matched Verses Cards List */}
              <div className="space-y-2.5">
                {smartResult.contentMatches.map((m, idx) => (
                  <div
                    key={`match-${m.reference}-${idx}`}
                    className="p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/90 hover:bg-slate-800/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold shrink-0 bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {m.reference}
                      </span>

                      <p className="text-xs md:text-sm font-serif leading-relaxed italic text-slate-200">
                        "{highlightSearchQuery(m.text, smartResult.query)}"
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <button
                        onClick={() => handleOpenChapterFromMatch(m)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="View full chapter context"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Chapter</span>
                      </button>

                      <button
                        onClick={() => handleAddMatchedVerseToSchedule(m.reference, m.text)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Add this verse to service schedule"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-400" />
                        <span>+ Schedule</span>
                      </button>

                      <button
                        onClick={() => handlePushMatchedVerseLive(m.reference, m.text)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg flex items-center gap-1 shadow-md transition-all cursor-pointer"
                        title="Send verse live on stage immediately"
                      >
                        <Tv className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Go Live</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeChapter ? (
            <div className="space-y-3">
              {/* Chapter Header Banner */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                    <span>{activeChapter.book} Chapter {activeChapter.chapter}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any verse to push live, or tick verses to build a multi-verse passage
                  </p>
                  {activeChapter.notice && (
                    <div className="mt-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded-lg px-2 py-1 inline-flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{activeChapter.notice}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Target: Verse {activeChapter.targetVerse}</span>
                </div>
              </div>

              {/* Multi-Verse Selection Bar & Slide Split Choice */}
              {selectedVerseItems.length > 0 && (
                <div className="sticky top-0 z-20 p-3 bg-slate-900 border border-blue-500/40 rounded-xl shadow-xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40 shrink-0">
                        {selectionReference}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-300">
                        {selectedVerseItems.length} verse{selectedVerseItems.length === 1 ? '' : 's'} selected
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVerses([]);
                        lastToggledVerseRef.current = null;
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-100 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear selection</span>
                    </button>
                  </div>

                  {/* Split choice: only meaningful for 2+ verses */}
                  {canSplitSelection && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        Slide layout:
                      </span>

                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => handleChangeSplitMode('combined')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            verseSplitMode === 'combined'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                          }`}
                          title="Put the whole range on a single slide"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>One combined slide</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChangeSplitMode('per_verse')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            verseSplitMode === 'per_verse'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                          }`}
                          title="Give every verse its own slide"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>One slide per verse</span>
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        → {selectionSlideCount} slide{selectionSlideCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleAddSelectionToSchedule}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Add the selected passage to the service schedule"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                      <span>+ Add Passage to Schedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePushSelectionLive}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg flex items-center gap-1 shadow-md transition-all cursor-pointer"
                      title="Send the first slide of this passage live"
                    >
                      <Tv className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Go Live</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Verse Cards List */}
              <div className="space-y-2.5">
                {activeChapter.chapterVerses.map((v, idx) => {
                  const isTarget = v.verseNumber === activeChapter.targetVerse;
                  const isSelected = selectedVerses.includes(v.verseNumber);

                  return (
                    <div
                      key={`verse-${v.verseNumber}-${idx}`}
                      ref={isTarget ? targetVerseRef : undefined}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-950/30 border-blue-500/80 ring-2 ring-blue-500/30 shadow-lg'
                          : isTarget
                          ? 'bg-amber-950/30 border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Include-in-passage tick (shift-click extends the range) */}
                        <button
                          type="button"
                          onClick={(e) => toggleVerseSelection(v.verseNumber, e.shiftKey)}
                          className={`w-5 h-5 shrink-0 mt-0.5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 border-blue-400 text-white'
                              : 'bg-slate-950 border-slate-700 text-transparent hover:border-blue-500/70'
                          }`}
                          title={isSelected ? 'Remove verse from passage' : 'Add verse to passage (shift-click to extend)'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <span className={`px-2 py-1 rounded-lg text-xs font-extrabold shrink-0 ${
                          isSelected
                            ? 'bg-blue-500 text-slate-950'
                            : isTarget
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
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

      {/* Upload Custom Bible Modal Overlay */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Upload Custom Bible Translation</h3>
                  <p className="text-[11px] text-slate-400">Import custom JSON, TXT, or CSV Bible files</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {uploadStatusMsg && (
                <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  uploadStatusMsg.type === 'success' 
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
                    : 'bg-rose-950/80 border-rose-800 text-rose-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{uploadStatusMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Version Code (e.g. NASB, CSB, AMP)
                  </label>
                  <input
                    type="text"
                    value={uploadCode}
                    onChange={(e) => setUploadCode(e.target.value.toUpperCase())}
                    placeholder="NASB"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Translation Full Name
                  </label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="New American Standard Bible"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* File Dropzone & Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Select File (.json, .txt, .csv)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-xl bg-slate-950 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-300 transition-all cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-xs">Click to browse or drop Bible file</span>
                  <span className="text-[10px] text-slate-500">Supports JSON {`{"John 3:16": "..."}`}, TXT, or CSV</span>
                </button>
              </div>

              {/* Or Direct Paste Area */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Or Paste Bible Text / JSON Content directly
                </label>
                <textarea
                  value={uploadTextContent}
                  onChange={(e) => setUploadTextContent(e.target.value)}
                  placeholder={`Example JSON:\n{\n  "verses": {\n    "John 3:16": "For God so loved the world...",\n    "Psalm 23:1": "The LORD is my shepherd..."\n  }\n}`}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-amber-500 custom-scrollbar"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1 text-[10px] text-slate-400">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  Supported Formats Info
                </span>
                <p>• <strong>JSON:</strong> Key-value map of verse references to text (e.g. <code>{`{"John 3:16": "text"}`}</code>)</p>
                <p>• <strong>TXT / CSV:</strong> Lines starting with <code>John 3:16 Verse text...</code></p>
                <p>• Custom uploaded versions are stored securely in your browser and instantly searchable across all sermon decks!</p>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={processAndSaveCustomVersion}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md"
              >
                Save & Select Translation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
