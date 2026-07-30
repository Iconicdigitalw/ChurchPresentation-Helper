import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  X, 
  Tv, 
  Plus, 
  Loader2, 
  Check, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { DEFAULT_BIBLE_VERSES } from '../data/mockData';
import { BibleVerse, ScheduleItem, Slide } from '../types';

interface BibleLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddScriptureItem: (item: ScheduleItem) => void;
  onPushSlideToLive: (slide: Slide) => void;
}

export const BibleLibraryModal: React.FC<BibleLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddScriptureItem,
  onPushSlideToLive
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('NIV');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BibleVerse[]>(DEFAULT_BIBLE_VERSES);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(DEFAULT_BIBLE_VERSES);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/bible-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, version: selectedVersion })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          const fetchedVerse: BibleVerse = {
            book: data.book || 'Bible',
            chapter: data.chapter || 1,
            verse: 1,
            reference: data.reference || searchQuery,
            translation: selectedVersion,
            text: data.text
          };
          setSearchResults([fetchedVerse, ...DEFAULT_BIBLE_VERSES]);
        }
      }
    } catch (err) {
      console.error('Bible search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToSchedule = (verse: BibleVerse) => {
    const newItem: ScheduleItem = {
      id: `scripture-${Date.now()}`,
      title: `Scripture: ${verse.reference}`,
      subtitle: `${verse.translation} Translation`,
      type: 'scripture',
      activeSlideIndex: 0,
      slides: [
        {
          id: `scrip-s-${Date.now()}`,
          type: 'scripture',
          header: verse.reference,
          body: verse.text,
          reference: `${verse.reference} (${verse.translation})`,
          themeStyle: 'nature-serene'
        }
      ]
    };

    onAddScriptureItem(newItem);
    onClose();
  };

  const handleGoLiveNow = (verse: BibleVerse) => {
    const slide: Slide = {
      id: `live-scrip-${Date.now()}`,
      type: 'scripture',
      header: verse.reference,
      body: verse.text,
      reference: `${verse.reference} (${verse.translation})`,
      themeStyle: 'nature-serene'
    };

    onPushSlideToLive(slide);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bible Scripture Lookup</h2>
              <p className="text-xs text-slate-400">Search passages or verses across multiple translations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. John 3:16, Psalm 23, Romans 8:28, or keyword 'peace'..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="NIV">NIV (New Int. Version)</option>
            <option value="KJV">KJV (King James)</option>
            <option value="ESV">ESV (English Standard)</option>
            <option value="NKJV">NKJV (New King James)</option>
            <option value="WEB">WEB (World English)</option>
          </select>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {searchResults.map((verse, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl space-y-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-300">{verse.reference}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-semibold">
                    {verse.translation}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-serif italic">
                "{verse.text}"
              </p>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => handleAddToSchedule(verse)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Schedule</span>
                </button>
                <button
                  onClick={() => handleGoLiveNow(verse)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg flex items-center gap-1 shadow-md shadow-amber-950/40"
                >
                  <Tv className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Go Live Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
