import { useCallback, useState } from 'react';
import {
  LayoutPreferences,
  getLayoutPreferences,
  saveLayoutPreference
} from '../data/layoutPreferences';

type Updater<T> = T | ((previous: T) => T);

/**
 * Drop-in replacement for `useState` that seeds from the operator's saved
 * console layout and writes changes back (debounced).
 *
 * Reads the stored value lazily so a component that mounts later - a panel
 * revealed by a view switch, say - still picks up the persisted arrangement.
 */
export function usePersistedLayout<K extends keyof LayoutPreferences>(
  key: K
): [LayoutPreferences[K], (value: Updater<LayoutPreferences[K]>) => void] {
  const [value, setValue] = useState<LayoutPreferences[K]>(() => getLayoutPreferences()[key]);

  const update = useCallback(
    (next: Updater<LayoutPreferences[K]>) => {
      setValue(previous => {
        const resolved =
          typeof next === 'function'
            ? (next as (p: LayoutPreferences[K]) => LayoutPreferences[K])(previous)
            : next;
        saveLayoutPreference(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, update];
}
