import React, { useState } from 'react';
import { Slide, ScheduleItem } from '../types';
import {
  Edit3, 
  Trash2, 
  Plus, 
  Copy, 
  Palette, 
  FileText, 
  Sparkles,
  Layout,
  Bookmark,
  Check,
  X,
  Settings,
  LayoutGrid,
  List,
  ZoomIn,
  ZoomOut,
  Play
} from 'lucide-react';
import { 
  getSavedTemplates, 
  saveCustomTemplate, 
  deleteCustomTemplate, 
  CustomTemplate 
} from '../data/settingsAndTemplates';
import { ContextWorkspacePanel } from './ContextWorkspacePanel';
import { SlideCanvas, getThemeClass } from './SlideCanvas';

// Re-exported for the settings modal, which shows the same slide surfaces.
export { getThemeClass };

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
  slideActivationMode?: 'double_click' | 'single_click';
  onOpenSettingsModal?: (item: ScheduleItem) => void;
  liveSlide?: Slide | null;
  schedule?: ScheduleItem[];
  onPushSlideToLive?: (slide: Slide) => void;
  onPreviewSlide?: (slide: Slide) => void;
  onAddScriptureItem?: (item: ScheduleItem) => void;
  onAddSongItem?: (item: ScheduleItem) => void;
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
  openMediaGenerator,
  slideActivationMode = 'double_click',
  onOpenSettingsModal,
  liveSlide = null,
  schedule = [],
  onPushSlideToLive,
  onPreviewSlide,
  onAddScriptureItem,
  onAddSongItem
}) => {
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editHeader, setEditHeader] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showThemeMenuSlideId, setShowThemeMenuSlideId] = useState<string | null>(null);
  
  // View options: Grid vs List layout, and Thumbnail size
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Template Modal / Selector states
  const [savedTemplates, setSavedTemplates] = useState<CustomTemplate[]>(getSavedTemplates());
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

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

  // Slide click handler depending on trigger setting (Single vs Double click)
  const handleSlideThumbnailClick = (idx: number) => {
    if (slideActivationMode === 'single_click') {
      onSelectSlide(idx, true);
    } else {
      onSelectSlide(idx, false);
    }
  };

  const handleSlideThumbnailDoubleClick = (idx: number) => {
    if (slideActivationMode === 'double_click') {
      onSelectSlide(idx, true);
    }
  };

  const gridClassMap = {
    small: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3',
    medium: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4',
    large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden text-slate-100 relative z-20">
      {/* Top Header Bar for Selected Item */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-extrabold text-slate-100 tracking-tight">
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

        {/* View Options Bar: Grid vs List & Thumbnail Size Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                layoutMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                layoutMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {/* Size zoom pills when in grid mode */}
          {layoutMode === 'grid' && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setThumbnailSize('small')}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                  thumbnailSize === 'small'
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
                title="Small Thumbnails (Zoom Out)"
              >
                S
              </button>
              <button
                onClick={() => setThumbnailSize('medium')}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                  thumbnailSize === 'medium'
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
                title="Medium Thumbnails"
              >
                M
              </button>
              <button
                onClick={() => setThumbnailSize('large')}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                  thumbnailSize === 'large'
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
                title="Large Thumbnails (Zoom In)"
              >
                L
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Applied Notice Banner */}
      {appliedNotice && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{appliedNotice}</span>
          </span>
          <button onClick={() => setAppliedNotice(null)} className="text-emerald-400 hover:text-slate-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Slide View Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar bg-slate-950/80">
        {layoutMode === 'grid' ? (
          /* GRID VIEW */
          <div className={`grid ${gridClassMap[thumbnailSize]}`}>
            {currentItem.slides.map((slide, idx) => {
              const isLive = slide.id === liveSlideId;
              const isSelected = idx === activeSlideIndex;
              const isEditing = slide.id === editingSlideId;

              return (
                <div
                  key={slide.id}
                  className={`group relative flex flex-col rounded-2xl border transition-all shadow-xl ${
                    isLive
                      ? 'ring-2 ring-rose-500 border-rose-500 shadow-rose-950/50'
                      : isSelected
                      ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-emerald-950/50'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                  }`}
                >
                  {/* Thumbnail Preview Area (16:9) - scaled replica of the live output */}
                  <div
                    onClick={() => handleSlideThumbnailClick(idx)}
                    onDoubleClick={() => handleSlideThumbnailDoubleClick(idx)}
                    className="relative w-full cursor-pointer"
                    title="Click or double-click to present live"
                  >
                    <SlideCanvas slide={slide} className="rounded-2xl" />

                    {/* Floating Overlay Badge (Top-Left): Slide Index Number */}
                    <div className="absolute top-1.5 left-1.5 z-20 pointer-events-none">
                      <span className="theme-locked-dark text-[9px] font-black px-1.5 py-0.5 rounded bg-black/80 text-slate-100 border border-white/20 shadow-md">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Floating Overlay Badge (Top-Right): Live Status / Type */}
                    <div className="absolute top-1.5 right-1.5 z-20 pointer-events-none">
                      {isLive ? (
                        <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white tracking-wider shadow-lg animate-pulse">
                          <span className="w-1 h-1 rounded-full bg-white" />
                          LIVE
                        </span>
                      ) : (
                        <span className="theme-locked-dark text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/70 text-slate-300 capitalize border border-white/10 shadow">
                          {slide.type}
                        </span>
                      )}
                    </div>

                    {/* Floating Overlay Badge (Bottom-Left): Speaker Notes Indicator */}
                    {slide.speakerNotes && (
                      <div className="absolute bottom-1.5 left-1.5 z-20 pointer-events-none">
                        <span className="theme-locked-dark text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-amber-300/90 border border-amber-500/30 flex items-center gap-1 shadow">
                          📝 Notes
                        </span>
                      </div>
                    )}

                    {/* Floating Overlay Badge (Bottom-Right): Hover Live Indicator */}
                    {!isLive && (
                      <div className="absolute bottom-1.5 right-1.5 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[8px] font-bold text-amber-300 border border-amber-500/30 shadow-md">
                          Click to Live
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Inline Editing Form if active edit */}
                  {isEditing && (
                    <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 text-xs text-slate-200 rounded-b-2xl">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Title / Header</label>
                        <input
                          type="text"
                          value={editHeader}
                          onChange={e => setEditHeader(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Slide Body Text</label>
                        <textarea
                          rows={3}
                          value={editBody}
                          onChange={e => setEditBody(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Scripture Ref</label>
                        <input
                          type="text"
                          value={editReference}
                          onChange={e => setEditReference(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-100 text-xs"
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
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-3">
            {currentItem.slides.map((slide, idx) => {
              const isLive = slide.id === liveSlideId;
              const isSelected = idx === activeSlideIndex;
              const isEditing = slide.id === editingSlideId;

              return (
                <div
                  key={slide.id}
                  onClick={() => handleSlideThumbnailClick(idx)}
                  onDoubleClick={() => handleSlideThumbnailDoubleClick(idx)}
                  className={`group relative p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer shadow-lg ${
                    isLive
                      ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/40'
                      : isSelected
                      ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Left Section: Index & Mini Thumbnail */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="text-xs font-black text-slate-400 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Mini Thumbnail Preview (same scaled canvas as the grid) */}
                    <div className="w-32 shrink-0 relative">
                      <SlideCanvas slide={slide} className="rounded-xl border border-white/10 shadow" />
                    </div>

                    {/* Main Slide Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {slide.header && (
                          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                            {slide.header}
                          </h4>
                        )}
                        {slide.reference && (
                          <span className="text-[10px] font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                            {slide.reference}
                          </span>
                        )}
                        {isLive && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                            LIVE
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                        {slide.body}
                      </p>

                      {slide.speakerNotes && (
                        <p className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1 pt-0.5">
                          <FileText className="w-3 h-3" />
                          <span>Notes: {slide.speakerNotes}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Section: Present / Live Action */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSlide(idx, true);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        isLive
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isLive ? 'LIVE' : 'PRESENT'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Speaker Notes Footer Bar */}
      {currentItem.slides[activeSlideIndex] && (
        <div className="px-3.5 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mr-2">
                Notes (Slide #{activeSlideIndex + 1}):
              </span>
              <span className="text-xs text-slate-200 font-medium">
                {currentItem.slides[activeSlideIndex].speakerNotes || 'No speaker notes attached to this slide.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Context Reader & Live Media Dock (Bible / Songs / Decks) */}
      <ContextWorkspacePanel
        currentItem={currentItem}
        activeSlideIndex={activeSlideIndex}
        liveSlide={liveSlide}
        schedule={schedule}
        onPushSlideToLive={(slide) => {
          if (onPushSlideToLive) {
            onPushSlideToLive(slide);
          }
        }}
        onPreviewSlide={onPreviewSlide}
        onAddScriptureItem={onAddScriptureItem}
        onAddSongItem={onAddSongItem}
        onSelectSlideInItem={(slideIdx, goLive) => {
          onSelectSlide(slideIdx, goLive);
        }}
      />
    </div>
  );
};
