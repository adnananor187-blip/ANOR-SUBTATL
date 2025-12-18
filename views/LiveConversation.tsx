
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const LiveConversation: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('جاهز للاتصال');
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputAudioContext;
      outputAudioContextRef.current = outputAudioContext;

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      let currentInputTranscription = '';
      let currentOutputTranscription = '';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('متصل');
            setIsActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscription;
              const modelText = currentOutputTranscription;
              if (userText || modelText) {
                setTranscriptionHistory(prev => [...prev, `أنت: ${userText}`, `Matrix: ${modelText}`].filter(Boolean));
              }
              currentInputTranscription = '';
              currentOutputTranscription = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            setStatus('خطأ في الاتصال');
          },
          onclose: () => {
            setIsActive(false);
            setStatus('تم قطع الاتصال');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'أنت مساعد ذكي في نظام Anwar-Matrix. تحدث باللغة العربية بأسلوب احترافي وسينمائي.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('فشل بدء الجلسة');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setIsActive(false);
    setStatus('تم الفصل');
  };

  return (
    <div className="h-screen flex flex-col bg-background-dark animate-fade-in p-8 overflow-hidden">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="size-14 rounded-2xl bg-white/5 border border-white/10 text-theme-primary flex items-center justify-center hover:scale-110 transition-all">
            <span className="material-symbols-outlined !text-3xl">arrow_forward</span>
          </button>
          <div>
            <h1 className="font-display text-4xl font-black text-theme-primary tracking-tighter uppercase">MATRIX LIVE CORE</h1>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">Real-time Neural Audio Nexus</p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-6 py-2 bg-black/40 rounded-full border border-white/5">
          <span className={`size-3 rounded-full ${isActive ? 'bg-theme-primary animate-ping shadow-theme' : 'bg-gray-600'}`}></span>
          <span className="text-xs font-black uppercase text-theme-primary">{status}</span>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Interaction Hub */}
        <div className="flex-1 flex flex-col items-center justify-center bg-surface-dark/40 border border-white/5 rounded-[4rem] relative overflow-hidden p-12 shadow-2xl">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
           
           <div className={`size-64 rounded-full flex items-center justify-center transition-all duration-700 relative ${isActive ? 'bg-theme-primary/20 scale-110' : 'bg-white/5'}`}>
              <div className={`absolute inset-0 rounded-full border-4 border-dashed border-theme-primary/30 ${isActive ? 'animate-spin-slow' : ''}`}></div>
              <span className={`material-symbols-outlined !text-[8rem] ${isActive ? 'text-theme-primary animate-pulse' : 'text-gray-700'}`}>
                {isActive ? 'graphic_eq' : 'mic_off'}
              </span>
           </div>

           <h2 className="font-display text-3xl font-black mt-12 mb-4 text-white uppercase tracking-widest">
              {isActive ? 'Listening...' : 'System Idle'}
           </h2>
           <p className="text-gray-500 text-center max-w-md font-medium">
             تحدث مع Matrix Live للاستفسار عن الأفلام، الترجمة، أو إدارة النظام بالكامل عبر الصوت.
           </p>

           <button 
             onClick={isActive ? stopSession : startSession}
             className={`mt-16 px-16 py-6 rounded-[2.5rem] font-display font-black text-2xl transition-all flex items-center gap-4 ${isActive ? 'bg-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,0.3)]' : 'bg-theme-primary text-black shadow-theme hover:scale-105'}`}
           >
             <span className="material-symbols-outlined !text-4xl">{isActive ? 'stop' : 'keyboard_voice'}</span>
             {isActive ? 'إيقاف الاتصال' : 'بدء المحادثة الحية'}
           </button>
        </div>

        {/* Transcription Monitor */}
        <aside className="w-96 flex flex-col bg-black/60 border border-white/5 rounded-[3rem] p-8">
           <h3 className="text-xs font-black font-display uppercase text-theme-primary tracking-[0.4em] mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">history_edu</span>
              Live Transcript
           </h3>
           <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
              {transcriptionHistory.map((line, idx) => (
                <div key={idx} className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${line.startsWith('Matrix') ? 'bg-theme-primary/10 text-theme-primary border-l-2 border-theme-primary' : 'bg-white/5 text-gray-300'}`}>
                   {line}
                </div>
              ))}
              {transcriptionHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                   <span className="material-symbols-outlined !text-6xl mb-4">analytics</span>
                   <p className="text-xs font-black uppercase tracking-widest">No Interaction Log</p>
                </div>
              )}
           </div>
        </aside>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};
