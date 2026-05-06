import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Dashboard } from './Dashboard';
import type { User } from '../../lib/types';

// Mock all views
vi.mock('../views/Employees', () => ({ Employees: () => <div data-testid="view-employees" /> }));
vi.mock('../views/Skills', () => ({ Skills: () => <div data-testid="view-skills" /> }));
vi.mock('../views/Activities', () => ({ Activities: () => <div data-testid="view-activities" /> }));
vi.mock('../views/Recommendations', () => ({ Recommendations: () => <div data-testid="view-recommendations" /> }));
vi.mock('../views/Analytics', () => ({ Analytics: () => <div data-testid="view-analytics" /> }));
vi.mock('../views/Profile', () => ({ Profile: () => <div data-testid="view-profile" /> }));
vi.mock('../views/Settings', () => ({ Settings: () => <div data-testid="view-settings" /> }));
vi.mock('../views/Departments', () => ({ Departments: () => <div data-testid="view-departments" /> }));
vi.mock('../views/JobMatching', () => ({ JobMatching: () => <div data-testid="view-job-matching" /> }));
vi.mock('../views/ManagerApprovals', () => ({ ManagerApprovals: () => <div data-testid="view-approvals" /> }));
vi.mock('./Sidebar', () => ({
  Sidebar: ({ onViewChange, onLogout, onToggleCollapse }: {
    onViewChange: (v: string) => void;
    onLogout: () => void;
    onToggleCollapse: () => void;
  }) => (
    <div data-testid="sidebar">
      <button onClick={() => onViewChange('employees')}>Employees</button>
      <button onClick={() => onViewChange('skills')}>Skills</button>
      <button onClick={() => onViewChange('activities')}>Activities</button>
      <button onClick={() => onViewChange('recommendations')}>Recommendations</button>
      <button onClick={() => onViewChange('analytics')}>Analytics</button>
      <button onClick={() => onViewChange('profile')}>Profile</button>
      <button onClick={() => onViewChange('settings')}>Settings</button>
      <button onClick={() => onViewChange('departments')}>Departments</button>
      <button onClick={() => onViewChange('job-matching')}>Job Matching</button>
      <button onClick={() => onViewChange('approvals')}>Approvals</button>
      <button onClick={onLogout}>Logout</button>
      <button onClick={onToggleCollapse}>Toggle</button>
    </div>
  ),
}));

const mockUser: User = { _id: '1', name: 'Karim Test', email: 'karim@test.com', role: 'HR' };
const mockLogout = vi.fn();

describe('Dashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders sidebar and default activities view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('view-activities')).toBeInTheDocument();
  });

  it('navigates to employees view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Employees'));
    expect(screen.getByTestId('view-employees')).toBeInTheDocument();
  });

  it('navigates to skills view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Skills'));
    expect(screen.getByTestId('view-skills')).toBeInTheDocument();
  });

  it('navigates to recommendations view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Recommendations'));
    expect(screen.getByTestId('view-recommendations')).toBeInTheDocument();
  });

  it('navigates to analytics view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Analytics'));
    expect(screen.getByTestId('view-analytics')).toBeInTheDocument();
  });

  it('navigates to profile view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Profile'));
    expect(screen.getByTestId('view-profile')).toBeInTheDocument();
  });

  it('navigates to settings view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByTestId('view-settings')).toBeInTheDocument();
  });

  it('navigates to departments view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Departments'));
    expect(screen.getByTestId('view-departments')).toBeInTheDocument();
  });

  it('navigates to job-matching view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Job Matching'));
    expect(screen.getByTestId('view-job-matching')).toBeInTheDocument();
  });

  it('navigates to approvals view', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Approvals'));
    expect(screen.getByTestId('view-approvals')).toBeInTheDocument();
  });

  it('calls onLogout when logout is clicked', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('renders main content area with correct aria-label', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Activities workspace');
  });

  it('toggles sidebar collapse', () => {
    render(<Dashboard user={mockUser} onLogout={mockLogout} />);
    const main = screen.getByRole('main');
    expect(main.className).toContain('ml-64');
    fireEvent.click(screen.getByText('Toggle'));
    expect(main.className).toContain('ml-16');
  });
});
