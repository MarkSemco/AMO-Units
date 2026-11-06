import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../common/Card';
import { SyncedInput } from '../common/SyncedInput';
import { Button } from '../common/Button';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { CODATA_2022 } from '../../constants/codata2022';
import {
  deriveOpticalQuantities,
  energyFromWavelength,
  energyFromFrequency,
  energyFromAngularFrequency,
  energyFromElectronVolts,
  energyFromWavenumber,
  energyFromTemperature
} from '../../core/optical';
import { formatSignificantDigits } from '../../core/formatters';
import { useSettings } from '../../context/SettingsContext';
import { usePresets } from '../../context/PresetContext';
import { useHistory } from '../../context/HistoryContext';
import { useUndoRedo } from '../../context/UndoRedoContext';

export const OpticalConverter: React.FC = () => {
  const { precisionDigits } = useSettings();
  const { appliedPreset } = usePresets();
  const { addEntry } = useHistory();
  const { recordAction } = useUndoRedo();

  // Initial canonical energy corresponding to active preset (default AlCl 261.5 nm)
  const activeWavelengthNm = appliedPreset?.wavelengthNm ?? 261.5;
  const activeSpeciesName = appliedPreset?.species || appliedPreset?.name || 'AlCl';
  const resetLabel = `Reset to ${activeSpeciesName} (${activeWavelengthNm} nm)`;

  const [energyJoules, setEnergyJoules] = useState<number>(() =>
    energyFromWavelength(activeWavelengthNm * 1e-9)
  );
  const focusEnergyRef = useRef<number>(energyJoules);

  const [activeField, setActiveField] = useState<string | null>(null);

  // Active units for multi-unit representations
  const [wavelengthUnit, setWavelengthUnit] = useState<'nm' | 'um' | 'm' | 'angstrom'>('nm');
  const [freqUnit, setFreqUnit] = useState<'THz' | 'GHz' | 'MHz' | 'kHz' | 'Hz'>('THz');
  const [angularFreqUnit, setAngularFreqUnit] = useState<'rad/s' | 'Mrad/s' | 'Grad/s'>('rad/s');
  const [energyUnit, setEnergyUnit] = useState<'eV' | 'meV' | 'ueV' | 'J' | 'Eh'>('eV');
  const [wavenumberUnit, setWavenumberUnit] = useState<'cm^-1' | 'm^-1'>('cm^-1');
  const [tempUnit, setTempUnit] = useState<'K' | 'mK' | 'uK' | 'nK'>('K');

  // React to preset application
  useEffect(() => {
    if (appliedPreset && appliedPreset.wavelengthNm) {
      const e = energyFromWavelength(appliedPreset.wavelengthNm * 1e-9);
      setEnergyJoules(e);
      setWavelengthUnit('nm');
      setActiveField(null);
    }
  }, [appliedPreset]);

  // Derived quantities
  const quantities = deriveOpticalQuantities(energyJoules);

  // Handle active typing changes
  const handleWavelengthChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      let meters = val * 1e-9;
      if (wavelengthUnit === 'um') meters = val * 1e-6;
      else if (wavelengthUnit === 'm') meters = val;
      else if (wavelengthUnit === 'angstrom') meters = val * 1e-10;

      const e = energyFromWavelength(meters);
      setEnergyJoules(e);
    },
    [wavelengthUnit]
  );

  const handleFrequencyChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      let hz = val * 1e12; // THz default
      if (freqUnit === 'GHz') hz = val * 1e9;
      else if (freqUnit === 'MHz') hz = val * 1e6;
      else if (freqUnit === 'kHz') hz = val * 1e3;
      else if (freqUnit === 'Hz') hz = val;

      const e = energyFromFrequency(hz);
      setEnergyJoules(e);
    },
    [freqUnit]
  );

  const handleAngularFreqChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      let rad = val;
      if (angularFreqUnit === 'Mrad/s') rad = val * 1e6;
      else if (angularFreqUnit === 'Grad/s') rad = val * 1e9;
      const e = energyFromAngularFrequency(rad);
      setEnergyJoules(e);
    },
    [angularFreqUnit]
  );

  const handleEnergyChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      if (energyUnit === 'J') {
        setEnergyJoules(val);
        return;
      }
      if (energyUnit === 'Eh') {
        setEnergyJoules(val * CODATA_2022.Eh);
        return;
      }
      let ev = val;
      if (energyUnit === 'meV') ev = val * 1e-3;
      else if (energyUnit === 'ueV') ev = val * 1e-6;
      setEnergyJoules(energyFromElectronVolts(ev));
    },
    [energyUnit]
  );

  const handleWavenumberChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      const cmInv = wavenumberUnit === 'm^-1' ? val / 100 : val;
      setEnergyJoules(energyFromWavenumber(cmInv));
    },
    [wavenumberUnit]
  );

  const handleTempChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      let kelvin = val;
      if (tempUnit === 'mK') kelvin = val * 1e-3;
      else if (tempUnit === 'uK') kelvin = val * 1e-6;
      else if (tempUnit === 'nK') kelvin = val * 1e-9;
      setEnergyJoules(energyFromTemperature(kelvin));
    },
    [tempUnit]
  );

  // Helper to record history on field blur
  const recordHistory = (fieldName: string, displayVal: string, unitStr: string) => {
    addEntry({
      category: 'optical',
      title: 'Optical Conversion',
      sourceField: fieldName,
      sourceValue: displayVal,
      sourceUnit: unitStr,
      details: {
        Wavelength: `${formatSignificantDigits(quantities.wavelength.nm, precisionDigits)} nm`,
        Frequency: `${formatSignificantDigits(quantities.frequency.THz, precisionDigits)} THz`,
        Energy: `${formatSignificantDigits(quantities.energy.eV, precisionDigits)} eV`,
        Wavenumber: `${formatSignificantDigits(quantities.wavenumber.cmInv, precisionDigits)} cm⁻¹`
      }
    });
    setActiveField(null);
  };

  const commitEnergy = (fieldName: string) => {
    const prevE = focusEnergyRef.current;
    const nextE = energyJoules;
    if (Math.abs(prevE - nextE) > 1e-35) {
      recordAction({
        description: `${fieldName} to ${formatSignificantDigits(quantities.wavelength.nm, precisionDigits)} nm`,
        category: 'optical',
        targetTab: 'optical',
        undo: () => setEnergyJoules(prevE),
        redo: () => setEnergyJoules(nextE)
      });
      focusEnergyRef.current = nextE;
    }
  };

  // Get current displayed values
  const getWavelengthDisplay = () => {
    const val = quantities.wavelength[wavelengthUnit];
    return formatSignificantDigits(val, precisionDigits);
  };

  const getFrequencyDisplay = () => {
    const val = quantities.frequency[freqUnit];
    return formatSignificantDigits(val, precisionDigits);
  };

  const getAngularFreqDisplay = () => {
    let val = quantities.angularFrequency.radPerSec;
    if (angularFreqUnit === 'Mrad/s') val = quantities.angularFrequency.MradPerSec;
    else if (angularFreqUnit === 'Grad/s') val = quantities.angularFrequency.GradPerSec;
    return formatSignificantDigits(val, precisionDigits);
  };

  const getEnergyDisplay = () => {
    const val = quantities.energy[energyUnit];
    return formatSignificantDigits(val, precisionDigits);
  };

  const getWavenumberDisplay = () => {
    const val = wavenumberUnit === 'm^-1' ? quantities.wavenumber.mInv : quantities.wavenumber.cmInv;
    return formatSignificantDigits(val, precisionDigits);
  };

  const getTempDisplay = () => {
    const val = quantities.temperature[tempUnit];
    return formatSignificantDigits(val, precisionDigits);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <Card
        title="Optical & Energy Converter"
        subtitle="Convert between photon wavelength, frequency, energy, wavenumber, and equivalent temperature."
        category="optical"
        icon={<Lightbulb size={20} />}
        actions={
          <Button
            size="sm"
            variant="ghost"
            category="optical"
            icon={<RotateCcw size={14} />}
            onClick={() => {
              const prevE = energyJoules;
              const resetE = energyFromWavelength(activeWavelengthNm * 1e-9);
              recordAction({
                description: resetLabel,
                category: 'optical',
                targetTab: 'optical',
                undo: () => setEnergyJoules(prevE),
                redo: () => setEnergyJoules(resetE)
              });
              setEnergyJoules(resetE);
              setWavelengthUnit('nm');
              setFreqUnit('THz');
              setAngularFreqUnit('rad/s');
              setEnergyUnit('eV');
              setWavenumberUnit('cm^-1');
              setTempUnit('K');
              setActiveField(null);
            }}
          >
            {resetLabel}
          </Button>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-md)'
          }}
        >
          {/* 1. Wavelength */}
          <SyncedInput
            id="opt-wavelength"
            label="Wavelength"
            symbol="λ"
            value={getWavelengthDisplay()}
            unit={wavelengthUnit}
            category="optical"
            isActive={activeField === 'wavelength'}
            onFocus={() => {
              setActiveField('wavelength');
              focusEnergyRef.current = energyJoules;
            }}
            onBlur={() => {
              recordHistory('Wavelength', getWavelengthDisplay(), wavelengthUnit);
              commitEnergy('Wavelength');
            }}
            onCommit={() => commitEnergy('Wavelength')}
            onChange={handleWavelengthChange}
            unitOptions={[
              { value: 'nm', label: 'nm (nanometers)' },
              { value: 'um', label: 'µm (microns)' },
              { value: 'm', label: 'm (meters)' },
              { value: 'angstrom', label: 'Å (angstroms)' }
            ]}
            onUnitChange={u => setWavelengthUnit(u as any)}
            description="Optical vacuum wavelength (λ = c / ν)"
          />

          {/* 2. Frequency */}
          <SyncedInput
            id="opt-frequency"
            label="Frequency"
            symbol="ν"
            value={getFrequencyDisplay()}
            unit={freqUnit}
            category="optical"
            isActive={activeField === 'frequency'}
            onFocus={() => {
              setActiveField('frequency');
              focusEnergyRef.current = energyJoules;
            }}
            onBlur={() => {
              recordHistory('Frequency', getFrequencyDisplay(), freqUnit);
              commitEnergy('Frequency');
            }}
            onCommit={() => commitEnergy('Frequency')}
            onChange={handleFrequencyChange}
            unitOptions={[
              { value: 'THz', label: 'THz (terahertz)' },
              { value: 'GHz', label: 'GHz (gigahertz)' },
              { value: 'MHz', label: 'MHz (megahertz)' },
              { value: 'kHz', label: 'kHz (kilohertz)' },
              { value: 'Hz', label: 'Hz (hertz)' }
            ]}
            onUnitChange={u => setFreqUnit(u as any)}
            description="Photon oscillation frequency (ν = c / λ)"
          />

          {/* 3. Angular Frequency */}
          <SyncedInput
            id="opt-angular-freq"
            label="Angular Frequency"
            symbol="ω"
            value={getAngularFreqDisplay()}
            unit={angularFreqUnit}
            category="optical"
            isActive={activeField === 'angularFreq'}
            onFocus={() => {
              setActiveField('angularFreq');
              focusEnergyRef.current = energyJoules;
            }}
            onBlur={() => {
              recordHistory(
                'Angular Frequency',
                getAngularFreqDisplay(),
                angularFreqUnit
              );
              commitEnergy('Angular Frequency');
            }}
            onCommit={() => commitEnergy('Angular Frequency')}
            onChange={handleAngularFreqChange}
            unitOptions={[
              { value: 'rad/s', label: 'rad/s (radians/sec)' },
              { value: 'Mrad/s', label: 'Mrad/s (megaradians/sec)' },
              { value: 'Grad/s', label: 'Grad/s (gigaradians/sec)' }
            ]}
            onUnitChange={u => setAngularFreqUnit(u as any)}
            description="Angular frequency (ω = 2πν)"
          />

          {/* 4. Energy */}
          <SyncedInput
            id="opt-energy"
            label="Photon Energy"
            symbol="E"
            value={getEnergyDisplay()}
            unit={energyUnit}
            category="optical"
            isActive={activeField === 'energy'}
            onFocus={() => {
              setActiveField('energy');
              focusEnergyRef.current = energyJoules;
            }}
            onBlur={() => {
              recordHistory('Photon Energy', getEnergyDisplay(), energyUnit);
              commitEnergy('Photon Energy');
            }}
            onCommit={() => commitEnergy('Photon Energy')}
            onChange={handleEnergyChange}
            unitOptions={[
              { value: 'eV', label: 'eV (electron-volts)' },
              { value: 'meV', label: 'meV (milli-eV)' },
              { value: 'ueV', label: 'µeV (micro-eV)' },
              { value: 'J', label: 'J (Joules)' },
              { value: 'Eh', label: 'E_h (Hartree)' }
            ]}
            onUnitChange={u => setEnergyUnit(u as any)}
            description="Photon transition energy (E = hν = ℏω)"
          />

          {/* 5. Wavenumber */}
          <SyncedInput
            id="opt-wavenumber"
            label="Wavenumber"
            symbol="ν̃"
            value={getWavenumberDisplay()}
            unit={wavenumberUnit}
            category="optical"
            isActive={activeField === 'wavenumber'}
            onFocus={() => {
              setActiveField('wavenumber');
              focusEnergyRef.current = energyJoules;
            }}
            onBlur={() => {
              recordHistory('Wavenumber', getWavenumberDisplay(), wavenumberUnit);
              commitEnergy('Wavenumber');
            }}
            onCommit={() => commitEnergy('Wavenumber')}
            onChange={handleWavenumberChange}
            unitOptions={[
              { value: 'cm^-1', label: 'cm⁻¹ (inverse cm)' },
              { value: 'm^-1', label: 'm⁻¹ (inverse meter)' }
            ]}
            onUnitChange={u => setWavenumberUnit(u as any)}
            description="Spectroscopic wavenumber (ν̃ = 1 / λ)"
          />

          {/* 6. Equivalent Temperature */}
          <SyncedInput
            id="opt-temperature"
            label="Equivalent Temperature"
            symbol="T"
            value={getTempDisplay()}
            unit={tempUnit}
            category="optical"
            isActive={activeField === 'temperature'}
            onFocus={() => {
              setActiveField('temperature');
              focusEnergyRef.current = energyJoules;
            }}
            onBlur={() => {
              recordHistory('Temperature', getTempDisplay(), tempUnit);
              commitEnergy('Equivalent Temperature');
            }}
            onCommit={() => commitEnergy('Equivalent Temperature')}
            onChange={handleTempChange}
            unitOptions={[
              { value: 'K', label: 'K (Kelvin)' },
              { value: 'mK', label: 'mK (milli-Kelvin)' },
              { value: 'uK', label: 'µK (micro-Kelvin)' },
              { value: 'nK', label: 'nK (nano-Kelvin)' }
            ]}
            onUnitChange={u => setTempUnit(u as any)}
            description="Thermal equivalent temperature (T = E / k_B)"
          />
        </div>
      </Card>
    </div>
  );
};
