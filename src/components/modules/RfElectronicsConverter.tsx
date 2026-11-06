import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import { SyncedInput } from '../common/SyncedInput';
import { Button } from '../common/Button';
import { ToggleGroup } from '../common/ToggleGroup';
import { Radio, RotateCcw, Cpu, Compass, HelpCircle } from 'lucide-react';
import { handleNumberStepperKeyDown } from '../../core/number-stepper';
import {
  deriveRfQuantities,
  wattsFromDbm,
  wattsFromDbw,
  wattsFromVrms,
  wattsFromVpp,
  wattsFromVpeak,
  wattsFromDbuv,
  wattsFromDbmv,
  wattsFromDbv,
  calculateAttenuationFromDb,
  dbmFromWatts
} from '../../core/rf-power';
import {
  deriveFromVswr,
  deriveFromGamma,
  deriveFromReturnLoss,
  deriveFromMismatchLoss,
  deriveFromReflectedPowerPercent
} from '../../core/rf-vswr';
import {
  calculateComplexGamma,
  synthesizeLMatch,
  calculateEquivalentLoad
} from '../../core/rf-complex';
import { SmithChart } from './SmithChart';
import { LMatchSchematic } from './LMatchSchematic';
import { formatSignificantDigits } from '../../core/formatters';
import { useSettings } from '../../context/SettingsContext';
import { useHistory } from '../../context/HistoryContext';
import { useUndoRedo } from '../../context/UndoRedoContext';

