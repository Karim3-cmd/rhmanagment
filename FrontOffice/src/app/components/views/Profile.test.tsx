import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Profile } from './Profile';
import { employeesApi, skillsApi, activitiesApi, analyticsApi } from '../../lib/api';
import type { User } from '../../lib/types';

vi.mock('../../lib/api', () => ({
  employeesApi: { list: vi.fn() },
  skillsApi: { list: vi.fn() },
  activitiesApi: { getMine: vi.fn(), updateProgress: vi.fn() },
  analyticsApi: { employee: vi.fn() },
}));

const mockUser: User = { _id: 'u1', name: 'Karim Test', email: 'karim@test.com', role: 'Employee' };

const mockEmployee = {
  _id: 'e1', userId: 'u1', fullName: 'Karim Test', email: 'karim@test.com',
  department: 'IT', position: 'Developer', joinedAt: '2023-01-01',
  education: [{ degree: 'BSc', institution: 'MIT', fieldOfStudy: 'CS', startYear: 2018, endYear: 2022 }],
  certifications: [{ name: 'AWS', issuer: 'Amazon', issueDate: '2023-01-01', expiryDate: '2025-01-01' }],
};

const mockSkills = [
  { _id: 's1', name: 'React', type: 'Knowledge' as const, assignments: [{ employeeId: 'e1', employeeName: 'Karim', level: 3, validated: true, yearsOfExperience: 2 }] },
];

const mockActivities = [
  { _id: 'a1', title: 'React Training', context: 'Upskilling' as const, seats: 10, status: 'In Progress' as const, enrollments: [{ employeeId: 'e1', employeeName: 'Karim', status: 'Approved', progress: 50 }] },
];

const mockEvolution = {
  employeeId: 'e1', employeeName: 'Karim',
  metrics: { certifications: 1, activities: 1, completedActivities: 0, validatedSkills: 1 },
  skills: [], activities: [],
  evolution: [{ step: 'Q1 2024', score: 75, status: 'Good' }],
};

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(employeesApi.list).mockResolvedValue({ total: 1, items: [mockEmployee] });
    vi.mocked(skillsApi.list).mockResolvedValue({ total: 1, items: mockSkills });
    vi.mocked(activitiesApi.getMine).mockResolvedValue({ total: 1, items: mockActivities });
    vi.mocked(analyticsApi.employee).mockResolvedValue(mockEvolution);
  });

  it('renders profile title', () => {
    render(<Profile user={mockUser} />);
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('displays user name', () => {
    render(<Profile user={mockUser} />);
    expect(screen.getByText('Karim Test')).toBeInTheDocument();
  });

  it('displays user email', () => {
    render(<Profile user={mockUser} />);
    expect(screen.getByText('karim@test.com')).toBeInTheDocument();
  });

  it('displays user initials', () => {
    render(<Profile user={mockUser} />);
    expect(screen.getByText('KA')).toBeInTheDocument();
  });

  it('loads and displays skills', async () => {
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  it('displays skill level', async () => {
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Level 3/4')).toBeInTheDocument();
    });
  });

  it('shows validated badge for validated skills', async () => {
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Validated')).toBeInTheDocument();
    });
  });

  it('loads and displays activities', async () => {
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('React Training')).toBeInTheDocument();
    });
  });

  it('displays activity progress', async () => {
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  it('displays education section', async () => {
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('BSc')).toBeInTheDocument();
    });
  });

  it('displays certifications section', async () => {
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Certifications')).toBeInTheDocument();
      expect(screen.getByText('AWS')).toBeInTheDocument();
    });
  });

  it('displays evolution analytics', async () => {
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Evolution Analytics')).toBeInTheDocument();
      expect(screen.getByText('Q1 2024')).toBeInTheDocument();
    });
  });

  it('shows no skills message when empty', async () => {
    vi.mocked(employeesApi.list).mockResolvedValue({ total: 0, items: [] });
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('No skills linked to this account yet.')).toBeInTheDocument();
    });
  });

  it('shows Update Progress button', async () => {
    render(<Profile user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Update Progress')).toBeInTheDocument();
    });
  });

  it('calls updateProgress when prompt confirmed', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('75');
    vi.mocked(activitiesApi.updateProgress).mockResolvedValue(mockActivities[0]);
    render(<Profile user={mockUser} />);
    await waitFor(() => screen.getByText('Update Progress'));
    fireEvent.click(screen.getByText('Update Progress'));
    await waitFor(() => expect(activitiesApi.updateProgress).toHaveBeenCalled());
  });
});
