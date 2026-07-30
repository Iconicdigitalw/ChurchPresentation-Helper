/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScheduleItem, 
  Slide, 
  QuickState, 
  AlertOverlay, 
  ViewMode,
  SearchMode 
} from './types';
import { INITIAL_SCHEDULE } from './data/mockData';
import { Navbar } from './components/Navbar';
import { SchedulePanel } from './components/SchedulePanel';
import { SlideGridPanel } from './components/SlideGridPanel';
import { LivePreviewPanel } from './components/LivePreviewPanel';
import { AISermonConverterModal } from './components/AISermonConverterModal';
import { AILiveCompanionDrawer } from './components/AILiveCompanionDrawer';
import { BibleLibraryModal } from './components/BibleLibraryModal';
import { SongLibraryModal } from './components/SongLibraryModal';
import { AIMediaGeneratorModal } from './components/AIMediaGeneratorModal';
import { AlertOverlayModal } from './components/AlertOverlayModal';
import { StageDisplayView } from './components/StageDisplayView';
import { PresentationBuilderModal } from './components/PresentationBuilderModal';
import { ScheduleItemSettingsModal } from './components/ScheduleItemSettingsModal';
import { 
  getSavedShortcuts, 
  getAppSettings, 
  ShortcutBinding 
} from './data/settingsAndTemplates';

