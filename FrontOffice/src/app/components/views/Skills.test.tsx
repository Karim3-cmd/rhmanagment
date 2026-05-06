import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Skills } from './Skills';
import { skillsApi, employeesApi, authApi } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  skillsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    assign: vi.fn(),
    unassign: vi.fn(),
  },
  employeesApi: { list: vi.fn() },
  authApi: { listUsers: vi.fn() },
}));

const mockSkills = [
  { _id: 's1', name: 'React', description: 'Frontend library', employeeCount: 2, assignments: [{ employeeId: 'e1', employeeName: 'John' }] },
  { _id: 's2', name: 'Node.js', description: 'Backend runtime', employeeCount: 1, assignments: [] },
];

const mockEmployees = [
  { _id: 'e1', fullName: 'John Doe', email: 'john@test.com', department: 'IT', position: 'Dev' },
];

const mockUsers = [
  { _id: 'u1', name: 'John Doe', email: 'john@test.com', role: 'Employee' as const },
];

describe('Skills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(skillsApi.list).mockResolvedValue({ total: 2, items: mockSkills });
    vi.mocked(employeesApi.list).mockResolvedValue({ total: 1, items: mockEmployees });
    vi.mocked(authApi.listUsers).mockResolvedValue({ total: 1, items: mockUsers });
  });

  it('renders skills catalog title', () => {
    render(<Skills userRole="HR" />);
    expect(screen.getByText('Skills Catalog')).toBeInTheDocument();
  });

  it('loads and displays skills', async () => {
    render(<Skills userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });

  it('shows Add Skill button for HR', () => {
    render(<Skills userRole="HR" />);
    expect(screen.getByText('Add Skill')).toBeInTheDocument();
  });

  it('hides Add Skill button for Employee', () => {
    render(<Skills userRole="Employee" />);
    expect(screen.queryByText('Add Skill')).not.toBeInTheDocument();
  });

  it('filters skills by search', async () => {
    render(<Skills userRole="HR" />);
    await waitFor(() => screen.getByText('React'));
    fireEvent.change(screen.getByPlaceholderText('Search skills...'), { target: { value: 'React' } });
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
  });

  it('opens create skill modal', () => {
    render(<Skills userRole="HR" />);
    fireEvent.click(screen.getByText('Add Skill'));
    expect(screen.getByText('Add Skill', { selector: 'h2' })).toBeInTheDocument();
  });

  it('closes create modal on Cancel', () => {
    render(<Skills userRole="HR" />);
    fireEvent.click(screen.getByText('Add Skill'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Add Skill', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('creates a skill', async () => {
    vi.mocked(skillsApi.create).mockResolvedValue({ _id: 's3', name: 'Vue', type: 'Knowledge' });
    render(<Skills userRole="HR" />);
    fireEvent.click(screen.getByText('Add Skill'));
    fireEvent.change(screen.getByPlaceholderText('e.g., React'), { target: { value: 'Vue' } });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(skillsApi.create).toHaveBeenCalled());
  });

  it('shows skill assignments', async () => {
    render(<Skills userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });

  it('shows no employees assigned message', async () => {
    render(<Skills userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('No employees assigned.')).toBeInTheDocument();
    });
  });

  it('opens assign modal', async () => {
    render(<Skills userRole="HR" />);
    await waitFor(() => screen.getByText('React'));
    const assignButtons = screen.getAllByTitle('Assign');
    fireEvent.click(assignButtons[0]);
    expect(screen.getByText('Assign Skill')).toBeInTheDocument();
  });

  it('closes assign modal on Cancel', async () => {
    render(<Skills userRole="HR" />);
    await waitFor(() => screen.getByText('React'));
    const assignButtons = screen.getAllByTitle('Assign');
    fireEvent.click(assignButtons[0]);
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Assign Skill')).not.toBeInTheDocument();
  });

  it('deletes a skill after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(skillsApi.remove).mockResolvedValue({ message: 'deleted' });
    render(<Skills userRole="HR" />);
    await waitFor(() => screen.getByText('React'));
    // Find all buttons and click the trash icon button for the first skill
    const allButtons = screen.getAllByRole('button');
    const trashButton = allButtons.find(b => b.querySelector('.lucide-trash-2'));
    fireEvent.click(trashButton!);
    await waitFor(() => expect(skillsApi.remove).toHaveBeenCalled());
  });

  it('shows employee count', async () => {
    render(<Skills userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('shows skill count in header', async () => {
    render(<Skills userRole="HR" />);
    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 skills')).toBeInTheDocument();
    });
  });
});
