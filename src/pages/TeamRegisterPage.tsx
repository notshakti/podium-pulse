import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './TeamRegisterPage.css';

export function TeamRegisterPage() {
  const { registerTeam, assignOneProblemAndGetAssignment } = useApp();
  const [teamName, setTeamName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ slotName: string; emailSent?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    if (!teamName.trim()) {
      setError('Please enter your team name.');
      return;
    }
    if (!leaderEmail.trim()) {
      setError('Please enter the team leader\'s Gmail.');
      return;
    }
    const result = registerTeam(teamName.trim(), leaderEmail.trim());
    if (result.success && result.team && result.slotName) {
      setTeamName('');
      setLeaderEmail('');
      setSuccess({ slotName: result.slotName });
      // Assign a random problem from the team's slot and send by email
      const assignment = assignOneProblemAndGetAssignment(result.team);
      if (assignment) {
        try {
          const res = await fetch('/api/send-problem-statements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignments: [assignment] }),
          });
          const data = await res.json().catch(() => ({}));
          setSuccess((s) => (s ? { ...s, emailSent: res.ok } : s));
        } catch {
          setSuccess((s) => (s ? { ...s, emailSent: false } : s));
        }
      }
    } else if (result.success) {
      setSuccess({ slotName: result.slotName! });
      setTeamName('');
      setLeaderEmail('');
    } else {
      setError(result.error ?? 'Registration failed.');
    }
  };

  return (
    <div className="team-register-page">
      <div className="team-register-card">
        <h1 className="team-register-title">Build a Bot</h1>
        <p className="team-register-subtitle">Team registration</p>
        <p className="team-register-hint">Login with your team leader's Gmail</p>
        <form onSubmit={handleSubmit} className="team-register-form">
          <input
            type="text"
            className="team-register-input"
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            autoComplete="off"
          />
          <input
            type="email"
            className="team-register-input"
            placeholder="Team leader's Gmail"
            value={leaderEmail}
            onChange={(e) => setLeaderEmail(e.target.value)}
            autoComplete="email"
          />
          {error && <p className="team-register-error" role="alert">{error}</p>}
          {success && (
            <p className="team-register-success" role="status">
              Registered! Your slot: <strong>{success.slotName}</strong>
              {success.emailSent === true && ' Your problem statement has been sent to your email.'}
              {success.emailSent === false && ' Problem statement could not be sent by email; please contact the organizer.'}
            </p>
          )}
          <button type="submit" className="team-register-btn">Register</button>
        </form>
      </div>
    </div>
  );
}
