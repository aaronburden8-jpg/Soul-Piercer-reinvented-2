
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icons, PROFILES } from './constants';
import { Devotional, ActiveSeries, Profile } from './types';
import { generateDevotionalText } from './services/geminiService';
import DevotionalDisplay from './components/DevotionalDisplay';

type SpiritualFocus = 'non-denominational' | 'catholic' | 'theosophist';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [history, setHistory] = useState<Devotional[]>([]);
  const [activeSeries, setActiveSeries] = useState<ActiveSeries | null>(null);
  const [momentum, setMomentum] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'strike' | 'campaign'>('strike');
  const [focus, setFocus] = useState<SpiritualFocus>('non-denominational');

  useEffect(() => {
    const savedHistory = localStorage.getItem('soul_piercer_v2_history');
    const savedMomentum = localStorage.getItem('soul_piercer_momentum');
    const savedSeries = localStorage.getItem('soul_piercer_active_series');
    const savedFocus = localStorage.getItem('soul_piercer_focus');

    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
    if (savedMomentum) setMomentum(parseInt(savedMomentum));
    if (savedSeries) {
      try { setActiveSeries(JSON.parse(savedSeries)); } catch (e) { console.error(e); }
    }
    if (savedFocus) setFocus(savedFocus as SpiritualFocus);
  }, []);

  const saveToHistory = useCallback((devo: Devotional) => {
    setHistory(prev => {
      const updated = [devo, ...prev].slice(0, 30);
      localStorage.setItem('soul_piercer_v2_history', JSON.stringify(updated));
      return updated;
    });
    setMomentum(prev => {
      const next = prev + 1;
      localStorage.setItem('soul_piercer_momentum', next.toString());
      return next;
    });
  }, []);

  const activeProfile = useMemo(() => {
    const lowerText = input.toLowerCase();
    for (const key in PROFILES) {
      if (lowerText.includes(key)) return { key, profile: PROFILES[key] };
    }
    return null;
  }, [input]);

  const handleGenerate = async (seriesContext: any = null) => {
    if ((!input.trim() && !seriesContext) || loading) return;

    setLoading(true);
    setError(null);
    setStatusText("SYNCHRONIZING...");

    try {
      let prompt = "";
      let lensUsed = "";
      let currentSeriesData = null;

      localStorage.setItem('soul_piercer_focus', focus);

      if (seriesContext) {
        setStatusText("TRIANGULATING CAMPAIGN...");
        lensUsed = `Campaign: Day ${seriesContext.day}`;
        prompt = `Role: Soul Piercer Tactical Devotional Writer. Goal: Day ${seriesContext.day} of ${seriesContext.total} for series "${seriesContext.topic}". Focus: ${focus}. Use structures: Note from Aaron, The Word, The Story, The Reflection, The Action, Heart Check, Key Thought, Closing Prayer. No em dashes.`;
        currentSeriesData = { topic: seriesContext.topic, current: seriesContext.day, total: seriesContext.total };
      } else {
        const profileMatch = activeProfile;
        if (mode === 'campaign') {
          setStatusText("INITIALIZING MISSION...");
          lensUsed = `Campaign: ${input}`;
          currentSeriesData = { topic: input, current: 1, total: 7 };
          prompt = `Start a 7-day campaign on "${input}". Day 1 of 7. Focus: ${focus}. Structured with Note from Aaron, Word, Story, Reflection, Action, Heart Check, Key Thought.`;
        } else if (profileMatch) {
          setStatusText(`LOCKING ON: ${profileMatch.profile.name.toUpperCase()}...`);
          const { profile } = profileMatch;
          lensUsed = `Precision Strike: ${profile.name}`;
          prompt = `Role: Tactical Encourager for ${profile.name}. Tone: ${profile.tone}. Request: "${input}". MANDATORY: ### Note from Aaron, ### The Word, ### The Story, ### The Reflection, ### The Action, ### Heart Check, ### Key Thought, ### Closing Prayer. ${profile.special_instructions}. Signature: ${profile.signature}. No em dashes.`;
        } else {
          setStatusText("CALIBRATING LENS...");
          const lenses = ["Architect", "Mystic", "Scholar", "Protector"];
          lensUsed = lenses[Math.floor(Math.random() * lenses.length)];
          prompt = `Lens: ${lensUsed}. Focus: ${focus}. Topic: ${input}. MANDATORY STRUCTURE: ### Note from Aaron, ### The Word, ### The Story, ### The Reflection, ### The Action, ### Heart Check, ### Key Thought. No em dashes.`;
        }
      }

      const text = await generateDevotionalText(prompt, currentSeriesData ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview');
      
      const newDevo: Devotional = {
        id: `devo_${Date.now()}`,
        content: text || "Transmission interrupted.",
        timestamp: Date.now(),
        input: seriesContext ? `Day ${seriesContext.day}: ${seriesContext.topic}` : input,
        lens: lensUsed,
        series: currentSeriesData
      };

      setDevotional(newDevo);
      saveToHistory(newDevo);
      setInput("");

      if (currentSeriesData && currentSeriesData.current < currentSeriesData.total) {
        const updatedSeries = { ...currentSeriesData, nextDay: currentSeriesData.current + 1 };
        setActiveSeries(updatedSeries);
        localStorage.setItem('soul_piercer_active_series', JSON.stringify(updatedSeries));
      } else {
        setActiveSeries(null);
        localStorage.removeItem('soul_piercer_active_series');
      }

    } catch (err: any) {
      setError(err.message || "Targeting system failure.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  return (
    <div className="min-h-screen pb-32 px-4 md:px-8 max-w-5xl mx-auto pt-10 font-sans">
      {/* Header HUD */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 glass-panel p-8 rounded-[3rem] border border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-6 z-10">
          <div className="w-16 h-16 pierce-gradient rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 active-glow">
            <Icons.Crosshair />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase font-serif-display text-gradient italic">Soul Piercer <span className="text-[12px] font-mono not-italic text-indigo-400 font-bold ml-2">PRO v3.0</span></h1>
            <div className="flex items-center gap-4 mt-1">
               <span className="text-[10px] font-mono text-indigo-400 font-bold tracking-[0.3em] uppercase opacity-70">Grid Status: Active</span>
               <div className="w-1 h-1 rounded-full bg-slate-700"></div>
               <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-[0.3em] uppercase flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> XP: {momentum}
               </span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 z-10">
          <button onClick={() => setDevotional(null)} className="p-4 rounded-2xl glass-panel hover:bg-white/5 transition-all text-slate-400 hover:text-white group">
            <Icons.History />
          </button>
        </div>
      </header>

      <main className="space-y-10">
        {error && (
          <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-[2rem] text-rose-400 font-bold text-center text-sm animate-slide-up crt-flicker">
            [ERROR] {error}
          </div>
        )}

        {/* Campaign HUD */}
        {activeSeries && !loading && !devotional && (
          <div className="glass-panel p-10 rounded-[3rem] border-indigo-500/30 border-2 animate-slide-up relative overflow-hidden active-glow">
            <div className="absolute top-0 right-0 p-8">
              <button onClick={() => {setActiveSeries(null); localStorage.removeItem('soul_piercer_active_series');}} className="text-slate-600 hover:text-rose-400 transition-colors font-mono text-[9px] uppercase tracking-widest">Abort Campaign</button>
            </div>
            <h3 className="text-indigo-400 font-mono font-bold uppercase tracking-[0.4em] text-[10px] mb-6 flex items-center gap-3">
              <Icons.Series /> Strategic Mission Log
            </h3>
            <h2 className="text-3xl md:text-4xl font-black mb-6 font-serif-display italic">{activeSeries.topic}</h2>
            <div className="flex items-center justify-between mb-3 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Day {activeSeries.current} of {activeSeries.total}</span>
              <span className="text-indigo-400">{Math.round((activeSeries.current / activeSeries.total) * 100)}% Synchronized</span>
            </div>
            <div className="w-full h-2 bg-slate-800/50 rounded-full mb-10 overflow-hidden border border-white/5">
              <div className="h-full pierce-gradient transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${(activeSeries.current / activeSeries.total) * 100}%` }}></div>
            </div>
            <button 
              onClick={() => handleGenerate({ ...activeSeries, day: activeSeries.nextDay })}
              className="w-full py-6 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-4 active:scale-95"
            >
              Resume Day {activeSeries.nextDay} <Icons.ChevronRight />
            </button>
          </div>
        )}

        {/* Main Terminal */}
        {!devotional && !activeSeries && (
          <div className="space-y-8 animate-slide-up">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex gap-2 p-1.5 glass-panel rounded-2xl">
                {['strike', 'campaign'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setMode(m as any)}
                    className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 p-1.5 glass-panel rounded-2xl w-full md:w-auto">
                {['non-denominational', 'catholic', 'theosophist'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFocus(f as any)}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-[0.1em] transition-all ${focus === f ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {f.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className={`absolute -inset-2 pierce-gradient rounded-[3.5rem] blur-2xl transition-opacity duration-1000 ${loading ? 'opacity-30 animate-pulse' : 'opacity-5 group-focus-within:opacity-20'}`}></div>
              <div className="relative glass-panel rounded-[3rem] p-3">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'strike' ? "Input target coordinates (topic, verse, or name)..." : "Set campaign objective..."}
                  className="w-full p-10 md:p-12 bg-transparent text-xl md:text-2xl font-light text-white placeholder:text-slate-800 focus:outline-none min-h-[250px] resize-none leading-relaxed font-serif-display italic"
                />
                
                {/* Target Lock Feedback */}
                {activeProfile && (
                  <div className="absolute top-8 right-12 flex items-center gap-3 animate-pulse">
                    <span className="font-mono text-[9px] font-bold text-indigo-400 tracking-[0.3em] uppercase">Target Locked: {activeProfile.profile.name}</span>
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center p-6 gap-6 border-t border-white/5">
                  <div className="font-mono text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] flex items-center gap-4">
                    <span className="flex items-center gap-2"><Icons.Target className="w-3 h-3"/> {mode.toUpperCase()}</span>
                    <span className="w-px h-3 bg-slate-800"></span>
                    <span>{focus.toUpperCase()}</span>
                  </div>
                  <button 
                    onClick={() => handleGenerate()}
                    disabled={loading || !input.trim()}
                    className="w-full md:w-auto h-16 px-12 rounded-2xl pierce-gradient text-white font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-4 group"
                  >
                    {loading ? <><Icons.Loader className="w-5 h-5" /> {statusText}</> : <><Icons.Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Initiate Strike</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Output Area */}
        {devotional && !loading && (
          <div className="space-y-10 animate-slide-up">
            <div className="flex justify-between items-center px-4">
              <button 
                onClick={() => setDevotional(null)}
                className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-all flex items-center gap-4 group"
              >
                <div className="w-8 h-8 rounded-xl glass-panel flex items-center justify-center group-hover:bg-indigo-600 transition-all border border-white/10">
                  <Icons.Crosshair className="w-4 h-4" />
                </div>
                Return to Command Deck
              </button>
              {devotional.series && (
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full">
                  Day {devotional.series.current} of {devotional.series.total}
                </div>
              )}
            </div>
            <DevotionalDisplay devotional={devotional} />
          </div>
        )}

        {/* Mission History */}
        {history.length > 0 && !devotional && (
          <section className="pt-20">
            <h3 className="font-mono text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em] mb-12 flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-slate-800"></div> Archive Logs <div className="h-px w-12 bg-slate-800"></div>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((h) => (
                <button 
                  key={h.id}
                  onClick={() => { setDevotional(h); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="glass-panel p-6 rounded-3xl border-white/5 hover:border-indigo-500/30 transition-all text-left group flex flex-col gap-4 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Icons.Book />
                    </div>
                    <span className="font-mono text-[8px] text-slate-700">{new Date(h.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300 line-clamp-2 group-hover:text-white transition-colors h-10">{h.input}</p>
                    <p className="font-mono text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-4">
                      Protocol: {h.lens}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Persistent Status Bar */}
      <footer className="fixed bottom-0 left-0 w-full p-6 pointer-events-none z-50">
         <div className="max-w-5xl mx-auto glass-panel rounded-2xl p-4 flex items-center justify-between border border-white/10 shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                 <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Health: Optimal</span>
              </div>
              <div className="hidden md:flex items-center gap-3 opacity-40">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
                 <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Network: Encrypted</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <span className="font-mono text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                 {loading ? "TRANSMITTING..." : "READY FOR INPUT"}
               </span>
               <div className={`w-8 h-1 rounded-full overflow-hidden bg-slate-800 ${loading ? 'opacity-100' : 'opacity-20'}`}>
                 <div className={`h-full bg-indigo-500 ${loading ? 'w-full animate-pulse' : 'w-0'}`}></div>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;
