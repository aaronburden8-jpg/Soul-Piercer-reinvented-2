import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons, LENS_CONFIG } from './constants';
import { Devotional, ActiveSeries, TacticalLens, SpiritualFocus } from './types';
import { generateDevotionalText } from './services/geminiService';
import DevotionalDisplay from './components/DevotionalDisplay';

const pathways = [
  TacticalLens.EXPLORER,
  TacticalLens.STRATEGIST,
  TacticalLens.ARCHITECT,
  TacticalLens.HEALER,
  TacticalLens.WILDERNESS,
];

const seasons = [
  TacticalLens.MARRIAGE,
  TacticalLens.WHOLEHEART,
  TacticalLens.LENT,
];

const Tooltip: React.FC<{ text: string; children: React.ReactNode; duration?: number }> = ({ text, children, duration = 300 }) => {
  const [show, setShow] = useState(false);
  const timer = useRef<number | null>(null);

  const onEnter = () => {
    timer.current = window.setTimeout(() => setShow(true), duration);
  };
  const onLeave = () => {
    if (timer.current) clearTimeout(timer.current);
    setShow(false);
  };

  return (
    <div className="relative inline-block" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 p-4 glass-panel rounded-2xl text-[10px] text-white font-mono uppercase tracking-[0.2em] text-center z-[100] pointer-events-none animate-tooltip-in">
          {text}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [history, setHistory] = useState<Devotional[]>([]);
  const [momentum, setMomentum] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'glimpse' | 'journey'>('glimpse');
  const [journeyDays, setJourneyDays] = useState(7);
  const [focus, setFocus] = useState<SpiritualFocus>('non-denominational');
  const [selectedLens, setSelectedLens] = useState<TacticalLens>(TacticalLens.EXPLORER);
  const [activeSeries, setActiveSeries] = useState<ActiveSeries | null>(null);
  const [abandonConfirm, setAbandonConfirm] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('soul_piercer_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedMom = localStorage.getItem('soul_piercer_mom');
    if (savedMom) setMomentum(parseInt(savedMom));

    const savedSeries = localStorage.getItem('soul_piercer_active_series');
    if (savedSeries) {
      try {
        const parsed = JSON.parse(savedSeries);
        setActiveSeries(parsed);
        setSelectedLens(parsed.lens);
        setFocus(parsed.focus);
      } catch (e) {
        localStorage.removeItem('soul_piercer_active_series');
      }
    }
  }, []);

  const getSystemPrompt = (lens: TacticalLens, religiousContext: string, topic: string) => {
    const baseConstraint = `
      STRICTLY PROHIBITED: Do not mention internal metadata, 'lenses', or 'models'.
      UNIVERSAL FORMATTING: 
      - Use headers starting with ###. 
      - Strictly avoid long em dashes (—). Use colons, semi-colons, or standard dashes (-).
      - NO SIGNATURES: Do not include 'Blessings', 'Aaron', or any sign-off. End immediately after Key Thoughts.
    `;

    const scripturePriorityLogic = `
      SCRIPTURE ANCHORING:
      - THE WORD: You MUST provide EXACTLY TWO relevant scripture verses, each on its own line. 
      - CITATION FORMAT: For each verse, write the full scripture text first, and place the citation (Book Chapter:Verse) at the very end of the verse (e.g., 'For God so loved the world that he gave his only Son. John 3:16'). 
      - NEVER place the citation at the beginning of the text.
      - If the TOPIC includes a specific Biblical reference, anchor to that first, then add one additional supporting verse. Otherwise, provide a relevant pair (e.g., one Old Testament and one New Testament).
      - INTEGRATION: THE STORY and BIBLICAL REFLECTION must specifically interpret and apply the provided scriptures.
    `;
    
    let personaPrompt = `ACT AS: A world-class spiritual guide and mentor. 
      TONE: Soulful, direct, and deeply immersive.
      RELIGIOUS FOCUS: ${religiousContext}.`;

    if (lens === TacticalLens.MARRIAGE) {
      personaPrompt = `ACT AS: A wise marriage mentor.
      TONE: Intimate, challenging, restorative.
      RELIGIOUS FOCUS: ${religiousContext}.
      SPECIFIC FOCUS: Couple-centric. Address them as a unit (Husband and Wife). Focus on covenant, communication, intimacy, and sacrifice. Designed for joint reading aloud.`;
    } else if (lens === TacticalLens.WHOLEHEART) {
      personaPrompt = `ACT AS: "Mentor to the Dedicated."
      TONE: Empowering, mission-focused.
      RELIGIOUS FOCUS: ${religiousContext}.
      SPECIFIC FOCUS: Pivot from "waiting room" to "throne room" theology. Validate the completeness of the individual (100% whole right now). Focus on undivided Kingdom devotion.
      SECTION REQUIREMENTS:
      - PREAMBLE: 150 words on the weight of being undivided.
      - THE WORD: Exactly two scriptures on identity and undivided heart with citations at the end.
      - THE STORY: 200-300 words on solo agency/freedom. No clichés.
      - BIBLICAL REFLECTION: 200-300 words on Christ-centered Completeness.
      - THE EXCHANGE: 2 sharp mirror questions on Kingdom risk.
      - THE PRAYER: 50-90 words of sufficiency.
      - KEY THOUGHTS: 3 takeaways on mission.`;
    }

    return `
      ${personaPrompt}
      ${baseConstraint}
      ${scripturePriorityLogic}
      
      OUTPUT STRUCTURE (MANDATORY ORDER):
      1. ### Preamble
      2. ### The Word
      3. ### The Story (200-300 words)
      4. ### Biblical Reflection (200-300 words)
      5. ### The Exchange
      6. ### The Prayer
      7. ### Key Thoughts
    `;
  };

  const handleGenerate = async (seriesContext?: ActiveSeries) => {
    const activeLens = seriesContext ? seriesContext.lens : selectedLens;
    const activeFocus = seriesContext ? seriesContext.focus : focus;
    const currentDay = seriesContext ? seriesContext.currentDay : 1;
    const totalDays = seriesContext ? seriesContext.totalDays : (activeLens === TacticalLens.LENT ? 40 : journeyDays);
    
    let finalTopic = input.trim();
    if (seriesContext) {
      finalTopic = seriesContext.topic;
    } else if (!finalTopic && activeLens === TacticalLens.LENT) {
      finalTopic = "Walk the Covenant: 40 Days of Lent";
    }

    if (!finalTopic && activeLens !== TacticalLens.LENT) return;

    setLoading(true);
    setError(null);
    setAbandonConfirm(false);

    try {
      const isSeries = !!seriesContext || mode === 'journey' || activeLens === TacticalLens.LENT;
      const religiousContext = activeFocus === 'non-denominational' ? 'Non-denominational Christian' : activeFocus;

      const prompt = `
        ${getSystemPrompt(activeLens, religiousContext, finalTopic)}
        TOPIC: ${finalTopic}
        ${isSeries ? `SESSION: Day ${currentDay} of ${totalDays} in this Journey.` : ""}
      `;

      setStatusText(isSeries ? `PREPARING DAY ${currentDay} CHAPTER...` : "COMMUNING...");
      // Switched to 'gemini-flash-latest' for 1.5 stability
      const text = await generateDevotionalText(prompt, 'gemini-flash-latest');
      
      const newDevo: Devotional = {
        id: `v4_${Date.now()}`,
        content: text || "Transmission failed.",
        timestamp: Date.now(),
        input: finalTopic,
        lens: activeLens,
        seriesDay: isSeries ? currentDay : undefined,
        seriesTotal: isSeries ? totalDays : undefined
      };

      setDevotional(newDevo);
      const newHistory = [newDevo, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('soul_piercer_history', JSON.stringify(newHistory));
      
      if (isSeries) {
        if (!seriesContext) {
          const newSeries: ActiveSeries = {
            topic: finalTopic,
            currentDay: 2,
            totalDays: totalDays,
            lens: activeLens,
            focus: activeFocus
          };
          setActiveSeries(newSeries);
          localStorage.setItem('soul_piercer_active_series', JSON.stringify(newSeries));
        } else {
          if (currentDay < totalDays) {
            const updatedSeries = { ...seriesContext, currentDay: currentDay + 1 };
            setActiveSeries(updatedSeries);
            localStorage.setItem('soul_piercer_active_series', JSON.stringify(updatedSeries));
          } else {
            setActiveSeries(null);
            localStorage.removeItem('soul_piercer_active_series');
          }
        }
      }

      setMomentum(prev => prev + 1);
      setInput("");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      let msg = err.message || "An unknown error occurred.";
      if (msg.includes('429')) msg = "Quota limit reached. The stable 1.5 engine is resetting and retrying. Please wait a moment.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const performReset = () => {
    localStorage.removeItem('soul_piercer_active_series');
    setActiveSeries(null);
    setDevotional(null);
    setSelectedLens(TacticalLens.EXPLORER);
    setFocus('non-denominational');
    setMode('glimpse');
    setInput("");
    setError(null);
    setAbandonConfirm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAbandonRequest = () => {
    if (abandonConfirm) {
      performReset();
    } else {
      setAbandonConfirm(true);
      setTimeout(() => setAbandonConfirm(false), 5000);
    }
  };

  const handleReturnToSanctuary = () => {
    setDevotional(null);
    setError(null);
    setAbandonConfirm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPathButton = (l: TacticalLens) => {
    const IconComp = (Icons as any)[LENS_CONFIG[l].icon];
    const isActive = selectedLens === l || activeSeries?.lens === l;
    
    return (
      <Tooltip key={l} text={LENS_CONFIG[l].description}>
        <button 
          onClick={() => {
            setSelectedLens(l);
            if (l === TacticalLens.LENT) setFocus('catholic');
            textAreaRef.current?.focus();
            textAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className={`w-full flex flex-col items-center gap-4 p-6 rounded-[2rem] border transition-all relative overflow-hidden ${isActive ? 'bg-indigo-500 border-indigo-400 text-white shadow-2xl scale-105' : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'}`}
        >
          {activeSeries?.lens === l && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[8px] font-mono text-emerald-300 font-bold uppercase">ACTIVE</span>
            </div>
          )}
          <IconComp className={`w-7 h-7 ${isActive ? 'text-white' : 'opacity-30'}`} />
          <span className={`text-[11px] font-bold uppercase tracking-widest text-center`}>{l === TacticalLens.LENT ? "Lent Series" : `${l} Meditation`}</span>
        </button>
      </Tooltip>
    );
  };

  const renderActiveDashboard = () => {
    if (!activeSeries) return null;
    const progress = Math.max(0, Math.min(100, ((activeSeries.currentDay - 1) / activeSeries.totalDays) * 100));
    const IconComp = (Icons as any)[LENS_CONFIG[activeSeries.lens].icon];

    return (
      <div className="animate-slide-up mb-12">
        <div className="glass-panel p-10 rounded-[3.5rem] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 opacity-20 bg-white/10">
            <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white border border-white/10 bg-indigo-500/20">
                <IconComp className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.5em] mb-2">Active Journey</h3>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-serif-display text-white italic truncate max-w-[200px] md:max-w-xs">{activeSeries.topic}</span>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-indigo-300 uppercase tracking-widest font-bold">
                    Day {activeSeries.currentDay} / {activeSeries.totalDays}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleAbandonRequest} 
                className={`px-6 py-5 rounded-2xl transition-all font-mono text-[9px] font-black uppercase tracking-widest flex items-center gap-3 ${abandonConfirm ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'}`}
              >
                <Icons.Target className="w-4 h-4" />
                {abandonConfirm ? "CONFIRM RESET?" : "ABANDON JOURNEY"}
              </button>
              <button 
                onClick={() => handleGenerate(activeSeries)}
                disabled={loading}
                className="px-10 py-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-mono text-[11px] font-black uppercase tracking-[0.3em] shadow-xl transition-all flex items-center gap-4 group disabled:opacity-50"
              >
                {loading ? <Icons.Loader className="w-4 h-4" /> : <Icons.Play className="w-4 h-4" />}
                {loading ? "COMMUNING..." : `START DAY ${activeSeries.currentDay}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-8 md:pt-16 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row items-center justify-between mb-12 glass-panel p-10 rounded-[3rem] border border-white/10 relative overflow-hidden group shadow-[0_0_80px_rgba(129,140,248,0.1)]">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 luminous-gradient rounded-[2rem] flex items-center justify-center text-white aura-glow">
            <Icons.Crosshair className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-gradient font-serif-display leading-none">The Soul Piercer <span className="text-[14px] font-mono not-italic text-indigo-300 opacity-60 ml-2">v4.6 Sanctuary</span></h1>
            <div className="flex items-center gap-5 mt-3">
              <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div> CONNECTED_1.5_STABLE
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.3em]">MOMENTUM: {momentum}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-5 mt-8 md:mt-0">
          <button 
            onClick={handleReturnToSanctuary} 
            className="px-6 py-4 flex items-center gap-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/10 shadow-lg group" 
          >
            <Icons.Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Sanctuary</span>
          </button>
        </div>
      </header>

      <main className="relative">
        {error && (
          <div className="mb-10 bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-red-200 font-mono text-[12px] flex flex-col items-center gap-4 text-center uppercase tracking-[0.1em]">
            <div className="flex items-center gap-3 text-red-400 font-bold">
              <Icons.ShieldCheck className="w-5 h-5" /> [TRANSMISSION_NOTICE]
            </div>
            <p className="max-w-2xl opacity-80">{error}</p>
            <button onClick={performReset} className="mt-4 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-bold tracking-widest">
              FORCE SYSTEM RESET
            </button>
          </div>
        )}

        {!devotional ? (
          <div className="space-y-12 animate-slide-up">
            {renderActiveDashboard()}
            <div className="flex flex-col gap-8">
               <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                 {pathways.map(renderPathButton)}
               </div>
               <div className="flex items-center gap-6 my-4">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <span className="font-mono text-[10px] text-slate-500 tracking-[0.5em] uppercase font-black">Sacred Seasons</span>
                  <div className="h-px flex-1 bg-white/10"></div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                 {seasons.map(renderPathButton)}
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex gap-3 p-2 glass-panel rounded-3xl border border-white/10 items-center">
                <button onClick={() => setMode('glimpse')} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'glimpse' ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}>Glimpse</button>
                <button onClick={() => setMode('journey')} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'journey' ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}>Journey</button>
                {mode === 'journey' && selectedLens !== TacticalLens.LENT && !activeSeries && (
                  <div className="flex items-center gap-3 px-6 border-l border-white/10">
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">Days:</span>
                    <input type="number" min="1" max="30" value={journeyDays} onChange={(e) => setJourneyDays(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))} className="w-14 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-white font-mono text-sm" />
                  </div>
                )}
              </div>
               <div className="flex gap-2 p-2 glass-panel rounded-3xl border border-white/10">
                {(['non-denominational', 'catholic', 'theosophist'] as SpiritualFocus[]).map(f => (
                  <button key={f} onClick={() => setFocus(f as any)} className={`px-7 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${focus === f ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                    {f === 'non-denominational' ? 'NON-DENOM' : f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {!activeSeries && (
              <div className="relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <textarea 
                  ref={textAreaRef}
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder={selectedLens === TacticalLens.LENT ? "Awaiting Walk the Covenant: 40 Days of Lent..." : "Enter your prayer focus or topic (e.g., 'Psalm 23' or 'Identity')..."} 
                  className="w-full glass-panel rounded-[3.5rem] p-12 md:p-20 text-3xl md:text-4xl font-serif-display italic text-white placeholder:text-slate-700 focus:outline-none min-h-[400px] resize-none transition-all leading-relaxed" 
                />
                <div className="absolute bottom-12 right-12 flex items-center gap-6">
                  <button onClick={() => handleGenerate()} disabled={loading || (!input.trim() && selectedLens !== TacticalLens.LENT)} className="px-16 py-6 rounded-3xl luminous-gradient text-white font-mono text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-20 flex items-center gap-5">
                    {loading ? <Icons.Loader className="w-5 h-5" /> : <Icons.Send className="w-5 h-5" />}
                    {loading ? "COMMUNING..." : "SEEK GUIDANCE"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-slide-up pb-24">
            <div className="flex justify-between items-center mb-10 px-6">
              <button 
                onClick={handleReturnToSanctuary} 
                className="text-slate-400 hover:text-white font-mono text-[11px] uppercase tracking-widest flex items-center gap-4 transition-all group"
              >
                <Icons.ChevronRight className="rotate-180 w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                BACK TO SANCTUARY
              </button>
              
              {activeSeries && (
                <button 
                  onClick={handleAbandonRequest} 
                  className={`px-6 py-3 rounded-xl transition-all font-mono text-[9px] font-black uppercase tracking-widest flex items-center gap-3 ${abandonConfirm ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/10'}`}
                >
                  <Icons.Target className="w-4 h-4" />
                  {abandonConfirm ? "CONFIRM STOP?" : "STOP JOURNEY"}
                </button>
              )}
            </div>
            <DevotionalDisplay devotional={devotional} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;