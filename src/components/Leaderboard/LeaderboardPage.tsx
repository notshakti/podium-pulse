import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Podium, type PodiumEntry } from './Podium';
import { LeaderboardTable } from './LeaderboardTable';
import './LeaderboardPage.css';

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function LeaderboardPage() {
  const { teams, slots, timers, settings } = useApp();
  const [view, setView] = useState<'overall' | 'slot'>('overall');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const slotMap = useMemo(() => {
    const m: Record<string, string> = {};
    slots.forEach((s) => { m[s.id] = s.name; });
    return m;
  }, [slots]);

  const getSlotName = (slotId: string) => slotMap[slotId] ?? '—';

  const sortedOverall = useMemo(() => [...teams].sort((a, b) => b.points - a.points), [teams]);

  const overallFirst: PodiumEntry | null = sortedOverall[0] ? { team: sortedOverall[0], slotName: getSlotName(sortedOverall[0].slotId) } : null;
  const overallSecond: PodiumEntry | null = sortedOverall[1] ? { team: sortedOverall[1], slotName: getSlotName(sortedOverall[1].slotId) } : null;
  const overallThird: PodiumEntry | null = sortedOverall[2] ? { team: sortedOverall[2], slotName: getSlotName(sortedOverall[2].slotId) } : null;
  const overallRest = sortedOverall.slice(3);

  const currentSlotId = view === 'slot' ? (selectedSlotId || slots[0]?.id) : null;
  const slotTeams = useMemo(() => {
    if (!currentSlotId) return [];
    return [...teams].filter((t) => t.slotId === currentSlotId).sort((a, b) => b.points - a.points);
  }, [teams, currentSlotId]);

  const slotFirst: PodiumEntry | null = slotTeams[0] ? { team: slotTeams[0] } : null;
  const slotSecond: PodiumEntry | null = slotTeams[1] ? { team: slotTeams[1] } : null;
  const slotThird: PodiumEntry | null = slotTeams[2] ? { team: slotTeams[2] } : null;
  const slotRest = slotTeams.slice(3);

  const slotTimer = currentSlotId ? timers.find((t) => t.slotId === currentSlotId) : null;
  const showSlotTimer = slotTimer && slotTimer.remainingSeconds > 0;

  return (
    <div className="leaderboard-page">
      <header className="leaderboard-header">
        <h1 className="leaderboard-title">Build a Bot</h1>
        <p className="leaderboard-subtitle">Leaderboard</p>
        <div className="leaderboard-tabs">
          <button
            type="button"
            className={`leaderboard-tab ${view === 'overall' ? 'active' : ''}`}
            onClick={() => setView('overall')}
          >
            Overall
          </button>
          <button
            type="button"
            className={`leaderboard-tab ${view === 'slot' ? 'active' : ''}`}
            onClick={() => { setView('slot'); setSelectedSlotId(slots[0]?.id ?? null); }}
          >
            By slot
          </button>
        </div>
      </header>

      {view === 'overall' && (
        <>
          <section className="leaderboard-podium-section" aria-label="Top 3 overall">
            <Podium
              first={overallFirst}
              second={overallSecond}
              third={overallThird}
              scoresHidden={settings.scoresHidden}
            />
          </section>
          {overallRest.length > 0 && (
            <section className="leaderboard-rest-section" aria-label="Remaining rankings">
              <h2 className="leaderboard-rest-title">All rankings</h2>
              <LeaderboardTable
                teams={overallRest}
                startRank={4}
                scoresHidden={settings.scoresHidden}
                showSlot
                getSlotName={getSlotName}
              />
            </section>
          )}
        </>
      )}

      {view === 'slot' && (
        <>
          <div className="leaderboard-slot-nav">
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`leaderboard-slot-btn ${currentSlotId === slot.id ? 'active' : ''}`}
                onClick={() => setSelectedSlotId(slot.id)}
              >
                {slot.name}
              </button>
            ))}
          </div>
          {showSlotTimer && (
            <div className="leaderboard-slot-timer" role="timer">
              {formatTimer(slotTimer.remainingSeconds)}
            </div>
          )}
          <section className="leaderboard-podium-section" aria-label={`Top 3 ${currentSlotId ? getSlotName(currentSlotId) : ''}`}>
            <Podium
              first={slotFirst}
              second={slotSecond}
              third={slotThird}
              scoresHidden={settings.scoresHidden}
            />
          </section>
          {slotRest.length > 0 && (
            <section className="leaderboard-rest-section" aria-label="Remaining in slot">
              <h2 className="leaderboard-rest-title">Rankings in this slot</h2>
              <LeaderboardTable
                teams={slotRest}
                startRank={4}
                scoresHidden={settings.scoresHidden}
              />
            </section>
          )}
          {slotTeams.length === 0 && (
            <p className="leaderboard-slot-empty">No teams in this slot.</p>
          )}
        </>
      )}
    </div>
  );
}
