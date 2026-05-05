import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Login } from './Login';

describe('Login', () => {
  it('shows validation errors when the form is empty', async () => {
    render(<Login onLogin={vi.fn()} onSwitchToSignup={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('submits valid credentials', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<Login onLogin={onLogin} onSwitchToSignup={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'employee@hrbrain.local' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('employee@hrbrain.local', 'secret123');
    });
  });
});
