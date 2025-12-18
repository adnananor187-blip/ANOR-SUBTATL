
import React, { useEffect, useRef } from 'react';
import { BackgroundType, ThemeType } from '../App';

export const MatrixBackground: React.FC<{ type: BackgroundType; theme: ThemeType }> = ({ type, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const fontSize = 16;
    const columns = width / fontSize;
    const drops: number[] = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    const getColors = () => {
      const themePrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#00FF41';
      
      switch (type) {
        case 'matrix': return { char: themePrimary, bg: 'rgba(3, 3, 3, 0.05)', chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*()あいうえお", speed: 33 };
        case 'nebula': return { char: theme === 'cyberpunk' ? '#FF00FF' : themePrimary, bg: 'rgba(5, 0, 15, 0.05)', chars: "·°*◌○●", speed: 50 };
        case 'cyber': return { char: '#00FFFF', bg: 'rgba(10, 0, 10, 0.05)', chars: "01", speed: 20 };
        case 'void': return { char: '#333333', bg: 'rgba(0, 0, 0, 0.1)', chars: "·", speed: 100 };
        case 'grid': return { char: themePrimary, bg: 'rgba(0, 0, 0, 0.1)', chars: "+-", speed: 60 };
        default: return { char: themePrimary, bg: 'rgba(3, 3, 3, 0.05)', chars: "01", speed: 33 };
      }
    };

    const draw = () => {
      const config = getColors();
      ctx.fillStyle = config.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = config.char;
      ctx.font = `${fontSize}px Orbitron`;

      for (let i = 0; i < drops.length; i++) {
        const text = config.chars.charAt(Math.floor(Math.random() * config.chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const config = getColors();
    const interval = setInterval(draw, config.speed);
    
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [type, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-30 pointer-events-none transition-opacity duration-1000"
    />
  );
};
