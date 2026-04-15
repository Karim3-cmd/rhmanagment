import { useEffect, useState } from 'react';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { Dashboard } from './components/dashboard/Dashboard';
import { authApi, settingsApi } from './lib/api';
import type { User, UserSettings } from './lib/types';

const STORAGE_KEY = 'hrbrain_current_user';

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'dashboard'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as User;
      setUser(parsed);
      // Load user's theme preference
      settingsApi.get(parsed._id).then((settings: UserSettings) => {
        setTheme(settings.theme);
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }).catch(() => undefined);
      setCurrentView('dashboard');
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Listen for theme changes from Settings component
  useEffect(() => {
    const handleStorage = () => {
      const savedTheme = localStorage.getItem('hrbrain_theme');
      if (savedTheme) {
        setTheme(savedTheme as 'light' | 'dark');
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const persistUser = async (nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setCurrentView('dashboard');
  };

  const handleLogin = async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    await persistUser(result.user);
  };

  const handleSignup = async (payload: { name: string; email: string; password: string; role: User['role'] }) => {
    const result = await authApi.register(payload);
    await persistUser(result.user);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('hrbrain_theme');
    document.documentElement.classList.remove('dark');
    setUser(null);
    setCurrentView('login');
  };

  if (currentView === 'login') return <Login onLogin={handleLogin} onSwitchToSignup={() => setCurrentView('signup')} />;
  if (currentView === 'signup') return <Signup onSignup={handleSignup} onSwitchToLogin={() => setCurrentView('login')} />;
  return user ? <Dashboard user={user} onLogout={handleLogout} /> : null;
}
