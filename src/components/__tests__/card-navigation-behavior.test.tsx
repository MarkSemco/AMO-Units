import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../../App';
import { Card } from '../common/Card';
import { TabNavigation } from '../layout/TabNavigation';
import { SettingsProvider } from '../../context/SettingsContext';
import { PresetProvider } from '../../context/PresetContext';
import { FormulaInspectorView } from '../modules/FormulaInspectorView';
import { PolarizationInputConverter } from '../modules/polarization/PolarizationInputConverter';
import { getPresetPolarization } from '../../core/polarization';

describe('Card Component - Chevron-Only Collapsing & Default Collapsible', () => {
  it('is collapsible by default and displays the collapse chevron button', () => {
    render(
      <Card title="Test Widget" subtitle="Widget description">
        <div data-testid="card-content">Visible Content</div>
      </Card>
    );

    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    const chevronButton = screen.getByRole('button', { name: /Collapse section/i });
    expect(chevronButton).toBeInTheDocument();
  });

  it('does NOT collapse when clicking the card header div or title', () => {
    render(
      <Card title="Clickable Header" subtitle="Clicking this must not toggle">
        <div data-testid="card-content">Visible Content</div>
      </Card>
    );

    const titleElement = screen.getByText('Clickable Header');
    const subtitleElement = screen.getByText('Clicking this must not toggle');

    // Click on title text
    fireEvent.click(titleElement);
    expect(screen.getByTestId('card-content')).toBeInTheDocument();

    // Click on subtitle text
    fireEvent.click(subtitleElement);
    expect(screen.getByTestId('card-content')).toBeInTheDocument();

    // Chevron button still says Collapse section (not collapsed)
    expect(screen.getByRole('button', { name: /Collapse section/i })).toBeInTheDocument();
  });

  it('collapses and expands ONLY when clicking the chevron button itself', () => {
    render(
      <Card title="Chevron Controlled Card">
        <div data-testid="card-content">Collapsible Body</div>
      </Card>
    );

    const chevronButton = screen.getByRole('button', { name: /Collapse section/i });
    expect(screen.getByTestId('card-content')).toBeInTheDocument();

    // Click chevron -> Collapses content
    fireEvent.click(chevronButton);
    expect(screen.queryByTestId('card-content')).toBeNull();
    expect(screen.getByRole('button', { name: /Expand section/i })).toBeInTheDocument();

    // Click chevron again -> Expands content
    const expandButton = screen.getByRole('button', { name: /Expand section/i });
    fireEvent.click(expandButton);
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Collapse section/i })).toBeInTheDocument();
  });

  it('does not render chevron when collapsible is explicitly set to false', () => {
    render(
      <Card title="Non-Collapsible Card" collapsible={false}>
        <div data-testid="card-content">Always Visible</div>
      </Card>
    );

    expect(screen.queryByRole('button', { name: /Collapse section/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Expand section/i })).toBeNull();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });
});

describe('TabNavigation - Magnetic & Zeeman Tab Removal and Presets Merged into Formulas', () => {
  it('renders exactly 5 tabs with Formulas and Presets and without Magnetic & Zeeman', () => {
    render(
      <SettingsProvider>
        <TabNavigation />
      </SettingsProvider>
    );

    // Magnetic & Zeeman tab must NOT exist
    expect(screen.queryByText(/Magnetic & Zeeman/i)).toBeNull();
    expect(screen.queryByText(/Zeeman/i)).toBeNull();

    // The 5 tabs must be present
    expect(screen.getByRole('tab', { name: /Optical & Energy/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Laser Beam/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /RF Electronics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Error Propagation/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Formulas and Presets/i })).toBeInTheDocument();

    // Standalone Atomic Presets tab should no longer be a top-level tab
    expect(screen.queryByRole('tab', { name: /^Atomic Presets/i })).toBeNull();

    const allTabs = screen.getAllByRole('tab');
    expect(allTabs).toHaveLength(5);
  });
});

