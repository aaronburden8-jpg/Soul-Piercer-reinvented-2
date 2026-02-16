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
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} className="h-3"></div>;
      
      if (t.startsWith('>')) {
        return (
          <blockquote key={i} className="border-l-2 border-indigo-500/50 pl-6 my-6 italic text-slate-200 font-serif-display text-xl leading-relaxed bg-indigo-500/5 py-4 pr-4 rounded-r-xl">
            {processLineText(t.replace('>', '').trim())}
          </blockquote>
        );
      }
      
      if (t.startsWith('- ') || t.startsWith('* ')) {
        return (
          <div key={i} className="flex gap-3 my-2 items-start">
            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500/60 shrink-0"></div>
            <p className="text-slate-400 text-base leading-relaxed">{processLineText(t.substring(2))}</p>
          </div>
        );
      }

      return <p key={i} className="my-4 text-slate-300 leading-relaxed text-lg font-light">{processLineText(t)}</p>;
    });
  };

  const renderSection = (section: DevotionalSection, index: number) => {
    const { title, content } = section;
    const delay = `${index * 0.1}s`;

    switch (title) {
      case 'Note from Aaron':
        return (
          <div key={title} className="relative bg-slate-900/80 border border-white/5 p-8 rounded-3xl mb-12 shadow-xl animate-slide-up group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2">
               <div className="flex gap-1">
                 {[1,2,3,4,5].map(i => <div key={i} className={`w-1 h-3 rounded-full bg-indigo-500/40 ${isPlaying ? 'animate-bounce' : ''}`} style={{ animationDelay: `${i * 0.1}s` }}></div>)}
               </div>
               <button 
                onClick={() => handlePlayAudio(content)}
                disabled={isPlaying}
                className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center text-white shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isPlaying ? <Icons.Loader className="w-4 h-4" /> : <Icons.Play className="w-4 h-4" />}
              </button>
            </div>
            <h3 className="text-indigo-400 font-mono text-[10px] tracking-widest uppercase mb-6 flex items-center gap-2">
              <Icons.Heart className="w-3 h-3" /> Encrypted Message
            </h3>
            <div className="font-serif-display text-xl italic text-slate-100 leading-relaxed pr-12">
              {renderContent(content)}
            </div>
          </div>
        );

      case 'Key Thought':
        return (
          <div key={title} className="bg-indigo-600/10 border-y border-indigo-500/20 py-10 my-10 animate-slide-up text-center" style={{ animationDelay: delay }}>
            <h3 className="text-indigo-400 font-mono text-[9px] tracking-[0.4em] uppercase mb-4">Central Objective</h3>
            <div className="text-2xl md:text-3xl font-serif-display italic text-white max-w-2xl mx-auto px-4">
              {renderContent(content)}
            </div>
          </div>
        );

      default:
        return (
          <div key={title} className="mb-10 animate-slide-up" style={{ animationDelay: delay }}>
            <h4 className="text-slate-500 font-mono text-[9px] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
              <span className="w-4 h-px bg-slate-800"></span> {title}
            </h4>
            <div className="text-slate-300">
              {renderContent(content)}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-8 md:p-14 rounded-[2.5rem] relative border border-white/5">
        <div className="absolute top-6 right-8 opacity-20 hidden md:block">
          <span className="font-mono text-[8px] uppercase tracking-widest text-white border border-white/20 px-3 py-1 rounded">
            TRANS_ID: {devotional.id.slice(-6)}
          </span>
        </div>
        
        {sections.map((section, i) => renderSection(section, i))}

        <div className="mt-16 pt-10 border-t border-white/5">
          <button 
            onClick={async () => {
              if (isDiving) return;
              setIsDiving(true);
              const res = await generateDeepDive(devotional.content);
              setDiveContent(res);
              setIsDiving(false);
            }}
            disabled={isDiving}
            className="w-full py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isDiving ? <Icons.Loader /> : <><Icons.Dive className="w-3 h-3" /> Run Tactical Deep Dive</>}
          </button>

          {diveContent && (
            <div className="mt-8 bg-black/40 p-8 rounded-2xl border border-white/5 animate-slide-up">
              <h4 className="text-emerald-400 font-mono text-[10px] tracking-widest uppercase mb-6">Theological Analysis</h4>
              <div className="font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">
                {diveContent}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevotionalDisplay;