export enum SupportedLanguage {
  JAVASCRIPT = 'JavaScript',
  PYTHON = 'Python',
  JAVA = 'Java',
  CPP = 'C++',
  C = 'C',
  GO = 'Go',
  HTML = 'HTML',
  SQL = 'SQL',
  RUST = 'Rust',
  SWIFT = 'Swift'
}

export interface SimulationResult {
  output: string;
  isError: boolean;
  executionTime?: string;
}

export interface StepExplanation {
  step: number;
  line?: string;
  explanation: string;
}

export interface AiSuggestion {
  snippet: string;
  description: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  language: SupportedLanguage;
  code: string;
  comment?: string;
}

export interface Commit {
  id: string;
  message: string;
  timestamp: number;
  code: string;
  language: SupportedLanguage;
  author: string;
  isSynced?: boolean; // Client-side flag to track push status
}

export type ViewMode = 'OUTPUT' | 'EXPLANATION' | 'SUGGESTIONS';