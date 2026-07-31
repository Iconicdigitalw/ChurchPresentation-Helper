import { ThemeStyle, Slide } from '../types';

// ===============================================
// 1. KEYBOARD SHORTCUTS SETTINGS
// ===============================================
export interface ShortcutBinding {
  id: string;
  label: string;
  category: 'Master Controls' | 'Navigation & Search' | 'Quick States';
  key: string; // Key combination, e.g., "Space", "ArrowRight", "F2", "Ctrl+K", "F6"
  defaultKey: string;
}

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { id: 'next_slide', label: 'Advance to Next Slide (Preview)', category: 'Navigation & Search', key: 'ArrowRight', defaultKey: 'ArrowRight' },
  { id: 'prev_slide', label: 'Previous Slide (Preview)', category: 'Navigation & Search', key: 'ArrowLeft', defaultKey: 'ArrowLeft' },
  { id: 'push_live', label: 'Push Preview Slide to Live', category: 'Navigation & Search', key: 'Enter', defaultKey: 'Enter' },
  { id: 'trigger_voice_search', label: 'Trigger AI Voice Search / Live Listener', category: 'Master Controls', key: 'Shift+M', defaultKey: 'Shift+M' },
  { id: 'switch_search_mode', label: 'Switch Search Mode (Bible / Songs / Visuals / Deck)', category: 'Navigation & Search', key: 'F6', defaultKey: 'F6' },
  { id: 'open_quick_search', label: 'Open Quick Search Bar', category: 'Navigation & Search', key: 'Ctrl+K', defaultKey: 'Ctrl+K' },
  { id: 'toggle_clear_text', label: 'Toggle Clear Text', category: 'Quick States', key: 'F2', defaultKey: 'F2' },
  { id: 'toggle_clear_bg', label: 'Toggle Clear Background', category: 'Quick States', key: 'F3', defaultKey: 'F3' },
  { id: 'toggle_black', label: 'Toggle Black Screen', category: 'Quick States', key: 'F4', defaultKey: 'F4' },
  { id: 'toggle_logo', label: 'Toggle Logo Screen', category: 'Quick States', key: 'F5', defaultKey: 'F5' },
  { id: 'toggle_live_output', label: 'Toggle Master Live Output', category: 'Master Controls', key: 'F9', defaultKey: 'F9' },
  { id: 'open_bible', label: 'Open Bible Scripture Library', category: 'Master Controls', key: 'F7', defaultKey: 'F7' },
  { id: 'open_songs', label: 'Open Worship Song Library', category: 'Master Controls', key: 'F8', defaultKey: 'F8' },
  { id: 'open_deck', label: 'Open Presentation & Sermon Deck Builder', category: 'Master Controls', key: 'F10', defaultKey: 'F10' }
];

const SHORTCUTS_STORAGE_KEY = 'LOGOS_CUSTOM_SHORTCUTS_V1';

export function getSavedShortcuts(): ShortcutBinding[] {
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const parsed: ShortcutBinding[] = JSON.parse(raw);
    // Ensure all default shortcuts exist
    return DEFAULT_SHORTCUTS.map(def => {
      const match = parsed.find(p => p.id === def.id);
      return match ? { ...def, key: match.key } : def;
    });
  } catch (e) {
    return DEFAULT_SHORTCUTS;
  }
}

export function saveShortcuts(shortcuts: ShortcutBinding[]) {
  try {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
  } catch (e) {
    console.error('Failed to save shortcuts:', e);
  }
}

export interface UserProfileSettings {
  operatorName: string;
  userEmail: string;
  churchName: string;
  serviceTitle: string;
  selectedMonitor: 'primary' | 'secondary' | 'stage' | 'custom';
  monitorX: number;
  monitorY: number;
  monitorWidth: number;
  monitorHeight: number;
  autoLaunchOnLive: boolean;
}

export const DEFAULT_USER_PROFILE: UserProfileSettings = {
  operatorName: 'Media Director',
  userEmail: 'info@iconicdigitalworld.com',
  churchName: 'Grace Community Church',
  serviceTitle: 'Sunday Worship Service',
  selectedMonitor: 'secondary',
  monitorX: 1920,
  monitorY: 0,
  monitorWidth: 1920,
  monitorHeight: 1080,
  autoLaunchOnLive: true
};

const USER_PROFILE_KEY = 'WORSHIPAL_USER_PROFILE_V1';