export default function App() {
  // Main State
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(INITIAL_SCHEDULE[0].id);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [liveSlide, setLiveSlide] = useState<Slide | null>(INITIAL_SCHEDULE[0].slides[0] || null);
  const [isLiveOutputOn, setIsLiveOutputOn] = useState<boolean>(true);
  const [quickState, setQuickState] = useState<QuickState>('normal');
  const [alertOverlay, setAlertOverlay] = useState<AlertOverlay | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('operator');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('bible');
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  // Settings & Custom Shortcuts State
  const [shortcuts, setShortcuts] = useState<ShortcutBinding[]>(() => getSavedShortcuts());
  const [slideActivationMode, setSlideActivationMode] = useState<'double_click' | 'single_click'>(
    () => getAppSettings().slideActivationMode
  );

  // Modals state
  const [isSermonModalOpen, setIsSermonModalOpen] = useState(false);
  const [isPresentationBuilderOpen, setIsPresentationBuilderOpen] = useState(false);
  const [isLiveCompanionOpen, setIsLiveCompanionOpen] = useState(false);
  const [isBibleModalOpen, setIsBibleModalOpen] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isMediaGenOpen, setIsMediaGenOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isScheduleSettingsOpen, setIsScheduleSettingsOpen] = useState(false);
  const [settingsModalItem, setSettingsModalItem] = useState<ScheduleItem | null>(null);

  const openQuickSearchWithMode = useCallback((query: string = '') => {
    setSearchInitialQuery(query);
    if (searchMode === 'bible') {
      setIsBibleModalOpen(true);
    } else if (searchMode === 'songs') {
      setIsSongModalOpen(true);
    } else if (searchMode === 'visuals') {
      setIsMediaGenOpen(true);
    } else if (searchMode === 'deck') {
      setIsPresentationBuilderOpen(true);
    }
  }, [searchMode]);

  // Currently selected item
  const currentItem = schedule.find(item => item.id === selectedScheduleId) || null;

  // Calculate Next Slide preview
  const getNextSlide = (): Slide | null => {
    if (!currentItem) return null;
    if (activeSlideIndex < currentItem.slides.length - 1) {
      return currentItem.slides[activeSlideIndex + 1];
    }
    // Next item's first slide
    const currentItemIndex = schedule.findIndex(i => i.id === selectedScheduleId);
    if (currentItemIndex >= 0 && currentItemIndex < schedule.length - 1) {
      const nextItem = schedule[currentItemIndex + 1];
      return nextItem.slides[0] || null;
    }
    return null;
  };

  const nextSlide = getNextSlide();

  // Navigation Logic
  const handleSelectScheduleItem = (id: string) => {
    setSelectedScheduleId(id);
    setActiveSlideIndex(0);
  };

  const handleSelectSlide = (index: number, goLive: boolean = true) => {
    setActiveSlideIndex(index);
    if (currentItem && currentItem.slides[index]) {
      if (goLive) {
        setLiveSlide(currentItem.slides[index]);
        if (quickState !== 'normal') {
          setQuickState('normal');
        }
      }
    }
  };

  const handleGoNextSlide = useCallback(() => {
    if (!currentItem) return;

    if (activeSlideIndex < currentItem.slides.length - 1) {
      setActiveSlideIndex(prev => prev + 1);
    }
  }, [currentItem, activeSlideIndex]);

  const handleGoPrevSlide = useCallback(() => {
    if (!currentItem) return;

    if (activeSlideIndex > 0) {
      setActiveSlideIndex(prev => prev - 1);
    }
  }, [currentItem, activeSlideIndex]);

  const handleGoNextScheduleItem = useCallback(() => {
    const currentItemIndex = schedule.findIndex(i => i.id === selectedScheduleId);
    if (currentItemIndex >= 0 && currentItemIndex < schedule.length - 1) {
      const nextItem = schedule[currentItemIndex + 1];
      setSelectedScheduleId(nextItem.id);
      setActiveSlideIndex(0);
    }
  }, [schedule, selectedScheduleId]);

  const handleGoPrevScheduleItem = useCallback(() => {
    const currentItemIndex = schedule.findIndex(i => i.id === selectedScheduleId);
    if (currentItemIndex > 0) {
      const prevItem = schedule[currentItemIndex - 1];
      setSelectedScheduleId(prevItem.id);
      setActiveSlideIndex(0);
    }
  }, [schedule, selectedScheduleId]);

  const handlePushLive = useCallback(() => {
    if (currentItem && currentItem.slides[activeSlideIndex]) {
      setLiveSlide(currentItem.slides[activeSlideIndex]);
      if (quickState !== 'normal') {
        setQuickState('normal');
      }
    }
  }, [currentItem, activeSlideIndex, quickState]);

  // Global Customizable Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea or modal open
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) ||
        isSermonModalOpen ||
        isPresentationBuilderOpen ||
        isBibleModalOpen ||
        isSongModalOpen ||
        isMediaGenOpen ||
        isAlertModalOpen
      ) {
        return;
      }

      // Check for Slash or Ctrl+K / Cmd+K for quick search trigger
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        openQuickSearchWithMode('');
        return;
      }

      // Helper to match configured custom shortcut keys
      const matchesShortcut = (actionId: string) => {
        const binding = shortcuts.find(s => s.id === actionId);
        if (!binding || !binding.key) return false;

        const parts = binding.key.toLowerCase().split('+').map(k => k.trim());
        const mainKey = parts[parts.length - 1];
        const hasCtrl = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta');
        const hasShift = parts.includes('shift');
        const hasAlt = parts.includes('alt');

        if (hasCtrl && !(e.ctrlKey || e.metaKey)) return false;
        if (hasShift && !e.shiftKey) return false;
        if (hasAlt && !e.altKey) return false;

        // Ensure no unrequested modifiers are pressed
        if (!hasCtrl && (e.ctrlKey || e.metaKey)) return false;
        if (!hasAlt && e.altKey) return false;

        const eventKey = e.key.toLowerCase();
        const eventCode = e.code.toLowerCase();

        if (mainKey === eventKey || mainKey === eventCode) return true;
        if ((mainKey === 'space' || mainKey === 'spacebar') && e.code === 'Space') return true;
        if (mainKey === 'enter' && e.key === 'Enter') return true;
        if ((mainKey === 'arrowright' || mainKey === 'arrow right') && e.key === 'ArrowRight') return true;
        if ((mainKey === 'arrowleft' || mainKey === 'arrow left') && e.key === 'ArrowLeft') return true;
        if ((mainKey === 'arrowup' || mainKey === 'arrow up') && e.key === 'ArrowUp') return true;
        if ((mainKey === 'arrowdown' || mainKey === 'arrow down') && e.key === 'ArrowDown') return true;

        return false;
      };

      if (matchesShortcut('trigger_voice_search')) {
        e.preventDefault();
        setIsLiveCompanionOpen(true);
        return;
      }

      if (e.key === 'Enter' || matchesShortcut('push_live')) {
        e.preventDefault();
        handlePushLive();
        return;
      }

      if (e.key === 'ArrowRight' || e.code === 'Space' || matchesShortcut('next_slide')) {
        e.preventDefault();
        handleGoNextSlide();
        return;
      }
      if (e.key === 'ArrowLeft' || matchesShortcut('prev_slide')) {
        e.preventDefault();
        handleGoPrevSlide();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleGoNextScheduleItem();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleGoPrevScheduleItem();
        return;
      }
      if (matchesShortcut('toggle_clear_text')) {
        e.preventDefault();
        setQuickState(prev => prev === 'clearText' ? 'normal' : 'clearText');
        return;
      }
      if (matchesShortcut('toggle_clear_bg')) {
        e.preventDefault();
        setQuickState(prev => prev === 'clearBg' ? 'normal' : 'clearBg');
        return;
      }
      if (matchesShortcut('toggle_black')) {
        e.preventDefault();
        setQuickState(prev => prev === 'black' ? 'normal' : 'black');
        return;
      }
      if (matchesShortcut('toggle_logo')) {
        e.preventDefault();
        setQuickState(prev => prev === 'logo' ? 'normal' : 'logo');
        return;
      }
      if (matchesShortcut('toggle_live_output')) {
        e.preventDefault();
        setIsLiveOutputOn(prev => !prev);
        return;
      }
      if (matchesShortcut('open_bible')) {
        e.preventDefault();
        setSearchInitialQuery('');
        setIsBibleModalOpen(true);
        return;
      }
      if (matchesShortcut('open_songs')) {
        e.preventDefault();
        setSearchInitialQuery('');
        setIsSongModalOpen(true);
        return;
      }
      if (matchesShortcut('switch_search_mode')) {
        e.preventDefault();
        setSearchMode(prev => 
          prev === 'bible' ? 'songs' : 
          prev === 'songs' ? 'visuals' : 
          prev === 'visuals' ? 'deck' : 'bible'
        );
        return;
      }
      if (matchesShortcut('open_deck')) {
        e.preventDefault();
        setIsPresentationBuilderOpen(true);
        return;
      }

      // Fallback Speed Typing Quick Search Trigger
      if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        /[a-zA-Z0-9:\-,."']/i.test(e.key)
      ) {
        e.preventDefault();
        openQuickSearchWithMode(e.key);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shortcuts,
    handleGoNextSlide,
    handleGoPrevSlide,
    handleGoNextScheduleItem,
    handleGoPrevScheduleItem,
    handlePushLive,
    isSermonModalOpen,
    isPresentationBuilderOpen,
    isBibleModalOpen,
    isSongModalOpen,
    isMediaGenOpen,
    isAlertModalOpen,
    openQuickSearchWithMode
  ]);

  // Schedule Modification Handlers
  const handleOpenScheduleSettings = (item: ScheduleItem) => {
    setSettingsModalItem(item);
    setIsScheduleSettingsOpen(true);
  };

  const handleUpdateScheduleItemFields = (itemId: string, updatedFields: Partial<ScheduleItem>) => {
    setSchedule(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updatedFields };
        if (settingsModalItem && settingsModalItem.id === itemId) {
          setSettingsModalItem(updated);
        }
        // Sync live slide if currently showing one from this item
        if (liveSlide && item.slides.some(s => s.id === liveSlide.id)) {
          const matchingLiveSlide = updated.slides.find(s => s.id === liveSlide.id);
          if (matchingLiveSlide) {
            setLiveSlide(matchingLiveSlide);
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleMoveScheduleItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= schedule.length) return;

    const newSchedule = [...schedule];
    const [movedItem] = newSchedule.splice(index, 1);
    newSchedule.splice(targetIndex, 0, movedItem);
    setSchedule(newSchedule);
  };

  const handleReorderScheduleItems = (reorderedList: ScheduleItem[]) => {
    setSchedule(reorderedList);
  };

  const handleDeleteScheduleItem = (id: string) => {
    if (schedule.length <= 1) return;
    const newSchedule = schedule.filter(item => item.id !== id);
    setSchedule(newSchedule);
    if (selectedScheduleId === id) {
      setSelectedScheduleId(newSchedule[0].id);
      setActiveSlideIndex(0);
      if (newSchedule[0].slides[0]) {
        setLiveSlide(newSchedule[0].slides[0]);
      }
    }
  };

  const handleAddCustomScheduleItem = (title: string, type: ScheduleItem['type']) => {
    const newItem: ScheduleItem = {
      id: `item-${Date.now()}`,
      title,
      type,
      activeSlideIndex: 0,
      slides: [
        {
          id: `slide-${Date.now()}`,
          type: type === 'song' ? 'song' : type === 'scripture' ? 'scripture' : 'title',
          header: title,
          body: 'Enter your slide body text here or edit using the panel below.',
          themeStyle: 'modern-dark'
        }
      ]
    };

    setSchedule(prev => [...prev, newItem]);
    setSelectedScheduleId(newItem.id);
    setActiveSlideIndex(0);
    setLiveSlide(newItem.slides[0]);
  };

  const handleAddConvertedDeck = (item: ScheduleItem) => {
    setSchedule(prev => [...prev, item]);
    setSelectedScheduleId(item.id);
    setActiveSlideIndex(0);
    if (item.slides.length > 0) {
      setLiveSlide(item.slides[0]);
    }
  };

  const handlePushSlideToLiveDirect = (slide: Slide) => {
    setLiveSlide(slide);
    setQuickState('normal');
  };

  const handleAddSongItem = (item: ScheduleItem) => {
    setSchedule(prev => [...prev, item]);
    setSelectedScheduleId(item.id);
    setActiveSlideIndex(0);
    if (item.slides.length > 0) {
      setLiveSlide(item.slides[0]);
    }
  };

  // Slide CRUD handlers
  const handleUpdateSlide = (slideId: string, updatedSlide: Partial<Slide>) => {
    if (!currentItem) return;

    const updatedSlides = currentItem.slides.map(s => {
      if (s.id === slideId) {
        return { ...s, ...updatedSlide };
      }
      return s;
    });

    const updatedSchedule = schedule.map(item => {
      if (item.id === currentItem.id) {
        return { ...item, slides: updatedSlides };
      }
      return item;
    });

    setSchedule(updatedSchedule);

    if (liveSlide && liveSlide.id === slideId) {
      setLiveSlide(prev => (prev ? { ...prev, ...updatedSlide } : null));
    }
  };

  const handleAddSlide = (itemIndex: number) => {
    if (!currentItem) return;

    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type: 'point',
      header: 'New Slide Header',
      body: 'Click edit icon to customize text content, scriptures, or speaker notes.',
      themeStyle: 'modern-dark'
    };

    const newSlides = [...currentItem.slides];
    newSlides.splice(activeSlideIndex + 1, 0, newSlide);

    const updatedSchedule = schedule.map(item => {
      if (item.id === currentItem.id) {
        return { ...item, slides: newSlides };
      }
      return item;
    });

    setSchedule(updatedSchedule);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handleDeleteSlide = (slideId: string) => {
    if (!currentItem || currentItem.slides.length <= 1) return;

    const newSlides = currentItem.slides.filter(s => s.id !== slideId);

    const updatedSchedule = schedule.map(item => {
      if (item.id === currentItem.id) {
        return { ...item, slides: newSlides };
      }
      return item;
    });

    setSchedule(updatedSchedule);
    const newIdx = Math.max(0, activeSlideIndex - 1);
    setActiveSlideIndex(newIdx);

    if (liveSlide && liveSlide.id === slideId) {
      setLiveSlide(newSlides[newIdx] || null);
    }
  };

  const handleDuplicateSlide = (slide: Slide) => {
    if (!currentItem) return;

    const dupSlide: Slide = {
      ...slide,
      id: `slide-dup-${Date.now()}`,
      header: slide.header ? `${slide.header} (Copy)` : 'Copy'
    };

    const newSlides = [...currentItem.slides];
    newSlides.splice(activeSlideIndex + 1, 0, dupSlide);

    const updatedSchedule = schedule.map(item => {
      if (item.id === currentItem.id) {
        return { ...item, slides: newSlides };
      }
      return item;
    });

    setSchedule(updatedSchedule);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* App Navigation & Control Bar */}
      <Navbar
        isLiveOutputOn={isLiveOutputOn}
        setIsLiveOutputOn={setIsLiveOutputOn}
        quickState={quickState}
        setQuickState={setQuickState}
        activeViewMode={activeViewMode}
        setActiveViewMode={setActiveViewMode}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        openSermonConverter={() => setIsSermonModalOpen(true)}
        openLiveCompanion={() => setIsLiveCompanionOpen(true)}
        openBibleLibrary={() => { setSearchInitialQuery(''); setIsBibleModalOpen(true); }}
        openSongLibrary={() => { setSearchInitialQuery(''); setIsSongModalOpen(true); }}
        openMediaGenerator={() => { setSearchInitialQuery(''); setIsMediaGenOpen(true); }}
        openAlertModal={() => setIsAlertModalOpen(true)}
        isMicActive={isMicActive}
        openQuickSearchWithMode={() => openQuickSearchWithMode('')}
        slideActivationMode={slideActivationMode}
        setSlideActivationMode={setSlideActivationMode}
        shortcuts={shortcuts}
        setShortcuts={setShortcuts}
      />

      {/* Main Workspace Layout */}
      {activeViewMode === 'operator' ? (
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Order of Service Schedule Panel */}
          <SchedulePanel
            schedule={schedule}
            selectedScheduleId={selectedScheduleId}
            liveSlideId={liveSlide?.id || null}
            isLiveOutputOn={isLiveOutputOn}
            onSelectScheduleItem={handleSelectScheduleItem}
            onMoveItem={handleMoveScheduleItem}
            onReorderItems={handleReorderScheduleItems}
            onDeleteItem={handleDeleteScheduleItem}
            onOpenSettingsModal={handleOpenScheduleSettings}
            openSermonConverter={() => setIsSermonModalOpen(true)}
            openPresentationBuilder={() => setIsPresentationBuilderOpen(true)}
            openBibleLibrary={() => setIsBibleModalOpen(true)}
            openSongLibrary={() => setIsSongModalOpen(true)}
            openMediaGenerator={() => setIsMediaGenOpen(true)}
            onAddCustomItem={handleAddCustomScheduleItem}
          />

          {/* Slide Operator Grid */}
          <SlideGridPanel
            currentItem={currentItem}
            activeSlideIndex={activeSlideIndex}
            onSelectSlide={handleSelectSlide}
            onUpdateSlide={handleUpdateSlide}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
            liveSlideId={liveSlide?.id || null}
            openMediaGenerator={() => setIsMediaGenOpen(true)}
            slideActivationMode={slideActivationMode}
            onOpenSettingsModal={handleOpenScheduleSettings}
          />

          {/* Program Live & Next Preview Panel */}
          <LivePreviewPanel
            liveSlide={liveSlide}
            nextSlide={nextSlide}
            isLiveOutputOn={isLiveOutputOn}
            onToggleLiveOutput={() => setIsLiveOutputOn(!isLiveOutputOn)}
            quickState={quickState}
            setQuickState={setQuickState}
            alertOverlay={alertOverlay}
            onClearAlert={() => setAlertOverlay(null)}
            onGoNextSlide={handleGoNextSlide}
            onGoPrevSlide={handleGoPrevSlide}
            onPushLive={handlePushLive}
            openStageView={() => setActiveViewMode('confidence')}
            activeViewMode={activeViewMode}
            setActiveViewMode={setActiveViewMode}
          />
        </main>
      ) : (
        /* Fullscreen Stage Display / Confidence Monitor */
        <StageDisplayView
          liveSlide={liveSlide}
          nextSlide={nextSlide}
          quickState={quickState}
          alertOverlay={alertOverlay}
          onExitStageView={() => setActiveViewMode('operator')}
        />
      )}

      {/* AI Modals & Drawers */}
      <AISermonConverterModal
        isOpen={isSermonModalOpen}
        onClose={() => setIsSermonModalOpen(false)}
        onAddConvertedDeck={handleAddConvertedDeck}
      />

      <PresentationBuilderModal
        isOpen={isPresentationBuilderOpen}
        onClose={() => setIsPresentationBuilderOpen(false)}
        onAddPresentationDeck={handleAddConvertedDeck}
        onPushSlideToLive={handlePushSlideToLiveDirect}
      />

      <AILiveCompanionDrawer
        isOpen={isLiveCompanionOpen}
        onClose={() => setIsLiveCompanionOpen(false)}
        onPushSlideToLive={handlePushSlideToLiveDirect}
        onAddSongItem={handleAddSongItem}
        isMicActive={isMicActive}
        setIsMicActive={setIsMicActive}
      />

      <BibleLibraryModal
        isOpen={isBibleModalOpen}
        onClose={() => setIsBibleModalOpen(false)}
        onPushSlideToLive={handlePushSlideToLiveDirect}
        initialSearchQuery={searchInitialQuery}
      />

      <SongLibraryModal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        onAddSongItem={handleAddSongItem}
        onPushSlideToLive={handlePushSlideToLiveDirect}
        initialQuery={searchInitialQuery}
      />

      <AIMediaGeneratorModal
        isOpen={isMediaGenOpen}
        onClose={() => setIsMediaGenOpen(false)}
        activeSlide={currentItem?.slides[activeSlideIndex] || null}
        onUpdateSlideBg={(bgUrl) => {
          if (currentItem && currentItem.slides[activeSlideIndex]) {
            handleUpdateSlide(currentItem.slides[activeSlideIndex].id, {
              bgImageUrl: bgUrl
            });
          }
        }}
        initialPrompt={searchInitialQuery}
      />

      <AlertOverlayModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onSendAlert={(alert) => setAlertOverlay(alert)}
      />

      <ScheduleItemSettingsModal
        isOpen={isScheduleSettingsOpen}
        onClose={() => setIsScheduleSettingsOpen(false)}
        scheduleItem={settingsModalItem}
        onUpdateScheduleItem={handleUpdateScheduleItemFields}
        onDeleteScheduleItem={handleDeleteScheduleItem}
        liveSlideId={liveSlide?.id}
        onPushSlideToLiveDirect={handlePushSlideToLiveDirect}
        openMediaGenerator={() => setIsMediaGenOpen(true)}
      />
    </div>
  );
}
