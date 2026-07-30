import React, { useState } from 'react';
import { 
  Music, 
  Search, 
  X, 
  Plus, 
  Sparkles, 
  Loader2, 
  Check,
  FileText
} from 'lucide-react';
import { PRESET_SONGS } from '../data/mockData';
import { ScheduleItem, SongItem, Slide } from '../types';

interface SongLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSongItem: (item: ScheduleItem) => void;
}

export const SongLibraryModal: React.FC<SongLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddSongItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [songKey, setSongKey] = useState('G');
  const [ccli, setCcli] = useState('');
  const [rawLyrics, setRawLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const filteredSongs = PRESET_SONGS.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddPresetSong = (song: SongItem) => {
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
        (sec.slides || []).forEach((s: any, idx: number) => {
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

      const newItem: ScheduleItem = {
        id: `custom-song-${Date.now()}`,
        title: `Worship: ${songTitle || data.title || 'Custom Song'}`,
        subtitle: artist || 'Custom Song',
        type: 'song',
        key: songKey,
        ccli: ccli || data.ccliNumber,
        activeSlideIndex: 0,
        slides: generatedSlides.length > 0 ? generatedSlides : [
          {
            id: `fallback-song-${Date.now()}`,
            type: 'song',
            header: 'Lyrics',
            body: rawLyrics,
            themeStyle: 'purple-majesty'
          }
        ]
      };

      onAddSongItem(newItem);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error formatting song. Inserting raw lyrics slide.');
      const fallbackItem: ScheduleItem = {
        id: `song-fallback-${Date.now()}`,
        title: songTitle || 'Worship Song',
        subtitle: artist,
        type: 'song',
        activeSlideIndex: 0,
        slides: [
          {
            id: `s-${Date.now()}`,
            type: 'song',
            header: songTitle || 'Song Lyrics',
            body: rawLyrics,
            themeStyle: 'purple-majesty'
          }
        ]
      };
      onAddSongItem(fallbackItem);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Worship Songs Catalog</h2>
              <p className="text-xs text-slate-400">Search songs or add custom song lyrics formatted with AI</p>
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
            className={`px-4 py-2.5 transition-colors border-b-2 ${
              !isCreatingNew
                ? 'border-purple-500 text-purple-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Song Library Catalog
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
            <span>Add New Song (AI Auto-Format)</span>
          </button>
        </div>

        {/* Catalog Search vs Custom Form */}
        {!isCreatingNew ? (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs by title or artist..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-all"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{song.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {song.artist} • {song.slides.length} slide parts
                      {song.key ? ` • Key: ${song.key}` : ''}
                      {song.ccli ? ` • CCLI #${song.ccli}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddPresetSong(song)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-md shadow-purple-950/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Schedule</span>
                  </button>
                </div>
              ))}
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
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-950/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Formatting Lyrics with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Format Lyrics & Add Song to Schedule</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
