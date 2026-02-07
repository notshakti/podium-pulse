import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Podium } from './Podium';
import { LeaderboardTable } from './LeaderboardTable';
import './LeaderboardPage.css';

export function LeaderboardPage() {
  const { participants } = useApp();

  const sorted = useMemo(() => {
    return [...participants].sort((a, b) => b.points - a.points);
  }, [participants]);

  const [first, second, third] = useMemo(() => {
    return [sorted[0] ?? null, sorted[1] ?? null, sorted[2] ?? null];
  }, [sorted]);

  const rest = useMemo(() => sorted.slice(3), [sorted]);

  return (
    <div className="leaderboard-page">
      <header className="leaderboard-header">
        <h1 className="leaderboard-title">Build a Bot</h1>
        <p className="leaderboard-subtitle">Leaderboard</p>
      </header>
      <section className="leaderboard-podium-section" aria-label="Top 3">
        <Podium first={first} second={second} third={third} />
      </section>
      {rest.length > 0 && (
        <section className="leaderboard-rest-section" aria-label="Remaining rankings">
          <h2 className="leaderboard-rest-title">All rankings</h2>
          <LeaderboardTable participants={rest} startRank={4} />
        </section>
      )}
    </div>
  );
}
