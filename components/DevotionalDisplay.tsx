import React, { useState, useEffect, useRef } from 'react';
import { Devotional, DevotionalSection } from '../types';
import { Icons } from '../constants';
import { generateDeepDiveStream } from '../services/geminiService';

interface Props {
  devotional: Devotional;
}

const DevotionalDisplay: React.FC<Props> = ({ devotional }) => {
  const [diveContent, setDiveContent] = useState<string>("");
  const [isDiving, setIsDiving] = useState(false);
  const [diveStatus, setDiveStatus] = useState<string>("");
  const [diveError, setDiveError] = useState<boolean>(false);
  const hasStartedDive = useRef<boolean>(false);

  useEffect(() => {
    // Stagger background research to avoid hitting RPS (Requests Per Second) limits
    if (!hasStartedDive.current) {
      const timer = setTimeout(() => {
        startDeepDive();
      }, 4000); // Increased from 1.5s to 4s for API stability
      return () => clearTimeout(timer);
    }
  }, [devotional.id]);

  const parseSections = (markdown: string): DevotionalSection[] => {
    if (!markdown) return [];
    const parts = markdown.split(/^###\s+(.+)$/gm);
    const sections: DevotionalSection[] = [];
    
    const firstPart = parts[0].trim();
    if (firstPart) {
      sections.push({ title: "Foundational Insight", content: firstPart });
    }

    for (let i = 1; i < parts.length; i += 2) {
      sections.push({
        title: parts[i].trim(),
        content: parts[i + 1] ? parts[i + 1].trim() : ""
      });
    }
    return sections;
  };

  const sections = parseSections(devotional.content);

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
      if (!t) return <div key={i} className="h-4"></div>;
      
      if (t.startsWith('- ') || t.startsWith('* ')) {
        const lineContent = processLineText(t.substring(2));
        if (!lineContent) return null;
        return (
          <li key={i} className="ml-6 list-disc text-slate-200 text-xl leading-relaxed my-2">
            {lineContent}
          </li>
        );
      }

      const processed = processLineText(t);
      if (!processed) return null;

      return <p key={i} className={`my-6 text-slate-100 leading-relaxed ${isLarge ? 'text-2xl font-serif-display italic' : 'text-xl font-normal'}`}>{processed}</p>;
    });
  };

  const startDeepDive = async () => {
    if (hasStartedDive.current) return;
    hasStartedDive.current = true;
    setIsDiving(true);
    setDiveError(false);
    setDiveContent("");
    setDiveStatus("Synthesizing Theological Context...");
    
    try {
      await generateDeepDiveStream(devotional.content, (chunk) => {
        setDiveContent(prev => prev + chunk);
        setDiveStatus("Receiving Transmission...");
      });
    } catch (err: any) {
      console.error("Theological stream error:", err);
      setDiveError(true);
      setDiveStatus("Research connection interrupted.");
    } finally {
      setIsDiving(false);
    }
  };

  const renderSection = (section: DevotionalSection, index: number) => {
    const { title, content } = section;
    const delay = `${index * 0.1}s`;

    switch (true) {
      case title.toLowerCase().includes('preamble') || title.toLowerCase().includes('introduction'):
        return (
          <div key={title} className="mb-24 animate-slide-up" style={{ animationDelay: delay }}>
            <h4 className="text-indigo-400 font-mono text-[10px] tracking-[0.5em] uppercase mb-10 flex items-center gap-6">
              <Icons.Target className="w-4 h-4" /> PREAMBLE
            </h4>
            <div className="text-slate-100 leading-relaxed font-serif-display text-2xl italic bg-white/[0.02] p-12 md:p-16 rounded-[3.5rem] border border-white/5">
               {renderContent(content)}
            </div>
          </div>
        );

      case title.toLowerCase().includes('word'):
        return (
          <div key={title} className="mb-20 animate-slide-up" style={{ animationDelay: delay }}>
             <h4 className="text-emerald-300 font-mono text-[10px] tracking-[0.6em] uppercase mb-10 flex items-center gap-6">
               <span className="w-16 h-px bg-emerald-400/20"></span> THE WORD
            </h4>
            <div className="bg-emerald-500/10 border border-emerald-400/20 p-12 rounded-[3.5rem] shadow-2xl">
               <div className="space-y-8">
                  {content.split('\n').filter(l => l.trim()).map((verse, vi) => {
                    const processed = processLineText(verse);
                    if (!processed) return null;
                    return (
                      <div key={vi} className="font-serif-display text-3xl text-emerald-50 leading-relaxed border-l-2 border-emerald-500/30 pl-8">
                         {processed}
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        );

      case title.toLowerCase().includes('story') || title.toLowerCase().includes('reflection'):
        return (
          <div key={title} className="mb-24 animate-slide-up" style={{ animationDelay: delay }}>
            <div className="flex flex-col items-center gap-6 mb-12">
              <h4 className="text-indigo-200 font-mono text-2xl tracking-[0.3em] uppercase text-center font-black">
                {title.toUpperCase()}
              </h4>
              <div className="w-24 h-0.5 bg-indigo-500/30"></div>
            </div>
            <div className="text-slate-50 bg-white/[0.02] p-12 md:p-16 rounded-[4rem] border border-white/5 shadow-inner">
               {renderContent(content)}
            </div>
          </div>
        );

      case title.toLowerCase().includes('exchange'):
        return (
          <div key={title} className="my-24 animate-slide-up" style={{ animationDelay: delay }}>
             <div className="flex flex-col items-center gap-6 mb-12">
              <h4 className="text-amber-200 font-mono text-2xl tracking-[0.3em] uppercase text-center font-black">
                THE EXCHANGE
              </h4>
              <div className="w-24 h-0.5 bg-amber-500/30"></div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {content.split('\n').filter(l => l.trim()).map((q, i) => (
                  <div key={i} className="flex flex-col gap-8 p-12 rounded-[3.5rem] bg-white/[0.04] border border-white/10 shadow-2xl hover:bg-white/[0.06] transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-mono text-white text-xl border border-white/20 group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <p className="text-slate-50 text-2xl font-serif-display italic leading-relaxed">
                      {processLineText(q.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').replace(/^\*\s*/, ''))}
                    </p>
                  </div>
                ))}
             </div>
          </div>
        );

      case title.toLowerCase().includes('prayer'):
        return (
          <div key={title} className="mt-28 mb-16 animate-slide-up text-center" style={{ animationDelay: delay }}>
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 p-16 rounded-[5rem] shadow-2xl relative max-w-4xl mx-auto overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"></div>
               <h4 className="text-slate-400 font-mono text-[10px] tracking-[0.5em] uppercase mb-10">THE PRAYER</h4>
               <div className="text-4xl font-serif-display italic text-white leading-snug px-4">
                 {renderContent(content)}
               </div>
            </div>
          </div>
        );

      case title.toLowerCase().includes('key thoughts'):
        return (
          <div key={title} className="my-24 animate-slide-up" style={{ animationDelay: delay }}>
            <div className="bg-slate-900/40 border border-white/5 p-12 rounded-[4rem] shadow-2xl">
              <h4 className="text-slate-500 font-mono text-[10px] tracking-[0.5em] uppercase mb-10 text-center">KEY THOUGHTS</h4>
              <ul className="space-y-6">
                {content.split('\n').filter(l => l.trim()).map((t, i) => {
                  const processed = processLineText(t.replace(/^-\s*/, '').replace(/^\*\s*/, ''));
                  if (!processed) return null;
                  return (
                    <li key={i} className="flex gap-6 items-start">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-3 shrink-0"></div>
                      <p className="text-slate-200 text-xl font-medium leading-relaxed">
                        {processed}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div key={index} className="mb-16 animate-slide-up text-slate-100 text-xl" style={{ animationDelay: delay }}>
             {renderContent(content)}
          </div>
        );
    }
  };

  const diveSections = diveContent ? parseSections(diveContent) : [];

  return (
    <div className="space-y-12">
      <div className="glass-panel p-12 md:p-24 rounded-[5.5rem] relative border border-white/20 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 10%, #818cf8 0%, transparent 50%), radial-gradient(circle at 90% 90%, #f472b6 0%, transparent 50%)' }}></div>
        
        <div className="max-w-4xl mx-auto">
          {sections.map((section, i) => renderSection(section, i))}
        </div>

        <div className="mt-40 pt-20 border-t border-white/5 max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-12">
            <div className={`w-3 h-3 rounded-full ${isDiving ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <h3 className="text-slate-500 font-mono text-[10px] tracking-[0.5em] uppercase font-bold">
              {isDiving ? diveStatus : "Optional Additional Theological Context"}
            </h3>
            {diveError && (
              <button 
                onClick={() => { hasStartedDive.current = false; startDeepDive(); }}
                className="ml-auto text-indigo-400 font-mono text-[10px] uppercase tracking-widest hover:text-white transition-colors"
              >
                [Retry Synthesis]
              </button>
            )}
          </div>

          {isDiving && !diveContent && (
            <div className="flex flex-col items-center gap-8 py-20 opacity-50">
               <Icons.Loader className="w-10 h-10 text-slate-400" />
            </div>
          )}

          {diveContent && (
            <div className="bg-slate-900/40 p-12 md:p-16 rounded-[4.5rem] border border-white/5 animate-slide-up shadow-2xl backdrop-blur-3xl">
              <div className="text-left text-slate-100 transition-all">
                {diveSections.map((section, i) => (
                   <div key={i} className="mb-12 last:mb-0">
                      <h4 className="text-indigo-200 font-serif-display text-2xl italic mb-6 border-b border-indigo-500/10 pb-4">{section.title}</h4>
                      <div className="text-slate-300">
                        {renderContent(section.content)}
                      </div>
                   </div>
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