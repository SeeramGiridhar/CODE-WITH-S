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

export interface EditorTheme {
  id: string;
  name: string;
  type: 'dark' | 'light';
  colors: {
    background: string;       // The main editor text area background
    text: string;            // The main code text color
    caret: string;           // Cursor color (if supported via caret-color)
    lineNumbersBg: string;   // Sidebar background
    lineNumbersText: string; // Sidebar text color
    uiBackground: string;    // Toolbar background
    uiBorder: string;        // Border colors
    uiText: string;          // Toolbar text color
    placeholder: string;     // Placeholder text color
  }
}