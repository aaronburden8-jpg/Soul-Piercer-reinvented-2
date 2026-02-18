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
    if (!hasStartedDive.current) {
      const timer = setTimeout(() => {
        startDeepDive();
      }, 7000); 
      return () => clearTimeout(timer);
    }
  }, [devotional.id]);

  const parseSections = (markdown: string): DevotionalSection[] => {
    if (!markdown) return [];
    const parts = markdown.split(/^###\s+(.+)$/gm);
    const sections: DevotionalSection[] = [];
    
    const firstPart = parts[0].trim();
    if (firstPart && firstPart !== "Transmission failed.") {
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
          return <em key={`${i}-${j}`} className="italic text-emerald-200">{ip.slice(1, -1)}</em>;
        }
        return ip;
      });
    });
  };

  const renderContent = (text: string, isLarge = false) => {
    return text.split('\n').map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} className="h-2 md:h-4"></div>;

      // Sub-headers: Vertical bar style from screenshot
      if (t.startsWith('### ')) {
        return (
          <div key={i} className="mt-12 mb-6">
            <div className="flex items-center gap-0">
              <div className="w-1.5 h-7 md:h-9 bg-emerald-500 mr-4 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <h4 className="text-emerald-400 font-black text-lg md:text-2xl uppercase tracking-[0.2em] drop-shadow-sm">
                {processLineText(t.replace('### ', ''))}
              </h4>
            </div>
          </div>
        );
      }
      
      if (t.startsWith('- ') || t.startsWith('* ')) {
        const lineContent = processLineText(t.substring(2));
        if (!lineContent) return null;
        return (
          <div key={i} className="flex gap-5 my-4 md:my-5">
            <span className="text-emerald-500/80 mt-2 shrink-0 text-lg">•</span>
            <div className="text-slate-200 text-base md:text-xl leading-relaxed flex-1">
              {lineContent}
            </div>
          </div>
        );
      }

      const processed = processLineText(t);
      if (!processed) return null;

      return (
        <p key={i} className={`my-6 md:my-8 text-slate-100 leading-relaxed ${isLarge ? 'text-xl md:text-2xl font-serif-display italic' : 'text-base md:text-xl font-normal'}`}>
          {processed}
        </p>
      );
    });
  };

  const startDeepDive = async () => {
    if (hasStartedDive.current) return;
    hasStartedDive.current = true;
    setIsDiving(true);
    setDiveError(false);
    setDiveContent("");
    setDiveStatus("Synthesizing Context...");
    
    try {
      await generateDeepDiveStream(devotional.content, (chunk) => {
        setDiveContent(prev => prev + chunk);
        setDiveStatus("Receiving Transmission...");
      });
    } catch (err: any) {
      console.error("Theological stream error:", err);
      setDiveError(true);
      setDiveStatus("Connection interrupted.");
    } finally {
      setIsDiving(false);
    }
  };

  return (
    <div className="space-y-10 md:space-y-16">
      {sections.map((section, idx) => (
        <div key={idx} className="glass-panel p-8 md:p-16 rounded-3xl md:rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Main Section Header: Double chevron style from screenshot */}
          <div className="mb-10 md:mb-14 border-b border-white/10 pb-5 md:pb-7 flex items-center gap-4">
             <Icons.Dive className="w-5 h-5 md:w-6 md:h-6 text-emerald-500/80 shrink-0" />
             <h2 className="text-[14px] md:text-[18px] font-mono font-black text-emerald-400 uppercase tracking-[0.3em] drop-shadow-md">
               {section.title}
             </h2>
          </div>
          <div className="prose prose-invert max-w-none">
            {renderContent(section.content, idx === 0)}
          </div>
        </div>
      ))}

      {(isDiving || diveContent || diveError) && (
        <div className="glass-panel p-8 md:p-16 rounded-3xl md:rounded-[3.5rem] border border-emerald-500/20 bg-emerald-500/5 shadow-inner mt-12 md:mt-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10 md:mb-14 border-b border-white/10 pb-5 md:pb-7">
            <div className="flex items-center gap-4">
              <Icons.Dive className={`w-5 h-5 md:w-7 md:h-7 text-emerald-400 ${isDiving ? 'animate-bounce' : ''}`} />
              <h2 className="text-[14px] md:text-[20px] font-mono font-black text-emerald-400 uppercase tracking-[0.4em] drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                Theological Deep Dive
              </h2>
            </div>
            <span className="text-[11px] md:text-[13px] font-mono text-slate-500 uppercase tracking-[0.2em] italic md:text-right font-bold">
              {diveStatus}
            </span>
          </div>
          
          <div className="prose prose-invert max-w-none">
            {diveContent ? (
              renderContent(diveContent)
            ) : isDiving ? (
              <div className="flex flex-col items-center justify-center py-16 md:py-24 gap-6 md:gap-8">
                <Icons.Loader className="w-10 h-10 md:w-12 md:h-12 text-emerald-400" />
                <p className="font-mono text-[12px] md:text-[14px] text-slate-500 uppercase tracking-[0.3em] font-black animate-pulse">Consulting the Archives...</p>
              </div>
            ) : diveError ? (
              <p className="text-red-400 font-mono text-[12px] md:text-[14px] font-black uppercase tracking-widest text-center py-10">Transmission interrupted. Protocol breach.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevotionalDisplay;