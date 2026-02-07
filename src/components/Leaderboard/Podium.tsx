import type { Participant } from '../../types';
import './Podium.css';

interface PodiumProps {
  first: Participant | null;
  second: Participant | null;
  third: Participant | null;
}

const PLACE_COLORS = {
  first: 'var(--podium-first)',
  second: 'var(--podium-second)',
  third: 'var(--podium-third)',
};

export function Podium({ first, second, third }: PodiumProps) {
  return (
    <div className="podium-wrap" role="group" aria-label="Top 3 leaderboard podium">
      {/* Order: 2nd (left), 1st (center), 3rd (right) */}
      <div className="podium podium-second" data-place="2">
        <div className="podium__block" style={{ ['--podium-color' as string]: PLACE_COLORS.second }}>
          <span className="podium__rank" aria-hidden>2</span>
          <div className="podium__avatar" aria-hidden />
          <p className="podium__name">{second?.name ?? '—'}</p>
          <p className="podium__points">{second != null ? `${second.points} pts` : '—'}</p>
        </div>
      </div>
      <div className="podium podium-first" data-place="1">
        <div className="podium__block podium__block--tall" style={{ ['--podium-color' as string]: PLACE_COLORS.first }}>
          <span className="podium__rank" aria-hidden>1</span>
          <div className="podium__avatar podium__avatar--first" aria-hidden />
          <p className="podium__name">{first?.name ?? '—'}</p>
          <p className="podium__points">{first != null ? `${first.points} pts` : '—'}</p>
        </div>
      </div>
      <div className="podium podium-third" data-place="3">
        <div className="podium__block" style={{ ['--podium-color' as string]: PLACE_COLORS.third }}>
          <span className="podium__rank" aria-hidden>3</span>
          <div className="podium__avatar" aria-hidden />
          <p className="podium__name">{third?.name ?? '—'}</p>
          <p className="podium__points">{third != null ? `${third.points} pts` : '—'}</p>
        </div>
      </div>
    </div>
  );
}
