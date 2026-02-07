import type { Team } from '../../types';
import './LeaderboardTable.css';

interface LeaderboardTableProps {
  teams: Team[];
  startRank: number;
  scoresHidden: boolean;
  showSlot?: boolean;
  getSlotName?: (slotId: string) => string;
}

export function LeaderboardTable({
  teams,
  startRank,
  scoresHidden,
  showSlot = false,
  getSlotName = () => '',
}: LeaderboardTableProps) {
  return (
    <div className={`leaderboard-table-wrap ${showSlot ? 'show-slot' : ''}`}>
      <ul className="leaderboard-table" role="list">
        {teams.map((team, i) => (
          <li key={team.id} className="leaderboard-row" style={{ animationDelay: `${i * 0.04}s` }}>
            <span className="leaderboard-row__rank">{startRank + i}</span>
            <span className="leaderboard-row__name">{team.name}</span>
            {showSlot && (
              <span className="leaderboard-row__slot">{getSlotName(team.slotId)}</span>
            )}
            <span className="leaderboard-row__points">
              {scoresHidden ? '—' : `${team.points} pts`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
