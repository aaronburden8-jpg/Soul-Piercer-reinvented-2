import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons, LENS_CONFIG } from './constants';
import { Devotional, ActiveSeries, TacticalLens, SpiritualFocus } from './types';
import { generateDevotionalText, generateDevotionalStream } from './services/geminiService';
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
  TacticalLens.YOUNG_ADULT,
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
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="absolute bottom-full left-1/2 mb-4 w-64 p-4 glass-panel rounded-2xl text-[10px] text-white font-mono uppercase tracking-[0.2em] text-center z-[100] pointer-events-none"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [history, setHistory] = useState<Devotional[]>([]);
  const [momentum, setMomentum] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'glimpse' | 'journey'>('glimpse');
  const [journeyDays, setJourneyDays] = useState(7);
  const [focus, setFocus] = useState<SpiritualFocus>('non-denominational');
  const [selectedLens, setSelectedLens] = useState<TacticalLens>(TacticalLens.WILDERNESS);
  const [activeSeries, setActiveSeries] = useState<ActiveSeries | null>(null);
  const [hasKey, setHasKey] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();

    const savedHistory = localStorage.getItem('soul_piercer_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedMom = localStorage.getItem('soul_piercer_mom');
    if (savedMom) setMomentum(parseInt(savedMom));

    const savedSeries = localStorage.getItem('soul_piercer_active_series');
    if (savedSeries) {
      try {
        const parsed = JSON.parse(savedSeries);
        setActiveSeries(parsed);
        //setSelectedLens(parsed.lens);
        setFocus(parsed.focus);
      } catch (e) {
        localStorage.removeItem('soul_piercer_active_series');
      }
    }
  }, []);

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const getSystemPrompt = (lens: TacticalLens, focusType: SpiritualFocus, topic: string, currentDay?: number, totalDays?: number, lastStorySummary?: string) => {
    let journeyArc = "";
    let seriesInstruction = "";
    
    if (currentDay && totalDays) {
      const progress = currentDay / totalDays;
      if (currentDay === 1) {
        journeyArc = "JOURNEY STAGE: The Awakening. Establish the unique historical/biblical world and character. Introduce the core tension.";
      } else if (progress <= 0.5) {
        journeyArc = "JOURNEY STAGE: The Descent. Explore the deeper, hidden roots of the struggle within the established world.";
      } else if (currentDay === Math.floor(totalDays * 0.6) || currentDay === 4) {
        journeyArc = "JOURNEY STAGE: The Crisis. A major turning point or crisis in the story introduced on Day 1. The stakes are at their highest.";
      } else if (progress <= 0.75) {
        journeyArc = "JOURNEY STAGE: The Turning Point. Focus on the pivot toward Christ and the surrender of the old way within the narrative.";
      } else {
        journeyArc = "JOURNEY STAGE: The Culmination. Provide the theological culmination and resolution of the specific story arc established on Day 1.";
      }

      if (lastStorySummary) {
        seriesInstruction = `ANCHOR LOCKING: You MUST continue the EXACT SAME story, world, and character established in previous sessions. 
        PREVIOUS CONTEXT: ${lastStorySummary}
        Maintain narrative continuity. Do not introduce a new world.`;
      }
    } else {
      journeyArc = "SINGLE-DAY MODE: Generate a complete, self-contained scripture-grounded story that introduces the theological concept, explores the tension, and resolves the application within this one entry.";
    }

    const baseConstraint = `CONTEXT: You are a peaceful spiritual sharpening tool. "Soul Piercing" is a metaphor for the sharp and living Word of God (Hebrews 4:12). No mention of 'lenses' or 'models'. No signatures. 
    NO PREAMBLE: Do NOT include any introductory text, greetings, or "Welcome to Day X" messages. Start immediately with the first header.
    STORYTELLING (THEOLOGICAL FICTION): Under the "THE STORY" header, write a deeply grounded, scripture-based narrative. 
    UNIVERSAL RULE: ELIMINATE all modern-day archetypes (e.g., social media, modern offices, cars, tech). Frame everything in a historical, biblical, or parable-based world.
    ANTI-OBVIOUS ROTATION: Actively avoid the most statistically obvious biblical figure for this topic/lens (e.g., if the topic is 'Giant Killing', do NOT use David). Find a fresh, deep-cut biblical parallel or a unique historical setting from the biblical era.
    THEOLOGY: Under the "THEOLOGICAL REFLECTION" header, tie the story back to the Word and the selected lens with profound theological depth. This reflection must be biblically grounded and non-fiction, synthesizing the narrative's truth with Christ-centered doctrine.
    JOURNEY PROGRESSION: ${journeyArc}
    ${seriesInstruction}
    SCRIPTURE: provide EXACTLY TWO relevant verses. Citation format: text (Citation). citations at the END of the verse text.`;
    
    let personaPrompt = `ACT AS: A spiritual guide. TONE: Soulful.`;
    let theologyConstraint = "";

    if (focusType === 'catholic') {
      theologyConstraint = `
      THEOLOGICAL FOCUS: Strictly Christ-Centered with Catholic nuances. Center every reflection on the Person and Work of Jesus Christ. 
      CRITICAL GUARDRAIL: DO NOT use esoteric or universalist terms. 
      PRAYER ADDRESSES: Use traditional biblical addresses such as "Heavenly Father", "Lord Jesus", or "Holy Spirit". 
      The core message must reflect the Gospel of grace through Christ alone, while acknowledging the richness of the Catholic tradition in its devotion to the Sacred Heart and the Eucharist where appropriate.`;
    } else if (focusType === 'non-denominational') {
      theologyConstraint = `
      THEOLOGICAL FOCUS: Strictly Christ-Centered. Center every reflection on the Person and Work of Jesus Christ. 
      CRITICAL GUARDRAIL: DO NOT use esoteric or universalist terms. 
      PRAYER ADDRESSES: Use traditional biblical addresses such as "Heavenly Father", "Lord Jesus", or "Holy Spirit". 
      The core message must reflect the Gospel of grace through Christ alone.`;
    } else {
      theologyConstraint = `THEOLOGICAL FOCUS: Theosophist/Esoteric. You may use universalist language and terms like "Father of Lights" or "Great Spirit".`;
    }

    let lensConstraint = "";
    switch(lens) {
      case TacticalLens.EXPLORER:
        lensConstraint = "LENS: Explorer. WORLD: Ancient exploration and discovery. Focus on broad biblical horizons, discovering new lands, and the courage to leave the familiar (e.g., Abrahamic journeys, Pauline travels).";
        break;
      case TacticalLens.STRATEGIST:
        lensConstraint = "LENS: Strategist. WORLD: Ancient logistics, kingship, and spiritual warfare. Focus on scriptural wisdom for overcoming obstacles in a world of walled cities and desert campaigns.";
        break;
      case TacticalLens.ARCHITECT:
        lensConstraint = "LENS: Architect. WORLD: Construction of the Temple, the Tabernacle, or ancient cities. Focus on building life on the solid foundation of Christ through structural spiritual growth.";
        break;
      case TacticalLens.HEALER:
        lensConstraint = "LENS: Healer. WORLD: Ancient medicine, pools of healing, and leper colonies. Focus on restoration, comfort, and emotional alignment in the shadow of the Great Physician.";
        break;
      case TacticalLens.WILDERNESS:
        lensConstraint = "LENS: Wilderness. WORLD: Old Testament desert survival and prophetic isolation. Focus on surrender to the Spirit in raw, unforgiving landscapes.";
        break;
      case TacticalLens.MARRIAGE:
        lensConstraint = "LENS: Marriage. WORLD: Ancient covenantal weddings and patriarchal households. Focus on the unity, love, and shared spiritual growth within a biblical-era household.";
        break;
      case TacticalLens.WHOLEHEART:
        lensConstraint = "LENS: Wholeheart. WORLD: Undivided devotion in ancient settings (e.g., Temple service, exile in foreign courts). Focus on wholeness in Christ during seasons of singleness.";
        break;
      case TacticalLens.LENT:
        lensConstraint = "LENS: Lent. WORLD: The 40-day journey to the Cross or early church liturgical sharpening. Focus on repentance and walking the covenant path.";
        break;
      case TacticalLens.YOUNG_ADULT:
        lensConstraint = "LENS: Young Adult. WORLD: Early church discipleship or navigating foreign empires (e.g., Timothy in Ephesus, Daniel in Babylon). Focus on identity, purpose, and faith in a complex, non-Christian world.";
        break;
    }

    return `${personaPrompt} ${theologyConstraint} ${lensConstraint} ${baseConstraint} 
      OUTPUT STRUCTURE:
      ### Preamble
      ### THE WORD
      ### THE STORY
      ### THEOLOGICAL REFLECTION
      ### THE EXCHANGE
      (FORMAT: You MUST use a bulleted list. Each item MUST start with a bolded "From/To" transition, followed by a colon, then the explanation.)
      ### THE PRAYER
      ### KEY THOUGHTS
      (FORMAT: You MUST use a bulleted list. Each item MUST start with a bolded key concept, followed by a colon, then the explanation.)`;
  };

  const handleGenerate = async (seriesContext?: ActiveSeries) => {
    const activeLens = seriesContext ? seriesContext.lens : selectedLens;
    const activeFocus = seriesContext ? seriesContext.focus : focus;
    const currentDay = seriesContext ? seriesContext.currentDay : 1;
    const totalDays = seriesContext ? seriesContext.totalDays : (activeLens === TacticalLens.LENT ? 40 : journeyDays);
    
    let finalTopic = input.trim();
    if (seriesContext) finalTopic = seriesContext.topic;
    else if (!finalTopic && activeLens === TacticalLens.LENT) finalTopic = "Walk the Covenant: 40 Days of Lent";

    if (!finalTopic && activeLens !== TacticalLens.LENT) {
      setError("Please enter a focus or topic to begin your meditation.");
      return;
    }

    setLoading(true);
    setError(null);
    const statusMessages = [
      "Consulting the archives...",
      "Weaving the narrative...",
      "Synthesizing theological depth...",
      "Aligning the spiritual compass...",
      "Piercing the veil of the mundane...",
      "Gathering scriptural wisdom...",
      "Crafting the soul's mirror..."
    ];
    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      statusIdx = (statusIdx + 1) % statusMessages.length;
      setStatus(statusMessages[statusIdx]);
    }, 3000);

    try {
      const isSeries = !!seriesContext || mode === 'journey' || activeLens === TacticalLens.LENT;
      const prompt = `${getSystemPrompt(activeLens, activeFocus, finalTopic, currentDay, totalDays, seriesContext?.lastStorySummary)} TOPIC: ${finalTopic} ${isSeries ? `SESSION: Day ${currentDay} of ${totalDays}` : ""}`;

      let accumulatedText = "";
      const devoId = `v4_${Date.now()}`;
      
      // Initialize the devotional object so it shows up immediately and starts streaming
      const initialDevo: Devotional = {
        id: devoId,
        content: "",
        timestamp: Date.now(),
        input: finalTopic,
        lens: activeLens,
        seriesDay: isSeries ? currentDay : undefined,
        seriesTotal: isSeries ? totalDays : undefined,
        isComplete: false
      };
      setDevotional(initialDevo);

      await generateDevotionalStream(prompt, (chunk) => {
        accumulatedText += chunk;
        setDevotional(prev => prev ? { ...prev, content: accumulatedText } : null);
      }, 'gemini-3.1-pro-preview');
      
      clearInterval(statusInterval);
      const finalDevo: Devotional = {
        ...initialDevo,
        content: accumulatedText || "Transmission failed.",
        isComplete: true
      };

      setDevotional(finalDevo);
      setStatus(null);
      const newHistory = [finalDevo, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('soul_piercer_history', JSON.stringify(newHistory));
      
      if (isSeries) {
        // Extract a more robust summary of the story for anchor locking
        const storyMatch = accumulatedText.match(/### THE STORY\s+([\s\S]*?)(?=###|$)/i);
        const storyText = storyMatch ? storyMatch[1].trim().slice(0, 500) : "";

        if (!seriesContext) {
          const newSeries: ActiveSeries = {
            topic: finalTopic, 
            currentDay: 2, 
            totalDays, 
            lens: activeLens, 
            focus: activeFocus,
            lastStorySummary: storyText
          };
          setActiveSeries(newSeries);
          localStorage.setItem('soul_piercer_active_series', JSON.stringify(newSeries));
        } else if (currentDay < totalDays) {
          const updatedSeries = { 
            ...seriesContext, 
            currentDay: currentDay + 1,
            lastStorySummary: storyText
          };
          setActiveSeries(updatedSeries);
          localStorage.setItem('soul_piercer_active_series', JSON.stringify(updatedSeries));
        } else {
          setActiveSeries(null);
          localStorage.removeItem('soul_piercer_active_series');
        }
      }

      setMomentum(prev => prev + 1);
      setInput("");
      // window.scrollTo({ top: 0, behavior: 'smooth' }); // Removed to avoid jumping during stream
    } catch (err: any) {
      clearInterval(statusInterval);
      setStatus(null);
      let msg = err.message || "An unknown error occurred.";
      const errStr = msg.toLowerCase();
      
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('resource_exhausted')) {
        msg = "The Sanctuary is momentarily overcrowded. Our systems are working to expand capacity. Please try again in a few moments.";
      } else if (errStr.includes('requested entity was not found')) {
        msg = "The Archives are recalibrating. Connection has been refreshed. Please ensure you have selected a valid API key.";
        setHasKey(false);
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const performReset = () => {
    localStorage.removeItem('soul_piercer_active_series');
    setActiveSeries(null);
    setDevotional(null);
    setSelectedLens(TacticalLens.WILDERNESS);
    setMode('glimpse');
    setFocus('non-denominational');
    setInput("");
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLensSelect = (l: TacticalLens) => {
    if (selectedLens === l) {
      // If already selected, we "reset" to Wilderness as the neutral default
      setSelectedLens(TacticalLens.WILDERNESS);
      if (l === TacticalLens.LENT) {
        setFocus('non-denominational');
        setMode('glimpse');
      }
      // If they click the lens that is part of an active series, we ask if they want to clear it
      // For now, we'll just allow them to switch selectedLens away from it.
    } else {
      setSelectedLens(l);
      if (l === TacticalLens.LENT) {
        setFocus('catholic');
        setMode('journey');
        setJourneyDays(40);
      }
    }
    textAreaRef.current?.focus();
  };

  const renderPathButton = (l: TacticalLens) => {
    const IconComp = LENS_CONFIG[l].icon;
    const isSelected = selectedLens === l;
    const isSeriesLens = activeSeries?.lens === l;
    
    return (
      <Tooltip key={l} text={LENS_CONFIG[l].description}>
        <button 
          onClick={() => handleLensSelect(l)}
          className="flex flex-col items-center gap-2 group relative"
        >
          <div className={`p-4 rounded-2xl transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-lg scale-110' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}>
            <IconComp className="w-8 h-8" />
            {isSeriesLens && !isSelected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
            {l}
          </span>
        </button>
      </Tooltip>
    );
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-16 max-w-7xl mx-auto">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center justify-between mb-12 glass-panel p-10 rounded-[3.5rem] border border-white/10 shadow-2xl"
      >
        <div className="flex items-center gap-10">
          <div className="w-20 h-20 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white aura-glow shadow-xl">
            <Icons.Crosshair className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-gradient font-serif-display leading-none">Soul Piercer <span className="text-sm font-mono text-emerald-300 ml-2">v5.1</span></h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[10px] font-mono font-black text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> CHRIST_CENTERED_MODE
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl mt-6 md:mt-0">
          {(['non-denominational', 'catholic', 'theosophist'] as SpiritualFocus[]).map((f) => {
            const labels: Record<SpiritualFocus, string> = {
              'non-denominational': 'NON-DENON',
              'catholic': 'CATHOLIC',
              'theosophist': 'THEOSOPHIST'
            };
            const tooltips: Record<SpiritualFocus, string> = {
              'non-denominational': 'Return a Christ-centered, non-denominational response.',
              'catholic': 'Return a Christ-centered, Catholic response.',
              'theosophist': 'Return a Theosophist response.'
            };
            return (
              <Tooltip key={f} text={tooltips[f]}>
                <button
                  onClick={() => setFocus(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${focus === f ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {labels[f]}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </motion.header>

      <main>
        <AnimatePresence>
          {activeSeries && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 flex items-center justify-between glass-panel px-8 py-4 rounded-2xl border border-indigo-500/30 shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Icons.Compass className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black text-indigo-300 uppercase tracking-widest block">Active Journey: {activeSeries.lens}</span>
                  <span className="text-sm font-bold text-white">{activeSeries.topic} - Day {activeSeries.currentDay} of {activeSeries.totalDays}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveSeries(null);
                  localStorage.removeItem('soul_piercer_active_series');
                }}
                className="px-6 py-3 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 hover:border-red-500/20"
              >
                Cancel Journey
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasKey && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 glass-panel p-10 rounded-[2.5rem] border border-amber-500/20 text-center shadow-2xl"
          >
            <div className="flex items-center justify-center gap-4 mb-4 text-amber-400 font-black">
              <Icons.ShieldAlert className="w-8 h-8" />
              <span className="uppercase tracking-[0.3em]">Archive Access Restricted</span>
            </div>
            <p className="font-bold text-sm md:text-base mb-8 max-w-2xl mx-auto leading-relaxed text-amber-100">
              The Soul Piercer Pro requires a valid Sanctuary Key to access the deep archives. 
              Please connect your key to proceed.
            </p>
            <button 
              onClick={handleConnectKey} 
              className="px-10 py-5 bg-amber-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-105"
            >
              Connect Sanctuary Key
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-12 bg-red-500/10 border border-red-500/20 p-10 rounded-[2.5rem] text-red-100 font-mono text-center shadow-2xl"
            >
              <div className="flex items-center justify-center gap-4 mb-4 text-red-400 font-black">
                <Icons.ShieldAlert className="w-8 h-8" />
                <span className="uppercase tracking-[0.3em]">Sanctuary Notice</span>
              </div>
              <p className="font-bold text-sm md:text-base mb-8 max-w-2xl mx-auto leading-relaxed">{error}</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setError(null)} className="px-10 py-5 bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl transition-all">Understood</button>
                <button onClick={performReset} className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all">Clear Connection</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!devotional ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {[...pathways, ...seasons].map(renderPathButton)}
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex gap-4 p-2 glass-panel rounded-2xl w-fit mx-auto">
                  <Tooltip text="A single, powerful spiritual transmission for immediate meditation.">
                    <button onClick={() => setMode('glimpse')} className={`px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'glimpse' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>Glimpse</button>
                  </Tooltip>
                  <Tooltip text="A multi-day progressive series designed for deep habit formation and structural growth.">
                    <button onClick={() => setMode('journey')} className={`px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'journey' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>Journey</button>
                  </Tooltip>
                </div>

                <AnimatePresence>
                  {mode === 'journey' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-6 glass-panel px-10 py-5 rounded-2xl border border-emerald-500/20 overflow-hidden"
                    >
                      <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">Journey Duration:</span>
                      <div className="flex gap-2">
                        {selectedLens === TacticalLens.LENT ? (
                          <button 
                            className="w-10 h-10 rounded-lg text-xs font-black bg-emerald-500 text-white shadow-lg"
                            disabled
                          >
                            40
                          </button>
                        ) : (
                          [3, 7, 14, 21, 30].map(d => (
                            <button 
                              key={d} 
                              onClick={() => setJourneyDays(d)}
                              className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${journeyDays === d ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
                            >
                              {d}
                            </button>
                          ))
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Days</span>
                      {selectedLens === TacticalLens.LENT && (
                        <span className="text-[10px] font-mono font-black text-emerald-300 uppercase tracking-widest ml-4 italic">
                          (Lenten Season Fixed Duration)
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <textarea 
                  ref={textAreaRef}
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !loading) {
                      e.preventDefault();
                      handleGenerate(activeSeries && !input.trim() ? activeSeries : undefined);
                    }
                  }}
                  placeholder="Enter your prayer or study focus..." 
                  className="w-full glass-panel rounded-[3rem] p-16 text-3xl font-serif-display italic text-white placeholder:text-slate-400 focus:outline-none min-h-[400px] resize-none leading-relaxed" 
                />
                <button 
                  onClick={() => handleGenerate(activeSeries && !input.trim() ? activeSeries : undefined)} 
                  disabled={loading} 
                  className="absolute bottom-12 right-12 px-16 py-6 rounded-2xl bg-emerald-500 text-white font-mono font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 disabled:opacity-20 flex items-center gap-4"
                >
                  {loading ? <Icons.Loader className="w-6 h-6 animate-spin" /> : <Icons.Send className="w-6 h-6" />}
                  {loading 
                    ? "COMMUNING..." 
                    : (activeSeries && !input.trim()) 
                      ? `CONTINUE DAY ${activeSeries.currentDay}` 
                      : "SEEK GUIDANCE"
                  }
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="display"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button onClick={() => setDevotional(null)} className="mb-10 text-slate-400 hover:text-white font-mono text-sm uppercase tracking-widest flex items-center gap-2 font-black transition-colors group">
                <Icons.ChevronRight className="rotate-180 w-6 h-6 group-hover:-translate-x-1 transition-transform" /> Back to Sanctuary
              </button>
              <DevotionalDisplay 
                devotional={devotional} 
                onNextDay={activeSeries ? () => handleGenerate(activeSeries) : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {status && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel px-8 py-4 rounded-2xl border border-emerald-500/30 flex items-center gap-4 z-50 shadow-2xl"
          >
            <Icons.Loader className="w-5 h-5 text-emerald-400 animate-spin" />
            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-[0.2em]">{status}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
