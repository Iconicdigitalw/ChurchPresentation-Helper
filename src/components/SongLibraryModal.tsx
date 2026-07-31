import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Search, 
  X, 
  Plus, 
  Sparkles, 
  Loader2, 
  Globe, 
  Bookmark, 
  Trash2, 
  Check, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PRESET_SONGS } from '../data/mockData';
import { ScheduleItem, SongItem, Slide } from '../types';
import { 
  getSavedCustomSongs, 
  saveCustomSongToCatalog, 
  deleteCustomSongFromCatalog, 
  SavedCustomSong 
} from '../data/settingsAndTemplates';

interface SongLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSongItem: (item: ScheduleItem) => void;
  onPushSlideToLive?: (slide: Slide) => void;
  initialQuery?: string;
}

interface OnlineSongResult {
  id: string;
  title: string;
  artist: string;
  key?: string;
  ccli?: string;
  isOnlineResult: boolean;
  sections: Array<{
    label: string;
    slides: Array<{ lines: string[] }>;
  }>;
}

export const SongLibraryModal: React.FC<SongLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddSongItem,
  onPushSlideToLive,
  initialQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [songKey, setSongKey] = useState('G');
  const [ccli, setCcli] = useState('');
  const [rawLyrics, setRawLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom Saved Songs & Online Search state
  const [customCatalog, setCustomCatalog] = useState<SavedCustomSong[]>([]);
  const [onlineResults, setOnlineResults] = useState<OnlineSongResult[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load custom saved songs on mount/open
  useEffect(() => {
    if (isOpen) {
      setCustomCatalog(getSavedCustomSongs());
      setSearchQuery(initialQuery);
      if (initialQuery.trim()) {
        triggerLiveOnlineSearch(initialQuery);
      }
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(initialQuery.length, initialQuery.length);
        }
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Combined Local & Custom Songs filter
  const localPresetMatches = PRESET_SONGS.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const customSavedMatches = customCatalog.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (val.trim().length >= 3) {
      searchDebounceRef.current = setTimeout(() => {
        triggerLiveOnlineSearch(val);
      }, 600);
    } else {
      setOnlineResults([]);
    }
  };

  const triggerLiveOnlineSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearchingOnline(true);
    try {
      const res = await fetch('/api/gemini/song-search-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      if (!res.ok) throw new Error('Failed to search online songs');
      const data = await res.json();
      setOnlineResults(data.results || []);
    } catch (e) {
      console.error('Error fetching online lyrics:', e);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const convertOnlineResultToSlides = (onlineSong: OnlineSongResult): Slide[] => {
    const generatedSlides: Slide[] = [];
    (onlineSong.sections || []).forEach((sec) => {
      (sec.slides || []).forEach((s) => {
        generatedSlides.push({
          id: `song-slide-${Date.now()}-${generatedSlides.length}`,
          type: 'song',
          header: sec.label || 'Verse',
          body: (s.lines || []).join('\n'),
          themeStyle: 'purple-majesty',
          reference: `${onlineSong.title} • ${onlineSong.artist || 'Worship'}`
        });
      });
    });
    return generatedSlides;
  };

  const handleAddPresetSong = (song: SongItem | SavedCustomSong) => {
    const item: ScheduleItem = {
      id: `song-${Date.now()}`,
      title: `Worship: ${song.title}`,
      subtitle: song.artist || 'Worship Song',
      type: 'song',
      key: song.key,
      ccli: song.ccli,
      activeSlideIndex: 0,
      slides: song.slides
    };
    onAddSongItem(item);
    onClose();
  };

  const handleAddOnlineSongToSchedule = (onlineSong: OnlineSongResult) => {
    const slides = convertOnlineResultToSlides(onlineSong);
    const item: ScheduleItem = {
      id: `song-${Date.now()}`,
      title: `Worship: ${onlineSong.title}`,
      subtitle: onlineSong.artist || 'Online Worship Song',
      type: 'song',
      key: onlineSong.key || 'G',
      ccli: onlineSong.ccli,
      activeSlideIndex: 0,
      slides: slides.length > 0 ? slides : [
        {
          id: `s-online-fallback-${Date.now()}`,
          type: 'song',
          header: onlineSong.title,
          body: 'Online lyrics imported directly.',
          themeStyle: 'purple-majesty'
        }
      ]
    };
    onAddSongItem(item);
    onClose();
  };

  const handleSaveOnlineSongToCatalog = (onlineSong: OnlineSongResult) => {
    const slides = convertOnlineResultToSlides(onlineSong);
    const saved = saveCustomSongToCatalog({
      id: `saved-online-${Date.now()}`,
      title: onlineSong.title,
      artist: onlineSong.artist,
      key: onlineSong.key || 'G',
      ccli: onlineSong.ccli,
      slides
    });
    setCustomCatalog(getSavedCustomSongs());
    setSavedSuccessId(onlineSong.id);
    setTimeout(() => setSavedSuccessId(null), 2500);
  };

  const handleDeleteCustomSong = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomSongFromCatalog(id);
    setCustomCatalog(getSavedCustomSongs());
  };

  const handleFormatLyricsWithAI = async () => {
    if (!rawLyrics.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/song-formatter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLyrics,
          title: songTitle || 'Worship Song',
          artist
        })
      });

      if (!res.ok) throw new Error('Failed to format song lyrics.');
      const data = await res.json();

      const generatedSlides: Slide[] = [];
      (data.sections || []).forEach((sec: any) => {
        (sec.slides || []).forEach((s: any) => {
          generatedSlides.push({
            id: `song-slide-${Date.now()}-${generatedSlides.length}`,
            type: 'song',
            header: sec.label || 'Verse',
            body: (s.lines || []).join('\n'),
            themeStyle: 'purple-majesty',
            reference: `${data.title || 'Worship'} • ${artist || 'Song'}`
          });
        });
      });

      const slidesToUse: Slide[] = generatedSlides.length > 0 ? generatedSlides : [
        {
          id: `fallback-song-${Date.now()}`,
          type: 'song',
          header: songTitle || 'Song Lyrics',
          body: rawLyrics,
          themeStyle: 'purple-majesty'
        }
      ];

      // Save to catalog automatically for future reuse
      saveCustomSongToCatalog({
        id: `custom-song-${Date.now()}`,
        title: songTitle || data.title || 'Custom Song',
        artist: artist || 'Custom Song',
        key: songKey,
        ccli: ccli || data.ccliNumber,
        slides: slidesToUse
      });

      const newItem: ScheduleItem = {
        id: `custom-song-item-${Date.now()}`,
        title: `Worship: ${songTitle || data.title || 'Custom Song'}`,
        subtitle: artist || 'Custom Song',
        type: 'song',
        key: songKey,
        ccli: ccli || data.ccliNumber,
        activeSlideIndex: 0,
        slides: slidesToUse
      };

      onAddSongItem(newItem);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error formatting song. Inserting raw lyrics slide.');
      const fallbackSlides: Slide[] = [
        {
          id: `s-${Date.now()}`,
          type: 'song',
          header: songTitle || 'Song Lyrics',
          body: rawLyrics,
          themeStyle: 'purple-majesty'
        }
      ];
      const fallbackItem: ScheduleItem = {
        id: `song-fallback-${Date.now()}`,
        title: songTitle || 'Worship Song',
        subtitle: artist,
        type: 'song',
        activeSlideIndex: 0,
        slides: fallbackSlides
      };
      onAddSongItem(fallbackItem);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Worship Songs Catalog & Live Web Search</h2>
              <p className="text-xs text-slate-400">Search saved library & pull live lyrics from free online lyrics databases simultaneously</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-semibold">
          <button
            onClick={() => setIsCreatingNew(false)}
            className={`px-4 py-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              !isCreatingNew
                ? 'border-purple-500 text-purple-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>Song Library & Free Web Search</span>
          </button>
          <button
            onClick={() => setIsCreatingNew(true)}
            className={`px-4 py-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              isCreatingNew
                ? 'border-purple-500 text-purple-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Custom Song (AI Auto-Format)</span>
          </button>
        </div>

        {/* Catalog Search vs Custom Form */}
        {!isCreatingNew ? (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Type song title or artist (e.g. 'Way Maker', 'Goodness of God', 'Gratitude')..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 shadow-inner font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => triggerLiveOnlineSearch(searchQuery || 'Goodness of God')}
                disabled={isSearchingOnline}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-md transition-all cursor-pointer"
              >
                {isSearchingOnline ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>Search Online Web</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
              {/* 1. Custom Saved Catalog Songs */}
              {customSavedMatches.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Saved Custom Song Library ({customSavedMatches.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {customSavedMatches.map((song) => (
                      <div
                        key={song.id}
                        className="p-3 bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 rounded-xl flex items-center justify-between gap-3 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{song.title}</h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              SAVED
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {song.artist} • {song.slides.length} slides
                            {song.key ? ` • Key: ${song.key}` : ''}
                            {song.ccli ? ` • CCLI #${song.ccli}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleDeleteCustomSong(song.id, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Delete song from saved library"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAddPresetSong(song)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg flex items-center gap-1 shadow-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Schedule</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Standard Preset Song Library */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  <span>Preset Worship Songs ({localPresetMatches.length})</span>
                </h3>
                <div className="space-y-2">
                  {localPresetMatches.map((song) => (
                    <div
                      key={song.id}
                      className="p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-all"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">{song.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {song.artist} • {song.slides.length} slides
                          {song.key ? ` • Key: ${song.key}` : ''}
                          {song.ccli ? ` • CCLI #${song.ccli}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddPresetSong(song)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-md shadow-purple-950/40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Schedule</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Live Online Free Web Lyrics Search Results */}
              <div>
                <div className="flex items-center justify-between mb-2 border-t border-slate-800/80 pt-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Online Web Lyrics Search</span>
                    {isSearchingOnline && <Loader2 className="w-3 h-3 animate-spin text-emerald-400 ml-1" />}
                  </h3>
                  <span className="text-[10px] text-slate-500">Auto-pulls lyrics & converts for future reuse</span>
                </div>

                {isSearchingOnline ? (
                  <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">Searching free web lyrics online for "{searchQuery}"...</p>
                    <p className="text-[10px] text-slate-500">Pulling song sections, key, and formatting slides</p>
                  </div>
                ) : onlineResults.length > 0 ? (
                  <div className="space-y-3">
                    {onlineResults.map((onlineSong) => (
                      <div
                        key={onlineSong.id}
                        className="p-3.5 bg-slate-950 border border-emerald-500/40 hover:border-emerald-500/80 rounded-xl space-y-2.5 transition-all shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{onlineSong.title}</h4>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ⚡ ONLINE WEB RESULT
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {onlineSong.artist} • Key: {onlineSong.key || 'G'}
                              {onlineSong.ccli ? ` • CCLI #${onlineSong.ccli}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSaveOnlineSongToCatalog(onlineSong)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 font-bold text-xs rounded-lg flex items-center gap-1 transition-all"
                              title="Save song to permanent library for future reuse"
                            >
                              {savedSuccessId === onlineSong.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Saved!</span>
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-3.5 h-3.5" />
                                  <span>Save to Library</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAddOnlineSongToSchedule(onlineSong)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 shadow-md shadow-emerald-950/40 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Schedule</span>
                            </button>
                          </div>
                        </div>

                        {/* Lyrics Sample Preview */}
                        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 space-y-1 font-sans">
                          {onlineSong.sections.slice(0, 3).map((sec, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-bold text-amber-400 uppercase text-[10px] w-16 shrink-0">{sec.label}:</span>
                              <span className="text-slate-300 line-clamp-1 italic">
                                {sec.slides[0]?.lines?.join(' / ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl text-center text-slate-500 text-xs">
                    Type a song title above or click "Search Online Web" to search free online lyrics.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Custom Song AI Form */
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-400">Song Title</label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g. Holy Forever"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400">Artist/Author</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Chris Tomlin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400">Key / CCLI (Optional)</label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    value={songKey}
                    onChange={(e) => setSongKey(e.target.value)}
                    placeholder="Key (e.g. G)"
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    value={ccli}
                    onChange={(e) => setCcli(e.target.value)}
                    placeholder="CCLI #"
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 flex items-center justify-between mb-1">
                <span>Raw Lyrics (Paste from website or notes)</span>
                <span className="text-purple-400">✨ AI will split into Verse 1, Chorus, Bridge slides</span>
              </label>
              <textarea
                rows={9}
                value={rawLyrics}
                onChange={(e) => setRawLyrics(e.target.value)}
                placeholder="Paste lyrics here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed custom-scrollbar"
              />
            </div>

            <button
              onClick={handleFormatLyricsWithAI}
              disabled={isLoading || !rawLyrics.trim()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-950/50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Formatting Lyrics & Saving Song...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Format Lyrics & Save Song to Catalog</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
