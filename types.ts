
export enum TacticalLens {
  EXPLORER = 'Explorer',
  STRATEGIST = 'Strategist',
  ARCHITECT = 'Architect',
  HEALER = 'Healer'
}

export type SpiritualFocus = 'non-denominational' | 'catholic' | 'theosophist';

export interface Profile {
  name: string;
  role: string;
  tone: string;
  signature: string;
  scriptures?: string[];
  themes?: string[];
  structure: string;
  special_instructions?: string;
  audience_type: 'adult' | 'teen' | 'spouse';
}

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
}

export interface ActiveSeries {
  topic: string;
  currentDay: number;
  totalDays: number;
  lens: TacticalLens;
  focus: SpiritualFocus;
}
