import { Chat } from "@google/genai";

export enum AppStep {
  SETUP = 'setup',
  STYLE_ANALYSIS = 'style_analysis',
  STRUCTURE = 'structure',
  GENERATION = 'generation',
  POST_PROCESSING = 'post_processing'
}

export interface AppState {
  step: AppStep;
  apiKey: string;
  bloggerName: string;
  bloggerStyle: string;
  topic: string;
  structure: string;
  generatedScript: string;
  chatSession: Chat | null; // Holds the conversation for structure -> generation
}

export interface PostProcessOption {
  id: 'cliche' | 'humor' | 'review';
  label: string;
  description: string;
  icon: string;
}

export interface ClicheItem {
  id: number;
  text: string;
  type: string;
  severity: number; // 1-10
  suggestion: string;
  selected: boolean;
}
