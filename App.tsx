
import React, { useState, useEffect, useMemo } from 'react';
import { Icons, PROFILES, LENS_CONFIG } from './constants';
import { Devotional, ActiveSeries, TacticalLens, SpiritualFocus } from './types';
import { generateDevotionalText } from './services/geminiService';
import DevotionalDisplay from './components/DevotionalDisplay';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [history, setHistory] = useState<Devotional[]>([]);
  const [momentum, setMomentum] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'glimpse' | 'journey'>('glimpse');
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

      // Enhanced religious focus mapping
      const religiousContext = focus === 'non-denominational' 
        ? 'Non-denominational Christian (Biblically grounded and Christ-centered)' 
        : focus;

      // Enhanced Prompt for longer Reflection and softened theme
      const prompt = `
        ACT AS: A soulful devotional writer and compassionate wisdom guide. 
        GOAL: Awaken spiritual hunger and provide deep, grounded hope. 
        TONE: Luminous, warm, expansive, and deeply personal. 
        RELIGIOUS FOCUS: ${religiousContext}. Every section must be rooted in Biblical truth and Christian theology.
        WISDOM PATH: ${selectedLens} (${lensInfo.description})
        
        ${isSeries ? `JOURNEY STATUS: Day ${dayNum} of 7` : 'GLIMPSE STATUS: A single moment of clarity.'}
        TOPIC: ${targetInput}
        
        ${match ? `
        GUIDE INTEL: 
        Profile: ${match.profile.name}
        Relationship: ${match.profile.role}
        Special Instructions: ${match.profile.special_instructions || 'None'}
        ` : 'GUIDE INTEL: Broad spectrum encouragement for a seeking heart.'}

        FLOW OF CONTENT (STRICT ORDER):
        
        ### The Word
        (Provide 1-2 expansive scriptures. Full text + reference. These scriptures set the anchor for the entire devotional.)

        ### First Light
        (A 1-line opening of clarity or gentle tension.)

        ${match ? `### Personal Briefing
        (A warm intro for ${match.profile.name}. 
        MANDATORY CLOSING: End this section only with "${match.profile.signature}")` : ''}

        ### The Story
        (An immersive cinematic metaphor. Gritty, sensory, and beautiful. MIN 300 words.)

        ### The Reflection
        (A DEEP, EXPANSIVE theological and heart-centered exploration. MANDATORY: You must connect the topic to the character of God and Biblical principles. For "non-denominational Christian", this means reflecting on the grace and truth of Jesus and the Word of God. Examine the core of the topic with compassion and depth. Provide at least 400-500 words of meat here.)

        ### Steps Forward
        (2 gentle, practical action steps.)

        ### Wisdom Anchors
        (2 memorable takeaways.)

        ### Heart Mirror
        (3 reflective diagnostic questions.)

        CONSTRAINTS: 
        1. STRICTLY NO EM DASHES (—). Use a comma, colon, or a single short hyphen (-) instead.
        2. Use words like "growth," "light," "anchors," and "paths." 
        3. No signatures outside the Personal Briefing section. 
        4. Generic profiles get no sign-off.
        5. Ensure Biblical grounding is the foundation of the Reflection.
      `;

      setStatusText(isSeries ? `PREPARING DAY ${dayNum} LIGHT...` : "SEEKING WISDOM...");
      const text = await generateDevotionalText(prompt, 'gemini-flash-latest');
      
      const newDevo: Devotional = {
        id: `v4_${Date.now()}`,
        content: text || "Transmission failed.",
        timestamp: Date.now(),
        input: targetInput,
        lens: `${selectedLens}: ${match ? match.profile.name : 'Broad Spectrum'}`,
        seriesDay: isSeries ? dayNum : undefined,
        seriesTotal: isSeries ? 7 : undefined
      };

      setDevotional(newDevo);
      const newHistory = [newDevo, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('soul_piercer_history', JSON.stringify(newHistory));
      
      if (mode === 'journey' && !seriesContext) {
        const newSeries: ActiveSeries = {
          topic: targetInput,
          currentDay: 1,
          totalDays: 7,
          lens: selectedLens,
          focus: focus
        };
        setActiveSeries(newSeries);
        localStorage.setItem('soul_piercer_active_series', JSON.stringify(newSeries));
      } else if (seriesContext) {
        if (seriesContext.currentDay < 7) {
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

  return (
    <div className="min-h-screen pb-24 px-4 pt-8 md:pt-16 max-w-4xl mx-auto">
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
                <p className="text-white font-serif-display text-xl italic">{activeSeries.topic} <span className="text-slate-400 not-italic text-sm ml-3">— Day {activeSeries.currentDay}/7</span></p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {(Object.keys(TacticalLens) as Array<keyof typeof TacticalLens>).map((key) => {
                const l = TacticalLens[key];
                const IconComp = (Icons as any)[LENS_CONFIG[l].icon];
                return (
                  <button 
                    key={l}
                    onClick={() => setSelectedLens(l)}
                    className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] border transition-all ${selectedLens === l ? 'bg-indigo-500 border-indigo-400 text-white shadow-2xl scale-105' : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'}`}
                  >
                    <IconComp className={`w-7 h-7 ${selectedLens === l ? 'text-white' : 'opacity-30'}`} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{l} Path</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex gap-3 p-2 glass-panel rounded-3xl border border-white/10">
                {['glimpse', 'journey'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setMode(m as any)}
                    className={`px-12 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

               <div className="flex gap-2 p-2 glass-panel rounded-3xl border border-white/10 w-full md:w-auto">
                {['non-denominational', 'catholic', 'theosophist'].map(f => (
                  <button key={f} onClick={() => setFocus(f as any)} className={`flex-1 md:flex-none px-7 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${focus === f ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                    {f.split('-')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'glimpse' ? "Seek clarity on a topic, heart-focus, or scripture..." : "Describe a 7-day Journey focus..."}
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
                  {loading ? "BREATHING..." : `EXPLORE ${mode.toUpperCase()}`}
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
