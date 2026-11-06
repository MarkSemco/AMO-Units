import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../../App';

describe('Tab Memory, ToggleGroup Selection & Preset Highlighting Behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
  });

  it('Optical Presets in Laser tab: only one preset is highlighted at a time and highlight clears on modification', () => {
    window.location.hash = '#laser';
    render(<App />);

    const laserTabBtn = screen.getByRole('tab', { name: /Laser Beam/i });
    fireEvent.click(laserTabBtn);

    const keplerianBtn = screen.getByRole('button', { name: /Keplerian Beam Expander/i });
    const galileanBtn = screen.getByRole('button', { name: /Galilean Beam Expander/i });

    // Initially neither preset has active styling
    expect(keplerianBtn.style.borderColor).not.toBe('var(--color-laser)');
    expect(galileanBtn.style.borderColor).not.toBe('var(--color-laser)');

    // Click Keplerian preset
    fireEvent.click(keplerianBtn);
    expect(keplerianBtn.style.borderColor).toBe('var(--color-laser)');
    expect(keplerianBtn.style.boxShadow).toContain('var(--color-laser)');
    expect(galileanBtn.style.borderColor).not.toBe('var(--color-laser)');

    // Click Galilean preset -> ONLY Galilean should be highlighted, Keplerian should not
    fireEvent.click(galileanBtn);
    expect(keplerianBtn.style.borderColor).not.toBe('var(--color-laser)');
    expect(galileanBtn.style.borderColor).toBe('var(--color-laser)');
    expect(galileanBtn.style.boxShadow).toContain('var(--color-laser)');

    // Add a lens -> modifies bench, so active preset highlight clears
    const addLensBtn = screen.getByRole('button', { name: /\+ Thin Lens/i });
    fireEvent.click(addLensBtn);
    expect(galileanBtn.style.borderColor).not.toBe('var(--color-laser)');
  });

  it('RF tab impedance toggle retains selected box and stays highlighted across tab switches', () => {
    window.location.hash = '#rf';
    render(<App />);

    const rfTabBtn = screen.getByRole('tab', { name: /RF Electronics/i });
    fireEvent.click(rfTabBtn);

    const btn50 = screen.getByRole('button', { name: /50 Ω/i });
    const btn75 = screen.getByRole('button', { name: /75 Ω/i });

    // Initial 50 Ω is selected
    expect(btn50).toHaveAttribute('aria-pressed', 'true');
    expect(btn75).toHaveAttribute('aria-pressed', 'false');

    // Click 75 Ω
    fireEvent.click(btn75);
    expect(btn50).toHaveAttribute('aria-pressed', 'false');
    expect(btn75).toHaveAttribute('aria-pressed', 'true');

    // Switch to Optical tab and return to RF tab
    const opticalTabBtn = screen.getByRole('tab', { name: /Optical & Energy/i });
    fireEvent.click(opticalTabBtn);
    fireEvent.click(rfTabBtn);

    // 75 Ω remains selected with active aria-pressed and badge styling
    expect(btn75).toHaveAttribute('aria-pressed', 'true');
    expect(btn75.style.borderColor).toBe('var(--color-rf)');
    expect(btn75.style.backgroundColor).toBe('var(--color-rf-badge)');
    expect(btn75.style.color).toBe('var(--color-rf)');
    expect(btn50).toHaveAttribute('aria-pressed', 'false');
    expect(btn50.style.backgroundColor).toBe('transparent');
  });

  it('Laser Beam tab remembers ABCD vs Polarization sub-view when returning from other tabs', () => {
    window.location.hash = '#laser';
    render(<App />);

    const laserTabBtn = screen.getByRole('tab', { name: /Laser Beam/i });
    fireEvent.click(laserTabBtn);

    const abcdBtn = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    const polBtn = screen.getByRole('button', { name: /Laser Polarization Beamline/i });

    // Initially ABCD is selected with laser badge styling
    expect(abcdBtn).toHaveAttribute('aria-pressed', 'true');
    expect(abcdBtn.style.borderColor).toBe('var(--color-laser)');
    expect(abcdBtn.style.backgroundColor).toBe('var(--color-laser-badge)');
    expect(abcdBtn.style.color).toBe('var(--color-laser)');
    expect(polBtn).toHaveAttribute('aria-pressed', 'false');

    // Select Laser Polarization Beamline
    fireEvent.click(polBtn);
    expect(abcdBtn).toHaveAttribute('aria-pressed', 'false');
    expect(polBtn).toHaveAttribute('aria-pressed', 'true');
    expect(polBtn.style.borderColor).toBe('var(--color-laser)');
    expect(polBtn.style.backgroundColor).toBe('var(--color-laser-badge)');
    expect(polBtn.style.color).toBe('var(--color-laser)');

    // Switch to RF Electronics tab
    const rfTabBtn = screen.getByRole('tab', { name: /RF Electronics/i });
    fireEvent.click(rfTabBtn);

    // Switch back to Laser Beam tab
    fireEvent.click(laserTabBtn);

    // Should remember that the user was on Laser Polarization Beamline!
    expect(polBtn).toHaveAttribute('aria-pressed', 'true');
    expect(polBtn.style.borderColor).toBe('var(--color-laser)');
    expect(polBtn.style.backgroundColor).toBe('var(--color-laser-badge)');
    expect(abcdBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('RF tab consolidated inputs: dropdown unit selector converts orders of magnitude and V_pk/V_pp', () => {
    window.location.hash = '#rf';
    render(<App />);

    const rfTabBtn = screen.getByRole('tab', { name: /RF Electronics/i });
    fireEvent.click(rfTabBtn);

    // 1. Linear Power dropdown (default mW: 10 mW)
    const linearInput = screen.getByLabelText(/Linear Power in mW/i);
    expect(linearInput).toHaveValue('10');

    // Change unit from mW to W
    const linearSelect = screen.getByRole('combobox', { name: /Select unit for Linear Power/i });
    fireEvent.change(linearSelect, { target: { value: 'W' } });
    expect(screen.getByLabelText(/Linear Power in W/i)).toHaveValue('0.01');

    // Edit value in W to 0.05 W (50 mW)
    fireEvent.change(screen.getByLabelText(/Linear Power in W/i), { target: { value: '0.05' } });

    // Change unit back to mW -> should show 50
    fireEvent.change(linearSelect, { target: { value: 'mW' } });
    expect(screen.getByLabelText(/Linear Power in mW/i)).toHaveValue('50');

    // 2. Voltage Peak / Peak-to-Peak dropdown selector
    // At 50 mW and 50 Ω: V_rms = sqrt(0.05 * 50) = sqrt(2.5) ≈ 1.58114 V
    // V_pk = sqrt(2) * 1.58114 ≈ 2.23607 V
    // V_pp = 2 * V_pk ≈ 4.47214 V
    const vPeakSelect = screen.getByRole('combobox', { name: /Select unit for Peak \/ Peak-to-Peak Voltage/i });
    const vPeakInput = screen.getByLabelText(/Peak \/ Peak-to-Peak Voltage in V_pk/i);
    expect(vPeakInput).toHaveValue('2.23607');

    // Switch to V_pp
    fireEvent.change(vPeakSelect, { target: { value: 'V_pp' } });
    const vppInput = screen.getByLabelText(/Peak \/ Peak-to-Peak Voltage in V_pp/i);
    expect(vppInput).toHaveValue('4.47214');

    // Change V_pp to 2 V_pp -> V_rms = 2 / (2 * sqrt(2)) = 0.7071 V -> P = 0.7071^2 / 50 = 0.01 W = 10 mW
    fireEvent.change(vppInput, { target: { value: '2' } });
    expect(screen.getByLabelText(/Linear Power in mW/i)).toHaveValue('10');
  });

  it('RF tab quick load presets highlight when values match and clear when custom values are entered', () => {
    window.location.hash = '#rf';
    render(<App />);

    const rfTabBtn = screen.getByRole('tab', { name: /RF Electronics/i });
    fireEvent.click(rfTabBtn);

    const aomBtn = screen.getByRole('button', { name: /AOM Coil \(25\+j35Ω\)/i });
    const matchedBtn = screen.getByRole('button', { name: /Matched \(50Ω\)/i });

    // Initially 50Ω Matched is active
    expect(matchedBtn.style.borderColor).toBe('var(--color-rf)');

    // Click AOM Coil preset
    fireEvent.click(aomBtn);
    expect(aomBtn.style.borderColor).toBe('var(--color-rf)');
    expect(aomBtn.style.boxShadow).toContain('var(--color-rf)');
    expect(matchedBtn.style.borderColor).not.toBe('var(--color-rf)');
  });
});
