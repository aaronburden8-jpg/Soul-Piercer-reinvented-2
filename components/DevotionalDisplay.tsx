
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

  const isMarriagePath = devotional.lens.toLowerCase().includes('marriage');
  const isWholeheartPath = devotional.lens.toLowerCase().includes('wholeheart');
  const isLentPath = devotional.lens.toLowerCase().includes('lent');
  const isSeasonPath = isMarriagePath || isWholeheartPath || isLentPath;

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
    const sanitized = text.replace(/—/g, ' - ').replace(/--/g, ' - ');
    const parts = sanitized.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
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
        const titleText = t.replace('### ', '');
        const headerColor = isLentPath ? 'text-purple-400' : isMarriagePath ? 'text-amber-500' : isWholeheartPath ? 'text-cyan-100' : 'text-amber-500';
        return (
          <div key={i} className="flex flex-col items-center gap-6 mt-20 mb-12">
            <h5 className={`${headerColor} font-mono text-2xl tracking-[0.2em] uppercase text-center`}>{processLineText(titleText)}</h5>
            <div className={`w-24 h-px ${isLentPath ? 'bg-purple-400/30' : isMarriagePath ? 'bg-amber-500/30' : isWholeheartPath ? 'bg-cyan-100/30' : 'bg-amber-500/30'}`}></div>
          </div>
        );
      }

      return <p key={i} className={`my-8 text-slate-100 leading-relaxed font-normal ${isLarge ? 'text-2xl' : 'text-xl'}`}>{processLineText(t)}</p>;
    });
  };

  const renderSeasonHeader = (title: string, subtitle?: string) => {
    const headerColor = isLentPath ? 'text-purple-400' : isMarriagePath ? 'text-amber-500' : isWholeheartPath ? 'text-cyan-100' : 'text-amber-500';
    const accentColor = isLentPath ? 'purple' : isMarriagePath ? 'amber' : 'cyan';
    return (
      <div className="flex flex-col items-center gap-8 mb-16 pt-12">
        <h4 className={`${headerColor} font-mono text-2xl tracking-[0.2em] uppercase text-center font-black`}>
          {title}
        </h4>
        <div className={`w-32 h-0.5 bg-gradient-to-r from-transparent via-${accentColor}-500/40 to-transparent`}></div>
        {subtitle && <p className="text-slate-400 font-mono text-[10px] tracking-[0.6em] uppercase -mt-4">{subtitle}</p>}
      </div>
    );
  };

  const renderSection = (section: DevotionalSection, index: number) => {
    const { title, content } = section;
    const delay = `${index * 0.1}s`;

    const cardBorder = isLentPath ? 'rgba(168, 85, 247, 0.2)' : isMarriagePath ? 'rgba(245, 158, 11, 0.2)' : isWholeheartPath ? 'rgba(207, 250, 254, 0.2)' : 'rgba(255,255,255,0.1)';

    switch (true) {
      case title.includes('Header'):
        const headerColorClass = isLentPath ? 'text-purple-400' : isMarriagePath ? 'text-amber-500' : isWholeheartPath ? 'text-cyan-100' : 'text-amber-500';
        return (
          <div key={title} className="mb-24 animate-slide-up text-center border-b border-white/5 pb-20" style={{ animationDelay: delay }}>
             <h4 className={`font-mono text-[11px] tracking-[0.8em] uppercase mb-12 flex justify-center items-center gap-6 ${headerColorClass}`}>
               <span className="w-12 h-px bg-white/10"></span> {isLentPath ? 'WALK THE COVENANT' : isMarriagePath ? 'COVENANT PROTOCOL' : isWholeheartPath ? 'UNDIVIDED FOCUS' : 'DIVINE DECREE'} <span className="w-12 h-px bg-white/10"></span>
            </h4>
            <div className="font-serif-display text-5xl md:text-7xl text-white italic leading-tight mb-10 max-w-4xl mx-auto">
               {renderContent(content.split('\n')[0], true)}
            </div>
            <div className="text-slate-300 font-mono text-xl italic uppercase tracking-widest bg-white/5 py-4 px-10 rounded-full inline-block border border-white/10">
               {content.split('\n').slice(1).join('\n')}
            </div>
          </div>
        );

      case title.includes('Reality'):
      case title.includes('Insight'):
      case title.includes('Reflection'):
      case title.includes('Reframing'):
      case title.includes('Story'):
        const displayTitle = title.includes(':') ? title.split(':')[1].trim().toUpperCase() : title.toUpperCase();
        return (
          <div key={title} className="mb-28 animate-slide-up" style={{ animationDelay: delay }}>
            {renderSeasonHeader(displayTitle, isLentPath ? 'Liturgical Sharpening' : isWholeheartPath ? 'Strategic Perspective' : 'Relational Depth')}
            <div className="text-slate-50 bg-white/[0.03] p-12 md:p-20 rounded-[4.5rem] border border-white/5 shadow-inner leading-relaxed">
               {renderContent(content)}
            </div>
          </div>
        );

      case title.includes('Mirror'):
      case title.includes('Exchange'):
      case title.includes('Heart Mirror'):
        const mirrorTitle = title.includes(':') ? title.split(':')[1].trim().toUpperCase() : title.toUpperCase();
        return (
          <div key={title} className="my-28 animate-slide-up" style={{ animationDelay: delay }}>
             {renderSeasonHeader(mirrorTitle, 'Interactive Response')}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {content.split('\n').filter(l => l.trim()).map((q, i) => (
                  <div key={i} style={{ borderColor: cardBorder }} className="flex flex-col gap-8 p-12 rounded-[3.5rem] bg-white/[0.04] border shadow-2xl hover:bg-white/[0.06] transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-mono text-white text-xl border border-white/20 group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <p className="text-slate-50 text-3xl font-serif-display italic leading-relaxed">
                      {processLineText(q.replace(/^\d+\.\s*/, ''))}
                    </p>
                  </div>
                ))}
             </div>
          </div>
        );

      case title.includes('Anchor'):
      case title.includes('Cord'):
        const cordTitle = title.includes(':') ? title.split(':')[1].trim().toUpperCase() : title.toUpperCase();
        const glowColor = isLentPath ? 'rgba(168, 85, 247, 0.15)' : isMarriagePath ? 'rgba(245,158,11,0.15)' : isWholeheartPath ? 'rgba(207, 250, 254, 0.15)' : 'rgba(255,255,255,0.05)';
        return (
          <div key={title} className="mt-32 mb-16 animate-slide-up text-center" style={{ animationDelay: delay }}>
            <div className="bg-white/5 border border-white/10 p-16 rounded-[5rem] shadow-2xl relative max-w-4xl mx-auto overflow-hidden" style={{ boxShadow: `0 0 120px ${glowColor}` }}>
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
               <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 p-5 rounded-full shadow-2xl z-10">
                 <Icons.Heart className="w-10 h-10" />
               </div>
               <h4 className="text-slate-400 font-mono text-sm tracking-[0.3em] uppercase mb-12 mt-4">{cordTitle}</h4>
               <div className="text-4xl md:text-5xl font-serif-display italic text-white leading-snug px-4">
                 {renderContent(content)}
               </div>
            </div>
          </div>
        );

      case title.includes('Word'):
        return (
          <div key={title} className="mb-20 animate-slide-up" style={{ animationDelay: delay }}>
             <h4 className="text-emerald-300 font-mono text-sm tracking-[0.6em] uppercase mb-10 flex items-center gap-6">
               <span className="w-16 h-px bg-emerald-400/20"></span> ETERNAL ANCHOR
            </h4>
            <div className="bg-emerald-500/10 border border-emerald-400/20 p-12 rounded-[3.5rem] italic font-serif-display text-4xl text-emerald-50 leading-relaxed shadow-2xl">
               {renderContent(content, true)}
            </div>
          </div>
        );

      default:
        return (
          <div key={title} className="mb-16 animate-slide-up" style={{ animationDelay: delay }}>
            <h4 className="text-slate-400 font-mono text-sm tracking-[0.3em] uppercase mb-10 flex items-center gap-6 text-center justify-center">
              <span className="w-12 h-px bg-slate-800"></span> {title} <span className="w-12 h-px bg-slate-800"></span>
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
      <div className="glass-panel p-12 md:p-24 rounded-[5.5rem] relative border border-white/20 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 10%, #818cf8 0%, transparent 50%), radial-gradient(circle at 90% 90%, #f472b6 0%, transparent 50%)' }}></div>
        
        <div className="max-w-4xl mx-auto">
          {sections.map((section, i) => renderSection(section, i))}
        </div>

        <div className="mt-40 pt-20 border-t border-white/5 max-w-4xl mx-auto">
          <button 
            onClick={async () => {
              if (isDiving) return;
              setIsDiving(true);
              const res = await generateDeepDive(devotional.content);
              setDiveContent(res ?? null);
              setIsDiving(false);
            }}
            disabled={isDiving}
            className="w-full py-12 rounded-[4rem] bg-white/5 border border-white/10 text-white font-mono text-[13px] tracking-[0.7em] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-6 disabled:opacity-50"
          >
            {isDiving ? <Icons.Loader className="w-7 h-7" /> : <><Icons.Dive className="w-6 h-6" /> SEEK THEOLOGICAL DEPTH</>}
          </button>

          {diveContent && (
            <div className="mt-16 bg-slate-900/60 p-16 rounded-[4.5rem] border border-white/5 animate-slide-up shadow-2xl relative overflow-hidden backdrop-blur-3xl">
              <div className="text-left text-slate-100">
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
