import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { Devotional } from '../types';
import { Icons } from '../constants';
import { generateDeepDiveStream, generateSpeech } from '../services/geminiService';

interface Props {
  devotional: Devotional;
}

const DevotionalDisplay: React.FC<Props> = ({ devotional }) => {
  const [diveContent, setDiveContent] = useState<string>("");
  const [isDiving, setIsDiving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const hasStartedDive = useRef<boolean>(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const phantomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      
      // 1. SAVE ORIGINAL LOOK
      const originalBg = element.style.backgroundColor;
      const originalColor = element.style.color;
      const originalFont = element.style.fontFamily; // Save the cool font
      
      // 2. SWITCH TO "PRINTER MODE"
      element.style.backgroundColor = "#ffffff";     // White Paper
      element.style.color = "#000000";               // Black Ink
      element.style.fontFamily = "Arial, sans-serif"; // Force Arial (Fixes Alien Text)
      
      const opt = {
        margin: 0.5,
        filename: `SoulPiercer_Manuscript_${devotional.input.slice(0, 10).replace(/\s+/g, '_')}.pdf`,
        image: { 
          type: 'jpeg' as const, 
          quality: 0.98 
        },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait' as const 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // 3. GENERATE PDF
      await html2pdf().set(opt).from(element).save();
      
      // 4. RESTORE ORIGINAL LOOK
      element.style.backgroundColor = originalBg;
      element.style.color = originalColor;
      element.style.fontFamily = originalFont;       // Put the cool font back

    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setIsExporting(false);
    }
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

  const handleGenerateAudio = async () => {
    if (audioUrl || isGeneratingAudio) return;
    setIsGeneratingAudio(true);
    try {
      const url = await generateSpeech(devotional.content);
      setAudioUrl(url);
    } catch (err) {
      console.error("Audio generation failed:", err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const parseSections = (markdown: string) => {
    if (!markdown) return [];
    const parts = markdown.split(/^###\s+(.+)$/gm);
    const sections = [];
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

  return (
    <div className="space-y-10">
      {/* UI ACTIONS */}
      <div className="flex flex-wrap justify-end gap-4 no-print">
        <button 
          onClick={handleGenerateAudio}
          disabled={isGeneratingAudio}
          className="px-6 py-4 glass-panel border border-emerald-500/20 text-emerald-400 font-mono font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-emerald-500/10 disabled:opacity-50 group"
        >
          {isGeneratingAudio ? <Icons.Loader className="w-5 h-5 animate-spin" /> : <Icons.Play className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          {isGeneratingAudio ? "CONJURING VOICE..." : audioUrl ? "NARRATION READY" : "NARRATE MANUSCRIPT"}
        </button>

        <button 
          onClick={downloadPdf} 
          disabled={isExporting}
          className="px-6 py-4 glass-panel border border-emerald-500/20 text-emerald-400 font-mono font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-emerald-500/10 disabled:opacity-50 group"
        >
          {isExporting ? <Icons.Loader className="w-5 h-5 animate-spin" /> : <Icons.Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />}
          {isExporting ? "TYPESETTING..." : "DOWNLOAD MANUSCRIPT"}
        </button>
      </div>

      {audioUrl && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 no-print"
        >
          <div className="flex items-center gap-4 mb-4">
            <Icons.Wind className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">Divine Narration Active</span>
          </div>
          <audio ref={audioRef} src={audioUrl} controls className="w-full h-10 accent-emerald-500" />
        </motion.div>
      )}

      {/* WEB VIEW DISPLAY */}
      <div ref={exportRef} className="space-y-10 md:space-y-16">
        {sections.map((section, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel p-8 md:p-16 rounded-3xl md:rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden"
          >
            <div className="mb-10 border-b border-white/10 pb-5 flex items-center gap-4">
               <Icons.Dive className="w-5 h-5 text-emerald-500/80 shrink-0" />
               <h2 className="text-[14px] md:text-[18px] font-mono font-black text-emerald-400 uppercase tracking-[0.3em]">
                 {section.title}
               </h2>
            </div>
            <div className="markdown-body prose prose-invert max-w-none prose-p:text-slate-100 prose-p:text-lg md:prose-p:text-xl prose-p:leading-relaxed prose-headings:text-emerald-400 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-[0.2em]">
              <Markdown>{section.content}</Markdown>
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {(isDiving || diveContent) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 md:p-16 rounded-3xl md:rounded-[3.5rem] border border-emerald-500/20 bg-emerald-500/5 mt-12"
            >
              <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-5">
                <Icons.Dive className={`w-5 h-5 text-emerald-400 ${isDiving ? 'animate-bounce' : ''}`} />
                <h2 className="text-[14px] font-mono font-black text-emerald-400 uppercase tracking-[0.4em]">
                  Theological Deep Dive
                </h2>
              </div>
              <div className="markdown-body prose prose-invert max-w-none prose-p:text-slate-100 prose-p:text-lg md:prose-p:text-xl prose-p:leading-relaxed prose-headings:text-emerald-400 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-[0.2em]">
                {diveContent ? <Markdown>{diveContent}</Markdown> : (
                  <div className="flex flex-col items-center py-10 gap-4 no-print">
                    <Icons.Loader className="w-10 h-10 text-emerald-400 animate-spin" />
                    <p className="font-mono text-sm text-slate-500 uppercase tracking-widest animate-pulse">Consulting the Archives...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              <div key={idx} className="page-break-avoid" style={{ breakInside: 'avoid' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-1 bg-emerald-600"></div>
                  <h3 className="font-mono font-black text-emerald-700 uppercase tracking-[0.2em] text-xs">
                    {section.title}
                  </h3>
                </div>
                <div className="text-slate-900 prose prose-slate max-w-none prose-p:break-inside-avoid prose-strong:text-emerald-800 prose-strong:font-bold">
                  <Markdown>{section.content}</Markdown>
                </div>
              </div>
            ))}

            {diveContent && (
              <div className="mt-16 pt-16 border-t border-slate-100 page-break-avoid" style={{ breakInside: 'avoid' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-1 bg-slate-900"></div>
                  <h3 className="font-mono font-black text-slate-900 uppercase tracking-[0.2em] text-xs">
                    Theological Deep Dive Supplement
                  </h3>
                </div>
                <div className="text-slate-800 prose prose-slate max-w-none prose-p:break-inside-avoid prose-strong:text-emerald-800 prose-strong:font-bold">
                  <Markdown>{diveContent}</Markdown>
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
