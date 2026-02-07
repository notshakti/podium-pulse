import type { Participant, QuizQuestion, QuizDisplayState } from './types';
import { DEFAULT_QUIZ_DISPLAY } from './types';

const PARTICIPANTS_KEY = 'build-a-bot-participants';
const QUESTIONS_KEY = 'build-a-bot-questions';
const QUIZ_STATE_KEY = 'build-a-bot-quiz-state';

export function loadParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(PARTICIPANTS_KEY);
    if (!raw) return getDefaultParticipants();
    const parsed = JSON.parse(raw) as Participant[];
    return Array.isArray(parsed) ? parsed : getDefaultParticipants();
  } catch {
    return getDefaultParticipants();
  }
}

function getDefaultParticipants(): Participant[] {
  return [
    { id: '1', name: 'Team Alpha', points: 0 },
    { id: '2', name: 'Team Beta', points: 0 },
    { id: '3', name: 'Team Gamma', points: 0 },
    { id: '4', name: 'Team Delta', points: 0 },
    { id: '5', name: 'Team Epsilon', points: 0 },
  ];
}

export function saveParticipants(participants: Participant[]): void {
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
}

export function loadQuestions(): QuizQuestion[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY);
    if (!raw) return getDefaultQuestions();
    const parsed = JSON.parse(raw) as QuizQuestion[];
    return Array.isArray(parsed) ? parsed : getDefaultQuestions();
  } catch {
    return getDefaultQuestions();
  }
}

function getDefaultQuestions(): QuizQuestion[] {
  return [
    {
      id: 'q1',
      question: 'What is the best way to debug a bot?',
      options: ['Print statements', 'Logging & breakpoints', 'Guess and check', 'Restart the bot'],
      correctIndex: 1,
    },
    {
      id: 'q2',
      question: 'Which protocol is commonly used for real-time bot communication?',
      options: ['HTTP only', 'WebSockets', 'FTP', 'SMTP'],
      correctIndex: 1,
    },
  ];
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
