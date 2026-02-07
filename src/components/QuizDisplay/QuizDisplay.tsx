import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import './QuizDisplay.css';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const REVEAL_DURATION_MS = 4000; // Show correct answer for 4 sec then go to next

export function QuizDisplay() {
  const { questions, quizState, setQuizState } = useApp();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const question = questions[quizState.currentQuestionIndex] ?? null;

  // When timer runs out we reveal; after a short delay auto-advance to next question (or end quiz)
  useEffect(() => {
    if (quizState.phase !== 'reveal' || !quizState.revealed) return;

    const timeout = setTimeout(() => {
      const nextIndex = quizState.currentQuestionIndex + 1;
      if (nextIndex >= questions.length) {
        setQuizState({ phase: 'idle', currentQuestionIndex: 0, countdownSeconds: 10, revealed: false });
      } else {
        setQuizState({
          phase: 'question',
          currentQuestionIndex: nextIndex,
          countdownSeconds: 10,
          revealed: false,
        });
      }
    }, REVEAL_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [quizState.phase, quizState.revealed, quizState.currentQuestionIndex, questions.length, setQuizState]);

  // Countdown: run interval only when we're in question phase and not revealed. Don't depend on countdownSeconds so the interval isn't recreated every tick.
  useEffect(() => {
    if (quizState.phase !== 'question' || !question || quizState.revealed) return;

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
  }, [quizState.phase, quizState.revealed, question, setQuizState]);

  const handleStartQuiz = () => {
    if (questions.length === 0) return;
    setQuizState({
      phase: 'question',
      currentQuestionIndex: 0,
      countdownSeconds: 10,
      revealed: false,
    });
  };

  if (quizState.phase === 'idle') {
    return (
      <div className="quiz-display quiz-display-idle">
        <h1 className="quiz-display-title">Build a Bot</h1>
        <p className="quiz-display-subtitle">Hackathon Quiz</p>
        {questions.length > 0 ? (
          <>
            <p className="quiz-display-wait">Ready to start. Click below to show the first question.</p>
            <button
              type="button"
              className="quiz-display-start-btn"
              onClick={handleStartQuiz}
            >
              Start Quiz
            </button>
            <p className="quiz-display-question-count">{questions.length} question{questions.length !== 1 ? 's' : ''} loaded</p>
          </>
        ) : (
          <p className="quiz-display-wait">No questions yet. Add questions in the Admin dashboard.</p>
        )}
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
  const countdownTotal = 10;
  const countdownProgress = (quizState.countdownSeconds / countdownTotal) * 100;

  return (
    <div className="quiz-display quiz-display-active">
      <div className="quiz-display-question-block">
        <h2 className="quiz-display-question">{question.question}</h2>
        {quizState.phase === 'question' && (
          <>
            <div className="quiz-display-countdown" role="timer" aria-live="polite">
              {quizState.countdownSeconds}
            </div>
            <div className="quiz-display-progress-wrap" role="progressbar" aria-valuenow={quizState.countdownSeconds} aria-valuemin={0} aria-valuemax={countdownTotal}>
              <div className="quiz-display-progress-bar" style={{ width: `${countdownProgress}%` }} />
            </div>
          </>
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
            {showReveal && i === question.correctIndex && (
            <>
              <span className="quiz-display-option-check">✓</span>
              <span className="quiz-display-correct-label">Correct!</span>
            </>
          )}
          </div>
        ))}
      </div>
    </div>
  );
}
