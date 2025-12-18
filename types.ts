
export interface Subtitle {
  id: string;
  startTime: string;
  endTime: string;
  originalText: string;
  translatedText: string;
}

export interface ProjectMetadata {
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  fileSize?: string;
  duration?: string;
}
