import { useState } from 'react';
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

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlotId, setNewTeamSlotId] = useState('');
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [questionForm, setQuestionForm] = useState<Partial<QuizQuestion> & { question: string; options: [string, string, string, string]; correctIndex: number }>({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const defaultSlotId = slots[0]?.id ?? '';

  const getTimer = (slotId: string) => timers.find((t) => t.slotId === slotId);
  const getTeamsForSlot = (slotId: string) => teams.filter((t) => t.slotId === slotId);

  const handleAddTeam = () => {
    const slotId = newTeamSlotId || defaultSlotId;
    if (!newTeamName.trim() || !slotId) return;
    addTeam(newTeamName.trim(), slotId);
    setNewTeamName('');
    setNewTeamSlotId('');
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
        <div className="admin-add-team">
          <input
            type="text"
            className="admin-input"
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
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
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleAddTeam}>
            Add team
          </button>
        </div>

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
                    <span className="admin-team-name">{team.name}</span>
                    <div className="admin-team-points">
                      <button
                        type="button"
                        className="admin-btn-icon"
                        onClick={() => updateTeamPoints(team.id, Math.max(0, team.points - 1))}
                        aria-label="Decrease points"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="admin-input admin-input-points"
                        min={0}
                        value={team.points}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isNaN(n)) updateTeamPoints(team.id, Math.max(0, n));
                        }}
                      />
                      <button
                        type="button"
                        className="admin-btn-icon"
                        onClick={() => updateTeamPoints(team.id, team.points + 1)}
                        aria-label="Increase points"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => setDeleteTeam(team)}
                    >
                      Delete
                    </button>
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
