
import React, { useState } from 'react';
import { View, ThemeType, BackgroundType } from '../App';

interface DashboardProps {
  onFileSelect: (file: File) => void;
  onNavigate: (view: View) => void;
  currentTheme: ThemeType;
  setTheme: (t: ThemeType) => void;
  currentBg: BackgroundType;
  setBg: (bg: BackgroundType) => void;
}

const SUPPORTED_FORMATS = "MP4, MKV, AVI, MOV, WMV, FLV, MPG, 3GP, WEBM";

export const Dashboard: React.FC<DashboardProps> = ({ 
  onFileSelect, onNavigate, currentTheme, setTheme, currentBg, setBg 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const requestFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    requestFullScreen();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    requestFullScreen();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col items-center animate-fade-in" onClick={requestFullScreen}>
      {/* Ultra Compact HUD Bar */}
      <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-3 mb-6 bg-black/40 p-3 rounded-2xl backdrop-blur-2xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-theme-primary/20 flex items-center justify-center text-theme-primary shadow-theme">
            <span className="material-symbols-outlined !text-xl">hive</span>
          </div>
          <div>
            <h2 className="font-display font-black text-lg tracking-tighter text-theme-primary uppercase">ANWAR MATRIX v6.5</h2>
            <p className="text-[7px] opacity-60 font-mono tracking-[0.3em] uppercase">Mastermind Neural Engine</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
            <span className="text-[7px] font-black text-gray-500 px-1 uppercase">Theme</span>
            {(['matrix', 'cyberpunk', 'cinema', 'stealth'] as ThemeType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${currentTheme === t ? 'bg-theme-primary text-black' : 'text-gray-500 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
            <span className="text-[7px] font-black text-gray-500 px-1 uppercase">Visuals</span>
            {(['matrix', 'nebula', 'cyber', 'grid', 'void'] as BackgroundType[]).map((bg) => (
              <button
                key={bg}
                onClick={() => setBg(bg)}
                className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${currentBg === bg ? 'bg-theme-primary text-black' : 'text-gray-500 hover:text-white'}`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="font-display text-[4rem] md:text-[6.5rem] font-black text-theme-primary matrix-glow tracking-tighter leading-none mb-2 uppercase">
          MATRIX
        </h1>
        <div className="flex items-center justify-center gap-3 mb-8">
           <div className="h-px w-12 bg-gradient-to-r from-transparent to-theme-primary opacity-20"></div>
           <p className="text-sm md:text-base text-white font-bold tracking-[0.05em]">الترجمة والدبلجة السينمائية الفورية</p>
           <div className="h-px w-12 bg-gradient-to-l from-transparent to-theme-primary opacity-20"></div>
        </div>

        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative group h-56 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${isDragging ? 'border-theme-primary bg-theme-primary/10 scale-102' : 'border-white/10 bg-surface-dark/20 hover:border-theme-primary/20'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-theme-primary/5 via-transparent to-theme-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="p-4 rounded-xl bg-theme-primary/10 mb-4 group-hover:scale-110 transition-transform">
             <span className="material-symbols-outlined !text-4xl text-theme-primary">movie_edit</span>
          </div>
          <h2 className="font-display text-lg font-black mb-1 uppercase tracking-tight text-white">إسحب الفيديو هنا للبدء التلقائي</h2>
          <p className="text-gray-500 text-[10px] mb-6 font-medium">ندعم كافة الصيغ: <span className="text-theme-primary/60 font-mono text-[9px]">{SUPPORTED_FORMATS}</span></p>
          
          <label className="px-8 py-3 bg-theme-primary text-black font-display font-black text-sm rounded-xl cursor-pointer hover:scale-105 transition-all shadow-theme">
            جلب فيديو من الكمبيوتر
            <input type="file" className="hidden" accept="video/*" onChange={handleInputFile} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full max-w-6xl">
        <DashboardCard icon="layers" title="الجماعية" onClick={() => onNavigate(View.BATCH)} />
        <DashboardCard icon="spatial_audio_off" title="محادثة حية" onClick={() => onNavigate(View.LIVE)} />
        <DashboardCard icon="analytics" title="محلل فيديو" onClick={() => onNavigate(View.ANALYZER)} />
        <DashboardCard icon="video_settings" title="أدوات" onClick={() => onNavigate(View.TOOLS)} />
        <DashboardCard icon="mic_external_on" title="استوديو" onClick={() => onNavigate(View.STUDIO)} />
        <DashboardCard icon="shield_locked" title="الأرشيف" onClick={() => {}} />
      </div>

      <div className="mt-auto py-6 flex flex-wrap justify-center gap-6 text-[8px] font-mono text-theme-primary/30 uppercase tracking-[0.4em]">
        <div className="flex items-center gap-2">
          <span className="size-1 bg-theme-primary rounded-full animate-ping"></span>
          AI_PIPELINE: ACTIVE
        </div>
        <span>ZERO_INTERVENTION: ENABLED</span>
        <span className="flex items-center gap-1.5">
           <span className="material-symbols-outlined !text-[10px]">memory</span>
           GEMINI_ULTRA_V3
        </span>
      </div>
    </div>
  );
};

const DashboardCard: React.FC<{ icon: string, title: string, onClick: () => void }> = ({ icon, title, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative overflow-hidden bg-surface-dark/30 backdrop-blur-xl border border-white/5 hover:border-theme-primary/40 rounded-xl p-4 transition-all transform hover:-translate-y-1"
  >
    <div className="flex flex-col items-center text-center gap-3">
      <div className="size-10 rounded-lg bg-theme-primary/10 text-theme-primary flex items-center justify-center group-hover:bg-theme-primary group-hover:text-black transition-all">
        <span className="material-symbols-outlined !text-xl">{icon}</span>
      </div>
      <h3 className="font-display font-black text-[9px] tracking-tight text-white uppercase">{title}</h3>
    </div>
  </button>
);
