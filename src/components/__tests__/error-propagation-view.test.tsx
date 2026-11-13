import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorPropagationView } from '../modules/ErrorPropagationView';
import { SettingsProvider } from '../../context/SettingsContext';
import { PresetProvider } from '../../context/PresetContext';
import { HistoryProvider } from '../../context/HistoryContext';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SettingsProvider>
    <PresetProvider>
      <HistoryProvider>{children}</HistoryProvider>
    </PresetProvider>
  </SettingsProvider>
);

describe('ErrorPropagationView Component & Second-Order Interaction', () => {
  it('renders default formula with persistent toggle and mild diagnostic banner', () => {
    render(
      <TestWrapper>
        <ErrorPropagationView />
      </TestWrapper>
    );

    // Header title
    expect(screen.getByText(/Symbolic Error Propagation Equation Generator/i)).toBeInTheDocument();

    // Persistent toggle is present
    const toggleCheckbox = screen.getByRole('checkbox', {
      name: /Include 2nd-order curvature corrections/i
    });
    expect(toggleCheckbox).toBeInTheDocument();
    expect(toggleCheckbox).not.toBeChecked();

    // Status pill shows LINEAR (1st-ORDER) initially
    expect(screen.getByText('LINEAR (1st-ORDER)')).toBeInTheDocument();

    // Mild diagnostic banner is triggered on default Gaussian laser formula (η_nl ≈ 6.7%)
    expect(screen.getByText(/Diagnostic Notice: Mild Curvature Detected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Include 2nd-Order Correction/i })).toBeInTheDocument();
  });

  it('allows clicking the persistent toggle anytime and reveals comparison pill', () => {
    render(
      <TestWrapper>
        <ErrorPropagationView />
      </TestWrapper>
    );

    const toggleCheckbox = screen.getByRole('checkbox', {
      name: /Include 2nd-order curvature corrections/i
    });

    // Click toggle to turn ON 2nd-order correction
    fireEvent.click(toggleCheckbox);
    expect(toggleCheckbox).toBeChecked();

    // Status pill switches to 2nd-ORDER ACTIVE
    expect(screen.getByText('2nd-ORDER ACTIVE')).toBeInTheDocument();

    // Comparison pill is displayed
    expect(screen.getByText('Linear:')).toBeInTheDocument();
    expect(screen.getByText('2nd-Order Corrected:')).toBeInTheDocument();

    // Banner now shows active applied indicator
    expect(screen.getByText(/2nd-Order Correction Applied/i)).toBeInTheDocument();
  });

  it('triggers critical extremum warning on stationary point and updates with enable button', () => {
    render(
      <TestWrapper>
        <ErrorPropagationView />
      </TestWrapper>
    );

    // Change formula to x^2
    const formulaInput = screen.getByLabelText(/Mathematical formula for error propagation/i);
    fireEvent.change(formulaInput, { target: { value: 'x^2' } });

    // Set variable x value = 0, unc = 0.5
    const valueInputs = screen.getAllByPlaceholderText('0.0');
    // First is value, second is uncertainty
    fireEvent.change(valueInputs[0], { target: { value: '0' } });
    fireEvent.change(valueInputs[1], { target: { value: '0.5' } });

    // Critical extremum alert banner appears
    expect(screen.getByText(/Critical Metrology Diagnostic: Local Extremum \/ Stationary Point/i)).toBeInTheDocument();
    expect(screen.getByText(/η_nl = ∞ \(Degenerate Linear\)/i)).toBeInTheDocument();

    // Click "Enable 2nd-Order Correction" in banner
    const enableBtn = screen.getByRole('button', { name: /Enable 2nd-Order Correction/i });
    fireEvent.click(enableBtn);

    // Shows applied status
    expect(screen.getByText(/2nd-Order Correction Applied/i)).toBeInTheDocument();

    // Evaluated result box and comparison pill display corrected value 0.3 ± 0.4
    expect(screen.getAllByText('0.3 ± 0.4').length).toBeGreaterThanOrEqual(1);
  });

  it('interacts with toggle on linear function without warnings and displays linear regime pill', () => {
    render(
      <TestWrapper>
        <ErrorPropagationView />
      </TestWrapper>
    );

    // Change formula to 3 * x
    const formulaInput = screen.getByLabelText(/Mathematical formula for error propagation/i);
    fireEvent.change(formulaInput, { target: { value: '3 * x' } });

    // No warning banners should be present
    expect(screen.queryByText(/Critical Metrology Diagnostic/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Severe Function Curvature/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mild Curvature Detected/i)).not.toBeInTheDocument();

    // Persistent toggle is still fully accessible and clickable
    const toggleCheckbox = screen.getByRole('checkbox', {
      name: /Include 2nd-order curvature corrections/i
    });
    expect(toggleCheckbox).toBeInTheDocument();

    // Turn ON toggle on linear function
    fireEvent.click(toggleCheckbox);
    expect(toggleCheckbox).toBeChecked();

    // Shows linear regime confirmation notice
    expect(screen.getByText(/Linear Regime/i)).toBeInTheDocument();
    expect(screen.getByText(/negligible effect/i)).toBeInTheDocument();
  });
});

