import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Team, Slot, SlotTimerState, AppSettings, QuizQuestion, QuizDisplayState, ProblemStatement } from '../types';
import { TIMER_DURATION_SECONDS } from '../types';
import * as storage from '../storage';

const MAX_ASSIGNMENTS_PER_PROBLEM = 3;

interface AppState {
  teams: Team[];
  slots: Slot[];
  timers: SlotTimerState[];
  settings: AppSettings;
  questions: QuizQuestion[];
  quizState: QuizDisplayState;
  problemStatements: ProblemStatement[];
}

export interface ProblemAssignment {
  email: string;
  teamName: string;
  problemTitle: string;
  problemContent: string;
}

interface AppContextValue extends AppState {
  setTeams: (arg: Team[] | ((prev: Team[]) => Team[])) => void;
  setSlots: (arg: Slot[] | ((prev: Slot[]) => Slot[])) => void;
  setTimers: (arg: SlotTimerState[] | ((prev: SlotTimerState[]) => SlotTimerState[])) => void;
  setSettings: (arg: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  setQuestions: (arg: QuizQuestion[] | ((prev: QuizQuestion[]) => QuizQuestion[])) => void;
  setQuizState: (arg: QuizDisplayState | ((prev: QuizDisplayState) => QuizDisplayState)) => void;
  setProblemStatements: (arg: ProblemStatement[] | ((prev: ProblemStatement[]) => ProblemStatement[])) => void;
  addTeam: (name: string, slotId: string) => void;
  registerTeam: (name: string, leaderEmail: string) => { success: boolean; slotName?: string; team?: Team; error?: string };
  updateTeamPoints: (id: string, points: number) => void;
  updateTeam: (id: string, patch: Partial<Team>) => void;
  removeTeam: (id: string) => void;
  startTimer: (slotId: string) => void;
  pauseTimer: (slotId: string) => void;
  resumeTimer: (slotId: string) => void;
  resetTimer: (slotId: string) => void;
  setScoresHidden: (hidden: boolean) => void;
  setMaxTeamsPerSlot: (n: number) => void;
  addQuestion: (q: Omit<QuizQuestion, 'id'>) => void;
  updateQuestion: (id: string, q: Partial<QuizQuestion>) => void;
  removeQuestion: (id: string) => void;
  addProblemStatement: (p: Omit<ProblemStatement, 'id' | 'timesAssigned'>) => void;
  updateProblemStatement: (id: string, p: Partial<ProblemStatement>) => void;
  removeProblemStatement: (id: string) => void;
  assignAndGetProblemAssignments: () => ProblemAssignment[];
  /** Assign one random problem from the team's slot to this team; returns the assignment for email or null if slot has no statements. */
  assignOneProblemAndGetAssignment: (team: Team) => ProblemAssignment | null;
  /** Reset assignment count for a problem and clear it from all teams that had it assigned. */
  resetProblemStatementAssignments: (problemId: string) => void;
  refreshFromStorage: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_POLL_MS = 400;
const API_STATE_POLL_MS = 5000;
const API_PERSIST_DEBOUNCE_MS = 800;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeamsState] = useState<Team[]>(storage.loadTeams);
  const [slots, setSlotsState] = useState<Slot[]>(storage.loadSlots);
  const [timers, setTimersState] = useState<SlotTimerState[]>(storage.loadTimers);
  const [settings, setSettingsState] = useState<AppSettings>(storage.loadSettings);
  const [questions, setQuestionsState] = useState<QuizQuestion[]>(storage.loadQuestions);
  const [quizState, setQuizStateState] = useState<QuizDisplayState>(storage.loadQuizState);
  const [problemStatements, setProblemStatementsState] = useState<ProblemStatement[]>(storage.loadProblemStatements);
  const hasHydratedFromApiRef = useRef(false);
  const skipNextPersistRef = useRef(false);

  const refreshFromStorage = useCallback(() => {
    setTeamsState(storage.loadTeams());
    setSlotsState(storage.loadSlots());
    setTimersState(storage.loadTimers());
    setSettingsState(storage.loadSettings());
    setQuestionsState(storage.loadQuestions());
    setQuizStateState(storage.loadQuizState());
    setProblemStatementsState(storage.loadProblemStatements());
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
    storage.saveProblemStatements(problemStatements);
  }, [problemStatements]);

