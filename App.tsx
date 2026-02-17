
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons, PROFILES, LENS_CONFIG } from './constants';
import { Devotional, ActiveSeries, TacticalLens, SpiritualFocus } from './types';
import { generateDevotionalText } from './services/geminiService';
import DevotionalDisplay from './components/DevotionalDisplay';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  const timer = useRef<number | null>(null);

  const onEnter = () => {
    timer.current = window.setTimeout(() => setShow(true), 300);
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

  useEffect(() => {
    const savedHistory = localStorage.getItem('soul_piercer_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedMom = localStorage.getItem('soul_piercer_mom');
    if (savedMom) setMomentum(parseInt(savedMom));

    const savedSeries = localStorage.getItem('soul_piercer_active_series');
    if (savedSeries) {
      const parsed = JSON.parse(savedSeries);
      setActiveSeries(parsed);
      // Auto-set lens and focus to match the series when loading
      setSelectedLens(parsed.lens);
      setFocus(parsed.focus);
    }
  }, []);

  const activeProfile = useMemo(() => {
    const lower = input.toLowerCase();
    for (const key in PROFILES) {
      if (lower.includes(key)) return { key, profile: PROFILES[key] };
    }
    return null;
  }, [input]);

  const getTheologyTooltip = (f: SpiritualFocus) => {
    switch(f) {
      case 'non-denominational': return "A Non-denominational, Christ-centered perspective.";
      case 'catholic': return "Wisdom rooted in Catholic tradition and theology.";
      case 'theosophist': return "Insights from Theosophical wisdom and universal truth.";
      default: return "";
    }
  };

  const getSystemPrompt = (lens: TacticalLens, religiousContext: string, match: any, isSeries: boolean, dayNum: number, totalDays: number) => {
    if (lens === TacticalLens.LENT) {
      return `
        SYSTEM INSTRUCTION FOR LENT WALK THE COVENANT (40-DAY CATHOLIC SEASON):
        1. THE PERSONA: Expert Catholic Liturgical Guide. Direct, deep, and soul-piercing.
        2. MANDATORY STRUCTURE:
        
        ### Header
        "Walk the Covenant: 40 Days of Lent" - Day ${dayNum}: [Day Title]
        Scripture: [Reference] - [Short Paraphrase]
        
        ### The Hook
        A sharp, evocative 1-2 sentence emotional opening.

        ### Part 1: The Story
        MANDATORY WORD COUNT: 200-300 WORDS.
        CONTENT: Provide a gritty, relatable, contemporary narrative that mirrors the spiritual tension of the day's liturgical theme. Focus on the raw human struggle with pride, distraction, or self-reliance.

        ### Part 2: The Reflection
        MANDATORY WORD COUNT: 200-300 WORDS.
        CONTENT: A deep Catholic theological and scriptural reflection based strictly on the day's scripture. Bridge the gap between the "Story" and eternal Truth.
        Current Phase Focus: ${dayNum <= 7 ? 'Foundation and Surrender' : dayNum <= 21 ? 'Cleansing and Repentance' : dayNum <= 35 ? 'Mercy and Transformation' : 'Perseverance and Resurrection Preparation'}.

        ### Part 3: The Exchange
        Two deep, piercing Examen-style questions for the soul to wrestle with.

        ### Part 4: The Cord
        A powerful 3-sentence prayer or liturgical anchor to carry through the day.

        3. CONSTRAINTS: NO EM-DASHES (—). Use colons or hyphens. High-end Catholic vocabulary.
      `;
    }
    
    if (lens === TacticalLens.MARRIAGE) {
      return `
        SYSTEM INSTRUCTION FOR MARRIAGE PATH:
        1. THE PERSONA: Expert Devotional Designer & Kingdom Strategist for Couples. 
        2. STRUCTURE: 
        ### Header: Title + Scripture.
        ### The Hook: 1-2 sentence opener.
        ### Part 1: The Insight: 200-300 words. 
        ### Part 2: The Exchange: Two bold questions.
        ### Part 3: The Cord: 3-sentence prayer.
      `;
    }

    if (lens === TacticalLens.WHOLEHEART) {
      return `
        SYSTEM INSTRUCTION FOR WHOLEHEART PATH:
        1. THE PERSONA: Mentor to the Dedicated.
        2. STRUCTURE: 
        ### Header: Title + Scripture.
        ### The Reality: 200 words raw validation.
        ### The Reframing: 200 words theology on completeness.
        ### The Mirror: Two sharp questions.
        ### The Anchor: "I am" declaration.
      `;
    }

    const lensInfo = LENS_CONFIG[lens];
    return `
      ACT AS: A soulful devotional writer and compassionate wisdom guide. 
      RELIGIOUS FOCUS: ${religiousContext}.
      WISDOM PATH: ${lens} (${lensInfo.description})
      ### The Word
      ### First Light
      ### The Story
      ### The Reflection
      ### Steps Forward
      ### Wisdom Anchors
      ### Heart Mirror
    `;
  };

  const handleGenerate = async (seriesContext?: ActiveSeries) => {
    const targetInput = seriesContext ? seriesContext.topic : input;
    const currentDay = seriesContext ? seriesContext.currentDay : 1;
    const totalDays = seriesContext ? seriesContext.totalDays : (selectedLens === TacticalLens.LENT ? 40 : journeyDays);
    const activeLens = seriesContext ? seriesContext.lens : selectedLens;
    const activeFocus = seriesContext ? seriesContext.focus : focus;

    if (!targetInput.trim() && !seriesContext && activeLens !== TacticalLens.LENT) return;

    setLoading(true);
    setError(null);
    setStatusText("SYNCHRONIZING...");

    try {
      const match = activeProfile;
      const isSeries = !!seriesContext || mode === 'journey' || activeLens === TacticalLens.LENT;

      const religiousContext = activeFocus === 'non-denominational' 
        ? 'Non-denominational Christian' 
        : activeFocus;

      const finalTopic = seriesContext ? seriesContext.topic : (activeLens === TacticalLens.LENT ? "Walk the Covenant: 40 Days of Lent" : input);

      const prompt = `
        ${getSystemPrompt(activeLens, religiousContext, match, isSeries, currentDay, totalDays)}
        TOPIC: ${finalTopic}
      `;

      setStatusText(isSeries ? `PREPARING DAY ${currentDay} CHAPTER...` : "SEEKING WISDOM...");
      const text = await generateDevotionalText(prompt, 'gemini-3-pro-preview');
      
      const newDevo: Devotional = {
        id: `v4_${Date.now()}`,
        content: text || "Transmission failed.",
        timestamp: Date.now(),
        input: finalTopic,
        lens: `${activeLens}: ${match ? match.profile.name : 'Broad Spectrum'}`,
        seriesDay: isSeries ? currentDay : undefined,
        seriesTotal: isSeries ? totalDays : undefined
      };

      setDevotional(newDevo);
      const newHistory = [newDevo, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('soul_piercer_history', JSON.stringify(newHistory));
      
      // Update or create active series
      if (isSeries) {
        if (!seriesContext) {
          // Starting a new series
          const newSeries: ActiveSeries = {
            topic: finalTopic,
            currentDay: 2, // Next day to generate
            totalDays: totalDays,
            lens: activeLens,
            focus: activeFocus
          };
          setActiveSeries(newSeries);
          localStorage.setItem('soul_piercer_active_series', JSON.stringify(newSeries));
        } else {
          // Progressing existing series
          if (seriesContext.currentDay < seriesContext.totalDays) {
            const updatedSeries = { ...seriesContext, currentDay: seriesContext.currentDay + 1 };
            setActiveSeries(updatedSeries);
            localStorage.setItem('soul_piercer_active_series', JSON.stringify(updatedSeries));
          } else {
            // Journey completed
            setActiveSeries(null);
            localStorage.removeItem('soul_piercer_active_series');
          }
        }
      }

      setMomentum(prev => prev + 1);
      setInput("");
    } catch (err: any) {
      setError(err.message || "Connection lost.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const startLentSeason = () => {
    setSelectedLens(TacticalLens.LENT);
    setFocus('catholic');
    setMode('journey');
    setJourneyDays(40);
    handleGenerate();
  };

  const resetSeries = () => {
    if (window.confirm("Are you sure you want to abandon your current journey and start over?")) {
      setActiveSeries(null);
      localStorage.removeItem('soul_piercer_active_series');
    }
  };

  const pathways = [
    TacticalLens.EXPLORER,
    TacticalLens.STRATEGIST,
    TacticalLens.ARCHITECT,
    TacticalLens.HEALER,
    TacticalLens.WILDERNESS
  ];

  const seasons = [
    TacticalLens.MARRIAGE,
    TacticalLens.WHOLEHEART,
    TacticalLens.LENT
  ];

  const renderPathButton = (l: TacticalLens) => {
    const IconComp = (Icons as any)[LENS_CONFIG[l].icon];
    const isMarriage = l === TacticalLens.MARRIAGE;
    const isWholeheart = l === TacticalLens.WHOLEHEART;
    const isLent = l === TacticalLens.LENT;
    const isActive = activeSeries?.lens === l;
    
    let style = {};
    if (isMarriage) style = { border: '1px solid rgba(212, 175, 55, 0.5)' };
    if (isWholeheart) style = { border: '1px solid rgba(226, 232, 240, 0.6)' };
    if (isLent) style = { border: '1px solid rgba(168, 85, 247, 0.4)' };

    return (
      <Tooltip key={l} text={l === TacticalLens.LENT ? "Click to walk the 40 day Lent series" : LENS_CONFIG[l].description}>
        <button 
          onClick={() => l === TacticalLens.LENT ? startLentSeason() : setSelectedLens(l)}
          style={style}
          className={`w-full flex flex-col items-center gap-4 p-6 rounded-[2rem] border transition-all relative overflow-hidden ${selectedLens === l ? 'bg-indigo-500 border-indigo-400 text-white shadow-2xl scale-105' : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'} ${isMarriage ? 'hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]' : ''} ${isWholeheart ? 'hover:shadow-[0_0_20px_rgba(226,232,240,0.2)]' : ''} ${isLent ? 'hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''}`}
        >
          {isActive && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[8px] font-mono text-emerald-300 font-bold uppercase">ACTIVE</span>
            </div>
          )}
          <IconComp className={`w-7 h-7 ${selectedLens === l ? 'text-white' : isMarriage ? 'text-amber-200/50' : isWholeheart ? 'text-slate-200/50' : isLent ? 'text-purple-300/50' : 'opacity-30'}`} />
          <span className={`text-[11px] font-bold uppercase tracking-widest`}>{l === TacticalLens.LENT ? "Lent Series" : `${l} Path`}</span>
        </button>
      </Tooltip>
    );
  };

  const renderActiveDashboard = () => {
    if (!activeSeries) return null;

    const isLent = activeSeries.lens === TacticalLens.LENT;
    const progress = ((activeSeries.currentDay - 1) / activeSeries.totalDays) * 100;
    const accentColor = isLent ? 'rgba(168, 85, 247, 0.6)' : 'rgba(129, 140, 248, 0.6)';
    const IconComp = (Icons as any)[LENS_CONFIG[activeSeries.lens].icon];

    return (
      <div className="animate-slide-up mb-12">
        <div className="glass-panel p-10 rounded-[3.5rem] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 opacity-20 bg-white/10">
            <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${progress}%`, boxShadow: `0 0 15px ${accentColor}` }}></div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white border border-white/10 ${isLent ? 'bg-purple-500/20' : 'bg-indigo-500/20'}`}>
                <IconComp className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.5em] mb-2">Current Covenant</h3>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-serif-display text-white italic">{activeSeries.topic}</span>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-indigo-300 uppercase tracking-widest font-bold">
                    Day {activeSeries.currentDay} of {activeSeries.totalDays}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Tooltip text="Discard progress and reset series.">
                <button onClick={resetSeries} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-red-500/20 border border-white/5 text-slate-500 hover:text-red-400 transition-all">
                  <Icons.Target className="w-5 h-5 opacity-50" />
                </button>
              </Tooltip>
              <button 
                onClick={() => handleGenerate(activeSeries)}
                disabled={loading}
                className="px-10 py-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-mono text-[11px] font-black uppercase tracking-[0.3em] shadow-xl transition-all flex items-center gap-4 group"
              >
                {loading ? <Icons.Loader className="w-4 h-4" /> : <Icons.Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                {loading ? "BREATHING..." : "ENTER NEXT CHAPTER"}
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
            <h1 className="text-3xl font-black uppercase tracking-tighter text-gradient font-serif-display leading-none">The Soul Piercer <span className="text-[14px] font-mono not-italic text-indigo-300 opacity-60 ml-2">v4.2 Sanctuary</span></h1>
            <div className="flex items-center gap-5 mt-3">
              <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div> SOUL_CONNECTED
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.3em]">MOMENTUM: {momentum}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-5 mt-8 md:mt-0">
          <button onClick={() => setDevotional(null)} className="w-14 h-14 flex items-center justify-center rounded-3xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/10" title="History">
            <Icons.History className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="relative">
        {error && (
          <div className="mb-10 bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-red-200 font-mono text-[12px] text-center uppercase tracking-[0.3em]">
            [NOTICE] {error}
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
                  <span className="font-mono text-[10px] text-slate-500 tracking-[0.5em] uppercase font-black">Seasons</span>
                  <div className="h-px flex-1 bg-white/10"></div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                 {seasons.map(renderPathButton)}
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex gap-3 p-2 glass-panel rounded-3xl border border-white/10 items-center">
                <Tooltip text="A single, immediate insight for the present moment.">
                  <button onClick={() => setMode('glimpse')} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'glimpse' ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}>Glimpse</button>
                </Tooltip>
                <Tooltip text="Create a multi-day devotional path to walk through.">
                  <button onClick={() => setMode('journey')} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'journey' ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}>Journey</button>
                </Tooltip>
                {mode === 'journey' && selectedLens !== TacticalLens.LENT && !activeSeries && (
                  <div className="flex items-center gap-3 px-6 border-l border-white/10">
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">Days:</span>
                    <input type="number" min="1" max="30" value={journeyDays} onChange={(e) => setJourneyDays(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))} className="w-14 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-white font-mono text-sm" />
                  </div>
                )}
              </div>
               <div className="flex gap-2 p-2 glass-panel rounded-3xl border border-white/10">
                {(['non-denominational', 'catholic', 'theosophist'] as SpiritualFocus[]).map(f => (
                  <Tooltip key={f} text={getTheologyTooltip(f)}>
                    <button key={f} onClick={() => setFocus(f as any)} className={`px-7 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${focus === f ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                      {f === 'non-denominational' ? 'NON-DENOM' : f.toUpperCase()}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            {!activeSeries && (
              <div className="relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={selectedLens === TacticalLens.LENT ? "Focusing on Walk the Covenant: 40 Days of Lent..." : "Enter your focus..."} className="w-full glass-panel rounded-[3.5rem] p-12 md:p-20 text-3xl md:text-4xl font-serif-display italic text-white placeholder:text-slate-700 focus:outline-none min-h-[400px] resize-none transition-all leading-relaxed" />
                <div className="absolute bottom-12 right-12 flex items-center gap-6">
                  <button onClick={() => handleGenerate()} disabled={loading || (!input.trim() && selectedLens !== TacticalLens.LENT)} className="px-16 py-6 rounded-3xl luminous-gradient text-white font-mono text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-20 flex items-center gap-5">
                    {loading ? <Icons.Loader className="w-5 h-5" /> : <Icons.Send className="w-5 h-5" />}
                    {loading ? "BREATHING..." : mode === 'journey' ? `START JOURNEY` : `EXPLORE GLIMPSE`}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-slide-up pb-24">
            <div className="flex justify-between items-center mb-10 px-6">
              <button onClick={() => setDevotional(null)} className="text-slate-400 hover:text-white font-mono text-[11px] uppercase tracking-widest flex items-center gap-4 transition-all">
                <Icons.ChevronRight className="rotate-180 w-5 h-5" /> RETURN TO SANCTUARY
              </button>
              <div className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-bold">{devotional.lens}</div>
            </div>
            <DevotionalDisplay devotional={devotional} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
