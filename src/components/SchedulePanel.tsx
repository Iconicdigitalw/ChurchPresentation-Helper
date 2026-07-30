import React, { useState } from 'react';
import { 
  ScheduleItem, 
  ScheduleItemType 
} from '../types';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Music, 
  BookOpen, 
  Presentation, 
  Bell, 
  Video, 
  FileText, 
  Sparkles,
  ListOrdered,
  Image as ImageIcon,
  Layers
} from 'lucide-react';

interface SchedulePanelProps {
  schedule: ScheduleItem[];
  selectedScheduleId: string | null;
  onSelectScheduleItem: (id: string) => void;
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
  onDeleteItem: (id: string) => void;
  openSermonConverter: () => void;
  openPresentationBuilder: () => void;
  openBibleLibrary: () => void;
  openSongLibrary: () => void;
  openMediaGenerator: () => void;
  onAddCustomItem: () => void;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  schedule,
  selectedScheduleId,
  onSelectScheduleItem,
  onMoveItem,
  onDeleteItem,
  openSermonConverter,
  openPresentationBuilder,
  openBibleLibrary,
  openSongLibrary,
  openMediaGenerator,
  onAddCustomItem
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const getItemIcon = (type: ScheduleItemType) => {
    switch (type) {
      case 'song':
        return <Music className="w-3.5 h-3.5 text-purple-400" />;
      case 'sermon':
        return <Presentation className="w-3.5 h-3.5 text-amber-400" />;
      case 'scripture':
        return <BookOpen className="w-3.5 h-3.5 text-blue-400" />;
      case 'announcement':
        return <Bell className="w-3.5 h-3.5 text-emerald-400" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredSchedule = schedule.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'visuals') return item.type === 'video' || item.slides.some(s => s.type === 'video' || s.bgImageUrl);
    if (filterType === 'decks') return item.type === 'sermon' || item.type === 'custom' || item.slides.length > 1;
    return item.type === filterType;
  });

  return (
    <aside className="w-full lg:w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 select-none text-slate-100 relative z-10">
      {/* Header & Filter */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-slate-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-300">
            <ListOrdered className="w-4 h-4 text-indigo-400" />
            <span>Service Schedule</span>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {schedule.length}
            </span>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-semibold text-slate-400 custom-scrollbar pb-0.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('song')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterType === 'song'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Songs
          </button>
          <button
            onClick={() => setFilterType('decks')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterType === 'decks'
                ? 'bg-amber-600 text-slate-950 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Decks
          </button>
          <button
            onClick={() => setFilterType('scripture')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterType === 'scripture'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Bible
          </button>
          <button
            onClick={() => setFilterType('visuals')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterType === 'visuals'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Visuals
          </button>
        </div>
      </div>

      {/* Schedule Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar bg-slate-950/40">
        {filteredSchedule.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-slate-500 space-y-2">
            <Sparkles className="w-6 h-6 mx-auto text-slate-600" />
            <p>Schedule list is empty.</p>
            <p className="text-[11px] text-slate-600">Use quick buttons below to add items.</p>
          </div>
        ) : (
          filteredSchedule.map((item, idx) => {
            const isSelected = item.id === selectedScheduleId;
            const originalIndex = schedule.findIndex(s => s.id === item.id);

            return (
              <div
                key={item.id}
                onClick={() => onSelectScheduleItem(item.id)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/90 text-slate-300'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                    {getItemIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-slate-500">
                        #{originalIndex + 1}
                      </span>
                      <h4 className="text-xs font-bold truncate leading-tight text-slate-100">
                        {item.title}
                      </h4>
                    </div>

                    {item.subtitle && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-indigo-300 font-semibold">
                        {item.slides.length} {item.slides.length === 1 ? 'slide' : 'slides'}
                      </span>
                      {item.key && <span className="text-purple-300">Key: {item.key}</span>}
                    </div>
                  </div>
                </div>

                {/* Right Reorder/Actions */}
                <div className="flex items-center gap-0.5 opacity-75 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveItem(originalIndex, 'up');
                    }}
                    disabled={originalIndex === 0}
                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white disabled:opacity-20"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveItem(originalIndex, 'down');
                    }}
                    disabled={originalIndex === schedule.length - 1}
                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white disabled:opacity-20"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="p-1 hover:bg-rose-950/80 rounded-md text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove from schedule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Bottom Toolbar */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950 grid grid-cols-2 gap-1.5 text-xs">
        <button
          onClick={openPresentationBuilder}
          className="py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
        >
          <Presentation className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Slideshow Deck</span>
        </button>

        <button
          onClick={openSermonConverter}
          className="py-1.5 px-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>+ AI Sermon Deck</span>
        </button>

        <button
          onClick={openSongLibrary}
          className="py-1.5 px-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
        >
          <Music className="w-3.5 h-3.5 text-indigo-400" />
          <span>+ Worship Song</span>
        </button>

        <button
          onClick={openBibleLibrary}
          className="py-1.5 px-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>+ Bible Scripture</span>
        </button>

        <button
          onClick={openMediaGenerator}
          className="py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>+ Visual Video/Img</span>
        </button>

        <button
          onClick={onAddCustomItem}
          className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>+ Custom Item</span>
        </button>
      </div>
    </aside>
  );
};


