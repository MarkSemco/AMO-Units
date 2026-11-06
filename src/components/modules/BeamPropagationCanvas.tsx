import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  OpticalElement,
  GLASS_PRESETS,
  OPTICAL_BENCH_PRESETS,
  simulateBeamPropagation,
  evaluateBeamAtZ
} from '../../core/beam-abcd';
import { Button } from '../common/Button';
import { SyncedInput } from '../common/SyncedInput';
import { formatSignificantDigits } from '../../core/formatters';
import { handleNumberStepperKeyDown } from '../../core/number-stepper';
import {
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  Crosshair,
  Eye,
  EyeOff,
  Zap,
  Info
} from 'lucide-react';
import { CODATA_2022 } from '../../constants/codata2022';
import { useUndoRedo } from '../../context/UndoRedoContext';

export interface BeamPropagationCanvasProps {
  initialWaistUm: number;
  wavelengthNm: number;
  powerWatts?: number;
  powerVal?: number;
  powerUnit?: 'mW' | 'W' | 'uW';
  onInitialWaistChange?: (w0Um: number) => void;
  onWavelengthChange?: (lambdaNm: number) => void;
  onPowerChange?: (powerVal: number, powerUnit: 'mW' | 'W' | 'uW') => void;
}

export const BeamPropagationCanvas: React.FC<BeamPropagationCanvasProps> = ({
  initialWaistUm,
  wavelengthNm,
  powerWatts,
  powerVal,
  powerUnit,
  onInitialWaistChange,
  onWavelengthChange,
  onPowerChange
}) => {
  const { recordAction } = useUndoRedo();

  // Optical rail length (mm)
  const [railLengthMm, setRailLengthMm] = useState<number>(500);

  // Optical bench elements
  const [elements, setElements] = useState<OpticalElement[]>(() => [
    {
      id: 'lens-1',
      name: 'Thin Lens 1',
      type: 'thin-lens',
      positionZMm: 120,
      focalLengthMm: 75,
      enabled: true
    },
    {
      id: 'lens-2',
      name: 'Thin Lens 2',
      type: 'thin-lens',
      positionZMm: 270,
      focalLengthMm: 100,
      enabled: true
    }
  ]);

  // Active optical preset tracking (clears when elements/rail/waist are modified)
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Caliper / Virtual Profiler position along z (mm)
  const [caliperZMm, setCaliperZMm] = useState<number>(180);
  const [draftCaliperZ, setDraftCaliperZ] = useState<string>('180.0');
  const [isCaliperFocused, setIsCaliperFocused] = useState<boolean>(false);

  // Draft states for top inputs to allow clean deletion and typing
  const [draftInitialWaist, setDraftInitialWaist] = useState<string>(initialWaistUm.toString());
  const [isWaistFocused, setIsWaistFocused] = useState<boolean>(false);
  const focusWaistRef = useRef<number>(initialWaistUm);

  const [draftWavelength, setDraftWavelength] = useState<string>(wavelengthNm.toString());
  const [isWavelengthFocused, setIsWavelengthFocused] = useState<boolean>(false);
  const focusWavelengthRef = useRef<number>(wavelengthNm);

  const [draftRailLength, setDraftRailLength] = useState<string>(railLengthMm.toString());
  const [isRailFocused, setIsRailFocused] = useState<boolean>(false);
  const focusRailRef = useRef<number>(railLengthMm);

  // Power state & unit
  const [internalPowerVal, setInternalPowerVal] = useState<number>(() => {
    if (powerVal !== undefined) return powerVal;
    if (powerWatts !== undefined) return powerWatts >= 1 ? powerWatts : powerWatts * 1000;
    return 10;
  });
  const [internalPowerUnit, setInternalPowerUnit] = useState<'mW' | 'W' | 'uW'>(() => {
    if (powerUnit !== undefined) return powerUnit;
    if (powerWatts !== undefined) return powerWatts >= 1 ? 'W' : 'mW';
    return 'mW';
  });
  const [draftPower, setDraftPower] = useState<string>(() => {
    if (powerVal !== undefined) return powerVal.toString();
    if (powerWatts !== undefined) return (powerWatts >= 1 ? powerWatts : powerWatts * 1000).toString();
    return '10';
  });
  const [isPowerFocused, setIsPowerFocused] = useState<boolean>(false);

  useEffect(() => {
    if (powerVal !== undefined) {
      setInternalPowerVal(powerVal);
      if (!isPowerFocused) {
        setDraftPower(powerVal.toString());
      }
    }
  }, [powerVal, isPowerFocused]);

  useEffect(() => {
    if (powerUnit !== undefined) {
      setInternalPowerUnit(powerUnit);
    }
  }, [powerUnit]);

  const currentPowerVal = powerVal !== undefined ? powerVal : internalPowerVal;
  const currentPowerUnit = powerUnit !== undefined ? powerUnit : internalPowerUnit;

  const effectivePowerWatts = useMemo(() => {
    if (powerWatts !== undefined && powerVal === undefined) return powerWatts;
    if (currentPowerUnit === 'W') return currentPowerVal;
    if (currentPowerUnit === 'uW') return currentPowerVal * 1e-6;
    return currentPowerVal * 1e-3; // mW
  }, [powerWatts, powerVal, currentPowerVal, currentPowerUnit]);

  const handlePowerValueChange = (newVal: number) => {
    setInternalPowerVal(newVal);
    onPowerChange?.(newVal, currentPowerUnit);
  };

  const handlePowerUnitChange = (newUnit: 'mW' | 'W' | 'uW') => {
    setInternalPowerUnit(newUnit);
    onPowerChange?.(currentPowerVal, newUnit);
  };

  // Diffraction limit warning state
  const [isDiffractionDismissed, setIsDiffractionDismissed] = useState<boolean>(false);

  // Gaussian 1/e² vs 1/e waist convention card toggle
  const [showWaistConvention, setShowWaistConvention] = useState<boolean>(false);

  // Synchronize draft states when external props/values change and inputs are not focused
  useEffect(() => {
    if (!isCaliperFocused) {
      setDraftCaliperZ(caliperZMm.toFixed(1));
    }
  }, [caliperZMm, isCaliperFocused]);

  // Keep caliper within physical rail bounds if bench length is shortened
  useEffect(() => {
    setCaliperZMm(prev => (prev > railLengthMm ? railLengthMm : prev));
  }, [railLengthMm]);

  useEffect(() => {
    if (!isWaistFocused) {
      setDraftInitialWaist(initialWaistUm.toString());
    }
  }, [initialWaistUm, isWaistFocused]);

  useEffect(() => {
    if (!isWavelengthFocused) {
      setDraftWavelength(wavelengthNm.toString());
    }
  }, [wavelengthNm, isWavelengthFocused]);

  useEffect(() => {
    if (!isRailFocused) {
      setDraftRailLength(railLengthMm.toString());
    }
  }, [railLengthMm, isRailFocused]);

  // Selected element for parameter editing
  const [selectedElemId, setSelectedElemId] = useState<string | null>(null);

  // Dragging state
  const [draggedItem, setDraggedItem] = useState<{
    type: 'element' | 'caliper';
    id?: string;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Canvas SVG geometry dimensions
  const svgWidth = 1000;
  const svgHeight = 360;
  const paddingLeft = 70;
  const paddingRight = 40;
  const railLengthSvg = svgWidth - paddingLeft - paddingRight; // 890
  const axisY = 170; // Optical axis Y coordinate
  const beamMaxHeight = 110;

  // Run ABCD simulation
  const simulation = useMemo(() => {
    return simulateBeamPropagation({
      initialWaistUm,
      wavelengthNm,
      powerWatts: effectivePowerWatts,
      elements,
      zMaxMm: railLengthMm,
      numSamples: 250
    });
  }, [initialWaistUm, wavelengthNm, effectivePowerWatts, elements, railLengthMm]);

  // Initial Waist metrics at z = 0
  const initialWaistMetrics = useMemo(() => {
    const wM = initialWaistUm * 1e-6;
    const lambdaM = Math.max(1e-12, wavelengthNm * 1e-9);
    const areaM2 = Math.PI * wM * wM;
    const zRM = areaM2 / lambdaM;
    const zRMm = zRM * 1e3;

    const i0WPerM2 = areaM2 > 0 ? (2 * effectivePowerWatts) / areaM2 : 0;
    const i0WPerCm2 = i0WPerM2 * 1e-4;
    const iavgWPerM2 = areaM2 > 0 ? effectivePowerWatts / areaM2 : 0;
    const iavgWPerCm2 = iavgWPerM2 * 1e-4;

    const e0VPerM = Math.sqrt((2 * i0WPerM2) / (CODATA_2022.c * CODATA_2022.epsilon0));
    const e0VPerCm = e0VPerM * 1e-2;

    return {
      positionZMm: 0,
      waistRadiusUm: initialWaistUm,
      rayleighRangeMm: zRMm,
      peakIntensityWPerCm2: i0WPerCm2,
      avgIntensityWPerCm2: iavgWPerCm2,
      electricFieldVPerM: e0VPerM,
      electricFieldVPerCm: e0VPerCm
    };
  }, [initialWaistUm, wavelengthNm, effectivePowerWatts]);

  // Subsequent internal waists identified by ABCD simulation
  const subsequentWaists = useMemo(() => {
    if (!simulation?.waists) return [];
    return simulation.waists
      .filter(w => w.segmentIndex > 0 && w.isReal && w.positionZMm <= railLengthMm)
      .map((w, idx) => {
        const wM = w.waistRadiusUm * 1e-6;
        const areaM2 = Math.PI * wM * wM;
        const i0WPerM2 = areaM2 > 0 ? (2 * effectivePowerWatts) / areaM2 : 0;
        const i0WPerCm2 = i0WPerM2 * 1e-4;
        const iavgWPerM2 = areaM2 > 0 ? effectivePowerWatts / areaM2 : 0;
        const iavgWPerCm2 = iavgWPerM2 * 1e-4;
        const e0VPerM = Math.sqrt((2 * i0WPerM2) / (CODATA_2022.c * CODATA_2022.epsilon0));
        const e0VPerCm = e0VPerM * 1e-2;

        return {
          id: `waist-${idx + 1}`,
          label: `Waist ${idx + 1}`,
          positionZMm: w.positionZMm,
          waistRadiusUm: w.waistRadiusUm,
          rayleighRangeMm: w.rayleighRangeMm,
          peakIntensityWPerCm2: i0WPerCm2,
          avgIntensityWPerCm2: iavgWPerCm2,
          electricFieldVPerM: e0VPerM,
          electricFieldVPerCm: e0VPerCm
        };
      });
  }, [simulation?.waists, effectivePowerWatts, railLengthMm]);

  // Coordinate conversions
  const zToSvgX = useCallback(
    (zMm: number) => {
      const clampedZ = Math.max(0, Math.min(railLengthMm, zMm));
      return paddingLeft + (clampedZ / railLengthMm) * railLengthSvg;
    },
    [railLengthMm, railLengthSvg, paddingLeft]
  );

  const svgXToZ = useCallback(
    (svgX: number) => {
      const fraction = (svgX - paddingLeft) / railLengthSvg;
      const z = fraction * railLengthMm;
      return Math.max(0, Math.min(railLengthMm, Math.round(z * 10) / 10));
    },
    [railLengthMm, railLengthSvg, paddingLeft]
  );

  // Find max beam radius for vertical scaling
  const maxRadiusUm = useMemo(() => {
    let maxR = initialWaistUm * 1.5;
    for (const sample of simulation.samples) {
      if (sample.wUm > maxR && isFinite(sample.wUm)) {
        maxR = sample.wUm;
      }
    }
    return Math.max(100, maxR);
  }, [simulation.samples, initialWaistUm]);

  const radiusToSvgY = useCallback(
    (wUm: number) => {
      const normalized = Math.min(1.2, wUm / maxRadiusUm);
      return normalized * beamMaxHeight;
    },
    [maxRadiusUm]
  );

  // Paraxial diffraction limit for waist radius: w0_min = lambda / pi
  const diffractionLimitUm = useMemo(() => {
    return (wavelengthNm * 1e-3) / Math.PI;
  }, [wavelengthNm]);

  const isBelowDiffractionLimit = initialWaistUm < diffractionLimitUm;

  // Reset dismissal if waist radius returns above diffraction limit
  useEffect(() => {
    if (!isBelowDiffractionLimit) {
      setIsDiffractionDismissed(false);
    }
  }, [isBelowDiffractionLimit]);

  // Calibrated Y-Axis scale parameters and tick positions
  const isMmScale = maxRadiusUm >= 2000;
  const yUnit = isMmScale ? 'mm' : 'µm';
  const yMaxVal = isMmScale ? (maxRadiusUm / 1000).toFixed(1) : Math.round(maxRadiusUm).toString();
  const yHalfVal = isMmScale ? (maxRadiusUm / 2000).toFixed(1) : Math.round(maxRadiusUm / 2).toString();

  const yAxisTicks = useMemo(() => [
    { y: axisY - beamMaxHeight, label: `+${yMaxVal}`, isMajor: true },
    { y: axisY - beamMaxHeight / 2, label: `+${yHalfVal}`, isMajor: false },
    { y: axisY, label: '0', isMajor: true },
    { y: axisY + beamMaxHeight / 2, label: `-${yHalfVal}`, isMajor: false },
    { y: axisY + beamMaxHeight, label: `-${yMaxVal}`, isMajor: true }
  ], [axisY, beamMaxHeight, yMaxVal, yHalfVal]);

  // Analytical Caliper readouts at current exact caliperZMm
  const caliperData = useMemo(() => {
    return evaluateBeamAtZ(simulation, caliperZMm, effectivePowerWatts);
  }, [simulation, caliperZMm, effectivePowerWatts]);

  const dragStartElementsRef = useRef<OpticalElement[] | null>(null);
  const dragStartCaliperRef = useRef<number | null>(null);

  // Pointer drag handler using svgRef for capture and release
  const handlePointerDown = (
    e: React.PointerEvent<SVGElement>,
    type: 'element' | 'caliper',
    id?: string
  ) => {
    e.stopPropagation();
    if (svgRef.current) {
      svgRef.current.setPointerCapture(e.pointerId);
    }
    if (type === 'element' && id) {
      dragStartElementsRef.current = elements.map(el => ({ ...el }));
    } else if (type === 'caliper') {
      dragStartCaliperRef.current = caliperZMm;
    }
    setDraggedItem({ type, id });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggedItem || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * svgWidth;
    const newZ = svgXToZ(svgX);

    if (draggedItem.type === 'caliper') {
      setCaliperZMm(newZ);
    } else if (draggedItem.type === 'element' && draggedItem.id) {
      setActivePresetId(null);
      setElements(prev =>
        prev.map(el => (el.id === draggedItem.id ? { ...el, positionZMm: newZ } : el))
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (svgRef.current && svgRef.current.hasPointerCapture(e.pointerId)) {
      try {
        svgRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored if already released
      }
    }

    if (draggedItem?.type === 'element' && draggedItem.id && dragStartElementsRef.current) {
      const prevElements = dragStartElementsRef.current;
      const initialElem = prevElements.find(el => el.id === draggedItem.id);
      const currentElem = elements.find(el => el.id === draggedItem.id);
      if (initialElem && currentElem && Math.abs(initialElem.positionZMm - currentElem.positionZMm) > 0.1) {
        const nextElements = elements.map(el => ({ ...el }));
        recordAction({
          description: `Reposition ${currentElem.name} to ${Math.round(currentElem.positionZMm)} mm`,
          category: 'laser',
          targetTab: 'laser',
          undo: () => setElements(prevElements),
          redo: () => setElements(nextElements)
        });
      }
      dragStartElementsRef.current = null;
    } else if (draggedItem?.type === 'caliper' && dragStartCaliperRef.current !== null) {
      const prevZ = dragStartCaliperRef.current;
      const nextZ = caliperZMm;
      if (Math.abs(prevZ - nextZ) > 0.1) {
        recordAction({
          description: `Move Profiler Caliper to ${Math.round(nextZ)} mm`,
          category: 'laser',
          targetTab: 'laser',
          undo: () => {
            setCaliperZMm(prevZ);
            setDraftCaliperZ(prevZ.toFixed(1));
          },
          redo: () => {
            setCaliperZMm(nextZ);
            setDraftCaliperZ(nextZ.toFixed(1));
          }
        });
      }
      dragStartCaliperRef.current = null;
    }

    setDraggedItem(null);
  };

  // Add Element Handlers
  const addThinLens = () => {
    setActivePresetId(null);
    const newId = `lens-${Date.now()}`;
    const newElem: OpticalElement = {
      id: newId,
      name: `Thin Lens (f = 100mm)`,
      type: 'thin-lens',
      positionZMm: Math.min(railLengthMm - 20, Math.max(20, Math.round(railLengthMm * 0.6))),
      focalLengthMm: 100,
      enabled: true
    };
    const prev = elements;
    const next = [...prev, newElem];
    recordAction({
      description: 'Add Thin Lens to Bench',
      category: 'laser',
      targetTab: 'laser',
      undo: () => setElements(prev),
      redo: () => setElements(next)
    });
    setElements(next);
    setSelectedElemId(newId);
  };

  const addThickLens = () => {
    setActivePresetId(null);
    const newId = `thick-${Date.now()}`;
    const newElem: OpticalElement = {
      id: newId,
      name: `Thick Lens (N-BK7)`,
      type: 'thick-lens',
      positionZMm: Math.min(railLengthMm - 20, Math.max(20, Math.round(railLengthMm * 0.6))),
      frontCurvatureR1Mm: 51.5,
      backCurvatureR2Mm: -51.5,
      thicknessMm: 4.5,
      refractiveIndex: GLASS_PRESETS.nbk7.n,
      glassName: GLASS_PRESETS.nbk7.name,
      enabled: true
    };
    const prev = elements;
    const next = [...prev, newElem];
    recordAction({
      description: 'Add Thick Lens to Bench',
      category: 'laser',
      targetTab: 'laser',
      undo: () => setElements(prev),
      redo: () => setElements(next)
    });
    setElements(next);
    setSelectedElemId(newId);
  };

  const removeElement = (id: string) => {
    setActivePresetId(null);
    const prev = elements;
    const target = prev.find(e => e.id === id);
    const next = prev.filter(e => e.id !== id);
    recordAction({
      description: `Remove ${target?.name || 'Element'}`,
      category: 'laser',
      targetTab: 'laser',
      undo: () => setElements(prev),
      redo: () => setElements(next)
    });
    setElements(next);
    if (selectedElemId === id) setSelectedElemId(null);
  };

  const toggleElement = (id: string) => {
    setActivePresetId(null);
    const prev = elements;
    const next = prev.map(e => (e.id === id ? { ...e, enabled: !e.enabled } : e));
    recordAction({
      description: 'Toggle Optical Element',
      category: 'laser',
      targetTab: 'laser',
      undo: () => setElements(prev),
      redo: () => setElements(next)
    });
    setElements(next);
  };

  const loadPreset = (presetId: string) => {
    const preset = OPTICAL_BENCH_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const prevElements = elements;
    const prevRail = railLengthMm;
    const prevWaist = initialWaistUm;
    const prevPresetId = activePresetId;

    recordAction({
      description: `Load Optical Preset: ${preset.name}`,
      category: 'laser',
      targetTab: 'laser',
      undo: () => {
        setElements(prevElements);
        setRailLengthMm(prevRail);
        setDraftRailLength(prevRail.toString());
        setActivePresetId(prevPresetId);
        onInitialWaistChange?.(prevWaist);
      },
      redo: () => {
        loadPreset(presetId);
      }
    });

    setActivePresetId(presetId);
    setRailLengthMm(preset.zMaxMm);
    setDraftRailLength(preset.zMaxMm.toString());
    setElements(preset.elements.map(e => ({ ...e })));
    setSelectedElemId(null);
    const newCaliperZ = Math.round(preset.zMaxMm * 0.75);
    setCaliperZMm(newCaliperZ);
    setDraftCaliperZ(newCaliperZ.toFixed(1));
    setDraftInitialWaist(preset.initialWaistUm.toString());
    if (onInitialWaistChange) {
      onInitialWaistChange(preset.initialWaistUm);
    }
  };

  // Build SVG polygon path for Gaussian beam envelope
  const beamEnvelopePath = useMemo(() => {
    if (simulation.samples.length < 2) return '';

    const topPoints: string[] = [];
    const bottomPoints: string[] = [];

    for (const pt of simulation.samples) {
      const x = zToSvgX(pt.zMm);
      const dy = radiusToSvgY(pt.wUm);
      topPoints.push(`${x.toFixed(1)},${(axisY - dy).toFixed(1)}`);
      bottomPoints.push(`${x.toFixed(1)},${(axisY + dy).toFixed(1)}`);
    }

    bottomPoints.reverse();
    return `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
  }, [simulation.samples, zToSvgX, radiusToSvgY, axisY]);

  // Optical rail grid ticks (every 50mm major, 10mm minor)
  const railTicks = useMemo(() => {
    const ticks: Array<{ zMm: number; isMajor: boolean }> = [];
    const step = 10;
    for (let z = 0; z <= railLengthMm; z += step) {
      ticks.push({ zMm: z, isMajor: z % 50 === 0 });
    }
    return ticks;
  }, [railLengthMm]);

  // Sort rendered elements so the selected element is drawn last (on top of overlapping elements)
  const renderedElements = useMemo(() => {
    return [...elements].sort((a, b) => {
      if (a.id === selectedElemId) return 1;
      if (b.id === selectedElemId) return -1;
      return a.positionZMm - b.positionZMm;
    });
  }, [elements, selectedElemId]);

  // Filter only real physical waists within rail range
  const realWaists = useMemo(() => {
    return simulation.waists.filter(
      w => w.isReal && w.positionZMm >= 0 && w.positionZMm <= railLengthMm
    );
  }, [simulation.waists, railLengthMm]);

  const selectedElem = elements.find(e => e.id === selectedElemId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Top Controls: Preset selector & Rail length */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-sm)',
          padding: '12px 16px',
          backgroundColor: 'var(--color-bg-input)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border-subtle)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
            Optical Presets:
          </span>
          {OPTICAL_BENCH_PRESETS.map(preset => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadPreset(preset.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: isSelected ? '1.5px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                  boxShadow: isSelected ? '0 0 0 1px var(--color-laser), var(--shadow-sm)' : 'none',
                  backgroundColor: isSelected ? 'var(--color-laser-badge)' : 'var(--color-bg-base)',
                  color: isSelected ? 'var(--color-laser)' : 'var(--color-text-primary)',
                  fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                  fontSize: 'var(--font-size-xs)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {onInitialWaistChange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label
                htmlFor="initial-waist-input"
                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}
                title="Standard Gaussian beam waist radius w₀ defined at 1/e² intensity (equivalently 1/e electric field amplitude)"
              >
                Initial w₀ (1/e²):
              </label>
              <input
                id="initial-waist-input"
                type="text"
                inputMode="decimal"
                value={draftInitialWaist}
                onFocus={() => {
                  setIsWaistFocused(true);
                  focusWaistRef.current = initialWaistUm;
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  handleNumberStepperKeyDown(e, newVal => {
                    setDraftInitialWaist(newVal);
                    const val = parseFloat(newVal);
                    if (!isNaN(val) && val > 0) {
                      setActivePresetId(null);
                      onInitialWaistChange(val);
                    }
                  });
                }}
                onChange={e => {
                  const raw = e.target.value;
                  setDraftInitialWaist(raw);
                  const val = parseFloat(raw);
                  if (!isNaN(val) && val > 0) {
                    setActivePresetId(null);
                    onInitialWaistChange(val);
                  }
                }}
                onBlur={() => {
                  setIsWaistFocused(false);
                  const val = parseFloat(draftInitialWaist);
                  if (isNaN(val) || val <= 0) {
                    setDraftInitialWaist(initialWaistUm.toString());
                  } else {
                    setDraftInitialWaist(val.toString());
                    const prev = focusWaistRef.current;
                    if (Math.abs(prev - val) > 1e-4) {
                      recordAction({
                        description: `Initial Waist w₀ to ${val} µm`,
                        category: 'laser',
                        targetTab: 'laser',
                        undo: () => {
                          onInitialWaistChange(prev);
                          setDraftInitialWaist(prev.toString());
                        },
                        redo: () => {
                          onInitialWaistChange(val);
                          setDraftInitialWaist(val.toString());
                        }
                      });
                      focusWaistRef.current = val;
                    }
                    onInitialWaistChange(val);
                  }
                }}
                aria-label="Initial Waist Radius w0 in um"
                className="font-mono"
                style={{
                  width: '75px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--color-bg-base)',
                  border: isWaistFocused ? '1px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-primary)',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>µm</span>

              {/* Waist Convention Toggle Pill */}
              <button
                type="button"
                onClick={() => setShowWaistConvention(prev => !prev)}
                title="Toggle Gaussian 1/e² vs 1/e waist convention & spot size equivalents"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 7px',
                  backgroundColor: showWaistConvention ? 'var(--color-laser-badge)' : 'var(--color-bg-base)',
                  border: showWaistConvention ? '1px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '11px',
                  color: showWaistConvention ? 'var(--color-laser)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Info size={12} />
                <span>1/e² vs 1/e Guide</span>
              </button>
            </div>
          )}

          {onWavelengthChange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label
                htmlFor="wavelength-bench-input"
                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}
              >
                λ:
              </label>
              <input
                id="wavelength-bench-input"
                type="text"
                inputMode="decimal"
                value={draftWavelength}
                onFocus={() => {
                  setIsWavelengthFocused(true);
                  focusWavelengthRef.current = wavelengthNm;
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  handleNumberStepperKeyDown(e, newVal => {
                    setDraftWavelength(newVal);
                    const val = parseFloat(newVal);
                    if (!isNaN(val) && val > 0) {
                      onWavelengthChange(val);
                    }
                  });
                }}
                onChange={e => {
                  const raw = e.target.value;
                  setDraftWavelength(raw);
                  const val = parseFloat(raw);
                  if (!isNaN(val) && val > 0) {
                    onWavelengthChange(val);
                  }
                }}
                onBlur={() => {
                  setIsWavelengthFocused(false);
                  const val = parseFloat(draftWavelength);
                  if (isNaN(val) || val <= 0) {
                    setDraftWavelength(wavelengthNm.toString());
                  } else {
                    setDraftWavelength(val.toString());
                    const prev = focusWavelengthRef.current;
                    if (Math.abs(prev - val) > 1e-4) {
                      recordAction({
                        description: `Laser Wavelength to ${val} nm`,
                        category: 'laser',
                        targetTab: 'laser',
                        undo: () => {
                          onWavelengthChange(prev);
                          setDraftWavelength(prev.toString());
                        },
                        redo: () => {
                          onWavelengthChange(val);
                          setDraftWavelength(val.toString());
                        }
                      });
                      focusWavelengthRef.current = val;
                    }
                    onWavelengthChange(val);
                  }
                }}
                aria-label="Wavelength in nm"
                className="font-mono"
                style={{
                  width: '75px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--color-bg-base)',
                  border: isWavelengthFocused ? '1px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-primary)',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>nm</span>
            </div>
          )}

          {/* Total Beam Power Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label
              htmlFor="bench-power-input"
              style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}
            >
              Power:
            </label>
            <input
              id="bench-power-input"
              type="text"
              inputMode="decimal"
              value={draftPower}
              onFocus={() => setIsPowerFocused(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
                handleNumberStepperKeyDown(e, newVal => {
                  setDraftPower(newVal);
                  const val = parseFloat(newVal);
                  if (!isNaN(val) && val > 0) {
                    handlePowerValueChange(val);
                  }
                });
              }}
              onChange={e => {
                const raw = e.target.value;
                setDraftPower(raw);
                const val = parseFloat(raw);
                if (!isNaN(val) && val > 0) {
                  handlePowerValueChange(val);
                }
              }}
              onBlur={() => {
                setIsPowerFocused(false);
                const val = parseFloat(draftPower);
                if (isNaN(val) || val <= 0) {
                  setDraftPower(currentPowerVal.toString());
                } else {
                  setDraftPower(val.toString());
                  handlePowerValueChange(val);
                }
              }}
              aria-label="Laser Beam Power"
              className="font-mono"
              style={{
                width: '70px',
                padding: '4px 8px',
                backgroundColor: 'var(--color-bg-base)',
                border: isPowerFocused ? '1px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xs)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            />
            <select
              value={currentPowerUnit}
              onChange={e => handlePowerUnitChange(e.target.value as 'mW' | 'W' | 'uW')}
              aria-label="Laser Beam Power Unit"
              className="font-mono"
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-base)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '4px 6px',
                cursor: 'pointer'
              }}
            >
              <option value="mW" style={{ backgroundColor: '#131B2E', color: '#F8FAFC' }}>mW</option>
              <option value="W" style={{ backgroundColor: '#131B2E', color: '#F8FAFC' }}>W</option>
              <option value="uW" style={{ backgroundColor: '#131B2E', color: '#F8FAFC' }}>µW</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label
              htmlFor="bench-length-input"
              style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}
            >
              Bench Length:
            </label>
            <input
              id="bench-length-input"
              type="text"
              inputMode="decimal"
              value={draftRailLength}
              onFocus={() => {
                setIsRailFocused(true);
                focusRailRef.current = railLengthMm;
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
                handleNumberStepperKeyDown(e, newVal => {
                  setDraftRailLength(newVal);
                  const val = parseFloat(newVal);
                  if (!isNaN(val) && val >= 50) {
                    setActivePresetId(null);
                    setRailLengthMm(val);
                  }
                });
              }}
              onChange={e => {
                const raw = e.target.value;
                setDraftRailLength(raw);
                const val = parseFloat(raw);
                if (!isNaN(val) && val >= 50) {
                  setActivePresetId(null);
                  setRailLengthMm(val);
                }
              }}
              onBlur={() => {
                setIsRailFocused(false);
                const val = parseFloat(draftRailLength);
                if (isNaN(val) || val < 50) {
                  setDraftRailLength(railLengthMm.toString());
                } else {
                  const rounded = Math.round(val);
                  setDraftRailLength(rounded.toString());
                  const prev = focusRailRef.current;
                  if (prev !== rounded) {
                    recordAction({
                      description: `Bench Length to ${rounded} mm`,
                      category: 'laser',
                      targetTab: 'laser',
                      undo: () => {
                        setRailLengthMm(prev);
                        setDraftRailLength(prev.toString());
                      },
                      redo: () => {
                        setRailLengthMm(rounded);
                        setDraftRailLength(rounded.toString());
                      }
                    });
                    focusRailRef.current = rounded;
                  }
                  setActivePresetId(null);
                  setRailLengthMm(rounded);
                }
              }}
              aria-label="Bench Length in mm"
              className="font-mono"
              style={{
                width: '75px',
                padding: '4px 8px',
                backgroundColor: 'var(--color-bg-base)',
                border: isRailFocused ? '1px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xs)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>mm</span>
          </div>
        </div>
      </div>

      {/* Gaussian 1/e² vs 1/e Waist Convention & Live Equivalency Guide */}
      {showWaistConvention && (
        <div
          role="region"
          aria-label="Gaussian beam waist convention explanation"
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--color-bg-surface-elevated)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'fadeIn 150ms ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                Gaussian Beam Waist Convention Guide: 1/e² Intensity vs 1/e Field
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--color-laser-badge)',
                  color: 'var(--color-laser)',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                Standard 1/e² Active
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowWaistConvention(false)}
              aria-label="Close waist convention guide"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 6px'
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
            This simulator defines <strong style={{ color: 'var(--color-text-primary)' }}>w₀ as the standard 1/e² intensity beam waist radius</strong> (the universal convention in AMO physics, ABCD propagation, and optical design).
            At distance <span className="font-mono">r = w₀</span> from the propagation axis, optical intensity drops to{' '}
            <span className="font-mono" style={{ color: 'var(--color-laser)', fontWeight: 'bold' }}>I(w₀) = I₀ / e² ≈ 13.53% · I₀</span>.
            Because intensity scales as field squared (<span className="font-mono">I ∝ |E|²</span>), this corresponds identically to the radius where the electric field amplitude drops to{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>1/e ≈ 36.79% · E₀</strong>.
          </p>

          {/* Dynamic Equivalents for Current Waist */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>1/e² Intensity Radius w₀ (Input)</div>
              <div className="font-mono" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-laser)', fontWeight: 'bold' }}>
                {initialWaistUm.toFixed(2)} µm
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>= 1/e Electric Field Radius</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>1/e² Intensity Diameter 2w₀</div>
              <div className="font-mono" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                {(initialWaistUm * 2).toFixed(2)} µm
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Full beam spot width</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>FWHM Diameter (50% Intensity)</div>
              <div className="font-mono" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                {(initialWaistUm * Math.sqrt(2 * Math.LN2)).toFixed(2)} µm
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>√(2·ln 2) · w₀ ≈ 1.1774 · w₀</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>1/e Intensity Radius</div>
              <div className="font-mono" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                {(initialWaistUm / Math.SQRT2).toFixed(2)} µm
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>w₀ / √2 ≈ 0.7071 · w₀</div>
            </div>
          </div>
        </div>
      )}

      {/* Diffraction Limit Warning Alert Banner */}
      {isBelowDiffractionLimit && !isDiffractionDismissed && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px 14px',
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-xs)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', flexShrink: 0 }} aria-hidden="true">⚠️</span>
            <div>
              <strong>Diffraction Limit:</strong> The entered waist radius w₀ is below the paraxial diffraction limit (λ/π ≈{' '}
              <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--color-warning)' }}>
                {diffractionLimitUm < 0.01 ? diffractionLimitUm.toExponential(2) : diffractionLimitUm.toFixed(3)} µm
              </span>
              ). In free-space propagating beams, focal spots cannot be tighter than this limit.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDiffractionDismissed(true)}
            aria-label="Dismiss diffraction limit warning"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              flexShrink: 0,
              transition: 'color 0.15s ease'
            }}
            title="Dismiss warning"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main SVG Optical Bench Canvas */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--color-bg-base)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
          overflow: 'hidden',
          padding: '12px 8px 8px 8px'
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            userSelect: 'none',
            touchAction: 'none'
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            {/* Shaded Gaussian Beam Gradient */}
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-laser)" stopOpacity="0.05" />
              <stop offset="50%" stopColor="var(--color-laser)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--color-laser)" stopOpacity="0.05" />
            </linearGradient>

            <pattern id="railHatch" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="var(--color-border-subtle)" strokeWidth="0.8" />
            </pattern>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Calibrated Vertical Y-Axis (Beam Radius w) */}
          <g>
            {/* Vertical axis line at x = paddingLeft */}
            <line
              x1={paddingLeft}
              y1={axisY - beamMaxHeight}
              x2={paddingLeft}
              y2={axisY + beamMaxHeight}
              stroke="var(--color-text-muted)"
              strokeWidth="1.2"
            />

            {/* Y-Axis Title */}
            <text
              x={paddingLeft - 8}
              y={axisY - beamMaxHeight - 8}
              fill="var(--color-text-secondary)"
              fontSize="9.5"
              fontFamily="var(--font-mono)"
              fontWeight="bold"
              textAnchor="end"
            >
              w ({yUnit})
            </text>

            {/* Y-Axis Ticks & Horizontal Grid Guides */}
            {yAxisTicks.map((tick, idx) => (
              <g key={`ytick-${idx}`}>
                {/* Horizontal grid guide line (excluding axisY which is the optical axis) */}
                {tick.y !== axisY && (
                  <line
                    x1={paddingLeft}
                    y1={tick.y}
                    x2={paddingLeft + railLengthSvg}
                    y2={tick.y}
                    stroke="var(--color-border-subtle)"
                    strokeDasharray="3 3"
                    opacity="0.2"
                  />
                )}
                {/* Tick mark extending to left */}
                <line
                  x1={paddingLeft - (tick.isMajor ? 6 : 4)}
                  y1={tick.y}
                  x2={paddingLeft}
                  y2={tick.y}
                  stroke="var(--color-text-muted)"
                  strokeWidth={tick.isMajor ? '1.2' : '0.8'}
                />
                {/* Tick label */}
                <text
                  x={paddingLeft - 8}
                  y={tick.y}
                  fill="var(--color-text-muted)"
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                  textAnchor="end"
                  dominantBaseline="central"
                >
                  {tick.label}
                </text>
              </g>
            ))}
          </g>

          {/* Optical Axis Line */}
          <line
            x1={paddingLeft - 20}
            y1={axisY}
            x2={paddingLeft + railLengthSvg + 20}
            y2={axisY}
            stroke="var(--color-text-muted)"
            strokeWidth="1.2"
            strokeDasharray="6 4"
            opacity="0.4"
          />

          {/* Shaded Gaussian Beam Envelope */}
          {beamEnvelopePath && (
            <path
              d={beamEnvelopePath}
              fill="url(#beamGradient)"
              stroke="var(--color-laser)"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />
          )}

          {/* Calibrated Millimetric Optical Rail at bottom */}
          <g transform="translate(0, 305)">
            {/* Rail bar */}
            <rect
              x={paddingLeft - 10}
              y={0}
              width={railLengthSvg + 20}
              height={14}
              fill="var(--color-bg-surface-elevated)"
              stroke="var(--color-border-subtle)"
              strokeWidth="1"
              rx="2"
            />

            {/* Scale Ticks */}
            {railTicks.map(tick => {
              const x = zToSvgX(tick.zMm);
              const tickH = tick.isMajor ? 8 : 4;
              return (
                <g key={tick.zMm}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={tickH}
                    stroke="var(--color-text-muted)"
                    strokeWidth={tick.isMajor ? '1.2' : '0.6'}
                  />
                  {tick.isMajor && (
                    <text
                      x={x}
                      y={24}
                      fill="var(--color-text-muted)"
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      textAnchor="middle"
                    >
                      {tick.zMm}
                    </text>
                  )}
                </g>
              );
            })}
            <text
              x={paddingLeft - 20}
              y={10}
              fill="var(--color-text-muted)"
              fontSize="9"
              fontFamily="var(--font-mono)"
              textAnchor="end"
            >
              z (mm)
            </text>
          </g>

          {/* Secondary Waists Badges (Real physical waists only) */}
          {realWaists.map((waist, idx) => {
            const x = zToSvgX(waist.positionZMm);
            if (x < paddingLeft || x > paddingLeft + railLengthSvg) return null;

            return (
              <g
                key={`waist-${idx}`}
                transform={`translate(${x}, ${axisY})`}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setCaliperZMm(waist.positionZMm);
                  setDraftCaliperZ(waist.positionZMm.toFixed(1));
                }}
              >
                {/* Waist vertical dashed indicator */}
                <line
                  x1={0}
                  y1={-radiusToSvgY(waist.waistRadiusUm) - 15}
                  x2={0}
                  y2={radiusToSvgY(waist.waistRadiusUm) + 15}
                  stroke="var(--color-laser)"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  opacity="0.8"
                />
                <circle cx={0} cy={0} r="3" fill="var(--color-laser)" />

                {/* Waist Badge */}
                <g transform="translate(0, -95)">
                  <rect
                    x="-42"
                    y="-12"
                    width="84"
                    height="20"
                    rx="10"
                    fill="var(--color-bg-base)"
                    stroke="var(--color-laser)"
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="0"
                    fill="var(--color-text-primary)"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    w₀ = {waist.waistRadiusUm.toFixed(1)} µm
                  </text>
                </g>
              </g>
            );
          })}

          {/* Optical Elements Along the Bench (rendered in z-index order) */}
          {renderedElements.map(elem => {
            const x = zToSvgX(elem.positionZMm);
            const isSelected = elem.id === selectedElemId;
            const isEnabled = elem.enabled !== false;
            const thickWidth = elem.type === 'thick-lens'
              ? Math.max(12, ((elem.thicknessMm || 4.5) / railLengthMm) * railLengthSvg)
              : 0;
            const centerOffset = elem.type === 'thick-lens' ? thickWidth / 2 : 0;

            return (
              <g
                key={elem.id}
                transform={`translate(${x}, 0)`}
                style={{ cursor: 'ew-resize' }}
                onPointerDown={e => handlePointerDown(e, 'element', elem.id)}
                onClick={() => setSelectedElemId(elem.id)}
              >
                {/* Generous touch hitbox for effortless mobile and desktop sliding */}
                <rect
                  x={-20}
                  y={25}
                  width={Math.max(44, thickWidth + 24)}
                  height={295}
                  fill="transparent"
                  style={{ pointerEvents: 'all' }}
                />

                {/* Element rail mount glyph */}
                <rect
                  x={centerOffset - 8}
                  y="295"
                  width="16"
                  height="22"
                  rx="3"
                  fill={isSelected ? 'var(--color-laser)' : 'var(--color-bg-surface)'}
                  stroke="var(--color-border-strong)"
                  strokeWidth="1.5"
                />
                <circle cx={centerOffset} cy="306" r="3" fill={isSelected ? '#FFFFFF' : 'var(--color-text-muted)'} />

                {/* Vertical Optical Element Graphic */}
                {elem.type === 'thin-lens' && (
                  <g opacity={isEnabled ? 1 : 0.4}>
                    {(elem.focalLengthMm || 100) >= 0 ? (
                      /* Slender biconvex shape (f > 0, focusing) */
                      <g>
                        <path
                          d={`M -3,${axisY - 115} L 3,${axisY - 115} Q 9,${axisY} 3,${axisY + 115} L -3,${axisY + 115} Q -9,${axisY} -3,${axisY - 115} Z`}
                          fill="var(--color-optical-badge)"
                          stroke={isSelected ? 'var(--color-laser)' : 'var(--color-optical)'}
                          strokeWidth="1.8"
                        />
                        {/* Optical center indicator dot */}
                        <circle cx="0" cy={axisY} r="2" fill={isSelected ? 'var(--color-laser)' : 'var(--color-optical)'} opacity="0.6" />
                      </g>
                    ) : (
                      /* Slender biconcave shape (f < 0, diverging) */
                      <g>
                        <path
                          d={`M -8,${axisY - 115} L 8,${axisY - 115} Q 2,${axisY} 8,${axisY + 115} L -8,${axisY + 115} Q -2,${axisY} -8,${axisY - 115} Z`}
                          fill="var(--color-optical-badge)"
                          stroke={isSelected ? 'var(--color-laser)' : 'var(--color-optical)'}
                          strokeWidth="1.8"
                        />
                        {/* Optical center indicator dot */}
                        <circle cx="0" cy={axisY} r="2" fill={isSelected ? 'var(--color-laser)' : 'var(--color-optical)'} opacity="0.6" />
                      </g>
                    )}
                  </g>
                )}

                {elem.type === 'thick-lens' && (
                  <g opacity={isEnabled ? 1 : 0.4}>
                    {/* Thick glass slab with accurate physical width on rail scale */}
                    <rect
                      x="0"
                      y={axisY - 115}
                      width={thickWidth}
                      height="230"
                      rx="4"
                      fill="var(--color-optical-glow)"
                      stroke={isSelected ? 'var(--color-laser)' : 'var(--color-optical)'}
                      strokeWidth="2"
                    />
                    <line x1="0" y1={axisY - 115} x2="0" y2={axisY + 115} stroke="var(--color-optical)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={thickWidth} y1={axisY - 115} x2={thickWidth} y2={axisY + 115} stroke="var(--color-optical)" strokeWidth="1" strokeDasharray="3 3" />
                  </g>
                )}

                {/* Element Label Pill */}
                <g transform={`translate(${centerOffset}, 35)`}>
                  <rect
                    x="-45"
                    y="-11"
                    width="90"
                    height="20"
                    rx="4"
                    fill="var(--color-bg-surface-elevated)"
                    stroke={isSelected ? 'var(--color-laser)' : 'var(--color-border-subtle)'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="0"
                    fill={isSelected ? 'var(--color-laser)' : 'var(--color-text-primary)'}
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    fontWeight="medium"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {elem.type === 'thin-lens' ? `f=${elem.focalLengthMm}mm` : `d=${elem.thicknessMm}mm`}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Draggable Virtual Beam Caliper / Profiler */}
          <g
            transform={`translate(${zToSvgX(caliperZMm)}, 0)`}
            style={{ cursor: 'ew-resize' }}
            onPointerDown={e => handlePointerDown(e, 'caliper')}
          >
            {/* Generous touch hitbox for Caliper */}
            <rect
              x="-24"
              y="30"
              width="48"
              height="280"
              fill="transparent"
              style={{ pointerEvents: 'all' }}
            />

            {/* Caliper Solid Vertical Line Spanning Bench */}
            <line
              x1="0"
              y1="36"
              x2="0"
              y2="305"
              stroke="var(--color-warning)"
              strokeWidth="2"
            />

            {/* Caliper Top Grab Handle */}
            <g transform="translate(0, 36)">
              <rect
                x="-36"
                y="-12"
                width="72"
                height="22"
                rx="11"
                fill="var(--color-warning)"
                stroke="var(--color-bg-base)"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="0"
                fill="#000000"
                fontSize="9.5"
                fontFamily="var(--font-mono)"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
              >
                z = {caliperZMm.toFixed(1)}
              </text>
            </g>

            {/* Caliper Bottom Grab Handle */}
            <g transform="translate(0, 305)">
              <polygon
                points="-6,8 6,8 0,-2"
                fill="var(--color-warning)"
                stroke="var(--color-bg-base)"
                strokeWidth="1"
              />
              <circle cx="0" cy="11" r="3.5" fill="var(--color-warning)" />
            </g>
          </g>
        </svg>

        {/* Floating Live Caliper Readout Bar */}
        {caliperData && (
          <div
            className="caliper-readout-bar"
            style={{
              marginTop: '10px',
              padding: '8px 14px',
              backgroundColor: 'var(--color-bg-surface-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            {/* 1. Caliper Position Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <Crosshair size={15} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <label
                  htmlFor="caliper-position-input"
                  style={{
                    fontSize: 'var(--font-size-2xs)',
                    color: 'var(--color-text-muted)',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title="Caliper Position z"
                >
                  Caliper Position z
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                  <input
                    id="caliper-position-input"
                    type="text"
                    inputMode="decimal"
                    value={draftCaliperZ}
                    onFocus={() => setIsCaliperFocused(true)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftCaliperZ(newVal);
                        const val = parseFloat(newVal);
                        if (!isNaN(val)) {
                          const clamped = Math.max(0, Math.min(railLengthMm, val));
                          setCaliperZMm(clamped);
                        }
                      });
                    }}
                    onChange={e => {
                      const raw = e.target.value;
                      setDraftCaliperZ(raw);
                      const val = parseFloat(raw);
                      if (!isNaN(val)) {
                        const clamped = Math.max(0, Math.min(railLengthMm, val));
                        setCaliperZMm(clamped);
                      }
                    }}
                    onBlur={() => {
                      setIsCaliperFocused(false);
                      const val = parseFloat(draftCaliperZ);
                      if (isNaN(val)) {
                        setDraftCaliperZ(caliperZMm.toFixed(1));
                      } else {
                        const clamped = Math.max(0, Math.min(railLengthMm, Math.round(val * 10) / 10));
                        setCaliperZMm(clamped);
                        setDraftCaliperZ(clamped.toFixed(1));
                      }
                    }}
                    aria-label="Caliper Position z in mm"
                    className="font-mono"
                    style={{
                      width: '58px',
                      padding: '2px 5px',
                      backgroundColor: 'var(--color-bg-base)',
                      border: isCaliperFocused ? '1px solid var(--color-warning)' : '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'bold',
                      color: 'var(--color-warning)',
                      outline: 'none',
                      textAlign: 'right'
                    }}
                  />
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                    mm
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Beam Radius w(z) */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-2xs)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title="Beam Radius w(z) at 1/e² intensity (1/e field amplitude)"
              >
                Beam Radius w(z) (1/e²)
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'bold',
                  color: 'var(--color-laser)',
                  whiteSpace: 'nowrap'
                }}
              >
                {caliperData.wUm.toFixed(2)} µm
              </div>
            </div>

            {/* 3. Wavefront Curvature R(z) */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-2xs)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title="Wavefront Curvature R(z)"
              >
                Curvature R(z)
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'bold',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap'
                }}
              >
                {isFinite(caliperData.radiusCurvatureMm)
                  ? `${caliperData.radiusCurvatureMm.toFixed(1)} mm`
                  : '∞ (Waist)'}
              </div>
            </div>

            {/* 5. Rayleigh Range z_R */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-2xs)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title="Rayleigh Range z_R"
              >
                Rayleigh Range z_R
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'bold',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap'
                }}
              >
                {caliperData.rayleighRangeMm.toFixed(2)} mm
              </div>
            </div>

            {/* 6. Peak Intensity I₀(z) */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-2xs)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title="Peak Intensity I₀(z)"
              >
                Peak Intensity I₀(z)
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'bold',
                  color: 'var(--color-laser)',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatSignificantDigits(caliperData.peakIntensityWPerCm2, 4)} W/cm²
              </div>
            </div>

            {/* 7. Avg Intensity I_avg(z) */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-2xs)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title="Average Intensity I_avg(z)"
              >
                Avg Intensity I_avg(z)
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'bold',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatSignificantDigits(caliperData.avgIntensityWPerCm2, 4)} W/cm²
              </div>
            </div>

            {/* 8. Peak E-Field E₀(z) */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-2xs)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title="Peak Electric Field E₀(z)"
              >
                Peak E-Field E₀(z)
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'bold',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatSignificantDigits(caliperData.electricFieldVPerM, 4)} V/m
              </div>
            </div>
          </div>
        )}

        {/* Identified Beam Waists Catalog */}
        <div
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg-surface-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} style={{ color: 'var(--color-laser)' }} />
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                Identified Beam Waists ({1 + subsequentWaists.length})
              </span>
            </div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
              Analytical spot sizes, intensities, and electric field amplitudes at optical waist minima (1/e² intensity / 1/e field convention)
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-xs)',
                textAlign: 'left'
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '6px 8px' }}>Waist Name</th>
                  <th style={{ padding: '6px 8px' }}>Position z</th>
                  <th style={{ padding: '6px 8px' }}>Waist w₀ (1/e²)</th>
                  <th style={{ padding: '6px 8px' }}>Rayleigh z_R</th>
                  <th style={{ padding: '6px 8px' }}>Peak Intensity I₀</th>
                  <th style={{ padding: '6px 8px' }}>Avg Intensity I_avg</th>
                  <th style={{ padding: '6px 8px' }}>Peak E-Field E₀</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Initial Launch Waist at z = 0 */}
                <tr
                  style={{
                    borderBottom: '1px solid var(--color-border-subtle)',
                    backgroundColor: Math.abs(caliperZMm - 0) < 0.2 ? 'var(--color-laser-glow)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                    Initial Waist (Launch)
                  </td>
                  <td className="font-mono" style={{ padding: '8px', color: 'var(--color-warning)' }}>
                    0.0 mm
                  </td>
                  <td className="font-mono" style={{ padding: '8px', color: 'var(--color-laser)', fontWeight: 'bold' }}>
                    {initialWaistMetrics.waistRadiusUm.toFixed(2)} µm
                  </td>
                  <td className="font-mono" style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                    {initialWaistMetrics.rayleighRangeMm.toFixed(2)} mm
                  </td>
                  <td className="font-mono" style={{ padding: '8px', color: 'var(--color-laser)' }}>
                    {formatSignificantDigits(initialWaistMetrics.peakIntensityWPerCm2, 4)} W/cm²
                  </td>
                  <td className="font-mono" style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                    {formatSignificantDigits(initialWaistMetrics.avgIntensityWPerCm2, 4)} W/cm²
                  </td>
                  <td className="font-mono" style={{ padding: '8px', color: 'var(--color-text-primary)' }}>
                    {formatSignificantDigits(initialWaistMetrics.electricFieldVPerM, 4)} V/m
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Crosshair size={13} />}
                      onClick={() => {
                        setCaliperZMm(0);
                        setDraftCaliperZ('0.0');
                      }}
                      title="Jump virtual caliper profiler to z = 0 mm"
                    >
                      Jump Caliper
                    </Button>
                  </td>
                </tr>

                {/* Subsequent simulation-identified waists */}
                {subsequentWaists.map((w) => {
                  const isCurrentCaliperAtWaist = Math.abs(caliperZMm - w.positionZMm) < 0.5;
                  return (
                    <tr
                      key={w.id}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        backgroundColor: isCurrentCaliperAtWaist ? 'var(--color-laser-glow)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                        {w.label}
                      </td>
                      <td className="font-mono" style={{ padding: '8px', color: 'var(--color-warning)' }}>
                        {w.positionZMm.toFixed(1)} mm
                      </td>
                      <td className="font-mono" style={{ padding: '8px', color: 'var(--color-laser)', fontWeight: 'bold' }}>
                        {w.waistRadiusUm.toFixed(2)} µm
                      </td>
                      <td className="font-mono" style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                        {w.rayleighRangeMm.toFixed(2)} mm
                      </td>
                      <td className="font-mono" style={{ padding: '8px', color: 'var(--color-laser)' }}>
                        {formatSignificantDigits(w.peakIntensityWPerCm2, 4)} W/cm²
                      </td>
                      <td className="font-mono" style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>
                        {formatSignificantDigits(w.avgIntensityWPerCm2, 4)} W/cm²
                      </td>
                      <td className="font-mono" style={{ padding: '8px', color: 'var(--color-text-primary)' }}>
                        {formatSignificantDigits(w.electricFieldVPerM, 4)} V/m
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Crosshair size={13} />}
                          onClick={() => {
                            setCaliperZMm(w.positionZMm);
                            setDraftCaliperZ(w.positionZMm.toFixed(1));
                          }}
                          title={`Jump virtual caliper profiler to z = ${w.positionZMm.toFixed(1)} mm`}
                        >
                          Jump Caliper
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {subsequentWaists.length === 0 && (
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
              No subsequent internal focal waists detected along the optical train (beam is currently expanding or collimated). Add a converging lens to form an internal focus.
            </div>
          )}
        </div>
      </div>

      {/* Optical Bench Element Management Tray */}
      <div
        style={{
          padding: '14px',
          backgroundColor: 'var(--color-bg-input)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--color-laser)' }} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
              Optical Elements on Bench ({elements.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={addThinLens}>
              + Thin Lens
            </Button>
            <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={addThickLens}>
              + Thick Lens
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<RotateCcw size={14} />}
              onClick={() => {
                const prev = elements;
                recordAction({
                  description: 'Clear Optical Bench',
                  category: 'laser',
                  targetTab: 'laser',
                  undo: () => setElements(prev),
                  redo: () => {
                    setActivePresetId(null);
                    setElements([]);
                    setSelectedElemId(null);
                  }
                });
                setActivePresetId(null);
                setElements([]);
                setSelectedElemId(null);
              }}
            >
              Clear Bench
            </Button>
          </div>
        </div>

        {/* Elements List */}
        {elements.length === 0 ? (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
            No optical elements on the rail. Beam propagates in free space from z = 0 mm. Add lenses above or load a preset.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '10px'
            }}
          >
            {elements.map(elem => {
              const isSelected = elem.id === selectedElemId;
              const isEnabled = elem.enabled !== false;

              return (
                <div
                  key={elem.id}
                  onClick={() => setSelectedElemId(elem.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1.5px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                    backgroundColor: isSelected ? 'var(--color-bg-surface-elevated)' : 'var(--color-bg-base)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                      {elem.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleElement(elem.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isEnabled ? 'var(--color-success)' : 'var(--color-text-muted)',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                        title={isEnabled ? 'Disable element' : 'Enable element'}
                      >
                        {isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          removeElement(elem.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                        title="Delete element"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    <span>Position: z = {elem.positionZMm.toFixed(1)} mm</span>
                    <span>
                      {elem.type === 'thin-lens' ? `f = ${elem.focalLengthMm} mm` : `d = ${elem.thicknessMm} mm, n = ${elem.refractiveIndex}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Element Parameter Editor */}
        {selectedElem && (
          <div
            style={{
              marginTop: '8px',
              padding: '14px',
              backgroundColor: 'var(--color-bg-surface-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-laser)' }}>
                Editing: {selectedElem.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedElemId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-xs)',
                  cursor: 'pointer'
                }}
              >
                Close Editor ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-sm)'
              }}
            >
              <SyncedInput
                id="edit-pos-z"
                label="Position on Rail"
                symbol="z"
                value={selectedElem.positionZMm}
                unit="mm"
                category="laser"
                onChange={v => {
                  const val = parseFloat(v);
                  if (!isNaN(val)) {
                    setActivePresetId(null);
                    setElements(prev =>
                      prev.map(e => (e.id === selectedElem.id ? { ...e, positionZMm: val } : e))
                    );
                  }
                }}
              />

              {selectedElem.type === 'thin-lens' && (
                <SyncedInput
                  id="edit-focal-length"
                  label="Focal Length"
                  symbol="f"
                  value={selectedElem.focalLengthMm ?? 100}
                  unit="mm"
                  category="laser"
                  onChange={v => {
                    const val = parseFloat(v);
                    if (!isNaN(val)) {
                      setActivePresetId(null);
                      setElements(prev =>
                        prev.map(e => (e.id === selectedElem.id ? { ...e, focalLengthMm: val } : e))
                      );
                    }
                  }}
                  description="+ converging, - diverging"
                />
              )}

              {selectedElem.type === 'thick-lens' && (
                <>
                  <SyncedInput
                    id="edit-r1"
                    label="Front Curvature R1"
                    symbol="R₁"
                    value={selectedElem.frontCurvatureR1Mm ?? 50}
                    unit="mm"
                    category="laser"
                    onChange={v => {
                      const val = parseFloat(v);
                      if (!isNaN(val)) {
                        setActivePresetId(null);
                        setElements(prev =>
                          prev.map(e => (e.id === selectedElem.id ? { ...e, frontCurvatureR1Mm: val } : e))
                        );
                      }
                    }}
                    description="+ convex towards incident beam"
                  />

                  <SyncedInput
                    id="edit-r2"
                    label="Back Curvature R2"
                    symbol="R₂"
                    value={selectedElem.backCurvatureR2Mm ?? -50}
                    unit="mm"
                    category="laser"
                    onChange={v => {
                      const val = parseFloat(v);
                      if (!isNaN(val)) {
                        setActivePresetId(null);
                        setElements(prev =>
                          prev.map(e => (e.id === selectedElem.id ? { ...e, backCurvatureR2Mm: val } : e))
                        );
                      }
                    }}
                    description="- for convex back surface (biconvex)"
                  />

                  <SyncedInput
                    id="edit-thickness"
                    label="Center Thickness"
                    symbol="d"
                    value={selectedElem.thicknessMm ?? 4.5}
                    unit="mm"
                    category="laser"
                    onChange={v => {
                      const val = parseFloat(v);
                      if (!isNaN(val) && val >= 0) {
                        setActivePresetId(null);
                        setElements(prev =>
                          prev.map(e => (e.id === selectedElem.id ? { ...e, thicknessMm: val } : e))
                        );
                      }
                    }}
                  />

                  <div>
                    <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Glass Presets (Index n):
                    </label>
                    <select
                      value={selectedElem.glassName || ''}
                      onChange={e => {
                        const preset = Object.values(GLASS_PRESETS).find(p => p.name === e.target.value);
                        if (preset) {
                          setActivePresetId(null);
                          setElements(prev =>
                            prev.map(el =>
                              el.id === selectedElem.id
                                ? { ...el, refractiveIndex: preset.n, glassName: preset.name }
                                : el
                            )
                          );
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-xs)'
                      }}
                    >
                      {Object.values(GLASS_PRESETS).map(g => (
                        <option key={g.name} value={g.name}>
                          {g.name} (n = {g.n})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