  // Hydrate from shared API state on mount (so all admins see the same data)
  useEffect(() => {
    let cancelled = false;
    const localTeams = storage.loadTeams();
    const localProblemStatements = storage.loadProblemStatements();
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const serverEmpty = (Array.isArray(data.teams) && data.teams.length === 0) && (Array.isArray(data.problemStatements) && data.problemStatements.length === 0);
        const hasLocalData = localTeams.length > 0 || localProblemStatements.length > 0;
        if (serverEmpty && hasLocalData) {
          const payload = {
            teams: localTeams,
            slots: storage.loadSlots(),
            timers: storage.loadTimers(),
            settings: storage.loadSettings(),
            questions: storage.loadQuestions(),
            quizState: storage.loadQuizState(),
            problemStatements: localProblemStatements,
          };
          fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
        } else {
          if (Array.isArray(data.teams)) setTeamsState(data.teams);
          if (Array.isArray(data.slots) && data.slots.length > 0) setSlotsState(data.slots);
          if (Array.isArray(data.timers)) setTimersState(data.timers);
          if (data.settings && typeof data.settings === 'object') setSettingsState(data.settings);
          if (Array.isArray(data.questions)) setQuestionsState(data.questions);
          if (data.quizState && typeof data.quizState === 'object') setQuizStateState(data.quizState);
          if (Array.isArray(data.problemStatements)) setProblemStatementsState(data.problemStatements);
        }
        hasHydratedFromApiRef.current = true;
        skipNextPersistRef.current = true;
      })
      .catch(() => { hasHydratedFromApiRef.current = true; });
    return () => { cancelled = true; };
  }, []);

  // Persist state to shared API (debounced) so other admins see changes
  useEffect(() => {
    if (!hasHydratedFromApiRef.current) return;
    const t = setTimeout(() => {
      if (skipNextPersistRef.current) {
        skipNextPersistRef.current = false;
        return;
      }
      const payload = {
        teams,
        slots,
        timers,
        settings,
        questions,
        quizState,
        problemStatements,
      };
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, API_PERSIST_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [teams, slots, timers, settings, questions, quizState, problemStatements]);

  // Poll shared state so we see changes made by other admins
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/state')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          if (Array.isArray(data.teams)) setTeamsState(data.teams);
          if (Array.isArray(data.slots) && data.slots.length > 0) setSlotsState(data.slots);
          if (Array.isArray(data.timers)) setTimersState(data.timers);
          if (data.settings && typeof data.settings === 'object') setSettingsState(data.settings);
          if (Array.isArray(data.questions)) setQuestionsState(data.questions);
          if (data.quizState && typeof data.quizState === 'object') setQuizStateState(data.quizState);
          if (Array.isArray(data.problemStatements)) setProblemStatementsState(data.problemStatements);
          skipNextPersistRef.current = true;
        })
        .catch(() => {});
    }, API_STATE_POLL_MS);
    return () => clearInterval(interval);
  }, []);

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
    setQuizStateState((prev) => {
      const next = typeof arg === 'function' ? arg(prev) : arg;
      storage.saveQuizState(next);
      return next;
    });
  }, []);

  const addTeam = useCallback((name: string, slotId: string) => {
    const trimmed = name.trim() || 'Unknown';
    if (!trimmed) return;
    if (!slotId) return;
    const newTeam = { id: crypto.randomUUID(), name: trimmed, slotId, points: 0 };
    setTeamsState((prev) => {
      const next = [...prev, newTeam];
      storage.saveTeams(next);
      return next;
    });
  }, []);

  /** Register team via team login: assign to next available slot (fill order Slot 1 → 2 → 3). */
  const registerTeam = useCallback((name: string, leaderEmail: string) => {
    const trimmedName = name.trim() || 'Unknown';
    const email = leaderEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return { success: false, error: 'Please enter a valid Gmail address.' };
    const maxPerSlot = Math.max(1, settings.maxTeamsPerSlot);
    const slotOrder = slots.map((s) => s.id);
    const countsBySlot: Record<string, number> = {};
    slotOrder.forEach((id) => { countsBySlot[id] = 0; });
    teams.forEach((t) => { countsBySlot[t.slotId] = (countsBySlot[t.slotId] ?? 0) + 1; });
    const alreadyRegistered = teams.some((t) => t.leaderEmail?.toLowerCase() === email);
    if (alreadyRegistered) return { success: false, error: 'This Gmail is already registered.' };
    let slotId: string | null = null;
    for (const sid of slotOrder) {
      if ((countsBySlot[sid] ?? 0) < maxPerSlot) {
        slotId = sid;
        break;
      }
    }
    if (!slotId) return { success: false, error: 'All slots are full. Contact the organizer.' };
    const slotName = slots.find((s) => s.id === slotId)?.name ?? slotId;
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: trimmedName,
      slotId,
      points: 0,
      leaderEmail: email,
    };
    setTeamsState((prev) => {
      const next = [...prev, newTeam];
      storage.saveTeams(next);
      return next;
    });
    return { success: true, slotName, team: newTeam };
  }, [teams, slots, settings.maxTeamsPerSlot]);

  const setMaxTeamsPerSlot = useCallback((n: number) => {
    setSettingsState((prev) => ({ ...prev, maxTeamsPerSlot: Math.max(1, n) }));
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

  const setProblemStatements = useCallback((arg: ProblemStatement[] | ((prev: ProblemStatement[]) => ProblemStatement[])) => {
    setProblemStatementsState((prev) => (typeof arg === 'function' ? arg(prev) : arg));
  }, []);

  const addProblemStatement = useCallback((p: Omit<ProblemStatement, 'id' | 'timesAssigned'>) => {
    setProblemStatementsState((prev) => [
      ...prev,
      { ...p, id: crypto.randomUUID(), timesAssigned: 0 },
    ]);
  }, []);

  const updateProblemStatement = useCallback((id: string, p: Partial<ProblemStatement>) => {
    setProblemStatementsState((prev) => prev.map((s) => (s.id === id ? { ...s, ...p } : s)));
  }, []);

  const removeProblemStatement = useCallback((id: string) => {
    setProblemStatementsState((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /** For each team with email that does not yet have an assignment, randomly assign one problem from that team's slot (max 3 per problem). Returns list for sending emails; also updates teams and problemStatements. */
  const assignAndGetProblemAssignments = useCallback((): ProblemAssignment[] => {
    const withEmail = teams.filter((t) => t.leaderEmail?.trim() && !t.assignedProblemId);
    if (withEmail.length === 0 || problemStatements.length === 0) return [];
    const shuffled = [...withEmail].sort(() => Math.random() - 0.5);
    const problemCounts = new Map<string, number>();
    problemStatements.forEach((p) => problemCounts.set(p.id, p.timesAssigned));
    const availableForSlot = (slotId: string) =>
      problemStatements.filter((p) => p.slotId === slotId && (problemCounts.get(p.id) ?? 0) < MAX_ASSIGNMENTS_PER_PROBLEM);
    const assignments: ProblemAssignment[] = [];
    const teamUpdates: { id: string; problemId: string }[] = [];
    const problemUpdates: { id: string; newCount: number }[] = [];

    for (const team of shuffled) {
      const opts = availableForSlot(team.slotId);
      if (opts.length === 0) continue;
      const problem = opts[Math.floor(Math.random() * opts.length)];
      const count = problemCounts.get(problem.id) ?? 0;
      problemCounts.set(problem.id, count + 1);
      assignments.push({
        email: team.leaderEmail!,
        teamName: team.name,
        problemTitle: problem.title,
        problemContent: problem.content,
      });
      teamUpdates.push({ id: team.id, problemId: problem.id });
      problemUpdates.push({ id: problem.id, newCount: count + 1 });
    }

    setTeamsState((prev) =>
      prev.map((t) => {
        const u = teamUpdates.find((x) => x.id === t.id);
        return u ? { ...t, assignedProblemId: u.problemId } : t;
      })
    );
    setProblemStatementsState((prev) =>
      prev.map((p) => {
        const u = problemUpdates.find((x) => x.id === p.id);
        return u ? { ...p, timesAssigned: u.newCount } : p;
      })
    );
    return assignments;
  }, [teams, problemStatements]);

  /** Assign one random problem from the team's slot to this team; updates state and returns the assignment for email, or null if slot has no statements. */
  const assignOneProblemAndGetAssignment = useCallback((team: Team): ProblemAssignment | null => {
    if (!team.leaderEmail?.trim() || problemStatements.length === 0) return null;
    const available = problemStatements.filter(
      (p) => p.slotId === team.slotId && p.timesAssigned < MAX_ASSIGNMENTS_PER_PROBLEM
    );
    if (available.length === 0) return null;
    const problem = available[Math.floor(Math.random() * available.length)];
    const assignment: ProblemAssignment = {
      email: team.leaderEmail,
      teamName: team.name,
      problemTitle: problem.title,
      problemContent: problem.content,
    };
    setTeamsState((prev) =>
      prev.map((t) => (t.id === team.id ? { ...t, assignedProblemId: problem.id } : t))
    );
    setProblemStatementsState((prev) =>
      prev.map((p) => (p.id === problem.id ? { ...p, timesAssigned: p.timesAssigned + 1 } : p))
    );
    return assignment;
  }, [teams, problemStatements]);

  const resetProblemStatementAssignments = useCallback((problemId: string) => {
    setProblemStatementsState((prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, timesAssigned: 0 } : p))
    );
    setTeamsState((prev) =>
      prev.map((t) => (t.assignedProblemId === problemId ? { ...t, assignedProblemId: undefined } : t))
    );
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      teams,
      slots,
      timers,
      settings,
      questions,
      quizState,
      problemStatements,
      setTeams,
      setSlots,
      setTimers,
      setSettings,
      setQuestions,
      setQuizState,
      setProblemStatements,
      addTeam,
      registerTeam,
      updateTeamPoints,
      updateTeam,
      removeTeam,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      setScoresHidden,
      setMaxTeamsPerSlot,
      addQuestion,
      updateQuestion,
      removeQuestion,
      addProblemStatement,
      updateProblemStatement,
      removeProblemStatement,
      assignAndGetProblemAssignments,
      assignOneProblemAndGetAssignment,
      resetProblemStatementAssignments,
      refreshFromStorage,
    }),
    [
      teams,
      slots,
      timers,
      settings,
      questions,
      quizState,
      problemStatements,
      setTeams,
      setSlots,
      setTimers,
      setSettings,
      setQuestions,
      setQuizState,
      setProblemStatements,
      addTeam,
      registerTeam,
      updateTeamPoints,
      updateTeam,
      removeTeam,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      setScoresHidden,
      setMaxTeamsPerSlot,
      addQuestion,
      updateQuestion,
      removeQuestion,
      addProblemStatement,
      updateProblemStatement,
      removeProblemStatement,
      assignAndGetProblemAssignments,
      assignOneProblemAndGetAssignment,
      resetProblemStatementAssignments,
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
