export enum RiskType {
  SEXUAL = 'Sexual Content',
  HATE = 'Hate Speech',
  VIOLENCE = 'Violence',
  HARASSMENT = 'Harassment',
  NONE = 'Safe',
  SPAM = 'Spam',
  SCAM = 'Scam'
}

export enum ReviewStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending'
}

export type RiskLabel = RiskType | string;

export interface AiPrediction {
  riskTypes: RiskLabel[];
  explanation: string;
  rawResults?: Record<string, unknown>;
}

export interface ContentItem {
  id: string;
  type: 'text' | 'image' | 'mixed';
  text?: string;
  originalText?: string;
  imageUrl?: string;
  aiPrediction: AiPrediction;
  source?: 'mock' | 'engine';
  createdAt?: number;
}

export interface ReviewDecision {
  itemId: string;
  status: ReviewStatus;
  timestamp: number;
}

export type Language = 'zh' | 'en';

export interface SingleReviewPayload {
  text?: string;
  imageUrl?: string;
  imageFile?: File | null;
  itemId?: string;
  photoPath?: string;
}

export interface BatchTemplateRow {
  id: string;
  content?: string;
  photo?: string;
}

export interface ReviewLogEntry {
  id: string;
  result: string;
  timestamp: number;
}