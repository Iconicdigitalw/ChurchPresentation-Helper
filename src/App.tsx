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

  // Modals state
  const [isSermonModalOpen, setIsSermonModalOpen] = useState(false);
  const [isPresentationBuilderOpen, setIsPresentationBuilderOpen] = useState(false);
  const [isLiveCompanionOpen, setIsLiveCompanionOpen] = useState(false);
  const [isBibleModalOpen, setIsBibleModalOpen] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isMediaGenOpen, setIsMediaGenOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const openQuickSearchWithMode = useCallback((query: string = '') => {
    setSearchInitialQuery(query);
    if (searchMode === 'bible') {
      setIsBibleModalOpen(true);
    } else if (searchMode === 'songs') {
      setIsSongModalOpen(true);
    } else if (searchMode === 'visuals') {
      setIsMediaGenOpen(true);
    }
  }, [searchMode]);

  // Currently selected item
  const currentItem = schedule.find(item => item.id === selectedScheduleId) || null;

  // Calculate Next Slide
  const getNextSlide = useCallback((): Slide | null => {
    if (!currentItem) return null;

    if (activeSlideIndex < currentItem.slides.length - 1) {
      return currentItem.slides[activeSlideIndex + 1];
    }

    // If at end of current item, find first slide of next item
    const currentItemIndex = schedule.findIndex(i => i.id === selectedScheduleId);
    if (currentItemIndex >= 0 && currentItemIndex < schedule.length - 1) {
      const nextItem = schedule[currentItemIndex + 1];
      return nextItem.slides[0] || null;
    }

    return null;
  }, [currentItem, activeSlideIndex, schedule, selectedScheduleId]);

  const nextSlide = getNextSlide();

  // Navigation handlers
  const handleSelectScheduleItem = (id: string) => {
    setSelectedScheduleId(id);
    setActiveSlideIndex(0);
    const item = schedule.find(i => i.id === id);
    if (item && item.slides.length > 0) {
      setLiveSlide(item.slides[0]);
    }
  };

  const handleSelectSlide = (index: number, goLive: boolean) => {
    setActiveSlideIndex(index);
    if (currentItem && currentItem.slides[index]) {
      if (goLive) {
        setLiveSlide(currentItem.slides[index]);
        if (quickState !== 'normal') setQuickState('normal');
      }
    }
  };

  const handleGoNextSlide = useCallback(() => {
    if (!currentItem) return;

    if (activeSlideIndex < currentItem.slides.length - 1) {
      const nextIdx = activeSlideIndex + 1;
      setActiveSlideIndex(nextIdx);
      setLiveSlide(currentItem.slides[nextIdx]);
      if (quickState !== 'normal') setQuickState('normal');
    } else {
      // Advance to next schedule item
      const currentItemIndex = schedule.findIndex(i => i.id === selectedScheduleId);
      if (currentItemIndex >= 0 && currentItemIndex < schedule.length - 1) {
        const nextItem = schedule[currentItemIndex + 1];
        setSelectedScheduleId(nextItem.id);
        setActiveSlideIndex(0);
        if (nextItem.slides[0]) {
          setLiveSlide(nextItem.slides[0]);
          if (quickState !== 'normal') setQuickState('normal');
        }
      }
    }
  }, [currentItem, activeSlideIndex, schedule, selectedScheduleId, quickState]);

  const handleGoPrevSlide = useCallback(() => {
    if (!currentItem) return;

    if (activeSlideIndex > 0) {
      const prevIdx = activeSlideIndex - 1;
      setActiveSlideIndex(prevIdx);
      setLiveSlide(currentItem.slides[prevIdx]);
      if (quickState !== 'normal') setQuickState('normal');
    } else {
      // Go to previous schedule item last slide
      const currentItemIndex = schedule.findIndex(i => i.id === selectedScheduleId);
      if (currentItemIndex > 0) {
        const prevItem = schedule[currentItemIndex - 1];
        setSelectedScheduleId(prevItem.id);
        const lastIdx = Math.max(0, prevItem.slides.length - 1);
        setActiveSlideIndex(lastIdx);
        if (prevItem.slides[lastIdx]) {
          setLiveSlide(prevItem.slides[lastIdx]);
          if (quickState !== 'normal') setQuickState('normal');
        }
      }
    }
  }, [currentItem, activeSlideIndex, schedule, selectedScheduleId, quickState]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea or modal open
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) ||
        isSermonModalOpen ||
        isBibleModalOpen ||
        isSongModalOpen ||
        isMediaGenOpen ||
        isAlertModalOpen
      ) {
        return;
      }

      // Check for Slash or Ctrl+K / Cmd+K
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        openQuickSearchWithMode('');
        return;
      }

      // Speed Typing Quick Search Trigger
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

      switch (e.key) {
        case ' ':
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          handleGoNextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          handleGoPrevSlide();
          break;
        case 'F2':
          e.preventDefault();
          setQuickState(prev => prev === 'clearText' ? 'normal' : 'clearText');
          break;
        case 'F3':
          e.preventDefault();
          setQuickState(prev => prev === 'clearBg' ? 'normal' : 'clearBg');
          break;
        case 'F4':
          e.preventDefault();
          setQuickState(prev => prev === 'black' ? 'normal' : 'black');
          break;
        case 'F5':
          e.preventDefault();
          setQuickState(prev => prev === 'logo' ? 'normal' : 'logo');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleGoNextSlide,
    handleGoPrevSlide,
    isSermonModalOpen,
    isBibleModalOpen,
    isSongModalOpen,
    isMediaGenOpen,
    isAlertModalOpen,
    openQuickSearchWithMode
  ]);

  // Schedule Modification Handlers
  const handleMoveScheduleItem = (index: number, direction: 'up' | 'down') => {
    const newSchedule = [...schedule];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSchedule.length) return;

    const temp = newSchedule[index];
    newSchedule[index] = newSchedule[targetIdx];
    newSchedule[targetIdx] = temp;
    setSchedule(newSchedule);
  };

  const handleDeleteScheduleItem = (id: string) => {
    const updated = schedule.filter(i => i.id !== id);
    setSchedule(updated);
    if (selectedScheduleId === id && updated.length > 0) {
      setSelectedScheduleId(updated[0].id);
      setActiveSlideIndex(0);
    }
  };

  const handleAddConvertedDeck = (newItem: ScheduleItem) => {
    setSchedule(prev => [...prev, newItem]);
    setSelectedScheduleId(newItem.id);
    setActiveSlideIndex(0);
    if (newItem.slides[0]) setLiveSlide(newItem.slides[0]);
  };

  const handlePushSlideToLiveDirect = (slide: Slide) => {
    setLiveSlide(slide);
    if (quickState !== 'normal') setQuickState('normal');
  };

  const handleUpdateSlide = (slideId: string, updatedProps: Partial<Slide>) => {
    setSchedule(prev =>
      prev.map(item => {
        if (item.id !== selectedScheduleId) return item;
        return {
          ...item,
          slides: item.slides.map(s => (s.id === slideId ? { ...s, ...updatedProps } : s))
        };
      })
    );

    if (liveSlide && liveSlide.id === slideId) {
      setLiveSlide(prev => prev ? { ...prev, ...updatedProps } : null);
    }
  };

  const handleAddSlide = () => {
    if (!currentItem) return;
    const newSlide: Slide = {
      id: `custom-s-${Date.now()}`,
      type: 'point',
      header: 'NEW SLIDE',
      body: 'Click edit button to add slide content.',
      themeStyle: 'gold-divine'
    };

    setSchedule(prev =>
      prev.map(item => {
        if (item.id !== currentItem.id) return item;
        return {
          ...item,
          slides: [...item.slides, newSlide]
        };
      })
    );
  };

  const handleDeleteSlide = (slideId: string) => {
    if (!currentItem) return;
    setSchedule(prev =>
      prev.map(item => {
        if (item.id !== currentItem.id) return item;
        return {
          ...item,
          slides: item.slides.filter(s => s.id !== slideId)
        };
      })
    );
  };

  const handleDuplicateSlide = (slide: Slide) => {
    if (!currentItem) return;
    const duplicated: Slide = {
      ...slide,
      id: `dup-s-${Date.now()}`,
      header: `${slide.header} (Copy)`
    };

    setSchedule(prev =>
      prev.map(item => {
        if (item.id !== currentItem.id) return item;
        return {
          ...item,
          slides: [...item.slides, duplicated]
        };
      })
    );
  };

  const handleApplyBackgroundImage = (imageUrl: string) => {
    if (!currentItem) return;

    // Apply background image to current slide or all slides in current item
    setSchedule(prev =>
      prev.map(item => {
        if (item.id !== currentItem.id) return item;
        return {
          ...item,
          slides: item.slides.map((s, idx) =>
            idx === activeSlideIndex ? { ...s, bgImageUrl: imageUrl } : s
          )
        };
      })
    );

    if (liveSlide) {
      setLiveSlide(prev => (prev ? { ...prev, bgImageUrl: imageUrl } : null));
    }
  };

  const handleAddCustomScheduleItem = () => {
    const newItem: ScheduleItem = {
      id: `custom-item-${Date.now()}`,
      title: 'Custom Announcement',
      type: 'announcement',
      activeSlideIndex: 0,
      slides: [
        {
          id: `custom-s-${Date.now()}`,
          type: 'title',
          header: 'CHURCH ANNOUNCEMENT',
          body: 'Enter your custom announcement text here.',
          themeStyle: 'gold-divine'
        }
      ]
    };
    handleAddConvertedDeck(newItem);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Navbar */}
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
      />

      {/* Main Workspace Layout */}
      {activeViewMode === 'operator' ? (
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Order of Service Schedule Panel */}
          <SchedulePanel
            schedule={schedule}
            selectedScheduleId={selectedScheduleId}
            onSelectScheduleItem={handleSelectScheduleItem}
            onMoveItem={handleMoveScheduleItem}
            onDeleteItem={handleDeleteScheduleItem}
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
          />

          {/* Program Live & Next Preview Panel */}
          <LivePreviewPanel
            liveSlide={liveSlide}
            nextSlide={nextSlide}
            isLiveOutputOn={isLiveOutputOn}
            quickState={quickState}
            setQuickState={setQuickState}
            alertOverlay={alertOverlay}
            onClearAlert={() => setAlertOverlay(null)}
            onGoNextSlide={handleGoNextSlide}
            onGoPrevSlide={handleGoPrevSlide}
            openStageView={() => setActiveViewMode('confidence')}
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
        isMicActive={isMicActive}
        setIsMicActive={setIsMicActive}
      />

      <BibleLibraryModal
        isOpen={isBibleModalOpen}
        onClose={() => setIsBibleModalOpen(false)}
        onAddScriptureItem={handleAddConvertedDeck}
        onPushSlideToLive={handlePushSlideToLiveDirect}
        initialQuery={searchInitialQuery}
      />

      <SongLibraryModal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        onAddSongItem={handleAddConvertedDeck}
        onPushSlideToLive={handlePushSlideToLiveDirect}
        initialQuery={searchInitialQuery}
      />

      <AIMediaGeneratorModal
        isOpen={isMediaGenOpen}
        onClose={() => setIsMediaGenOpen(false)}
        onApplyBackgroundImage={handleApplyBackgroundImage}
        initialQuery={searchInitialQuery}
      />

      <AlertOverlayModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onSendAlert={(alert) => setAlertOverlay(alert)}
        onClearAlert={() => setAlertOverlay(null)}
        currentAlert={alertOverlay}
      />
    </div>
  );
}
