import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpticalConverter } from '../modules/OpticalConverter';
import { LaserBeamConverter } from '../modules/LaserBeamConverter';
import { PresetLibraryView } from '../modules/PresetLibraryView';
import { SettingsProvider } from '../../context/SettingsContext';
import { PresetProvider, usePresets } from '../../context/PresetContext';
import { HistoryProvider } from '../../context/HistoryContext';
import { DEFAULT_PRESETS } from '../../constants/default-presets';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SettingsProvider>
    <PresetProvider>
      <HistoryProvider>{children}</HistoryProvider>
    </PresetProvider>
  </SettingsProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe('OpticalConverter AlCl Defaults and Reset', () => {
  it('initializes with AlCl wavelength (261.5 nm)', () => {
    render(
      <TestWrapper>
        <OpticalConverter />
      </TestWrapper>
    );

    const wavelengthInput = screen.getByLabelText(/Wavelength in nm/i);
    expect(wavelengthInput).toHaveValue('261.5');

    // Reset button has the correct label
    const resetButton = screen.getByRole('button', { name: /Reset to AlCl \(261.5 nm\)/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('resets back to 261.5 nm and nm unit after modifications', () => {
    render(
      <TestWrapper>
        <OpticalConverter />
      </TestWrapper>
    );

    const wavelengthInput = screen.getByLabelText(/Wavelength in nm/i);
    fireEvent.change(wavelengthInput, { target: { value: '500' } });

    const resetButton = screen.getByRole('button', { name: /Reset to AlCl \(261.5 nm\)/i });
    fireEvent.click(resetButton);

    const restoredInput = screen.getByLabelText(/Wavelength in nm/i);
    expect(restoredInput).toHaveValue('261.5');
  });

  it('dynamically updates reset button and resets to loaded profile (CaF at 531 nm)', () => {
    const TestComponent: React.FC = () => {
      const { applyPreset } = usePresets();
      return (
        <div>
          <button
            onClick={() => {
              const caf = DEFAULT_PRESETS.find(p => p.species === 'CaF' && p.wavelengthNm === 531.0);
              if (caf) applyPreset(caf);
            }}
          >
            Apply CaF
          </button>
          <OpticalConverter />
        </div>
      );
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Click Apply CaF
    fireEvent.click(screen.getByRole('button', { name: /Apply CaF/i }));

    // Reset button now reflects CaF (531 nm)
    const resetButton = screen.getByRole('button', { name: /Reset to CaF \(531 nm\)/i });
    expect(resetButton).toBeInTheDocument();

    // Modify wavelength to 600 nm
    const wavelengthInput = screen.getByLabelText(/Wavelength in nm/i);
    fireEvent.change(wavelengthInput, { target: { value: '600' } });
    expect(wavelengthInput).toHaveValue('600');

    // Click Reset
    fireEvent.click(resetButton);

    // Restored to CaF 531 nm
    expect(screen.getByLabelText(/Wavelength in nm/i)).toHaveValue('531');
  });
});

describe('LaserBeamConverter AlCl Defaults and Scaling', () => {
  it('initializes with AlCl parameters (261.5 nm, w0 = 100 µm, P = 10 mW)', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/Wavelength in nm/i)).toHaveValue('261.5');
    expect(screen.getByLabelText(/Initial Waist Radius w0 in um/i)).toHaveValue('100');
    expect(screen.getByLabelText(/Laser Beam Power$/i)).toHaveValue('10');
    expect(screen.getByRole('button', { name: /Reset Beam \(10mW, 100µm\)/i })).toBeInTheDocument();
    expect(screen.getByText(/Identified Beam Waists \(\d+\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Initial Waist \(Launch\)/i)).toBeInTheDocument();
  });

  it('allows changing beam power value and power unit', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const powerInput = screen.getByLabelText(/Laser Beam Power$/i);
    expect(powerInput).toHaveValue('10');

    fireEvent.change(powerInput, { target: { value: '25' } });
    expect(powerInput).toHaveValue('25');

    const powerSelect = screen.getByLabelText(/Laser Beam Power Unit/i);
    fireEvent.change(powerSelect, { target: { value: 'W' } });
    expect(powerSelect).toHaveValue('W');
  });

  it('clarifies 1/e² vs 1/e waist convention and toggles live equivalent spot sizes guide', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    // Explicit 1/e² waist labels
    expect(screen.getByText(/Initial w₀ \(1\/e²\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Waist w₀ \(1\/e²\):/i)).toBeInTheDocument();

    // Toggle Guide Button
    const guideBtn = screen.getByRole('button', { name: /1\/e² vs 1\/e Guide/i });
    expect(guideBtn).toBeInTheDocument();

    // Open convention guide
    fireEvent.click(guideBtn);

    expect(screen.getByText(/Gaussian Beam Waist Convention Guide: 1\/e² Intensity vs 1\/e Field/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/e² Intensity Radius w₀ \(Input\)/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/e² Intensity Diameter 2w₀/i)).toBeInTheDocument();
    expect(screen.getByText(/FWHM Diameter \(50% Intensity\)/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/e Intensity Radius/i)).toBeInTheDocument();

    // Close convention guide
    const closeBtn = screen.getByRole('button', { name: /Close waist convention guide/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Gaussian Beam Waist Convention Guide/i)).toBeNull();
  });

  it('updates waist value when edited', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const waistInput = screen.getByLabelText(/Initial Waist Radius w0 in um/i);
    expect(waistInput).toHaveValue('100');

    fireEvent.change(waistInput, { target: { value: '150' } });
    expect(waistInput).toHaveValue('150');
  });
});

describe('PresetContext Defaults and Persistence', () => {
  it('initializes appliedPreset to AlCl (mol-alcl-main)', () => {
    localStorage.clear();
    const PresetInspector: React.FC = () => {
      const { appliedPreset } = usePresets();
      return <div data-testid="applied-preset">{appliedPreset?.name}</div>;
    };

    render(
      <PresetProvider>
        <PresetInspector />
      </PresetProvider>
    );

    expect(screen.getByTestId('applied-preset')).toHaveTextContent(/AlCl \(Aluminum Monochloride\)/i);
  });

  it('persists applied preset to localStorage and restores it on subsequent load', () => {
    localStorage.clear();
    const PresetModifier: React.FC = () => {
      const { appliedPreset, applyPreset } = usePresets();
      return (
        <div>
          <div data-testid="active-preset-name">{appliedPreset?.species}</div>
          <button
            onClick={() => {
              const rb = DEFAULT_PRESETS.find(p => p.id === 'atom-rb87-d2');
              if (rb) applyPreset(rb);
            }}
          >
            Load Rb87
          </button>
        </div>
      );
    };

    const { unmount } = render(
      <PresetProvider>
        <PresetModifier />
      </PresetProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Load Rb87/i }));
    expect(screen.getByTestId('active-preset-name')).toHaveTextContent(/⁸⁷Rb/i);
    expect(localStorage.getItem('amo-units-last-applied-preset-id')).toBe('atom-rb87-d2');

    unmount();

    // Re-mount PresetProvider to simulate page reload / new session
    const NewSessionInspector: React.FC = () => {
      const { appliedPreset } = usePresets();
      return <div data-testid="reloaded-preset-name">{appliedPreset?.species}</div>;
    };

    render(
      <PresetProvider>
        <NewSessionInspector />
      </PresetProvider>
    );

    expect(screen.getByTestId('reloaded-preset-name')).toHaveTextContent(/⁸⁷Rb/i);
  });

  it('renders AI extraction advisory banner and per-card note in PresetLibraryView', () => {
    render(
      <TestWrapper>
        <PresetLibraryView />
      </TestWrapper>
    );

    // Header advisory banner
    expect(
      screen.getByText(/have been extracted by AI from these publications and have not been verified by a person yet/i)
    ).toBeInTheDocument();

    // Per-card note
    const cardNotes = screen.getAllByText(/Extracted by AI from these publications; not yet verified by a person/i);
    expect(cardNotes.length).toBeGreaterThanOrEqual(1);
  });
});

