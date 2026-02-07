import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Participant, QuizQuestion, QuizDisplayState } from '../types';
import * as storage from '../storage';

interface AppState {
  participants: Participant[];
  questions: QuizQuestion[];
  quizState: QuizDisplayState;
}

interface AppContextValue extends AppState {
  setParticipants: (participants: Participant[] | ((prev: Participant[]) => Participant[])) => void;
  setQuestions: (questions: QuizQuestion[] | ((prev: QuizQuestion[]) => QuizQuestion[])) => void;
  setQuizState: (state: QuizDisplayState | ((prev: QuizDisplayState) => QuizDisplayState)) => void;
  addParticipant: (name: string) => void;
  updateParticipantScore: (id: string, points: number) => void;
  addQuestion: (q: Omit<QuizQuestion, 'id'>) => void;
  updateQuestion: (id: string, q: Partial<QuizQuestion>) => void;
  removeQuestion: (id: string) => void;
  refreshFromStorage: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_POLL_MS = 500;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [participants, setParticipantsState] = useState<Participant[]>(storage.loadParticipants);
  const [questions, setQuestionsState] = useState<QuizQuestion[]>(storage.loadQuestions);
  const [quizState, setQuizStateState] = useState<QuizDisplayState>(storage.loadQuizState);

  const refreshFromStorage = useCallback(() => {
    setParticipantsState(storage.loadParticipants());
    setQuestionsState(storage.loadQuestions());
    setQuizStateState(storage.loadQuizState());
  }, []);

  useEffect(() => {
    storage.saveParticipants(participants);
  }, [participants]);

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

  const setParticipants = useCallback((arg: Participant[] | ((prev: Participant[]) => Participant[])) => {
    setParticipantsState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);

  const setQuestions = useCallback((arg: QuizQuestion[] | ((prev: QuizQuestion[]) => QuizQuestion[])) => {
    setQuestionsState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);

  const setQuizState = useCallback((arg: QuizDisplayState | ((prev: QuizDisplayState) => QuizDisplayState)) => {
    setQuizStateState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);

  const addParticipant = useCallback((name: string) => {
    setParticipantsState((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: name.trim() || 'Unknown', points: 0 },
    ]);
  }, []);

  const updateParticipantScore = useCallback((id: string, points: number) => {
    setParticipantsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, points: Math.max(0, points) } : p))
    );
  }, []);

  const addQuestion = useCallback((q: Omit<QuizQuestion, 'id'>) => {
    setQuestionsState((prev) => [
      ...prev,
      { ...q, id: crypto.randomUUID() },
    ]);
  }, []);

  const updateQuestion = useCallback((id: string, q: Partial<QuizQuestion>) => {
    setQuestionsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...q } : p))
    );
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setQuestionsState((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      participants,
      questions,
      quizState,
      setParticipants,
      setQuestions,
      setQuizState,
      addParticipant,
      updateParticipantScore,
      addQuestion,
      updateQuestion,
      removeQuestion,
      refreshFromStorage,
    }),
    [
      participants,
      questions,
      quizState,
      setParticipants,
      setQuestions,
      setQuizState,
      addParticipant,
      updateParticipantScore,
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
