import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AccessibilityAssistant } from './AccessibilityAssistant';

describe('AccessibilityAssistant', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-accessibility-active');
  });

  it('opens with the floating button and enables high contrast', () => {
    render(<AccessibilityAssistant />);

    fireEvent.click(screen.getByRole('button', { name: /open accessibility settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /high contrast/i }));

    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(true);
    expect(document.documentElement.getAttribute('data-accessibility-active')).toBe('true');
  });

  it('opens with Alt + A for keyboard users', () => {
    render(<AccessibilityAssistant />);

    fireEvent.keyDown(window, { key: 'a', altKey: true });

    expect(screen.getByRole('dialog', { name: /accessibility/i })).toBeInTheDocument();
  });
});
