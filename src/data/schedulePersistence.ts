import { ScheduleItem } from '../types';

/**
 * Autosave for the live order of service.
 *
 * The schedule used to live purely in React state, so a refresh or a crash
 * mid-service wiped the whole plan. It is now mirrored to localStorage after
 * every change and offered back on the next load.
 */

const ACTIVE_SCHEDULE_KEY = 'WORSHIPAL_ACTIVE_SCHEDULE_V1';

/** Data URIs for AI backgrounds can be megabytes each; localStorage caps around 5MB. */
const MAX_INLINE_IMAGE_LENGTH = 100_000;

export interface PersistedSchedule {
  schedule: ScheduleItem[];
  selectedScheduleId: string | null;
  activeSlideIndex: number;
  savedAt: string;
  /** True when oversized inline backgrounds had to be dropped to fit the quota. */
  backgroundsDropped?: boolean;
}

export type SaveOutcome =
  | { status: 'saved'; backgroundsDropped: boolean }
  | { status: 'failed'; reason: string };

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota/i.test(error.message)
  );
}

/** Drops inline base64 backgrounds, keeping ordinary URLs intact. */
function stripHeavyBackgrounds(schedule: ScheduleItem[]): ScheduleItem[] {
  return schedule.map(item => ({
    ...item,
    slides: item.slides.map(slide => {
      const bg = slide.bgImageUrl;
      if (bg && bg.length > MAX_INLINE_IMAGE_LENGTH) {
        const { bgImageUrl, ...rest } = slide;
        return rest;
      }
      return slide;
    })
  }));
}

export function savePersistedSchedule(
  schedule: ScheduleItem[],
  selectedScheduleId: string | null,
  activeSlideIndex: number
): SaveOutcome {
  const write = (items: ScheduleItem[], backgroundsDropped: boolean) => {
    const payload: PersistedSchedule = {
      schedule: items,
      selectedScheduleId,
      activeSlideIndex,
      savedAt: new Date().toISOString(),
      backgroundsDropped
    };
    localStorage.setItem(ACTIVE_SCHEDULE_KEY, JSON.stringify(payload));
  };

  try {
    write(schedule, false);
    return { status: 'saved', backgroundsDropped: false };
  } catch (error) {
    // Losing the running order matters far more than losing a generated
    // background, so retry once with the heavy images removed.
    if (isQuotaError(error)) {
      try {
        write(stripHeavyBackgrounds(schedule), true);
        return { status: 'saved', backgroundsDropped: true };
      } catch {
        return { status: 'failed', reason: 'Browser storage is full - autosave is paused.' };
      }
    }
    return { status: 'failed', reason: 'Autosave is unavailable in this browser.' };
  }
}

export function loadPersistedSchedule(): PersistedSchedule | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SCHEDULE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedSchedule;
    if (!parsed || !Array.isArray(parsed.schedule) || parsed.schedule.length === 0) {
      return null;
    }

    // Guard against a partially written or hand-edited payload.
    const schedule = parsed.schedule.filter(
      item => item && typeof item.id === 'string' && Array.isArray(item.slides)
    );
    if (schedule.length === 0) return null;

    return { ...parsed, schedule };
  } catch {
    return null;
  }
}

export function clearPersistedSchedule() {
  try {
    localStorage.removeItem(ACTIVE_SCHEDULE_KEY);
  } catch {
    /* nothing useful to do if storage is unavailable */
  }
}

/** Human-readable "3 minutes ago" for the restore prompt. */
export function describeSavedAt(savedAt: string): string {
  const saved = new Date(savedAt).getTime();
  if (Number.isNaN(saved)) return 'a previous session';

  const minutes = Math.floor((Date.now() - saved) / 60_000);
  if (minutes < 1) return 'less than a minute ago';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
