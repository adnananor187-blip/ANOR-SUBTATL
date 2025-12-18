
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email.split('@')[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md bg-surface-dark/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl shadow-primary/10">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-black text-primary matrix-glow tracking-tighter mb-2">
            ANWAR MATRIX
          </h1>
          <p className="text-gray-400 font-medium">مرحباً بك في نظام الترجمة الذكي</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300">البريد الإلكتروني</label>
            <input 
              type="text" 
              className="w-full bg-background-dark/50 border border-border-dark rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-gray-300">كلمة المرور</label>
              <button type="button" className="text-xs text-primary hover:underline">نسيت كلمة المرور؟</button>
            </div>
            <input 
              type="password" 
              className="w-full bg-background-dark/50 border border-border-dark rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-primary text-black font-display font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-[#33ff66] transition-all transform active:scale-95"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2">
          <p className="text-sm text-gray-500">ليس لديك حساب؟</p>
          <button className="text-sm font-bold text-primary hover:underline">سجل حساب جديد</button>
        </div>
      </div>
      
      <div className="mt-8 text-[10px] font-mono text-primary/30 uppercase tracking-[0.2em]">
        System Version 2.4.1 Active
      </div>
    </div>
  );
};
