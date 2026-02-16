
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
  const [mode, setMode] = useState<'strike' | 'campaign'>('strike');
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
      const isSeries = !!seriesContext || mode === 'campaign';

      // Implementation of "Refined Prompt Version 1.7" with user-requested signature rules
      const prompt = `
        ACT AS: A master devotional writer and spiritual strategist. 
        GOAL: Penetrate the heart, awaken obedience, and stir spiritual hunger. 
        TONE: Immersive, urgent, and personal. 
        RELIGIOUS FOCUS: ${focus}
        TACTICAL LENS: ${selectedLens} (${lensInfo.description})
        
        ${isSeries ? `CAMPAIGN STATUS: Day ${dayNum} of 7` : 'STRIKE STATUS: Single Tactical Engagement'}
        TARGET TOPIC: ${targetInput}
        
        ${match ? `
        AUDIENCE_INTEL: 
        Profile Locked: ${match.profile.name}
        Role: ${match.profile.role}
        Instructions: ${match.profile.special_instructions || 'None'}
        ` : 'AUDIENCE_INTEL: Broad Spectrum engagement.'}

        REQUIRED FORMATTING (STRICT ORDER):
        
        ### The Word
        (Divine Authority First. 1-2 scriptures. Full text + reference.)

        ### Tactical Hook
        (1-line hook previewing tension/conflict.)

        ${match ? `### Note from Aaron
        (Personal voice-note intro for ${match.profile.name}. 
        MANDATORY CLOSING: You must end this specific section with "${match.profile.signature}")` : ''}

        ### The Story
        (LONG immersive narrative metaphor. High-stakes, sensory, gritty. MIN 300 words. NO signature here.)

        ### The Reflection
        (Theological depth. Align with Yahweh's nature.)

        ### The Action
        (2 practical application steps.)

        ### Key Thoughts
        (2 memorable takeaways.)

        ### Heart Check
        (3 sharp diagnostic questions.)

        CONSTRAINTS: No em dashes. No generic signatures outside the Note from Aaron section. Generic profiles get NO sign-offs at all.
      `;

      setStatusText(isSeries ? `DEPLOYING DAY ${dayNum} MODULE...` : "ENGAGING SPIRITUAL GRID...");
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
      
      if (mode === 'campaign' && !seriesContext) {
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
      setError(err.message || "Uplink disconnected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-8 md:pt-16 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 glass-panel p-8 rounded-[2rem] border border-white/20 relative overflow-hidden group shadow-[0_0_50px_rgba(99,102,241,0.1)]">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 pierce-gradient rounded-3xl flex items-center justify-center text-white active-glow shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Icons.Crosshair className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-gradient font-serif-display leading-none">Soul Piercer <span className="text-[12px] font-mono not-italic text-indigo-400 opacity-70">ULTRA v4.1</span></h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> GRID: OPTIMIZED
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-700"></div>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em]">STREAK: {momentum}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6 md:mt-0">
          <button onClick={() => setDevotional(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/20 text-slate-300 transition-all border border-white/10" title="History">
            <Icons.History className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="relative">
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-300 font-mono text-[11px] text-center uppercase tracking-[0.3em] active-glow">
            [CRITICAL_FAILURE] {error}
          </div>
        )}

        {activeSeries && !devotional && !loading && (
          <div className="mb-8 p-6 glass-panel rounded-2xl border border-indigo-500/40 bg-indigo-500/10 animate-slide-up flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <Icons.Calendar className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-300">Active Campaign</h4>
                <p className="text-white font-serif-display text-lg italic">{activeSeries.topic} <span className="text-slate-400 not-italic text-sm ml-2">— Day {activeSeries.currentDay}/7</span></p>
              </div>
            </div>
            <button 
              onClick={() => handleGenerate(activeSeries)}
              className="px-8 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-mono text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-indigo-500/40 transition-all hover:scale-105 active:scale-95"
            >
              Continue Campaign
            </button>
          </div>
        )}

        {!devotional ? (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(Object.keys(TacticalLens) as Array<keyof typeof TacticalLens>).map((key) => {
                const l = TacticalLens[key];
                const IconComp = (Icons as any)[LENS_CONFIG[l].icon];
                return (
                  <button 
                    key={l}
                    onClick={() => setSelectedLens(l)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all ${selectedLens === l ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}
                  >
                    <IconComp className={`w-6 h-6 ${selectedLens === l ? 'text-white' : 'opacity-40'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{l}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex gap-2 p-1.5 glass-panel rounded-2xl border border-white/10">
                {['strike', 'campaign'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setMode(m as any)}
                    className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

               <div className="flex gap-1.5 p-1.5 glass-panel rounded-2xl border border-white/10 w-full md:w-auto">
                {['non-denominational', 'catholic', 'theosophist'].map(f => (
                  <button key={f} onClick={() => setFocus(f as any)} className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${focus === f ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                    {f.split('-')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'strike' ? "Coordinate Strike (Topic, Name, Verse)..." : "Initiate 7-Day Campaign Topic..."}
                className="w-full glass-panel rounded-[2.5rem] p-10 md:p-16 text-2xl md:text-3xl font-serif-display italic text-white placeholder:text-slate-600 focus:outline-none min-h-[300px] resize-none transition-all focus:border-indigo-400/40 shadow-inner"
              />
              
              {activeProfile && (
                <div className="absolute top-8 right-12 flex items-center gap-3 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-400/30">
                  <span className="font-mono text-[10px] text-indigo-300 uppercase tracking-widest font-bold">LOCKED: {activeProfile.profile.name}</span>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_15px_#818cf8] animate-pulse"></div>
                </div>
              )}

              <div className="absolute bottom-10 right-10 left-10 flex items-center justify-between">
                <div className="font-mono text-[10px] text-slate-500 tracking-[0.4em] uppercase hidden md:flex items-center gap-3">
                  <Icons.Target className="w-4 h-4 opacity-40" /> {statusText || "READY_FOR_ENGAGEMENT"}
                </div>
                <button 
                  onClick={() => handleGenerate()}
                  disabled={loading || !input.trim()}
                  className="px-14 py-5 rounded-2xl pierce-gradient text-white font-mono text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-105 hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-20 flex items-center gap-4"
                >
                  {loading ? <Icons.Loader className="w-4 h-4" /> : <Icons.Send className="w-4 h-4" />}
                  {loading ? "PROCESSING..." : `INITIATE ${mode.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up pb-24">
            <div className="flex justify-between items-center mb-8 px-4">
              <button onClick={() => setDevotional(null)} className="text-slate-400 hover:text-white font-mono text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all group">
                <Icons.ChevronRight className="rotate-180 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> TERMINATE SESSION
              </button>
              <div className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest font-bold opacity-80">
                LENS_ENGAGED: {devotional.lens}
              </div>
            </div>
            <DevotionalDisplay devotional={devotional} />
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-6 pointer-events-none z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-10 py-5 glass-panel rounded-3xl border border-white/20 pointer-events-auto shadow-2xl">
          <div className="flex gap-8 items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse"></div>
              <span className="font-mono text-[9px] text-slate-300 uppercase tracking-widest">UPLINK: OPTIMAL</span>
            </div>
          </div>
          <div className="font-mono text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-4">
            {loading ? "TRANSMITTING BRIEFING..." : "AWAITING TARGET COORDINATES"}
            <div className={`w-1.5 h-4 bg-indigo-400 ${loading ? 'animate-bounce' : 'opacity-20'}`}></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
