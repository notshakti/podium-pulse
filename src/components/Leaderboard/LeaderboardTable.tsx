import type { Participant } from '../../types';
import './LeaderboardTable.css';

interface LeaderboardTableProps {
  participants: Participant[];
  startRank: number;
}

export function LeaderboardTable({ participants, startRank }: LeaderboardTableProps) {
  return (
    <div className="leaderboard-table-wrap">
      <ul className="leaderboard-table" role="list">
        {participants.map((p, i) => (
          <li key={p.id} className="leaderboard-row" style={{ animationDelay: `${i * 0.04}s` }}>
            <span className="leaderboard-row__rank">{startRank + i}</span>
            <span className="leaderboard-row__name">{p.name}</span>
            <span className="leaderboard-row__points">{p.points} pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
