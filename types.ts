
export enum Structure {
  STANDARD = 'Standard',
  DATE_STORY = 'DATE_STORY',
  SCHOLAR = 'SCHOLAR'
}

export interface Profile {
  name: string;
  role: string;
  tone: string;
  signature: string;
  scriptures?: string[];
  themes?: string[];
  structure: string;
  special_instructions?: string;
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
  series?: {
    topic: string;
    current: number;
    total: number;
  } | null;
  audioData?: string; // Base64 PCM data for the "Note"
}

export interface ActiveSeries {
  topic: string;
  current: number;
  total: number;
  nextDay: number;
}
