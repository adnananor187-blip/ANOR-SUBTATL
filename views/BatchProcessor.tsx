
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ThemeType } from '../App';

interface BatchTask {
  id: string;
  name: string;
  size: string;
  type: 'video' | 'subtitle';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  log: string[];
  retries: number;
  showLogs?: boolean;
}

interface BatchProcessorProps {
  onBack: () => void;
  theme: ThemeType;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({ onBack, theme }) => {
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parallelLimit, setParallelLimit] = useState(2);
  const [maxRetries, setMaxRetries] = useState(1);
  const [globalLogs, setGlobalLogs] = useState<string[]>(["[SYSTEM] Batch Processing Module Initialized.", "[SYSTEM] Awaiting file ingestion..."]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setGlobalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const processFileList = useCallback((files: FileList | File[]) => {
    const newTasks: BatchTask[] = Array.from(files).map(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'mpg', '3gp'].includes(extension || '') || file.type.startsWith('video/');
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: sizeStr,
        type: isVideo ? 'video' : 'subtitle',
        status: 'pending',
        progress: 0,
        message: 'Ready in queue',
        log: [`Task created for ${file.name}`],
        retries: 0,
        showLogs: false
      };
    });
    setTasks(prev => [...prev, ...newTasks]);
    addLog(`Ingested ${newTasks.length} new items into the matrix queue.`);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    if (e.dataTransfer.files?.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const runTask = async (taskId: string) => {
    const steps = [
      { p: 10, m: 'Extracting Audio Modality...', l: 'Audio stream decoupled from container.' },
      { p: 30, m: 'AI Transcription Active...', l: 'Converting speech-to-text with Gemini Neural net.' },
      { p: 50, m: 'Semantic Translation...', l: 'Mapping source language to Arabic (Natural Context).' },
      { p: 75, m: 'Neural Voice Synthesis...', l: 'Generating high-fidelity Arabic dubbing.' },
      { p: 90, m: 'Multiplexing Streams...', l: 'Merging translated subtitles and audio into master file.' },
      { p: 100, m: 'Complete', l: 'Final export verified and ready.' }
    ];

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'processing', progress: 0 } : t));

    try {
      for (const step of steps) {
        // Simulate potential failure (10% chance per step)
        if (Math.random() < 0.1) {
          throw new Error(`Critical Buffer Overflow at ${step.m.split('...')[0]}`);
        }

        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { 
            ...t, 
            progress: step.p, 
            message: step.m, 
            log: [...t.log, `[INFO] ${step.l}`] 
          } : t
        ));
      }

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      addLog(`Task ${taskId} finished successfully.`);
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const updatedLog = [...t.log, `[ERROR] ${errorMessage}`];
          return { 
            ...t, 
            status: 'error', 
            message: `FAILED: ${errorMessage}`, 
            log: updatedLog 
          };
        }
        return t;
      }));
      addLog(`[CRITICAL] Task ${taskId} failed: ${errorMessage}`);
    }
  };

  const startBatch = async () => {
    if (tasks.length === 0 || isProcessing) return;
    setIsProcessing(true);
    addLog("Starting parallel batch processing...");

    const pending = tasks.filter(t => t.status === 'pending');
    let index = 0;

    const processNext = async () => {
      if (index >= pending.length) return;
      const task = pending[index++];
      await runTask(task.id);
      await processNext();
    };

    const initialPromises = [];
    for(let i = 0; i < Math.min(parallelLimit, pending.length); i++) {
      initialPromises.push(processNext());
    }

    await Promise.all(initialPromises);
    setIsProcessing(false);
    addLog("Batch sequence finalized.");
  };

  const retryTask = async (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending', progress: 0, message: 'Retrying...', retries: t.retries + 1 } : t));
    addLog(`Manually retrying task ${taskId}...`);
    await runTask(taskId);
  };

  const toggleLogs = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, showLogs: !t.showLogs } : t));
  };

  return (
    <div 
      className={`h-screen flex flex-col bg-background-dark text-gray-100 transition-all duration-500 overflow-hidden ${isDragging ? 'ring-inset ring-8 ring-theme-primary/30' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Cinematic Header */}
      <header className="shrink-0 flex items-center justify-between px-10 py-6 border-b border-white/5 bg-surface-dark/95 backdrop-blur-3xl shadow-2xl relative z-20">
        <div className="flex items-center gap-8">
          <button onClick={onBack} className="size-12 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center hover:scale-110 transition-all border border-theme-primary/20">
            <span className="material-symbols-outlined !text-2xl">arrow_forward</span>
          </button>
          <div>
            <h1 className="font-display text-2xl font-black text-theme-primary tracking-tighter uppercase">Batch Processing Interface</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`size-2 rounded-full ${isProcessing ? 'bg-theme-primary animate-pulse shadow-[0_0_10px_var(--primary-color)]' : 'bg-gray-600'}`}></span>
              <p className="text-[10px] text-theme-primary/60 font-mono uppercase tracking-[0.3em]">AI-Engine: Multi-Parallel v5.5</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Parallel Threads</span>
            <div className="flex gap-2">
              {[1, 2, 4, 8].map(num => (
                <button 
                  key={num}
                  onClick={() => setParallelLimit(num)}
                  disabled={isProcessing}
                  className={`size-8 rounded-lg text-[10px] font-black transition-all ${parallelLimit === num ? 'bg-theme-primary text-black shadow-theme' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Max Auto-Retries</span>
            <select 
              value={maxRetries} 
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              disabled={isProcessing}
              className="bg-white/5 border-none rounded-lg text-[10px] font-black text-white py-1 px-3 outline-none focus:ring-1 focus:ring-theme-primary"
            >
              {[0, 1, 2, 3, 5].map(v => <option key={v} value={v} className="bg-surface-dark">{v}</option>)}
            </select>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Add Files
          </button>

          <button 
            onClick={startBatch}
            disabled={isProcessing || tasks.filter(t => t.status === 'pending').length === 0}
            className="px-8 py-3 bg-theme-primary text-black rounded-2xl text-xs font-black uppercase shadow-theme hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">bolt</span>
            {isProcessing ? 'Processing Matrix...' : 'Start Batch Sequence'}
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && processFileList(e.target.files)} accept="video/*,.srt,.vtt,.ass" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-8 gap-8">
        {/* Task Queue Column */}
        <main className="flex-1 flex flex-col gap-4 overflow-y-auto pr-4 custom-scrollbar">
          {tasks.length === 0 ? (
            <div className="flex-1 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-20 hover:opacity-100 hover:border-theme-primary/20 transition-all group">
              <span className="material-symbols-outlined !text-9xl mb-6 text-theme-primary animate-pulse">cloud_upload</span>
              <p className="font-display text-2xl font-black uppercase tracking-widest">Awaiting Input Stream</p>
              <p className="text-sm mt-2">Drag and drop multiple videos or subtitle files here</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className={`relative overflow-hidden bg-surface-dark/40 border rounded-[2rem] transition-all group ${task.status === 'processing' ? 'border-theme-primary/50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.05)]' : task.status === 'error' ? 'border-red-500/50' : 'border-white/5 hover:border-white/10'}`}>
                
                {/* Visual Progress Bar (Background) */}
                <div 
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out opacity-10 ${task.status === 'error' ? 'bg-red-500' : 'bg-theme-primary'}`}
                  style={{ width: `${task.progress}%` }}
                />

                <div className="relative z-10 p-6 flex items-center gap-6">
                  <div className={`size-16 rounded-2xl flex items-center justify-center transition-colors ${
                    task.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                    task.status === 'error' ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                    'bg-theme-primary/10 text-theme-primary'
                  }`}>
                    <span className="material-symbols-outlined !text-3xl">
                      {task.status === 'error' ? 'warning' : task.type === 'video' ? 'movie' : 'description'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-lg truncate text-white">{task.name}</h3>
                        <span className="text-[10px] font-mono text-gray-500">{task.size}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         {task.retries > 0 && <span className="text-[9px] font-black font-mono text-amber-500/80 uppercase">Retries: {task.retries}</span>}
                         <span className={`text-[9px] font-black font-mono px-3 py-1 rounded-full border uppercase tracking-widest ${
                          task.status === 'completed' ? 'border-green-500/50 text-green-400 bg-green-500/10' : 
                          task.status === 'processing' ? 'border-theme-primary text-theme-primary animate-pulse' : 
                          task.status === 'error' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                          'border-white/10 text-gray-500'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            task.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_#4ade80]' : 
                            task.status === 'error' ? 'bg-red-500' : 
                            'bg-theme-primary shadow-theme'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-black font-mono w-10 text-right ${task.status === 'error' ? 'text-red-400' : 'text-theme-primary'}`}>{task.progress}%</span>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <p className={`text-[10px] font-mono tracking-tight flex items-center gap-2 ${task.status === 'error' ? 'text-red-400/80' : 'text-theme-primary/60'}`}>
                        <span className="material-symbols-outlined !text-[12px]">subdirectory_arrow_right</span>
                        {task.message}
                      </p>
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => toggleLogs(task.id)}
                          className="text-[9px] font-black uppercase text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">history</span>
                          {task.showLogs ? 'Hide Logs' : 'View Logs'}
                        </button>

                        {task.status === 'error' && (
                          <button 
                            onClick={() => retryTask(task.id)}
                            className="text-[9px] font-black uppercase text-theme-primary hover:text-white transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">refresh</span>
                            Retry Task
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {task.status === 'pending' && !isProcessing && (
                      <button 
                        onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                        className="size-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Task-Specific Logs Viewer */}
                {task.showLogs && (
                  <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-black/20 animate-fade-in">
                    <div className="bg-surface-dark/60 rounded-xl p-4 font-mono text-[9px] space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar-mini">
                      {task.log.map((entry, idx) => (
                        <div key={idx} className={`${entry.includes('[ERROR]') ? 'text-red-400' : 'text-gray-500'}`}>
                          {entry}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </main>

        {/* Global Monitor / System Logs Column */}
        <aside className="w-96 flex flex-col gap-4">
          <div className="flex-1 bg-black/60 rounded-[2.5rem] border border-white/5 p-6 flex flex-col shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-black text-xs text-theme-primary uppercase tracking-widest flex items-center gap-2">
                   <span className="material-symbols-outlined text-sm">terminal</span>
                   Global Monitor
                </h3>
                <button onClick={() => setGlobalLogs([])} className="text-[9px] font-black uppercase text-gray-600 hover:text-white transition-colors">Clear</button>
             </div>
             
             <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar pr-2">
                {globalLogs.length === 0 && <p className="text-gray-800 italic">No system events logged...</p>}
                {globalLogs.map((log, idx) => (
                  <div key={idx} className={`p-2 rounded border-l-2 transition-all duration-300 animate-fade-in ${log.includes('[SYSTEM]') ? 'bg-theme-primary/5 border-theme-primary text-theme-primary/80' : log.includes('[CRITICAL]') ? 'bg-red-500/5 border-red-500 text-red-400' : 'border-white/5 text-gray-400'}`}>
                    {log}
                  </div>
                ))}
             </div>
          </div>

          <div className="h-48 bg-theme-primary/5 rounded-[2.5rem] border border-theme-primary/10 p-6 flex flex-col justify-center text-center">
             <h4 className="font-display text-[10px] font-black text-theme-primary uppercase tracking-[0.4em] mb-4">Core Statistics</h4>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[10px] text-gray-600 font-black uppercase">Queue Size</p>
                   <p className="text-2xl font-display font-black text-white">{tasks.length}</p>
                </div>
                <div>
                   <p className="text-[10px] text-gray-600 font-black uppercase">Failed</p>
                   <p className="text-2xl font-display font-black text-red-500">{tasks.filter(t => t.status === 'error').length}</p>
                </div>
             </div>
          </div>
        </aside>
      </div>

      {/* Mini Visualizer Footer */}
      <footer className="px-10 py-4 border-t border-white/5 bg-black/40 flex justify-between items-center text-[9px] font-mono text-gray-600">
        <div className="flex gap-8">
           <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-theme-primary animate-pulse"></span> SYSTEM_ENCRYPTION_AES256</span>
           <span className="flex items-center gap-2 tracking-[0.2em]">MEM_STATE: STABLE</span>
        </div>
        <div className="flex gap-4">
           <span className="text-theme-primary/40 uppercase font-black">Anwar-Matrix Batch Hub v5.5.0</span>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary-rgb, 0, 255, 65), 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary-rgb, 0, 255, 65), 0.5);
        }
        .custom-scrollbar-mini::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar-mini::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-mini::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
};
