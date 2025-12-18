
import React, { useState } from 'react';
import { Dashboard } from './views/Dashboard';
import { Studio } from './views/Studio';
import { BatchProcessor } from './views/BatchProcessor';
import { VideoTools } from './views/VideoTools';
import { LiveConversation } from './views/LiveConversation';
import { VideoAnalyzer } from './views/VideoAnalyzer';
import { MatrixBackground } from './components/MatrixBackground';

export enum View {
  DASHBOARD = 'DASHBOARD',
  STUDIO = 'STUDIO',
  BATCH = 'BATCH',
  TOOLS = 'TOOLS',
  LIVE = 'LIVE',
  ANALYZER = 'ANALYZER'
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
    <div className={`theme-${theme} min-h-screen bg-background-dark text-white selection:bg-theme-primary/30 font-sans overflow-hidden transition-colors duration-1000`}>
      <MatrixBackground type={bg} theme={theme} />
      
      <div className="relative z-10 h-screen overflow-auto">
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

        {currentView === View.LIVE && (
          <LiveConversation 
            onBack={() => setCurrentView(View.DASHBOARD)}
          />
        )}

        {currentView === View.ANALYZER && (
          <VideoAnalyzer 
            onBack={() => setCurrentView(View.DASHBOARD)}
          />
        )}
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
      `}</style>
    </div>
  );
};

export default App;