export const RfElectronicsConverter: React.FC = () => {
  const { precisionDigits, defaultImpedance, setDefaultImpedance } = useSettings();
  const { addEntry } = useHistory();
  const { recordAction } = useUndoRedo();

  // Refs to track initial values upon focus for clean undo grouping
  const focusWattsRef = useRef<number>(0.01);
  const focusZ0Ref = useRef<number>(defaultImpedance || 50);
  const focusAttenRef = useRef<number>(10);
  const focusVswrRef = useRef<ReturnType<typeof deriveFromVswr> | null>(null);

  // Canonical RF Power: Watts (default 10 mW = 0.01 W -> 10 dBm at 50 ohms)
  const [watts, setWatts] = useState<number>(0.01);
  const [impedanceOhms, setImpedanceOhms] = useState<number>(defaultImpedance || 50);
  const [draftZ0, setDraftZ0] = useState<string>((defaultImpedance || 50).toString());
  const [isZ0Focused, setIsZ0Focused] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  useEffect(() => {
    if (!isZ0Focused) {
      setDraftZ0(impedanceOhms.toString());
    }
  }, [impedanceOhms, isZ0Focused]);

  // Attenuation state
  const [attenuationDb, setAttenuationDb] = useState<number>(10); // 10 dB attenuator
  const attenResults = calculateAttenuationFromDb(attenuationDb);

  // VSWR state
  const [vswrState, setVswrState] = useState(() => deriveFromVswr(1.2)); // default VSWR 1.2
  const [activeVswrField, setActiveVswrField] = useState<string | null>(null);

  // Complex RF Load Impedance & Matching state (defaults to standard matched 50 Ω, X = 0)
  const [loadR, setLoadR] = useState<number>(impedanceOhms);
  const [loadX, setLoadX] = useState<number>(0);
  const [freqMHz, setFreqMHz] = useState<number>(100);
  const [showTopologyGuide, setShowTopologyGuide] = useState<boolean>(false);
  const [selectedTopology, setSelectedTopology] = useState<'Low-Pass' | 'High-Pass' | 'None'>('Low-Pass');

  // Complex RF derivations
  const complexGamma = calculateComplexGamma({ re: loadR, im: loadX }, impedanceOhms, watts);
  const eqLoad = calculateEquivalentLoad(loadR, loadX, freqMHz * 1e6);
  const matchingSolutions = synthesizeLMatch(
    { re: loadR, im: loadX },
    impedanceOhms,
    freqMHz * 1e6
  );

  const formatWattsDisplay = (w: number): { value: string; unit: string } => {
    const absW = Math.abs(w);
    if (absW >= 1) return { value: formatSignificantDigits(w, precisionDigits), unit: 'W' };
    if (absW >= 1e-3) return { value: formatSignificantDigits(w * 1e3, precisionDigits), unit: 'mW' };
    return { value: formatSignificantDigits(w * 1e6, precisionDigits), unit: 'µW' };
  };

  const formatVarsDisplay = (v: number): { value: string; unit: string } => {
    const absV = Math.abs(v);
    if (absV >= 1) return { value: formatSignificantDigits(v, precisionDigits), unit: 'VAR' };
    if (absV >= 1e-3) return { value: formatSignificantDigits(v * 1e3, precisionDigits), unit: 'mVAR' };
    return { value: formatSignificantDigits(v * 1e6, precisionDigits), unit: 'µVAR' };
  };

  // Derived RF power & voltage quantities
  const rfQuantities = deriveRfQuantities(watts, impedanceOhms);

  // RF input unit selections for consolidated inputs
  const [linearPowerUnit, setLinearPowerUnit] = useState<'mW' | 'W' | 'uW' | 'nW' | 'pW'>('mW');
  const [dbPowerUnit, setDbPowerUnit] = useState<'dBm' | 'dBW'>('dBm');
  const [vrmsUnit, setVrmsUnit] = useState<'V' | 'mV' | 'uV'>('V');
  const [vPeakUnit, setVPeakUnit] = useState<'V_pk' | 'V_pp' | 'mV_pk' | 'mV_pp'>('V_pk');
  const [dbVoltageUnit, setDbVoltageUnit] = useState<'dBuV' | 'dBmV' | 'dBV'>('dBuV');

  const getLinearPowerValue = (w: number, unit: string): number => {
    switch (unit) {
      case 'W': return w;
      case 'mW': return w * 1e3;
      case 'uW': return w * 1e6;
      case 'nW': return w * 1e9;
      case 'pW': return w * 1e12;
      default: return w * 1e3;
    }
  };

  const getDbPowerValue = (quantities: typeof rfQuantities, unit: string): number => {
    switch (unit) {
      case 'dBm': return quantities.power.dBm;
      case 'dBW': return quantities.power.dBW;
      default: return quantities.power.dBm;
    }
  };

  const getVrmsValue = (vrms: number, unit: string): number => {
    switch (unit) {
      case 'V': return vrms;
      case 'mV': return vrms * 1e3;
      case 'uV': return vrms * 1e6;
      default: return vrms;
    }
  };

  const getVPeakValue = (quantities: typeof rfQuantities, unit: string): number => {
    switch (unit) {
      case 'V_pk': return quantities.voltage.Vpeak;
      case 'V_pp': return quantities.voltage.Vpp;
      case 'mV_pk': return quantities.voltage.Vpeak * 1e3;
      case 'mV_pp': return quantities.voltage.Vpp * 1e3;
      default: return quantities.voltage.Vpeak;
    }
  };

  const getDbVoltageValue = (quantities: typeof rfQuantities, unit: string): number => {
    switch (unit) {
      case 'dBuV': return quantities.voltage.dBuV;
      case 'dBmV': return quantities.voltage.dBmV;
      case 'dBV': return quantities.voltage.Vrms > 0 ? 20 * Math.log10(quantities.voltage.Vrms) : -Infinity;
      default: return quantities.voltage.dBuV;
    }
  };

  const handleLinearPowerChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val < 0) return;
      switch (linearPowerUnit) {
        case 'W': setWatts(val); break;
        case 'mW': setWatts(val * 1e-3); break;
        case 'uW': setWatts(val * 1e-6); break;
        case 'nW': setWatts(val * 1e-9); break;
        case 'pW': setWatts(val * 1e-12); break;
        default: setWatts(val * 1e-3); break;
      }
    },
    [linearPowerUnit]
  );

  const handleDbPowerChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val)) return;
      if (dbPowerUnit === 'dBW') {
        setWatts(wattsFromDbw(val));
      } else {
        setWatts(wattsFromDbm(val));
      }
    },
    [dbPowerUnit]
  );

  const handleVrmsChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val < 0) return;
      let vInVolts = val;
      if (vrmsUnit === 'mV') vInVolts = val * 1e-3;
      else if (vrmsUnit === 'uV') vInVolts = val * 1e-6;
      setWatts(wattsFromVrms(vInVolts, impedanceOhms));
    },
    [vrmsUnit, impedanceOhms]
  );

  const handlePeakVoltageChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val) || val < 0) return;
      switch (vPeakUnit) {
        case 'V_pk':
          setWatts(wattsFromVpeak(val, impedanceOhms));
          break;
        case 'V_pp':
          setWatts(wattsFromVpp(val, impedanceOhms));
          break;
        case 'mV_pk':
          setWatts(wattsFromVpeak(val * 1e-3, impedanceOhms));
          break;
        case 'mV_pp':
          setWatts(wattsFromVpp(val * 1e-3, impedanceOhms));
          break;
        default:
          setWatts(wattsFromVpeak(val, impedanceOhms));
          break;
      }
    },
    [vPeakUnit, impedanceOhms]
  );

  const handleDbVoltageChange = useCallback(
    (str: string) => {
      const val = parseFloat(str);
      if (isNaN(val)) return;
      switch (dbVoltageUnit) {
        case 'dBuV':
          setWatts(wattsFromDbuv(val, impedanceOhms));
          break;
        case 'dBmV':
          setWatts(wattsFromDbmv(val, impedanceOhms));
          break;
        case 'dBV':
          setWatts(wattsFromDbv(val, impedanceOhms));
          break;
        default:
          setWatts(wattsFromDbuv(val, impedanceOhms));
          break;
      }
    },
    [dbVoltageUnit, impedanceOhms]
  );

  const recordRfHistory = (source: string, val: string, u: string) => {
    addEntry({
      category: 'rf',
      title: 'RF Power Conversion',
      sourceField: source,
      sourceValue: val,
      sourceUnit: u,
      details: {
        'Impedance Z0': `${impedanceOhms} Ω`,
        Power: `${formatSignificantDigits(rfQuantities.power.dBm, precisionDigits)} dBm (${formatSignificantDigits(rfQuantities.power.mW, precisionDigits)} mW)`,
        Vrms: `${formatSignificantDigits(rfQuantities.voltage.Vrms, precisionDigits)} V`,
        Vpp: `${formatSignificantDigits(rfQuantities.voltage.Vpp, precisionDigits)} V`
      }
    });
    setActiveField(null);
  };

  const commitWatts = (label: string) => {
    const prevW = focusWattsRef.current;
    const nextW = watts;
    if (Math.abs(prevW - nextW) > 1e-15) {
      recordAction({
        description: `${label} to ${formatWattsDisplay(nextW).value} ${formatWattsDisplay(nextW).unit}`,
        category: 'rf',
        targetTab: 'rf',
        undo: () => setWatts(prevW),
        redo: () => setWatts(nextW)
      });
      focusWattsRef.current = nextW;
    }
  };

  const commitVswr = (label: string) => {
    const prev = focusVswrRef.current;
    const next = vswrState;
    if (prev && Math.abs(prev.vswr - next.vswr) > 1e-5) {
      recordAction({
        description: `${label} to ${formatSignificantDigits(next.vswr, precisionDigits)}:1`,
        category: 'rf',
        targetTab: 'rf',
        undo: () => setVswrState(prev),
        redo: () => setVswrState(next)
      });
      focusVswrRef.current = next;
    }
  };

  const applyLoadPreset = (targetR: number, targetX: number, name: string) => {
    const prevR = loadR;
    const prevX = loadX;
    if (Math.abs(prevR - targetR) < 1e-4 && Math.abs(prevX - targetX) < 1e-4) return;
    recordAction({
      description: `Load Preset: ${name}`,
      category: 'rf',
      targetTab: 'rf',
      undo: () => {
        setLoadR(prevR);
        setLoadX(prevX);
      },
      redo: () => {
        setLoadR(targetR);
        setLoadX(targetX);
      }
    });
    setLoadR(targetR);
    setLoadX(targetX);
  };

  const toggleTopology = (name: 'Low-Pass' | 'High-Pass') => {
    const next: 'Low-Pass' | 'High-Pass' | 'None' = selectedTopology === name ? 'None' : name;
    const prev = selectedTopology;
    if (prev === next) return;
    recordAction({
      description: `Matching Topology: ${next}`,
      category: 'rf',
      targetTab: 'rf',
      undo: () => setSelectedTopology(prev),
      redo: () => setSelectedTopology(next)
    });
    setSelectedTopology(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* 1. RF Power & Voltage Synchronized Grid */}
      <Card
        title="RF Power & Voltage Converter"
        subtitle="Convert between dBm, Watts, V_RMS, and V_pp for a given system impedance."
        category="rf"
        icon={<Radio size={20} />}
        actions={
          <Button
            size="sm"
            variant="ghost"
            category="rf"
            icon={<RotateCcw size={14} />}
            onClick={() => {
              const prevW = watts;
              const prevZ = impedanceOhms;
              recordAction({
                description: 'Reset RF Power (10 dBm, 50Ω)',
                category: 'rf',
                targetTab: 'rf',
                undo: () => {
                  setWatts(prevW);
                  setImpedanceOhms(prevZ);
                  setDefaultImpedance(prevZ);
                },
                redo: () => {
                  setWatts(0.01);
                  setImpedanceOhms(50);
                  setDefaultImpedance(50);
                  setLinearPowerUnit('mW');
                  setDbPowerUnit('dBm');
                  setVrmsUnit('V');
                  setVPeakUnit('V_pk');
                  setDbVoltageUnit('dBuV');
                  setActiveField(null);
                }
              });
              setWatts(0.01);
              setImpedanceOhms(50);
              setDefaultImpedance(50);
              setLinearPowerUnit('mW');
              setDbPowerUnit('dBm');
              setVrmsUnit('V');
              setVPeakUnit('V_pk');
              setDbVoltageUnit('dBuV');
              setActiveField(null);
            }}
          >
            Reset (10 dBm, 50Ω)
          </Button>
        }
      >
        {/* Impedance Selector */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm)',
            backgroundColor: 'var(--color-bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            marginBottom: 'var(--space-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
              System Impedance (Z₀):
            </span>
            <ToggleGroup
              options={[
                { value: 50, label: '50 Ω (RF Standard)' },
                { value: 75, label: '75 Ω (Video/CATV)' },
                { value: 1000000, label: '1 MΩ (Scope High-Z)' }
              ]}
              value={impedanceOhms}
              onChange={val => {
                const prev = impedanceOhms;
                const num = Number(val);
                if (prev === num) return;
                recordAction({
                  description: `System Impedance Z₀ to ${num} Ω`,
                  category: 'rf',
                  targetTab: 'rf',
                  undo: () => {
                    setImpedanceOhms(prev);
                    setDefaultImpedance(prev);
                  },
                  redo: () => {
                    setImpedanceOhms(num);
                    setDefaultImpedance(num);
                  }
                });
                setImpedanceOhms(num);
                setDefaultImpedance(num);
              }}
              category="rf"
              size="sm"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Custom Z₀:</span>
            <input
              type="text"
              inputMode="decimal"
              value={draftZ0}
              onFocus={() => {
                setIsZ0Focused(true);
                focusZ0Ref.current = impedanceOhms;
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
                handleNumberStepperKeyDown(e, newVal => {
                  setDraftZ0(newVal);
                  const z = parseFloat(newVal);
                  if (!isNaN(z) && z > 0) {
                    setImpedanceOhms(z);
                    setDefaultImpedance(z);
                  }
                });
              }}
              onChange={e => {
                const raw = e.target.value;
                setDraftZ0(raw);
                const z = parseFloat(raw);
                if (!isNaN(z) && z > 0) {
                  setImpedanceOhms(z);
                  setDefaultImpedance(z);
                }
              }}
              onBlur={() => {
                setIsZ0Focused(false);
                const z = parseFloat(draftZ0);
                if (isNaN(z) || z <= 0) {
                  setDraftZ0(impedanceOhms.toString());
                } else {
                  setDraftZ0(z.toString());
                  const prev = focusZ0Ref.current;
                  if (prev !== z) {
                    recordAction({
                      description: `System Impedance Z₀ to ${z} Ω`,
                      category: 'rf',
                      targetTab: 'rf',
                      undo: () => {
                        setImpedanceOhms(prev);
                        setDefaultImpedance(prev);
                      },
                      redo: () => {
                        setImpedanceOhms(z);
                        setDefaultImpedance(z);
                      }
                    });
                  }
                  setImpedanceOhms(z);
                  setDefaultImpedance(z);
                }
              }}
              className="font-mono"
              style={{
                width: '80px',
                padding: '4px 8px',
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xs)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-primary)'
              }}
            />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Ω</span>
          </div>
        </div>

        {/* Inputs Grid - Consolidated with magnitude and type dropdown selectors */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-md)'
          }}
        >
          {/* 1. Linear Power (mW, W, µW, nW, pW) */}
          <SyncedInput
            id="rf-power-linear"
            label="Linear Power"
            symbol="P"
            value={formatSignificantDigits(getLinearPowerValue(watts, linearPowerUnit), precisionDigits)}
            unit={linearPowerUnit}
            category="rf"
            isActive={activeField === 'linearPower'}
            onFocus={() => {
              setActiveField('linearPower');
              focusWattsRef.current = watts;
            }}
            onBlur={() => {
              recordRfHistory(`Linear Power (${linearPowerUnit})`, formatSignificantDigits(getLinearPowerValue(watts, linearPowerUnit), precisionDigits), linearPowerUnit);
              commitWatts(`Linear Power (${linearPowerUnit})`);
            }}
            onCommit={() => commitWatts(`Linear Power (${linearPowerUnit})`)}
            onChange={handleLinearPowerChange}
            unitOptions={[
              { value: 'mW', label: 'mW (Milliwatts)' },
              { value: 'W', label: 'W (Watts)' },
              { value: 'uW', label: 'µW (Microwatts)' },
              { value: 'nW', label: 'nW (Nanowatts)' },
              { value: 'pW', label: 'pW (Picowatts)' }
            ]}
            onUnitChange={u => setLinearPowerUnit(u as 'mW' | 'W' | 'uW' | 'nW' | 'pW')}
            description="Linear RF power (P = V_rms² / Z₀)"
          />

          {/* 2. Logarithmic Power (dBm, dBW) */}
          <SyncedInput
            id="rf-power-db"
            label="Logarithmic Power"
            symbol="P_dB"
            value={formatSignificantDigits(getDbPowerValue(rfQuantities, dbPowerUnit), precisionDigits)}
            unit={dbPowerUnit}
            category="rf"
            isActive={activeField === 'dbPower'}
            onFocus={() => {
              setActiveField('dbPower');
              focusWattsRef.current = watts;
            }}
            onBlur={() => {
              recordRfHistory(`Logarithmic Power (${dbPowerUnit})`, formatSignificantDigits(getDbPowerValue(rfQuantities, dbPowerUnit), precisionDigits), dbPowerUnit);
              commitWatts(`Logarithmic Power (${dbPowerUnit})`);
            }}
            onCommit={() => commitWatts(`Logarithmic Power (${dbPowerUnit})`)}
            onChange={handleDbPowerChange}
            unitOptions={[
              { value: 'dBm', label: 'dBm (re 1 mW)' },
              { value: 'dBW', label: 'dBW (re 1 W)' }
            ]}
            onUnitChange={u => setDbPowerUnit(u as 'dBm' | 'dBW')}
            description="Power referenced to 1 mW or 1 W"
          />

          {/* 3. RMS Voltage (V, mV, µV) */}
          <SyncedInput
            id="rf-vrms"
            label="RMS Voltage"
            symbol="V_rms"
            value={formatSignificantDigits(getVrmsValue(rfQuantities.voltage.Vrms, vrmsUnit), precisionDigits)}
            unit={vrmsUnit}
            category="rf"
            isActive={activeField === 'vrms'}
            onFocus={() => {
              setActiveField('vrms');
              focusWattsRef.current = watts;
            }}
            onBlur={() => {
              recordRfHistory(`RMS Voltage (${vrmsUnit})`, formatSignificantDigits(getVrmsValue(rfQuantities.voltage.Vrms, vrmsUnit), precisionDigits), vrmsUnit);
              commitWatts(`RMS Voltage (${vrmsUnit})`);
            }}
            onCommit={() => commitWatts(`RMS Voltage (${vrmsUnit})`)}
            onChange={handleVrmsChange}
            unitOptions={[
              { value: 'V', label: 'V (Volts RMS)' },
              { value: 'mV', label: 'mV (Millivolts RMS)' },
              { value: 'uV', label: 'µV (Microvolts RMS)' }
            ]}
            onUnitChange={u => setVrmsUnit(u as 'V' | 'mV' | 'uV')}
            description="V_rms = √(P · Z₀)"
          />

          {/* 4. Peak & Peak-to-Peak Voltage (V_pk, V_pp, mV_pk, mV_pp) */}
          <SyncedInput
            id="rf-vpeak"
            label="Peak / Peak-to-Peak Voltage"
            symbol="V_pk / V_pp"
            value={formatSignificantDigits(getVPeakValue(rfQuantities, vPeakUnit), precisionDigits)}
            unit={vPeakUnit}
            category="rf"
            isActive={activeField === 'vpeak'}
            onFocus={() => {
              setActiveField('vpeak');
              focusWattsRef.current = watts;
            }}
            onBlur={() => {
              recordRfHistory(`Voltage (${vPeakUnit})`, formatSignificantDigits(getVPeakValue(rfQuantities, vPeakUnit), precisionDigits), vPeakUnit);
              commitWatts(`Voltage (${vPeakUnit})`);
            }}
            onCommit={() => commitWatts(`Voltage (${vPeakUnit})`)}
            onChange={handlePeakVoltageChange}
            unitOptions={[
              { value: 'V_pk', label: 'V_pk (Peak Voltage)' },
              { value: 'V_pp', label: 'V_pp (Peak-to-Peak Voltage)' },
              { value: 'mV_pk', label: 'mV_pk (Millivolts Peak)' },
              { value: 'mV_pp', label: 'mV_pp (Millivolts Peak-to-Peak)' }
            ]}
            onUnitChange={u => setVPeakUnit(u as 'V_pk' | 'V_pp' | 'mV_pk' | 'mV_pp')}
            description="V_pk = √2 · V_rms, V_pp = 2√2 · V_rms"
          />

          {/* 5. Logarithmic Voltage (dBµV, dBmV, dBV) */}
          <SyncedInput
            id="rf-voltage-db"
            label="Logarithmic Voltage"
            symbol="V_dB"
            value={formatSignificantDigits(getDbVoltageValue(rfQuantities, dbVoltageUnit), precisionDigits)}
            unit={dbVoltageUnit}
            category="rf"
            isActive={activeField === 'dbVoltage'}
            onFocus={() => {
              setActiveField('dbVoltage');
              focusWattsRef.current = watts;
            }}
            onBlur={() => {
              recordRfHistory(`Voltage (${dbVoltageUnit})`, formatSignificantDigits(getDbVoltageValue(rfQuantities, dbVoltageUnit), precisionDigits), dbVoltageUnit);
              commitWatts(`Voltage (${dbVoltageUnit})`);
            }}
            onCommit={() => commitWatts(`Voltage (${dbVoltageUnit})`)}
            onChange={handleDbVoltageChange}
            unitOptions={[
              { value: 'dBuV', label: 'dBµV (re 1 µV RMS)' },
              { value: 'dBmV', label: 'dBmV (re 1 mV RMS)' },
              { value: 'dBV', label: 'dBV (re 1 V RMS)' }
            ]}
            onUnitChange={u => setDbVoltageUnit(u as 'dBuV' | 'dBmV' | 'dBV')}
            description="Voltage referenced to 1 µV, 1 mV, or 1 V RMS"
          />
        </div>
      </Card>

      {/* 2. Attenuation & Gain Section */}
      <Card
        title="RF Attenuation & Gain"
        category="rf"
        icon={<Radio size={20} />}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-md)'
          }}
        >
          <SyncedInput
            id="rf-atten-db"
            label="Attenuation"
            symbol="A_dB"
            value={attenuationDb}
            unit="dB"
            category="rf"
            onFocus={() => {
              focusAttenRef.current = attenuationDb;
            }}
            onBlur={() => {
              const prev = focusAttenRef.current;
              const next = attenuationDb;
              if (Math.abs(prev - next) > 1e-6) {
                recordAction({
                  description: `Attenuation to ${next} dB`,
                  category: 'rf',
                  targetTab: 'rf',
                  undo: () => setAttenuationDb(prev),
                  redo: () => setAttenuationDb(next)
                });
                focusAttenRef.current = next;
              }
            }}
            onCommit={() => {
              const prev = focusAttenRef.current;
              const next = attenuationDb;
              if (Math.abs(prev - next) > 1e-6) {
                recordAction({
                  description: `Attenuation to ${next} dB`,
                  category: 'rf',
                  targetTab: 'rf',
                  undo: () => setAttenuationDb(prev),
                  redo: () => setAttenuationDb(next)
                });
                focusAttenRef.current = next;
              }
            }}
            onChange={v => setAttenuationDb(parseFloat(v) || 0)}
            description="Decibel power loss (e.g. 3 dB, 6 dB, 10 dB, 20 dB)"
          />

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Power Ratio (P_out / P_in)</div>
            <div className="font-mono" style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-rf)', fontWeight: 'bold' }}>
              {formatSignificantDigits(attenResults.powerRatio, 5)} <span style={{ fontSize: '13px' }}>({formatSignificantDigits(attenResults.powerRatioPercent, 4)}%)</span>
            </div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
              10^(-A_dB / 10)
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Voltage Ratio (V_out / V_in)</div>
            <div className="font-mono" style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-rf)', fontWeight: 'bold' }}>
              {formatSignificantDigits(attenResults.voltageRatio, 5)} <span style={{ fontSize: '13px' }}>({formatSignificantDigits(attenResults.voltageRatioPercent, 4)}%)</span>
            </div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
              10^(-A_dB / 20)
            </div>
          </div>
        </div>
      </Card>

      {/* 3. VSWR, Return Loss & Reflection Section */}
      <Card
        title="VSWR & Return Loss"
        category="rf"
        icon={<Radio size={20} />}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-md)'
          }}
        >
          {/* VSWR */}
          <SyncedInput
            id="rf-vswr"
            label="VSWR"
            symbol="S"
            value={formatSignificantDigits(vswrState.vswr, precisionDigits)}
            unit=": 1"
            category="rf"
            isActive={activeVswrField === 'vswr'}
            onFocus={() => {
              setActiveVswrField('vswr');
              focusVswrRef.current = vswrState;
            }}
            onBlur={() => {
              setActiveVswrField(null);
              commitVswr('VSWR');
            }}
            onCommit={() => commitVswr('VSWR')}
            onChange={v => {
              const val = parseFloat(v);
              if (!isNaN(val) && val >= 1.0) setVswrState(deriveFromVswr(val));
            }}
            description="Voltage Standing Wave Ratio (≥ 1.0)"
          />

          {/* Reflection Coefficient |Gamma| */}
          <SyncedInput
            id="rf-gamma"
            label="Reflection Coefficient"
            symbol="|Γ|"
            value={formatSignificantDigits(vswrState.gamma, precisionDigits)}
            unit=""
            category="rf"
            isActive={activeVswrField === 'gamma'}
            onFocus={() => {
              setActiveVswrField('gamma');
              focusVswrRef.current = vswrState;
            }}
            onBlur={() => {
              setActiveVswrField(null);
              commitVswr('Reflection Coefficient |Γ|');
            }}
            onCommit={() => commitVswr('Reflection Coefficient |Γ|')}
            onChange={v => {
              const val = parseFloat(v);
              if (!isNaN(val)) setVswrState(deriveFromGamma(val));
            }}
            description="|Γ| = (VSWR - 1) / (VSWR + 1)"
          />

          {/* Return Loss (dB) */}
          <SyncedInput
            id="rf-return-loss"
            label="Return Loss"
            symbol="RL"
            value={formatSignificantDigits(vswrState.returnLossDb, precisionDigits)}
            unit="dB"
            category="rf"
            isActive={activeVswrField === 'rl'}
            onFocus={() => {
              setActiveVswrField('rl');
              focusVswrRef.current = vswrState;
            }}
            onBlur={() => {
              setActiveVswrField(null);
              commitVswr('Return Loss');
            }}
            onCommit={() => commitVswr('Return Loss')}
            onChange={v => {
              const val = parseFloat(v);
              if (!isNaN(val)) setVswrState(deriveFromReturnLoss(val));
            }}
            description="RL = -20 log₁₀|Γ| (dB)"
          />

          {/* Mismatch Loss (dB) */}
          <SyncedInput
            id="rf-mismatch-loss"
            label="Mismatch Loss"
            symbol="ML"
            value={formatSignificantDigits(vswrState.mismatchLossDb, precisionDigits)}
            unit="dB"
            category="rf"
            isActive={activeVswrField === 'ml'}
            onFocus={() => {
              setActiveVswrField('ml');
              focusVswrRef.current = vswrState;
            }}
            onBlur={() => {
              setActiveVswrField(null);
              commitVswr('Mismatch Loss');
            }}
            onCommit={() => commitVswr('Mismatch Loss')}
            onChange={v => {
              const val = parseFloat(v);
              if (!isNaN(val)) setVswrState(deriveFromMismatchLoss(val));
            }}
            description="ML = -10 log₁₀(1 - |Γ|²) (dB)"
          />

          {/* Reflected Power % */}
          <SyncedInput
            id="rf-refl-pct"
            label="Reflected Power"
            symbol="P_refl"
            value={formatSignificantDigits(vswrState.reflectedPowerPercent, 4)}
            unit="%"
            category="rf"
            isActive={activeVswrField === 'refl'}
            onFocus={() => {
              setActiveVswrField('refl');
              focusVswrRef.current = vswrState;
            }}
            onBlur={() => {
              setActiveVswrField(null);
              commitVswr('Reflected Power');
            }}
            onCommit={() => commitVswr('Reflected Power')}
            onChange={v => {
              const val = parseFloat(v);
              if (!isNaN(val)) setVswrState(deriveFromReflectedPowerPercent(val));
            }}
            description="|Γ|² × 100%"
          />

          {/* Transmitted Power % */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'medium' }}>
              Transmitted Power Percentage
            </div>
            <div className="font-mono" style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-rf)', fontWeight: 'bold' }}>
              {formatSignificantDigits(vswrState.transmittedPowerPercent, 4)} %
            </div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
              (1 - |Γ|²) × 100%
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Complex Impedance, Smith Chart & L-C Matcher Section */}
      <Card
        title="Complex Impedance, Smith Chart & Reactive Load Analyzer"
        subtitle="Reflection coefficient Γ, power delivery, and matching network for load impedance Z_L."
        category="rf"
        icon={<Compass size={20} />}
        actions={
          <Button
            size="sm"
            variant="ghost"
            category="rf"
            icon={<RotateCcw size={14} />}
            onClick={() => {
              const prevR = loadR;
              const prevX = loadX;
              const prevF = freqMHz;
              recordAction({
                description: `Reset Load (Matched ${impedanceOhms}Ω)`,
                category: 'rf',
                targetTab: 'rf',
                undo: () => {
                  setLoadR(prevR);
                  setLoadX(prevX);
                  setFreqMHz(prevF);
                },
                redo: () => {
                  setLoadR(impedanceOhms);
                  setLoadX(0);
                  setFreqMHz(100);
                }
              });
              setLoadR(impedanceOhms);
              setLoadX(0);
              setFreqMHz(100);
            }}
          >
            Reset (Matched {impedanceOhms}Ω)
          </Button>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-lg)',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Complex Inputs & Live Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Quick Load Presets */}
            {(() => {
              const isMatched = Math.abs(loadR - impedanceOhms) < 1e-4 && Math.abs(loadX) < 1e-4;
              const isAom = Math.abs(loadR - 25) < 1e-4 && Math.abs(loadX - 35) < 1e-4;
              const isInductive = Math.abs(loadR - 50) < 1e-4 && Math.abs(loadX - 50) < 1e-4;
              const isCapacitive = Math.abs(loadR - 50) < 1e-4 && Math.abs(loadX - (-50)) < 1e-4;

              return (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                    Load Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyLoadPreset(impedanceOhms, 0, `Matched (${impedanceOhms}Ω)`)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: isMatched ? '1.5px solid var(--color-rf)' : '1px solid var(--color-border-subtle)',
                      boxShadow: isMatched ? '0 0 0 1px var(--color-rf), var(--shadow-sm)' : 'none',
                      backgroundColor: isMatched ? 'var(--color-rf-badge)' : 'var(--color-bg-base)',
                      color: isMatched ? 'var(--color-rf)' : 'var(--color-text-primary)',
                      fontWeight: isMatched ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                      fontSize: 'var(--font-size-xs)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Matched ({impedanceOhms}Ω)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLoadPreset(25, 35, 'AOM Coil (25+j35Ω)')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: isAom ? '1.5px solid var(--color-rf)' : '1px solid var(--color-border-subtle)',
                      boxShadow: isAom ? '0 0 0 1px var(--color-rf), var(--shadow-sm)' : 'none',
                      backgroundColor: isAom ? 'var(--color-rf-badge)' : 'var(--color-bg-base)',
                      color: isAom ? 'var(--color-rf)' : 'var(--color-text-primary)',
                      fontWeight: isAom ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                      fontSize: 'var(--font-size-xs)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    AOM Coil (25+j35Ω)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLoadPreset(50, 50, 'Inductive (50+j50Ω)')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: isInductive ? '1.5px solid var(--color-rf)' : '1px solid var(--color-border-subtle)',
                      boxShadow: isInductive ? '0 0 0 1px var(--color-rf), var(--shadow-sm)' : 'none',
                      backgroundColor: isInductive ? 'var(--color-rf-badge)' : 'var(--color-bg-base)',
                      color: isInductive ? 'var(--color-rf)' : 'var(--color-text-primary)',
                      fontWeight: isInductive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                      fontSize: 'var(--font-size-xs)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Inductive (50+j50Ω)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLoadPreset(50, -50, 'Capacitive (50-j50Ω)')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: isCapacitive ? '1.5px solid var(--color-rf)' : '1px solid var(--color-border-subtle)',
                      boxShadow: isCapacitive ? '0 0 0 1px var(--color-rf), var(--shadow-sm)' : 'none',
                      backgroundColor: isCapacitive ? 'var(--color-rf-badge)' : 'var(--color-bg-base)',
                      color: isCapacitive ? 'var(--color-rf)' : 'var(--color-text-primary)',
                      fontWeight: isCapacitive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                      fontSize: 'var(--font-size-xs)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Capacitive (50-j50Ω)
                  </button>
                </div>
              );
            })()}

            {/* Complex Inputs Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--space-sm)'
              }}
            >
              <SyncedInput
                id="rf-load-r"
                label="Load Resistance"
                symbol="R_L"
                value={loadR}
                unit="Ω"
                category="rf"
                onChange={v => {
                  const val = parseFloat(v);
                  if (!isNaN(val) && val >= 0) setLoadR(val);
                }}
                onCommit={(prev, next) => {
                  const p = parseFloat(prev);
                  const n = parseFloat(next);
                  if (isNaN(p) || isNaN(n) || p === n || n < 0) return;
                  recordAction({
                    description: `Load Resistance to ${n} Ω`,
                    category: 'rf',
                    targetTab: 'rf',
                    undo: () => setLoadR(p),
                    redo: () => setLoadR(n)
                  });
                }}
                description="Real resistive part (≥ 0 Ω)"
              />

              <SyncedInput
                id="rf-load-x"
                label="Load Reactance"
                symbol="X_L"
                value={loadX}
                unit="Ω"
                category="rf"
                onChange={v => {
                  const val = parseFloat(v);
                  if (!isNaN(val)) setLoadX(val);
                }}
                onCommit={(prev, next) => {
                  const p = parseFloat(prev);
                  const n = parseFloat(next);
                  if (isNaN(p) || isNaN(n) || p === n) return;
                  recordAction({
                    description: `Load Reactance to ${n >= 0 ? '+' : ''}${n} Ω`,
                    category: 'rf',
                    targetTab: 'rf',
                    undo: () => setLoadX(p),
                    redo: () => setLoadX(n)
                  });
                }}
                description="+ inductive, - capacitive"
              />

              <SyncedInput
                id="rf-freq"
                label="Operating Frequency"
                symbol="f"
                value={freqMHz}
                unit="MHz"
                category="rf"
                onChange={v => {
                  const val = parseFloat(v);
                  if (!isNaN(val) && val > 0) setFreqMHz(val);
                }}
                onCommit={(prev, next) => {
                  const p = parseFloat(prev);
                  const n = parseFloat(next);
                  if (isNaN(p) || isNaN(n) || p === n || n <= 0) return;
                  recordAction({
                    description: `Operating Frequency to ${n} MHz`,
                    category: 'rf',
                    targetTab: 'rf',
                    undo: () => setFreqMHz(p),
                    redo: () => setFreqMHz(n)
                  });
                }}
                description="For L-C component values"
              />
            </div>

            {/* Physical Equivalent Load & Admittance Bar */}
            <div
              style={{
                marginTop: 'var(--space-xs)',
                padding: '8px 12px',
                backgroundColor: 'var(--color-bg-base)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Equivalent Physical Load: </span>
                <span className="font-mono" style={{ color: 'var(--color-rf)', fontWeight: 'bold' }}>
                  {loadR} Ω series with {eqLoad.componentDisplay}
                </span>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                  (Q_L = {isFinite(eqLoad.qFactor) ? formatSignificantDigits(eqLoad.qFactor, 3) : '∞'})
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Load Admittance Y_L: </span>
                <span className="font-mono" style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                  {eqLoad.admittanceDisplay}
                </span>
              </div>
            </div>

            {/* Derived Complex RF Metrics: Reflection & VSWR */}
            <div
              style={{
                marginTop: 'var(--space-sm)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 'var(--space-xs)'
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                  Reflection Coeff Γ
                </div>
                <div className="font-mono" style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-rf)', fontWeight: 'bold' }}>
                  {formatSignificantDigits(complexGamma.mag, 4)} ∠ {formatSignificantDigits(complexGamma.phaseDeg, 3)}°
                </div>
                <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                  {complexGamma.gamma.re.toFixed(3)} {complexGamma.gamma.im >= 0 ? '+' : '-'} j{Math.abs(complexGamma.gamma.im).toFixed(3)}
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                  VSWR & Return Loss
                </div>
                <div className="font-mono" style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-rf)', fontWeight: 'bold' }}>
                  {complexGamma.vswr > 100 ? '> 100' : formatSignificantDigits(complexGamma.vswr, 3)} : 1
                </div>
                <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                  RL: {isFinite(complexGamma.returnLossDb) ? `${formatSignificantDigits(complexGamma.returnLossDb, 3)} dB` : '∞ (Matched)'} · ML: {isFinite(complexGamma.mismatchLossDb) ? `${formatSignificantDigits(complexGamma.mismatchLossDb, 3)} dB` : '0 dB'}
                </div>
              </div>
            </div>

            {/* RF Power Conservation Balance */}
            <div style={{ marginTop: 'var(--space-sm)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontSize: 'var(--font-size-2xs)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <span>
                  ⚡ RF Power Balance (P_inc = <strong className="font-mono" style={{ color: 'var(--color-rf)' }}>{formatWattsDisplay(watts).value} {formatWattsDisplay(watts).unit}</strong> / {formatSignificantDigits(dbmFromWatts(watts), 3)} dBm from converter above)
                </span>
                <span className="font-mono" style={{ opacity: 0.8 }}>P_del + P_refl = 100%</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 'var(--space-xs)'
                }}
              >
                {/* 1. Active Delivered Power */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                    Active Power Delivered
                  </div>
                  <div className="font-mono" style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-rf)', fontWeight: 'bold' }}>
                    {formatWattsDisplay(complexGamma.realPowerWatts).value} <span style={{ fontSize: '11px' }}>{formatWattsDisplay(complexGamma.realPowerWatts).unit}</span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                    {formatSignificantDigits(complexGamma.realPowerPercent, 3)}% of incident
                  </div>
                </div>

                {/* 2. Reflected Power */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                    Reflected Power
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 'var(--font-size-base)',
                      color: complexGamma.reflectedPowerPercent > 20 ? 'var(--color-warning)' : 'var(--color-rf)',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatWattsDisplay(complexGamma.reflectedPowerWatts).value} <span style={{ fontSize: '11px' }}>{formatWattsDisplay(complexGamma.reflectedPowerWatts).unit}</span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                    {formatSignificantDigits(complexGamma.reflectedPowerPercent, 3)}% of incident
                  </div>
                </div>

                {/* 3. Reactive Power */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                    Reactive Power (VAR)
                  </div>
                  <div className="font-mono" style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-rf)', fontWeight: 'bold' }}>
                    {formatVarsDisplay(complexGamma.reactiveVar).value} <span style={{ fontSize: '11px' }}>{formatVarsDisplay(complexGamma.reactiveVar).unit}</span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                    {complexGamma.reactiveVar >= 0 ? 'Inductive (+VAR)' : 'Capacitive (-VAR)'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Embedded Interactive Smith Chart */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'var(--color-bg-input)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <SmithChart
              rOhms={loadR}
              xOhms={loadX}
              z0={impedanceOhms}
              onImpedanceChange={(newR, newX) => {
                setLoadR(newR);
                setLoadX(newX);
              }}
              onImpedanceCommit={(prevR, prevX, nextR, nextX) => {
                recordAction({
                  description: `Smith Chart Impedance to ${nextR} ${nextX >= 0 ? '+' : '-'} j${Math.abs(nextX)} Ω`,
                  category: 'rf',
                  targetTab: 'rf',
                  undo: () => {
                    setLoadR(prevR);
                    setLoadX(prevX);
                  },
                  redo: () => {
                    setLoadR(nextR);
                    setLoadX(nextX);
                  }
                });
              }}
              size={340}
              matchingSolutions={matchingSolutions}
              selectedTopology={selectedTopology}
            />
          </div>
        </div>

        {/* L-C Impedance Matching Synthesizer Display */}
        <div
          style={{
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--color-bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
            <Cpu size={18} style={{ color: 'var(--color-rf)' }} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
              Analytical L-Section Matching Network (Transforms {loadR} {loadX >= 0 ? '+' : '-'} j{Math.abs(loadX)} Ω to {impedanceOhms} Ω at {freqMHz} MHz)
            </span>
          </div>

          {matchingSolutions.length === 0 ? (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Load is already matched to {impedanceOhms} Ω. No matching network required.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--space-md)'
              }}
            >
              {matchingSolutions.map((sol, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--color-bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'bold',
                        color: sol.name === 'Low-Pass' ? 'var(--color-success)' : 'var(--color-rf)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {sol.name} Topology
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => toggleTopology(sol.name)}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          border: `1px solid ${selectedTopology === sol.name ? 'var(--color-rf)' : 'var(--color-border-subtle)'}`,
                          backgroundColor: selectedTopology === sol.name ? 'var(--color-rf-badge)' : 'transparent',
                          color: selectedTopology === sol.name ? 'var(--color-rf)' : 'var(--color-text-muted)',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {selectedTopology === sol.name ? '★ On Chart' : 'Show Path'}
                      </button>
                      <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                        Q = {sol.qFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)' }}>
                    {sol.topologyDescription}
                  </div>

                  {/* Component Details */}
                  <div
                    style={{
                      marginTop: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--font-size-xs)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        backgroundColor: 'var(--color-bg-base)',
                        borderRadius: 'var(--radius-xs)'
                      }}
                    >
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        Source Side ({sol.elements.sourceSide.placement}):
                      </span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                        {sol.elements.sourceSide.valueDisplay} ({sol.elements.sourceSide.type})
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        backgroundColor: 'var(--color-bg-base)',
                        borderRadius: 'var(--radius-xs)'
                      }}
                    >
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        Load Side ({sol.elements.loadSide.placement}):
                      </span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                        {sol.elements.loadSide.valueDisplay} ({sol.elements.loadSide.type})
                      </span>
                    </div>
                  </div>

                  {/* Visual Schematic Diagram */}
                  <LMatchSchematic
                    solution={sol}
                    z0={impedanceOhms}
                    zL={{ re: loadR, im: loadX }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Collapsible Discussion: When to choose Low-Pass vs High-Pass */}
          {matchingSolutions.length > 0 && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={() => setShowTopologyGuide(!showTopologyGuide)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-rf)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={14} />
                <span>Choosing between Low-Pass and High-Pass matching circuits</span>
                <span style={{ fontSize: '10px', marginLeft: 'auto', color: 'var(--color-text-muted)' }}>
                  {showTopologyGuide ? 'Hide ▲' : 'Show Guide ▼'}
                </span>
              </button>

              {showTopologyGuide && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px 14px',
                    backgroundColor: 'var(--color-bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: 'var(--font-size-xs)',
                    lineHeight: '1.5',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-success)', marginBottom: '3px' }}>
                      🟢 Low-Pass Configuration (Series L + Shunt C, or Shunt C + Series L)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      <li>
                        <strong>Suppresses Harmonics (Best for RF Power Amps & AOMs)</strong>: Attenuates the 2nd, 3rd, and higher harmonics generated by non-linear RF power amplifiers, preventing unwanted acoustic and optical diffraction orders.
                      </li>
                      <li>
                        <strong>Blocks High-Frequency Noise</strong>: Acts as a low-pass filter against UHF/microwave EMI pick-up.
                      </li>
                      <li>
                        <em>Note</em>: Passes DC. Do not use if you must block a DC bias voltage on the transmission line.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-rf)', marginBottom: '3px' }}>
                      🔵 High-Pass Configuration (Series C + Shunt L, or Shunt L + Series C)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      <li>
                        <strong>Inherent DC Blocking</strong>: The series capacitor blocks DC while passing the RF carrier. Essential when driving electro-optic modulators (EOMs) or varactor-tuned resonant cavities that have DC bias voltages.
                      </li>
                      <li>
                        <strong>Shunts Low-Frequency Hum</strong>: The shunt inductor provides a short-circuit to ground for 50/60 Hz mains hum, ground loop currents, and acoustic vibrations.
                      </li>
                      <li>
                        <em>Note</em>: Passes high-frequency harmonics and noise.
                      </li>
                    </ul>
                  </div>

                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '6px' }}>
                    💡 <strong>Lab Tip on Realizability</strong>: In addition to filtering needs, compare component values: choose the topology where component values are easiest to procure and least sensitive to PCB parasitic capacitance (&gt; 1 pF) and self-resonance frequencies (SRF).
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
