import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Signup } from './Signup';

const mockOnSignup = vi.fn();
const mockOnSwitchToLogin = vi.fn();

const defaultProps = {
  onSignup: mockOnSignup,
  onSwitchToLogin: mockOnSwitchToLogin,
};

describe('Signup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders signup form', () => {
    render(<Signup {...defaultProps} />);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('renders role selection buttons', () => {
    render(<Signup {...defaultProps} />);
    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<Signup {...defaultProps} />);
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<Signup {...defaultProps} />);
    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows email validation error for invalid email', async () => {
    render(<Signup {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows password length error', async () => {
    render(<Signup {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('shows password mismatch error', async () => {
    render(<Signup {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls onSignup with correct data on valid submit', async () => {
    mockOnSignup.mockResolvedValue(undefined);
    render(<Signup {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(mockOnSignup).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@test.com',
        password: 'password123',
        role: 'Employee',
      });
    });
  });

  it('changes role when clicking role buttons', () => {
    render(<Signup {...defaultProps} />);
    fireEvent.click(screen.getByText('Manager'));
    expect(screen.getByText('Manager')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onSwitchToLogin when sign in link clicked', () => {
    render(<Signup {...defaultProps} />);
    fireEvent.click(screen.getByText('Sign in'));
    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  it('shows submit error when signup fails', async () => {
    mockOnSignup.mockRejectedValue({ response: { data: { message: 'Email already exists' } } });
    render(<Signup {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    mockOnSignup.mockImplementation(() => new Promise(() => {}));
    render(<Signup {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeDisabled();
    });
  });
});
