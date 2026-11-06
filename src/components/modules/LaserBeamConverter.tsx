import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ToggleGroup } from '../common/ToggleGroup';
import { RotateCcw, Sliders } from 'lucide-react';
import { BeamPropagationCanvas } from './BeamPropagationCanvas';
import { PolarizationBench } from './polarization/PolarizationBench';
import { usePresets } from '../../context/PresetContext';
import { useUndoRedo } from '../../context/UndoRedoContext';

const LASER_VIEW_MODE_KEY = 'amo-units-laser-view-mode';

export const LaserBeamConverter: React.FC = () => {
  const { appliedPreset } = usePresets();
  const { recordAction } = useUndoRedo();

  // Top-level View Mode: ABCD Propagation Bench vs Laser Polarization Bench
  const [viewMode, setViewMode] = useState<'abcd' | 'polarization'>(() => {
    if (typeof window !== 'undefined') {
      const rawHash = window.location.hash.replace('#', '');
      if (rawHash === 'polarization' || rawHash === 'laser-polarization') {
        return 'polarization';
      }
      if (rawHash === 'abcd' || rawHash === 'laser-abcd') {
        return 'abcd';
      }
      try {
        const saved = localStorage.getItem(LASER_VIEW_MODE_KEY);
        if (saved === 'polarization' || saved === 'abcd') {
          return saved;
        }
      } catch {
        // Ignored
      }
    }
    return 'abcd';
  });

  // Keep viewMode synced with URL hash & remember state when returning from other tabs
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      if (rawHash === 'polarization' || rawHash === 'laser-polarization') {
        setViewMode('polarization');
        try {
          localStorage.setItem(LASER_VIEW_MODE_KEY, 'polarization');
        } catch {
          // Ignored
        }
      } else if (rawHash === 'abcd' || rawHash === 'laser-abcd') {
        setViewMode('abcd');
        try {
          localStorage.setItem(LASER_VIEW_MODE_KEY, 'abcd');
        } catch {
          // Ignored
        }
      } else if (rawHash === 'laser') {
        // Returning to Laser tab from TabNavigation (#laser): restore user's last selected subview
        try {
          const saved = localStorage.getItem(LASER_VIEW_MODE_KEY);
          if (saved === 'polarization' || saved === 'abcd') {
            setViewMode(saved);
          }
        } catch {
          // Ignored
        }
      }
      // If navigating to other tabs (#optical, #rf, #error-propagation, #formulas), do nothing so viewMode is preserved
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleViewModeChange = (mode: 'abcd' | 'polarization') => {
    setViewMode(mode);
    try {
      localStorage.setItem(LASER_VIEW_MODE_KEY, mode);
    } catch {
      // Ignored
    }
  };

  // Beam inputs
  const [powerVal, setPowerVal] = useState<number>(10);
  const [powerUnit, setPowerUnit] = useState<'mW' | 'W' | 'uW'>('mW');
  const [waistVal, setWaistVal] = useState<number>(100);
  const [waistUnit, setWaistUnit] = useState<'um' | 'mm'>('um');
  const [wavelengthNm, setWavelengthNm] = useState<number>(() => appliedPreset?.wavelengthNm ?? 261.5); // nm (defaults to active preset)

  // Sync with applied preset from PresetContext
  useEffect(() => {
    if (appliedPreset && appliedPreset.wavelengthNm) {
      setWavelengthNm(appliedPreset.wavelengthNm);
    }
  }, [appliedPreset]);

  // Conversions to SI
  let powerWatts = powerVal * 1e-3;
  if (powerUnit === 'W') powerWatts = powerVal;
  else if (powerUnit === 'uW') powerWatts = powerVal * 1e-6;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Top Navigation Toggle: ABCD Beam Propagation vs Laser Polarization */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-sm)',
          padding: '10px 14px',
          backgroundColor: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)'
        }}
      >
        <ToggleGroup
          options={[
            { value: 'abcd', label: 'ABCD Beam Propagation' },
            { value: 'polarization', label: 'Laser Polarization Beamline' }
          ]}
          value={viewMode}
          onChange={handleViewModeChange}
          category="laser"
        />

        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Active Laser: <span className="font-mono" style={{ color: 'var(--color-laser)', fontWeight: 'bold' }}>{wavelengthNm} nm</span> · Waist w₀ (1/e²): <span className="font-mono" style={{ color: 'var(--color-laser)', fontWeight: 'bold' }}>{waistVal} {waistUnit}</span> · Power <span className="font-mono" style={{ color: 'var(--color-laser)', fontWeight: 'bold' }}>{powerVal} {powerUnit}</span>
        </div>
      </div>

      {/* Laser Beam Sub-views: ABCD Beam Propagation vs Laser Polarization Beamline */}
      <div style={{ display: viewMode === 'polarization' ? 'block' : 'none' }}>
        <PolarizationBench />
      </div>

      <div style={{ display: viewMode === 'abcd' ? 'block' : 'none' }}>
        <Card
          title="ABCD Matrix Gaussian Beam Simulator"
          subtitle="Paraxial Gaussian beam propagation (1/e² intensity / 1/e field convention) through optical elements, focal waists, and field intensity analyzer."
          category="laser"
          icon={<Sliders size={20} />}
          actions={
            <Button
              size="sm"
              variant="ghost"
              category="laser"
              icon={<RotateCcw size={14} />}
              onClick={() => {
                const prevP = powerVal;
                const prevPU = powerUnit;
                const prevW = waistVal;
                const prevWU = waistUnit;
                const prevL = wavelengthNm;
                const targetWl = appliedPreset?.wavelengthNm ?? 261.5;
                recordAction({
                  description: `Reset Beam (10mW, 100µm @ ${appliedPreset?.species || '261.5nm'})`,
                  category: 'laser',
                  targetTab: 'laser',
                  undo: () => {
                    setPowerVal(prevP);
                    setPowerUnit(prevPU);
                    setWaistVal(prevW);
                    setWaistUnit(prevWU);
                    setWavelengthNm(prevL);
                  },
                  redo: () => {
                    setPowerVal(10);
                    setPowerUnit('mW');
                    setWaistVal(100);
                    setWaistUnit('um');
                    setWavelengthNm(targetWl);
                  }
                });
                setPowerVal(10);
                setPowerUnit('mW');
                setWaistVal(100);
                setWaistUnit('um');
                setWavelengthNm(targetWl);
              }}
            >
              Reset Beam (10mW, 100µm)
            </Button>
          }
        >
          <BeamPropagationCanvas
            initialWaistUm={waistUnit === 'um' ? waistVal : waistVal * 1000}
            wavelengthNm={wavelengthNm}
            powerWatts={powerWatts}
            powerVal={powerVal}
            powerUnit={powerUnit}
            onPowerChange={(newP, newU) => {
              setPowerVal(newP);
              setPowerUnit(newU);
            }}
            onInitialWaistChange={newW0Um => {
              if (waistUnit === 'um') {
                setWaistVal(newW0Um);
              } else {
                setWaistVal(newW0Um / 1000);
              }
            }}
            onWavelengthChange={newLambdaNm => {
              setWavelengthNm(newLambdaNm);
            }}
          />
        </Card>
      </div>
    </div>
  );
};
