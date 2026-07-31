import { useEffect } from 'react';
import { QuickState } from '../types';
import { ShortcutBinding } from '../data/settingsAndTemplates';

export interface GlobalShortcutHandlers {
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onNextItem: () => void;
  onPrevItem: () => void;
  onPushLive: () => void;
  onToggleQuickState: (state: QuickState) => void;
  onToggleLiveOutput: () => void;
  onOpenLiveCompanion: () => void;
  onOpenBible: () => void;
  onOpenSongs: () => void;
  onOpenDeck: () => void;
  onCycleSearchMode: () => void;
  onQuickSearch: (seedQuery: string) => void;
}

interface UseGlobalShortcutsOptions {
  shortcuts: ShortcutBinding[];
  /** False while a modal is open or the operator is typing. */
  enabled: boolean;
  handlers: GlobalShortcutHandlers;
}

const TEXT_ENTRY_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

/** True when the keystroke belongs to a text field rather than the operator console. */
function isTypingTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  const active = document.activeElement as HTMLElement | null;

  for (const el of [target, active]) {
    if (!el) continue;
    if (TEXT_ENTRY_TAGS.includes(el.tagName)) return true;
    if (el.isContentEditable) return true;
    if (el.closest('.context-workspace-panel')) return true;
  }
  return false;
}

/** Matches a configured binding such as "Ctrl+K", "F5" or "ArrowRight". */
function matchesBinding(event: KeyboardEvent, binding?: ShortcutBinding): boolean {
  if (!binding?.key) return false;

  const parts = binding.key.toLowerCase().split('+').map(k => k.trim());
  const mainKey = parts[parts.length - 1];
  const wantsCtrl = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta');
  const wantsShift = parts.includes('shift');
  const wantsAlt = parts.includes('alt');

  if (wantsCtrl !== (event.ctrlKey || event.metaKey)) return false;
  if (wantsAlt !== event.altKey) return false;
  if (wantsShift && !event.shiftKey) return false;

  const eventKey = event.key.toLowerCase();
  if (mainKey === eventKey || mainKey === event.code.toLowerCase()) return true;
  if ((mainKey === 'space' || mainKey === 'spacebar') && event.code === 'Space') return true;

  // Allow "arrow right" as well as "arrowright".
  return mainKey.replace(/\s+/g, '') === eventKey;
}

/**
 * Console-wide keyboard control. Extracted from App.tsx, where it had grown into
 * a ~180 line effect that re-subscribed on nearly every render.
 */
export function useGlobalShortcuts({ shortcuts, enabled, handlers }: UseGlobalShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event)) return;

      const binding = (id: string) => shortcuts.find(s => s.id === id);
      const matches = (id: string) => matchesBinding(event, binding(id));

      // Quick search: slash or Ctrl/Cmd+K.
      if (event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        handlers.onQuickSearch('');
        return;
      }

      const run = (fn: () => void) => {
        event.preventDefault();
        fn();
      };

      if (matches('trigger_voice_search')) return run(handlers.onOpenLiveCompanion);
      if (event.key === 'Enter' || matches('push_live')) return run(handlers.onPushLive);

      if (event.key === 'ArrowRight' || event.code === 'Space' || event.key === 'PageDown' || matches('next_slide')) {
        return run(handlers.onNextSlide);
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp' || matches('prev_slide')) {
        return run(handlers.onPrevSlide);
      }

      // Vertical arrows step slides; with a modifier they jump schedule items.
      if (event.key === 'ArrowDown') {
        const jumpItem = event.shiftKey || event.ctrlKey || event.metaKey;
        return run(jumpItem ? handlers.onNextItem : handlers.onNextSlide);
      }
      if (event.key === 'ArrowUp') {
        const jumpItem = event.shiftKey || event.ctrlKey || event.metaKey;
        return run(jumpItem ? handlers.onPrevItem : handlers.onPrevSlide);
      }

      if (matches('toggle_clear_text')) return run(() => handlers.onToggleQuickState('clearText'));
      if (matches('toggle_clear_bg')) return run(() => handlers.onToggleQuickState('clearBg'));
      if (matches('toggle_black')) return run(() => handlers.onToggleQuickState('black'));
      if (matches('toggle_logo')) return run(() => handlers.onToggleQuickState('logo'));
      if (matches('toggle_live_output')) return run(handlers.onToggleLiveOutput);
      if (matches('open_bible')) return run(handlers.onOpenBible);
      if (matches('open_songs')) return run(handlers.onOpenSongs);
      if (matches('switch_search_mode')) return run(handlers.onCycleSearchMode);
      if (matches('open_deck')) return run(handlers.onOpenDeck);

      // Typing a printable character opens quick search seeded with that key,
      // so an operator can start searching without reaching for the mouse.
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        /[a-zA-Z0-9:\-,."']/.test(event.key)
      ) {
        return run(() => handlers.onQuickSearch(event.key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled, handlers]);
}
