import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../common/Card';
import { SyncedInput } from '../common/SyncedInput';
import { Button } from '../common/Button';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { CODATA_2022 } from '../../constants/codata2022';
import {
  deriveOpticalQuantities,
  deriveOpticalUncertainties,
  energyFromWavelength,
  energyFromFrequency,
  energyFromAngularFrequency,
  energyFromElectronVolts,
  energyFromWavenumber,
  energyFromTemperature,
  energyUncertaintyFromWavelength,
  energyUncertaintyFromFrequency,
  energyUncertaintyFromAngularFrequency,
  energyUncertaintyFromElectronVolts,
  energyUncertaintyFromWavenumber,
  energyUncertaintyFromTemperature
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

  // Toggle for uncertainty propagation (off by default)
  const [showUncertainties, setShowUncertainties] = useState<boolean>(false);

  // Initial canonical energy corresponding to active preset (default AlCl 261.5 nm)
  const activeWavelengthNm = appliedPreset?.wavelengthNm ?? 261.5;
  const activeSpeciesName = appliedPreset?.species || appliedPreset?.name || 'AlCl';
  const resetLabel = `Reset to ${activeSpeciesName} (${activeWavelengthNm} nm)`;

  const [energyJoules, setEnergyJoules] = useState<number>(() =>
    energyFromWavelength(activeWavelengthNm * 1e-9)
  );
  const [energyUncertaintyJoules, setEnergyUncertaintyJoules] = useState<number>(0);

  const focusEnergyRef = useRef<number>(energyJoules);
  const focusEnergyUncertaintyRef = useRef<number>(energyUncertaintyJoules);

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
      setEnergyUncertaintyJoules(0);
      setWavelengthUnit('nm');
      setActiveField(null);
    }
  }, [appliedPreset]);

  // Derived quantities and uncertainties
  const quantities = deriveOpticalQuantities(energyJoules);
  const uncertainties = deriveOpticalUncertainties(energyJoules, energyUncertaintyJoules);

  // Handle active typing changes for nominal values
  const handleWavelengthChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      let meters = val * 1e-9;
      if (wavelengthUnit === 'um') meters = val * 1e-6;
      else if (wavelengthUnit === 'm') meters = val;
      else if (wavelengthUnit === 'angstrom') meters = val * 1e-10;

      const nextE = energyFromWavelength(meters);
      setEnergyJoules(nextE);

      // Preserve relative uncertainty across nominal value transitions
      setEnergyUncertaintyJoules(prevUnc => {
        if (energyJoules > 0 && prevUnc > 0) {
          return nextE * (prevUnc / energyJoules);
        }
        return prevUnc;
      });
    },
    [wavelengthUnit, energyJoules]
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

      const nextE = energyFromFrequency(hz);
      setEnergyJoules(nextE);

      setEnergyUncertaintyJoules(prevUnc => {
        if (energyJoules > 0 && prevUnc > 0) {
          return nextE * (prevUnc / energyJoules);
        }
        return prevUnc;
      });
    },
    [freqUnit, energyJoules]
  );

  const handleAngularFreqChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      let rad = val;
      if (angularFreqUnit === 'Mrad/s') rad = val * 1e6;
      else if (angularFreqUnit === 'Grad/s') rad = val * 1e9;
      const nextE = energyFromAngularFrequency(rad);
      setEnergyJoules(nextE);

      setEnergyUncertaintyJoules(prevUnc => {
        if (energyJoules > 0 && prevUnc > 0) {
          return nextE * (prevUnc / energyJoules);
        }
        return prevUnc;
      });
    },
    [angularFreqUnit, energyJoules]
  );

  const handleEnergyChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      let nextE = val;
      if (energyUnit === 'Eh') {
        nextE = val * CODATA_2022.Eh;
      } else if (energyUnit !== 'J') {
        let ev = val;
        if (energyUnit === 'meV') ev = val * 1e-3;
        else if (energyUnit === 'ueV') ev = val * 1e-6;
        nextE = energyFromElectronVolts(ev);
      }

      setEnergyJoules(nextE);

      setEnergyUncertaintyJoules(prevUnc => {
        if (energyJoules > 0 && prevUnc > 0) {
          return nextE * (prevUnc / energyJoules);
        }
        return prevUnc;
      });
    },
    [energyUnit, energyJoules]
  );

  const handleWavenumberChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      const cmInv = wavenumberUnit === 'm^-1' ? val / 100 : val;
      const nextE = energyFromWavenumber(cmInv);
      setEnergyJoules(nextE);

      setEnergyUncertaintyJoules(prevUnc => {
        if (energyJoules > 0 && prevUnc > 0) {
          return nextE * (prevUnc / energyJoules);
        }
        return prevUnc;
      });
    },
    [wavenumberUnit, energyJoules]
  );

  const handleTempChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val <= 0) return;
      let kelvin = val;
      if (tempUnit === 'mK') kelvin = val * 1e-3;
      else if (tempUnit === 'uK') kelvin = val * 1e-6;
      else if (tempUnit === 'nK') kelvin = val * 1e-9;
      const nextE = energyFromTemperature(kelvin);
      setEnergyJoules(nextE);

      setEnergyUncertaintyJoules(prevUnc => {
        if (energyJoules > 0 && prevUnc > 0) {
          return nextE * (prevUnc / energyJoules);
        }
        return prevUnc;
      });
    },
    [tempUnit, energyJoules]
  );

  // Handle active typing changes for uncertainty values
  const handleWavelengthUncertaintyChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val < 0) {
        if (str.trim() === '') setEnergyUncertaintyJoules(0);
        return;
      }
      let meters = val * 1e-9;
      if (wavelengthUnit === 'um') meters = val * 1e-6;
      else if (wavelengthUnit === 'm') meters = val;
      else if (wavelengthUnit === 'angstrom') meters = val * 1e-10;

      const currentLambdaMeters = quantities.wavelength.m;
      if (currentLambdaMeters <= 0) return;
      const nextUncE = energyUncertaintyFromWavelength(currentLambdaMeters, meters);
      setEnergyUncertaintyJoules(nextUncE);
    },
    [wavelengthUnit, quantities.wavelength.m]
  );

  const handleFrequencyUncertaintyChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val < 0) {
        if (str.trim() === '') setEnergyUncertaintyJoules(0);
        return;
      }
      let hz = val * 1e12; // THz default
      if (freqUnit === 'GHz') hz = val * 1e9;
      else if (freqUnit === 'MHz') hz = val * 1e6;
      else if (freqUnit === 'kHz') hz = val * 1e3;
      else if (freqUnit === 'Hz') hz = val;

      const nextUncE = energyUncertaintyFromFrequency(hz);
      setEnergyUncertaintyJoules(nextUncE);
    },
    [freqUnit]
  );

  const handleAngularFreqUncertaintyChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val < 0) {
        if (str.trim() === '') setEnergyUncertaintyJoules(0);
        return;
      }
      let rad = val;
      if (angularFreqUnit === 'Mrad/s') rad = val * 1e6;
      else if (angularFreqUnit === 'Grad/s') rad = val * 1e9;

      const nextUncE = energyUncertaintyFromAngularFrequency(rad);
      setEnergyUncertaintyJoules(nextUncE);
    },
    [angularFreqUnit]
  );

  const handleEnergyUncertaintyChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val < 0) {
        if (str.trim() === '') setEnergyUncertaintyJoules(0);
        return;
      }
      if (energyUnit === 'J') {
        setEnergyUncertaintyJoules(val);
        return;
      }
      if (energyUnit === 'Eh') {
        setEnergyUncertaintyJoules(val * CODATA_2022.Eh);
        return;
      }
      let ev = val;
      if (energyUnit === 'meV') ev = val * 1e-3;
      else if (energyUnit === 'ueV') ev = val * 1e-6;

      const nextUncE = energyUncertaintyFromElectronVolts(ev);
      setEnergyUncertaintyJoules(nextUncE);
    },
    [energyUnit]
  );

  const handleWavenumberUncertaintyChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val < 0) {
        if (str.trim() === '') setEnergyUncertaintyJoules(0);
        return;
      }
      const cmInv = wavenumberUnit === 'm^-1' ? val / 100 : val;
      const nextUncE = energyUncertaintyFromWavenumber(cmInv);
      setEnergyUncertaintyJoules(nextUncE);
    },
    [wavenumberUnit]
  );

  const handleTempUncertaintyChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val < 0) {
        if (str.trim() === '') setEnergyUncertaintyJoules(0);
        return;
      }
      let kelvin = val;
      if (tempUnit === 'mK') kelvin = val * 1e-3;
      else if (tempUnit === 'uK') kelvin = val * 1e-6;
      else if (tempUnit === 'nK') kelvin = val * 1e-9;

      const nextUncE = energyUncertaintyFromTemperature(kelvin);
      setEnergyUncertaintyJoules(nextUncE);
    },
    [tempUnit]
  );

  // Helper to record history on field blur
  const recordHistory = (fieldName: string, displayVal: string, unitStr: string) => {
    const hasUnc = showUncertainties && energyUncertaintyJoules > 0;
    addEntry({
      category: 'optical',
      title: 'Optical Conversion',
      sourceField: fieldName,
      sourceValue: hasUnc
        ? `${displayVal} ± ${formatSignificantDigits(
            fieldName === 'Wavelength'
              ? uncertainties.wavelength[wavelengthUnit]
              : fieldName === 'Frequency'
                ? uncertainties.frequency[freqUnit]
                : fieldName === 'Photon Energy'
                  ? uncertainties.energy[energyUnit]
                  : uncertainties.wavenumber[wavenumberUnit === 'm^-1' ? 'mInv' : 'cmInv'],
            precisionDigits
          )}`
        : displayVal,
      sourceUnit: unitStr,
      details: {
        Wavelength: hasUnc
          ? `${formatSignificantDigits(quantities.wavelength.nm, precisionDigits)} ± ${formatSignificantDigits(uncertainties.wavelength.nm, precisionDigits)} nm`
          : `${formatSignificantDigits(quantities.wavelength.nm, precisionDigits)} nm`,
        Frequency: hasUnc
          ? `${formatSignificantDigits(quantities.frequency.THz, precisionDigits)} ± ${formatSignificantDigits(uncertainties.frequency.THz, precisionDigits)} THz`
          : `${formatSignificantDigits(quantities.frequency.THz, precisionDigits)} THz`,
        Energy: hasUnc
          ? `${formatSignificantDigits(quantities.energy.eV, precisionDigits)} ± ${formatSignificantDigits(uncertainties.energy.eV, precisionDigits)} eV`
          : `${formatSignificantDigits(quantities.energy.eV, precisionDigits)} eV`,
        Wavenumber: hasUnc
          ? `${formatSignificantDigits(quantities.wavenumber.cmInv, precisionDigits)} ± ${formatSignificantDigits(uncertainties.wavenumber.cmInv, precisionDigits)} cm⁻¹`
          : `${formatSignificantDigits(quantities.wavenumber.cmInv, precisionDigits)} cm⁻¹`
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

  const commitEnergyUncertainty = (fieldName: string) => {
    const prevU = focusEnergyUncertaintyRef.current;
    const nextU = energyUncertaintyJoules;
    if (Math.abs(prevU - nextU) > 1e-45) {
      recordAction({
        description: `${fieldName} uncertainty to ${formatSignificantDigits(nextU, precisionDigits)} J`,
        category: 'optical',
        targetTab: 'optical',
        undo: () => setEnergyUncertaintyJoules(prevU),
        redo: () => setEnergyUncertaintyJoules(nextU)
      });
      focusEnergyUncertaintyRef.current = nextU;
    }
  };

  // Get current displayed nominal values
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

  // Get current displayed uncertainty values
  const getWavelengthUncertaintyDisplay = () => {
    if (energyUncertaintyJoules <= 0) return '';
    const val = uncertainties.wavelength[wavelengthUnit];
    return formatSignificantDigits(val, precisionDigits);
  };

  const getFrequencyUncertaintyDisplay = () => {
    if (energyUncertaintyJoules <= 0) return '';
    const val = uncertainties.frequency[freqUnit];
    return formatSignificantDigits(val, precisionDigits);
  };

  const getAngularFreqUncertaintyDisplay = () => {
    if (energyUncertaintyJoules <= 0) return '';
    let val = uncertainties.angularFrequency.radPerSec;
    if (angularFreqUnit === 'Mrad/s') val = uncertainties.angularFrequency.MradPerSec;
    else if (angularFreqUnit === 'Grad/s') val = uncertainties.angularFrequency.GradPerSec;
    return formatSignificantDigits(val, precisionDigits);
  };

  const getEnergyUncertaintyDisplay = () => {
    if (energyUncertaintyJoules <= 0) return '';
    const val = uncertainties.energy[energyUnit];
    return formatSignificantDigits(val, precisionDigits);
  };

  const getWavenumberUncertaintyDisplay = () => {
    if (energyUncertaintyJoules <= 0) return '';
    const val = wavenumberUnit === 'm^-1' ? uncertainties.wavenumber.mInv : uncertainties.wavenumber.cmInv;
    return formatSignificantDigits(val, precisionDigits);
  };

  const getTempUncertaintyDisplay = () => {
    if (energyUncertaintyJoules <= 0) return '';
    const val = uncertainties.temperature[tempUnit];
    return formatSignificantDigits(val, precisionDigits);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <Card
        title="Optical & Energy Converter"
        category="optical"
        icon={<Lightbulb size={20} />}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              size="sm"
              variant={showUncertainties ? 'primary' : 'outline'}
              category="optical"
              aria-pressed={showUncertainties}
              onClick={() => {
                const next = !showUncertainties;
                setShowUncertainties(next);
                recordAction({
                  description: `${next ? 'Enable' : 'Disable'} optical uncertainties`,
                  category: 'optical',
                  targetTab: 'optical',
                  undo: () => setShowUncertainties(!next),
                  redo: () => setShowUncertainties(next)
                });
              }}
            >
              <span className="font-mono" style={{ fontWeight: 'bold', marginRight: '4px' }}>±</span>
              Uncertainties: {showUncertainties ? 'ON' : 'OFF'}
            </Button>

            {/* Single clean placement of relative uncertainty & ppm */}
            {showUncertainties && energyUncertaintyJoules > 0 && energyJoules > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>Rel:</span>
                <strong className="font-mono" style={{ color: 'var(--color-optical)' }}>
                  ±{((energyUncertaintyJoules / energyJoules) * 100) < 0.01
                    ? ((energyUncertaintyJoules / energyJoules) * 100).toPrecision(3)
                    : ((energyUncertaintyJoules / energyJoules) * 100).toFixed(4)}%
                </strong>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-2xs)' }}>
                  ({((energyUncertaintyJoules / energyJoules) * 1e6).toFixed(1)} ppm)
                </span>
              </div>
            )}

            <Button
              size="sm"
              variant="ghost"
              category="optical"
              icon={<RotateCcw size={14} />}
              onClick={() => {
                const prevE = energyJoules;
                const prevU = energyUncertaintyJoules;
                const resetE = energyFromWavelength(activeWavelengthNm * 1e-9);
                recordAction({
                  description: resetLabel,
                  category: 'optical',
                  targetTab: 'optical',
                  undo: () => {
                    setEnergyJoules(prevE);
                    setEnergyUncertaintyJoules(prevU);
                  },
                  redo: () => {
                    setEnergyJoules(resetE);
                    setEnergyUncertaintyJoules(0);
                  }
                });
                setEnergyJoules(resetE);
                setEnergyUncertaintyJoules(0);
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
          </div>
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
            showUncertainty={showUncertainties}
            uncertaintyValue={getWavelengthUncertaintyDisplay()}
            onUncertaintyChange={handleWavelengthUncertaintyChange}
            onUncertaintyFocus={() => {
              setActiveField('wavelength-unc');
              focusEnergyUncertaintyRef.current = energyUncertaintyJoules;
            }}
            onUncertaintyBlur={() => {
              recordHistory('Wavelength', getWavelengthDisplay(), wavelengthUnit);
              commitEnergyUncertainty('Wavelength');
            }}
            onUncertaintyCommit={() => commitEnergyUncertainty('Wavelength')}
            isUncertaintyActive={activeField === 'wavelength-unc'}
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
            showUncertainty={showUncertainties}
            uncertaintyValue={getFrequencyUncertaintyDisplay()}
            onUncertaintyChange={handleFrequencyUncertaintyChange}
            onUncertaintyFocus={() => {
              setActiveField('frequency-unc');
              focusEnergyUncertaintyRef.current = energyUncertaintyJoules;
            }}
            onUncertaintyBlur={() => {
              recordHistory('Frequency', getFrequencyDisplay(), freqUnit);
              commitEnergyUncertainty('Frequency');
            }}
            onUncertaintyCommit={() => commitEnergyUncertainty('Frequency')}
            isUncertaintyActive={activeField === 'frequency-unc'}
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
            showUncertainty={showUncertainties}
            uncertaintyValue={getAngularFreqUncertaintyDisplay()}
            onUncertaintyChange={handleAngularFreqUncertaintyChange}
            onUncertaintyFocus={() => {
              setActiveField('angularFreq-unc');
              focusEnergyUncertaintyRef.current = energyUncertaintyJoules;
            }}
            onUncertaintyBlur={() => {
              recordHistory('Angular Frequency', getAngularFreqDisplay(), angularFreqUnit);
              commitEnergyUncertainty('Angular Frequency');
            }}
            onUncertaintyCommit={() => commitEnergyUncertainty('Angular Frequency')}
            isUncertaintyActive={activeField === 'angularFreq-unc'}
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
            showUncertainty={showUncertainties}
            uncertaintyValue={getEnergyUncertaintyDisplay()}
            onUncertaintyChange={handleEnergyUncertaintyChange}
            onUncertaintyFocus={() => {
              setActiveField('energy-unc');
              focusEnergyUncertaintyRef.current = energyUncertaintyJoules;
            }}
            onUncertaintyBlur={() => {
              recordHistory('Photon Energy', getEnergyDisplay(), energyUnit);
              commitEnergyUncertainty('Photon Energy');
            }}
            onUncertaintyCommit={() => commitEnergyUncertainty('Photon Energy')}
            isUncertaintyActive={activeField === 'energy-unc'}
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
            showUncertainty={showUncertainties}
            uncertaintyValue={getWavenumberUncertaintyDisplay()}
            onUncertaintyChange={handleWavenumberUncertaintyChange}
            onUncertaintyFocus={() => {
              setActiveField('wavenumber-unc');
              focusEnergyUncertaintyRef.current = energyUncertaintyJoules;
            }}
            onUncertaintyBlur={() => {
              recordHistory('Wavenumber', getWavenumberDisplay(), wavenumberUnit);
              commitEnergyUncertainty('Wavenumber');
            }}
            onUncertaintyCommit={() => commitEnergyUncertainty('Wavenumber')}
            isUncertaintyActive={activeField === 'wavenumber-unc'}
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
            showUncertainty={showUncertainties}
            uncertaintyValue={getTempUncertaintyDisplay()}
            onUncertaintyChange={handleTempUncertaintyChange}
            onUncertaintyFocus={() => {
              setActiveField('temperature-unc');
              focusEnergyUncertaintyRef.current = energyUncertaintyJoules;
            }}
            onUncertaintyBlur={() => {
              recordHistory('Temperature', getTempDisplay(), tempUnit);
              commitEnergyUncertainty('Temperature');
            }}
            onUncertaintyCommit={() => commitEnergyUncertainty('Temperature')}
            isUncertaintyActive={activeField === 'temperature-unc'}
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
