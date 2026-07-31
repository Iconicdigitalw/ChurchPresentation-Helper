/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
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
import { ConfirmDialog, ConfirmRequest } from './components/ConfirmDialog';
import { RestoreSessionPrompt } from './components/RestoreSessionPrompt';
import {
  getSavedShortcuts,
  getAppSettings,
  ShortcutBinding
} from './data/settingsAndTemplates';
import {
  PersistedSchedule,
  clearPersistedSchedule,
  loadPersistedSchedule,
  savePersistedSchedule
} from './data/schedulePersistence';
import {
  createInitialScheduleState,
  getCurrentItem,
  getNextSlide,
  scheduleReducer
} from './state/scheduleReducer';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useActiveKeyScope } from './hooks/useActiveKeyScope';
import { broadcastLiveSlideState } from './utils/liveDisplayManager';

/** How long to wait after the last edit before writing the schedule to storage. */
const AUTOSAVE_DEBOUNCE_MS = 700;

export default function App() {
  // Running order, selection and live output all live in one reducer so the
  // live-slide invariants cannot drift apart across handlers.
  const [state, dispatch] = useReducer(
    scheduleReducer,
    INITIAL_SCHEDULE,
    createInitialScheduleState
  );
  const { schedule, selectedScheduleId, activeSlideIndex, liveSlide, quickState } = state;

  const [isLiveOutputOn, setIsLiveOutputOn] = useState<boolean>(true);
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

  // Destructive-action guard
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  // Autosave / restore
  const [restorable, setRestorable] = useState<PersistedSchedule | null>(null);
  const [isAutosaveArmed, setIsAutosaveArmed] = useState(false);
  const [persistenceNotice, setPersistenceNotice] = useState<string | null>(null);

  // Resizable Column Widths
  const [scheduleWidth, setScheduleWidth] = useState(280);
  const [livePreviewWidth, setLivePreviewWidth] = useState(360);

  const currentItem = getCurrentItem(state);
  const nextSlide = getNextSlide(state);

  // ---------------------------------------------------------------------------
  // Autosave & restore
  // ---------------------------------------------------------------------------

  // Look for an autosaved plan once, before autosave is allowed to run - writing
  // the default schedule first would destroy whatever we are offering to restore.
  useEffect(() => {
    const saved = loadPersistedSchedule();
    if (saved) {
      setRestorable(saved);
    } else {
      setIsAutosaveArmed(true);
    }
  }, []);

  const autosaveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isAutosaveArmed) return;

    window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      const outcome = savePersistedSchedule(schedule, selectedScheduleId, activeSlideIndex);
      if (outcome.status === 'failed') {
        setPersistenceNotice(outcome.reason);
      } else if (outcome.backgroundsDropped) {
        setPersistenceNotice(
          'Service plan saved, but generated backgrounds were too large to store.'
        );
      } else {
        setPersistenceNotice(null);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(autosaveTimer.current);
  }, [isAutosaveArmed, schedule, selectedScheduleId, activeSlideIndex]);

  const handleRestoreSession = useCallback(() => {
    if (!restorable) return;
    dispatch({
      type: 'restore',
      schedule: restorable.schedule,
      selectedScheduleId: restorable.selectedScheduleId,
      activeSlideIndex: restorable.activeSlideIndex
    });
    setRestorable(null);
    setIsAutosaveArmed(true);
  }, [restorable]);

  const handleDismissRestore = useCallback(() => {
    clearPersistedSchedule();
    setRestorable(null);
    setIsAutosaveArmed(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Live output
  // ---------------------------------------------------------------------------

  // Broadcast live slide state to external popout display window in real time
  useEffect(() => {
    broadcastLiveSlideState(
      isLiveOutputOn ? liveSlide : null,
      quickState,
      alertOverlay ? `${alertOverlay.title}: ${alertOverlay.message}` : null
    );
  }, [liveSlide, isLiveOutputOn, quickState, alertOverlay]);

  const setQuickState = useCallback((next: QuickState) => {
    dispatch({ type: 'setQuickState', quickState: next });
  }, []);

  const handlePushSlideToLiveDirect = useCallback((slide: Slide) => {
    dispatch({ type: 'pushSlideLive', slide });
  }, []);

  // ---------------------------------------------------------------------------
  // Search & modals
  // ---------------------------------------------------------------------------

  const openQuickSearchWithMode = useCallback(
    (query: string = '') => {
      setSearchInitialQuery(query);
      if (searchMode === 'bible') setIsBibleModalOpen(true);
      else if (searchMode === 'songs') setIsSongModalOpen(true);
      else if (searchMode === 'visuals') setIsMediaGenOpen(true);
      else if (searchMode === 'deck') setIsPresentationBuilderOpen(true);
    },
    [searchMode]
  );

  const isAnyModalOpen =
    isSermonModalOpen ||
    isPresentationBuilderOpen ||
    isBibleModalOpen ||
    isSongModalOpen ||
    isMediaGenOpen ||
    isAlertModalOpen ||
    isScheduleSettingsOpen ||
    confirmRequest !== null;

  const shortcutHandlers = useMemo(
    () => ({
      onNextSlide: () => dispatch({ type: 'nextSlide' }),
      onPrevSlide: () => dispatch({ type: 'prevSlide' }),
      onNextItem: () => dispatch({ type: 'nextItem' }),
      onPrevItem: () => dispatch({ type: 'prevItem' }),
      onPushLive: () => dispatch({ type: 'pushActiveSlideLive' }),
      onToggleQuickState: (next: QuickState) => dispatch({ type: 'toggleQuickState', quickState: next }),
      onToggleLiveOutput: () => setIsLiveOutputOn(prev => !prev),
      onOpenLiveCompanion: () => setIsLiveCompanionOpen(true),
      onOpenBible: () => {
        setSearchInitialQuery('');
        setIsBibleModalOpen(true);
      },
      onOpenSongs: () => {
        setSearchInitialQuery('');
        setIsSongModalOpen(true);
      },
      onOpenDeck: () => setIsPresentationBuilderOpen(true),
      onCycleSearchMode: () =>
        setSearchMode(prev =>
          prev === 'bible' ? 'songs' : prev === 'songs' ? 'visuals' : prev === 'visuals' ? 'deck' : 'bible'
        ),
      onQuickSearch: openQuickSearchWithMode
    }),
    [openQuickSearchWithMode]
  );

  // Arrow keys mean different things depending on which panel the operator is
  // working in, so the console tracks the active region.
  const activeKeyScope = useActiveKeyScope();

  useGlobalShortcuts({
    shortcuts,
    enabled: !isAnyModalOpen,
    activeScope: activeKeyScope,
    handlers: shortcutHandlers
  });

  // ---------------------------------------------------------------------------
  // Schedule & slide mutations
  // ---------------------------------------------------------------------------

  const handleOpenScheduleSettings = (item: ScheduleItem) => {
    setSettingsModalItem(item);
    setIsScheduleSettingsOpen(true);
  };

  const handleUpdateScheduleItemFields = (itemId: string, updatedFields: Partial<ScheduleItem>) => {
    dispatch({ type: 'updateItemFields', id: itemId, fields: updatedFields });
    setSettingsModalItem(prev => (prev && prev.id === itemId ? { ...prev, ...updatedFields } : prev));
  };

  const handleDeleteScheduleItem = (id: string) => {
    const item = schedule.find(i => i.id === id);
    if (!item) return;

    if (schedule.length <= 1) {
      setConfirmRequest({
        title: 'Cannot remove the last item',
        message: 'The service schedule must contain at least one item.',
        confirmLabel: 'OK',
        cancelLabel: 'Close',
        onConfirm: () => undefined
      });
      return;
    }

    setConfirmRequest({
      title: `Delete "${item.title}"?`,
      message: `This removes the item and all ${item.slides.length} of its slides from the service schedule. This cannot be undone.`,
      confirmLabel: 'Delete item',
      onConfirm: () => {
        dispatch({ type: 'deleteItem', id });
        // The settings modal may be open on the item being removed.
        if (settingsModalItem?.id === id) {
          setIsScheduleSettingsOpen(false);
          setSettingsModalItem(null);
        }
      }
    });
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
    dispatch({ type: 'addItem', item: newItem });
  };

  const handleAddConvertedDeck = (item: ScheduleItem) => {
    dispatch({ type: 'addItem', item });
  };

  const handleDeleteSlide = (slideId: string) => {
    if (!currentItem) return;

    if (currentItem.slides.length <= 1) {
      setConfirmRequest({
        title: 'Cannot remove the last slide',
        message: 'A schedule item must contain at least one slide.',
        confirmLabel: 'OK',
        cancelLabel: 'Close',
        onConfirm: () => undefined
      });
      return;
    }

    const slide = currentItem.slides.find(s => s.id === slideId);
    const isLive = liveSlide?.id === slideId;

    setConfirmRequest({
      title: 'Delete this slide?',
      message: isLive
        ? `"${slide?.header || 'This slide'}" is currently on the live output. Deleting it will move the live output to the previous slide.`
        : `"${slide?.header || 'This slide'}" will be removed from "${currentItem.title}". This cannot be undone.`,
      confirmLabel: 'Delete slide',
      onConfirm: () => dispatch({ type: 'deleteSlide', slideId })
    });
  };

  // ---------------------------------------------------------------------------
  // Panel resizing
  // ---------------------------------------------------------------------------

  const startColumnResize = (
    event: React.MouseEvent,
    startWidth: number,
    apply: (width: number) => void,
    { invert = false, min, max }: { invert?: boolean; min: number; max: number }
  ) => {
    event.preventDefault();
    const startX = event.clientX;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = invert ? startX - moveEvent.clientX : moveEvent.clientX - startX;
      apply(Math.min(Math.max(startWidth + delta, min), max));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
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
            onSelectScheduleItem={(id) => dispatch({ type: 'selectItem', id })}
            onMoveItem={(index, direction) => dispatch({ type: 'moveItem', index, direction })}
            onReorderItems={(items) => dispatch({ type: 'reorderItems', items })}
            onDeleteItem={handleDeleteScheduleItem}
            onOpenSettingsModal={handleOpenScheduleSettings}
            openSermonConverter={() => setIsSermonModalOpen(true)}
            openPresentationBuilder={() => setIsPresentationBuilderOpen(true)}
            openBibleLibrary={() => setIsBibleModalOpen(true)}
            openSongLibrary={() => setIsSongModalOpen(true)}
            openMediaGenerator={() => setIsMediaGenOpen(true)}
            onAddCustomItem={handleAddCustomScheduleItem}
            onPushSlideToLive={handlePushSlideToLiveDirect}
            customWidth={scheduleWidth}
          />

          {/* Left Vertical Resizer Handle */}
          <div
            onMouseDown={(e) =>
              startColumnResize(e, scheduleWidth, setScheduleWidth, { min: 180, max: 550 })
            }
            className="hidden lg:flex w-1.5 hover:w-2 bg-slate-800 hover:bg-amber-500/80 active:bg-amber-500 cursor-col-resize transition-all items-center justify-center shrink-0 z-20 group"
            title="Drag to adjust schedule panel width"
          >
            <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-slate-950 rounded-full" />
          </div>

          {/* Slide Operator Grid */}
          <SlideGridPanel
            currentItem={currentItem}
            activeSlideIndex={activeSlideIndex}
            onSelectSlide={(index, goLive) => dispatch({ type: 'selectSlide', index, goLive })}
            onUpdateSlide={(slideId, patch) => dispatch({ type: 'updateSlide', slideId, patch })}
            onAddSlide={() => dispatch({ type: 'addSlide' })}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={(slide) => dispatch({ type: 'duplicateSlide', slide })}
            liveSlideId={liveSlide?.id || null}
            openMediaGenerator={() => setIsMediaGenOpen(true)}
            slideActivationMode={slideActivationMode}
            onOpenSettingsModal={handleOpenScheduleSettings}
            liveSlide={liveSlide}
            schedule={schedule}
            onPushSlideToLive={handlePushSlideToLiveDirect}
            onPreviewSlide={(slide) => dispatch({ type: 'previewSlide', slide })}
            onAddScriptureItem={(item) => dispatch({ type: 'addItem', item })}
            onAddSongItem={(item) => dispatch({ type: 'addItem', item })}
          />

          {/* Right Vertical Resizer Handle */}
          <div
            onMouseDown={(e) =>
              startColumnResize(e, livePreviewWidth, setLivePreviewWidth, {
                invert: true,
                min: 220,
                max: 650
              })
            }
            className="hidden lg:flex w-1.5 hover:w-2 bg-slate-800 hover:bg-amber-500/80 active:bg-amber-500 cursor-col-resize transition-all items-center justify-center shrink-0 z-20 group"
            title="Drag to adjust live preview panel width"
          >
            <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-slate-950 rounded-full" />
          </div>

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
            onGoNextSlide={() => dispatch({ type: 'nextSlide' })}
            onGoPrevSlide={() => dispatch({ type: 'prevSlide' })}
            onPushLive={() => dispatch({ type: 'pushActiveSlideLive' })}
            openStageView={() => setActiveViewMode('confidence')}
            activeViewMode={activeViewMode}
            setActiveViewMode={setActiveViewMode}
            customWidth={livePreviewWidth}
          />

          {/* Autosave recovery offer */}
          {restorable && (
            <RestoreSessionPrompt
              savedAt={restorable.savedAt}
              itemCount={restorable.schedule.length}
              onRestore={handleRestoreSession}
              onDismiss={handleDismissRestore}
            />
          )}

          {/* Autosave degraded / unavailable */}
          {persistenceNotice && (
            <div className="absolute bottom-4 right-4 z-40 max-w-xs px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-[11px] font-semibold text-amber-300 shadow-xl">
              {persistenceNotice}
            </div>
          )}
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
        onAddSongItem={(item) => dispatch({ type: 'addItem', item })}
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
        onAddSongItem={(item) => dispatch({ type: 'addItem', item })}
        onPushSlideToLive={handlePushSlideToLiveDirect}
        initialQuery={searchInitialQuery}
      />

      <AIMediaGeneratorModal
        isOpen={isMediaGenOpen}
        onClose={() => setIsMediaGenOpen(false)}
        activeSlide={currentItem?.slides[activeSlideIndex] || null}
        onUpdateSlideBg={(bgUrl) => {
          const target = currentItem?.slides[activeSlideIndex];
          if (target) {
            dispatch({ type: 'updateSlide', slideId: target.id, patch: { bgImageUrl: bgUrl } });
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

      {/* Guard for irreversible schedule/slide deletions */}
      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  );
}
