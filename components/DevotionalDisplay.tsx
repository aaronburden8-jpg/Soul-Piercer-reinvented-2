
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
  const diveEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDiving && diveEndRef.current) {
      diveEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [diveContent, isDiving]);

  const parseSections = (markdown: string): DevotionalSection[] => {
    // Split by ### headers
    const parts = markdown.split(/^###\s+(.+)$/gm);
    const sections: DevotionalSection[] = [];
    
    // The very first part might be text BEFORE any header (e.g. a preamble)
    const preamble = parts[0].trim();
    if (preamble) {
      sections.push({ title: "Introduction", content: preamble });
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
    // Clean text and handle basic formatting
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
    if (isDiving) return;
    setIsDiving(true);
    setDiveContent("");
    
    const statuses = [
      "Accessing Historical Archives...",
      "Analyzing Etymological Roots...",
      "Mapping Archetypal Patterns...",
      "Decoding Theological Layers...",
      "Synthesizing Strategic Insights..."
    ];
    
    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      setDiveStatus(statuses[statusIdx % statuses.length]);
      statusIdx++;
    }, 3000);

    try {
      await generateDeepDiveStream(devotional.content, (chunk) => {
        setDiveContent(prev => prev + chunk);
        clearInterval(statusInterval);
        setDiveStatus("Receiving Transmission...");
      });
    } catch (err) {
      console.error(err);
      setDiveStatus("Research Interrupted.");
    } finally {
      clearInterval(statusInterval);
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

      case title.toLowerCase().includes('story'):
      case title.toLowerCase().includes('reflection'):
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
          {!diveContent && !isDiving && (
            <button 
              onClick={startDeepDive}
              className="w-full py-12 rounded-[4rem] bg-white/5 border border-white/10 text-white font-mono text-[13px] tracking-[0.7em] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-6"
            >
              <Icons.Dive className="w-6 h-6" /> SEEK THEOLOGICAL DEPTH
            </button>
          )}

          {isDiving && !diveContent && (
            <div className="flex flex-col items-center gap-8 py-20 animate-pulse">
               <Icons.Loader className="w-12 h-12 text-indigo-400" />
               <div className="text-center">
                 <p className="text-indigo-300 font-mono text-[12px] uppercase tracking-[0.4em] mb-2">{diveStatus}</p>
                 <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em]">Our high-capacity models are analyzing centuries of truth...</p>
               </div>
            </div>
          )}

          {diveContent && (
            <div className="mt-16 bg-slate-900/60 p-16 rounded-[4.5rem] border border-white/5 animate-slide-up shadow-2xl relative overflow-hidden backdrop-blur-3xl">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Icons.Dive className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-indigo-400 font-mono text-[10px] tracking-[0.5em] uppercase font-bold">Research Portal Active</h3>
                {isDiving && <Icons.Loader className="w-4 h-4 text-indigo-400 animate-spin ml-auto" />}
              </div>
              
              <div className="text-left text-slate-100 transition-all">
                {diveSections.map((section, i) => (
                   <div key={i} className="mb-12 last:mb-0">
                      <h4 className="text-indigo-200 font-serif-display text-2xl italic mb-6 border-b border-indigo-500/10 pb-4">{section.title}</h4>
                      {renderContent(section.content)}
                   </div>
                ))}
              </div>
              <div ref={diveEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevotionalDisplay;
