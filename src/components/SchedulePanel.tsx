import React, { useState } from 'react';
import { 
  ScheduleItem, 
  ScheduleItemType,
  Slide
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
  Layers,
  GripVertical,
  Settings
} from 'lucide-react';

interface SchedulePanelProps {
  schedule: ScheduleItem[];
  selectedScheduleId: string | null;
  liveSlideId?: string | null;
  isLiveOutputOn?: boolean;
  onSelectScheduleItem: (id: string) => void;
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
  onReorderItems?: (fromIndex: number, toIndex: number) => void;
  onDeleteItem: (id: string) => void;
  onOpenSettingsModal?: (item: ScheduleItem) => void;
  openSermonConverter: () => void;
  openPresentationBuilder: () => void;
  openBibleLibrary: () => void;
  openSongLibrary: () => void;
  openMediaGenerator: () => void;
  onAddCustomItem: () => void;
  onPushSlideToLive?: (slide: Slide) => void;
  customWidth?: number;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  schedule,
  selectedScheduleId,
  liveSlideId,
  isLiveOutputOn = true,
  onSelectScheduleItem,
  onMoveItem,
  onReorderItems,
  onDeleteItem,
  onOpenSettingsModal,
  openSermonConverter,
  openPresentationBuilder,
  openBibleLibrary,
  openSongLibrary,
  openMediaGenerator,
  onAddCustomItem,
  onPushSlideToLive,
  customWidth
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

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
    if (filterType === 'song') return item.type === 'song';
    if (filterType === 'scripture') return item.type === 'scripture';
    if (filterType === 'visuals') return item.type === 'video' || item.slides.some(s => s.type === 'video');
    if (filterType === 'decks') return item.type === 'sermon' || item.type === 'announcement' || item.type === 'custom';
    return item.type === filterType;
  });

  const liveItem = isLiveOutputOn && liveSlideId ? schedule.find(item => item.slides.some(s => s.id === liveSlideId)) : null;

  const isCategoryLive = (cat: string) => {
    if (!liveItem) return false;
    if (cat === 'all') return false;
    if (cat === 'song') return liveItem.type === 'song';
    if (cat === 'scripture') return liveItem.type === 'scripture';
    if (cat === 'visuals') return liveItem.type === 'video' || liveItem.slides.some(s => s.type === 'video');
    if (cat === 'decks') return liveItem.type === 'sermon' || liveItem.type === 'announcement' || liveItem.type === 'custom';
    return false;
  };

  const renderLiveDot = () => (
    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-20 pointer-events-none">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-90" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-slate-950 shadow-sm shadow-rose-500/80" />
    </span>
  );

  return (
    <aside 
      style={customWidth ? { width: `${customWidth}px` } : undefined}
      className={`w-full ${customWidth ? '' : 'lg:w-72'} bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 select-none text-slate-100 relative z-10`}
    >
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
            <span>All</span>
          </button>
          <button
            onClick={() => setFilterType('song')}
            className={`relative px-2 py-1 rounded-md transition-colors ${
              filterType === 'song'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            <span>Songs</span>
            {isCategoryLive('song') && renderLiveDot()}
          </button>
          <button
            onClick={() => setFilterType('decks')}
            className={`relative px-2 py-1 rounded-md transition-colors ${
              filterType === 'decks'
                ? 'bg-amber-600 text-slate-950 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            <span>Decks</span>
            {isCategoryLive('decks') && renderLiveDot()}
          </button>
          <button
            onClick={() => setFilterType('scripture')}
            className={`relative px-2 py-1 rounded-md transition-colors ${
              filterType === 'scripture'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            <span>Bible</span>
            {isCategoryLive('scripture') && renderLiveDot()}
          </button>
          <button
            onClick={() => setFilterType('visuals')}
            className={`relative px-2 py-1 rounded-md transition-colors ${
              filterType === 'visuals'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
          >
            <span>Visuals</span>
            {isCategoryLive('visuals') && renderLiveDot()}
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
            const isBeingDragged = draggedIdx === originalIndex;
            const isBeingDraggedOver = dragOverIdx === originalIndex;
            const hasLiveSlide = Boolean(liveSlideId && isLiveOutputOn && item.slides.some(s => s.id === liveSlideId));

            return (
              <div
                key={item.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(originalIndex));
                  setDraggedIdx(originalIndex);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverIdx !== originalIndex) {
                    setDragOverIdx(originalIndex);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverIdx === originalIndex) {
                    setDragOverIdx(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIdxStr = e.dataTransfer.getData('text/plain');
                  const fromIdx = parseInt(fromIdxStr, 10);
                  if (!isNaN(fromIdx) && fromIdx !== originalIndex) {
                    if (onReorderItems) {
                      onReorderItems(fromIdx, originalIndex);
                    } else {
                      const diff = originalIndex - fromIdx;
                      const dir = diff > 0 ? 'down' : 'up';
                      for (let i = 0; i < Math.abs(diff); i++) {
                        onMoveItem(fromIdx, dir);
                      }
                    }
                  }
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                onClick={() => onSelectScheduleItem(item.id)}
                onDoubleClick={() => {
                  if (onPushSlideToLive && item.slides.length > 0) {
                    onPushSlideToLive(item.slides[0]);
                  }
                }}
                title="Single-click to select. Double-click to project item live."
                className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer select-none gap-2 ${
                  isBeingDragged
                    ? 'opacity-30 border-dashed border-indigo-500 bg-indigo-950/20'
                    : isBeingDraggedOver
                    ? 'border-indigo-400 bg-indigo-950/80 ring-2 ring-indigo-500 shadow-xl'
                    : hasLiveSlide
                    ? 'border-l-4 border-l-rose-500 bg-rose-950/20 border-rose-900/60 text-slate-100 shadow-md shadow-rose-950/30'
                    : isSelected
                    ? 'border-l-4 border-l-amber-500 bg-slate-800/90 border-slate-700 text-slate-100 shadow-md'
                    : 'border-l-4 border-l-transparent bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                {/* Left Grip + Type Icon + Title & Slide Count */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div 
                    className="text-slate-600 group-hover:text-amber-400 cursor-grab active:cursor-grabbing shrink-0"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  <div className="p-1 rounded bg-slate-950 border border-slate-800/80 shrink-0">
                    {getItemIcon(item.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        #{originalIndex + 1}
                      </span>
                      <h4 className="text-xs font-semibold truncate leading-tight text-slate-100">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 leading-none mt-0.5">
                      <span>{item.slides.length} {item.slides.length === 1 ? 'slide' : 'slides'}</span>
                      {item.key && <span className="text-purple-300 font-semibold">• Key: {item.key}</span>}
                      {item.subtitle && <span className="truncate text-slate-500 max-w-[120px]">• {item.subtitle}</span>}
                    </div>
                  </div>
                </div>

                {/* Right Status Badge & Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {hasLiveSlide && (
                    <span className="flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-600 text-white tracking-widest uppercase shadow animate-pulse border border-rose-400/50">
                      LIVE
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSettingsModal?.(item);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Item Settings & Slide Manager"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove item"
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


