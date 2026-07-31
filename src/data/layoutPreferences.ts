/**
 * Remembers how the operator has arranged the console.
 *
 * Panel widths, the bottom dock height and the view toggles all used to reset on
 * every reload, so an operator who had sized the console for their booth had to
 * redo it before each service. These preferences are written back as they change
 * and restored on load, clamped to whatever screen the console opens on next.
 */

const LAYOUT_PREFERENCES_KEY = 'WORSHIPAL_LAYOUT_PREFERENCES_V1';

/** Writes are debounced because dragging a resizer fires continuously. */
const SAVE_DEBOUNCE_MS = 200;

export type SlideLayoutMode = 'grid' | 'list';
export type SlideThumbnailSize = 'small' | 'medium' | 'large';
export type LivePreviewMode = 'operator' | 'stage';
export type ContextTab = 'bible' | 'songs' | 'presentation';

export interface LayoutPreferences {
  scheduleWidth: number;
  livePreviewWidth: number;
  contextDockHeight: number;
  contextDockExpanded: boolean;
  contextTab: ContextTab;
  slideLayoutMode: SlideLayoutMode;
  slideThumbnailSize: SlideThumbnailSize;
  livePreviewMode: LivePreviewMode;
}

export const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferences = {
  scheduleWidth: 280,
  livePreviewWidth: 360,
  contextDockHeight: 280,
  contextDockExpanded: false,
  contextTab: 'bible',
  slideLayoutMode: 'grid',
  slideThumbnailSize: 'medium',
  livePreviewMode: 'operator'
};

/** Matches the bounds enforced by each resizer. */
const NUMERIC_BOUNDS: Record<string, { min: number; max: number }> = {
  scheduleWidth: { min: 180, max: 550 },
  livePreviewWidth: { min: 220, max: 650 },
  contextDockHeight: { min: 120, max: 650 }
};

const ALLOWED_VALUES: Record<string, readonly string[]> = {
  contextTab: ['bible', 'songs', 'presentation'],
  slideLayoutMode: ['grid', 'list'],
  slideThumbnailSize: ['small', 'medium', 'large'],
  livePreviewMode: ['operator', 'stage']
};

function clampNumber(key: string, value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const bounds = NUMERIC_BOUNDS[key];
  if (!bounds) return value;
  return Math.min(Math.max(value, bounds.min), bounds.max);
}

/**
 * A width saved on a wide monitor can leave no room for the slide grid on a
 * laptop, so horizontal panels additionally give way to the current viewport.
 */
function fitToViewport(prefs: LayoutPreferences): LayoutPreferences {
  if (typeof window === 'undefined') return prefs;

  const available = window.innerWidth;
  if (!available) return prefs;

  // Keep at least this much room for the slide grid between the side panels.
  const MIN_CENTRE_WIDTH = 360;
  const sideTotal = prefs.scheduleWidth + prefs.livePreviewWidth;
  const maxSideTotal = available - MIN_CENTRE_WIDTH;

  if (sideTotal <= maxSideTotal) return prefs;

  // Shrink both rails proportionally rather than collapsing one of them.
  const ratio = Math.max(maxSideTotal, 0) / sideTotal;
  return {
    ...prefs,
    scheduleWidth: clampNumber('scheduleWidth', Math.floor(prefs.scheduleWidth * ratio), DEFAULT_LAYOUT_PREFERENCES.scheduleWidth),
    livePreviewWidth: clampNumber('livePreviewWidth', Math.floor(prefs.livePreviewWidth * ratio), DEFAULT_LAYOUT_PREFERENCES.livePreviewWidth)
  };
}

export function getLayoutPreferences(): LayoutPreferences {
  let stored: Partial<LayoutPreferences> = {};
  try {
    const raw = localStorage.getItem(LAYOUT_PREFERENCES_KEY);
    if (raw) stored = JSON.parse(raw) as Partial<LayoutPreferences>;
  } catch {
    stored = {};
  }

  const merged = { ...DEFAULT_LAYOUT_PREFERENCES };
  for (const key of Object.keys(DEFAULT_LAYOUT_PREFERENCES) as (keyof LayoutPreferences)[]) {
    const value = stored[key];
    if (value === undefined) continue;

    const fallback = DEFAULT_LAYOUT_PREFERENCES[key];
    if (typeof fallback === 'number') {
      (merged[key] as number) = clampNumber(key, value, fallback);
    } else if (typeof fallback === 'boolean') {
      if (typeof value === 'boolean') (merged[key] as boolean) = value;
    } else if (ALLOWED_VALUES[key]?.includes(value as string)) {
      (merged[key] as string) = value as string;
    }
  }

  return fitToViewport(merged);
}

let pendingWrite: number | undefined;
let pendingPrefs: LayoutPreferences | null = null;

export function saveLayoutPreference<K extends keyof LayoutPreferences>(
  key: K,
  value: LayoutPreferences[K]
) {
  pendingPrefs = { ...(pendingPrefs ?? getLayoutPreferences()), [key]: value };

  if (typeof window === 'undefined') return;
  window.clearTimeout(pendingWrite);
  pendingWrite = window.setTimeout(() => {
    try {
      localStorage.setItem(LAYOUT_PREFERENCES_KEY, JSON.stringify(pendingPrefs));
    } catch {
      /* layout is a convenience; never break the console over it */
    }
    pendingPrefs = null;
  }, SAVE_DEBOUNCE_MS);
}

export function resetLayoutPreferences() {
  try {
    localStorage.removeItem(LAYOUT_PREFERENCES_KEY);
  } catch {
    /* nothing useful to do if storage is unavailable */
  }
}
