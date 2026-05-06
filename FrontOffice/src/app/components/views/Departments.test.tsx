import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Departments } from './Departments';
import { departmentsApi } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  departmentsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockDepartments = [
  { _id: 'd1', name: 'Engineering', description: 'Tech team' },
  { _id: 'd2', name: 'HR', description: 'Human resources' },
];

const mockUser = { _id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'HR' as const };

describe('Departments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(departmentsApi.list).mockResolvedValue({ total: 2, items: mockDepartments });
  });

  it('renders departments title', async () => {
    render(<Departments userRole="HR" user={mockUser} />);
    expect(screen.getByText('Departments')).toBeInTheDocument();
  });

  it('loads and displays departments', async () => {
    render(<Departments userRole="HR" user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('HR')).toBeInTheDocument();
    });
  });

  it('shows Create Department button for HR role', async () => {
    render(<Departments userRole="HR" user={mockUser} />);
    expect(screen.getByText('Create Department')).toBeInTheDocument();
  });

  it('hides Create Department button for non-HR role', () => {
    render(<Departments userRole="Employee" user={mockUser} />);
    expect(screen.queryByText('Create Department')).not.toBeInTheDocument();
  });

  it('filters departments by search', async () => {
    render(<Departments userRole="HR" user={mockUser} />);
    await waitFor(() => screen.getByText('Engineering'));
    fireEvent.change(screen.getByPlaceholderText('Search departments...'), { target: { value: 'Eng' } });
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.queryByText('HR')).not.toBeInTheDocument();
  });

  it('opens create modal when Create Department clicked', async () => {
    render(<Departments userRole="HR" user={mockUser} />);
    fireEvent.click(screen.getByText('Create Department'));
    expect(screen.getByText('Create Department', { selector: 'h2' })).toBeInTheDocument();
  });

  it('closes modal when Cancel clicked', async () => {
    render(<Departments userRole="HR" user={mockUser} />);
    fireEvent.click(screen.getByText('Create Department'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create Department', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('creates a department', async () => {
    vi.mocked(departmentsApi.create).mockResolvedValue({ _id: 'd3', name: 'Finance', description: '' });
    render(<Departments userRole="HR" user={mockUser} />);
    fireEvent.click(screen.getByText('Create Department'));
    fireEvent.change(screen.getByPlaceholderText('e.g., Engineering'), { target: { value: 'Finance' } });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(departmentsApi.create).toHaveBeenCalled());
  });

  it('opens edit modal with department data', async () => {
    render(<Departments userRole="HR" user={mockUser} />);
    await waitFor(() => screen.getByText('Engineering'));
    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Edit Department')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
  });

  it('updates a department', async () => {
    vi.mocked(departmentsApi.update).mockResolvedValue({ _id: 'd1', name: 'Engineering Updated', description: '' });
    render(<Departments userRole="HR" user={mockUser} />);
    await waitFor(() => screen.getByText('Engineering'));
    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    fireEvent.change(screen.getByDisplayValue('Engineering'), { target: { value: 'Engineering Updated' } });
    fireEvent.click(screen.getByText('Update'));
    await waitFor(() => expect(departmentsApi.update).toHaveBeenCalledWith('d1', expect.any(Object)));
  });

  it('deletes a department after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(departmentsApi.remove).mockResolvedValue({ message: 'deleted' });
    render(<Departments userRole="HR" user={mockUser} />);
    await waitFor(() => screen.getByText('Engineering'));
    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => expect(departmentsApi.remove).toHaveBeenCalledWith('d1'));
  });

  it('does not delete when confirmation cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Departments userRole="HR" user={mockUser} />);
    await waitFor(() => screen.getByText('Engineering'));
    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);
    expect(departmentsApi.remove).not.toHaveBeenCalled();
  });

  it('shows empty state when no departments', async () => {
    vi.mocked(departmentsApi.list).mockResolvedValue({ total: 0, items: [] });
    render(<Departments userRole="HR" user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText(/No departments found/)).toBeInTheDocument();
    });
  });

  it('shows department descriptions', async () => {
    render(<Departments userRole="HR" user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('Tech team')).toBeInTheDocument();
    });
  });
});
