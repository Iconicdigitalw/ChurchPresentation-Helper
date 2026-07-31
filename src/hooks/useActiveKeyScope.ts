import { useSyncExternalStore } from 'react';

/**
 * Tracks which region of the console the operator is actively working in, so
 * arrow keys drive exactly one thing at a time.
 *
 * Focus alone cannot answer this: most of the console is non-focusable divs, so
 * clicking a verse or a schedule row leaves `document.activeElement` on <body>.
 * Handlers that asked `activeElement.closest(...)` therefore disagreed about who
 * owned the keystroke, and the schedule moved while the operator was paging
 * through verses. We instead remember the last region the operator actually
 * touched or tabbed into.
 *
 * Regions opt in with a `data-key-scope="..."` attribute; anything outside a
 * marked region falls back to the slide grid, which is the default work surface.
 */

export type KeyScope = 'slides' | 'schedule' | 'context';

const DEFAULT_SCOPE: KeyScope = 'slides';
const VALID_SCOPES: KeyScope[] = ['slides', 'schedule', 'context'];

let activeScope: KeyScope = DEFAULT_SCOPE;
let listenersAttached = false;
const subscribers = new Set<() => void>();

function resolveScopeFrom(target: EventTarget | null): KeyScope {
  if (!(target instanceof Element)) return DEFAULT_SCOPE;
  const region = target.closest('[data-key-scope]');
  const value = region?.getAttribute('data-key-scope');
  return VALID_SCOPES.includes(value as KeyScope) ? (value as KeyScope) : DEFAULT_SCOPE;
}

function setActiveScope(next: KeyScope) {
  if (next === activeScope) return;
  activeScope = next;
  subscribers.forEach(notify => notify());
}

function handleInteraction(event: Event) {
  setActiveScope(resolveScopeFrom(event.target));
}

function attachListeners() {
  if (listenersAttached || typeof document === 'undefined') return;
  listenersAttached = true;
  // Capture phase so a region claims the scope even if a child stops propagation.
  document.addEventListener('pointerdown', handleInteraction, true);
  document.addEventListener('focusin', handleInteraction, true);
}

function subscribe(notify: () => void) {
  attachListeners();
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
}

export function getActiveKeyScope(): KeyScope {
  return activeScope;
}

/** Subscribe a component to the active region. */
export function useActiveKeyScope(): KeyScope {
  return useSyncExternalStore(subscribe, getActiveKeyScope, () => DEFAULT_SCOPE);
}
