import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { Team } from '../../types';
import { generateLeaderboardPdf } from '../../utils/generateLeaderboardPdf';
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
    problemStatements,
    addTeam,
    updateTeamPoints,
    updateTeam,
    removeTeam,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setScoresHidden,
    setMaxTeamsPerSlot,
    addProblemStatement,
    removeProblemStatement,
    assignAndGetProblemAssignments,
    resetProblemStatementAssignments,
    refreshFromApi,
  } = useApp();
  const { logout } = useAuth();

  const defaultSlotId = slots[0]?.id ?? '';
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlotId, setNewTeamSlotId] = useState(defaultSlotId);
  const [addTeamError, setAddTeamError] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [editingPointsTeamId, setEditingPointsTeamId] = useState<string | null>(null);
  const [editingPointsValue, setEditingPointsValue] = useState('');
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [problemTitle, setProblemTitle] = useState('');
  const [problemContent, setProblemContent] = useState('');
  const problemContentEditableRef = useRef<HTMLDivElement>(null);
  const [problemSlotId, setProblemSlotId] = useState(defaultSlotId);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string; assignments?: { email: string; teamName: string; problemTitle: string; problemContent: string }[] } | null>(null);

  useEffect(() => {
    if (defaultSlotId && !newTeamSlotId) setNewTeamSlotId(defaultSlotId);
  }, [defaultSlotId, newTeamSlotId]);
  useEffect(() => {
    if (defaultSlotId && !problemSlotId) setProblemSlotId(defaultSlotId);
  }, [defaultSlotId, problemSlotId]);

  const getTimer = (slotId: string) => timers.find((t) => t.slotId === slotId);
  const getTeamsForSlot = (slotId: string) => teams.filter((t) => t.slotId === slotId);

  const handleAddTeam = () => {
    setAddTeamError('');
    const name = newTeamName.trim();
    const slotId = newTeamSlotId || defaultSlotId;
    if (!name) {
      setAddTeamError('Please enter a team name.');
      return;
    }
    if (!slotId) {
      setAddTeamError('Please select a slot.');
      return;
    }
    addTeam(name, slotId);
    setNewTeamName('');
  };

  const startEditTeamName = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.name);
  };

  const saveTeamName = () => {
    if (editingTeamId && editingTeamName.trim()) {
      updateTeam(editingTeamId, { name: editingTeamName.trim() });
    }
    setEditingTeamId(null);
    setEditingTeamName('');
  };

  const startEditingPoints = (team: Team) => {
    setEditingPointsTeamId(team.id);
    setEditingPointsValue(String(team.points));
  };

  const commitPoints = (teamId: string) => {
    const n = parseInt(editingPointsValue.replace(/\D/g, ''), 10);
    if (!Number.isNaN(n)) updateTeamPoints(teamId, Math.max(0, n));
    setEditingPointsTeamId(null);
    setEditingPointsValue('');
  };

  const getPointsDisplayValue = (team: Team) => {
    if (editingPointsTeamId === team.id) return editingPointsValue;
    return String(team.points);
  };

  const handleConfirmDelete = () => {
    if (deleteTeam) {
      removeTeam(deleteTeam.id);
      setDeleteTeam(null);
    }
  };

  const handleAddProblemStatement = () => {
    const rawContent = problemContentEditableRef.current?.innerHTML ?? '';
    const textContent = problemContentEditableRef.current?.innerText?.trim() ?? '';
    if (!problemSlotId || !problemTitle.trim() || !textContent) return;
    addProblemStatement({ slotId: problemSlotId, title: problemTitle.trim(), content: rawContent.trim() });
    setProblemTitle('');
    setProblemContent('');
    if (problemContentEditableRef.current) problemContentEditableRef.current.innerHTML = '';
  };

  const handleBoldProblemContent = () => {
    problemContentEditableRef.current?.focus();
    document.execCommand('bold', false);
  };

  const handleAssignAndSend = async () => {
    setSendResult(null);
    const assignments = assignAndGetProblemAssignments();
    if (assignments.length === 0) {
      const teamsWithEmail = teams.filter((t) => t.leaderEmail?.trim());
      const hasStatements = problemStatements.length > 0;
      let msg = 'No assignments generated. ';
      if (teamsWithEmail.length === 0) msg += 'No teams have a leader Gmail—teams must register via the Register page.';
      else if (!hasStatements) msg += 'Add at least one problem statement.';
      else msg += "Each team's slot must have at least one problem statement; add statements to the slots your teams are in.";
      setSendResult({ ok: false, message: msg });
      return;
    }
    try {
      const res = await fetch('/api/send-problem-statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSendResult({ ok: true, message: data.message ?? `Emails sent to ${assignments.length} team(s).`, assignments });
      } else {
        setSendResult({ ok: false, message: data.error ?? data.message ?? 'Email server error. Download assignments below to email manually.', assignments });
      }
    } catch {
      setSendResult({ ok: false, message: 'Could not reach email server. Run "npm run server" and set Gmail env vars (see README). You can download assignments below.', assignments });
    }
  };

  const downloadAssignmentsCsv = () => {
    if (!sendResult?.assignments?.length) return;
    const headers = 'Email,Team Name,Problem Title,Problem Content\n';
    const rows = sendResult.assignments.map((a) =>
      `"${a.email}","${a.teamName.replace(/"/g, '""')}","${a.problemTitle.replace(/"/g, '""')}","${a.problemContent.replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'problem-assignments.csv';
    a.click();
    URL.revokeObjectURL(url);
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

      {/* Global scores toggle + max teams per slot */}
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
        <div className="admin-max-teams-wrap">
          <label className="admin-max-teams-label">Max teams per slot (for registration)</label>
          <input
            type="number"
            className="admin-input admin-input-max-teams"
            min={1}
            value={settings.maxTeamsPerSlot}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) setMaxTeamsPerSlot(n);
            }}
          />
        </div>
      </section>

      {/* Team management by slot */}
      <section className="admin-section">
        <div className="admin-section-header-row">
          <h2 className="admin-section-title">Team management</h2>
          <button
            type="button"
            className="admin-btn admin-btn-pdf"
            onClick={() => generateLeaderboardPdf(teams, slots)}
            disabled={teams.length === 0}
          >
            Generate PDF
          </button>
        </div>
        <form
          className="admin-add-team"
          onSubmit={(e) => { e.preventDefault(); handleAddTeam(); }}
        >
          <input
            type="text"
            className="admin-input"
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => { setNewTeamName(e.target.value); setAddTeamError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
            aria-invalid={!!addTeamError}
            aria-describedby={addTeamError ? 'add-team-error' : undefined}
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
          <button type="submit" className="admin-btn admin-btn-primary">
            Add team
          </button>
          {addTeamError && (
            <p id="add-team-error" className="admin-add-team-error" role="alert">
              {addTeamError}
            </p>
          )}
        </form>

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
                    {editingTeamId === team.id ? (
                      <div className="admin-team-name-edit">
                        <input
                          type="text"
                          className="admin-input admin-input-name"
                          value={editingTeamName}
                          onChange={(e) => setEditingTeamName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveTeamName(); if (e.key === 'Escape') { setEditingTeamId(null); setEditingTeamName(''); } }}
                          autoFocus
                        />
                        <button type="button" className="admin-btn admin-btn-sm admin-btn-primary" onClick={saveTeamName}>Save</button>
                        <button type="button" className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => { setEditingTeamId(null); setEditingTeamName(''); }}>Cancel</button>
                      </div>
                    ) : (
                      <span className="admin-team-name">{team.name}</span>
                    )}
                    <span className="admin-team-assigned" title="Assigned problem statement">
                      Problem: {team.assignedProblemId
                        ? (problemStatements.find((p) => p.id === team.assignedProblemId)?.title ?? '—')
                        : '—'}
                    </span>
                    {editingTeamId !== team.id && (
                      <button type="button" className="admin-btn admin-btn-sm admin-btn-outline admin-btn-edit-name" onClick={() => startEditTeamName(team)} aria-label="Edit team name">Edit</button>
                    )}
                    <div className="admin-team-points-wrap">
                      <span className="admin-team-points-label">Points</span>
                      <div className="admin-team-points">
                        <button
                          type="button"
                          className="admin-btn-points admin-btn-points-minus"
                          onClick={() => updateTeamPoints(team.id, Math.max(0, team.points - 1))}
                          aria-label="Decrease points"
                        >
                          −
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="admin-input admin-input-points"
                          value={getPointsDisplayValue(team)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setEditingPointsValue(raw);
                            const n = raw === '' ? 0 : parseInt(raw, 10);
                            if (!Number.isNaN(n)) updateTeamPoints(team.id, Math.max(0, n));
                          }}
                          onFocus={() => startEditingPoints(team)}
                          onBlur={() => commitPoints(team.id)}
                          aria-label={`Points for ${team.name}`}
                        />
                        <button
                          type="button"
                          className="admin-btn-points admin-btn-points-plus"
                          onClick={() => updateTeamPoints(team.id, team.points + 1)}
                          aria-label="Increase points"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {editingTeamId !== team.id && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => setDeleteTeam(team)}
                      >
                        Delete
                      </button>
                    )}
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

      {/* Problem statements (slot-wise, manual text) */}
      <section className="admin-section">
        <h2 className="admin-section-title">Problem statements (slot-wise)</h2>
        <p className="admin-section-desc">Add problem statements per slot. Each team gets one random statement from their slot (max 3 teams per statement). Assign & send emails to team leaders (Gmail).</p>
        <button
          type="button"
          className="admin-btn admin-btn-outline"
          onClick={() => refreshFromApi().catch(() => {})}
          title="Fetch latest state from shared storage (other admins' changes)"
        >
          Refresh from shared state
        </button>
        <div className="admin-problem-form">
          <select
            className="admin-input"
            value={problemSlotId}
            onChange={(e) => setProblemSlotId(e.target.value)}
            aria-label="Slot for this problem"
          >
            {slots.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="text"
            className="admin-input"
            placeholder="Problem title"
            value={problemTitle}
            onChange={(e) => setProblemTitle(e.target.value)}
          />
          <div className="admin-problem-content-wrap">
            <div className="admin-problem-content-toolbar">
              <button type="button" className="admin-btn admin-btn-sm admin-btn-outline" onClick={handleBoldProblemContent} title="Bold selected text">
                <strong>B</strong>
              </button>
            </div>
            <div
              ref={problemContentEditableRef}
              className="admin-input admin-textarea admin-contenteditable"
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Problem statement (full text)"
              onInput={() => setProblemContent(problemContentEditableRef.current?.innerText ?? '')}
            />
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleAddProblemStatement} disabled={!problemSlotId || !problemTitle.trim() || !problemContent.trim()}>
            Add problem statement
          </button>
        </div>
        {slots.map((slot) => {
          const slotStatements = problemStatements.filter((p) => p.slotId === slot.id);
          return (
            <div key={slot.id} className="admin-slot-statements">
              <h3 className="admin-slot-name" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{slot.name} — {slotStatements.length} statement(s)</h3>
              <ul className="admin-problem-list">
                {slotStatements.map((p) => (
                  <li key={p.id} className="admin-problem-item">
                    <span className="admin-problem-item-title">{p.title}</span>
                    <span className="admin-problem-item-count">Assigned: {p.timesAssigned}/3</span>
                    <button type="button" className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => resetProblemStatementAssignments(p.id)} title="Reset assignment count and clear from teams">Reset</button>
                    <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeProblemStatement(p.id)}>Delete</button>
                  </li>
                ))}
              </ul>
              {slotStatements.length === 0 && <p className="admin-slot-empty">No problem statements for this slot yet.</p>}
            </div>
          );
        })}
        <div className="admin-send-actions">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleAssignAndSend}
            disabled={problemStatements.length === 0}
          >
            Assign & send problem statements
          </button>
          {sendResult && (
            <div className="admin-send-result">
              <p className={sendResult.ok ? 'admin-send-ok' : 'admin-send-err'}>{sendResult.message}</p>
              {sendResult.assignments && sendResult.assignments.length > 0 && (
                <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={downloadAssignmentsCsv}>
                  Download assignments (CSV)
                </button>
              )}
            </div>
          )}
        </div>
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
