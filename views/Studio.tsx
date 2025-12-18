
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Subtitle } from '../types';
import { translateSubtitlesMastermind } from '../services/geminiService';
import { ThemeType } from '../App';

interface StudioProps {
  onBack: () => void;
  videoFile: File | null;
  theme: ThemeType;
}

type PipelineStep = 
  | 'idle' 
  | 'door_1_ingest' 
  | 'door_1_transcribe' 
  | 'door_2_detect' 
  | 'door_2_speaker_id' 
  | 'door_2_localize' 
  | 'dubbing' 
  | 'merging' 
  | 'done';

const STEP_LABELS: Record<PipelineStep, string> = {
  idle: 'في انتظار الملف...',
  door_1_ingest: 'الباب الأول: استخراج الوسائط',
  door_1_transcribe: 'الباب الأول: التفريغ النصي',
  door_2_detect: 'الباب الثاني: كشف اللغة',
  door_2_speaker_id: 'الباب الثاني: فصل الحوارات',
  door_2_localize: 'الباب الثاني: الترجمة الذكية',
  dubbing: 'توليد الدبلجة العصبية',
  merging: 'دمج الماستر النهائي',
  done: 'اكتملت المعالجة بنجاح'
};

const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.5, 2];

export const Studio: React.FC<StudioProps> = ({ onBack, videoFile, theme }) => {
  const [step, setStep] = useState<PipelineStep>('idle');
  const [progress, setProgress] = useState(0);
  const [subtitles, setSubtitles] = useState<(Subtitle & { emotion?: string; speaker?: string })[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const videoUrl = useMemo(() => {
    if (videoFile) return URL.createObjectURL(videoFile);
    return '';
  }, [videoFile]);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [`[SYSTEM]: ${msg}`, ...prev].slice(0, 3));
  };

  useEffect(() => {
    if (videoFile) {
      runMastermindPipeline();
    }
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoFile]);

  const runMastermindPipeline = async () => {
    addLog(`Media Input: ${videoFile?.name}`);
    setStep('door_1_ingest');
    setProgress(10);
    await delay(1000);

    setStep('door_1_transcribe');
    setProgress(30);
    await delay(1200);

    setStep('door_2_detect');
    setProgress(50);
    await delay(800);

    setStep('door_2_speaker_id');
    setProgress(65);
    await delay(1000);

    setStep('door_2_localize');
    setProgress(80);
    
    const mockSubs: Subtitle[] = [
      { id: '1', startTime: '0', endTime: '5', originalText: 'System initializing. Matrix protocols engaged.', translatedText: 'تم تفعيل النظام. بروتوكولات الماتريكس تعمل الآن.' },
      { id: '2', startTime: '6', endTime: '12', originalText: 'We are processing the neural dubbing layer now.', translatedText: 'نقوم بمعالجة طبقة الدبلجة العصبية حالياً.' },
      { id: '3', startTime: '15', endTime: '22', originalText: 'Forensic frame seeking and variable speed active.', translatedText: 'خاصية التنقل الإطاري والسرعة المتغيرة نشطة الآن.' }
    ];
    
    try {
      setSubtitles(mockSubs.map(s => ({ ...s, speaker: 'Mastermind', emotion: 'واثق' })));
    } catch (e) {
      setSubtitles(mockSubs.map(s => ({ ...s, translatedText: s.originalText, emotion: 'محايد', speaker: 'System' })));
    }
    await delay(1000);

    setStep('dubbing');
    setProgress(90);
    await delay(1200);

    setStep('merging');
    setProgress(98);
    await delay(800);

    setProgress(100);
    setStep('done');
    setIsDone(true);
    addLog("Matrix Finalized.");
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const stepFrame = (frames: number) => {
    if (videoRef.current) {
      const fps = 24; // Assuming standard 24fps cinema
      videoRef.current.currentTime += frames / fps;
      if (isPlaying) videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const currentSubtitle = useMemo(() => {
    return subtitles.find(s => {
      const start = parseFloat(s.startTime);
      const end = parseFloat(s.endTime);
      return currentTime >= start && currentTime <= end;
    });
  }, [subtitles, currentTime]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-background-dark animate-fade-in overflow-hidden select-none">
      <header className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/5 bg-surface-dark/95 backdrop-blur-2xl relative z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="size-8 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center hover:bg-theme-primary hover:text-black transition-all border border-theme-primary/20">
            <span className="material-symbols-outlined !text-lg">arrow_forward</span>
          </button>
          <div>
            <h2 className="text-sm font-black font-display tracking-tight text-white uppercase">{videoFile?.name || 'PROJECT'}</h2>
            <div className="flex items-center gap-2">
              <span className={`size-1 rounded-full ${isDone ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-theme-primary animate-pulse shadow-[0_0_8px_var(--primary-color)]'}`}></span>
              <span className="text-[7px] text-theme-primary font-black uppercase tracking-widest">
                {STEP_LABELS[step]}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
           {isDone ? (
             <button className="px-4 py-1 bg-theme-primary text-black rounded-lg text-[8px] font-black uppercase shadow-theme transition-all flex items-center gap-1.5">
               <span className="material-symbols-outlined text-[10px]">movie_creation</span>
               تصدير النسخة النهائية
             </button>
           ) : (
             <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[7px] font-black font-mono text-theme-primary/80 uppercase">{progress}%</span>
                <div className="w-16 h-0.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-theme-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
             </div>
           )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-dots-pattern relative overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/5 group ring-1 ring-white/5">
              
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onClick={togglePlay}
              />

              {currentSubtitle && (
                <div className="absolute inset-x-0 bottom-16 text-center px-8 pointer-events-none transition-all duration-300">
                  <div className="inline-block bg-black/85 backdrop-blur-3xl text-white px-5 py-2 rounded-xl text-lg font-bold shadow-2xl border border-white/10 border-b-theme-primary border-b-2">
                     {currentSubtitle.translatedText}
                  </div>
                </div>
              )}

              {!isDone && progress < 100 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                   <div className="size-16 rounded-full border-2 border-theme-primary/10 border-t-theme-primary animate-spin mb-3"></div>
                   <h2 className="font-display text-sm font-black text-theme-primary uppercase mb-1">{STEP_LABELS[step]}</h2>
                   <div className="flex flex-col items-center">
                      {systemLogs.map((log, i) => (
                        <p key={i} className={`text-[6px] font-mono uppercase tracking-widest ${i === 0 ? 'text-theme-primary' : 'text-gray-600'}`}>
                           {log}
                        </p>
                      ))}
                   </div>
                </div>
              )}

              {/* Advanced UI Overlay Controls */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-1 group-hover:translate-y-0">
                {/* Timeline with Subtitle Blocks */}
                <div className="relative h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden" 
                    onClick={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const percentage = (e.clientX - rect.left) / rect.width;
                       if(videoRef.current) videoRef.current.currentTime = percentage * duration;
                    }}>
                  <div className="absolute inset-0 flex">
                     {subtitles.map(s => (
                        <div 
                          key={s.id}
                          className="absolute h-full bg-theme-primary/20 border-x border-white/5"
                          style={{ 
                            left: `${(parseFloat(s.startTime) / duration) * 100}%`,
                            width: `${((parseFloat(s.endTime) - parseFloat(s.startTime)) / duration) * 100}%`
                          }}
                        />
                     ))}
                  </div>
                  <div className="h-full bg-theme-primary shadow-[0_0_8px_var(--primary-color)] relative z-10" style={{ width: `${(currentTime / duration) * 100 || 0}%` }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={togglePlay} className="text-white hover:text-theme-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                    </button>
                    
                    <div className="flex items-center gap-1 border-x border-white/10 px-4">
                      <button onClick={() => stepFrame(-1)} className="text-white/60 hover:text-white transition-colors" title="Previous Frame">
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                      </button>
                      <span className="text-[7px] font-mono text-white/40 uppercase">Frame</span>
                      <button onClick={() => stepFrame(1)} className="text-white/60 hover:text-white transition-colors" title="Next Frame">
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>

                    <span className="text-white text-[9px] font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button 
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="text-[8px] font-black uppercase text-white/60 hover:text-theme-primary transition-colors border border-white/10 rounded px-2 py-0.5"
                      >
                        {playbackSpeed}x
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute bottom-full mb-2 right-0 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg p-1 min-w-[60px] flex flex-col gap-1 shadow-2xl animate-fade-in">
                          {PLAYBACK_SPEEDS.map(s => (
                            <button 
                              key={s} 
                              onClick={() => changeSpeed(s)}
                              className={`text-[8px] font-black uppercase p-1.5 rounded hover:bg-theme-primary hover:text-black transition-all ${playbackSpeed === s ? 'text-theme-primary' : 'text-white/60'}`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button className="text-white hover:text-theme-primary" onClick={() => videoRef.current?.requestFullscreen()}>
                      <span className="material-symbols-outlined text-lg">fullscreen</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-10 border-t border-white/5 bg-surface-dark/80 backdrop-blur-xl flex items-center px-4 justify-between">
             <div className="flex gap-6">
                <StatusNode label="Forensic Seek" status="active" />
                <StatusNode label="Door 2 Sync" status={progress >= 80 ? 'active' : 'pending'} />
                <StatusNode label="Neural" status={progress >= 98 ? 'active' : 'pending'} />
             </div>
             <div className="text-[7px] font-mono text-theme-primary/30 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <span className="size-1 bg-theme-primary rounded-full animate-ping"></span>
                MASTERMIND_FORENSICS_V6.5
             </div>
          </div>
        </div>

        <aside className="w-[320px] border-r border-white/5 bg-surface-dark/80 backdrop-blur-3xl flex flex-col relative z-20">
           <div className="p-4 border-b border-white/5 bg-theme-primary/5">
              <h3 className="font-display font-black text-sm flex items-center gap-2 tracking-tight">
                <span className="material-symbols-outlined text-theme-primary !text-lg">edit_note</span>
                مراجعة النصوص
              </h3>
              <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">تحرير الترجمة الذكي</p>
           </div>

           <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {subtitles.map(s => {
                const isActive = currentTime >= parseFloat(s.startTime) && currentTime <= parseFloat(s.endTime);
                return (
                  <div key={s.id} 
                    className={`p-3 rounded-lg transition-all duration-300 group relative border cursor-pointer ${isActive ? 'bg-theme-primary/5 border-theme-primary/30 ring-1 ring-theme-primary/20' : 'bg-black/30 border-white/5 hover:border-white/10'}`}
                    onClick={() => { if(videoRef.current) videoRef.current.currentTime = parseFloat(s.startTime); }}
                  >
                     <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-[6px] font-black font-mono px-1.5 py-0.5 rounded transition-colors ${isActive ? 'bg-theme-primary text-black' : 'bg-theme-primary/10 text-theme-primary'}`}>
                          {formatTime(parseFloat(s.startTime))}
                        </span>
                        <div className="flex gap-1.5">
                          <span className="text-[6px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
                            {s.emotion || 'محايد'}
                          </span>
                        </div>
                     </div>
                     <p className="text-[8px] text-gray-600 mb-1 leading-tight italic" dir="ltr">{s.originalText}</p>
                     <textarea 
                        className="w-full bg-surface-dark/90 border border-white/5 rounded p-1.5 text-[10px] font-bold text-white focus:border-theme-primary outline-none transition-all resize-none"
                        rows={2}
                        value={s.translatedText}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubtitles(prev => prev.map(item => item.id === s.id ? {...item, translatedText: val} : item));
                        }}
                      />
                  </div>
                );
              })}
           </div>

           <div className="p-4 border-t border-white/5 bg-black/60">
              <button className={`w-full py-2.5 rounded-lg font-display font-black text-sm transition-all flex items-center justify-center gap-2 ${isDone ? 'bg-theme-primary text-black shadow-theme hover:scale-102 active:scale-98' : 'bg-white/5 text-white/20'}`} disabled={!isDone}>
                 <span className="material-symbols-outlined !text-lg">check_circle</span>
                 اعتماد الماستر النهائي
              </button>
           </div>
        </aside>
      </div>

      <style>{`
        .bg-dots-pattern {
          background-image: radial-gradient(rgba(255, 255, 255, 0.02) 0.5px, transparent 0.5px);
          background-size: 20px 20px;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 5px; }
      `}</style>
    </div>
  );
};

const StatusNode: React.FC<{ label: string, status: 'active' | 'pending' | 'done' }> = ({ label, status }) => (
  <div className={`flex items-center gap-1.5 transition-all duration-300 ${status === 'active' ? 'opacity-100' : 'opacity-20'}`}>
    <span className={`size-1 rounded-full ${status === 'active' ? 'bg-theme-primary shadow-theme' : 'bg-gray-700'}`}></span>
    <span className="text-[7px] font-black font-display uppercase tracking-widest">{label}</span>
  </div>
);
