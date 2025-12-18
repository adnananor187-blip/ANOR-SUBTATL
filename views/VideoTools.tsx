
import React, { useState, useRef } from 'react';
import { Subtitle } from '../types';
import { translateSubtitlesMastermind } from '../services/geminiService';

interface VideoToolsProps {
  onBack: () => void;
}

type ToolType = 'none' | 'subtitle_translator';

export const VideoTools: React.FC<VideoToolsProps> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<ToolType>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSRT = (text: string): Subtitle[] => {
    const blocks = text.trim().split(/\n\s*\n/);
    return blocks.map((block, index) => {
      const lines = block.split('\n');
      if (lines.length < 3) return null;
      const id = lines[0].trim();
      const timeLine = lines[1];
      const textLines = lines.slice(2).join(' ');
      const times = timeLine.split(' --> ');
      return {
        id: id || index.toString(),
        startTime: times[0]?.trim() || '',
        endTime: times[1]?.trim() || '',
        originalText: textLines,
        translatedText: ''
      };
    }).filter(Boolean) as Subtitle[];
  };

  const generateSRT = (subs: (Subtitle & { emotion?: string })[]): string => {
    return subs.map(sub => {
      return `${sub.id}\n${sub.startTime} --> ${sub.endTime}\n${sub.translatedText}\n`;
    }).join('\n');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setTranslatedContent(null);

    try {
      const text = await file.text();
      const parsedSubs = parseSRT(text);
      
      // Batch translation in chunks if too large (simplified here)
      const translatedSubs = await translateSubtitlesMastermind(parsedSubs, 'Arabic');
      const finalSrt = generateSRT(translatedSubs);
      setTranslatedContent(finalSrt);
    } catch (error) {
      console.error("Translation failed:", error);
      alert("حدث خطأ أثناء ترجمة الملف. يرجى التأكد من صيغة الملف.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!translatedContent) return;
    const blob = new Blob([translatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_matrix_${Date.now()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-background-dark p-8 animate-fade-in overflow-hidden">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={activeTool === 'none' ? onBack : () => setActiveTool('none')} 
            className="size-14 rounded-2xl bg-white/5 border border-white/10 text-theme-primary flex items-center justify-center hover:scale-110 transition-all"
          >
            <span className="material-symbols-outlined !text-3xl">arrow_forward</span>
          </button>
          <div>
            <h1 className="font-display text-4xl font-black text-theme-primary tracking-tighter uppercase">
              {activeTool === 'subtitle_translator' ? 'SUBTITLE TRANSLATOR' : 'VIDEO TOOLS BOX'}
            </h1>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">Advanced Utility Module Active</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTool === 'none' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
            <ToolCard 
              icon="translate" 
              title="مترجم النصوص" 
              desc="ترجمة ملفات SRT و VTT مباشرة باستخدام محرك Matrix" 
              onClick={() => setActiveTool('subtitle_translator')}
            />
            <ToolCard icon="audio_file" title="استخراج الصوت" desc="تحويل أي فيديو إلى ملف صوتي عالي الجودة" />
            <ToolCard icon="slow_motion_video" title="مزامنة يدوية" desc="ضبط التوقيت بين الصوت والترجمة يدوياً" />
            <ToolCard icon="movie_edit" title="دمج الترجمة" desc="حرق الترجمة داخل ملف الفيديو بشكل دائم" />
            <ToolCard icon="voice_selection" title="مدير الدبلجة" desc="اختيار وتخصيص أصوات الدبلجة الذكية" />
            <ToolCard icon="settings_suggest" title="تحسين الجودة" desc="تحسين جودة الفيديو والصوت باستخدام AI" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            <div className="bg-surface-dark/40 border border-white/5 rounded-[3rem] p-12 text-center shadow-2xl">
              {isProcessing ? (
                <div className="py-20 flex flex-col items-center">
                  <div className="size-32 rounded-full border-4 border-theme-primary/10 border-t-theme-primary animate-spin mb-8"></div>
                  <h2 className="text-2xl font-display font-black text-theme-primary animate-pulse uppercase tracking-widest">Processing Intelligence...</h2>
                  <p className="text-gray-500 mt-4">نقوم الآن بتحليل وترجمة نصوص الملف بدقة Lip-Sync</p>
                </div>
              ) : translatedContent ? (
                <div className="py-12">
                  <div className="size-32 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                    <span className="material-symbols-outlined !text-6xl">check_circle</span>
                  </div>
                  <h2 className="text-3xl font-display font-black text-white mb-4 uppercase tracking-tight">ترجمة ناجحة!</h2>
                  <p className="text-gray-400 mb-12 max-w-md mx-auto">الملف المترجم جاهز الآن للتحميل والاستخدام في مشروعاتك السينمائية.</p>
                  
                  <div className="flex justify-center gap-6">
                    <button 
                      onClick={() => setTranslatedContent(null)}
                      className="px-10 py-5 bg-white/5 border border-white/10 rounded-3xl text-sm font-black uppercase hover:bg-white/10 transition-all"
                    >
                      ترجمة ملف آخر
                    </button>
                    <button 
                      onClick={downloadFile}
                      className="px-12 py-5 bg-theme-primary text-black rounded-3xl text-sm font-black uppercase shadow-theme hover:scale-105 transition-all flex items-center gap-3"
                    >
                      <span className="material-symbols-outlined">download</span>
                      تحميل الملف المترجم
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12">
                  <div className="size-32 rounded-full bg-theme-primary/10 text-theme-primary flex items-center justify-center mx-auto mb-10">
                    <span className="material-symbols-outlined !text-6xl">subtitles</span>
                  </div>
                  <h2 className="text-3xl font-display font-black text-white mb-6 uppercase tracking-tight">رفع ملف الترجمة</h2>
                  <p className="text-gray-500 mb-12 max-w-md mx-auto">قم برفع ملفات SRT أو VTT ليقوم الذكاء الاصطناعي بترجمتها فوراً مع مراعاة طول الجمل الأصلية.</p>
                  
                  <input 
                    type="file" 
                    accept=".srt,.vtt" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload}
                  />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-16 py-6 bg-theme-primary text-black font-display font-black text-2xl rounded-[2.5rem] shadow-theme hover:scale-110 active:scale-95 transition-all transform flex items-center gap-4 mx-auto"
                  >
                    <span className="material-symbols-outlined !text-4xl">upload_file</span>
                    اختر ملف من جهازك
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-12 text-center text-[10px] font-mono text-gray-700 uppercase tracking-[0.5em]">
        ANWAR_MATRIX_TOOLBOX_STABLE_BUILD
      </div>
    </div>
  );
};

const ToolCard: React.FC<{ icon: string, title: string, desc: string, onClick?: () => void }> = ({ icon, title, desc, onClick }) => (
  <div 
    onClick={onClick}
    className="group bg-surface-dark/40 border border-white/5 rounded-[2.5rem] p-10 hover:border-theme-primary/40 transition-all cursor-pointer hover:-translate-y-2"
  >
    <div className="flex items-center gap-6">
      <div className={`size-20 rounded-3xl bg-theme-primary/10 text-theme-primary flex items-center justify-center group-hover:bg-theme-primary group-hover:text-black transition-all duration-300`}>
        <span className="material-symbols-outlined !text-4xl">{icon}</span>
      </div>
      <div>
        <h3 className="font-display font-black text-2xl mb-2 tracking-tight text-white">{title}</h3>
        <p className="text-sm text-gray-500 font-medium">{desc}</p>
      </div>
    </div>
  </div>
);
