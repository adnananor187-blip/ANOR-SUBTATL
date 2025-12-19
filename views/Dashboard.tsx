
import React, { useState } from 'react';
import { View, ThemeType, BackgroundType } from '../App';

interface DashboardProps {
  onFileSelect: (file: File) => void;
  onNavigate: (view: View) => void;
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  currentBg: BackgroundType;
  setBg: (bg: BackgroundType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onFileSelect, onNavigate, currentTheme, setTheme, currentBg, setBg 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const SUPPORTED_VIDEO_INPUT = "video/mp4,video/x-matroska,video/x-msvideo,video/quicktime,video/x-ms-wmv,video/x-flv,video/mpeg,video/3gpp,video/webm,video/ogg";

  const handleInputFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className="h-full flex flex-col items-center justify-center p-8 relative overflow-y-auto custom-scrollbar"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-theme-primary/10 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-theme-primary pointer-events-none">
          <span className="material-symbols-outlined !text-[120px] text-theme-primary mb-6 animate-bounce">movie_filter</span>
          <h2 className="text-4xl font-display font-black text-white uppercase tracking-tighter">أفلت الفيديو هنا</h2>
          <p className="text-theme-primary font-mono text-sm uppercase mt-4 tracking-[0.3em]">Matrix Data Stream Detected</p>
        </div>
      )}

      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-7xl md:text-8xl font-display font-black text-theme-primary matrix-glow tracking-tighter mb-4">
          ANWAR MATRIX
        </h1>
        <p className="text-gray-400 font-medium tracking-[0.2em] uppercase text-sm">Next-Gen Cinema Translation Engine</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        <MenuCard 
          icon="movie_edit" 
          title="استوديو الترجمة" 
          desc="معالجة فيديو واحد مع تحكم كامل" 
          onClick={() => {}} 
          primary
        >
          <label className="mt-4 px-8 py-3 bg-theme-primary text-black font-display font-black text-sm rounded-xl cursor-pointer hover:scale-105 transition-all shadow-theme inline-block">
            جلب فيديو من الكمبيوتر
            <input 
              type="file" 
              className="hidden" 
              accept={SUPPORTED_VIDEO_INPUT} 
              onChange={handleInputFile} 
            />
          </label>
        </MenuCard>

        <MenuCard 
          icon="layers" 
          title="المعالج الدفعي" 
          desc="ترجمة عدة فيديوهات تلقائياً" 
          onClick={() => onNavigate(View.BATCH)}
        />

        <MenuCard 
          icon="widgets" 
          title="أدوات الفيديو" 
          desc=" SRT استخراج الصوت، تحويل" 
          onClick={() => onNavigate(View.TOOLS)}
        />

        <div className="bg-surface-dark/40 border border-white/5 rounded-[2rem] p-8 flex flex-col gap-4">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">تخصيص الواجهة</h3>
          <div className="flex flex-wrap gap-2">
            {(['matrix', 'cyberpunk', 'cinema', 'stealth'] as ThemeType[]).map(t => (
              <button 
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${currentTheme === t ? 'bg-theme-primary text-black shadow-theme' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(['matrix', 'nebula', 'cyber', 'grid', 'void'] as BackgroundType[]).map(b => (
              <button 
                key={b}
                onClick={() => setBg(b)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${currentBg === b ? 'bg-theme-primary text-black shadow-theme' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuCard: React.FC<{ 
  icon: string, 
  title: string, 
  desc: string, 
  onClick: () => void, 
  primary?: boolean,
  children?: React.ReactNode
}> = ({ icon, title, desc, onClick, primary, children }) => (
  <div 
    onClick={onClick}
    className={`group p-8 rounded-[2rem] border transition-all cursor-pointer ${primary ? 'bg-theme-primary/5 border-theme-primary/20 hover:border-theme-primary/40' : 'bg-surface-dark/40 border-white/5 hover:border-white/20'}`}
  >
    <div className={`size-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${primary ? 'bg-theme-primary text-black shadow-theme' : 'bg-white/5 text-theme-primary group-hover:bg-theme-primary group-hover:text-black'}`}>
      <span className="material-symbols-outlined !text-3xl">{icon}</span>
    </div>
    <h3 className="text-xl font-display font-black text-white mb-2">{title}</h3>
    <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
    {children}
  </div>
);
