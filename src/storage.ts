import type { Team, Slot, SlotTimerState, AppSettings, QuizQuestion, QuizDisplayState } from './types';
import { DEFAULT_QUIZ_DISPLAY, TIMER_DURATION_SECONDS } from './types';

const TEAMS_KEY = 'build-a-bot-teams';
const SLOTS_KEY = 'build-a-bot-slots';
const TIMERS_KEY = 'build-a-bot-timers';
const SETTINGS_KEY = 'build-a-bot-settings';
const QUESTIONS_KEY = 'build-a-bot-questions';
const QUIZ_STATE_KEY = 'build-a-bot-quiz-state';
const AUTH_KEY = 'build-a-bot-admin-auth';

function defaultSlots(): Slot[] {
  return [
    { id: 'slot-1', name: 'Slot 1' },
    { id: 'slot-2', name: 'Slot 2' },
    { id: 'slot-3', name: 'Slot 3' },
  ];
}

export function loadSlots(): Slot[] {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) return defaultSlots();
    const parsed = JSON.parse(raw) as Slot[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultSlots();
  } catch {
    return defaultSlots();
  }
}

export function saveSlots(slots: Slot[]): void {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function loadTeams(): Team[] {
  try {
    const raw = localStorage.getItem(TEAMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Team[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTeams(teams: Team[]): void {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

export function loadTimers(): SlotTimerState[] {
  try {
    const raw = localStorage.getItem(TIMERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SlotTimerState[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTimers(timers: SlotTimerState[]): void {
  localStorage.setItem(TIMERS_KEY, JSON.stringify(timers));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { scoresHidden: false };
    const parsed = JSON.parse(raw) as AppSettings;
    return { scoresHidden: Boolean(parsed.scoresHidden) };
  } catch {
    return { scoresHidden: false };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadQuestions(): QuizQuestion[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuizQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQuestions(questions: QuizQuestion[]): void {
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
}

export function loadQuizState(): QuizDisplayState {
  try {
    const raw = localStorage.getItem(QUIZ_STATE_KEY);
    if (!raw) return { ...DEFAULT_QUIZ_DISPLAY };
    const parsed = JSON.parse(raw) as QuizDisplayState;
    return {
      phase: parsed.phase ?? 'idle',
      currentQuestionIndex: typeof parsed.currentQuestionIndex === 'number' ? parsed.currentQuestionIndex : 0,
      countdownSeconds: typeof parsed.countdownSeconds === 'number' ? parsed.countdownSeconds : 10,
      revealed: Boolean(parsed.revealed),
    };
  } catch {
    return { ...DEFAULT_QUIZ_DISPLAY };
  }
}

export function saveQuizState(state: QuizDisplayState): void {
  localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
}

// Simple admin auth: store that we're logged in. Password check is done at login.
const ADMIN_PASSWORD = 'admin123'; // Change in production

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function setAdminAuthenticated(authenticated: boolean): void {
  if (authenticated) localStorage.setItem(AUTH_KEY, '1');
  else localStorage.removeItem(AUTH_KEY);
}

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === '1';
}

export { TIMER_DURATION_SECONDS };
