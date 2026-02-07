import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { QuizQuestion } from '../../types';
import './AdminPanel.css';

export function AdminPanel() {
  const {
    participants,
    questions,
    quizState,
    setQuizState,
    addParticipant,
    updateParticipantScore,
    addQuestion,
    removeQuestion,
  } = useApp();

  const [newParticipantName, setNewParticipantName] = useState('');
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [editingScoreValue, setEditingScoreValue] = useState('');
  const [questionForm, setQuestionForm] = useState<Partial<QuizQuestion> & { question: string; options: [string, string, string, string]; correctIndex: number }>({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });

  const currentQuestion = questions[quizState.currentQuestionIndex] ?? null;

  const handleAddParticipant = () => {
    if (!newParticipantName.trim()) return;
    addParticipant(newParticipantName.trim());
    setNewParticipantName('');
  };

  const handleSaveScore = (id: string) => {
    const n = parseInt(editingScoreValue, 10);
    if (!Number.isNaN(n)) updateParticipantScore(id, n);
    setEditingScoreId(null);
    setEditingScoreValue('');
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

  const handleStartNextQuestion = () => {
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

  const handleRevealAnswer = () => {
    setQuizState((prev) => ({ ...prev, phase: 'reveal', revealed: true }));
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

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1 className="admin-title">Admin Control</h1>
        <p className="admin-subtitle">Build a Bot Hackathon</p>
      </header>

      <section className="admin-section">
        <h2 className="admin-section-title">Quiz control</h2>
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
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleStartNextQuestion}>
                Next question
              </button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={handleStopQuiz}>
                Stop quiz
              </button>
            </>
          )}
        </div>
        {quizState.phase !== 'idle' && currentQuestion && (
          <p className="admin-current-question-label">
            Current: Q{quizState.currentQuestionIndex + 1} – {currentQuestion.question.slice(0, 50)}…
          </p>
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Quiz questions</h2>
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
                placeholder={`Option ${i + 1}`}
                value={questionForm.options[i] ?? ''}
                onChange={(e) => {
                  const opts = [...(questionForm.options || ['', '', '', ''])] as [string, string, string, string];
                  opts[i] = e.target.value;
                  setQuestionForm((f) => ({ ...f, options: opts }));
                }}
              />
            </label>
          ))}
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleAddQuestion}>
            Add question
          </button>
        </div>
        <ul className="admin-question-list">
          {questions.map((q) => (
            <li key={q.id} className="admin-question-item">
              <span className="admin-question-item-text">{q.question}</span>
              <span className="admin-question-item-correct">✓ Option {q.correctIndex + 1}</span>
              <button
                type="button"
                className="admin-btn admin-btn-small admin-btn-danger"
                onClick={() => removeQuestion(q.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Participants & scores</h2>
        <div className="admin-add-participant">
          <input
            type="text"
            className="admin-input"
            placeholder="New participant name"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
          />
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleAddParticipant}>
            Add
          </button>
        </div>
        <div className="admin-scores-table-wrap">
          <table className="admin-scores-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Points</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    {editingScoreId === p.id ? (
                      <input
                        type="number"
                        className="admin-input admin-input-inline"
                        value={editingScoreValue}
                        onChange={(e) => setEditingScoreValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveScore(p.id)}
                        min={0}
                        autoFocus
                      />
                    ) : (
                      p.points
                    )}
                  </td>
                  <td>
                    {editingScoreId === p.id ? (
                      <button type="button" className="admin-btn admin-btn-small" onClick={() => handleSaveScore(p.id)}>
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn admin-btn-small"
                        onClick={() => {
                          setEditingScoreId(p.id);
                          setEditingScoreValue(String(p.points));
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
