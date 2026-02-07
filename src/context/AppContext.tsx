import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Team, Slot, SlotTimerState, AppSettings, QuizQuestion, QuizDisplayState } from '../types';
import { TIMER_DURATION_SECONDS } from '../types';
import * as storage from '../storage';

interface AppState {
  teams: Team[];
  slots: Slot[];
  timers: SlotTimerState[];
  settings: AppSettings;
  questions: QuizQuestion[];
  quizState: QuizDisplayState;
}

interface AppContextValue extends AppState {
  setTeams: (arg: Team[] | ((prev: Team[]) => Team[])) => void;
  setSlots: (arg: Slot[] | ((prev: Slot[]) => Slot[])) => void;
  setTimers: (arg: SlotTimerState[] | ((prev: SlotTimerState[]) => SlotTimerState[])) => void;
  setSettings: (arg: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  setQuestions: (arg: QuizQuestion[] | ((prev: QuizQuestion[]) => QuizQuestion[])) => void;
  setQuizState: (arg: QuizDisplayState | ((prev: QuizDisplayState) => QuizDisplayState)) => void;
  addTeam: (name: string, slotId: string) => void;
  updateTeamPoints: (id: string, points: number) => void;
  updateTeam: (id: string, patch: Partial<Team>) => void;
  removeTeam: (id: string) => void;
  startTimer: (slotId: string) => void;
  pauseTimer: (slotId: string) => void;
  resumeTimer: (slotId: string) => void;
  resetTimer: (slotId: string) => void;
  setScoresHidden: (hidden: boolean) => void;
  addQuestion: (q: Omit<QuizQuestion, 'id'>) => void;
  updateQuestion: (id: string, q: Partial<QuizQuestion>) => void;
  removeQuestion: (id: string) => void;
  refreshFromStorage: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_POLL_MS = 400;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeamsState] = useState<Team[]>(storage.loadTeams);
  const [slots, setSlotsState] = useState<Slot[]>(storage.loadSlots);
  const [timers, setTimersState] = useState<SlotTimerState[]>(storage.loadTimers);
  const [settings, setSettingsState] = useState<AppSettings>(storage.loadSettings);
  const [questions, setQuestionsState] = useState<QuizQuestion[]>(storage.loadQuestions);
  const [quizState, setQuizStateState] = useState<QuizDisplayState>(storage.loadQuizState);

  const refreshFromStorage = useCallback(() => {
    setTeamsState(storage.loadTeams());
    setSlotsState(storage.loadSlots());
    setTimersState(storage.loadTimers());
    setSettingsState(storage.loadSettings());
    setQuestionsState(storage.loadQuestions());
    setQuizStateState(storage.loadQuizState());
  }, []);

  useEffect(() => {
    storage.saveTeams(teams);
  }, [teams]);
  useEffect(() => {
    storage.saveSlots(slots);
  }, [slots]);
  useEffect(() => {
    storage.saveTimers(timers);
  }, [timers]);
  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);
  useEffect(() => {
    storage.saveQuestions(questions);
  }, [questions]);
  useEffect(() => {
    storage.saveQuizState(quizState);
  }, [quizState]);

  useEffect(() => {
    const interval = setInterval(refreshFromStorage, STORAGE_POLL_MS);
    return () => clearInterval(interval);
  }, [refreshFromStorage]);

  // Timer tick: every second decrement non-paused timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTimersState((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (t.isPaused || t.remainingSeconds <= 0) return t;
          changed = true;
          return { ...t, remainingSeconds: Math.max(0, t.remainingSeconds - 1) };
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const setTeams = useCallback((arg: Team[] | ((prev: Team[]) => Team[])) => {
    setTeamsState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);
  const setSlots = useCallback((arg: Slot[] | ((prev: Slot[]) => Slot[])) => {
    setSlotsState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);
  const setTimers = useCallback((arg: SlotTimerState[] | ((prev: SlotTimerState[]) => SlotTimerState[])) => {
    setTimersState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);
  const setSettings = useCallback((arg: AppSettings | ((prev: AppSettings) => AppSettings)) => {
    setSettingsState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);
  const setQuestions = useCallback((arg: QuizQuestion[] | ((prev: QuizQuestion[]) => QuizQuestion[])) => {
    setQuestionsState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);
  const setQuizState = useCallback((arg: QuizDisplayState | ((prev: QuizDisplayState) => QuizDisplayState)) => {
    setQuizStateState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);

  const addTeam = useCallback((name: string, slotId: string) => {
    setTeamsState((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: name.trim() || 'Unknown', slotId, points: 0 },
    ]);
  }, []);

  const updateTeamPoints = useCallback((id: string, points: number) => {
    setTeamsState((prev) =>
      prev.map((t) => (t.id === id ? { ...t, points: Math.max(0, points) } : t))
    );
  }, []);

  const updateTeam = useCallback((id: string, patch: Partial<Team>) => {
    setTeamsState((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const removeTeam = useCallback((id: string) => {
    setTeamsState((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startTimer = useCallback((slotId: string) => {
    setTimersState((prev) => {
      const exists = prev.find((t) => t.slotId === slotId);
      if (exists) return prev.map((t) => (t.slotId === slotId ? { ...t, remainingSeconds: TIMER_DURATION_SECONDS, isPaused: false } : t));
      return [...prev, { slotId, remainingSeconds: TIMER_DURATION_SECONDS, isPaused: false }];
    });
  }, []);

  const pauseTimer = useCallback((slotId: string) => {
    setTimersState((prev) => prev.map((t) => (t.slotId === slotId ? { ...t, isPaused: true } : t)));
  }, []);

  const resumeTimer = useCallback((slotId: string) => {
    setTimersState((prev) => prev.map((t) => (t.slotId === slotId ? { ...t, isPaused: false } : t)));
  }, []);

  const resetTimer = useCallback((slotId: string) => {
    setTimersState((prev) => prev.map((t) => (t.slotId === slotId ? { ...t, remainingSeconds: TIMER_DURATION_SECONDS, isPaused: true } : t)));
  }, []);

  const setScoresHidden = useCallback((hidden: boolean) => {
    setSettingsState((prev) => ({ ...prev, scoresHidden: hidden }));
  }, []);

  const addQuestion = useCallback((q: Omit<QuizQuestion, 'id'>) => {
    setQuestionsState((prev) => [...prev, { ...q, id: crypto.randomUUID() }]);
  }, []);

  const updateQuestion = useCallback((id: string, q: Partial<QuizQuestion>) => {
    setQuestionsState((prev) => prev.map((p) => (p.id === id ? { ...p, ...q } : p)));
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setQuestionsState((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      teams,
      slots,
      timers,
      settings,
      questions,
      quizState,
      setTeams,
      setSlots,
      setTimers,
      setSettings,
      setQuestions,
      setQuizState,
      addTeam,
      updateTeamPoints,
      updateTeam,
      removeTeam,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      setScoresHidden,
      addQuestion,
      updateQuestion,
      removeQuestion,
      refreshFromStorage,
    }),
    [
      teams,
      slots,
      timers,
      settings,
      questions,
      quizState,
      setTeams,
      setSlots,
      setTimers,
      setSettings,
      setQuestions,
      setQuizState,
      addTeam,
      updateTeamPoints,
      updateTeam,
      removeTeam,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      setScoresHidden,
      addQuestion,
      updateQuestion,
      removeQuestion,
      refreshFromStorage,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
