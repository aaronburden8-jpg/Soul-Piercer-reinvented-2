
import React, { useState } from 'react';
import { Devotional, DevotionalSection } from '../types';
import { Icons } from '../constants';
import { generateDeepDive, generateAudio, decodeBase64Audio, playAudioBuffer } from '../services/geminiService';

interface Props {
  devotional: Devotional;
}

const DevotionalDisplay: React.FC<Props> = ({ devotional }) => {
  const [diveContent, setDiveContent] = useState<string | null>(null);
  const [isDiving, setIsDiving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const parseSections = (markdown: string): DevotionalSection[] => {
    const parts = markdown.split(/^###\s+(.+)$/gm);
    const sections: DevotionalSection[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      sections.push({
        title: parts[i].trim(),
        content: parts[i + 1] ? parts[i + 1].trim() : ""
      });
    }
    return sections;
  };

  const sections = parseSections(devotional.content);

  const handlePlayAudio = async (text: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const base64 = await generateAudio(text);
      if (base64) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const bytes = decodeBase64Audio(base64);
        await playAudioBuffer(bytes, audioCtx);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlaying(false);
    }
  };

  const processLineText = (text: string) => {
    if (!text) return "";
    // Match bold text **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      // Simple italics *text*
      const italicParts = part.split(/(\*.*?\*)/g);
      return italicParts.map((ip, j) => {
        if (ip.startsWith('*') && ip.endsWith('*')) {
          return <em key={`${i}-${j}`} className="italic text-indigo-200">{ip.slice(1, -1)}</em>;
        }
        return ip;
      });
    });
  };

  const renderContent = (text: string, isLarge = false) => {
    return text.split('\n').map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} className="h-4"></div>;
      
      // Handle nested headers in content (common in Deep Dive)
      if (t.startsWith('### ')) {
        return <h5 key={i} className="text-indigo-300 font-mono text-sm tracking-[0.3em] uppercase mt-10 mb-4 border-b border-indigo-500/20 pb-2">{processLineText(t.replace('### ', ''))}</h5>;
      }
      if (t.startsWith('#### ')) {
        return <h6 key={i} className="text-slate-300 font-bold text-lg mt-6 mb-2">{processLineText(t.replace('#### ', ''))}</h6>;
      }

      if (t.startsWith('>')) {
        return (
          <blockquote key={i} className="border-l-4 border-indigo-400 pl-8 my-10 italic text-white font-serif-display text-2xl leading-relaxed bg-indigo-500/10 py-8 pr-8 rounded-r-3xl shadow-lg">
            {processLineText(t.replace('>', '').trim())}
          </blockquote>
        );
      }
      
      if (t.startsWith('- ') || t.startsWith('* ')) {
        return (
          <div key={i} className="flex gap-4 my-4 items-start pl-2">
            <div className="mt-2.5 w-2 h-2 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_10px_#818cf8]"></div>
            <p className="text-slate-200 text-lg leading-relaxed">{processLineText(t.substring(2))}</p>
          </div>
        );
      }

      return <p key={i} className={`my-6 text-slate-100 leading-relaxed font-normal ${isLarge ? 'text-xl' : 'text-lg'}`}>{processLineText(t)}</p>;
    });
  };

  const renderSection = (section: DevotionalSection, index: number) => {
    const { title, content } = section;
    const delay = `${index * 0.1}s`;

    switch (title) {
      case 'The Word':
        return (
          <div key={title} className="mb-14 animate-slide-up" style={{ animationDelay: delay }}>
             <h4 className="text-emerald-300 font-mono text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-5">
               <span className="w-12 h-px bg-emerald-400/30"></span> Divine Authority
            </h4>
            <div className="bg-emerald-500/15 border border-emerald-400/30 p-10 rounded-[2.5rem] italic font-serif-display text-3xl text-emerald-50 leading-relaxed shadow-[0_0_40px_rgba(52,211,153,0.1)]">
               {renderContent(content, true)}
            </div>
          </div>
        );

      case 'Tactical Hook':
        return (
          <div key={title} className="mb-12 animate-slide-up text-center border-b border-white/20 pb-10" style={{ animationDelay: delay }}>
            <div className="text-indigo-300 font-mono text-[12px] tracking-[0.5em] uppercase mb-6">SIGNAL DETECTED</div>
            <div className="text-3xl md:text-4xl font-serif-display italic text-white max-w-3xl mx-auto leading-tight drop-shadow-sm">
              {content}
            </div>
          </div>
        );

      case 'Note from Aaron':
        return (
          <div key={title} className="relative bg-white/10 border border-white/20 p-12 rounded-[3rem] mb-14 shadow-2xl animate-slide-up group overflow-hidden">
            <div className="absolute top-0 right-0 p-10 flex flex-col items-end gap-4">
               <div className="flex gap-2 h-6 items-end">
                 {[1,2,3,4,5,6].map(i => <div key={i} className={`w-1.5 rounded-full bg-indigo-300/60 ${isPlaying ? 'animate-bounce' : ''}`} style={{ height: `${25 + Math.random() * 75}%`, animationDelay: `${i * 0.1}s` }}></div>)}
               </div>
               <button 
                onClick={() => handlePlayAudio(content)}
                disabled={isPlaying}
                className="w-14 h-14 rounded-3xl bg-indigo-500 hover:bg-indigo-400 transition-all flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isPlaying ? <Icons.Loader className="w-6 h-6" /> : <Icons.Play className="w-6 h-6" />}
              </button>
            </div>
            <h3 className="text-indigo-300 font-mono text-[11px] tracking-[0.4em] uppercase mb-10 flex items-center gap-4">
              <Icons.Heart className="w-5 h-5" /> PERSONAL BRIEFING: AARON
            </h3>
            <div className="font-serif-display text-3xl italic text-white leading-snug pr-24">
              {renderContent(content, true)}
            </div>
          </div>
        );

      case 'The Story':
        return (
          <div key={title} className="mb-20 animate-slide-up" style={{ animationDelay: delay }}>
            <h4 className="text-slate-300 font-mono text-[10px] tracking-[0.6em] uppercase mb-10 flex items-center gap-5">
               <span className="w-12 h-px bg-slate-600"></span> Mission Dossier: Narrative
            </h4>
            <div className="text-slate-100 bg-white/[0.05] p-10 md:p-16 rounded-[3.5rem] border border-white/20 shadow-xl">
               {renderContent(content)}
            </div>
          </div>
        );

      case 'Key Thoughts':
        return (
          <div key={title} className="bg-indigo-500/20 border-y border-indigo-400/40 py-16 my-16 animate-slide-up text-center shadow-[inset_0_0_80px_rgba(99,102,241,0.1)]" style={{ animationDelay: delay }}>
            <h3 className="text-indigo-100 font-mono text-[11px] tracking-[0.6em] uppercase mb-10">Strategic Objectives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto px-8">
              {content.split('\n').filter(l => l.trim()).map((thought, i) => (
                <div key={i} className="p-8 bg-white/10 rounded-3xl border border-white/20 italic font-serif-display text-2xl text-white text-left shadow-lg hover:border-indigo-400/40 transition-colors">
                  {processLineText(thought.replace(/^\d+\.\s*/, ''))}
                </div>
              ))}
            </div>
          </div>
        );

      case 'Heart Check':
        return (
          <div key={title} className="bg-red-400/15 border border-red-400/30 p-12 rounded-[3rem] my-16 animate-slide-up shadow-lg" style={{ animationDelay: delay }}>
             <h4 className="text-red-300 font-mono text-[11px] tracking-[0.6em] uppercase mb-10 flex items-center gap-4">
               <Icons.Target className="w-5 h-5 text-red-400" /> Integrity Diagnostic
             </h4>
             <div className="space-y-8">
                {content.split('\n').filter(l => l.trim()).map((q, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <span className="font-mono text-[14px] text-red-400/80 mt-1">[{i+1}]</span>
                    <p className="text-slate-50 text-xl group-hover:text-white transition-colors drop-shadow-sm">{processLineText(q.replace(/^\d+\.\s*/, ''))}</p>
                  </div>
                ))}
             </div>
          </div>
        );

      default:
        return (
          <div key={title} className="mb-14 animate-slide-up" style={{ animationDelay: delay }}>
            <h4 className="text-slate-300 font-mono text-[10px] tracking-[0.5em] uppercase mb-8 flex items-center gap-4">
              <span className="w-8 h-px bg-slate-600"></span> {title}
            </h4>
            <div className="text-slate-200 px-4">
              {renderContent(content)}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-10">
      <div className="glass-panel p-10 md:p-20 rounded-[4rem] relative border border-white/30 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Lighter mesh background for content */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #818cf8 0%, transparent 40%), radial-gradient(circle at 80% 80%, #34d399 0%, transparent 40%)' }}></div>
        
        <div className="absolute top-12 right-12 opacity-50 hidden md:block">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white border border-white/30 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            SAT_TOKEN: {devotional.id.slice(-6)}
          </span>
        </div>
        
        {sections.map((section, i) => renderSection(section, i))}

        <div className="mt-24 pt-16 border-t border-white/20">
          <button 
            onClick={async () => {
              if (isDiving) return;
              setIsDiving(true);
              const res = await generateDeepDive(devotional.content);
              setDiveContent(res ?? null);
              setIsDiving(false);
            }}
            disabled={isDiving}
            className="w-full py-10 rounded-[2.5rem] bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-mono text-[12px] tracking-[0.5em] uppercase hover:bg-emerald-500/30 hover:border-emerald-300/50 transition-all flex items-center justify-center gap-5 disabled:opacity-50 shadow-2xl hover:scale-[1.01]"
          >
            {isDiving ? <Icons.Loader className="w-6 h-6" /> : <><Icons.Dive className="w-5 h-5" /> Deploy Tactical Deep Dive</>}
          </button>

          {diveContent && (
            <div className="mt-12 bg-slate-900/90 p-12 rounded-[3.5rem] border border-emerald-400/30 animate-slide-up shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80"></div>
              <h4 className="text-emerald-300 font-mono text-[11px] tracking-[0.5em] uppercase mb-10 flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#34d399]"></div> INTEL_REPORT: THEOLOGICAL_ANALYSIS
              </h4>
              <div className="text-left">
                {renderContent(diveContent)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevotionalDisplay;
