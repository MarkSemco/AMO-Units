import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncedInput } from '../common/SyncedInput';
import { SettingsProvider } from '../../context/SettingsContext';

describe('SyncedInput Component', () => {
  it('renders compact unit codes on the selector button and full names inside options', () => {
    const handleUnitChange = vi.fn();
    const handleChange = vi.fn();

    render(
      <SettingsProvider>
        <SyncedInput
          id="test-input"
          label="Wavelength"
          symbol="λ"
          value="261.5"
          unit="um"
          category="optical"
          onChange={handleChange}
          unitOptions={[
            { value: 'nm', label: 'nm (nanometers)' },
            { value: 'um', label: 'µm (microns)' },
            { value: 'm', label: 'm (meters)' },
            { value: 'angstrom', label: 'Å (angstroms)' }
          ]}
          onUnitChange={handleUnitChange}
        />
      </SettingsProvider>
    );

    // Pill must show compact code 'µm'
    expect(screen.getByText('µm')).toBeInTheDocument();

    // Select should contain all full label options
    const select = screen.getByRole('combobox', { name: /Select unit for Wavelength/i });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('um');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('nm (nanometers)');
    expect(options[1]).toHaveTextContent('µm (microns)');
    expect(options[2]).toHaveTextContent('m (meters)');
    expect(options[3]).toHaveTextContent('Å (angstroms)');
  });

  it('robustly matches select value when caller passes compact representation (e.g. µm)', () => {
    render(
      <SettingsProvider>
        <SyncedInput
          id="waist-input"
          label="Waist"
          value="100"
          unit="µm"
          category="laser"
          onChange={vi.fn()}
          unitOptions={[
            { value: 'um', label: 'µm (microns)' },
            { value: 'mm', label: 'mm (millimeters)' }
          ]}
          onUnitChange={vi.fn()}
        />
      </SettingsProvider>
    );

    const select = screen.getByRole('combobox', { name: /Select unit for Waist/i });
    // Matched value should be 'um'
    expect(select).toHaveValue('um');
    expect(screen.getByText('µm')).toBeInTheDocument();
  });

  it('does not render an empty badge when unit is empty string', () => {
    const { container } = render(
      <SettingsProvider>
        <SyncedInput
          id="gamma-input"
          label="Reflection Coefficient"
          value="0.2"
          unit=""
          category="rf"
          onChange={vi.fn()}
        />
      </SettingsProvider>
    );

    const input = screen.getByLabelText('Reflection Coefficient');
    expect(input).toHaveValue('0.2');
    // There should be no unit badge rendered
    const badges = container.querySelectorAll('.font-mono');
    // Only the input has font-mono class, no badge span
    expect(badges.length).toBe(1);
  });

  it('sets title tooltip on input with full draft value', () => {
    render(
      <SettingsProvider>
        <SyncedInput
          id="freq-input"
          label="Frequency"
          value="1146433.873805"
          unit="GHz"
          category="optical"
          onChange={vi.fn()}
        />
      </SettingsProvider>
    );

    const input = screen.getByRole('textbox', { name: /Frequency in GHz/i });
    expect(input).toHaveAttribute('title', '1146433.873805');
  });

  it('triggers onUnitChange when dropdown is changed', () => {
    const handleUnitChange = vi.fn();

    render(
      <SettingsProvider>
        <SyncedInput
          id="unit-change-test"
          label="Frequency"
          value="1146.43"
          unit="THz"
          category="optical"
          onChange={vi.fn()}
          unitOptions={[
            { value: 'THz', label: 'THz (terahertz)' },
            { value: 'GHz', label: 'GHz (gigahertz)' }
          ]}
          onUnitChange={handleUnitChange}
        />
      </SettingsProvider>
    );

    const select = screen.getByRole('combobox', { name: /Select unit for Frequency/i });
    fireEvent.change(select, { target: { value: 'GHz' } });
    expect(handleUnitChange).toHaveBeenCalledWith('GHz');
  });

  it('steps digit place up and down on ArrowUp and ArrowDown keys', () => {
    const handleChange = vi.fn();

    render(
      <SettingsProvider>
        <SyncedInput
          id="stepper-test"
          label="Wavelength"
          value="261.50"
          unit="nm"
          category="optical"
          onChange={handleChange}
        />
      </SettingsProvider>
    );

    const input = screen.getByRole('textbox', { name: /Wavelength in nm/i }) as HTMLInputElement;

    // Set cursor at the end (pos 6: after hundredths place '0')
    input.setSelectionRange(6, 6);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(handleChange).toHaveBeenCalledWith('261.51');

    // Set cursor at tenths place (pos 5: after '5')
    input.setSelectionRange(5, 5);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(handleChange).toHaveBeenCalledWith('261.41');
  });
});

