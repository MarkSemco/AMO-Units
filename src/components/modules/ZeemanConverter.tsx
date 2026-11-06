import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import { SyncedInput } from '../common/SyncedInput';
import { Button } from '../common/Button';
import { Compass, RotateCcw } from 'lucide-react';
import {
  deriveFieldValues,
  calculateZeemanShift,
  calculateFieldFromZeemanShift,
  teslaFromGauss,
  BOHR_MAGNETON_MHZ_PER_GAUSS,
  ZeemanConfig
} from '../../core/zeeman';
import { formatSignificantDigits } from '../../core/formatters';
import { useSettings } from '../../context/SettingsContext';
import { handleNumberStepperKeyDown } from '../../core/number-stepper';
import { useHistory } from '../../context/HistoryContext';
import { useUndoRedo } from '../../context/UndoRedoContext';

export const ZeemanConverter: React.FC = () => {
  const { precisionDigits } = useSettings();
  const { addEntry } = useHistory();
  const { recordAction } = useUndoRedo();

  // Canonical magnetic field in Tesla (default 1 Gauss = 1e-4 T)
  const [fieldTesla, setFieldTesla] = useState<number>(1e-4);
  const [activeField, setActiveField] = useState<string | null>(null);
  const focusFieldRef = useRef<number>(1e-4);

  // Zeeman configuration
  const [gFactor, setGFactor] = useState<number>(1.0);
  const [deltaMF, setDeltaMF] = useState<number>(1.0);
  const [isNuclearMagneton, setIsNuclearMagneton] = useState<boolean>(false);
  const focusGFactorRef = useRef<number>(1.0);
  const focusDeltaMFRef = useRef<number>(1.0);

  // Draft string states for numeric inputs to preserve decimal typing
  const [draftGFactor, setDraftGFactor] = useState<string>(gFactor.toString());
  const [isGFactorFocused, setIsGFactorFocused] = useState<boolean>(false);
  const [draftDeltaMF, setDraftDeltaMF] = useState<string>(deltaMF.toString());
  const [isDeltaMFFocused, setIsDeltaMFFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isGFactorFocused) {
      setDraftGFactor(gFactor.toString());
    }
  }, [gFactor, isGFactorFocused]);

  useEffect(() => {
    if (!isDeltaMFFocused) {
      setDraftDeltaMF(deltaMF.toString());
    }
  }, [deltaMF, isDeltaMFFocused]);

  // Selected display units
  const [fieldUnit, setFieldUnit] = useState<'G' | 'T' | 'mT' | 'uT'>('G');
  const [shiftUnit, setShiftUnit] = useState<'MHz' | 'kHz' | 'GHz' | 'Hz'>('MHz');

  const config: ZeemanConfig = {
    gFactor,
    deltaMF,
    isNuclearMagneton
  };

  const fieldValues = deriveFieldValues(fieldTesla);
  const shiftValues = calculateZeemanShift(fieldTesla, config);

  // Handle Field input
  const handleFieldChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val)) return;
      let t = val;
      if (fieldUnit === 'G') t = teslaFromGauss(val);
      else if (fieldUnit === 'mT') t = val * 1e-3;
      else if (fieldUnit === 'uT') t = val * 1e-6;
      setFieldTesla(t);
    },
    [fieldUnit]
  );

  // Handle Zeeman Shift input (bidirectional!)
  const handleShiftChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val)) return;
      let hz = val * 1e6; // MHz default
      if (shiftUnit === 'GHz') hz = val * 1e9;
      else if (shiftUnit === 'kHz') hz = val * 1e3;
      else if (shiftUnit === 'Hz') hz = val;

      const newT = calculateFieldFromZeemanShift(hz, config);
      setFieldTesla(newT);
    },
    [shiftUnit, config]
  );

  const getFieldDisplay = () => {
    let val = fieldValues.Gauss;
    if (fieldUnit === 'T') val = fieldValues.Tesla;
    else if (fieldUnit === 'mT') val = fieldValues.milliTesla;
    else if (fieldUnit === 'uT') val = fieldValues.microTesla;
    return formatSignificantDigits(val, precisionDigits);
  };

  const getShiftDisplay = () => {
    let val = shiftValues.MHz;
    if (shiftUnit === 'GHz') val = shiftValues.GHz;
    else if (shiftUnit === 'kHz') val = shiftValues.kHz;
    else if (shiftUnit === 'Hz') val = shiftValues.Hz;
    return formatSignificantDigits(val, precisionDigits);
  };

  const recordHistory = (source: string, val: string, u: string) => {
    addEntry({
      category: 'zeeman',
      title: 'Zeeman Shift Calculation',
      sourceField: source,
      sourceValue: val,
      sourceUnit: u,
      details: {
        'Field (Gauss)': `${formatSignificantDigits(fieldValues.Gauss, precisionDigits)} G`,
        'Field (Tesla)': `${formatSignificantDigits(fieldValues.Tesla, precisionDigits)} T`,
        'Zeeman Shift': `${formatSignificantDigits(shiftValues.MHz, precisionDigits)} MHz`,
        'g-factor': `${gFactor}`,
        'Δm_F': `${deltaMF}`
      }
    });
    setActiveField(null);
  };

  const commitField = (source: string) => {
    const prevT = focusFieldRef.current;
    const nextT = fieldTesla;
    if (Math.abs(prevT - nextT) > 1e-15) {
      recordAction({
        description: `${source} to ${getFieldDisplay()} ${fieldUnit}`,
        category: 'magnetic',
        targetTab: 'formulas',
        undo: () => setFieldTesla(prevT),
        redo: () => setFieldTesla(nextT)
      });
      focusFieldRef.current = nextT;
    }
  };

  const applyZeemanPreset = (targetT: number, targetG: number, targetD: number, isNuc: boolean, name: string) => {
    const prevT = fieldTesla;
    const prevG = gFactor;
    const prevD = deltaMF;
    const prevNuc = isNuclearMagneton;

    recordAction({
      description: `Zeeman: ${name}`,
      category: 'magnetic',
      targetTab: 'formulas',
      undo: () => {
        setFieldTesla(prevT);
        setGFactor(prevG);
        setDeltaMF(prevD);
        setIsNuclearMagneton(prevNuc);
      },
      redo: () => {
        setFieldTesla(targetT);
        setGFactor(targetG);
        setDeltaMF(targetD);
        setIsNuclearMagneton(isNuc);
      }
    });

    setFieldTesla(targetT);
    setGFactor(targetG);
    setDeltaMF(targetD);
    setIsNuclearMagneton(isNuc);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <Card
        title="Magnetic Field & Zeeman Splitting"
        subtitle="First-order Zeeman frequency shift Δν = (μ · g · Δm_F · B) / h."
        category="magnetic"
        icon={<Compass size={20} />}
        actions={
          <Button
            size="sm"
            variant="ghost"
            category="magnetic"
            icon={<RotateCcw size={14} />}
            onClick={() => {
              applyZeemanPreset(1e-4, 1.0, 1.0, false, 'Reset (1 Gauss)');
              setActiveField(null);
            }}
          >
            Reset (1 Gauss)
          </Button>
        }
      >
        {/* Preset Quantum Settings Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm)',
            backgroundColor: 'var(--color-bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            marginBottom: 'var(--space-md)'
          }}
        >
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
            Quantum Presets:
          </span>
          <Button
            size="sm"
            variant={!isNuclearMagneton && gFactor === 1 ? 'primary' : 'secondary'}
            category="magnetic"
            onClick={() => {
              applyZeemanPreset(fieldTesla, 1.0, 1.0, false, 'Bohr Magneton (1.40 MHz/G)');
            }}
          >
            Bohr Magneton (1.40 MHz/G)
          </Button>
          <Button
            size="sm"
            variant={!isNuclearMagneton && Math.abs(gFactor - 2.002319) < 0.001 ? 'primary' : 'secondary'}
            category="magnetic"
            onClick={() => {
              applyZeemanPreset(fieldTesla, 2.002319, 1.0, false, 'Free Electron (g_e ≈ 2.002)');
            }}
          >
            Free Electron (g_e ≈ 2.002)
          </Button>
          <Button
            size="sm"
            variant={isNuclearMagneton ? 'primary' : 'secondary'}
            category="magnetic"
            onClick={() => {
              applyZeemanPreset(fieldTesla, 1.0, 1.0, true, 'Nuclear Magneton μ_N (762 Hz/G)');
            }}
          >
            Nuclear Magneton μ_N (762 Hz/G)
          </Button>
        </div>

        {/* Inputs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-md)'
          }}
        >
          {/* Magnetic Field */}
          <SyncedInput
            id="zeeman-field"
            label="Magnetic Field Strength"
            symbol="B"
            value={getFieldDisplay()}
            unit={fieldUnit}
            category="magnetic"
            isActive={activeField === 'field'}
            onFocus={() => {
              setActiveField('field');
              focusFieldRef.current = fieldTesla;
            }}
            onBlur={() => {
              recordHistory('Magnetic Field', getFieldDisplay(), fieldUnit);
              commitField('Magnetic Field');
            }}
            onCommit={() => commitField('Magnetic Field')}
            onChange={handleFieldChange}
            unitOptions={[
              { value: 'G', label: 'G (Gauss)' },
              { value: 'T', label: 'T (Tesla)' },
              { value: 'mT', label: 'mT (milliTesla)' },
              { value: 'uT', label: 'µT (microTesla)' }
            ]}
            onUnitChange={u => setFieldUnit(u as any)}
            description="1 Tesla = 10,000 Gauss"
          />

          {/* Zeeman Frequency Shift */}
          <SyncedInput
            id="zeeman-shift"
            label="Zeeman Frequency Shift"
            symbol="Δν"
            value={getShiftDisplay()}
            unit={shiftUnit}
            category="magnetic"
            isActive={activeField === 'shift'}
            onFocus={() => {
              setActiveField('shift');
              focusFieldRef.current = fieldTesla;
            }}
            onBlur={() => {
              recordHistory('Zeeman Shift', getShiftDisplay(), shiftUnit);
              commitField('Zeeman Shift');
            }}
            onCommit={() => commitField('Zeeman Shift')}
            onChange={handleShiftChange}
            unitOptions={[
              { value: 'MHz', label: 'MHz (megahertz)' },
              { value: 'kHz', label: 'kHz (kilohertz)' },
              { value: 'GHz', label: 'GHz (gigahertz)' },
              { value: 'Hz', label: 'Hz (hertz)' }
            ]}
            onUnitChange={u => setShiftUnit(u as any)}
            description="Δν = (μ · g · Δm_F · B) / h"
          />

          {/* Landé g-factor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'medium' }}>
              Landé g-factor (g_F or g_J)
            </span>
            <input
              type="text"
              aria-label="Landé g-factor"
              inputMode="decimal"
              value={draftGFactor}
              onFocus={() => {
                setIsGFactorFocused(true);
                focusGFactorRef.current = gFactor;
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
                handleNumberStepperKeyDown(e, newVal => {
                  setDraftGFactor(newVal);
                  const val = parseFloat(newVal);
                  if (!isNaN(val)) {
                    setGFactor(val);
                  }
                });
              }}
              onChange={e => {
                const raw = e.target.value;
                setDraftGFactor(raw);
                const val = parseFloat(raw);
                if (!isNaN(val)) {
                  setGFactor(val);
                }
              }}
              onBlur={() => {
                setIsGFactorFocused(false);
                const val = parseFloat(draftGFactor);
                if (isNaN(val)) {
                  setDraftGFactor(gFactor.toString());
                } else {
                  setDraftGFactor(val.toString());
                  const prevG = focusGFactorRef.current;
                  if (Math.abs(prevG - val) > 1e-6) {
                    recordAction({
                      description: `Landé g-factor to ${val}`,
                      category: 'magnetic',
                      targetTab: 'formulas',
                      undo: () => {
                        setGFactor(prevG);
                        setDraftGFactor(prevG.toString());
                      },
                      redo: () => {
                        setGFactor(val);
                        setDraftGFactor(val.toString());
                      }
                    });
                    focusGFactorRef.current = val;
                  }
                  setGFactor(val);
                }
              }}
              className="font-mono"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-primary)'
              }}
            />
            <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
              Effective spectroscopic splitting factor
            </span>
          </div>

          {/* Magnetic Quantum Sublevel Difference */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'medium' }}>
              Sublevel Difference (Δm_F)
            </span>
            <input
              type="text"
              aria-label="Sublevel Difference (deltaMF)"
              inputMode="decimal"
              value={draftDeltaMF}
              onFocus={() => {
                setIsDeltaMFFocused(true);
                focusDeltaMFRef.current = deltaMF;
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
                handleNumberStepperKeyDown(e, newVal => {
                  setDraftDeltaMF(newVal);
                  const val = parseFloat(newVal);
                  if (!isNaN(val)) {
                    setDeltaMF(val);
                  }
                });
              }}
              onChange={e => {
                const raw = e.target.value;
                setDraftDeltaMF(raw);
                const val = parseFloat(raw);
                if (!isNaN(val)) {
                  setDeltaMF(val);
                }
              }}
              onBlur={() => {
                setIsDeltaMFFocused(false);
                const val = parseFloat(draftDeltaMF);
                if (isNaN(val)) {
                  setDraftDeltaMF(deltaMF.toString());
                } else {
                  setDraftDeltaMF(val.toString());
                  const prevD = focusDeltaMFRef.current;
                  if (Math.abs(prevD - val) > 1e-6) {
                    recordAction({
                      description: `Sublevel Diff (Δm_F) to ${val}`,
                      category: 'magnetic',
                      targetTab: 'formulas',
                      undo: () => {
                        setDeltaMF(prevD);
                        setDraftDeltaMF(prevD.toString());
                      },
                      redo: () => {
                        setDeltaMF(val);
                        setDraftDeltaMF(val.toString());
                      }
                    });
                    focusDeltaMFRef.current = val;
                  }
                  setDeltaMF(val);
                }
              }}
              className="font-mono"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-primary)'
              }}
            />
            <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
              Change in magnetic quantum number
            </span>
          </div>
        </div>

        {/* Detailed readout chips */}
        <div
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: 'var(--color-bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-lg)',
            fontSize: 'var(--font-size-xs)'
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Wavenumber shift: </span>
            <span className="font-mono" style={{ color: 'var(--color-magnetic)', fontWeight: 'bold' }}>
              {formatSignificantDigits(shiftValues.wavenumberCmInv, precisionDigits)} cm⁻¹
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Energy shift: </span>
            <span className="font-mono" style={{ color: 'var(--color-magnetic)', fontWeight: 'bold' }}>
              {formatSignificantDigits(shiftValues.energyEV * 1e6, precisionDigits)} µeV
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Bohr Rate: </span>
            <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              ~{formatSignificantDigits(BOHR_MAGNETON_MHZ_PER_GAUSS, 6)} MHz/G
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
