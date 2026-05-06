import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Employees } from './Employees';
import { employeesApi, authApi, departmentsApi } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  employeesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  authApi: { listUsers: vi.fn() },
  departmentsApi: { list: vi.fn() },
}));

vi.mock('../employees/EmployeeProfile', () => ({
  EmployeeProfile: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="employee-profile">
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

const mockEmployees = [
  { _id: 'e1', userId: 'u1', fullName: 'John Doe', email: 'john@test.com', department: 'IT', position: 'Developer', skillsCount: 3, activitiesCount: 2 },
  { _id: 'e2', userId: 'u2', fullName: 'Jane Smith', email: 'jane@test.com', department: 'HR', position: 'Manager', skillsCount: 1, activitiesCount: 0 },
];

const mockUsers = [
  { _id: 'u1', name: 'John Doe', email: 'john@test.com', role: 'Employee' as const },
  { _id: 'u3', name: 'New User', email: 'new@test.com', role: 'Employee' as const },
];

const mockDepartments = [
  { _id: 'd1', name: 'IT' },
  { _id: 'd2', name: 'HR' },
];

describe('Employees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(employeesApi.list).mockResolvedValue({ total: 2, items: mockEmployees });
    vi.mocked(authApi.listUsers).mockResolvedValue({ total: 2, items: mockUsers });
    vi.mocked(departmentsApi.list).mockResolvedValue({ total: 2, items: mockDepartments });
  });

  it('renders employees title', () => {
    render(<Employees userRole="HR" />);
    expect(screen.getByText('Employees')).toBeInTheDocument();
  });

  it('loads and displays employees', async () => {
    render(<Employees userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows Add Employee button for HR', () => {
    render(<Employees userRole="HR" />);
    expect(screen.getByText('Add Employee')).toBeInTheDocument();
  });

  it('hides Add Employee button for Manager', () => {
    render(<Employees userRole="Manager" />);
    expect(screen.queryByText('Add Employee')).not.toBeInTheDocument();
  });

  it('filters employees by search', async () => {
    render(<Employees userRole="HR" />);
    await waitFor(() => screen.getByText('John Doe'));
    fireEvent.change(screen.getByPlaceholderText('Search employees...'), { target: { value: 'John' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('filters employees by department', async () => {
    render(<Employees userRole="HR" />);
    await waitFor(() => screen.getByText('John Doe'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'IT' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('shows employee count', async () => {
    render(<Employees userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 employees')).toBeInTheDocument();
    });
  });

  it('opens employee profile on view click', async () => {
    render(<Employees userRole="HR" />);
    await waitFor(() => screen.getByText('John Doe'));
    const viewButtons = screen.getAllByTitle('View profile');
    fireEvent.click(viewButtons[0]);
    expect(screen.getByTestId('employee-profile')).toBeInTheDocument();
  });

  it('goes back from employee profile', async () => {
    render(<Employees userRole="HR" />);
    await waitFor(() => screen.getByText('John Doe'));
    fireEvent.click(screen.getAllByTitle('View profile')[0]);
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('opens create modal', async () => {
    render(<Employees userRole="HR" />);
    fireEvent.click(screen.getByText('Add Employee'));
    expect(screen.getByText('Add Employee', { selector: 'h2' })).toBeInTheDocument();
  });

  it('closes modal on Cancel', async () => {
    render(<Employees userRole="HR" />);
    fireEvent.click(screen.getByText('Add Employee'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Add Employee', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('shows validation error when no user selected', async () => {
    render(<Employees userRole="HR" />);
    fireEvent.click(screen.getByText('Add Employee'));
    fireEvent.click(screen.getByText('Create Employee'));
    await waitFor(() => {
      expect(screen.getByText('Please select a user.')).toBeInTheDocument();
    });
  });

  it('shows validation error when no department', async () => {
    render(<Employees userRole="HR" />);
    await waitFor(() => screen.getByText('John Doe'));
    fireEvent.click(screen.getByText('Add Employee'));
    // Select a user
    const userSelect = screen.getByText('Select a user...');
    fireEvent.change(userSelect.closest('select')!, { target: { value: 'u3' } });
    fireEvent.click(screen.getByText('Create Employee'));
    await waitFor(() => {
      expect(screen.getByText('Department is required.')).toBeInTheDocument();
    });
  });

  it('opens edit modal with employee data', async () => {
    render(<Employees userRole="HR" />);
    await waitFor(() => screen.getByText('John Doe'));
    const editButtons = screen.getAllByTitle('Edit employee');
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Edit Employee')).toBeInTheDocument();
  });

  it('deletes employee after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(employeesApi.remove).mockResolvedValue({ message: 'deleted' });
    render(<Employees userRole="HR" />);
    await waitFor(() => screen.getByText('John Doe'));
    const deleteButtons = screen.getAllByTitle('Delete employee');
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => expect(employeesApi.remove).toHaveBeenCalledWith('e1'));
  });

  it('does not delete when confirmation cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Employees userRole="HR" />);
    await waitFor(() => screen.getByText('John Doe'));
    const deleteButtons = screen.getAllByTitle('Delete employee');
    fireEvent.click(deleteButtons[0]);
    expect(employeesApi.remove).not.toHaveBeenCalled();
  });

  it('shows phone validation error', async () => {
    render(<Employees userRole="HR" />);
    await waitFor(() => screen.getByText('John Doe'));
    const editButtons = screen.getAllByTitle('Edit employee');
    fireEvent.click(editButtons[0]);
    const phoneInput = screen.getByPlaceholderText('+21698765432');
    fireEvent.change(phoneInput, { target: { value: '12345' } });
    fireEvent.click(screen.getByText('Update Employee'));
    await waitFor(() => {
      expect(screen.getByText(/Phone must start with \+216/)).toBeInTheDocument();
    });
  });
});
