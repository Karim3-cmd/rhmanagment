import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import { authApi, settingsApi } from './lib/api';

vi.mock('./lib/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
  settingsApi: {
    get: vi.fn(),
  },
}));

vi.mock('./components/dashboard/Dashboard', () => ({
  Dashboard: ({ onLogout }: { onLogout: () => void }) => (
    <div data-testid="dashboard">
      <button onClick={onLogout}>Logout</button>
    </div>
  ),
}));

vi.mock('./components/auth/Login', () => ({
  Login: ({ onLogin, onSwitchToSignup }: { onLogin: (e: string, p: string) => void; onSwitchToSignup: () => void }) => (
    <div data-testid="login">
      <button onClick={() => onLogin('test@test.com', 'pass')}>Login</button>
      <button onClick={onSwitchToSignup}>Go to Signup</button>
    </div>
  ),
}));

vi.mock('./components/auth/Signup', () => ({
  Signup: ({ onSignup, onSwitchToLogin }: { onSignup: (p: object) => void; onSwitchToLogin: () => void }) => (
    <div data-testid="signup">
      <button onClick={() => onSignup({ name: 'Test', email: 'test@test.com', password: 'pass', role: 'Employee' })}>Signup</button>
      <button onClick={onSwitchToLogin}>Go to Login</button>
    </div>
  ),
}));

vi.mock('./components/accessibility/AccessibilityAssistant', () => ({
  AccessibilityAssistant: () => <div data-testid="accessibility" />,
}));

const mockUser = { _id: '1', name: 'Test User', email: 'test@test.com', role: 'HR' as const };

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
  });

  it('renders login view by default', () => {
    render(<App />);
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('renders skip link', () => {
    render(<App />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders accessibility assistant', () => {
    render(<App />);
    expect(screen.getByTestId('accessibility')).toBeInTheDocument();
  });

  it('switches to signup view', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Go to Signup'));
    expect(screen.getByTestId('signup')).toBeInTheDocument();
  });

  it('switches back to login from signup', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Go to Signup'));
    fireEvent.click(screen.getByText('Go to Login'));
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('logs in and shows dashboard', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ message: 'ok', access_token: 'token', user: mockUser });
    vi.mocked(settingsApi.get).mockResolvedValue({ userId: '1', language: 'en', theme: 'light', emailNotifications: true, pushNotifications: true, activityNotifications: true, recommendationNotifications: true });
    render(<App />);
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());
  });

  it('logs out and returns to login', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ message: 'ok', access_token: 'token', user: mockUser });
    vi.mocked(settingsApi.get).mockResolvedValue({ userId: '1', language: 'en', theme: 'light', emailNotifications: true, pushNotifications: true, activityNotifications: true, recommendationNotifications: true });
    render(<App />);
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => screen.getByTestId('dashboard'));
    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('restores session from localStorage', async () => {
    localStorage.setItem('hrbrain_current_user', JSON.stringify(mockUser));
    vi.mocked(settingsApi.get).mockResolvedValue({ userId: '1', language: 'en', theme: 'light', emailNotifications: true, pushNotifications: true, activityNotifications: true, recommendationNotifications: true });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());
  });

  it('clears invalid localStorage data', () => {
    localStorage.setItem('hrbrain_current_user', 'invalid-json{{{');
    render(<App />);
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(localStorage.getItem('hrbrain_current_user')).toBeNull();
  });

  it('applies dark theme from localStorage on restore', async () => {
    localStorage.setItem('hrbrain_current_user', JSON.stringify(mockUser));
    vi.mocked(settingsApi.get).mockResolvedValue({ userId: '1', language: 'en', theme: 'dark', emailNotifications: true, pushNotifications: true, activityNotifications: true, recommendationNotifications: true });
    render(<App />);
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
  });

  it('signs up and shows dashboard', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ message: 'ok', user: mockUser });
    vi.mocked(settingsApi.get).mockResolvedValue({ userId: '1', language: 'en', theme: 'light', emailNotifications: true, pushNotifications: true, activityNotifications: true, recommendationNotifications: true });
    render(<App />);
    fireEvent.click(screen.getByText('Go to Signup'));
    fireEvent.click(screen.getByText('Signup'));
    await waitFor(() => expect(screen.getByTestId('dashboard')).toBeInTheDocument());
  });
});
