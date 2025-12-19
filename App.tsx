
import React, { useState } from 'react';
import { Dashboard } from './views/Dashboard';
import { Studio } from './views/Studio';
import { BatchProcessor } from './views/BatchProcessor';
import { VideoTools } from './views/VideoTools';
import { MatrixBackground } from './components/MatrixBackground';

export enum View {
  DASHBOARD = 'DASHBOARD',
  STUDIO = 'STUDIO',
  BATCH = 'BATCH',
  TOOLS = 'TOOLS'
}

export type ThemeType = 'matrix' | 'cyberpunk' | 'cinema' | 'stealth';
export type BackgroundType = 'matrix' | 'nebula' | 'cyber' | 'grid' | 'void';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [theme, setTheme] = useState<ThemeType>('matrix');
  const [bg, setBg] = useState<BackgroundType>('matrix');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCurrentView(View.STUDIO);
  };

  return (
    <div className={`theme-${theme} h-screen bg-background-dark text-white selection:bg-theme-primary/30 font-sans overflow-hidden transition-colors duration-1000 flex items-center justify-center p-4 md:p-6`}>
      <MatrixBackground type={bg} theme={theme} />
      
      <div className="relative z-10 w-full max-w-6xl h-full max-h-[900px] bg-surface-dark/90 border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(var(--primary-rgb),0.1)] overflow-hidden flex flex-col backdrop-blur-md">
        <div className="flex-1 overflow-auto custom-scrollbar">
          {currentView === View.DASHBOARD && (
            <Dashboard 
              onFileSelect={handleFileSelect}
              onNavigate={setCurrentView}
              currentTheme={theme}
              setTheme={setTheme}
              currentBg={bg}
              setBg={setBg}
            />
          )}

          {currentView === View.STUDIO && (
            <Studio 
              videoFile={selectedFile}
              onBack={() => setCurrentView(View.DASHBOARD)}
              theme={theme}
            />
          )}

          {currentView === View.BATCH && (
            <BatchProcessor 
              theme={theme}
              onBack={() => setCurrentView(View.DASHBOARD)}
            />
          )}

          {currentView === View.TOOLS && (
            <VideoTools 
              onBack={() => setCurrentView(View.DASHBOARD)}
            />
          )}
        </div>
      </div>

      <style>{`
        :root {
          --primary-color: ${theme === 'cyberpunk' ? '#FF00FF' : theme === 'cinema' ? '#E50914' : theme === 'stealth' ? '#FFFFFF' : '#00FF41'};
          --primary-rgb: ${theme === 'cyberpunk' ? '255, 0, 255' : theme === 'cinema' ? '229, 9, 20' : theme === 'stealth' ? '255, 255, 255' : '0, 255, 65'};
          --bg-color: #030303;
        }
        .text-theme-primary { color: var(--primary-color); }
        .bg-theme-primary { background-color: var(--primary-color); }
        .border-theme-primary { border-color: var(--primary-color); }
        .shadow-theme { box-shadow: 0 0 30px rgba(var(--primary-rgb), 0.3); }
        .matrix-glow { text-shadow: 0 0 20px rgba(var(--primary-rgb), 0.6); }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
