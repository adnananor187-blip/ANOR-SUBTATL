import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Subtitle } from '../types';
import { extractAudioFromVideo, transcribeAudioWithGemini, processTranslationPipeline } from '../services/geminiService';
import { ThemeType } from '../App';

interface StudioProps {
  onBack: () => void;
  videoFile: File | null;
  theme: ThemeType;
}

type PipelineStep = 
  | 'idle' 
  | 'extract' 
  | 'transcribe' 
  | 'translate' 
  | 'done'
  | 'error';

const STEP_LABELS: Record<PipelineStep, string> = {
  idle: 'جاهز لبدء المعالجة...',
  extract: 'جاري استخراج وتحويل الصوت (WAV)...',
  transcribe: 'جاري استخراج النصوص عبر الماتريكس (STT)...',
  translate: 'جاري كشف اللغة والترجمة السينمائية...',
  done: '✅ اكتمل الإنتاج النهائي!',
  error: '❌ فشل في معالجة البيانات'
};

const EMOTIONS = ['هادئ', 'متحمس', 'حزين', 'غاضب', 'خائف', 'ساخر', 'رومانسي', 'جاد'];

export const Studio: React.FC<StudioProps> = ({ onBack, videoFile, theme }) => {
  const [step, setStep] = useState<PipelineStep>('idle');
  const [progress, setProgress] = useState(0);
  const [subtitles, setSubtitles] = useState<(Subtitle & { emotion?: string })[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  
  const [originalText, setOriginalText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoUrl = useMemo(() => {
    if (videoFile) return URL.createObjectURL(videoFile);
    return '';
  }, [videoFile]);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  };

  useEffect(() => {
    if (videoFile) {
      processVideoAutomatically();
    }
    return () => { if (videoUrl) URL.revokeObjectURL(videoUrl); };
  }, [videoFile]);

  const processVideoAutomatically = async () => {
    try {
      if (!videoFile) return;
      setIsDone(false);
      setIsComplete(false);
      setSubtitles([]);
      addLog(`بدء معالجة الباب الأول لملف: ${videoFile.name}`);

      // استخراج الصوت
      setStep('extract');
      setStatus('جاري استخراج الصوت...');
      setProgress(10);
      addLog("جاري استخراج الصوت...");
      const wavBlob = await extractAudioFromVideo(videoFile);
      setStatus('تم استخراج الصوت بنجاح!');
      addLog("تم استخراج الصوت بنجاح (WAV)!");
      setProgress(30);

      // تفريغ النص
      setStep('transcribe');
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error("فشل تحويل الملف إلى Base64"));
        reader.readAsDataURL(wavBlob);
      });
      
      addLog("جاري الاتصال بنواة Gemini للتفريغ الصوتي...");
      const rawSubs = await transcribeAudioWithGemini(base64Audio);
      setSubtitles(rawSubs);
      setOriginalText(rawSubs.map(s => s.originalText).join(' '));
      addLog(`تم استخراج ${rawSubs.length} مقطع صوتي.`);
      setProgress(60);

      // الترجمة
      setStep('translate');
      addLog("جاري تحليل اللغة وتوليد الترجمة العربية...");
      const { translatedSubs, detectedLang: lang } = await processTranslationPipeline(rawSubs);
      
      setSubtitles(translatedSubs);
      setDetectedLanguage(lang);
      setTranslatedText(translatedSubs.map(s => s.translatedText).join(' '));
      addLog(`اللغة المكتشفة: ${lang}. اكتملت الترجمة.`);
      
      setProgress(100);
      setStep('done');
      setIsDone(true);
      setIsComplete(true);

    } catch (error: any) {
      console.error('خطأ:', error);
      setStatus(`خطأ: ${error.message}`);
      setStep('error');
      addLog(`خطأ فادح: ${error.message || 'فشل الاتصال بالماتريكس'}`);
      setIsDone(false);
      setIsComplete(false);
    }
  };

  const currentSubtitle = useMemo(() => {
    return subtitles.find(s => {
      const start = parseFloat(s.startTime);
      const end = parseFloat(s.endTime);
      return currentTime >= start && currentTime <= end;
    });
  }, [subtitles, currentTime]);

  const updateSubtitle = (id: string, updates: Partial<Subtitle & { emotion?: string }>) => {
    setSubtitles(prev => {
      const newSubs = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      setTranslatedText(newSubs.map(s => s.translatedText).join(' '));
      return newSubs;
    });
  };

  const downloadSubtitleFile = () => {
    const formatTime = (seconds: string) => {
      const totalSeconds = parseFloat(seconds);
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = Math.floor(totalSeconds % 60);
      const millis = Math.floor((totalSeconds % 1) * 1000);
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
    };

    const srtContent = subtitles.map((s, i) => {
      return `${i + 1}\n${formatTime(s.startTime)} --> ${formatTime(s.endTime)}\n${s.translatedText}\n`;
    }).join('\n');

    triggerDownload(srtContent, 'subtitle-arabic.srt', 'text/srt');
  };

  const downloadTranslatedText = () => {
    triggerDownload(translatedText, 'translation-arabic.txt', 'text/plain');
  };

  const downloadOriginalText = () => {
    triggerDownload(originalText, 'original-transcript.txt', 'text/plain');
  };

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    const words = translatedText.split(' ').filter(w => w.length > 0).length;
    return {
      wordCount: words,
      duration: duration ? duration.toFixed(1) + 's' : '0s'
    };
  }, [translatedText, duration]);

  return (
    <div className="flex flex-col h-full bg-background-dark animate-fade-in overflow-hidden">
      <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface-dark/95 backdrop-blur-3xl relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="size-10 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center hover:bg-theme-primary hover:text-black transition-all border border-theme-primary/20">
            <span className="material-symbols-outlined !text-xl">arrow_forward</span>
          </button>
          <div>
            <h2 className="text-lg font-black font-display tracking-tight text-white uppercase">ANWAR MATRIX EDITOR</h2>
            <div className="flex items-center gap-2">
              <span className={`size-1.5 rounded-full ${isDone ? 'bg-green-500 shadow-theme' : step === 'error' ? 'bg-red-500 shadow-theme' : 'bg-theme-primary animate-pulse'}`}></span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'error' ? 'text-red-500' : 'text-theme-primary'}`}>{status || STEP_LABELS[step]}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="text-[9px] font-mono px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-500">
             LANG: <span className="text-theme-primary">{detectedLanguage || 'قيد التحليل'}</span>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/matrix.png')] bg-repeat overflow-y-auto custom-scrollbar">
          <div className="flex-1 flex flex-col items-center p-6 bg-black/40">
            {!isComplete && step !== 'error' && (
              <div className="w-full max-w-xl bg-black/90 backdrop-blur-3xl border border-theme-primary/20 rounded-[2rem] p-8 mb-8 animate-fade-in shadow-2xl mt-20">
                <div className="flex justify-between text-xs mb-3 font-mono font-black text-theme-primary uppercase">
                  <span>{status || STEP_LABELS[step]}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                  <div className="h-full bg-theme-primary transition-all duration-700 shadow-theme" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="space-y-1">
                  {systemLogs.map((log, i) => (
                    <p key={i} className={`text-[9px] font-mono tracking-widest ${i === 0 ? 'text-theme-primary' : 'text-gray-600'}`}>{log}</p>
                  ))}
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="w-full max-w-xl bg-red-950/20 backdrop-blur-3xl border border-red-500/20 rounded-[2rem] p-8 mb-8 animate-fade-in shadow-2xl mt-20 text-center">
                <span className="material-symbols-outlined !text-6xl text-red-500 mb-4">error</span>
                <h2 className="text-xl font-display font-black text-white uppercase mb-2">فشل النظام</h2>
                <p className="text-sm text-gray-400 mb-6">{status || systemLogs[0]}</p>
                <button 
                  onClick={() => processVideoAutomatically()}
                  className="px-8 py-3 bg-red-500 text-white rounded-xl font-display font-black text-xs hover:bg-red-600 transition-all"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            <div className={`w-full max-w-4xl aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl relative border border-white/10 group ${!isDone && step !== 'error' ? 'blur-sm scale-95 opacity-50' : ''}`}>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              <div className="absolute inset-x-0 bottom-12 text-center px-10 pointer-events-none">
                {currentSubtitle && (
                  <div className="inline-block bg-black/80 backdrop-blur-xl text-white px-6 py-2 rounded-xl text-xl font-bold shadow-2xl border-b-4 border-theme-primary animate-fade-in">
                     {currentSubtitle.translatedText}
                  </div>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative h-1 bg-white/10 rounded-full cursor-pointer overflow-hidden">
                   <div className="h-full bg-theme-primary" style={{ width: `${(currentTime / duration) * 100 || 0}%` }}></div>
                </div>
                <div className="flex items-center justify-between">
                   <button onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()} className="text-white hover:text-theme-primary">
                      <span className="material-symbols-outlined">{isPlaying ? 'pause' : 'play_arrow'}</span>
                   </button>
                   <span className="text-[10px] font-mono text-white/50">
                      {Math.floor(currentTime)}s / {Math.floor(duration)}s
                   </span>
                </div>
              </div>
            </div>

            {isComplete && (
              <div className="w-full max-w-4xl mt-12 animate-fade-in space-y-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface-dark/80 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                       <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">description</span>
                          النص الأصلي المستخرج
                       </h3>
                       <span className="text-[10px] text-theme-primary font-mono bg-theme-primary/5 px-2 py-0.5 rounded">DETECTED: {detectedLanguage}</span>
                    </div>
                    <div className="h-48 overflow-y-auto custom-scrollbar text-sm text-gray-400 font-medium leading-relaxed italic pr-2" dir="ltr">
                       {originalText}
                    </div>
                  </div>

                  <div className="bg-surface-dark/80 border border-theme-primary/20 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                       <h3 className="text-theme-primary text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">translate</span>
                          الترجمة العربية النهائية
                       </h3>
                       <div className="flex gap-2">
                         <span className="text-[9px] text-gray-500 font-mono">كلمة: {stats.wordCount}</span>
                         <span className="text-[9px] text-gray-500 font-mono">مدة: {stats.duration}</span>
                       </div>
                    </div>
                    <div className="h-48 overflow-y-auto custom-scrollbar text-lg text-white font-bold leading-relaxed pr-2" dir="rtl">
                       {translatedText}
                    </div>
                  </div>
                </div>

                <div className="bg-theme-primary/5 border border-theme-primary/20 rounded-[2.5rem] p-8">
                   <h4 className="text-center text-xs font-black text-theme-primary uppercase tracking-[0.4em] mb-8">MATRIX EXPORT HUB</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <button onClick={downloadSubtitleFile} className="group flex flex-col items-center gap-4 p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-theme-primary/40 transition-all hover:-translate-y-1">
                         <div className="size-14 rounded-2xl bg-theme-primary text-black flex items-center justify-center shadow-theme group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined !text-3xl">closed_caption</span>
                         </div>
                         <div className="text-center">
                            <span className="block text-xs font-black text-white uppercase mb-1">تحميل SRT</span>
                            <span className="block text-[9px] text-gray-500 font-mono">Subtitle Data Stream</span>
                         </div>
                      </button>

                      <button onClick={downloadTranslatedText} className="group flex flex-col items-center gap-4 p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-theme-primary/40 transition-all hover:-translate-y-1">
                         <div className="size-14 rounded-2xl bg-white/10 text-theme-primary flex items-center justify-center group-hover:bg-theme-primary group-hover:text-black transition-all">
                            <span className="material-symbols-outlined !text-3xl">description</span>
                         </div>
                         <div className="text-center">
                            <span className="block text-xs font-black text-white uppercase mb-1">تحميل النص المترجم</span>
                            <span className="block text-[9px] text-gray-500 font-mono">Translated TXT Node</span>
                         </div>
                      </button>

                      <button onClick={downloadOriginalText} className="group flex flex-col items-center gap-4 p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-theme-primary/40 transition-all hover:-translate-y-1">
                         <div className="size-14 rounded-2xl bg-white/5 text-gray-400 flex items-center justify-center group-hover:bg-white/10 group-hover:text-white transition-all">
                            <span className="material-symbols-outlined !text-3xl">history_edu</span>
                         </div>
                         <div className="text-center">
                            <span className="block text-xs font-black text-white uppercase mb-1">تحميل النص الأصلي</span>
                            <span className="block text-[9px] text-gray-500 font-mono">Original Transcript Dump</span>
                         </div>
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="w-[450px] border-r border-white/5 bg-surface-dark/95 backdrop-blur-3xl flex flex-col shadow-2xl">
           <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-display font-black text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-theme-primary">edit_note</span>
                تحرير الماتريكس التفاعلي
              </h3>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                Total: {subtitles.length}
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {subtitles.length === 0 && !isComplete && (
                <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
                   <span className="material-symbols-outlined !text-[80px] animate-spin">sync</span>
                   <p className="font-display text-[10px] font-black uppercase tracking-[0.5em]">Ingesting Audio Core...</p>
                </div>
              )}
              {subtitles.map((s) => {
                const isActive = currentTime >= parseFloat(s.startTime) && currentTime <= parseFloat(s.endTime);
                return (
                  <div key={s.id} className={`p-5 rounded-[2rem] border transition-all duration-300 relative group ${isActive ? 'bg-theme-primary/10 border-theme-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                           <div className="flex flex-col">
                              <label className="text-[8px] font-mono text-gray-600 uppercase mb-0.5">Start</label>
                              <input type="number" step="0.1" value={s.startTime} onChange={(e) => updateSubtitle(s.id, { startTime: e.target.value })} className="w-16 bg-black/60 border border-white/5 rounded-lg text-[10px] font-mono text-theme-primary px-2 py-1 outline-none focus:border-theme-primary" />
                           </div>
                           <div className="flex flex-col">
                              <label className="text-[8px] font-mono text-gray-600 uppercase mb-0.5">End</label>
                              <input type="number" step="0.1" value={s.endTime} onChange={(e) => updateSubtitle(s.id, { endTime: e.target.value })} className="w-16 bg-black/60 border border-white/5 rounded-lg text-[10px] font-mono text-theme-primary px-2 py-1 outline-none focus:border-theme-primary" />
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <label className="text-[8px] font-mono text-gray-600 uppercase mb-0.5">Emotion</label>
                           <select value={s.emotion} onChange={(e) => updateSubtitle(s.id, { emotion: e.target.value })} className="bg-black/60 border border-white/5 rounded-lg text-[10px] font-sans text-gray-300 px-2 py-1 outline-none focus:border-theme-primary appearance-none cursor-pointer">
                             {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                           </select>
                        </div>
                     </div>
                     <div className="mb-4">
                        <label className="text-[8px] font-mono text-gray-600 uppercase mb-1 block">Original</label>
                        <p className="text-[10px] text-gray-500 italic bg-white/5 p-2 rounded-xl" dir="ltr">{s.originalText}</p>
                     </div>
                     <div>
                        <label className="text-[8px] font-mono text-theme-primary/60 uppercase mb-1 block">Translated</label>
                        <textarea className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-xs font-bold text-white focus:border-theme-primary outline-none transition-all resize-none shadow-inner leading-relaxed" rows={2} value={s.translatedText} onChange={(e) => updateSubtitle(s.id, { translatedText: e.target.value })} />
                     </div>
                     <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = parseFloat(s.startTime); }} className="absolute -left-2 top-1/2 -translate-y-1/2 size-8 bg-theme-primary text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-theme">
                        <span className="material-symbols-outlined !text-sm">play_arrow</span>
                     </button>
                  </div>
                );
              })}
           </div>

           <div className="p-6 border-t border-white/5 bg-black/40 flex flex-col gap-3">
              <button disabled={!isDone} onClick={downloadSubtitleFile} className="w-full py-4 bg-theme-primary text-black rounded-2xl font-display font-black text-xs shadow-theme hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3">
                 <span className="material-symbols-outlined">movie_creation</span>
                 إنتاج الفيديو المترجم
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
};