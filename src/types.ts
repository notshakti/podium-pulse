export interface Slot {
  id: string;
  name: string; // "Slot 1", "Slot 2", etc.
}

export interface Team {
  id: string;
  name: string;
  slotId: string;
  points: number;
  /** Team leader's Gmail (set when registering via team login) */
  leaderEmail?: string;
  /** Assigned problem statement id (set when admin sends problem statements) */
  assignedProblemId?: string;
}

export interface SlotTimerState {
  slotId: string;
  remainingSeconds: number; // 90 * 60 = 5400
  isPaused: boolean;
}

export interface AppSettings {
  scoresHidden: boolean;
  /** Max teams per slot (default 20). Used when teams register via team login. */
  maxTeamsPerSlot: number;
}

export interface ProblemStatement {
  id: string;
  /** Which slot this statement belongs to (slot-1, slot-2, slot-3) */
  slotId: string;
  title: string;
  content: string;
  /** Number of times this problem has been assigned (max 3) */
  timesAssigned: number;
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

export const TIMER_DURATION_SECONDS = 90 * 60; // 1 hr 30 min
export const QUIZ_COUNTDOWN_SECONDS = 10;
