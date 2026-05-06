import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Settings } from './Settings';
import { settingsApi } from '../../lib/api';
import type { User } from '../../lib/types';

vi.mock('../../lib/api', () => ({
  settingsApi: { get: vi.fn(), update: vi.fn() },
}));

const mockUser: User = { _id: 'u1', name: 'Karim', email: 'karim@test.com', role: 'HR' };

const mockSettings = {
  userId: 'u1',
  language: 'en' as const,
  theme: 'light' as const,
  emailNotifications: true,
  pushNotifications: true,
  activityNotifications: true,
  recommendationNotifications: true,
};

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsApi.get).mockResolvedValue(mockSettings);
    vi.mocked(settingsApi.update).mockResolvedValue(mockSettings);
    document.documentElement.classList.remove('dark');
  });

  it('renders settings title', () => {
    render(<Settings user={mockUser} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('loads user settings', async () => {
    render(<Settings user={mockUser} />);
    await waitFor(() => expect(settingsApi.get).toHaveBeenCalledWith('u1'));
  });

  it('renders language section', () => {
    render(<Settings user={mockUser} />);
    expect(screen.getByText('Language & Region')).toBeInTheDocument();
  });

  it('renders appearance section', () => {
    render(<Settings user={mockUser} />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('renders notifications section', () => {
    render(<Settings user={mockUser} />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders security section', () => {
    render(<Settings user={mockUser} />);
    expect(screen.getByText('Security & Privacy')).toBeInTheDocument();
  });

  it('shows user email in security section', async () => {
    render(<Settings user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('karim@test.com · HR')).toBeInTheDocument();
    });
  });

  it('saves settings when Save Changes clicked', async () => {
    render(<Settings user={mockUser} />);
    await waitFor(() => screen.getByText('Save Changes'));
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => expect(settingsApi.update).toHaveBeenCalledWith('u1', expect.any(Object)));
  });

  it('shows saved confirmation message', async () => {
    render(<Settings user={mockUser} />);
    await waitFor(() => screen.getByText('Save Changes'));
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(screen.getByText('Changes saved to backend.')).toBeInTheDocument();
    });
  });

  it('switches to dark theme', async () => {
    render(<Settings user={mockUser} />);
    await waitFor(() => screen.getByText('Dark'));
    fireEvent.click(screen.getByText('Dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('switches to light theme', async () => {
    document.documentElement.classList.add('dark');
    render(<Settings user={mockUser} />);
    await waitFor(() => screen.getByText('Light'));
    fireEvent.click(screen.getByText('Light'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('changes language selection', async () => {
    render(<Settings user={mockUser} />);
    await waitFor(() => screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'fr' } });
    expect(screen.getByRole('combobox')).toHaveValue('fr');
  });

  it('toggles email notifications', async () => {
    render(<Settings user={mockUser} />);
    await waitFor(() => screen.getByText('Email Notifications'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('renders all notification toggles', async () => {
    render(<Settings user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByText('Activity Updates')).toBeInTheDocument();
      expect(screen.getByText('Recommendation Alerts')).toBeInTheDocument();
    });
  });
});
