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
    // Clean up typography and split for bold/italic markers
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
      if (!t) return <div key={i} className="h-2 md:h-4"></div>;

      // Detect and render internal headers (Common in Deep Dives)
      if (t.startsWith('### ')) {
        return (
          <h4 key={i} className="text-emerald-400 font-bold text-[11px] md:text-sm mt-8 mb-4 uppercase tracking-[0.3em] border-l-2 border-emerald-500/30 pl-4">
            {processLineText(t.replace('### ', ''))}
          </h4>
        );
      }
      
      // Detect and render lists with custom styling
      if (t.startsWith('- ') || t.startsWith('* ')) {
        const lineContent = processLineText(t.substring(2));
        if (!lineContent) return null;
        return (
          <div key={i} className="flex gap-3 my-2 md:my-3">
            <span className="text-emerald-500/40 mt-1.5 shrink-0 text-xs">•</span>
            <div className="text-slate-200 text-base md:text-lg leading-relaxed flex-1">
              {lineContent}
            </div>
          </div>
        );
      }

      const processed = processLineText(t);
      if (!processed) return null;

      return (
        <p key={i} className={`my-4 md:my-6 text-slate-100 leading-relaxed ${isLarge ? 'text-lg md:text-2xl font-serif-display italic' : 'text-base md:text-lg font-normal'}`}>
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
    <div className="space-y-8 md:space-y-12">
      {sections.map((section, idx) => (
        <div key={idx} className="glass-panel p-6 md:p-16 rounded-3xl md:rounded-[3.5rem] border border-white/10 shadow-2xl">
          <h2 className="text-[8px] md:text-[10px] font-mono font-black text-indigo-400 uppercase tracking-[0.4em] mb-6 md:mb-8 border-b border-white/5 pb-3 md:pb-4">
            {section.title}
          </h2>
          <div className="prose prose-invert max-w-none">
            {renderContent(section.content, idx === 0)}
          </div>
        </div>
      ))}

      {(isDiving || diveContent || diveError) && (
        <div className="glass-panel p-6 md:p-16 rounded-3xl md:rounded-[3.5rem] border border-indigo-500/20 bg-indigo-500/5 shadow-inner mt-8 md:mt-12">
          <div className="flex items-center justify-between mb-6 md:mb-8 border-b border-white/5 pb-3 md:pb-4">
            <h2 className="text-[8px] md:text-[10px] font-mono font-black text-emerald-400 uppercase tracking-[0.4em] flex items-center gap-2 md:gap-3">
              <Icons.Dive className={`w-3 h-3 md:w-4 md:h-4 ${isDiving ? 'animate-bounce' : ''}`} />
              Deep Dive
            </h2>
            <span className="text-[7px] md:text-[8px] font-mono text-slate-500 uppercase tracking-widest italic">
              {diveStatus}
            </span>
          </div>
          
          <div className="prose prose-invert max-w-none">
            {diveContent ? (
              renderContent(diveContent)
            ) : isDiving ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-12 gap-3 md:gap-4">
                <Icons.Loader className="w-6 h-6 md:w-8 md:h-8 text-indigo-400" />
                <p className="font-mono text-[8px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] animate-pulse">Consulting the Archives...</p>
              </div>
            ) : diveError ? (
              <p className="text-red-400 font-mono text-[10px] md:text-[12px]">Transmission interrupted.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevotionalDisplay;