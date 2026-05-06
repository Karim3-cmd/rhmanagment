import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import type { ViewType } from './Dashboard';

const defaultProps = {
  currentView: 'activities' as ViewType,
  onViewChange: vi.fn(),
  userRole: 'HR' as const,
  userName: 'Karim Test',
  isCollapsed: false,
  onToggleCollapse: vi.fn(),
  onLogout: vi.fn(),
};

describe('Sidebar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders HRBrain brand when expanded', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('HRBrain')).toBeInTheDocument();
  });

  it('renders user name when expanded', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Karim Test')).toBeInTheDocument();
  });

  it('renders user initials', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('KA')).toBeInTheDocument();
  });

  it('shows HR role label', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('HR')).toBeInTheDocument();
  });

  it('renders all HR menu items', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('does not show Approvals for HR role', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.queryByText('Approvals')).not.toBeInTheDocument();
  });

  it('shows Approvals for Manager role', () => {
    render(<Sidebar {...defaultProps} userRole="Manager" />);
    expect(screen.getByText('Approvals')).toBeInTheDocument();
  });

  it('Employee role only sees allowed items', () => {
    render(<Sidebar {...defaultProps} userRole="Employee" />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('Employees')).not.toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('calls onViewChange when menu item clicked', () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Employees'));
    expect(defaultProps.onViewChange).toHaveBeenCalledWith('employees');
  });

  it('calls onLogout when logout clicked', () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Logout'));
    expect(defaultProps.onLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleCollapse when toggle button clicked', () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Collapse sidebar'));
    expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('shows expand button when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('hides brand name when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    expect(screen.queryByText('HRBrain')).not.toBeInTheDocument();
  });

  it('hides user name when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    expect(screen.queryByText('Karim Test')).not.toBeInTheDocument();
  });

  it('marks current view as active', () => {
    render(<Sidebar {...defaultProps} currentView="employees" />);
    const btn = screen.getByLabelText('Employees');
    expect(btn).toHaveAttribute('aria-current', 'page');
  });

  it('has correct width when expanded', () => {
    render(<Sidebar {...defaultProps} />);
    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('w-64');
  });

  it('has correct width when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('w-16');
  });
});
