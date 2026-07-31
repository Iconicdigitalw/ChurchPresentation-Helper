import { QuickState, ScheduleItem, Slide } from '../types';

/**
 * Single source of truth for the running order and what is currently on screen.
 *
 * These transitions used to live as a dozen handlers in App.tsx, each repeating
 * the same `schedule.map(item => item.id === current.id ? ... : item)` dance and
 * each having to remember to keep `liveSlide` in sync. Centralising them here
 * makes the live-output invariants testable and impossible to forget.
 */

export interface ScheduleState {
  schedule: ScheduleItem[];
  selectedScheduleId: string | null;
  activeSlideIndex: number;
  liveSlide: Slide | null;
  previewOverrideSlide: Slide | null;
  quickState: QuickState;
}

export type ScheduleAction =
  | { type: 'restore'; schedule: ScheduleItem[]; selectedScheduleId: string | null; activeSlideIndex: number }
  | { type: 'selectItem'; id: string }
  | { type: 'selectSlide'; index: number; goLive: boolean }
  | { type: 'nextSlide' }
  | { type: 'prevSlide' }
  | { type: 'nextItem' }
  | { type: 'prevItem' }
  | { type: 'pushActiveSlideLive' }
  | { type: 'pushSlideLive'; slide: Slide }
  | { type: 'previewSlide'; slide: Slide | null }
  | { type: 'addItem'; item: ScheduleItem }
  | { type: 'deleteItem'; id: string }
  | { type: 'moveItem'; index: number; direction: 'up' | 'down' }
  | { type: 'reorderItems'; items: ScheduleItem[] }
  | { type: 'updateItemFields'; id: string; fields: Partial<ScheduleItem> }
  | { type: 'addSlide' }
  | { type: 'updateSlide'; slideId: string; patch: Partial<Slide> }
  | { type: 'deleteSlide'; slideId: string }
  | { type: 'duplicateSlide'; slide: Slide }
  | { type: 'setQuickState'; quickState: QuickState }
  | { type: 'toggleQuickState'; quickState: QuickState };

export function getCurrentItem(state: ScheduleState): ScheduleItem | null {
  return state.schedule.find(item => item.id === state.selectedScheduleId) || null;
}

/** The slide staged after the live one, rolling into the next schedule item. */
export function getNextSlide(state: ScheduleState): Slide | null {
  if (state.previewOverrideSlide) return state.previewOverrideSlide;

  const current = getCurrentItem(state);
  if (!current) return null;

  if (state.activeSlideIndex < current.slides.length - 1) {
    return current.slides[state.activeSlideIndex + 1];
  }

  const idx = state.schedule.findIndex(i => i.id === state.selectedScheduleId);
  if (idx >= 0 && idx < state.schedule.length - 1) {
    return state.schedule[idx + 1].slides[0] || null;
  }
  return null;
}

/** Rewrites one item's slides, keeping `liveSlide` pointed at the same slide id. */
function withSlides(
  state: ScheduleState,
  itemId: string,
  nextSlides: Slide[],
  overrides: Partial<ScheduleState> = {}
): ScheduleState {
  const schedule = state.schedule.map(item =>
    item.id === itemId ? { ...item, slides: nextSlides } : item
  );

  const liveSlide = state.liveSlide
    ? nextSlides.find(s => s.id === state.liveSlide!.id) ?? state.liveSlide
    : state.liveSlide;

  return { ...state, schedule, liveSlide, ...overrides };
}

/** Going live always clears any transient blank/logo state. */
function goLive(state: ScheduleState, slide: Slide | null, overrides: Partial<ScheduleState> = {}): ScheduleState {
  return {
    ...state,
    liveSlide: slide,
    previewOverrideSlide: null,
    quickState: 'normal',
    ...overrides
  };
}

