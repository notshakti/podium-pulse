import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { TeamRegisterPage } from './pages/TeamRegisterPage';
import { LeaderboardPage } from './components/Leaderboard/LeaderboardPage';
import { AdminPanel } from './components/Admin/AdminPanel';
import { QuizDisplay } from './components/QuizDisplay/QuizDisplay';
import './App.css';

function Nav() {
  const location = useLocation();
  const isQuizDisplay = location.pathname === '/display';
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';

  if (isQuizDisplay || isLogin || isRegister) return null;

  return (
    <nav className="app-nav">
      <Link to="/" className="app-nav-logo">Build a Bot</Link>
      <div className="app-nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Leaderboard</Link>
        <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>Register</Link>
        <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Admin</Link>
        <Link to="/display" className="app-nav-display">Quiz display</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Nav />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<LeaderboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<TeamRegisterPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route path="/display" element={<QuizDisplay />} />
            </Routes>
          </main>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
