export interface Participant {
  id: string;
  name: string;
  points: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0-3
}

export type QuizDisplayPhase = 'idle' | 'question' | 'countdown' | 'reveal';

export interface QuizDisplayState {
  phase: QuizDisplayPhase;
  currentQuestionIndex: number;
  countdownSeconds: number;
  revealed: boolean;
}

export const DEFAULT_QUIZ_DISPLAY: QuizDisplayState = {
  phase: 'idle',
  currentQuestionIndex: 0,
  countdownSeconds: 10,
  revealed: false,
};
