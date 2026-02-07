import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LeaderboardPage } from './components/Leaderboard/LeaderboardPage';
import { AdminPanel } from './components/Admin/AdminPanel';
import { QuizDisplay } from './components/QuizDisplay/QuizDisplay';
import './App.css';

function Nav() {
  const location = useLocation();
  const isQuizDisplay = location.pathname === '/display';

  if (isQuizDisplay) return null;

  return (
    <nav className="app-nav">
      <Link to="/" className="app-nav-logo">Build a Bot</Link>
      <div className="app-nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Leaderboard</Link>
        <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Admin</Link>
        <Link to="/display" className="app-nav-display">Quiz display</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Nav />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<LeaderboardPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/display" element={<QuizDisplay />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
