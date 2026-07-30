import React from 'react';
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
  ListOrdered
} from 'lucide-react';

interface SchedulePanelProps {
  schedule: ScheduleItem[];
  selectedScheduleId: string | null;
  onSelectScheduleItem: (id: string) => void;
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
  onDeleteItem: (id: string) => void;
  openSermonConverter: () => void;
  openBibleLibrary: () => void;
  openSongLibrary: () => void;
  onAddCustomItem: () => void;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  schedule,
  selectedScheduleId,
  onSelectScheduleItem,
  onMoveItem,
  onDeleteItem,
  openSermonConverter,
  openBibleLibrary,
  openSongLibrary,
  onAddCustomItem
}) => {
  const getItemIcon = (type: ScheduleItemType) => {
    switch (type) {
      case 'song':
        return <Music className="w-4 h-4 text-indigo-600" />;
      case 'sermon':
        return <Presentation className="w-4 h-4 text-indigo-600" />;
      case 'scripture':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'announcement':
        return <Bell className="w-4 h-4 text-slate-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none text-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-500">
          <ListOrdered className="w-4 h-4 text-indigo-600" />
          <span>Service Schedule</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            {schedule.length}
          </span>
        </div>
      </div>

      {/* Schedule Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/50">
        {schedule.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Schedule is empty. Add songs, scriptures, or sermon decks below.
          </div>
        ) : (
          schedule.map((item, idx) => {
            const isSelected = item.id === selectedScheduleId;
            return (
              <div
                key={item.id}
                onClick={() => onSelectScheduleItem(item.id)}
                className={`group relative flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-950 shadow-2xs font-medium'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5 p-1.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
                    {getItemIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">
                        {idx + 1}.
                      </span>
                      <h4 className="text-xs font-semibold truncate leading-tight text-slate-800">
                        {item.title}
                      </h4>
                    </div>

                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{item.slides.length} slides</span>
                      {item.key && <span>• Key: {item.key}</span>}
                      {item.ccli && <span>• CCLI #{item.ccli}</span>}
                    </div>
                  </div>
                </div>

                {/* Right Reorder/Actions */}
                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveItem(idx, 'up');
                    }}
                    disabled={idx === 0}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveItem(idx, 'down');
                    }}
                    disabled={idx === schedule.length - 1}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
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

      {/* Add Items Toolbar / AI Presentation Drafter */}
      <div className="p-4 border-t border-slate-200 bg-indigo-50/50 space-y-3">
        <div>
          <h3 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest mb-1">
            AI Presentation Drafter
          </h3>
          <p className="text-[10px] text-indigo-600">
            Upload sermon notes or doc to auto-create presentation decks.
          </p>
        </div>

        <button
          onClick={openSermonConverter}
          className="w-full py-2.5 px-3 bg-white border border-indigo-200 rounded-lg text-indigo-700 text-xs font-bold shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>UPLOAD SERMON NOTES</span>
        </button>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={openSongLibrary}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 transition-colors"
          >
            <Music className="w-3 h-3 text-indigo-600" />
            <span>+ Song</span>
          </button>
          <button
            onClick={openBibleLibrary}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Verse</span>
          </button>
          <button
            onClick={onAddCustomItem}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 transition-colors"
          >
            <Plus className="w-3 h-3 text-slate-500" />
            <span>+ Custom</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
