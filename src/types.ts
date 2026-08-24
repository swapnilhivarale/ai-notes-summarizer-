export type SummaryLength = 'short' | 'medium' | 'detailed';

export type KeyPointCategory = 'concept' | 'definition' | 'formula' | 'date_fact' | 'takeaway';

export interface KeyPoint {
  id: string;
  title: string;
  explanation: string;
  category: KeyPointCategory;
  highlightFact?: string;
  tags?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  referenceFact?: string;
}

export interface QuizSubmission {
  userAnswers: Record<string, number>;
  score: number;
  total: number;
  percentage: number;
  completed: boolean;
}

export interface NoteAnalysis {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'text' | 'image';
  fileSize?: number;
  uploadedAt: string;
  summary: string;
  keyPoints: KeyPoint[];
  quiz: QuizQuestion[];
  overviewStats: {
    estimatedReadTimeMinutes: number;
    wordCountEstimate: number;
    keyTermsCount: number;
    topicSubject: string;
    difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  };
  lengthOption: SummaryLength;
  isLowContent?: boolean;
  lowContentMessage?: string;
  rawTextPreview?: string;
  isScanned?: boolean;
  pageCount?: number;
  pageImages?: string[];
  storedFilePayload?: {
    mimeType: string;
    base64Data?: string;
    textContent?: string;
    fileName: string;
    pageImages?: string[];
    isScanned?: boolean;
  };
}

export interface AnalysisRequestPayload {
  filePayload: {
    fileName: string;
    fileType: 'pdf' | 'text' | 'image';
    mimeType: string;
    base64Data?: string;
    textContent?: string;
    pageImages?: string[];
    isScanned?: boolean;
    pageCount?: number;
    fileSize?: number;
  };
  length: SummaryLength;
}
