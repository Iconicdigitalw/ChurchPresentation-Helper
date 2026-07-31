export type SlideType = 
  | 'title' 
  | 'scripture' 
  | 'point' 
  | 'quote' 
  | 'song' 
  | 'cta' 
  | 'video' 
  | 'alert' 
  | 'outline';

export type ThemeStyle = 
  | 'gold-divine' 
  | 'nature-serene' 
  | 'modern-dark' 
  | 'stained-glass' 
  | 'deep-blue' 
  | 'purple-majesty' 
  | 'custom-image' 
  | 'motion-particles';

export interface Slide {
  id: string;
  type: SlideType;
  header: string;
  body: string;
  reference?: string;
  bulletPoints?: string[];
  themeStyle: ThemeStyle;
  speakerNotes?: string;
  bgImageUrl?: string;
  motionBg?: string; // CSS animation or video preset identifier
}

export type ScheduleItemType = 'song' | 'sermon' | 'scripture' | 'announcement' | 'video' | 'custom';

export interface ScheduleItem {
  id: string;
  title: string;
  subtitle?: string;
  type: ScheduleItemType;
  slides: Slide[];
  activeSlideIndex: number;
  notes?: string;
  ccli?: string;
  key?: string;
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  reference: string;
}

export interface SongItem {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  ccli?: string;
  rawLyrics: string;
  slides: Slide[];
}

export interface AIScriptureSuggestion {
  id: string;
  reference: string;
  text: string;
  translation: string;
  sourceSnippet: string;
  keyQuote?: string;
  /** True when the server returned canned sample content instead of a real AI lookup */
  isFallback?: boolean;
  timestamp: string;
}

export type QuickState = 'normal' | 'clearText' | 'clearBg' | 'black' | 'logo';

export type ViewMode = 'operator' | 'confidence' | 'stageDisplay';

export type SearchMode = 'bible' | 'songs' | 'visuals' | 'deck';

export interface AlertOverlay {
  show: boolean;
  message: string;
  type: 'nursery' | 'urgent' | 'countdown' | 'announcement';
  countdownSeconds?: number;
}
