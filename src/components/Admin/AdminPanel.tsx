import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { QuizQuestion, Team } from '../../types';
import { DeleteTeamModal } from './DeleteTeamModal';
import './AdminPanel.css';

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function AdminPanel() {
  const {
    teams,
    slots,
    timers,
    settings,
    questions,
    quizState,
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
  } = useApp();
  const { logout } = useAuth();

  const defaultSlotId = slots[0]?.id ?? '';
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlotId, setNewTeamSlotId] = useState(defaultSlotId);
  const [addTeamError, setAddTeamError] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [editingPointsTeamId, setEditingPointsTeamId] = useState<string | null>(null);
  const [editingPointsValue, setEditingPointsValue] = useState('');
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (defaultSlotId && !newTeamSlotId) setNewTeamSlotId(defaultSlotId);
  }, [defaultSlotId, newTeamSlotId]);
  const [questionForm, setQuestionForm] = useState<Partial<QuizQuestion> & { question: string; options: [string, string, string, string]; correctIndex: number }>({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const getTimer = (slotId: string) => timers.find((t) => t.slotId === slotId);
  const getTeamsForSlot = (slotId: string) => teams.filter((t) => t.slotId === slotId);

  const handleAddTeam = () => {
    setAddTeamError('');
    const name = newTeamName.trim();
    const slotId = newTeamSlotId || defaultSlotId;
    if (!name) {
      setAddTeamError('Please enter a team name.');
      return;
    }
    if (!slotId) {
      setAddTeamError('Please select a slot.');
      return;
    }
    addTeam(name, slotId);
    setNewTeamName('');
  };

  const startEditTeamName = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
  };

  const saveTeamName = () => {
    if (editingTeamId && editingTeamName.trim()) {
      updateTeam(editingTeamId, { name: editingTeamName.trim() });
    }
    setEditingTeamId(null);
    setEditingTeamName('');
  };

  const startEditingPoints = (team: Team) => {
    setEditingPointsTeamId(team.id);
    setEditingPointsValue(String(team.points));
  };

  const commitPoints = (teamId: string) => {
    const n = parseInt(editingPointsValue.replace(/\D/g, ''), 10);
    if (!Number.isNaN(n)) updateTeamPoints(teamId, Math.max(0, n));
    setEditingPointsTeamId(null);
    setEditingPointsValue('');
  };

  const getPointsDisplayValue = (team: Team) => {
    if (editingPointsTeamId === team.id) return editingPointsValue;
    return String(team.points);
  };

  const handleConfirmDelete = () => {
    if (deleteTeam) {
      removeTeam(deleteTeam.id);
      setDeleteTeam(null);
    }
  };

  const handleStartQuestion = () => {
    if (questions.length === 0) return;
    setQuizState({
      phase: 'question',
      currentQuestionIndex: 0,
      countdownSeconds: 10,
      revealed: false,
    });
  };

  const handleRevealAnswer = () => {
    setQuizState((prev) => ({ ...prev, phase: 'reveal', revealed: true }));
  };

  const handleNextQuestion = () => {
    const next = quizState.currentQuestionIndex + 1;
    if (next >= questions.length) {
      setQuizState({ phase: 'idle', currentQuestionIndex: 0, countdownSeconds: 10, revealed: false });
      return;
    }
    setQuizState({
      phase: 'question',
      currentQuestionIndex: next,
      countdownSeconds: 10,
      revealed: false,
    });
  };

  const handleStopQuiz = () => {
    setQuizState({ phase: 'idle', currentQuestionIndex: 0, countdownSeconds: 10, revealed: false });
  };

  const handleAddQuestion = () => {
    if (!questionForm.question?.trim() || questionForm.options.some((o) => !o?.trim())) return;
    addQuestion({
      question: questionForm.question.trim(),
      options: questionForm.options.map((o) => o.trim()) as [string, string, string, string],
      correctIndex: questionForm.correctIndex,
    });
    setQuestionForm({ question: '', options: ['', '', '', ''], correctIndex: 0 });
  };

  const handleSaveEditQuestion = () => {
    if (!editingQuestionId) return;
    updateQuestion(editingQuestionId, {
      question: questionForm.question.trim(),
      options: questionForm.options.map((o) => o.trim()) as [string, string, string, string],
      correctIndex: questionForm.correctIndex,
    });
    setEditingQuestionId(null);
    setQuestionForm({ question: '', options: ['', '', '', ''], correctIndex: 0 });
  };

  const startEditQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id);
    setQuestionForm({
      question: q.question,
      options: [...q.options],
      correctIndex: q.correctIndex,
    });
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Build a Bot Hackathon</p>
        </div>
        <div className="admin-header-actions">
          <Link to="/" className="admin-link">View leaderboard</Link>
          <button type="button" className="admin-btn admin-btn-outline" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Global scores toggle */}
      <section className="admin-section admin-scores-toggle-section">
        <div className="scores-toggle-wrap">
          <span className="scores-toggle-label">Scores visibility</span>
          <button
            type="button"
            className={`scores-toggle-btn ${settings.scoresHidden ? 'scores-hidden' : 'scores-visible'}`}
            onClick={() => setScoresHidden(!settings.scoresHidden)}
          >
            {settings.scoresHidden ? (
              <>🙈 Scores hidden</>
            ) : (
              <>👁️ Scores visible</>
            )}
          </button>
        </div>
      </section>

      {/* Team management by slot */}
      <section className="admin-section">
        <h2 className="admin-section-title">Team management</h2>
        <form
          className="admin-add-team"
          onSubmit={(e) => { e.preventDefault(); handleAddTeam(); }}
        >
          <input
            type="text"
            className="admin-input"
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => { setNewTeamName(e.target.value); setAddTeamError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
            aria-invalid={!!addTeamError}
            aria-describedby={addTeamError ? 'add-team-error' : undefined}
          />
          <select
            className="admin-select"
            value={newTeamSlotId || defaultSlotId}
            onChange={(e) => setNewTeamSlotId(e.target.value)}
          >
            {slots.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button type="submit" className="admin-btn admin-btn-primary">
            Add team
          </button>
          {addTeamError && (
            <p id="add-team-error" className="admin-add-team-error" role="alert">
              {addTeamError}
            </p>
          )}
        </form>

        {slots.map((slot) => {
          const slotTeams = getTeamsForSlot(slot.id);
          const timer = getTimer(slot.id);
          return (
            <div key={slot.id} className="admin-slot-card">
              <div className="admin-slot-header">
                <h3 className="admin-slot-name">{slot.name}</h3>
                <div className="admin-slot-timer-row">
                  {timer && (
                    <span className="admin-slot-timer-display">
                      {formatTimer(timer.remainingSeconds)}
                    </span>
                  )}
                  {!timer || timer.remainingSeconds <= 0 ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary admin-btn-sm"
                      onClick={() => startTimer(slot.id)}
                    >
                      Start timer (1h 30m)
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => timer.isPaused ? resumeTimer(slot.id) : pauseTimer(slot.id)}
                      >
                        {timer.isPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={() => resetTimer(slot.id)}
                      >
                        Reset
                      </button>
                    </>
                  )}
                </div>
              </div>
              <ul className="admin-team-list">
                {slotTeams.map((team) => (
                  <li key={team.id} className="admin-team-row">
                    {editingTeamId === team.id ? (
                      <div className="admin-team-name-edit">
                        <input
                          type="text"
                          className="admin-input admin-input-name"
                          value={editingTeamName}
                          onChange={(e) => setEditingTeamName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveTeamName(); if (e.key === 'Escape') { setEditingTeamId(null); setEditingTeamName(''); } }}
                          autoFocus
                        />
                        <button type="button" className="admin-btn admin-btn-sm admin-btn-primary" onClick={saveTeamName}>Save</button>
                        <button type="button" className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => { setEditingTeamId(null); setEditingTeamName(''); }}>Cancel</button>
                      </div>
                    ) : (
                      <span className="admin-team-name">{team.name}</span>
                    )}
                    {editingTeamId !== team.id && (
                      <button type="button" className="admin-btn admin-btn-sm admin-btn-outline admin-btn-edit-name" onClick={() => startEditTeamName(team)} aria-label="Edit team name">Edit</button>
                    )}
                    <div className="admin-team-points-wrap">
                      <span className="admin-team-points-label">Points</span>
                      <div className="admin-team-points">
                        <button
                          type="button"
                          className="admin-btn-points admin-btn-points-minus"
                          onClick={() => updateTeamPoints(team.id, Math.max(0, team.points - 1))}
                          aria-label="Decrease points"
                        >
                          −
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="admin-input admin-input-points"
                          value={getPointsDisplayValue(team)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setEditingPointsValue(raw);
                            const n = raw === '' ? 0 : parseInt(raw, 10);
                            if (!Number.isNaN(n)) updateTeamPoints(team.id, Math.max(0, n));
                          }}
                          onFocus={() => startEditingPoints(team)}
                          onBlur={() => commitPoints(team.id)}
                          aria-label={`Points for ${team.name}`}
                        />
                        <button
                          type="button"
                          className="admin-btn-points admin-btn-points-plus"
                          onClick={() => updateTeamPoints(team.id, team.points + 1)}
                          aria-label="Increase points"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {editingTeamId !== team.id && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => setDeleteTeam(team)}
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {slotTeams.length === 0 && (
                <p className="admin-slot-empty">No teams in this slot yet.</p>
              )}
            </div>
          );
        })}
      </section>

      {/* Quiz management */}
      <section className="admin-section">
        <h2 className="admin-section-title">Quiz management</h2>
        <div className="admin-quiz-controls">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleStartQuestion}
            disabled={questions.length === 0}
          >
            Start quiz (first question)
          </button>
          {quizState.phase !== 'idle' && (
            <>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleRevealAnswer}>
                Reveal answer
              </button>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleNextQuestion}>
                Next question
              </button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={handleStopQuiz}>
                Stop quiz
              </button>
            </>
          )}
        </div>

        <div className="admin-question-form">
          <input
            type="text"
            className="admin-input"
            placeholder="Question text"
            value={questionForm.question}
            onChange={(e) => setQuestionForm((f) => ({ ...f, question: e.target.value }))}
          />
          {([0, 1, 2, 3] as const).map((i) => (
            <label key={i} className="admin-option-row">
              <input
                type="radio"
                name="correct"
                checked={questionForm.correctIndex === i}
                onChange={() => setQuestionForm((f) => ({ ...f, correctIndex: i }))}
              />
              <input
                type="text"
                className="admin-input admin-input-option"
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                value={questionForm.options[i] ?? ''}
                onChange={(e) => {
                  const opts = [...(questionForm.options || ['', '', '', ''])] as [string, string, string, string];
                  opts[i] = e.target.value;
                  setQuestionForm((f) => ({ ...f, options: opts }));
                }}
              />
            </label>
          ))}
          {editingQuestionId ? (
            <>
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleSaveEditQuestion}>
                Save changes
              </button>
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => { setEditingQuestionId(null); setQuestionForm({ question: '', options: ['', '', '', ''], correctIndex: 0 }); }}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleAddQuestion}>
              Add question
            </button>
          )}
        </div>
        <ul className="admin-question-list">
          {questions.map((q) => (
            <li key={q.id} className="admin-question-item">
              <span className="admin-question-item-text">{q.question}</span>
              <span className="admin-question-item-correct">✓ {String.fromCharCode(65 + q.correctIndex)}</span>
              <button type="button" className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => startEditQuestion(q)}>Edit</button>
              <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeQuestion(q.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      {deleteTeam && (
        <DeleteTeamModal
          teamName={deleteTeam.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTeam(null)}
        />
      )}
    </div>
  );
}
