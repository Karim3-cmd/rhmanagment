import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Home } from './Home';
import { employeesApi, skillsApi } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  employeesApi: { list: vi.fn() },
  skillsApi: { list: vi.fn() },
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  CartesianGrid: () => <div />,
  Legend: () => <div />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
}));

const mockEmployees = [
  { _id: 'e1', fullName: 'John', email: 'john@test.com', department: 'IT', position: 'Dev', skillsCount: 3, activitiesCount: 2 },
  { _id: 'e2', fullName: 'Jane', email: 'jane@test.com', department: 'HR', position: 'Manager', skillsCount: 0, activitiesCount: 1 },
];

const mockSkills = [
  { _id: 's1', name: 'React', type: 'Knowledge' as const, employeeCount: 2, averageLevel: 3 },
  { _id: 's2', name: 'Vue', type: 'Knowledge' as const, employeeCount: 0, averageLevel: 0 },
];

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(employeesApi.list).mockResolvedValue({ total: 2, items: mockEmployees });
    vi.mocked(skillsApi.list).mockResolvedValue({ total: 2, items: mockSkills });
  });

  it('renders dashboard title', () => {
    render(<Home userRole="HR" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays total employees metric', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Total Employees')).toBeInTheDocument();
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });
  });

  it('displays skills catalog metric', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Skills Catalog')).toBeInTheDocument();
    });
  });

  it('displays ongoing activities metric', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Ongoing Activities')).toBeInTheDocument();
    });
  });

  it('displays pending recommendations metric', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Pending Recommendations')).toBeInTheDocument();
    });
  });

  it('renders charts', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('displays alerts section', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Recent Alerts & Notifications')).toBeInTheDocument();
    });
  });

  it('shows unassigned skills alert', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText(/unassigned skills/)).toBeInTheDocument();
    });
  });

  it('shows employees with no skills alert', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText(/employees have no skills/)).toBeInTheDocument();
    });
  });

  it('shows employees loaded alert', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText(/employees loaded/)).toBeInTheDocument();
    });
  });

  it('displays skills distribution chart title', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Skills Distribution by Department')).toBeInTheDocument();
    });
  });

  it('displays skill gaps chart title', async () => {
    render(<Home userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Skill Gaps Overview')).toBeInTheDocument();
    });
  });
});
