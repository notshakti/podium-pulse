import type { Team } from '../../types';
import './Podium.css';

export interface PodiumEntry {
  team: Team;
  slotName?: string;
}

interface PodiumProps {
  first: PodiumEntry | null;
  second: PodiumEntry | null;
  third: PodiumEntry | null;
  scoresHidden: boolean;
}

const PLACE_COLORS = {
  first: 'var(--podium-first)',
  second: 'var(--podium-second)',
  third: 'var(--podium-third)',
};

function formatPoints(points: number, hidden: boolean): string {
  return hidden ? '—' : `${points} pts`;
}

export function Podium({ first, second, third, scoresHidden }: PodiumProps) {
  return (
    <div className="podium-wrap" role="group" aria-label="Top 3 leaderboard podium">
      <div className="podium podium-second" data-place="2">
        <div className="podium__block" style={{ ['--podium-color' as string]: PLACE_COLORS.second }}>
          <span className="podium__rank" aria-hidden>2</span>
          <div className="podium__avatar" aria-hidden />
          <p className="podium__name">{second?.team.name ?? '—'}</p>
          {second?.slotName && <p className="podium__slot">{second.slotName}</p>}
          <p className="podium__points">{second != null ? formatPoints(second.team.points, scoresHidden) : '—'}</p>
        </div>
      </div>
      <div className="podium podium-first" data-place="1">
        <div className="podium__block podium__block--tall" style={{ ['--podium-color' as string]: PLACE_COLORS.first }}>
          <span className="podium__rank" aria-hidden>1</span>
          <div className="podium__avatar podium__avatar--first" aria-hidden />
          <p className="podium__name">{first?.team.name ?? '—'}</p>
          {first?.slotName && <p className="podium__slot">{first.slotName}</p>}
          <p className="podium__points">{first != null ? formatPoints(first.team.points, scoresHidden) : '—'}</p>
        </div>
      </div>
      <div className="podium podium-third" data-place="3">
        <div className="podium__block" style={{ ['--podium-color' as string]: PLACE_COLORS.third }}>
          <span className="podium__rank" aria-hidden>3</span>
          <div className="podium__avatar" aria-hidden />
          <p className="podium__name">{third?.team.name ?? '—'}</p>
          {third?.slotName && <p className="podium__slot">{third.slotName}</p>}
          <p className="podium__points">{third != null ? formatPoints(third.team.points, scoresHidden) : '—'}</p>
        </div>
      </div>
    </div>
  );
}