describe('RfElectronicsConverter Complex RF & Smith Chart Integration', () => {
  it('renders Complex Impedance and L-C matching synthesizer card', async () => {
    const { RfElectronicsConverter } = await import('../modules/RfElectronicsConverter');

    render(
      <TestWrapper>
        <RfElectronicsConverter />
      </TestWrapper>
    );

    // Verify Complex Impedance card title
    expect(
      screen.getByText(/Complex Impedance, Smith Chart & Reactive Load Analyzer/i)
    ).toBeInTheDocument();

    // Verify default matched 50 ohm state (center of Smith chart)
    expect(screen.getByLabelText(/Load Resistance.*in Ω/i)).toHaveValue('50');
    expect(screen.getByLabelText(/Load Reactance.*in Ω/i)).toHaveValue('0');
    expect(screen.getByText(/Load is already matched to 50 Ω/i)).toBeInTheDocument();

    // Click AOM Coil preset (25+j35Ω)
    const aomPresetBtn = screen.getByRole('button', { name: /AOM Coil \(25\+j35Ω\)/i });
    fireEvent.click(aomPresetBtn);

    // Verify presence of updated load inputs
    expect(screen.getByLabelText(/Load Resistance.*in Ω/i)).toHaveValue('25');
    expect(screen.getByLabelText(/Load Reactance.*in Ω/i)).toHaveValue('35');

    // Verify L-C Matching Network synthesis is displayed with both Low-Pass and High-Pass solutions
    expect(
      screen.getByText(/Analytical L-Section Matching Network \(Transforms/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Low-Pass Topology/i)).toBeInTheDocument();
    expect(screen.getByText(/High-Pass Topology/i)).toBeInTheDocument();
  });
});

describe('LaserBeamConverter ABCD Matrix Propagation Bench Integration', () => {
  it('renders ABCD Beam Propagation bench by default and switches to Laser Polarization', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    // Initial view: ABCD Beam Propagation Bench
    expect(
      screen.getByText(/ABCD Matrix Gaussian Beam Simulator/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Caliper Position/i)).toBeInTheDocument();
    expect(screen.getByText(/Keplerian Beam Expander/i)).toBeInTheDocument();

    // Switch toggle to Laser Polarization Beamline
    const polTab = screen.getByRole('button', { name: /Laser Polarization/i });
    fireEvent.click(polTab);

    expect(screen.getByText(/Input Polarization State/i)).toBeInTheDocument();
  });

  it('verifies mirror is removed from optical elements controls', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const abcdTab = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    fireEvent.click(abcdTab);

    // + Mirror button must NOT exist in the DOM
    expect(screen.queryByRole('button', { name: /\+ Mirror/i })).toBeNull();
    // Thin and Thick lens buttons must still exist
    expect(screen.getByRole('button', { name: /\+ Thin Lens/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Thick Lens/i })).toBeInTheDocument();
  });

  it('allows typing into caliper position input and updates caliper reading', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const abcdTab = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    fireEvent.click(abcdTab);

    const caliperInput = screen.getByLabelText(/Caliper Position z in mm/i);
    expect(caliperInput).toHaveValue('180.0');

    // User can select all, backspace, and type a new position
    fireEvent.focus(caliperInput);
    fireEvent.change(caliperInput, { target: { value: '' } });
    expect(caliperInput).toHaveValue('');

    fireEvent.change(caliperInput, { target: { value: '240.5' } });
    fireEvent.blur(caliperInput);

    expect(caliperInput).toHaveValue('240.5');
  });

  it('allows clearing initial waist input and typing a new waist value', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const abcdTab = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    fireEvent.click(abcdTab);

    const waistInput = screen.getByLabelText(/Initial Waist Radius w0 in um/i);
    expect(waistInput).toHaveValue('100');

    // User can delete all numbers and type new waist
    fireEvent.focus(waistInput);
    fireEvent.change(waistInput, { target: { value: '' } });
    expect(waistInput).toHaveValue('');

    fireEvent.change(waistInput, { target: { value: '150' } });
    fireEvent.blur(waistInput);

    expect(waistInput).toHaveValue('150');
  });

  it('displays dismissable warning when waist is below diffraction limit', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const abcdTab = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    fireEvent.click(abcdTab);

    const waistInput = screen.getByLabelText(/Initial Waist Radius w0 in um/i);

    // For 261.5 nm, limit is (0.2615 um) / pi = 0.0832 um.
    // Entering 0.05 um triggers the warning banner
    fireEvent.focus(waistInput);
    fireEvent.change(waistInput, { target: { value: '0.05' } });
    fireEvent.blur(waistInput);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Diffraction Limit/i);

    // Clicking dismiss button closes the warning
    const dismissBtn = screen.getByRole('button', { name: /Dismiss diffraction limit warning/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders calibrated Y-axis on the canvas', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const abcdTab = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    fireEvent.click(abcdTab);

    // Calibrated Y-axis label w (µm)
    expect(screen.getByText(/w \(µm\)/i)).toBeInTheDocument();
  });

  it('clamps caliper position when rail length is shortened below caliper z', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const abcdTab = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    fireEvent.click(abcdTab);

    const caliperInput = screen.getByLabelText(/Caliper Position z in mm/i);
    // Set caliper to 400 mm
    fireEvent.focus(caliperInput);
    fireEvent.change(caliperInput, { target: { value: '400' } });
    fireEvent.blur(caliperInput);
    expect(caliperInput).toHaveValue('400.0');

    // Shorten bench length to 250 mm
    const railInput = screen.getByLabelText(/Bench Length in mm/i);
    fireEvent.focus(railInput);
    fireEvent.change(railInput, { target: { value: '250' } });
    fireEvent.blur(railInput);

    // Caliper position should now be clamped to 250 mm
    expect(caliperInput).toHaveValue('250.0');
  });

  it('keeps diffraction warning dismissed while below limit, and resets when waist returns above', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const abcdTab = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    fireEvent.click(abcdTab);

    const waistInput = screen.getByLabelText(/Initial Waist Radius w0 in um/i);

    // Enter sub-diffraction limit waist: 0.05 um
    fireEvent.focus(waistInput);
    fireEvent.change(waistInput, { target: { value: '0.05' } });
    fireEvent.blur(waistInput);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Dismiss warning
    const dismissBtn = screen.getByRole('button', { name: /Dismiss diffraction limit warning/i });
    fireEvent.click(dismissBtn);
    expect(screen.queryByRole('alert')).toBeNull();

    // Enter another sub-diffraction limit waist: 0.04 um — warning stays dismissed
    fireEvent.focus(waistInput);
    fireEvent.change(waistInput, { target: { value: '0.04' } });
    fireEvent.blur(waistInput);
    expect(screen.queryByRole('alert')).toBeNull();

    // Restore waist above diffraction limit: 100 um
    fireEvent.focus(waistInput);
    fireEvent.change(waistInput, { target: { value: '100' } });
    fireEvent.blur(waistInput);
    expect(screen.queryByRole('alert')).toBeNull();

    // Enter sub-diffraction waist again: 0.03 um — warning should reappear now
    fireEvent.focus(waistInput);
    fireEvent.change(waistInput, { target: { value: '0.03' } });
    fireEvent.blur(waistInput);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('switches optical presets and synchronizes rail length and caliper', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    const abcdTab = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    fireEvent.click(abcdTab);

    // Click Galilean Beam Expander preset
    const galileanBtn = screen.getByRole('button', { name: /Galilean Beam Expander/i });
    fireEvent.click(galileanBtn);

    const railInput = screen.getByLabelText(/Bench Length in mm/i);
    expect(railInput).toHaveValue('400');

    const caliperInput = screen.getByLabelText(/Caliper Position z in mm/i);
    // Galilean preset zMaxMm is 400 mm, caliper defaults to 75% = 300 mm
    expect(caliperInput).toHaveValue('300.0');

    // Negative lens (f = -50mm) should be listed on bench
    expect(screen.getByText(/Negative Lens \(f = -50mm\)/i)).toBeInTheDocument();
  });
});

