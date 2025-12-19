import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subtitle } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * استخراج الصوت من ملف الفيديو وتحويله إلى WAV (16-bit PCM, Mono, 16kHz)
 * بناءً على الحل المطلوب لتحسين التوافق.
 */
export const extractAudioFromVideo = async (videoFile: File): Promise<Blob> => {
  try {
    // إنشاء AudioContext بمعدل عينة 16000
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000
    });
    
    // قراءة ملف الفيديو كـ ArrayBuffer
    const arrayBuffer = await videoFile.arrayBuffer();
    
    // فك تشفير الصوت
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // تحويل إلى Mono إذا كان Stereo
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    
    // إنشاء buffer جديد mono بمعدل 16000
    const monoBuffer = audioContext.createBuffer(1, length, 16000);
    const monoData = monoBuffer.getChannelData(0);
    
    // دمج القنوات إذا كانت متعددة
    if (numberOfChannels === 1) {
      monoData.set(audioBuffer.getChannelData(0));
    } else {
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.getChannelData(1);
      for (let i = 0; i < length; i++) {
        // متوسط القناتين للتحويل إلى مونو
        monoData[i] = (leftChannel[i] + rightChannel[i]) / 2;
      }
    }
    
    // تحويل إلى WAV باستخدام الدالة المطلوبة
    return audioBufferToWav(monoBuffer);
  } catch (error: any) {
    console.error('خطأ في استخراج الصوت:', error);
    throw new Error(`فشل استخراج الصوت: ${error.message}`);
  }
};

/**
 * دالة مساعدة لتحويل AudioBuffer إلى Blob بصيغة WAV
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const length = buffer.length * buffer.numberOfChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  const channels = [];
  let offset = 0;
  let pos = 0;
  
  // كتابة WAVE header
  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };
  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };
  
  // "RIFF" chunk descriptor
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  
  // "fmt " sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(buffer.numberOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
  setUint16(buffer.numberOfChannels * 2);
  setUint16(16);
  
  // "data" sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);
  
  // كتابة بيانات الصوت
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  while (pos < length) {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export const transcribeAudioWithGemini = async (audioBase64: string): Promise<Subtitle[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            data: audioBase64,
            mimeType: 'audio/wav',
          },
        },
        { 
          text: `قم بتفريغ هذا الملف الصوتي بدقة متناهية. 
          يجب أن تكون المخرجات بتنسيق JSON حصراً كقائمة من الكائنات تحتوي على:
          - id: رقم تسلسلي
          - startTime: وقت البدء بالثواني (رقم عشري)
          - endTime: وقت الانتهاء بالثواني (رقم عشري)
          - originalText: النص المنطوق.
          اجعل المقاطع قصيرة (حوالي 3-5 ثواني لكل مقطع) لتناسب الترجمة السينمائية.` 
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              originalText: { type: Type.STRING }
            },
            required: ["id", "startTime", "endTime", "originalText"]
          }
        }
      }
    });

    const text = response.text || '[]';
    return JSON.parse(text);
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
};

export const processTranslationPipeline = async (
  subtitles: Subtitle[]
): Promise<{ translatedSubs: (Subtitle & { emotion?: string })[], detectedLang: string }> => {
  const prompt = `أنت العقل المدبر لنظام ANWAR - Matrix. 
  لديك قائمة نصوص مستخرجة من فيديو. المطلوب:
  1. تحديد اللغة الأصلية للنصوص.
  2. ترجمة النصوص إلى لغة عربية فصحى سينمائية (Lip-sync friendly).
  3. تحديد الحالة العاطفية لكل جملة.

  يجب أن يكون الرد بتنسيق JSON يحتوي على:
  - detectedLanguage: اسم اللغة الأصلية بالعربية.
  - translations: قائمة تحتوي على { id, translatedText, emotion }.

  النصوص: ${JSON.stringify(subtitles.map(s => ({ id: s.id, text: s.originalText })))}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING },
            translations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  translatedText: { type: Type.STRING },
                  emotion: { type: Type.STRING }
                },
                required: ["id", "translatedText", "emotion"]
              }
            }
          },
          required: ["detectedLanguage", "translations"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    const translatedSubs = subtitles.map(sub => {
      const match = result.translations.find((r: any) => r.id === sub.id);
      return { 
        ...sub, 
        translatedText: match ? match.translatedText : '---',
        emotion: match ? match.emotion : 'هادئ'
      };
    });

    return { translatedSubs, detectedLang: result.detectedLanguage };
  } catch (error) {
    console.error("Translation Pipeline Error:", error);
    throw error;
  }
};

export const translateSubtitlesMastermind = async (
  subtitles: Subtitle[],
  targetLang: string = 'Arabic'
): Promise<(Subtitle & { emotion?: string })[]> => {
  const { translatedSubs } = await processTranslationPipeline(subtitles);
  return translatedSubs;
};

export const generateNeuralVoiceover = async (text: string, voiceName: string = 'Kore', emotion: string = ''): Promise<string | undefined> => {
  try {
    const prompt = emotion ? `Say this with a ${emotion} tone in Arabic: ${text}` : `Say clearly in Arabic: ${text}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return undefined;
  }
};