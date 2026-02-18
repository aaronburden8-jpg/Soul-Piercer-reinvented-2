import React, { useState, useEffect, useRef } from 'react';
import { Devotional, DevotionalSection } from '../types';
import { Icons } from '../constants';
import { generateDeepDiveStream } from '../services/geminiService';

declare var html2pdf: any;

interface Props {
  devotional: Devotional;
}

const DevotionalDisplay: React.FC<Props> = ({ devotional }) => {
  const [diveContent, setDiveContent] = useState<string>("");
  const [isDiving, setIsDiving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const hasStartedDive = useRef<boolean>(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const phantomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasStartedDive.current) {
      const timer = setTimeout(() => {
        startDeepDive();
      }, 7000); 
      return () => clearTimeout(timer);
    }
  }, [devotional.id]);

  const downloadPdf = async () => {
    if (!phantomRef.current) return;
    setIsExporting(true);
    try {
      const element = phantomRef.current;
      // We use zero margin in the library settings and rely entirely on the 
      // container's CSS padding for 100% control over the visual 'document' edges.
      const opt = {
        margin: 0, 
        filename: `SoulPiercer_Manuscript_${devotional.input.slice(0, 20).replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          letterRendering: true,
          backgroundColor: '#FFFFFF',
          width: 794, // Standard A4 pixel width at 96 DPI for better internal scaling
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

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

  const processLineText = (text: string, isManuscript = false) => {
    if (!text) return "";
    const sanitized = text.replace(/—/g, ' - ').replace(/--/g, ' - ');
    const parts = sanitized.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={isManuscript ? "text-slate-900 font-bold" : "text-white font-bold"}>{part.slice(2, -2)}</strong>;
      }
      const italicParts = part.split(/(\*.*?\*)/g);
      return italicParts.map((ip, j) => {
        if (ip.startsWith('*') && ip.endsWith('*')) {
          return <em key={`${i}-${j}`} className={isManuscript ? "italic text-emerald-800" : "italic text-emerald-200"}>{ip.slice(1, -1)}</em>;
        }
        return ip;
      });
    });
  };

  const renderContent = (text: string, isLarge = false, isManuscript = false) => {
    return text.split('\n').map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} className="h-4"></div>;
      if (t.startsWith('### ')) {
        const titleText = t.replace('### ', '');
        return (
          <div key={i} className="mt-8 mb-4">
            <h4 className={`${isManuscript ? 'text-emerald-700 font-bold border-b border-emerald-100 pb-2' : 'text-emerald-400 font-black'} text-lg md:text-xl uppercase tracking-widest`}>
              {processLineText(titleText, isManuscript)}
            </h4>
          </div>
        );
      }
      if (t.startsWith('- ') || t.startsWith('* ')) {
        const lineContent = processLineText(t.substring(2), isManuscript);
        if (!lineContent) return null;
        return (
          <div key={i} className="flex gap-4 my-2">
            <span className={isManuscript ? "text-emerald-600 mt-1" : "text-emerald-500/80 mt-2 shrink-0"}>•</span>
            <div className={`${isManuscript ? 'text-slate-800 text-base leading-relaxed break-words' : 'text-slate-200 text-base md:text-xl leading-relaxed'} flex-1`}>
              {lineContent}
            </div>
          </div>
        );
      }
      const processed = processLineText(t, isManuscript);
      if (!processed) return null;
      return (
        <p key={i} className={`my-4 break-words ${isManuscript ? 'text-slate-900 leading-relaxed text-[11pt] font-serif text-justify' : 'text-slate-100 leading-relaxed text-base md:text-xl'} ${isLarge && !isManuscript ? 'font-serif-display italic md:text-2xl' : ''} ${isLarge && isManuscript ? 'text-lg italic border-l-4 border-emerald-500 pl-6 my-8 py-2' : ''}`}>
          {processed}
        </p>
      );
    });
  };

  const startDeepDive = async () => {
    if (hasStartedDive.current) return;
    hasStartedDive.current = true;
    setIsDiving(true);
    try {
      await generateDeepDiveStream(devotional.content, (chunk) => {
        setDiveContent(prev => prev + chunk);
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDiving(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* UI ACTIONS */}
      <div className="flex justify-end no-print">
        <button 
          onClick={downloadPdf} 
          disabled={isExporting}
          className="px-6 py-4 glass-panel border border-emerald-500/20 text-emerald-400 font-mono font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-emerald-500/10 disabled:opacity-50 group"
        >
          {isExporting ? <Icons.Loader className="w-5 h-5" /> : <Icons.Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />}
          {isExporting ? "TYPESETTING..." : "DOWNLOAD MANUSCRIPT"}
        </button>
      </div>

      {/* WEB VIEW DISPLAY */}
      <div ref={exportRef} className="space-y-10 md:space-y-16">
        {sections.map((section, idx) => (
          <div key={idx} className="glass-panel p-8 md:p-16 rounded-3xl md:rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="mb-10 border-b border-white/10 pb-5 flex items-center gap-4">
               <Icons.Dive className="w-5 h-5 text-emerald-500/80 shrink-0" />
               <h2 className="text-[14px] md:text-[18px] font-mono font-black text-emerald-400 uppercase tracking-[0.3em]">
                 {section.title}
               </h2>
            </div>
            <div className="prose prose-invert max-w-none">
              {renderContent(section.content, idx === 0)}
            </div>
          </div>
        ))}

        {(isDiving || diveContent) && (
          <div className="glass-panel p-8 md:p-16 rounded-3xl md:rounded-[3.5rem] border border-emerald-500/20 bg-emerald-500/5 mt-12">
            <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-5">
              <Icons.Dive className={`w-5 h-5 text-emerald-400 ${isDiving ? 'animate-bounce' : ''}`} />
              <h2 className="text-[14px] font-mono font-black text-emerald-400 uppercase tracking-[0.4em]">
                Theological Deep Dive
              </h2>
            </div>
            <div className="prose prose-invert max-w-none">
              {diveContent ? renderContent(diveContent) : (
                <div className="flex flex-col items-center py-10 gap-4 no-print">
                  <Icons.Loader className="w-10 h-10 text-emerald-400" />
                  <p className="font-mono text-sm text-slate-500 uppercase tracking-widest animate-pulse">Consulting the Archives...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PHANTOM MANUSCRIPT FOR PDF (HIDDEN FROM WEB UI) */}
      <div style={{ position: 'absolute', left: '-10000px', top: '-10000px' }}>
        <div 
          ref={phantomRef} 
          className="bg-white text-slate-900 font-serif"
          style={{ width: '210mm', minHeight: '297mm', padding: '30mm 25mm', boxSizing: 'border-box', overflow: 'hidden' }}
        >
          {/* Header */}
          <div className="border-b-2 border-emerald-600 pb-8 mb-12 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-serif-display font-black text-emerald-700 uppercase tracking-tighter mb-2">Soul Piercer</h1>
              <p className="text-slate-500 font-mono text-[9px] uppercase tracking-[0.4em]">Spiritual Sharpening Tool • Manuscript Format</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-800 font-bold uppercase tracking-widest text-xs">Session {devotional.seriesDay || 1}</p>
              <p className="text-slate-400 font-mono text-[9px]">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="mb-12">
             <p className="text-slate-400 font-mono text-[9px] uppercase tracking-widest mb-2">Focus Topic:</p>
             <h2 className="text-3xl font-serif-display italic font-bold text-slate-900 border-l-4 border-emerald-500 pl-6 py-2 leading-tight">{devotional.input || "Untitled Meditation"}</h2>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, idx) => (
              <div key={idx} className="page-break-avoid">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-1 bg-emerald-600"></div>
                  <h3 className="font-mono font-black text-emerald-700 uppercase tracking-[0.2em] text-xs">
                    {section.title}
                  </h3>
                </div>
                <div className="text-slate-900">
                  {renderContent(section.content, idx === 0, true)}
                </div>
              </div>
            ))}

            {diveContent && (
              <div className="mt-16 pt-16 border-t border-slate-100 page-break-avoid">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-1 bg-slate-900"></div>
                  <h3 className="font-mono font-black text-slate-900 uppercase tracking-[0.2em] text-xs">
                    Theological Deep Dive Supplement
                  </h3>
                </div>
                <div className="text-slate-800">
                  {renderContent(diveContent, false, true)}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-slate-400 font-mono text-[8px] uppercase tracking-widest">
            <span>&copy; {new Date().getFullYear()} The Soul Piercer Sanctuary</span>
            <span>ID: {devotional.id.split('_')[1] || devotional.id}</span>
            <span>Typeset by Gemini 3 Pro</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevotionalDisplay;