export function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'restore': {
      const selected =
        action.schedule.find(i => i.id === action.selectedScheduleId) || action.schedule[0] || null;
      const index = selected
        ? Math.min(Math.max(action.activeSlideIndex, 0), Math.max(selected.slides.length - 1, 0))
        : 0;
      return {
        ...state,
        schedule: action.schedule,
        selectedScheduleId: selected?.id ?? null,
        activeSlideIndex: index,
        liveSlide: selected?.slides[index] ?? null,
        previewOverrideSlide: null,
        quickState: 'normal'
      };
    }

    case 'selectItem':
      return { ...state, selectedScheduleId: action.id, activeSlideIndex: 0 };

    case 'selectSlide': {
      const current = getCurrentItem(state);
      const slide = current?.slides[action.index];
      const next = { ...state, activeSlideIndex: action.index };
      return action.goLive && slide ? goLive(next, slide) : next;
    }

    case 'nextSlide': {
      const current = getCurrentItem(state);
      if (!current) return state;

      if (state.activeSlideIndex < current.slides.length - 1) {
        const index = state.activeSlideIndex + 1;
        return goLive(state, current.slides[index], { activeSlideIndex: index });
      }

      const idx = state.schedule.findIndex(i => i.id === state.selectedScheduleId);
      if (idx >= 0 && idx < state.schedule.length - 1) {
        const nextItem = state.schedule[idx + 1];
        return goLive(state, nextItem.slides[0] ?? null, {
          selectedScheduleId: nextItem.id,
          activeSlideIndex: 0
        });
      }
      return state;
    }

    case 'prevSlide': {
      const current = getCurrentItem(state);
      if (!current) return state;

      if (state.activeSlideIndex > 0) {
        const index = state.activeSlideIndex - 1;
        return goLive(state, current.slides[index], { activeSlideIndex: index });
      }

      const idx = state.schedule.findIndex(i => i.id === state.selectedScheduleId);
      if (idx > 0) {
        const prevItem = state.schedule[idx - 1];
        const lastIndex = Math.max(0, prevItem.slides.length - 1);
        return goLive(state, prevItem.slides[lastIndex] ?? null, {
          selectedScheduleId: prevItem.id,
          activeSlideIndex: lastIndex
        });
      }
      return state;
    }

    case 'nextItem': {
      const idx = state.schedule.findIndex(i => i.id === state.selectedScheduleId);
      if (idx < 0 || idx >= state.schedule.length - 1) return state;
      return { ...state, selectedScheduleId: state.schedule[idx + 1].id, activeSlideIndex: 0 };
    }

    case 'prevItem': {
      const idx = state.schedule.findIndex(i => i.id === state.selectedScheduleId);
      if (idx <= 0) return state;
      return { ...state, selectedScheduleId: state.schedule[idx - 1].id, activeSlideIndex: 0 };
    }

    case 'pushActiveSlideLive': {
      const current = getCurrentItem(state);
      const slide = current?.slides[state.activeSlideIndex];
      return slide ? goLive(state, slide) : state;
    }

    case 'pushSlideLive':
      return goLive(state, action.slide);

    case 'previewSlide':
      return { ...state, previewOverrideSlide: action.slide };

    case 'addItem':
      return goLive(
        { ...state, schedule: [...state.schedule, action.item] },
        action.item.slides[0] ?? state.liveSlide,
        { selectedScheduleId: action.item.id, activeSlideIndex: 0 }
      );

    case 'deleteItem': {
      // Never leave the operator with an empty running order.
      if (state.schedule.length <= 1) return state;

      const schedule = state.schedule.filter(item => item.id !== action.id);
      if (state.selectedScheduleId !== action.id) return { ...state, schedule };

      const fallback = schedule[0];
      return {
        ...state,
        schedule,
        selectedScheduleId: fallback.id,
        activeSlideIndex: 0,
        liveSlide: fallback.slides[0] ?? null,
        previewOverrideSlide: null
      };
    }

    case 'moveItem': {
      const target = action.direction === 'up' ? action.index - 1 : action.index + 1;
      if (target < 0 || target >= state.schedule.length) return state;
      const schedule = [...state.schedule];
      const [moved] = schedule.splice(action.index, 1);
      schedule.splice(target, 0, moved);
      return { ...state, schedule };
    }

    case 'reorderItems':
      return { ...state, schedule: action.items };

    case 'updateItemFields': {
      const schedule = state.schedule.map(item =>
        item.id === action.id ? { ...item, ...action.fields } : item
      );
      const updated = schedule.find(item => item.id === action.id);
      const liveSlide =
        state.liveSlide && updated
          ? updated.slides.find(s => s.id === state.liveSlide!.id) ?? state.liveSlide
          : state.liveSlide;
      return { ...state, schedule, liveSlide };
    }

    case 'addSlide': {
      const current = getCurrentItem(state);
      if (!current) return state;

      const newSlide: Slide = {
        id: `slide-${Date.now()}`,
        type: 'point',
        header: 'New Slide Header',
        body: 'Click edit icon to customize text content, scriptures, or speaker notes.',
        themeStyle: 'modern-dark'
      };

      const slides = [...current.slides];
      slides.splice(state.activeSlideIndex + 1, 0, newSlide);
      return withSlides(state, current.id, slides, { activeSlideIndex: state.activeSlideIndex + 1 });
    }

    case 'updateSlide': {
      const current = getCurrentItem(state);
      if (!current) return state;
      const slides = current.slides.map(s =>
        s.id === action.slideId ? { ...s, ...action.patch } : s
      );
      return withSlides(state, current.id, slides);
    }

    case 'deleteSlide': {
      const current = getCurrentItem(state);
      if (!current || current.slides.length <= 1) return state;

      const slides = current.slides.filter(s => s.id !== action.slideId);
      const activeSlideIndex = Math.min(
        Math.max(0, state.activeSlideIndex - 1),
        slides.length - 1
      );

      const next = withSlides(state, current.id, slides, { activeSlideIndex });
      // The deleted slide may have been on screen - fall back to the new active one.
      if (state.liveSlide?.id === action.slideId) {
        return { ...next, liveSlide: slides[activeSlideIndex] ?? null };
      }
      return next;
    }

    case 'duplicateSlide': {
      const current = getCurrentItem(state);
      if (!current) return state;

      const copy: Slide = {
        ...action.slide,
        id: `slide-dup-${Date.now()}`,
        header: action.slide.header ? `${action.slide.header} (Copy)` : 'Copy'
      };

      const slides = [...current.slides];
      slides.splice(state.activeSlideIndex + 1, 0, copy);
      return withSlides(state, current.id, slides, { activeSlideIndex: state.activeSlideIndex + 1 });
    }

    case 'setQuickState':
      return { ...state, quickState: action.quickState };

    case 'toggleQuickState':
      return {
        ...state,
        quickState: state.quickState === action.quickState ? 'normal' : action.quickState
      };

    default:
      return state;
  }
}

export function createInitialScheduleState(schedule: ScheduleItem[]): ScheduleState {
  const first = schedule[0] ?? null;
  return {
    schedule,
    selectedScheduleId: first?.id ?? null,
    activeSlideIndex: 0,
    liveSlide: first?.slides[0] ?? null,
    previewOverrideSlide: null,
    quickState: 'normal'
  };
}
