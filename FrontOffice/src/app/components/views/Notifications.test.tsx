import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Notifications } from './Notifications';
import { notificationsApi } from '../../lib/api';
import type { User } from '../../lib/types';

vi.mock('../../lib/api', () => ({
  notificationsApi: {
    list: vi.fn(),
    seed: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockUser: User = { _id: 'u1', name: 'Karim', email: 'karim@test.com', role: 'HR' };

const mockNotifications = [
  { _id: 'n1', userId: 'u1', type: 'success' as const, title: 'Activity Approved', message: 'Your activity was approved', category: 'Activity' as const, read: false, createdAt: '2024-01-01T10:00:00Z' },
  { _id: 'n2', userId: 'u1', type: 'info' as const, title: 'New Recommendation', message: 'You have a new recommendation', category: 'Recommendation' as const, read: true, createdAt: '2024-01-02T10:00:00Z' },
  { _id: 'n3', userId: 'u1', type: 'warning' as const, title: 'Skill Expiring', message: 'Your skill certificate expires soon', category: 'Skill' as const, read: false, createdAt: '2024-01-03T10:00:00Z' },
];

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationsApi.list).mockResolvedValue({ total: 3, unread: 2, items: mockNotifications });
    vi.mocked(notificationsApi.seed).mockResolvedValue({ message: 'seeded' });
    vi.mocked(notificationsApi.markRead).mockResolvedValue(mockNotifications[0]);
    vi.mocked(notificationsApi.markAllRead).mockResolvedValue({ message: 'ok' });
    vi.mocked(notificationsApi.remove).mockResolvedValue({ message: 'deleted' });
  });

  it('renders notifications title', () => {
    render(<Notifications user={mockUser} />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('loads and displays notifications', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Activity Approved')).toBeInTheDocument();
      expect(screen.getByText('New Recommendation')).toBeInTheDocument();
    });
  });

  it('shows unread count', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('2 unread')).toBeInTheDocument();
    });
  });

  it('shows Mark all read button', () => {
    render(<Notifications user={mockUser} />);
    expect(screen.getByText('Mark all read')).toBeInTheDocument();
  });

  it('calls markAllRead when button clicked', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => screen.getByText('Mark all read'));
    fireEvent.click(screen.getByText('Mark all read'));
    await waitFor(() => expect(notificationsApi.markAllRead).toHaveBeenCalledWith('u1'));
  });

  it('shows Mark as read button for unread notifications', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => {
      expect(screen.getAllByText('Mark as read').length).toBeGreaterThan(0);
    });
  });

  it('calls markRead when mark as read clicked', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => screen.getAllByText('Mark as read'));
    fireEvent.click(screen.getAllByText('Mark as read')[0]);
    await waitFor(() => expect(notificationsApi.markRead).toHaveBeenCalledWith('n1'));
  });

  it('shows Delete button for notifications', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => {
      expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);
    });
  });

  it('calls remove when delete clicked', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => screen.getAllByText('Delete'));
    fireEvent.click(screen.getAllByText('Delete')[0]);
    await waitFor(() => expect(notificationsApi.remove).toHaveBeenCalled());
  });

  it('shows empty state when no notifications', async () => {
    vi.mocked(notificationsApi.list).mockResolvedValue({ total: 0, unread: 0, items: [] });
    vi.mocked(notificationsApi.seed).mockResolvedValue({ message: 'seeded' });
    vi.mocked(notificationsApi.list).mockResolvedValueOnce({ total: 0, unread: 0, items: [] })
      .mockResolvedValueOnce({ total: 0, unread: 0, items: [] });
    render(<Notifications user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  it('filters by unread', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => screen.getByText('Activity Approved'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'unread' } });
    await waitFor(() => expect(notificationsApi.list).toHaveBeenCalled());
  });

  it('filters by category', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => screen.getByText('Activity Approved'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'Activity' } });
    await waitFor(() => expect(notificationsApi.list).toHaveBeenCalled());
  });

  it('shows notification categories', async () => {
    render(<Notifications user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getByText('Recommendation')).toBeInTheDocument();
    });
  });
});
