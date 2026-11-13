import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../../context/SettingsContext';
import { SigFigsInput, MIN_SIG_FIGS, MAX_SIG_FIGS } from '../layout/SigFigsInput';

const ConsumerProbe: React.FC = () => {
  const { precisionDigits } = useSettings();
  return <div data-testid="active-precision">{precisionDigits}</div>;
};

const TestHost: React.FC = () => (
  <SettingsProvider>
    <SigFigsInput />
    <ConsumerProbe />
  </SettingsProvider>
);

describe('SigFigsInput Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders text box with default precision (6) and up/down chevrons', () => {
    render(<TestHost />);

    expect(screen.getByText(/Sig Figs:/i)).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('6');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('6');

    expect(screen.getByRole('button', { name: /Increase significant figures/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decrease significant figures/i })).toBeInTheDocument();
  });

  it('increments and decrements using up and down chevron buttons', () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;
    const upBtn = screen.getByRole('button', { name: /Increase significant figures/i });
    const downBtn = screen.getByRole('button', { name: /Decrease significant figures/i });

    // Click Up: 6 -> 7
    fireEvent.click(upBtn);
    expect(input.value).toBe('7');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('7');

    // Click Up: 7 -> 8
    fireEvent.click(upBtn);
    expect(input.value).toBe('8');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('8');

    // Click Down: 8 -> 7
    fireEvent.click(downBtn);
    expect(input.value).toBe('7');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('7');
  });

  it('allows direct typing to set significant figures', async () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '8' } });
    expect(input.value).toBe('8');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('8');

    fireEvent.change(input, { target: { value: '10' } });
    expect(input.value).toBe('10');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('10');
  });

  it('handles keyboard Up and Down arrows stepping at cursor position', () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;
    fireEvent.focus(input);

    // Initial is "6". Set cursor at end (index 1)
    input.setSelectionRange(1, 1);

    // Press ArrowUp: 6 -> 7
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('7');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('7');

    // Press ArrowDown: 7 -> 6
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('6');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('6');
  });

  it('steps rollover from 9 to 10 and roll-under from 10 to 9 preserving cursor', () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '9' } });
    input.setSelectionRange(1, 1);

    // 9 -> 10 rollover
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('10');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('10');
    expect(input.selectionStart).toBe(2);

    // 10 -> 9 roll-under
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('9');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('9');
    expect(input.selectionStart).toBe(1);
  });

  it('steps tens digit when cursor is on the tens place', () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '11' } });

    // Place cursor between '1' and '1': "1|1" -> pos 1 targets tens digit
    input.setSelectionRange(1, 1);

    // Stepping down on tens digit: 11 - 10 = 1
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('1');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('1');
  });

  it('respects upper bound MAX_SIG_FIGS and disables up button', () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;
    const upBtn = screen.getByRole('button', { name: /Increase significant figures/i });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: String(MAX_SIG_FIGS) } });
    expect(input.value).toBe(String(MAX_SIG_FIGS));
    expect(upBtn).toBeDisabled();

    // ArrowUp at max does not exceed MAX_SIG_FIGS
    input.setSelectionRange(2, 2);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe(String(MAX_SIG_FIGS));
    expect(screen.getByTestId('active-precision')).toHaveTextContent(String(MAX_SIG_FIGS));
  });

  it('respects lower bound MIN_SIG_FIGS and disables down button', () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;
    const downBtn = screen.getByRole('button', { name: /Decrease significant figures/i });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: String(MIN_SIG_FIGS) } });
    expect(input.value).toBe(String(MIN_SIG_FIGS));
    expect(downBtn).toBeDisabled();

    // ArrowDown at min does not drop below MIN_SIG_FIGS
    input.setSelectionRange(1, 1);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe(String(MIN_SIG_FIGS));
    expect(screen.getByTestId('active-precision')).toHaveTextContent(String(MIN_SIG_FIGS));
  });

  it('clamps out-of-range or invalid values on blur', () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;

    // Type 99 -> on blur clamps to MAX_SIG_FIGS (12)
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.blur(input);
    expect(input.value).toBe(String(MAX_SIG_FIGS));
    expect(screen.getByTestId('active-precision')).toHaveTextContent(String(MAX_SIG_FIGS));

    // Type 0 -> on blur clamps to MIN_SIG_FIGS (1)
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);
    expect(input.value).toBe(String(MIN_SIG_FIGS));
    expect(screen.getByTestId('active-precision')).toHaveTextContent(String(MIN_SIG_FIGS));

    // Clear input -> on blur restores previous valid precision
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input.value).toBe(String(MIN_SIG_FIGS));
  });

  it('supports in-input Undo (Cmd+Z / Ctrl+Z) to restore initial focus value', () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;

    // Focus with initial value 6
    fireEvent.focus(input);

    // Type 9
    fireEvent.change(input, { target: { value: '9' } });
    expect(input.value).toBe('9');

    // Press Cmd+Z
    fireEvent.keyDown(input, { key: 'z', metaKey: true });
    expect(input.value).toBe('6');
    expect(screen.getByTestId('active-precision')).toHaveTextContent('6');
  });

  it('reverts on Escape key and blurs on Enter key', () => {
    render(<TestHost />);

    const input = screen.getByRole('textbox', { name: /Significant digits precision/i }) as HTMLInputElement;

    // Focus and change
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '9' } });

    // Press Escape
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('6');

    // Press Enter to blur
    fireEvent.focus(input);
    const blurSpy = vi.spyOn(input, 'blur');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(blurSpy).toHaveBeenCalled();
  });
});