describe('Constant Auto-Detection and Toggle Behavior', () => {
  it('does not display "(CODATA exact)" in auto constant detection', () => {
    render(
      <TestWrapper>
        <ErrorPropagationView />
      </TestWrapper>
    );

    // Default formula is 2 * P / (pi * w0^2), which detects 'pi'
    expect(screen.getByText('Auto-Detected Physical/Math Constants:')).toBeInTheDocument();
    // 'pi' constant button should be rendered
    const piBtn = screen.getByRole('button', { name: /Constant pi:/i });
    expect(piBtn).toBeInTheDocument();
    expect(piBtn).toHaveAttribute('aria-pressed', 'true');

    // "(CODATA exact)" should NOT exist anywhere in document
    expect(screen.queryByText(/CODATA exact/i)).not.toBeInTheDocument();
  });

  it('allows clicking constant button to disable it from being treated as constant, converting to user variable', () => {
    render(
      <TestWrapper>
        <ErrorPropagationView />
      </TestWrapper>
    );

    // Change formula to hbar * omega
    const formulaInput = screen.getByLabelText(/Mathematical formula for error propagation/i);
    fireEvent.change(formulaInput, { target: { value: 'hbar * omega' } });

    // Initially: omega is in variables checklist, hbar is in constants
    expect(screen.getByText('omega')).toBeInTheDocument();
    const hbarBtn = screen.getByRole('button', { name: /Constant hbar:/i });
    expect(hbarBtn).toBeInTheDocument();
    expect(hbarBtn).toHaveAttribute('aria-pressed', 'true');

    // Click hbar constant button to toggle it into a user variable
    fireEvent.click(hbarBtn);

    // Now hbarBtn shows treated as user variable
    expect(hbarBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('(as variable)')).toBeInTheDocument();

    // hbar now appears in the Auto-Detected Variables checklist
    expect(screen.getByRole('checkbox', { name: /hbar/i })).toBeInTheDocument();

    // Variable hbar card appears in the Numerical Uncertainty Evaluation section
    expect(screen.getByText('Variable hbar')).toBeInTheDocument();

    // Re-clicking restores it as physical constant
    fireEvent.click(hbarBtn);
    expect(hbarBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('(as variable)')).not.toBeInTheDocument();
    expect(screen.queryByText('Variable hbar')).not.toBeInTheDocument();
  });

  it('when constant is deselected, user can add error to it and enter custom value', () => {
    render(
      <TestWrapper>
        <ErrorPropagationView />
      </TestWrapper>
    );

    // Formula: hbar * omega
    const formulaInput = screen.getByLabelText(/Mathematical formula for error propagation/i);
    fireEvent.change(formulaInput, { target: { value: 'hbar * omega' } });

    // Toggle hbar into a variable
    const hbarBtn = screen.getByRole('button', { name: /Constant hbar:/i });
    fireEvent.click(hbarBtn);

    // Now find inputs for hbar and omega
    // Set hbar value = 2, unc = 0.5
    // Set omega value = 10, unc = 1
    const valueInputs = screen.getAllByPlaceholderText('0.0');
    // We have 4 inputs now (value & unc for hbar, value & unc for omega)
    expect(valueInputs.length).toBeGreaterThanOrEqual(4);

    // Update hbar value & unc
    fireEvent.change(valueInputs[0], { target: { value: '2' } });
    fireEvent.change(valueInputs[1], { target: { value: '0.5' } });
    // Update omega value & unc
    fireEvent.change(valueInputs[2], { target: { value: '10' } });
    fireEvent.change(valueInputs[3], { target: { value: '1' } });

    // Nominal: 2 * 10 = 20 (not 1.054e-34!)
    // Derivatives: df/dhbar = 10, df/domega = 2
    // Variance: (10 * 0.5)^2 + (2 * 1)^2 = 25 + 4 = 29
    // sigma_f = sqrt(29) approx 5.385
    expect(screen.getByText(/20\.0000/i)).toBeInTheDocument();
  });
});
