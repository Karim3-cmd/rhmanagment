import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Recommendations } from './Recommendations';
import { recommendationsApi, skillsApi } from '../../lib/api';
import type { User } from '../../lib/types';

vi.mock('../../lib/api', () => ({
  recommendationsApi: { list: vi.fn(), refresh: vi.fn(), updateStatus: vi.fn() },
  skillsApi: { list: vi.fn() },
}));

const mockUser: User = { _id: 'u1', name: 'Karim', email: 'karim@test.com', role: 'Manager', department: 'IT' };

const mockRecommendations = [
  {
    _id: 'r1', employeeId: 'e1', employeeName: 'John Doe',
    activityId: 'a1', activityTitle: 'React Training',
    activitySeats: 10, occupiedSeats: 3, availableSeats: 7, eligibleEmployeesCount: 5,
    score: 85, matchedSkills: ['React', 'TypeScript'], missingSkills: ['Node.js'],
    rationale: 'Strong match', status: 'Open' as const,
  },
  {
    _id: 'r2', employeeId: 'e2', employeeName: 'Jane Smith',
    activityId: 'a1', activityTitle: 'React Training',
    activitySeats: 10, occupiedSeats: 3, availableSeats: 7, eligibleEmployeesCount: 5,
    score: 65, matchedSkills: ['React'], missingSkills: ['TypeScript', 'Node.js'],
    rationale: 'Good match', status: 'Accepted' as const,
  },
];

const mockSkills = [{ _id: 's1', name: 'React', type: 'Knowledge' as const }];

describe('Recommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(recommendationsApi.list).mockResolvedValue({ total: 2, items: mockRecommendations });
    vi.mocked(recommendationsApi.refresh).mockResolvedValue({ total: 2, items: mockRecommendations });
    vi.mocked(recommendationsApi.updateStatus).mockResolvedValue(mockRecommendations[0]);
    vi.mocked(skillsApi.list).mockResolvedValue({ total: 1, items: mockSkills });
  });

  it('renders recommendations title', () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('loads and displays recommendations', async () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('React Training')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('shows match scores', async () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('85% match')).toBeInTheDocument();
      expect(screen.getByText('65% match')).toBeInTheDocument();
    });
  });

  it('shows matched skills', async () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });
  });

  it('shows missing skills', async () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });

  it('shows Refresh Engine button', () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    expect(screen.getByText('Refresh Engine')).toBeInTheDocument();
  });

  it('calls refresh when Refresh Engine clicked', async () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    fireEvent.click(screen.getByText('Refresh Engine'));
    await waitFor(() => expect(recommendationsApi.refresh).toHaveBeenCalled());
  });

  it('shows Accept/Dismiss buttons for Manager role', async () => {
    render(<Recommendations userRole="Manager" user={mockUser} />);
    await waitFor(() => {
      expect(screen.getAllByText('Accept').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Dismiss').length).toBeGreaterThan(0);
    });
  });

  it('hides Accept/Dismiss buttons for HR role', async () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    await waitFor(() => screen.getByText('John Doe'));
    expect(screen.queryByText('Accept')).not.toBeInTheDocument();
  });

  it('calls updateStatus when Accept clicked', async () => {
    render(<Recommendations userRole="Manager" user={mockUser} />);
    await waitFor(() => screen.getAllByText('Accept'));
    fireEvent.click(screen.getAllByText('Accept')[0]);
    await waitFor(() => expect(recommendationsApi.updateStatus).toHaveBeenCalledWith('r1', 'Accepted'));
  });

  it('calls updateStatus when Dismiss clicked', async () => {
    render(<Recommendations userRole="Manager" user={mockUser} />);
    await waitFor(() => screen.getAllByText('Dismiss'));
    fireEvent.click(screen.getAllByText('Dismiss')[0]);
    await waitFor(() => expect(recommendationsApi.updateStatus).toHaveBeenCalledWith('r1', 'Dismissed'));
  });

  it('filters by search term', async () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    await waitFor(() => screen.getByText('John Doe'));
    fireEvent.change(screen.getByPlaceholderText('Search by employee, activity or skill'), { target: { value: 'John' } });
    await waitFor(() => expect(recommendationsApi.list).toHaveBeenCalled());
  });

  it('shows activity seats info', async () => {
    render(<Recommendations userRole="HR" user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText(/Seats: 7 available/)).toBeInTheDocument();
    });
  });
});
