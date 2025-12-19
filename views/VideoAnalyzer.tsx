
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

export const VideoAnalyzer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<{ web: { uri: string, title: string } }[]>([]);
  const [prompt, setPrompt] = useState('');

  const analyzeVideo = async () => {
    if (!prompt) return;
    setAnalyzing(true);
    setResult(null);
    setSources([]);

    try {
      // Create a new GoogleGenAI instance right before making an API call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: 'أنت خبير تحليل أفلام ومحتوى فيديو في نظام Anwar-Matrix. قم بتقديم تحليلات دقيقة ومدعمة ببيانات البحث.'
        }
      });

      setResult(response.text || 'تعذر الحصول على تحليل.');
      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setSources(grounding as any);
    } catch (err) {
      console.error(err);
      setResult('حدث خطأ أثناء التحليل.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background-dark animate-fade-in p-8 overflow-hidden">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="size-14 rounded-2xl bg-white/5 border border-white/10 text-theme-primary flex items-center justify-center hover:scale-110 transition-all">
            <span className="material-symbols-outlined !text-3xl">arrow_forward</span>
          </button>
          <div>
            <h1 className="font-display text-4xl font-black text-theme-primary tracking-tighter uppercase">VIDEO INTELLIGENCE</h1>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">Pro Analysis & Search Grounding</p>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col gap-8">
        {/* Input Area */}
        <div className="bg-surface-dark/40 border border-white/5 rounded-[3rem] p-10 shadow-2xl">
           <h3 className="text-xl font-display font-black text-white mb-6 uppercase tracking-tight">ماذا تريد أن تعرف عن هذا المحتوى؟</h3>
           <div className="relative group">
              <textarea 
                className="w-full bg-black/60 border border-white/5 rounded-[2rem] p-8 text-xl font-bold text-white focus:border-theme-primary outline-none transition-all resize-none shadow-inner"
                rows={4}
                placeholder="مثلاً: حلل المشاهد القتالية في هذا الفيلم وقارنها بأعمال أخرى..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button 
                onClick={analyzeVideo}
                disabled={analyzing || !prompt}
                className="absolute bottom-6 left-6 px-10 py-4 bg-theme-primary text-black rounded-2xl font-display font-black text-lg shadow-theme hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
              >
                {analyzing ? 'جاري التحليل...' : 'بدء التحليل'}
              </button>
           </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 bg-black/40 border border-white/5 rounded-[3rem] p-10 overflow-y-auto custom-scrollbar relative">
           {!result && !analyzing && (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                 <span className="material-symbols-outlined !text-9xl mb-6">psychology</span>
                 <p className="font-display text-2xl font-black uppercase tracking-[0.5em]">Awaiting Analysis Query</p>
              </div>
           )}

           {analyzing && (
             <div className="h-full flex flex-col items-center justify-center">
                <div className="size-24 rounded-full border-4 border-theme-primary/10 border-t-theme-primary animate-spin mb-8"></div>
                <p className="font-mono text-theme-primary animate-pulse uppercase tracking-[0.3em]">Processing Matrix Intelligence...</p>
             </div>
           )}

           {result && (
             <div className="prose prose-invert max-w-none animate-fade-in">
                <h2 className="text-theme-primary font-display font-black uppercase mb-8 border-b border-theme-primary/20 pb-4">نتائج التحليل العميق</h2>
                <div className="text-lg leading-relaxed text-gray-300 font-medium whitespace-pre-wrap">
                   {result}
                </div>

                {sources.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-white/5">
                     <h4 className="text-xs font-black uppercase text-gray-500 mb-6 tracking-widest">Grounding Sources (Google Search):</h4>
                     <div className="flex flex-wrap gap-4">
                        {sources.map((s, i) => s.web && (
                          <a key={i} href={s.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-theme-primary/10 hover:border-theme-primary/40 transition-all">
                             <span className="material-symbols-outlined text-theme-primary text-sm">link</span>
                             <span className="text-xs font-bold text-gray-400">{s.web.title}</span>
                          </a>
                        ))}
                     </div>
                  </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
