import { 
  Compass, 
  Map, 
  Layout, 
  ShieldAlert, 
  Wind, 
  Heart, 
  Target, 
  Crosshair,
  Send,
  Loader2,
  History,
  Home,
  ChevronDown,
  Play,
  ShieldCheck,
  Download,
  ChevronRight,
  Zap
} from 'lucide-react';
import { TacticalLens } from './types';

export const LENS_CONFIG: Record<TacticalLens, { description: string, icon: any }> = {
  [TacticalLens.EXPLORER]: { description: "Discover broad biblical horizons and open new doors of meditation.", icon: Compass },
  [TacticalLens.STRATEGIST]: { description: "Receive a scriptural wisdom for overcoming obstacles.", icon: Map },
  [TacticalLens.ARCHITECT]: { description: "Build your life on the solid foundation of Christ.", icon: Layout },
  [TacticalLens.HEALER]: { description: "Find restoration, comfort, and emotional alignment in the Word.", icon: ShieldAlert },
  [TacticalLens.WILDERNESS]: { description: "Surrender to the Spirit. Receive a unique, unpredictably generated meditation.", icon: Wind },
  [TacticalLens.MARRIAGE]: { description: "Walk the covenant together. Shared wisdom for unity and love.", icon: Heart },
  [TacticalLens.WHOLEHEART]: { description: "Embrace your undivided season. Wisdom for purpose and strength.", icon: Target },
  [TacticalLens.LENT]: { description: "40 days of liturgical sharpening. Walk the covenant through prayer.", icon: Crosshair },
  [TacticalLens.YOUNG_ADULT]: { description: "Navigating the 18-30 journey. Wisdom for identity, purpose, and modern struggles.", icon: Zap }
};

export const Icons = {
  Crosshair,
  Send,
  Loader: Loader2,
  History,
  Home,
  Dive: ChevronDown,
  Play,
  Heart,
  Target,
  ChevronRight,
  Compass,
  Map,
  Layout,
  ShieldAlert,
  Calendar: History, // Fallback
  Wind,
  ShieldCheck,
  Download,
  Zap
};
