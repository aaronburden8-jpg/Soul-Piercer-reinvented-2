
export enum TacticalLens {
  EXPLORER = 'Explorer',
  STRATEGIST = 'Strategist',
  ARCHITECT = 'Architect',
  HEALER = 'Healer',
  WILDERNESS = 'Wilderness',
  MARRIAGE = 'Marriage',
  WHOLEHEART = 'Wholeheart',
  LENT = 'Lent',
  YOUNG_ADULT = 'Young Adult'
}

export type SpiritualFocus = 'non-denominational' | 'catholic' | 'theosophist';

export interface DevotionalSection {
  title: string;
  content: string;
}

export interface Devotional {
  id: string;
  content: string;
  timestamp: number;
  input: string;
  lens: string;
  seriesDay?: number;
  seriesTotal?: number;
  isComplete?: boolean;
}

export interface ActiveSeries {
  topic: string;
  currentDay: number;
  totalDays: number;
  lens: TacticalLens;
  focus: SpiritualFocus;
  lastStorySummary?: string;
}
