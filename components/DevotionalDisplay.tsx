
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
    
    // Sanitize em dashes and double hyphens just in case the model produces them
    const sanitized = text.replace(/—/g, ' - ').replace(/--/g, ' - ');
    
    // Match bold text **text**
    const parts = sanitized.split(/(\*\*.*?\*\*)/g);
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
      if (!t) return <div key={i} className="h-6"></div>;
      
      if (t.startsWith('### ')) {
        return <h5 key={i} className="text-indigo-300 font-mono text-sm tracking-[0.4em] uppercase mt-12 mb-6 border-b border-indigo-500/10 pb-3">{processLineText(t.replace('### ', ''))}</h5>;
      }
      if (t.startsWith('#### ')) {
        return <h6 key={i} className="text-slate-200 font-bold text-xl mt-8 mb-4">{processLineText(t.replace('#### ', ''))}</h6>;
      }

      if (t.startsWith('>')) {
        return (
          <blockquote key={i} className="border-l-4 border-indigo-300 pl-10 my-12 italic text-white font-serif-display text-3xl leading-relaxed bg-indigo-500/10 py-10 pr-10 rounded-r-[3rem] shadow-2xl">
            {processLineText(t.replace('>', '').trim())}
          </blockquote>
        );
      }
      
      if (t.startsWith('- ') || t.startsWith('* ')) {
        return (
          <div key={i} className="flex gap-6 my-5 items-start pl-4">
            <div className="mt-3 w-2.5 h-2.5 rounded-full bg-indigo-300 shrink-0 aura-glow"></div>
            <p className="text-slate-100 text-xl leading-relaxed">{processLineText(t.substring(2))}</p>
          </div>
        );
      }

      return <p key={i} className={`my-8 text-slate-100 leading-relaxed font-normal ${isLarge ? 'text-2xl' : 'text-xl'}`}>{processLineText(t)}</p>;
    });
  };

  const renderSection = (section: DevotionalSection, index: number) => {
    const { title, content } = section;
    const delay = `${index * 0.1}s`;

    switch (title) {
      case 'The Word':
        return (
          <div key={title} className="mb-20 animate-slide-up" style={{ animationDelay: delay }}>
             <h4 className="text-emerald-300 font-mono text-[11px] tracking-[0.6em] uppercase mb-10 flex items-center gap-6">
               <span className="w-16 h-px bg-emerald-400/20"></span> Eternal Anchor
            </h4>
            <div className="bg-emerald-500/10 border border-emerald-400/20 p-12 rounded-[3.5rem] italic font-serif-display text-4xl text-emerald-50 leading-relaxed shadow-2xl">
               {renderContent(content, true)}
            </div>
          </div>
        );

      case 'First Light':
        return (
          <div key={title} className="mb-16 animate-slide-up text-center border-b border-white/10 pb-12" style={{ animationDelay: delay }}>
            <div className="text-indigo-300 font-mono text-[13px] tracking-[0.5em] uppercase mb-8">A MOMENT OF CLARITY</div>
            <div className="text-4xl md:text-5xl font-serif-display italic text-white max-w-4xl mx-auto leading-tight drop-shadow-lg">
              {content}
            </div>
          </div>
        );

      case 'Personal Briefing':
        return (
          <div key={title} className="relative bg-white/10 border border-white/20 p-14 rounded-[4rem] mb-20 shadow-2xl animate-slide-up group overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 p-12 flex flex-col items-end gap-6">
               <div className="flex gap-2.5 h-8 items-end">
                 {[1,2,3,4,5,6].map(i => <div key={i} className={`w-2 rounded-full bg-indigo-200/50 ${isPlaying ? 'animate-bounce' : ''}`} style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.1}s` }}></div>)}
               </div>
               <button 
                onClick={() => handlePlayAudio(content)}
                disabled={isPlaying}
                className="w-16 h-16 rounded-[2rem] bg-indigo-500 hover:bg-indigo-400 transition-all flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-90 disabled:opacity-50"
              >
                {isPlaying ? <Icons.Loader className="w-7 h-7" /> : <Icons.Play className="w-7 h-7" />}
              </button>
            </div>
            <h3 className="text-indigo-200 font-mono text-[12px] tracking-[0.5em] uppercase mb-12 flex items-center gap-5">
              <Icons.Heart className="w-6 h-6" /> HEART TO HEART
            </h3>
            <div className="font-serif-display text-4xl italic text-white leading-snug pr-32">
              {renderContent(content, true)}
            </div>
          </div>
        );

      case 'The Story':
        return (
          <div key={title} className="mb-24 animate-slide-up" style={{ animationDelay: delay }}>
            <h4 className="text-slate-300 font-mono text-[11px] tracking-[0.7em] uppercase mb-12 flex items-center gap-6">
               <span className="w-20 h-px bg-slate-700"></span> THE UNFOLDING STORY
            </h4>
            <div className="text-slate-50 bg-white/[0.04] p-12 md:p-20 rounded-[4.5rem] border border-white/10 shadow-2xl">
               {renderContent(content)}
            </div>
          </div>
        );

      case 'The Reflection':
        return (
          <div key={title} className="mb-24 animate-slide-up" style={{ animationDelay: delay }}>
            <h4 className="text-indigo-300 font-mono text-[11px] tracking-[0.7em] uppercase mb-12 flex items-center gap-6">
               <span className="w-20 h-px bg-indigo-500/20"></span> DEEP WATERS
            </h4>
            <div className="px-6 md:px-12">
               {renderContent(content)}
            </div>
          </div>
        );

      case 'Wisdom Anchors':
        return (
          <div key={title} className="bg-indigo-500/20 border-y border-indigo-400/30 py-20 my-20 animate-slide-up text-center shadow-2xl" style={{ animationDelay: delay }}>
            <h3 className="text-indigo-100 font-mono text-[12px] tracking-[0.7em] uppercase mb-12">ANCHORS FOR THE SOUL</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto px-10">
              {content.split('\n').filter(l => l.trim()).map((thought, i) => (
                <div key={i} className="p-10 bg-white/5 rounded-[3rem] border border-white/20 italic font-serif-display text-3xl text-white text-left shadow-2xl hover:border-indigo-300/40 transition-all scale-100 hover:scale-[1.02]">
                  {processLineText(thought.replace(/^\d+\.\s*/, ''))}
                </div>
              ))}
            </div>
          </div>
        );

      case 'Heart Mirror':
        return (
          <div key={title} className="bg-white/5 border border-white/10 p-16 rounded-[4rem] my-24 animate-slide-up shadow-2xl" style={{ animationDelay: delay }}>
             <h4 className="text-slate-300 font-mono text-[12px] tracking-[0.7em] uppercase mb-12 flex items-center gap-6">
               <Icons.Target className="w-6 h-6 text-indigo-300 opacity-50" /> THE HEART MIRROR
             </h4>
             <div className="space-y-10">
                {content.split('\n').filter(l => l.trim()).map((q, i) => (
                  <div key={i} className="flex gap-8 items-start group">
                    <span className="font-mono text-[15px] text-indigo-300 mt-1">[{i+1}]</span>
                    <p className="text-slate-50 text-2xl group-hover:text-white transition-colors drop-shadow-md leading-relaxed">{processLineText(q.replace(/^\d+\.\s*/, ''))}</p>
                  </div>
                ))}
             </div>
          </div>
        );

      default:
        return (
          <div key={title} className="mb-16 animate-slide-up" style={{ animationDelay: delay }}>
            <h4 className="text-slate-400 font-mono text-[11px] tracking-[0.6em] uppercase mb-10 flex items-center gap-6">
              <span className="w-12 h-px bg-slate-800"></span> {title}
            </h4>
            <div className="text-slate-100 px-6">
              {renderContent(content)}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-12">
      <div className="glass-panel p-12 md:p-24 rounded-[5rem] relative border border-white/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 10%, #818cf8 0%, transparent 50%), radial-gradient(circle at 90% 90%, #f472b6 0%, transparent 50%)' }}></div>
        
        <div className="absolute top-14 right-14 opacity-50 hidden md:block">
          <span className="font-mono text-[11px] uppercase tracking-[0.5em] text-white border border-white/20 px-8 py-3 rounded-full bg-white/10 backdrop-blur-md shadow-2xl">
            WISDOM_SESSION: {devotional.id.slice(-4)}
          </span>
        </div>
        
        {sections.map((section, i) => renderSection(section, i))}

        <div className="mt-32 pt-20 border-t border-white/10">
          <button 
            onClick={async () => {
              if (isDiving) return;
              setIsDiving(true);
              const res = await generateDeepDive(devotional.content);
              setDiveContent(res ?? null);
              setIsDiving(false);
            }}
            disabled={isDiving}
            className="w-full py-12 rounded-[3.5rem] bg-white/5 border border-white/20 text-indigo-200 font-mono text-[13px] tracking-[0.6em] uppercase hover:bg-white/10 hover:border-indigo-300/40 transition-all flex items-center justify-center gap-6 disabled:opacity-50 shadow-2xl hover:scale-[1.01]"
          >
            {isDiving ? <Icons.Loader className="w-7 h-7" /> : <><Icons.Dive className="w-6 h-6" /> SEEK THEOLOGICAL DEPTH</>}
          </button>

          {diveContent && (
            <div className="mt-16 bg-slate-900/80 p-16 rounded-[4.5rem] border border-white/10 animate-slide-up shadow-2xl relative overflow-hidden backdrop-blur-3xl">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-60"></div>
              <h4 className="text-indigo-200 font-mono text-[12px] tracking-[0.6em] uppercase mb-12 flex items-center gap-5">
                <div className="w-3.5 h-3.5 rounded-full bg-indigo-400 aura-glow"></div> HISTORICAL_INTEL_ANALYSIS
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
