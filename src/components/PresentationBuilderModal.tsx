import React, { useState } from 'react';
import { 
  Presentation, 
  X, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Tv, 
  Layout, 
  List, 
  Quote, 
  BookOpen, 
  Image as ImageIcon 
} from 'lucide-react';
import { ScheduleItem, Slide, ThemeStyle, SlideType } from '../types';

interface PresentationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPresentationDeck: (item: ScheduleItem) => void;
  onPushSlideToLive?: (slide: Slide) => void;
}

const THEME_OPTIONS: { id: ThemeStyle; name: string; class: string }[] = [
  { id: 'gold-divine', name: 'Gold Divine', class: 'bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 border-amber-500/40' },
  { id: 'nature-serene', name: 'Serene Nature', class: 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-900 border-emerald-500/40' },
  { id: 'deep-blue', name: 'Ocean Deep Blue', class: 'bg-gradient-to-br from-sky-950 via-slate-900 to-blue-900 border-sky-500/40' },
  { id: 'stained-glass', name: 'Stained Glass', class: 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 border-purple-500/40' },
  { id: 'purple-majesty', name: 'Purple Majesty', class: 'bg-gradient-to-br from-purple-950 via-slate-900 to-fuchsia-950 border-purple-500/40' },
  { id: 'modern-dark', name: 'Modern Dark', class: 'bg-slate-900 border-slate-700' },
];

export const PresentationBuilderModal: React.FC<PresentationBuilderModalProps> = ({
  isOpen,
  onClose,
  onAddPresentationDeck,
  onPushSlideToLive
}) => {
  const [deckTitle, setDeckTitle] = useState('Church Presentation & Slideshow');
  const [deckSubtitle, setDeckSubtitle] = useState('Sunday Worship Display Deck');
  const [selectedTheme, setSelectedTheme] = useState<ThemeStyle>('gold-divine');
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 'slide-init-1',
      type: 'title',
      header: 'Welcome to Our Church Service',
      body: 'We are so glad you joined us today!',
      themeStyle: 'gold-divine'
    },
    {
      id: 'slide-init-2',
      type: 'outline',
      header: 'Today\'s Order of Service',
      body: 'Service Outline',
      bulletPoints: ['Worship in Song', 'Opening Prayer', 'Scripture Reading', 'Message & Sermon', 'Closing & Fellowship'],
      themeStyle: 'gold-divine'
    }
  ]);

  if (!isOpen) return null;

  const handleAddSlide = (type: SlideType) => {
    let header = 'New Slide Header';
    let body = 'Slide body text or notes...';
    let bulletPoints: string[] | undefined = undefined;

    if (type === 'title') {
      header = 'Presentation Section Title';
      body = 'Subtitle or description goes here';
    } else if (type === 'outline' || type === 'point') {
      header = 'Key Points & Takeaways';
      body = 'Bullet point breakdown';
      bulletPoints = ['First key takeaway', 'Second important point', 'Third action item'];
    } else if (type === 'quote') {
      header = '"Inspirational Quote or Thought"';
      body = '— Pastor / Author Name';
    } else if (type === 'scripture') {
      header = 'Scripture Passage';
      body = 'Verse text displayed on screen';
    }

    const newSlide: Slide = {
      id: `deck-slide-${Date.now()}-${Math.random()}`,
      type,
      header,
      body,
      bulletPoints,
      themeStyle: selectedTheme
    };

    setSlides([...slides, newSlide]);
  };

  const handleUpdateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const newArr = [...slides];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setSlides(newArr);
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) return;
    setSlides(slides.filter(s => s.id !== id));
  };

  const handleSaveDeckToSchedule = () => {
    if (!deckTitle.trim()) return;

    // Apply overall theme to slides
    const updatedSlides = slides.map(s => ({ ...s, themeStyle: selectedTheme }));

    const newItem: ScheduleItem = {
      id: `presentation-deck-${Date.now()}`,
      title: deckTitle,
      subtitle: deckSubtitle || `${updatedSlides.length} Slide Deck`,
      type: 'sermon',
      slides: updatedSlides,
      activeSlideIndex: 0
    };

    onAddPresentationDeck(newItem);
    onClose();
  };

  const handleGoLiveFirstSlide = () => {
    if (slides.length > 0 && onPushSlideToLive) {
      onPushSlideToLive({ ...slides[0], themeStyle: selectedTheme });
      handleSaveDeckToSchedule();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Presentation & Slideshow Deck Creator</h2>
              <p className="text-xs text-slate-400">Design custom slide decks with titles, bullet points, quotes, and visual themes</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deck Settings Bar */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Presentation Title
            </label>
            <input
              type="text"
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Subtitle / Speaker
            </label>
            <input
              type="text"
              value={deckSubtitle}
              onChange={(e) => setDeckSubtitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Visual Theme Style
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as ThemeStyle)}
              className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {THEME_OPTIONS.map(th => (
                <option key={th.id} value={th.id}>{th.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Slide Builder Workspace */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/60">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>Deck Slides ({slides.length})</span>
            </h3>

            {/* Quick Add Slide Type Toolbar */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAddSlide('title')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1"
              >
                <Layout className="w-3 h-3 text-amber-400" />
                <span>+ Title</span>
              </button>
              <button
                onClick={() => handleAddSlide('outline')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1"
              >
                <List className="w-3 h-3 text-purple-400" />
                <span>+ Bullets</span>
              </button>
              <button
                onClick={() => handleAddSlide('quote')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1"
              >
                <Quote className="w-3 h-3 text-blue-400" />
                <span>+ Quote</span>
              </button>
              <button
                onClick={() => handleAddSlide('scripture')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span>+ Verse</span>
              </button>
            </div>
          </div>

          {/* List of Slide Editors */}
          <div className="space-y-3">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 relative group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 text-[10px] font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {slide.type} Slide
                    </span>
                  </div>

                  {/* Move / Reorder Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveSlide(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveSlide(idx, 'down')}
                      disabled={idx === slides.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      disabled={slides.length <= 1}
                      className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Slide Title Input */}
                <input
                  type="text"
                  value={slide.header}
                  onChange={(e) => handleUpdateSlide(slide.id, { header: e.target.value })}
                  placeholder="Slide Header Title..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                />

                {/* Slide Body / Notes Input */}
                <textarea
                  rows={2}
                  value={slide.body}
                  onChange={(e) => handleUpdateSlide(slide.id, { body: e.target.value })}
                  placeholder="Slide main content or subtitle..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                />

                {/* Bullet Points Input if applicable */}
                {(slide.type === 'outline' || slide.type === 'point' || slide.bulletPoints) && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Bullet Points (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={slide.bulletPoints ? slide.bulletPoints.join('\n') : ''}
                      onChange={(e) => handleUpdateSlide(slide.id, { 
                        bulletPoints: e.target.value.split('\n').filter(Boolean) 
                      })}
                      placeholder="Enter bullet point 1&#10;Enter bullet point 2..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDeckToSchedule}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Deck to Schedule</span>
            </button>

            <button
              onClick={handleGoLiveFirstSlide}
              className="px-4.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all"
            >
              <Tv className="w-4 h-4 fill-slate-950" />
              <span>Go Live With Deck</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
