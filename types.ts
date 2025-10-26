export interface Subject {
  name: string;
  attribute: string;
}

export interface StructuredPrompt {
  frame: {
    style: string;
    tone: string; // comma separated tags
  };
  scene: {
    subjects: Subject[];
    action: string;
  };
  context: {
    setting: string;
    details: string; // comma separated tags
  };
}

export interface GenerationHistoryItem {
  id: string;
  imageUrl: string;
  prompt: StructuredPrompt;
  rawPrompt: string;
}

export interface SavedPromptItem {
  id: string;
  name: string;
  rawPrompt: string;
  prompt: StructuredPrompt;
}

export interface PromptVariation {
  id: string;
  title: string;
  prompt: string;
}

export type EditorTab = 'structured' | 'raw' | 'analysis';

export type AnalysisCategory = "entity" | "process" | "tone" | "risk" | "other";

export interface AnalysisTag {
  id: string;
  category: AnalysisCategory;
  span: string; 
  detail?: string;
  weight?: number;
}

export interface RewriteCandidate {
  id: string;
  title: string;
  text: string;
  rationale?: string;
  score?: number;
}

export interface AnalysisResult {
    analysis: AnalysisTag[];
    candidates: RewriteCandidate[];
}