export function getUserProfileSettings(): UserProfileSettings {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    return raw ? { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) } : DEFAULT_USER_PROFILE;
  } catch (e) {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfileSettings(profile: UserProfileSettings) {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile settings:', e);
  }
}

// ===============================================
// 2. GLOBAL APP SETTINGS (Slide Activation, etc.)
// ===============================================
export interface AppSettings {
  slideActivationMode: 'double_click' | 'single_click';
  autoLiveSearchOnlineSongs: boolean;
  stageDisplayFontSize: 'normal' | 'large' | 'xlarge';
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  slideActivationMode: 'double_click',
  autoLiveSearchOnlineSongs: true,
  stageDisplayFontSize: 'large'
};

const APP_SETTINGS_KEY = 'LOGOS_APP_SETTINGS_V1';

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    return raw ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) } : DEFAULT_APP_SETTINGS;
  } catch (e) {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings) {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save app settings:', e);
  }
}

// ===============================================
// 3. CUSTOM TEMPLATES MANAGER
// ===============================================
export interface CustomTemplate {
  id: string;
  name: string;
  description?: string;
  themeStyle: ThemeStyle;
  bgImageUrl?: string;
  headerFont?: string;
  bodyFont?: string;
  isBuiltIn?: boolean;
  createdAt: string;
}

export const BUILT_IN_TEMPLATES: CustomTemplate[] = [
  {
    id: 'tpl-gold-majesty',
    name: 'Divine Gold Worship',
    description: 'Golden ambient radial glow with high-contrast text',
    themeStyle: 'gold-divine',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-purple-serene',
    name: 'Royal Purple Stained Glass',
    description: 'Vibrant purple stained glass backdrop for worship songs',
    themeStyle: 'purple-majesty',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-deep-blue',
    name: 'Deep Blue Sanctuary',
    description: 'Soothing oceanic dark blue for scripture readings',
    themeStyle: 'deep-blue',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-modern-dark',
    name: 'Modern Dark Minimalist',
    description: 'Clean slate typography for preaching points',
    themeStyle: 'modern-dark',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  }
];

const TEMPLATES_STORAGE_KEY = 'LOGOS_CUSTOM_TEMPLATES_V1';

export function getSavedTemplates(): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    const custom: CustomTemplate[] = raw ? JSON.parse(raw) : [];
    return [...BUILT_IN_TEMPLATES, ...custom];
  } catch (e) {
    return BUILT_IN_TEMPLATES;
  }
}

export function saveCustomTemplate(template: Omit<CustomTemplate, 'id' | 'createdAt'>): CustomTemplate {
  const newTemplate: CustomTemplate = {
    ...template,
    id: `custom-tpl-${Date.now()}`,
    isBuiltIn: false,
    createdAt: new Date().toISOString()
  };
  try {
    const existing = getSavedTemplates().filter(t => !t.isBuiltIn);
    existing.push(newTemplate);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save template:', e);
  }
  return newTemplate;
}

export function deleteCustomTemplate(id: string) {
  try {
    const existing = getSavedTemplates().filter(t => !t.isBuiltIn && t.id !== id);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to delete template:', e);
  }
}

// ===============================================
// 4. SAVED CUSTOM SONGS CATALOG (Persistent reuse)
// ===============================================
const SAVED_SONGS_KEY = 'LOGOS_SAVED_CUSTOM_SONGS_V1';

export interface SavedCustomSong {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  ccli?: string;
  slides: Slide[];
  savedAt: string;
}

export function getSavedCustomSongs(): SavedCustomSong[] {
  try {
    const raw = localStorage.getItem(SAVED_SONGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomSongToCatalog(song: Omit<SavedCustomSong, 'savedAt'>): SavedCustomSong {
  const customSongs = getSavedCustomSongs().filter(s => s.id !== song.id);
  const entry: SavedCustomSong = {
    ...song,
    savedAt: new Date().toISOString()
  };
  customSongs.unshift(entry);
  try {
    localStorage.setItem(SAVED_SONGS_KEY, JSON.stringify(customSongs));
  } catch (e) {
    console.error('Failed to save song to catalog:', e);
  }
  return entry;
}

export function deleteCustomSongFromCatalog(id: string) {
  try {
    const customSongs = getSavedCustomSongs().filter(s => s.id !== id);
    localStorage.setItem(SAVED_SONGS_KEY, JSON.stringify(customSongs));
  } catch (e) {
    console.error('Failed to delete song from catalog:', e);
  }
}
