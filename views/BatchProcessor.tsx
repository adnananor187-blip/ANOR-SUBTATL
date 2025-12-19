
import React, { useState, useCallback, useRef } from 'react';
import { ThemeType } from '../App';

interface BatchTask {
  id: string;
  name: string;
  size: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  log: string[];
  step: 'idle' | 'extract' | 'stt' | 'translate' | 'dub';
}

interface BatchProcessorProps {
  onBack: () => void;
  theme: ThemeType;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({ onBack, theme }) => {
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [globalLogs, setGlobalLogs] = useState<string[]>(["[SYSTEM] Matrix Batch Engine v6.5 Ready.", "[SYSTEM] Awaiting media ingestion..."]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addGlobalLog = (msg: string) => {
    setGlobalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const processFileList = useCallback((files: FileList | File[]) => {
    const newTasks: BatchTask[] = Array.from(files).map(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: sizeStr,
        type: extension.toUpperCase(),
        status: 'pending',
        progress: 0,
        message: 'في انتظار المعالجة...',
        log: [`تم جلب الملف: ${file.name}`, `نوع الملف: ${file.type || extension}`],
        step: 'idle'
      };
    });
    setTasks(prev => [...prev, ...newTasks]);
    addGlobalLog(`تم جلب ${newTasks.length} ملفات جديدة لنظام الماتريكس.`);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const runFullPipeline = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'processing') return;

    const updateTask = (updates: Partial<BatchTask>) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    };

    updateTask({ status: 'processing', progress: 10 });

    // المرحلة أ: تفريغ الصوت
    updateTask({ step: 'extract', message: 'الباب الأول: استخراج الموجات الصوتية...', progress: 25 });
    await delay(1500);
    
    // المرحلة ب: تحويل الصوت لنص
    updateTask({ step: 'stt', message: 'جاري التعرف على الكلام وتحويله لنص...', progress: 50 });
    await delay(2000);

    // المرحلة ج: الترجمة للعربية
    updateTask({ step: 'translate', message: 'الباب الثاني: جاري الترجمة السينمائية...', progress: 75 });
    await delay(2000);

    // المرحلة د: الدبلجة
    updateTask({ step: 'dub', message: 'جاري معالجة الدبلجة الصوتية AI...', progress: 95 });
    await delay(1500);

    updateTask({ status: 'completed', progress: 100, message: '✅ اكتملت المعالجة بنجاح!', step: 'idle' });
    addGlobalLog(`تم الانتهاء من معالجة: ${task.name}`);
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  return (
    <div 
      className="h-full flex flex-col bg-background-dark text-gray-100 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <div className={`absolute inset-0 z-50 bg-theme-primary/10 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-theme-primary transition-all duration-300 pointer-events-none ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
        <span className="material-symbols-outlined !text-[100px] text-theme-primary mb-6 animate-bounce">movie_filter</span>
        <h2 className="text-4xl font-display font-black text-white uppercase tracking-tighter">أفلت الفيديوهات هنا</h2>
        <p className="text-theme-primary font-mono text-sm uppercase mt-4 tracking-[0.3em]">Matrix Data Stream Detected</p>
      </div>

      <header className="shrink-0 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-surface-dark/95 backdrop-blur-3xl relative z-20">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="size-12 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center hover:bg-theme-primary hover:text-black transition-all border border-theme-primary/20">
            <span className="material-symbols-outlined !text-2xl">arrow_forward</span>
          </button>
          <div>
            <h1 className="font-display text-2xl font-black text-theme-primary tracking-tighter uppercase">BATCH MATRIX ENGINE</h1>
            <p className="text-[10px] text-theme-primary/60 font-mono uppercase tracking-[0.2em]">Zero Intervention Processing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">file_upload</span>
            جلب فيديوهات
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && processFileList(e.target.files)} accept="video/*,.mkv,.avi,.wmv,.flv,.mov" />
          
          <button 
            onClick={() => tasks.forEach(t => t.status === 'pending' && runFullPipeline(t.id))}
            disabled={tasks.length === 0}
            className="px-8 py-2.5 bg-theme-primary text-black rounded-xl text-[10px] font-black uppercase shadow-theme hover:scale-105 transition-all disabled:opacity-30"
          >
            بدء المعالجة الشاملة
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        <main className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {tasks.length === 0 ? (
            <div className="flex-1 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-20 group hover:opacity-40 transition-all">
              <span className="material-symbols-outlined !text-8xl mb-4 text-theme-primary group-hover:animate-pulse">inbox_customize</span>
              <p className="font-display text-2xl font-black uppercase tracking-[0.3em]">بانتظار جلب البيانات...</p>
              <p className="text-xs mt-2 font-mono">يدعم: MP4, MKV, AVI, WMV, MOV, FLV</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className={`bg-surface-dark/60 border rounded-2xl p-5 transition-all ${task.status === 'processing' ? 'border-theme-primary/40' : 'border-white/5'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">movie</span>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white uppercase">{task.name}</h3>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[9px] font-mono text-gray-500 uppercase">{task.type}</span>
                        <span className="text-[9px] font-mono text-gray-500">{task.size}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                      task.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                      task.status === 'processing' ? 'bg-theme-primary/10 text-theme-primary animate-pulse' : 
                      'bg-white/5 text-gray-500'
                    }`}>
                      {task.status}
                    </span>
                    <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="text-gray-600 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-theme-primary transition-all duration-500" style={{ width: `${task.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-theme-primary font-black">{task.progress}%</span>
                  </div>
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{task.message}</p>
                </div>

                {/* Manual Control Grid */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                   <TaskButton icon="audio_file" label="تفريغ الصوت" active={task.step === 'extract'} onClick={() => {}} />
                   <TaskButton icon="text_fields" label="تحويل لنص" active={task.step === 'stt'} onClick={() => {}} />
                   <TaskButton icon="translate" label="ترجمة عربية" active={task.step === 'translate'} onClick={() => {}} />
                   <TaskButton icon="mic" label="دبلجة فورية" active={task.step === 'dub'} onClick={() => {}} />
                </div>
              </div>
            ))
          )}
        </main>

        <aside className="w-80 flex flex-col gap-4">
          <div className="flex-1 bg-black/40 rounded-[2rem] border border-white/5 p-6 flex flex-col shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-black text-[10px] text-theme-primary uppercase tracking-widest flex items-center gap-2">
                   <span className="material-symbols-outlined text-sm">terminal</span>
                   System Monitor
                </h3>
             </div>
             <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-2 custom-scrollbar pr-2 leading-relaxed">
                {globalLogs.map((log, idx) => (
                  <div key={idx} className={`p-2 rounded border-l-2 ${log.includes('✅') ? 'bg-green-500/5 border-green-500 text-green-400' : 'border-white/5 text-gray-500'}`}>
                    {log}
                  </div>
                ))}
             </div>
          </div>
        </aside>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

const TaskButton: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`py-2 rounded-lg border text-[8px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
      active 
        ? 'bg-theme-primary text-black border-theme-primary shadow-theme' 
        : 'bg-transparent border-white/10 text-gray-500 hover:border-theme-primary/40 hover:text-white'
    }`}
  >
    <span className="material-symbols-outlined !text-xs">{icon}</span>
    {label}
  </button>
);