describe('PolarizationInputConverter - Focus & Text Box Cursor Behavior', () => {
  it('does not select all text when focused and applies laser glow ring styling', () => {
    const handleChange = vi.fn();
    render(
      <PolarizationInputConverter
        value={getPresetPolarization('H', 1.0)}
        onChange={handleChange}
      />
    );

    const e0xInput = screen.getByLabelText(/E0x Amplitude/i) as HTMLInputElement;
    const selectSpy = vi.spyOn(e0xInput, 'select');

    // Initial unfocused styling
    expect(e0xInput.style.backgroundColor).toBe('var(--color-bg-input)');
    expect(e0xInput.style.borderColor).toBe('var(--color-border-subtle)');

    // Focus into the input
    fireEvent.focus(e0xInput);

    // select() must NOT be called on focus
    expect(selectSpy).not.toHaveBeenCalled();

    // Focused styling should be applied
    expect(e0xInput.style.backgroundColor).toBe('var(--color-bg-input-hover)');
    expect(e0xInput.style.borderColor).toBe('var(--color-laser)');
    expect(e0xInput.style.boxShadow).toContain('var(--color-laser-badge)');

    // Blur from input restores default styling
    fireEvent.blur(e0xInput);
    expect(e0xInput.style.backgroundColor).toBe('var(--color-bg-input)');
    expect(e0xInput.style.borderColor).toBe('var(--color-border-subtle)');
  });

  it('has polarization-input class on all inputs for hover styling', () => {
    const handleChange = vi.fn();
    render(
      <PolarizationInputConverter
        value={getPresetPolarization('H', 1.0)}
        onChange={handleChange}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(11);
    inputs.forEach(input => {
      expect(input.className).toContain('polarization-input');
    });
  });
});

describe('Card Component - Chevron Button StopPropagation & Styling', () => {
  it('stops event propagation when clicking chevron button so parent handlers do not fire', () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <Card title="Nested Card">
          <div>Nested Content</div>
        </Card>
      </div>
    );

    const chevron = screen.getByRole('button', { name: /Collapse section/i });
    expect(chevron).toHaveClass('card-chevron-button');
    fireEvent.click(chevron);

    // Parent handler must NOT have been called due to e.stopPropagation()
    expect(parentClick).not.toHaveBeenCalled();
  });
});

describe('SettingsContext - URL Hash & Legacy Redirection', () => {
  it('redirects legacy #magnetic hash to #optical gracefully', () => {
    window.location.hash = '#magnetic';
    render(
      <SettingsProvider>
        <TabNavigation />
      </SettingsProvider>
    );

    // Should redirect to #optical
    expect(window.location.hash).toBe('#optical');
    const opticalTab = screen.getByRole('tab', { name: /Optical & Energy/i });
    expect(opticalTab).toHaveAttribute('aria-selected', 'true');
  });

  it('maps #presets hash to formulas tab gracefully', () => {
    window.location.hash = '#presets';
    render(
      <SettingsProvider>
        <TabNavigation />
      </SettingsProvider>
    );

    const formulasTab = screen.getByRole('tab', { name: /Formulas and Presets/i });
    expect(formulasTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders FormulaInspectorView with both formulas catalog and presets library appended at the bottom', () => {
    const { container } = render(
      <SettingsProvider>
        <PresetProvider>
          <FormulaInspectorView />
        </PresetProvider>
      </SettingsProvider>
    );

    // Formulas catalog section exists
    expect(screen.getByText(/Formula & Equation Catalog/i)).toBeInTheDocument();

    // Presets library exists inside the #presets container at the bottom
    const presetsContainer = container.querySelector('#presets');
    expect(presetsContainer).not.toBeNull();
    expect(presetsContainer).toHaveTextContent(/Atomic & Molecular Transition Library/i);
    expect(screen.getByText(/Atomic & Molecular Transition Library/i)).toBeInTheDocument();
  });

  it('renders the open-source GitHub verification suite button and link without any zip download buttons', () => {
    render(
      <SettingsProvider>
        <PresetProvider>
          <FormulaInspectorView />
        </PresetProvider>
      </SettingsProvider>
    );

    const githubLink = screen.getByRole('link', { name: /View Source & Verification Suite on GitHub/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/MarkSemco/AMO-Units');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    // Confirm zero references to downloadable zip bundle
    expect(screen.queryByText(/Download Source Archive/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/amo-units-source-verification\.zip/i)).not.toBeInTheDocument();
  });
});

describe('App - Tab State Preservation (No automatic resetting on tab navigation)', () => {
  it('preserves user input in Optical and Laser Beam tabs when switching back and forth', () => {
    window.location.hash = '#optical';
    render(<App />);

    // In Optical tab, change wavelength to 532 nm
    const [opticalWavelengthInput] = screen.getAllByLabelText(/Wavelength in nm/i);
    fireEvent.change(opticalWavelengthInput, { target: { value: '532' } });
    expect(opticalWavelengthInput).toHaveValue('532');

    // Switch to Laser Beam tab
    const laserTab = screen.getByRole('tab', { name: /^Laser Beam/i });
    fireEvent.click(laserTab);

    // In Laser Beam tab, change power to 45 mW
    const powerInput = screen.getByLabelText(/Laser Beam Power$/i);
    fireEvent.change(powerInput, { target: { value: '45' } });
    expect(powerInput).toHaveValue('45');

    // Switch to RF Electronics tab
    const rfTab = screen.getByRole('tab', { name: /RF Electronics/i });
    fireEvent.click(rfTab);

    // Switch BACK to Optical tab
    const opticalTab = screen.getByRole('tab', { name: /Optical & Energy/i });
    fireEvent.click(opticalTab);

    // Verify optical wavelength did NOT reset to default 261.5 nm; it remained 532!
    expect(opticalWavelengthInput).toHaveValue('532');

    // Switch BACK to Laser Beam tab
    fireEvent.click(laserTab);

    // Verify laser power did NOT reset to default 10 mW; it remained 45!
    expect(powerInput).toHaveValue('45');
  });
});
