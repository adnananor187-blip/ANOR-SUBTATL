
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subtitle } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Transcribes audio with high precision.
 */
export const transcribeAudioFile = async (audioBase64: string, mimeType: string = 'audio/mp3'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            data: audioBase64,
            mimeType: mimeType,
          },
        },
        { text: "قم بتفريغ هذا الملف الصوتي بدقة تقنية عالية. استخرج النصوص مع الحفاظ على علامات الترقيم وسياق الكلام السينمائي." }
      ],
    });
    return response.text || '';
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
};

/**
 * Professional Translation Pipeline (الباب الأول والباب الثاني)
 * Handles: Language detection, Lip-sync optimization, and Emotional tagging.
 */
export const translateSubtitlesMastermind = async (
  subtitles: Subtitle[], 
  targetLang: string = 'Arabic'
): Promise<(Subtitle & { emotion?: string })[]> => {
  const prompt = `أنت العقل المدبر لنظام ANWAR - Matrix Translator.
مهمتك: ترجمة النصوص التالية إلى ${targetLang} احترافية (الباب الأول).
القواعد:
1. الترجمة يجب أن تكون "Lip-sync friendly" (متوافقة مع طول الجملة الأصلية قدر الإمكان).
2. استخدم لغة سينمائية فصحى أو بيضاء راقية.
3. لكل جملة، حدد "الشعور" أو "النبرة" (مثال: غاضب، هادئ، حزين، متحمس) (الباب الثاني).
4. حافظ على معرفات الـ ID.

المخرجات المطلوبة: JSON array of objects { id, translatedText, emotion }.

النصوص:
${JSON.stringify(subtitles.map(s => ({ id: s.id, originalText: s.originalText })))}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              translatedText: { type: Type.STRING },
              emotion: { type: Type.STRING, description: "الوصف العاطفي للنبرة الصوتية" },
            },
            required: ["id", "translatedText", "emotion"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || '[]');
    return subtitles.map(sub => {
      const match = results.find((r: any) => r.id === sub.id);
      return { 
        ...sub, 
        translatedText: match ? match.translatedText : sub.translatedText,
        emotion: match ? match.emotion : 'هادئ'
      };
    });
  } catch (error) {
    console.error("Mastermind Translation Error:", error);
    throw error;
  }
};

/**
 * Generates neural voiceover with emotional context.
 */
export const generateNeuralVoiceover = async (text: string, voiceName: string = 'Kore', emotion: string = ''): Promise<string | undefined> => {
  try {
    const apiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    // Incorporating emotion into the prompt for better TTS guidance
    const prompt = emotion ? `Say this with a ${emotion} tone: ${text}` : `Say clearly: ${text}`;
    
    const response = await apiInstance.models.generateContent({
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
