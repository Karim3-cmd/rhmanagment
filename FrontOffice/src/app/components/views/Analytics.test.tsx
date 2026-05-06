import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Analytics } from './Analytics';
import { analyticsApi } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  analyticsApi: { dashboard: vi.fn() },
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

const mockData = {
  metrics: { skillsAdded: 10, avgSkillLevel: 3.2, activeEmployees: 25, completionRate: 75 },
  employeesByDepartment: [{ name: 'IT', value: 10 }, { name: 'HR', value: 5 }],
  topSkills: [{ name: 'React', value: 8 }],
  activityStatuses: [{ name: 'Active', value: 5 }, { name: 'Done', value: 3 }],
  recommendationStatuses: [{ name: 'Open', value: 4 }, { name: 'Accepted', value: 2 }],
  summary: { totalRecommendations: 20, successfulPlacements: 15, averageTimeToMatch: 3 },
};

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.dashboard).mockResolvedValue(mockData);
  });

  it('renders analytics title', () => {
    render(<Analytics userRole="HR" />);
    expect(screen.getByText('Analytics & Reports')).toBeInTheDocument();
  });

  it('loads and displays metrics', async () => {
    render(<Analytics userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Skills Added')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('displays avg skill level', async () => {
    render(<Analytics userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('3.2/4')).toBeInTheDocument();
    });
  });

  it('displays active employees', async () => {
    render(<Analytics userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('displays completion rate', async () => {
    render(<Analytics userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('renders charts when data loaded', async () => {
    render(<Analytics userRole="HR" />);
    await waitFor(() => {
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    });
  });

  it('displays summary statistics', async () => {
    render(<Analytics userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Summary Statistics')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('3 days')).toBeInTheDocument();
    });
  });

  it('shows no metrics when data not loaded', () => {
    vi.mocked(analyticsApi.dashboard).mockReturnValue(new Promise(() => {}));
    render(<Analytics userRole="HR" />);
    expect(screen.queryByText('Skills Added')).not.toBeInTheDocument();
  });

  it('displays department chart title', async () => {
    render(<Analytics userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Employees by Department')).toBeInTheDocument();
    });
  });

  it('displays top skills chart title', async () => {
    render(<Analytics userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Top 5 Assigned Skills')).toBeInTheDocument();
    });
  });
});
