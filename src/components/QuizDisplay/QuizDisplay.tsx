import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import './QuizDisplay.css';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function QuizDisplay() {
  const { questions, quizState, setQuizState } = useApp();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const question = questions[quizState.currentQuestionIndex] ?? null;

  useEffect(() => {
    if (quizState.phase !== 'question' || !question) return;
    if (quizState.revealed) return;

    const tick = () => {
      setQuizState((prev) => {
        if (prev.phase !== 'question' || prev.countdownSeconds <= 0) return prev;
        const next = prev.countdownSeconds - 1;
        if (next <= 0) {
          return { ...prev, phase: 'reveal', countdownSeconds: 0, revealed: true };
        }
        return { ...prev, countdownSeconds: next };
      });
    };

    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [quizState.phase, question, quizState.revealed, quizState.countdownSeconds, setQuizState]);

  if (quizState.phase === 'idle') {
    return (
      <div className="quiz-display quiz-display-idle">
        <h1 className="quiz-display-title">Build a Bot</h1>
        <p className="quiz-display-subtitle">Hackathon Quiz</p>
        <p className="quiz-display-wait">Waiting for the next question…</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="quiz-display quiz-display-idle">
        <p className="quiz-display-wait">No question loaded.</p>
      </div>
    );
  }

  const showReveal = quizState.phase === 'reveal' || quizState.revealed;

  return (
    <div className="quiz-display quiz-display-active">
      <div className="quiz-display-question-block">
        <h2 className="quiz-display-question">{question.question}</h2>
        {quizState.phase === 'question' && (
          <div className="quiz-display-countdown" role="timer" aria-live="polite">
            {quizState.countdownSeconds}
          </div>
        )}
      </div>
      <div className="quiz-display-options">
        {question.options.map((text, i) => (
          <div
            key={i}
            className={`quiz-display-option ${showReveal && i === question.correctIndex ? 'quiz-display-option--correct' : ''} ${showReveal && i !== question.correctIndex ? 'quiz-display-option--wrong' : ''}`}
          >
            <span className="quiz-display-option-label">{OPTION_LABELS[i]}</span>
            <span className="quiz-display-option-text">{text}</span>
            {showReveal && i === question.correctIndex && <span className="quiz-display-option-check">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
