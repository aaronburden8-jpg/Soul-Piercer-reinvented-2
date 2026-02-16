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

  // Verify API Key presence
  useEffect(() => {
    if (!process.env.API_KEY) {
      console.warn("API Key Missing from Environment. Check Netlify Environment Variables.");
      setError("UPLINK FAILURE: API KEY NOT DETECTED. Check Netlify Settings.");
    }
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('soul_piercer_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedMom = localStorage.getItem('soul_piercer_mom');
    if (savedMom) setMomentum(parseInt(savedMom));

    const savedSeries = localStorage.getItem('soul_piercer_series');
    if (savedSeries) setActiveSeries(JSON.parse(savedSeries));
  }, []);

  const activeProfile = useMemo(() => {
    const lower = input.toLowerCase();
    for (const key in PROFILES) {
      if (lower.includes(key)) return { key, profile: PROFILES[key] };
    }
    return null;
  }, [input]);

  const handleGenerate = async (seriesContext: any = null) => {
    if ((!input.trim() && !seriesContext) || loading) return;

    setLoading(true);
    setError(null);
    setStatusText("SYNCHRONIZING...");

    try {
      if (!process.env.API_KEY) throw new Error("API Key not configured in system environment.");

      let prompt = "";
      let lensUsed = "";

      if (seriesContext) {
        setStatusText("TRIANGULATING CAMPAIGN...");
        lensUsed = `Campaign Day ${seriesContext.day}`;
        prompt = `Write Day ${seriesContext.day} of ${seriesContext.total} for series "${seriesContext.topic}". Focus: ${focus}. Use structures: ### Note from Aaron, ### The Word, ### The Story, ### The Reflection, ### The Action, ### Key Thought, ### Closing Prayer. No em dashes.`;
      } else {
        const match = activeProfile;
        if (mode === 'campaign') {
          setStatusText("CALCULATING TRAJECTORY...");
          lensUsed = "Campaign Start";
          prompt = `Begin a 7-day campaign on "${input}". Day 1 of 7. Focus: ${focus}. Use headers like ### Note from Aaron, ### The Word, etc.`;
        } else if (match) {
          setStatusText(`LOCKING ON: ${match.profile.name.toUpperCase()}...`);
          lensUsed = `Strike: ${match.profile.name}`;
          prompt = `Tactical devotional for ${match.profile.name}. Tone: ${match.profile.tone}. Topic: ${input}. MANDATORY HEADERS: ### Note from Aaron, ### The Word, ### The Story, ### The Reflection, ### The Action, ### Key Thought, ### Closing Prayer. ${match.profile.special_instructions}. Signature: ${match.profile.signature}. No em dashes.`;
        } else {
          setStatusText("SCANNING SPIRITUAL GRID...");
          lensUsed = "Broad Spectrum";
          prompt = `Topic: ${input}. Focus: ${focus}. Use headers ### Note from Aaron, ### The Word, ### Key Thought, ### The Action. No em dashes.`;
        }
      }

      // Senior Engineer: Switched to 'gemini-3-flash-preview' for both modes to utilize the free tier quota reliably.
      const text = await generateDevotionalText(prompt, 'gemini-3-flash-preview');
      
      const newDevo: Devotional = {
        id: `v3_${Date.now()}`,
        content: text || "Transmission failed.",
        timestamp: Date.now(),
        input: seriesContext ? `Series Day ${seriesContext.day}` : input,
        lens: lensUsed
      };

      setDevotional(newDevo);
      const newHistory = [newDevo, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('soul_piercer_history', JSON.stringify(newHistory));
      
      const newMom = momentum + 1;
      setMomentum(newMom);
      localStorage.setItem('soul_piercer_mom', newMom.toString());

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
      {/* HUD Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-12 glass-panel p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 pierce-gradient rounded-3xl flex items-center justify-center text-white active-glow shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Icons.Crosshair className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-gradient font-serif-display leading-none">Soul Piercer <span className="text-[12px] font-mono not-italic text-indigo-400 opacity-70">PRO v3.1</span></h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> GRID STATUS: ACTIVE
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-800"></div>
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">XP: {momentum}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6 md:mt-0">
          <button 
            onClick={() => setDevotional(null)} 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5"
            title="History"
          >
            <Icons.History className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="relative">
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 font-mono text-[11px] text-center uppercase tracking-[0.3em] active-glow">
            [ERROR] {error}
          </div>
        )}

        {!devotional ? (
          <div className="space-y-8 animate-slide-up">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex gap-2 p-1.5 glass-panel rounded-2xl border border-white/5">
                {['strike', 'campaign'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setMode(m as any)}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="flex gap-1.5 p-1.5 glass-panel rounded-2xl border border-white/5">
                {['non-denominational', 'catholic', 'theosophist'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFocus(f as any)}
                    className={`px-5 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${focus === f ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {f.split('-')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'strike' ? "Specify target (Name, Verse, or Topic)..." : "Define campaign scope..."}
                className="w-full glass-panel rounded-[2.5rem] p-10 md:p-16 text-2xl md:text-3xl font-serif-display italic text-white placeholder:text-slate-800 focus:outline-none min-h-[250px] md:min-h-[350px] resize-none transition-all focus:border-indigo-500/20 shadow-inner"
              />
              
              {activeProfile && (
                <div className="absolute top-8 right-12 flex items-center gap-3 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                  <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest font-bold">LOCKED: {activeProfile.profile.name}</span>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-pulse"></div>
                </div>
              )}

              <div className="absolute bottom-10 right-10 left-10 flex items-center justify-between">
                <div className="font-mono text-[10px] text-slate-600 tracking-[0.4em] uppercase hidden md:flex items-center gap-3">
                  <Icons.Target className="w-3 h-3 opacity-30" /> {statusText || "SYSTEM_IDLE"}
                </div>
                <button 
                  onClick={() => handleGenerate()}
                  disabled={loading || !input.trim()}
                  className="px-12 py-5 rounded-2xl pierce-gradient text-white font-mono text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100 flex items-center gap-4"
                >
                  {loading ? <Icons.Loader className="w-4 h-4" /> : <Icons.Send className="w-4 h-4" />}
                  {loading ? "TRANSMITTING" : `INITIATE ${mode.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up pb-24">
            <div className="flex justify-between items-center mb-8 px-4">
              <button 
                onClick={() => setDevotional(null)}
                className="text-slate-500 hover:text-white font-mono text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all group"
              >
                <Icons.ChevronRight className="rotate-180 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> TERMINATE SESSION
              </button>
              <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold opacity-60">
                UPLINK_LENS: {devotional.lens}
              </div>
            </div>
            <DevotionalDisplay devotional={devotional} />
          </div>
        )}

        {history.length > 0 && !devotional && !loading && (
          <div className="mt-20">
            <h3 className="text-slate-700 font-mono text-[10px] tracking-[0.5em] uppercase mb-8 px-4">Archived Transmissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
              {history.map(h => (
                <button 
                  key={h.id}
                  onClick={() => setDevotional(h)}
                  className="glass-panel p-6 rounded-2xl text-left hover:border-indigo-500/40 transition-all group border border-white/5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                      {new Date(h.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-[8px] font-mono text-indigo-500/50 uppercase tracking-widest">{h.lens.split(':')[0]}</div>
                  </div>
                  <div className="text-[13px] text-slate-300 font-bold line-clamp-1 mb-1 group-hover:text-white transition-colors">
                    {h.input}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Tactical HUD */}
      <footer className="fixed bottom-0 left-0 w-full p-6 pointer-events-none z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-10 py-4 glass-panel rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
              <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Uplink: STABLE</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-white/10"></div>
            <div className="hidden md:block font-mono text-[9px] text-slate-600 uppercase tracking-widest">SECURE_TUNNEL: 256-BIT</div>
          </div>
          <div className="font-mono text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-3">
            {loading ? "PROCESSING TRANSMISSION..." : "AWAITING TARGET"}
            <div className={`w-1 h-3 bg-indigo-500/50 ${loading ? 'animate-bounce' : 'opacity-20'}`}></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;