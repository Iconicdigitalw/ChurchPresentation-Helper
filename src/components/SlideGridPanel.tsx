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
  Maximize2
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
      <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <Sparkles className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="text-sm font-semibold text-slate-700">No Item Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
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
    <div className="flex-1 bg-slate-200 flex flex-col h-full overflow-hidden text-slate-800">
      {/* Top Header Bar for Selected Item */}
      <div className="p-4 border-b border-slate-300 bg-white flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              {currentItem.title}
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentItem.type}
            </span>
          </div>
          {currentItem.subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{currentItem.subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openMediaGenerator}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 transition-colors border border-slate-300 shadow-2xs"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Theme Background</span>
          </button>
          <button
            onClick={() => onAddSlide(0)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slide</span>
          </button>
        </div>
      </div>

      {/* Slide Thumbnails Grid */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {currentItem.slides.map((slide, idx) => {
            const isLive = slide.id === liveSlideId;
            const isSelected = idx === activeSlideIndex;
            const isEditing = slide.id === editingSlideId;

            return (
              <div
                key={slide.id}
                className={`group relative flex flex-col rounded-xl border transition-all overflow-hidden shadow-xs ${
                  isLive
                    ? 'ring-2 ring-indigo-600 border-indigo-600 shadow-md'
                    : isSelected
                    ? 'ring-2 ring-indigo-400 border-indigo-300 shadow-sm'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
              >
                {/* Thumbnail Preview Area */}
                <div
                  onClick={() => onSelectSlide(idx, true)}
                  className={`relative aspect-video w-full p-4 flex flex-col justify-between cursor-pointer select-none overflow-hidden ${
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
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white border border-white/10">
                      #{idx + 1}
                    </span>

                    {isLive ? (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-600 text-white tracking-wider shadow-sm animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        LIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/40 text-slate-300 capitalize">
                        {slide.type}
                      </span>
                    )}
                  </div>

                  {/* Slide Content Preview */}
                  <div className="relative z-10 my-auto text-center px-1 py-1">
                    {slide.header && (
                      <h4 className="text-xs font-extrabold tracking-wide text-indigo-300 uppercase drop-shadow-md line-clamp-1">
                        {slide.header}
                      </h4>
                    )}
                    <p className="text-[11px] font-medium text-white/95 leading-tight mt-1 line-clamp-3 drop-shadow">
                      {slide.body}
                    </p>
                    {slide.reference && (
                      <p className="text-[9px] font-semibold text-indigo-200 mt-1 italic drop-shadow">
                        {slide.reference}
                      </p>
                    )}
                  </div>

                  {/* Bottom Bar overlay */}
                  <div className="relative z-10 flex items-center justify-between text-[9px] text-white/70">
                    <span className="truncate max-w-[120px]">
                      {slide.speakerNotes ? '📝 Notes included' : ''}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold text-white">
                      Click to Go Live →
                    </span>
                  </div>
                </div>

                {/* Inline Editing Form if active edit */}
                {isEditing && (
                  <div className="p-3 bg-white border-t border-slate-200 space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Header/Title</label>
                      <input
                        type="text"
                        value={editHeader}
                        onChange={e => setEditHeader(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Slide Text / Body</label>
                      <textarea
                        rows={3}
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Scripture / Ref</label>
                      <input
                        type="text"
                        value={editReference}
                        onChange={e => setEditReference(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Speaker / Pastor Notes</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingSlideId(null)}
                        className="px-2 py-1 text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(slide.id)}
                        className="px-3 py-1 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Control Toolbar */}
                {!isEditing && (
                  <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onSelectSlide(idx, true)}
                      className="flex items-center gap-1.5 font-bold text-[11px] text-red-600 hover:text-red-700"
                    >
                      <Play className="w-3.5 h-3.5 fill-red-600" />
                      <span>GO LIVE</span>
                    </button>

                    <div className="flex items-center gap-1 text-slate-500">
                      {/* Theme Selector Button */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowThemeMenuSlideId(
                              showThemeMenuSlideId === slide.id ? null : slide.id
                            )
                          }
                          className="p-1 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="Change Theme"
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </button>

                        {showThemeMenuSlideId === slide.id && (
                          <div className="absolute bottom-full right-0 mb-1 w-44 bg-white border border-slate-300 rounded-lg shadow-xl p-2 z-50 grid grid-cols-2 gap-1.5">
                            {THEME_PRESETS.map(theme => (
                              <button
                                key={theme.id}
                                onClick={() => {
                                  onUpdateSlide(slide.id, { themeStyle: theme.id as ThemeStyle, bgImageUrl: undefined });
                                  setShowThemeMenuSlideId(null);
                                }}
                                className={`h-8 rounded text-[10px] font-semibold text-white ${theme.bgClass} flex items-center justify-center p-1 border border-white/10 hover:scale-105 transition-transform`}
                              >
                                {theme.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartEdit(slide)}
                        className="p-1 hover:text-slate-900 rounded hover:bg-slate-100"
                        title="Edit Slide"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateSlide(slide)}
                        className="p-1 hover:text-slate-900 rounded hover:bg-slate-100"
                        title="Duplicate Slide"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSlide(slide.id)}
                        className="p-1 hover:text-red-600 rounded hover:bg-red-50"
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
        <div className="p-4 bg-white border-t border-slate-300 flex items-start gap-3 shadow-2xs shrink-0">
          <FileText className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <h5 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              Speaker Notes (Slide #{activeSlideIndex + 1})
            </h5>
            <p className="text-xs text-slate-700 mt-0.5 leading-snug font-medium">
              {currentItem.slides[activeSlideIndex].speakerNotes ||
                'No speaker notes attached to this slide.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
