import React, { useState } from 'react';
import { Slide, ScheduleItem, ThemeStyle } from '../types';
import { THEME_PRESETS } from '../data/mockData';
import { 
  Play, 
  Edit3, 
  Trash2, 
  Plus, 
  Copy, 
  Palette, 
  FileText, 
  Sparkles,
  ChevronRight,
  BookOpen,
  Music,
  Maximize2,
  Check,
  X
} from 'lucide-react';

interface SlideGridPanelProps {
  currentItem: ScheduleItem | null;
  activeSlideIndex: number;
  onSelectSlide: (index: number, goLive: boolean) => void;
  onUpdateSlide: (slideId: string, updatedSlide: Partial<Slide>) => void;
  onAddSlide: (itemIndex: number) => void;
  onDeleteSlide: (slideId: string) => void;
  onDuplicateSlide: (slide: Slide) => void;
  liveSlideId: string | null;
  openMediaGenerator: () => void;
}

export const SlideGridPanel: React.FC<SlideGridPanelProps> = ({
  currentItem,
  activeSlideIndex,
  onSelectSlide,
  onUpdateSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  liveSlideId,
  openMediaGenerator
}) => {
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editHeader, setEditHeader] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showThemeMenuSlideId, setShowThemeMenuSlideId] = useState<string | null>(null);

  if (!currentItem) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Sparkles className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-base font-bold text-slate-200">No Service Item Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
          Select an item from the Service Schedule on the left or import a new preaching deck to view slides.
        </p>
      </div>
    );
  }

  const handleStartEdit = (slide: Slide) => {
    setEditingSlideId(slide.id);
    setEditHeader(slide.header || '');
    setEditBody(slide.body || '');
    setEditReference(slide.reference || '');
    setEditNotes(slide.speakerNotes || '');
  };

  const handleSaveEdit = (slideId: string) => {
    onUpdateSlide(slideId, {
      header: editHeader,
      body: editBody,
      reference: editReference,
      speakerNotes: editNotes
    });
    setEditingSlideId(null);
  };

  const getThemeClass = (style: ThemeStyle) => {
    const preset = THEME_PRESETS.find(p => p.id === style);
    return preset ? preset.bgClass : 'bg-slate-900';
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden text-slate-100 relative z-20">
      {/* Top Header Bar for Selected Item */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-extrabold text-white tracking-tight">
              {currentItem.title}
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentItem.type}
            </span>
          </div>
          {currentItem.subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{currentItem.subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openMediaGenerator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 shadow-sm"
          >
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Visual Theme</span>
          </button>
          <button
            onClick={() => onAddSlide(0)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-950/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slide</span>
          </button>
        </div>
      </div>

      {/* Slide Thumbnails Grid */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-950/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentItem.slides.map((slide, idx) => {
            const isLive = slide.id === liveSlideId;
            const isSelected = idx === activeSlideIndex;
            const isEditing = slide.id === editingSlideId;

            return (
              <div
                key={slide.id}
                className={`group relative flex flex-col rounded-2xl border transition-all shadow-xl ${
                  showThemeMenuSlideId === slide.id ? 'z-30' : 'z-10'
                } ${
                  isLive
                    ? 'ring-2 ring-rose-500 border-rose-500 shadow-rose-950/50'
                    : isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-950/50'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                }`}
              >
                {/* Thumbnail Preview Area (16:9 Widescreen) */}
                <div
                  onClick={() => onSelectSlide(idx, true)}
                  className={`relative aspect-video w-full p-3.5 flex flex-col justify-between cursor-pointer select-none overflow-hidden rounded-t-2xl ${
                    slide.bgImageUrl ? 'bg-cover bg-center' : getThemeClass(slide.themeStyle)
                  }`}
                  style={
                    slide.bgImageUrl
                      ? { backgroundImage: `url(${slide.bgImageUrl})` }
                      : undefined
                  }
                >
                  {/* Subtle Dark Overlay if background image */}
                  {slide.bgImageUrl && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
                  )}

                  {/* Top Status & Slide Number */}
                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-black/70 text-white border border-white/10">
                      #{idx + 1}
                    </span>

                    {isLive ? (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-600 text-white tracking-wider shadow-md animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        LIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/50 text-slate-300 capitalize border border-white/5">
                        {slide.type}
                      </span>
                    )}
                  </div>

                  {/* Slide Content Preview */}
                  <div className="relative z-10 my-auto text-center px-1">
                    {slide.header && (
                      <h4 className="text-xs font-extrabold tracking-wider text-amber-300 uppercase drop-shadow-md line-clamp-1">
                        {slide.header}
                      </h4>
                    )}
                    <p className="text-[11px] font-semibold text-white leading-snug mt-1 line-clamp-3 drop-shadow">
                      {slide.body}
                    </p>
                    {slide.reference && (
                      <p className="text-[9px] font-bold text-indigo-200 mt-1 italic drop-shadow">
                        {slide.reference}
                      </p>
                    )}
                  </div>

                  {/* Bottom Bar overlay */}
                  <div className="relative z-10 flex items-center justify-between text-[9px] text-white/70 font-semibold">
                    <span className="truncate max-w-[120px]">
                      {slide.speakerNotes ? '📝 Notes' : ''}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold text-amber-300">
                      PUSH LIVE →
                    </span>
                  </div>
                </div>

                {/* Inline Editing Form if active edit */}
                {isEditing && (
                  <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 text-xs text-slate-200">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400">Title / Header</label>
                      <input
                        type="text"
                        value={editHeader}
                        onChange={e => setEditHeader(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400">Slide Body Text</label>
                      <textarea
                        rows={3}
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400">Scripture Ref</label>
                      <input
                        type="text"
                        value={editReference}
                        onChange={e => setEditReference(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400">Pastor / Speaker Notes</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingSlideId(null)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(slide.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Control Toolbar */}
                {!isEditing && (
                  <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs rounded-b-2xl">
                    <button
                      onClick={() => onSelectSlide(idx, true)}
                      className="flex items-center gap-1.5 font-bold text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-950/50 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-rose-400" />
                      <span>PUSH LIVE</span>
                    </button>

                    <div className="flex items-center gap-1 text-slate-400">
                      {/* Theme Selector Button */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowThemeMenuSlideId(
                              showThemeMenuSlideId === slide.id ? null : slide.id
                            )
                          }
                          className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                          title="Change Theme Style"
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </button>

                        {showThemeMenuSlideId === slide.id && (
                          <div className="absolute bottom-full left-0 mb-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 grid grid-cols-2 gap-1.5 ring-1 ring-white/10">
                            {THEME_PRESETS.map(theme => (
                              <button
                                key={theme.id}
                                onClick={() => {
                                  onUpdateSlide(slide.id, { themeStyle: theme.id as ThemeStyle, bgImageUrl: undefined });
                                  setShowThemeMenuSlideId(null);
                                }}
                                className={`h-8 rounded-lg text-[10px] font-semibold text-white ${theme.bgClass} flex items-center justify-center p-1 border border-white/10 hover:scale-105 transition-transform`}
                              >
                                {theme.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartEdit(slide)}
                        className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="Edit Slide"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateSlide(slide)}
                        className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="Duplicate Slide"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSlide(slide.id)}
                        className="p-1.5 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition-colors"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Speaker Notes Footer Bar */}
      {currentItem.slides[activeSlideIndex] && (
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-start gap-3 shadow-xl shrink-0">
          <FileText className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Speaker Notes (Slide #{activeSlideIndex + 1})
            </h5>
            <p className="text-xs text-slate-200 mt-0.5 leading-snug font-medium">
              {currentItem.slides[activeSlideIndex].speakerNotes ||
                'No speaker notes attached to this slide.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
