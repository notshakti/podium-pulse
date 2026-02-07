import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) {
      setError('Enter the admin password.');
      return;
    }
    const ok = login(password);
    if (ok) navigate(redirect, { replace: true });
    else setError('Incorrect password.');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Build a Bot</h1>
        <p className="login-subtitle">Admin login</p>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" className="login-btn">Sign in</button>
        </form>
        <p className="login-hint">Default password: admin123</p>
      </div>
    </div>
  );
}
