import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Header } from './Header';
import { notificationsApi } from '../../lib/api';
import type { User } from '../../lib/types';

vi.mock('../../lib/api', () => ({
  notificationsApi: {
    list: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockUser: User = { _id: 'u1', name: 'Karim Test', email: 'karim@test.com', role: 'HR' };
const mockOnViewChange = vi.fn();
const mockOnLogout = vi.fn();

const mockNotifications = [
  { _id: 'n1', userId: 'u1', type: 'success' as const, title: 'Test Notification', message: 'Test message', category: 'Activity' as const, read: false, createdAt: '2024-01-01T10:00:00Z' },
  { _id: 'n2', userId: 'u1', type: 'info' as const, title: 'Info Notification', message: 'Info message', category: 'System' as const, read: true, createdAt: '2024-01-02T10:00:00Z' },
];

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationsApi.list).mockResolvedValue({ total: 2, unread: 1, items: mockNotifications });
    vi.mocked(notificationsApi.markRead).mockResolvedValue(mockNotifications[0]);
    vi.mocked(notificationsApi.markAllRead).mockResolvedValue({ message: 'ok' });
    vi.mocked(notificationsApi.remove).mockResolvedValue({ message: 'deleted' });
  });

  it('renders header', () => {
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('shows current view title - employees', () => {
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    expect(screen.getByText('Employees')).toBeInTheDocument();
  });

  it('shows current view title - skills', () => {
    render(<Header user={mockUser} currentView="skills" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('shows current view title - analytics', () => {
    render(<Header user={mockUser} currentView="analytics" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('shows user name', () => {
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    expect(screen.getByText('Karim Test')).toBeInTheDocument();
  });

  it('shows user role', () => {
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    expect(screen.getByText('HR')).toBeInTheDocument();
  });

  it('shows user initials', () => {
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    expect(screen.getByText('KA')).toBeInTheDocument();
  });

  it('shows unread count badge', async () => {
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('opens notification dropdown on bell click', async () => {
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    await waitFor(() => screen.getByText('1'));
    fireEvent.click(screen.getByRole('button', { name: '' }));
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('shows notifications in dropdown', async () => {
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    await waitFor(() => screen.getByText('1'));
    fireEvent.click(screen.getAllByRole('button')[0]);
    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });
  });

  it('shows Mark all read in dropdown when unread', async () => {
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    await waitFor(() => screen.getByText('1'));
    fireEvent.click(screen.getAllByRole('button')[0]);
    await waitFor(() => {
      expect(screen.getByText('Mark all read')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    vi.mocked(notificationsApi.list).mockResolvedValue({ total: 0, unread: 0, items: [] });
    render(<Header user={mockUser} currentView="employees" onViewChange={mockOnViewChange} onLogout={mockOnLogout} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });
});
