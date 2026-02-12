
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

  const handleDeepDive = async () => {
    if (diveContent || isDiving) return;
    setIsDiving(true);
    try {
      const result = await generateDeepDive(devotional.content);
      setDiveContent(result || "Unable to retrieve deep dive.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiving(false);
    }
  };

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
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} className="h-4"></div>;
      
      if (t.startsWith('>')) {
        return (
          <blockquote key={i} className="bg-indigo-500/5 border-l-4 border-indigo-500 p-6 my-8 italic text-slate-100 font-serif-display text-xl md:text-2xl leading-relaxed">
            {processLineText(t.replace('>', '').trim())}
          </blockquote>
        );
      }
      
      if (t.startsWith('- ') || t.startsWith('* ')) {
        return (
          <div key={i} className="flex gap-4 my-3 items-start pl-2">
            <div className="mt-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] shrink-0"></div>
            <p className="text-slate-300 leading-relaxed text-base md:text-lg">{processLineText(t.substring(2))}</p>
          </div>
        );
      }

      const numMatch = t.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={i} className="flex gap-4 my-5 items-start pl-2">
            <span className="text-indigo-400 font-mono font-bold text-sm bg-indigo-500/10 px-2 py-1 rounded-lg">{numMatch[1]}</span>
            <p className="text-slate-300 leading-relaxed text-base md:text-lg">{processLineText(numMatch[2])}</p>
          </div>
        );
      }

      return <p key={i} className="my-5 text-slate-300 leading-relaxed text-lg md:text-xl font-light">{processLineText(t)}</p>;
    });
  };

  const renderSection = (section: DevotionalSection, index: number) => {
    const { title, content } = section;
    const delay = `${index * 0.1}s`;

    switch (title) {
      case 'Note from Aaron':
        return (
          <div key={title} className="relative bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 p-8 md:p-12 rounded-[2.5rem] mb-12 shadow-2xl animate-slide-up overflow-hidden group">
            <div className="absolute top-0 right-0 p-8">
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-mono text-indigo-400 font-bold tracking-widest uppercase bg-indigo-500/10 px-3 py-1 rounded-full">Voice Log.01</span>
                 <button 
                  onClick={() => handlePlayAudio(content)}
                  disabled={isPlaying}
                  className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-95"
                >
                  {isPlaying ? <Icons.Loader className="w-5 h-5" /> : <Icons.Volume2 />}
                </button>
              </div>
            </div>
            <h3 className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-8 flex items-center gap-3">
              <Icons.Heart /> Transmission Start
            </h3>
            <div className="font-serif-display text-2xl md:text-3xl italic text-slate-100 leading-snug pr-0 md:pr-12">
              {renderContent(content)}
            </div>
          </div>
        );

      case 'The Word':
        return (
          <div key={title} className="mb-16 animate-slide-up" style={{ animationDelay: delay }}>
            <div className="flex items-center gap-4 mb-6">
               <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
               <h3 className="text-slate-500 font-mono font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-3">
                 <Icons.Book /> Sacred Frequency
               </h3>
               <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
            </div>
            <div className="text-3xl md:text-4xl font-serif-display text-white italic leading-tight text-center px-4 md:px-12">
              {renderContent(content)}
            </div>
          </div>
        );

      case 'Key Thought':
        return (
          <div key={title} className="bg-indigo-600/5 border border-indigo-500/30 p-10 rounded-[3rem] my-12 relative overflow-hidden group animate-slide-up active-glow" style={{ animationDelay: delay }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
            <h3 className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-6 flex items-center justify-center gap-3">
               <Icons.Target /> The Mission Anchor
            </h3>
            <div className="text-2xl md:text-3xl font-black text-white leading-tight text-center font-serif-display italic">
              {renderContent(content)}
            </div>
          </div>
        );

      case 'The Action':
      case 'Embodied Action':
        return (
          <div key={title} className="bg-emerald-500/5 border border-emerald-500/20 p-10 rounded-[2.5rem] my-10 animate-slide-up" style={{ animationDelay: delay }}>
            <h3 className="text-emerald-400 font-mono font-bold uppercase tracking-[0.3em] text-[10px] mb-6 flex items-center gap-3">
              <Icons.Target /> Operational Objectives
            </h3>
            <div className="text-slate-300">{renderContent(content)}</div>
          </div>
        );

      default:
        return (
          <div key={title} className="mb-12 animate-slide-up" style={{ animationDelay: delay }}>
            <h4 className="text-indigo-400/60 font-mono font-bold uppercase tracking-[0.3em] text-[9px] mb-6 flex items-center gap-3">
              <span className="w-8 h-px bg-indigo-500/30"></span> {title}
            </h4>
            <div className="max-w-none text-slate-300">
              {renderContent(content)}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel p-8 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-30">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] bg-white/5 px-5 py-2 rounded-full border border-white/10 text-white">
            Protocol: {devotional.lens}
          </span>
        </div>
        
        {sections.map((section, i) => renderSection(section, i))}

        <div className="mt-20 pt-12 border-t border-slate-800/50">
          <button 
            onClick={handleDeepDive}
            disabled={isDiving}
            className="w-full py-8 rounded-3xl bg-white text-slate-950 font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 group"
          >
            {isDiving ? <Icons.Loader className="text-indigo-600" /> : <><Icons.Dive className="group-hover:translate-y-1 transition-transform" /> Execute Deep Dive Analysis</>}
          </button>

          {diveContent && (
            <div className="mt-10 bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 animate-slide-up">
              <h4 className="text-indigo-400 font-mono font-bold uppercase tracking-[0.3em] text-[10px] mb-8 flex items-center gap-3">
                <Icons.Book /> Theological Grid Data
              </h4>
              <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed font-mono text-xs md:text-sm">
                {diveContent.split('\n').map((line, i) => (
                  <p key={i} className="mb-3">{processLineText(line)}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevotionalDisplay;
