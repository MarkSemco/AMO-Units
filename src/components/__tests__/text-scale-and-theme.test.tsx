import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { SettingsProvider, useSettings } from '../../context/SettingsContext';
import { Header } from '../layout/Header';
import { CommandPalette } from '../productivity/CommandPalette';
import { TabNavigation } from '../layout/TabNavigation';
import { LaserBeamConverter } from '../modules/LaserBeamConverter';
import { PresetProvider } from '../../context/PresetContext';
import { HistoryProvider } from '../../context/HistoryContext';

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <SettingsProvider>
      <PresetProvider>
        <HistoryProvider>{children}</HistoryProvider>
      </PresetProvider>
    </SettingsProvider>
  </ThemeProvider>
);

describe('Permanently Locked Dark Mode (ThemeContext)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('permanently locks theme to dark mode and applies dark attribute and class', () => {
    const TestComponent = () => {
      const { theme, toggleTheme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme-val">{theme}</span>
          <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
          <button data-testid="set-light-btn" onClick={() => setTheme('light')}>Set Light</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Calling toggleTheme is a no-op that preserves 'dark'
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Calling setTheme('light') is a no-op that preserves 'dark'
    fireEvent.click(screen.getByTestId('set-light-btn'));
    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

describe('Header & TextScaleMenu UI', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.fontSize = '16px';
  });

  it('has removed light/dark theme toggle button entirely from Header', () => {
    render(
      <AllProviders>
        <Header />
      </AllProviders>
    );

    // Sun / Moon / Toggle theme button should NOT exist
    expect(screen.queryByLabelText(/Toggle theme/i)).toBeNull();
    expect(screen.queryByTitle(/Switch to.*mode/i)).toBeNull();
  });

  it('renders UI Text Resizer pill trigger with percentage and opens popover card', () => {
    render(
      <AllProviders>
        <Header />
      </AllProviders>
    );

    // Pill trigger
    const pillTrigger = screen.getByRole('button', { name: /UI text scaling menu/i });
    expect(pillTrigger).toBeInTheDocument();
    expect(pillTrigger).toHaveTextContent('100%');

    // Open popover
    fireEvent.click(pillTrigger);

    // Popover elements
    expect(screen.getByText('UI Text Scaling')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decrease text size/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Increase text size/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /UI text size scaling slider/i })).toBeInTheDocument();

    // 2x2 Presets
    expect(screen.getByRole('button', { name: /85% Compact/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /100% Standard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /115% Relaxed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /130% Large/i })).toBeInTheDocument();
  });

  it('scales root font-size and --app-font-scale when selecting preset or adjusting slider', () => {
    render(
      <AllProviders>
        <Header />
      </AllProviders>
    );

    const pillTrigger = screen.getByRole('button', { name: /UI text scaling menu/i });
    fireEvent.click(pillTrigger);

    // Click 115% Relaxed
    const relaxedPreset = screen.getByRole('button', { name: /115% Relaxed/i });
    fireEvent.click(relaxedPreset);

    // Verify root font size scaled: 16 * 1.15 = 18.4px
    expect(document.documentElement.style.fontSize).toBe('18.4px');
    expect(document.documentElement.style.getPropertyValue('--app-font-scale')).toBe('1.15');
    expect(pillTrigger).toHaveTextContent('115%');

    // Click A- stepper (-5%)
    const aMinus = screen.getByRole('button', { name: /Decrease text size/i });
    fireEvent.click(aMinus);

    // 115% - 5% = 110% -> 16 * 1.10 = 17.6px
    expect(document.documentElement.style.fontSize).toBe('17.6px');
    expect(document.documentElement.style.getPropertyValue('--app-font-scale')).toBe('1.1');
    expect(pillTrigger).toHaveTextContent('110%');
  });

  it('closes popover on outside click or Escape key', () => {
    render(
      <AllProviders>
        <div>
          <div data-testid="outside">Outside Element</div>
          <Header />
        </div>
      </AllProviders>
    );

    const pillTrigger = screen.getByRole('button', { name: /UI text scaling menu/i });
    fireEvent.click(pillTrigger);
    expect(screen.getByText('UI Text Scaling')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('UI Text Scaling')).toBeNull();

    // Reopen and click outside
    fireEvent.click(pillTrigger);
    expect(screen.getByText('UI Text Scaling')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('UI Text Scaling')).toBeNull();
  });
});

describe('CommandPalette Theme Removal & Text Scaling Commands', () => {
  it('does not contain theme toggle command and contains all 4 text size preset actions', () => {
    const PaletteHost = () => {
      const { setCommandPaletteOpen } = useSettings();
      return (
        <div>
          <button onClick={() => setCommandPaletteOpen(true)}>Open Palette</button>
          <CommandPalette />
        </div>
      );
    };

    render(
      <AllProviders>
        <PaletteHost />
      </AllProviders>
    );

    fireEvent.click(screen.getByRole('button', { name: /Open Palette/i }));

    // Verify Theme toggle command is removed
    expect(screen.queryByText(/Toggle Theme/i)).toBeNull();

    // Verify all 4 text size scaling preset commands exist
    expect(screen.getByText(/Set Text Size to 85% \(Compact\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Reset Text Size to 100% \(Standard\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Set Text Size to 115% \(Relaxed\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Set Text Size to 130% \(Large\)/i)).toBeInTheDocument();
  });
});

describe('Laser Beam Tab and ABCD Waists & Focal Catalog', () => {
  it('displays renamed "Laser Beam" tab in TabNavigation', () => {
    render(
      <AllProviders>
        <TabNavigation />
      </AllProviders>
    );

    expect(screen.getByRole('tab', { name: /^Laser Beam/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Laser Beam & Rabi/i })).toBeNull();
  });

  it('displays Power input, live caliper intensities/fields, Rayleigh range, and waist catalog with jump buttons', () => {
    render(
      <AllProviders>
        <LaserBeamConverter />
      </AllProviders>
    );

    // Beam Power input
    const powerInput = screen.getByLabelText(/Laser Beam Power$/i);
    expect(powerInput).toHaveValue('10');

    // Caliper readouts (including Rayleigh Range and Peak E-Field in V/m)
    expect(screen.getByText(/Caliper Position/i)).toBeInTheDocument();
    expect(screen.getByText(/Beam Radius w\(z\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Rayleigh Range z_R/i)).toBeInTheDocument();
    expect(screen.getByText(/Peak Intensity I₀\(z\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Intensity I_avg\(z\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Peak E-Field E₀\(z\)/i)).toBeInTheDocument();

    // Identified Beam Waists Catalog table
    expect(screen.getByText(/Identified Beam Waists \(\d+\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Initial Waist \(Launch\)/i)).toBeInTheDocument();

    // Jump Caliper button for initial waist and subsequent waists
    const jumpButtons = screen.getAllByRole('button', { name: /Jump Caliper/i });
    expect(jumpButtons.length).toBeGreaterThanOrEqual(1);

    // Clicking Jump Caliper on initial waist sets caliper position to 0.0 mm
    fireEvent.click(jumpButtons[0]);
    const caliperInput = screen.getByLabelText(/Caliper Position z in mm/i);
    expect(caliperInput).toHaveValue('0.0');

    // If subsequent waists exist, clicking Jump Caliper jumps to that waist
    if (jumpButtons.length > 1) {
      fireEvent.click(jumpButtons[1]);
      expect(caliperInput).not.toHaveValue('0.0');
    }
  });
});
