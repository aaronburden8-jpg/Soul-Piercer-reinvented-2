
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
    if (savedSeries) setActiveSeries(JSON.parse(savedSeries));
  }, []);

  const activeProfile = useMemo(() => {
    const lower = input.toLowerCase();
    for (const key in PROFILES) {
      if (lower.includes(key)) return { key, profile: PROFILES[key] };
    }
    return null;
  }, [input]);

  const handleGenerate = async (seriesContext?: ActiveSeries) => {
    const targetInput = seriesContext ? seriesContext.topic : input;
    if (!targetInput.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStatusText("SYNCHRONIZING...");

    try {
      const match = activeProfile;
      const lensInfo = LENS_CONFIG[selectedLens];
      const dayNum = seriesContext ? seriesContext.currentDay : 1;
      const isSeries = !!seriesContext || mode === 'journey';
      const totalDays = seriesContext ? seriesContext.totalDays : journeyDays;

      const religiousContext = focus === 'non-denominational' 
        ? 'Non-denominational Christian (Biblically grounded, Christ-centered, focusing on the Gospel of Grace)' 
        : focus;

      const prompt = `
        ACT AS: A soulful devotional writer and compassionate wisdom guide. 
        GOAL: Awaken spiritual hunger and provide deep, grounded hope. 
        TONE: Luminous, warm, expansive, and deeply personal. 
        RELIGIOUS FOCUS: ${religiousContext}. Every section must be rooted in Biblical truth.
        WISDOM PATH: ${selectedLens} (${lensInfo.description})
        
        ${isSeries ? `JOURNEY STATUS: Day ${dayNum} of ${totalDays}. 
        This is a PROGRESSIVE NARRATIVE ARC spanning ${totalDays} days. 
        - Early Phase (approx. first 25% of days): Establishing the spiritual tension and the foundation of the path.
        - Middle Phase (approx. middle 50% of days): Deepening complexity, trials of the heart, persistent growth, and the "messy middle."
        - Final Phase (approx. final 25% of days): The synthesis of wisdom and the ultimate complex realization of the topic.
        MANDATORY: Do not repeat previous day narrative beats. Advance the story chapter-by-chapter. Build to a sophisticated climax.` : 'GLIMPSE STATUS: A single moment of clarity.'}
        
        TOPIC: ${targetInput}
        
        ${match ? `
        GUIDE INTEL: 
        Profile: ${match.profile.name}
        Relationship: ${match.profile.role}
        Tone: ${match.profile.tone}
        Special Instructions: ${match.profile.special_instructions || 'None'}
        ` : 'GUIDE INTEL: Broad spectrum encouragement for a seeking heart.'}

        FLOW OF CONTENT (STRICT ORDER):
        
        ### The Word
        (Provide 1-2 expansive scriptures. Full text + reference.)

        ### First Light
        (A 1-line opening of clarity or gentle tension.)

        ${match ? `### Personal Briefing
        (A deep, warm, and highly personalized note for ${match.profile.name}. 
        LENGTH: Minimum 150 words. 
        CONTENT: Explore the heart-connection, specific life-context, and spiritual encouragement tailored to ${match.profile.name}. Do not be generic. 
        MANDATORY CLOSING: End this section ONLY with "${match.profile.signature}")` : ''}

        ### The Story
        (An immersive cinematic metaphor. Gritty, sensory, and beautiful. 
        LENGTH: Strictly between 200 and 300 words. 
        JOURNEY NOTE: This must feel like a specific "chapter" of a larger ${totalDays}-day story. Avoid summary; move into new territory.)

        ### The Reflection
        (A deep theological and heart-centered exploration. 
        MANDATORY: You MUST explicitly connect the topic to the character of God, the grace of Jesus, and Biblical principles. 
        LENGTH: Strictly between 200 and 300 words. 
        CONTENT: Do not repeat the story. Provide new theological insight building toward a complex conceptual realization.)

        ### Steps Forward
        (2 gentle, practical action steps.)

        ### Wisdom Anchors
        (2 memorable takeaways.)

        ### Heart Mirror
        (3 reflective diagnostic questions.)

        CONSTRAINTS: 
        1. STRICTLY NO EM DASHES (—). Use a comma, colon, or a single short hyphen (-) instead.
        2. NO REPETITION across the ${totalDays}-day Journey arc.
        3. ALL PERSONAL NOTES must be at least 150 words of deep substance.
        4. Reflection MUST be Christian-Biblical for non-denominational focus.
      `;

      setStatusText(isSeries ? `PREPARING DAY ${dayNum} CHAPTER...` : "SEEKING WISDOM...");
      const text = await generateDevotionalText(prompt, 'gemini-flash-latest');
      
      const newDevo: Devotional = {
        id: `v4_${Date.now()}`,
        content: text || "Transmission failed.",
        timestamp: Date.now(),
        input: targetInput,
        lens: `${selectedLens}: ${match ? match.profile.name : 'Broad Spectrum'}`,
        seriesDay: isSeries ? dayNum : undefined,
        seriesTotal: isSeries ? totalDays : undefined
      };

      setDevotional(newDevo);
      const newHistory = [newDevo, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('soul_piercer_history', JSON.stringify(newHistory));
      
      if (mode === 'journey' && !seriesContext) {
        const newSeries: ActiveSeries = {
          topic: targetInput,
          currentDay: 1,
          totalDays: totalDays,
          lens: selectedLens,
          focus: focus
        };
        setActiveSeries(newSeries);
        localStorage.setItem('soul_piercer_active_series', JSON.stringify(newSeries));
      } else if (seriesContext) {
        if (seriesContext.currentDay < seriesContext.totalDays) {
          const updatedSeries = { ...seriesContext, currentDay: seriesContext.currentDay + 1 };
          setActiveSeries(updatedSeries);
          localStorage.setItem('soul_piercer_active_series', JSON.stringify(updatedSeries));
        } else {
          setActiveSeries(null);
          localStorage.removeItem('soul_piercer_active_series');
        }
      }

      setMomentum(prev => {
        const next = prev + 1;
        localStorage.setItem('soul_piercer_mom', next.toString());
        return next;
      });

      setInput("");
      setStatusText("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Connection lost.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const getTheologyTooltip = (f: SpiritualFocus) => {
    switch(f) {
      case 'non-denominational': return "A Non-denominational, Christ-centered perspective.";
      case 'catholic': return "Wisdom rooted in Catholic tradition and theology.";
      case 'theosophist': return "Insights from Theosophical wisdom and universal truth.";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-8 md:pt-16 max-w-5xl mx-auto">
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

        {activeSeries && !devotional && !loading && (
          <div className="mb-10 p-8 glass-panel rounded-[2.5rem] border border-indigo-400/30 bg-indigo-500/5 animate-slide-up flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-500/10 rounded-2xl">
                <Icons.Calendar className="w-7 h-7 text-indigo-300" />
              </div>
              <div>
                <h4 className="text-[11px] font-mono font-black uppercase tracking-widest text-indigo-300">Active Journey</h4>
                <p className="text-white font-serif-display text-xl italic">{activeSeries.topic} <span className="text-slate-400 not-italic text-sm ml-3">— Day {activeSeries.currentDay}/{activeSeries.totalDays}</span></p>
              </div>
            </div>
            <button 
              onClick={() => handleGenerate(activeSeries)}
              className="px-10 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-mono text-[11px] uppercase tracking-widest font-bold shadow-2xl transition-all"
            >
              Continue Journey
            </button>
          </div>
        )}

        {!devotional ? (
          <div className="space-y-8 animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
              {(Object.keys(TacticalLens) as Array<keyof typeof TacticalLens>).map((key) => {
                const l = TacticalLens[key];
                const IconComp = (Icons as any)[LENS_CONFIG[l].icon];
                return (
                  <Tooltip key={l} text={LENS_CONFIG[l].description}>
                    <button 
                      onClick={() => setSelectedLens(l)}
                      className={`w-full flex flex-col items-center gap-4 p-6 rounded-[2rem] border transition-all ${selectedLens === l ? 'bg-indigo-500 border-indigo-400 text-white shadow-2xl scale-105' : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'}`}
                    >
                      <IconComp className={`w-7 h-7 ${selectedLens === l ? 'text-white' : 'opacity-30'}`} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">{l} Path</span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex gap-3 p-2 glass-panel rounded-3xl border border-white/10 items-center">
                <Tooltip text="A single, immediate insight for the present moment.">
                  <button 
                    onClick={() => setMode('glimpse')}
                    className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'glimpse' ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Glimpse
                  </button>
                </Tooltip>
                <Tooltip text="Create a multi-day devotional path to walk through.">
                  <button 
                    onClick={() => setMode('journey')}
                    className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'journey' ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Journey
                  </button>
                </Tooltip>
                
                {mode === 'journey' && (
                  <div className="flex items-center gap-3 px-6 border-l border-white/10 animate-slide-up">
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">Days:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="30" 
                      value={journeyDays}
                      onChange={(e) => setJourneyDays(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-14 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-white font-mono text-sm focus:outline-none focus:border-indigo-400/40"
                    />
                  </div>
                )}
              </div>

               <div className="flex gap-2 p-2 glass-panel rounded-3xl border border-white/10 w-full md:w-auto">
                {['non-denominational', 'catholic', 'theosophist'].map(f => (
                  <Tooltip key={f} text={getTheologyTooltip(f as SpiritualFocus)}>
                    <button onClick={() => setFocus(f as any)} className={`px-7 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${focus === f ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                      {f.split('-')[0]}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="relative group">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'glimpse' ? "Seek clarity on a topic, heart-focus, or scripture..." : "Describe a Journey focus..."}
                className="w-full glass-panel rounded-[3.5rem] p-12 md:p-20 text-3xl md:text-4xl font-serif-display italic text-white placeholder:text-slate-700 focus:outline-none min-h-[400px] resize-none transition-all focus:border-indigo-400/40 shadow-inner leading-relaxed"
              />
              
              {activeProfile && (
                <div className="absolute top-10 right-14 flex items-center gap-4 bg-indigo-500/20 px-6 py-3 rounded-full border border-indigo-400/30">
                  <span className="font-mono text-[11px] text-indigo-200 uppercase tracking-widest font-bold">FOCUS: {activeProfile.profile.name}</span>
                  <div className="w-3 h-3 rounded-full bg-indigo-400 aura-glow"></div>
                </div>
              )}

              <div className="absolute bottom-12 right-12 left-12 flex items-center justify-between">
                <div className="font-mono text-[11px] text-slate-500 tracking-[0.5em] uppercase hidden md:flex items-center gap-4">
                  <Icons.Target className="w-5 h-5 opacity-30" /> {statusText || "AWAITING_FOCUS"}
                </div>
                <button 
                  onClick={() => handleGenerate()}
                  disabled={loading || !input.trim()}
                  className="px-16 py-6 rounded-3xl luminous-gradient text-white font-mono text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-20 flex items-center gap-5"
                >
                  {loading ? <Icons.Loader className="w-5 h-5" /> : <Icons.Send className="w-5 h-5" />}
                  {loading ? "BREATHING..." : mode === 'journey' ? `START ${journeyDays}-DAY JOURNEY` : `EXPLORE GLIMPSE`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up pb-24">
            <div className="flex justify-between items-center mb-10 px-6">
              <button onClick={() => setDevotional(null)} className="text-slate-400 hover:text-white font-mono text-[11px] uppercase tracking-widest flex items-center gap-4 transition-all group">
                <Icons.ChevronRight className="rotate-180 w-5 h-5 group-hover:-translate-x-2 transition-transform" /> RETURN TO SANCTUARY
              </button>
              <div className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-bold">
                {devotional.lens}
              </div>
            </div>
            <DevotionalDisplay devotional={devotional} />
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-8 pointer-events-none z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-12 py-6 glass-panel rounded-[2.5rem] border border-white/20 pointer-events-auto shadow-2xl">
          <div className="flex gap-10 items-center">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-emerald-400 aura-glow"></div>
              <span className="font-mono text-[10px] text-slate-300 uppercase tracking-widest">HARMONY: STABLE</span>
            </div>
          </div>
          <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-5">
            {loading ? "RECEIVING WORDS..." : "AWAITING YOUR HEART"}
            <div className={`w-1.5 h-5 bg-indigo-400/40 rounded-full ${loading ? 'animate-pulse' : 'opacity-20'}`}></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
