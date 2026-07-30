import React, { useState, useEffect } from 'react';
import { ScheduleItem, Slide, ThemeStyle } from '../types';
import { THEME_PRESETS } from '../data/mockData';
import { getThemeClass } from './SlideGridPanel';
import { 
  getSavedTemplates, 
  saveCustomTemplate, 
  deleteCustomTemplate, 
  CustomTemplate 
} from '../data/settingsAndTemplates';
import { 
  X, 
  Settings, 
  Palette, 
  Layers, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Check, 
  Sliders, 
  Play, 
  BookOpen, 
  Music, 
  Presentation, 
  Video, 
  Sparkles,
  Layout,
  Bookmark,
  Image as ImageIcon
} from 'lucide-react';

interface ScheduleItemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleItem: ScheduleItem | null;
  onUpdateScheduleItem: (itemId: string, updatedFields: Partial<ScheduleItem>) => void;
  onDeleteScheduleItem?: (itemId: string) => void;
  liveSlideId?: string;
  onPushSlideToLiveDirect?: (slide: Slide) => void;
  openMediaGenerator?: () => void;
}

export const ScheduleItemSettingsModal: React.FC<ScheduleItemSettingsModalProps> = ({
  isOpen,
  onClose,
  scheduleItem,
  onUpdateScheduleItem,
  onDeleteScheduleItem,
  liveSlideId,
  onPushSlideToLiveDirect,
  openMediaGenerator
}) => {
  const [activeTab, setActiveTab] = useState<'slides' | 'style' | 'settings'>('slides');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [itemType, setItemType] = useState<ScheduleItem['type']>('custom');
  const [keySig, setKeySig] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [bulkBgUrl, setBulkBgUrl] = useState('');
  const [savedSuccessNotice, setSavedSuccessNotice] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<CustomTemplate[]>(getSavedTemplates());

  // Sync state whenever scheduleItem changes
  useEffect(() => {
    if (scheduleItem) {
      setTitle(scheduleItem.title || '');
      setSubtitle(scheduleItem.subtitle || '');
      setItemType(scheduleItem.type || 'custom');
      setKeySig(scheduleItem.key || '');
      setSlides(scheduleItem.slides ? JSON.parse(JSON.stringify(scheduleItem.slides)) : []);
      setBulkBgUrl('');
      setSavedSuccessNotice(null);
    }
  }, [scheduleItem]);

  if (!isOpen || !scheduleItem) return null;

  // Auto notification helper
  const notifySuccess = (msg: string) => {
    setSavedSuccessNotice(msg);
    setTimeout(() => setSavedSuccessNotice(null), 3000);
  };

  // Helper to commit changes to parent schedule state
  const handleSaveAll = () => {
    onUpdateScheduleItem(scheduleItem.id, {
      title,
      subtitle: subtitle || undefined,
      type: itemType,
      key: keySig || undefined,
      slides,
    });
    notifySuccess('Schedule item saved successfully!');
    onClose();
  };

  // Slide CRUD functions inside modal
  const handleUpdateSlideField = (slideId: string, field: keyof Slide, value: any) => {
    const updated = slides.map(s => {
      if (s.id === slideId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    setSlides(updated);
    onUpdateScheduleItem(scheduleItem.id, { slides: updated });
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type: 'point',
      header: `Slide #${slides.length + 1}`,
      body: 'Enter your slide content here.',
      themeStyle: slides[0]?.themeStyle || 'modern-dark',
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    onUpdateScheduleItem(scheduleItem.id, { slides: updated });
    setEditingSlideId(newSlide.id);
    notifySuccess('New slide added to schedule item');
  };

  const handleDeleteSlide = (slideId: string) => {
    if (slides.length <= 1) {
      alert('A schedule item must contain at least one slide.');
      return;
    }
    const updated = slides.filter(s => s.id !== slideId);
    setSlides(updated);
    onUpdateScheduleItem(scheduleItem.id, { slides: updated });
    notifySuccess('Slide removed');
  };

  const handleDuplicateSlide = (slide: Slide) => {
    const slideIdx = slides.findIndex(s => s.id === slide.id);
    const newSlide: Slide = {
      ...slide,
      id: `slide-${Date.now()}`,
      header: slide.header ? `${slide.header} (Copy)` : 'Copy Slide',
    };
    const updated = [...slides];
    updated.splice(slideIdx + 1, 0, newSlide);
    setSlides(updated);
    onUpdateScheduleItem(scheduleItem.id, { slides: updated });
    notifySuccess('Slide duplicated');
  };

  const handleMoveSlide = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const updated = [...slides];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setSlides(updated);
    onUpdateScheduleItem(scheduleItem.id, { slides: updated });
  };

  // Bulk Theme Applicator
  const handleApplyThemeToAllSlides = (themeStyle: ThemeStyle) => {
    const updated = slides.map(s => ({
      ...s,
      themeStyle,
      bgImageUrl: undefined,
    }));
    setSlides(updated);
    onUpdateScheduleItem(scheduleItem.id, { slides: updated });
    notifySuccess(`Applied theme style to all ${slides.length} slides`);
  };

  const handleApplyTemplateToAllSlides = (template: CustomTemplate) => {
    const updated = slides.map(s => ({
      ...s,
      themeStyle: template.themeStyle,
      bgImageUrl: template.bgImageUrl
    }));
    setSlides(updated);
    onUpdateScheduleItem(scheduleItem.id, { slides: updated });
    notifySuccess(`Applied "${template.name}" template to all ${slides.length} slides!`);
  };

  const handleSaveCurrentStyleAsTemplate = () => {
    if (!slides.length) return;
    const name = prompt('Enter a name for this custom presentation template:', `${title} Custom Style`);
    if (!name || !name.trim()) return;

    const firstSlide = slides[0];
    saveCustomTemplate({
      name: name.trim(),
      description: `Saved from ${title} (${slides.length} slides)`,
      themeStyle: firstSlide.themeStyle || 'modern-dark',
      bgImageUrl: firstSlide.bgImageUrl
    });

    setSavedTemplates(getSavedTemplates());
    notifySuccess('Custom Template saved successfully!');
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomTemplate(id);
    setSavedTemplates(getSavedTemplates());
    notifySuccess('Template removed.');
  };

  const handleApplyBgImageToAllSlides = (bgUrl: string) => {
    const updated = slides.map(s => ({
      ...s,
      bgImageUrl: bgUrl ? bgUrl : undefined,
    }));
    setSlides(updated);
    onUpdateScheduleItem(scheduleItem.id, { slides: updated });
    notifySuccess(bgUrl ? 'Applied background image to all slides' : 'Cleared background images');
  };

  const getItemTypeIcon = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'song': return <Music className="w-4 h-4 text-purple-400" />;
      case 'scripture': return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'sermon': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'announcement': return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'video': return <Video className="w-4 h-4 text-emerald-400" />;
      default: return <Layers className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-indigo-400 shrink-0">
              {getItemTypeIcon(itemType)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white truncate">
                  {title || 'Untitled Schedule Item'}
                </h2>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {itemType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium truncate">
                {slides.length} {slides.length === 1 ? 'slide' : 'slides'} in this schedule entry • Edit content, style & settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-950/50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Done / Save</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {savedSuccessNotice && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{savedSuccessNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('slides')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 ${
              activeTab === 'slides'
                ? 'bg-slate-900 border-slate-700 text-white border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Content & Slides ({slides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('style')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 ${
              activeTab === 'style'
                ? 'bg-slate-900 border-slate-700 text-amber-300 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Theme & Visual Style</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-slate-900 border-slate-700 text-purple-300 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Schedule Item Settings</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-900 space-y-6">

          {/* TAB 1: SLIDES & CONTENT MANAGER */}
          {activeTab === 'slides' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Slide Sequence Manager</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add, edit text, reorder, or remove slides within this schedule item.
                  </p>
                </div>

                <button
                  onClick={handleAddSlide}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Slide</span>
                </button>
              </div>

              {/* Slide List */}
              <div className="space-y-3">
                {slides.map((slide, idx) => {
                  const isLive = slide.id === liveSlideId;
                  const isExpanded = editingSlideId === slide.id;

                  return (
                    <div
                      key={slide.id}
                      className={`border rounded-2xl transition-all overflow-hidden bg-slate-950 ${
                        isLive
                          ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/40'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Slide Item Header Row */}
                      <div className="p-3 bg-slate-950 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Slide Mini Thumbnail Preview */}
                          <div
                            className={`w-16 h-9 rounded-lg border border-white/10 shrink-0 p-1 flex flex-col justify-center text-center overflow-hidden relative ${
                              slide.bgImageUrl ? 'bg-cover bg-center' : getThemeClass(slide.themeStyle)
                            }`}
                            style={
                              slide.bgImageUrl
                                ? { backgroundImage: `url(${slide.bgImageUrl})` }
                                : undefined
                            }
                          >
                            <span className="text-[8px] font-black text-amber-300 truncate">
                              {slide.header || `#${idx + 1}`}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-400">
                                #{idx + 1}
                              </span>
                              <h4 className="text-xs font-bold text-white truncate">
                                {slide.header || 'Untitled Slide'}
                              </h4>
                              {isLive && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white tracking-wider uppercase animate-pulse">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {slide.body || 'No text content'}
                            </p>
                          </div>
                        </div>

                        {/* Slide Quick Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {onPushSlideToLiveDirect && (
                            <button
                              onClick={() => onPushSlideToLiveDirect(slide)}
                              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                                isLive
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                              title="Push this slide LIVE"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Go Live</span>
                            </button>
                          )}

                          <button
                            onClick={() => setEditingSlideId(isExpanded ? null : slide.id)}
                            className={`p-1.5 rounded-lg transition-colors text-xs font-semibold ${
                              isExpanded
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title="Edit Slide Content"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span className="ml-1 hidden sm:inline">{isExpanded ? 'Close Edit' : 'Edit'}</span>
                          </button>

                          <button
                            onClick={() => handleDuplicateSlide(slide)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Duplicate Slide"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleMoveSlide(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-20"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleMoveSlide(idx, 'down')}
                            disabled={idx === slides.length - 1}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-20"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-400 rounded-lg transition-colors"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Slide Editor Form */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3.5 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                                Slide Title / Header
                              </label>
                              <input
                                type="text"
                                value={slide.header || ''}
                                onChange={e => handleUpdateSlideField(slide.id, 'header', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                placeholder="e.g. Verse 1, Point #1, Passage..."
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                                Scripture Reference / Subtext
                              </label>
                              <input
                                type="text"
                                value={slide.reference || ''}
                                onChange={e => handleUpdateSlideField(slide.id, 'reference', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                placeholder="e.g. John 3:16, Key Verse..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">
                              Slide Body Text / Lyrics / Point Detail
                            </label>
                            <textarea
                              rows={3}
                              value={slide.body || ''}
                              onChange={e => handleUpdateSlideField(slide.id, 'body', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              placeholder="Enter slide content body..."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                                Speaker / Pastor Notes
                              </label>
                              <input
                                type="text"
                                value={slide.speakerNotes || ''}
                                onChange={e => handleUpdateSlideField(slide.id, 'speakerNotes', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                                placeholder="Private notes for confidence monitor..."
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                                Slide Theme Style
                              </label>
                              <select
                                value={slide.themeStyle || 'modern-dark'}
                                onChange={e => handleUpdateSlideField(slide.id, 'themeStyle', e.target.value as ThemeStyle)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-semibold focus:outline-none focus:border-indigo-500"
                              >
                                {THEME_PRESETS.map(preset => (
                                  <option key={preset.id} value={preset.id}>
                                    {preset.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: THEME & VISUAL STYLE */}
          {activeTab === 'style' && (
            <div className="space-y-6">
              {/* AI Visual Theme Generator Featured Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>AI Visual Theme Generator</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold uppercase border border-emerald-500/30">
                        Gemini AI
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Generate custom high-res backgrounds, sermon graphics, or motion textures for this item.
                    </p>
                  </div>
                </div>
                {openMediaGenerator && (
                  <button
                    onClick={() => {
                      onClose();
                      openMediaGenerator();
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch AI Generator</span>
                  </button>
                )}
              </div>

              {/* Presentation & Slide Templates Library */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-amber-400" />
                      <span>Presentation Style Templates</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Apply re-usable presentation themes or save this slide deck style as a template.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveCurrentStyleAsTemplate}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save Style as Template</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar pt-1">
                  {savedTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl flex items-center justify-between gap-3 shadow-sm transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{tpl.name}</span>
                          {tpl.isBuiltIn && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">Built-in</span>
                          )}
                        </div>
                        {tpl.description && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{tpl.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!tpl.isBuiltIn && (
                          <button
                            onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded"
                            title="Delete Custom Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleApplyTemplateToAllSlides(tpl)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition-all shadow"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme Presets Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span>Color Theme Presets (Apply to All Slides)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {THEME_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyThemeToAllSlides(preset.id as ThemeStyle)}
                      className={`h-20 rounded-2xl border p-2.5 flex flex-col justify-between text-left transition-all hover:scale-105 shadow-md ${preset.bgClass} border-white/10 hover:border-amber-400`}
                    >
                      <span className="text-xs font-extrabold text-white drop-shadow">
                        {preset.name}
                      </span>
                      <span className="text-[10px] font-semibold text-white/80 bg-black/40 px-2 py-0.5 rounded-md self-start border border-white/10">
                        Apply Preset
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Image Banner Applicator */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Apply Background Image URL to All Slides</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={bulkBgUrl}
                    onChange={e => setBulkBgUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-... (Image URL)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleApplyBgImageToAllSlides(bulkBgUrl)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shrink-0"
                  >
                    Apply Image
                  </button>
                  {bulkBgUrl && (
                    <button
                      onClick={() => handleApplyBgImageToAllSlides('')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULE ITEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-5 max-w-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Schedule Entry General Settings</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize header information, schedule type category, and entity metadata.
                </p>
              </div>

              <div className="space-y-4 bg-slate-950 p-4 border border-slate-800 rounded-2xl">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Schedule Entry Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Worship - Way Maker, Sermon Title..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Subtitle / Artist / Speaker / Details
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Sinach / Pastor David Miller / 5 Min Countdown..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Schedule Category Type
                    </label>
                    <select
                      value={itemType}
                      onChange={e => setItemType(e.target.value as ScheduleItem['type'])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="song">Worship Song</option>
                      <option value="scripture">Scripture Reading</option>
                      <option value="sermon">AI Sermon Deck</option>
                      <option value="announcement">Announcement Slide</option>
                      <option value="video">Visual / Video</option>
                      <option value="custom">Custom Deck</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Musical Key (If Song)
                    </label>
                    <input
                      type="text"
                      value={keySig}
                      onChange={e => setKeySig(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-purple-300 font-bold focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. G, C, Eb..."
                    />
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              {onDeleteScheduleItem && (
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-400">Remove from Schedule</h4>
                    <p className="text-[11px] text-slate-500">Permanently remove this item from the active service list.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${title}" from service schedule?`)) {
                        onDeleteScheduleItem(scheduleItem.id);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Schedule Entry</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            {slides.length} {slides.length === 1 ? 'slide' : 'slides'} in <strong className="text-slate-200">{title}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-950/50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & Close</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
