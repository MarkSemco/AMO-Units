import React, { useState, useMemo } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { MathView } from '../../common/MathView';
import {
  JonesVector,
  PolarizationOptic,
  getPresetPolarization,
  propagatePolarization
} from '../../../core/polarization';
import { PolarizationInputConverter } from './PolarizationInputConverter';
import { PolarizationOpticalRail } from './PolarizationOpticalRail';
import { PolarizationEllipseVisualizer } from './PolarizationEllipseVisualizer';
import { PoincareSphereVisualizer } from './PoincareSphereVisualizer';
import { PolarizationConventionCard } from './PolarizationConventionCard';
import { RotateCcw, Activity, Zap } from 'lucide-react';
import { useUndoRedo } from '../../../context/UndoRedoContext';

export const PolarizationBench: React.FC = () => {
  const { recordAction } = useUndoRedo();

  // Input polarization state (defaults to |H⟩ at 1.0 mW for unit amplitude)
  const [initialJones, setInitialJones] = useState<JonesVector>(() =>
    getPresetPolarization('H', 1.0)
  );

  // Beamline optical setup (defaults to empty/clear beamline)
  const [optics, setOptics] = useState<PolarizationOptic[]>(() => []);

  // Selected stage for detailed inspection (0 = input, 1..N = after optic 1..N)
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);

  const handleInitialJonesCommit = (prevJ: JonesVector, nextJ: JonesVector) => {
    recordAction({
      description: 'Input Polarization State',
      category: 'laser',
      targetTab: 'laser',
      undo: () => setInitialJones(prevJ),
      redo: () => setInitialJones(nextJ)
    });
  };

  const handleOpticsCommit = (prevOptics: PolarizationOptic[], nextOptics: PolarizationOptic[], desc: string) => {
    recordAction({
      description: desc,
      category: 'laser',
      targetTab: 'laser',
      undo: () => setOptics(prevOptics),
      redo: () => setOptics(nextOptics)
    });
    setOptics(nextOptics);
    if (selectedStageIndex > nextOptics.length) {
      setSelectedStageIndex(nextOptics.length);
    }
  };

  // Propagate polarization through optical train
  const propagationResult = useMemo(() => {
    return propagatePolarization(initialJones, optics);
  }, [initialJones, optics]);

  // Ensure selectedStageIndex stays in range
  const safeStageIndex = Math.min(
    selectedStageIndex,
    propagationResult.stages.length - 1
  );
  const activeStage = propagationResult.stages[safeStageIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Bench Overview & Telemetry Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          padding: '12px 18px',
          backgroundColor: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-laser-badge)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-laser)'
            }}
          >
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
              Polarization & Waveplate Beamline
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Total Throughput:{' '}
              <span className="font-mono text-laser" style={{ fontWeight: 'bold' }}>
                {propagationResult.totalTransmissionPercent.toFixed(1)}%
              </span>{' '}
              · Final State:{' '}
              <span className="font-mono text-optical" style={{ fontWeight: 'bold' }}>
                {propagationResult.finalEllipse.description}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="sm"
            variant="ghost"
            category="laser"
            icon={<RotateCcw size={14} />}
            onClick={() => {
              const prevOptics = optics;
              const prevJones = initialJones;
              const defaultJ = getPresetPolarization('H', 1.0);
              recordAction({
                description: 'Clear Beamline Optics',
                category: 'laser',
                targetTab: 'laser',
                undo: () => {
                  setOptics(prevOptics);
                  setInitialJones(prevJones);
                },
                redo: () => {
                  setOptics([]);
                  setInitialJones(defaultJ);
                  setSelectedStageIndex(0);
                }
              });
              setInitialJones(defaultJ);
              setOptics([]);
              setSelectedStageIndex(0);
            }}
          >
            Clear Beamline
          </Button>
        </div>
      </div>

      {/* 1. 5-Way Input Polarization Converter */}
      <PolarizationInputConverter
        value={initialJones}
        onChange={setInitialJones}
        onCommit={handleInitialJonesCommit}
      />

      {/* 2. Interactive Optical Beamline Canvas & Manipulators */}
      <PolarizationOpticalRail
        optics={optics}
        onChangeOptics={setOptics}
        onCommitOptics={handleOpticsCommit}
        stages={propagationResult.stages}
        selectedStageIndex={safeStageIndex}
        onSelectStage={idx => setSelectedStageIndex(idx)}
      />

      {/* 3. Dual Visualizer Suite: Side-by-Side 2D E-Field Ellipse + 3D Poincaré Sphere */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-md)'
        }}
      >
        <PolarizationEllipseVisualizer
          stages={propagationResult.stages}
          selectedStageIndex={safeStageIndex}
          onSelectStage={idx => setSelectedStageIndex(idx)}
        />

        <PoincareSphereVisualizer
          stages={propagationResult.stages}
          selectedStageIndex={safeStageIndex}
          onSelectStage={idx => setSelectedStageIndex(idx)}
        />
      </div>

      {/* 4. Stage Telemetry & Matrix Diagnostics Card */}
      <Card
        title={safeStageIndex === 0 ? 'Stage 0 (Input) Diagnostics' : `Stage ${safeStageIndex} Diagnostics: ${activeStage.opticName || `Stage ${safeStageIndex}`}`}
        subtitle="State vectors, Stokes parameters, and Jones matrix representation."
        category="laser"
        icon={<Activity size={20} />}
        collapsible={true}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-md)',
            fontSize: 'var(--font-size-xs)'
          }}
        >
          {/* Jones Vector */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ color: 'var(--color-laser)', fontWeight: 'bold', marginBottom: '6px' }}>
              Jones Vector |J⟩
            </div>
            <div style={{ margin: '6px 0' }}>
              <MathView
                math={`\\mathbf{J} = \\begin{pmatrix} ${activeStage.jones.Ex.re.toFixed(3)} ${activeStage.jones.Ex.im >= 0 ? '+' : ''}${activeStage.jones.Ex.im.toFixed(3)}i \\\\ ${activeStage.jones.Ey.re.toFixed(3)} ${activeStage.jones.Ey.im >= 0 ? '+' : ''}${activeStage.jones.Ey.im.toFixed(3)}i \\end{pmatrix}`}
                displayMode={true}
              />
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>
              Norm |J|² = {activeStage.stokes.s0.toFixed(4)}
            </div>
          </div>

          {/* Stokes Parameters */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ color: 'var(--color-optical)', fontWeight: 'bold', marginBottom: '6px' }}>
              Normalized Stokes Vector
            </div>
            <div style={{ margin: '6px 0' }}>
              <MathView
                math={`\\vec{s} = \\begin{pmatrix} ${activeStage.normalizedStokes.s1.toFixed(3)} \\\\ ${activeStage.normalizedStokes.s2.toFixed(3)} \\\\ ${activeStage.normalizedStokes.s3.toFixed(3)} \\end{pmatrix}`}
                displayMode={true}
              />
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>
              Total Power S₀ = {activeStage.stokes.s0.toFixed(3)} mW ({activeStage.powerTransmissionPercent.toFixed(1)}%)
            </div>
          </div>

          {/* Ellipse Parameters */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ color: 'var(--color-magnetic)', fontWeight: 'bold', marginBottom: '6px' }}>
              Ellipse Geometry & Handedness
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              <div>Azimuth Angle ψ: <span className="font-mono text-laser">{activeStage.ellipse.psiDeg.toFixed(2)}°</span></div>
              <div>Ellipticity Angle χ: <span className="font-mono text-optical">{activeStage.ellipse.chiDeg.toFixed(2)}°</span></div>
              <div>Axial Ratio b/a: <span className="font-mono text-magnetic">{activeStage.ellipse.axialRatio.toFixed(3)}</span></div>
              <div>Handedness: <strong style={{ color: activeStage.ellipse.handedness === 'right' ? 'var(--color-laser)' : activeStage.ellipse.handedness === 'left' ? 'var(--color-optical)' : 'var(--color-text-primary)' }}>{activeStage.ellipse.description}</strong></div>
            </div>
          </div>
        </div>

        {/* If this stage is a Polarizing Beam Splitter (PBS), render Reflected Arm Readout */}
        {activeStage.pbsReflected && (
          <div
            style={{
              marginTop: 'var(--space-md)',
              padding: '12px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-error-prop)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-error-prop)' }}>
                PBS Reflected Port (s-polarization orthogonal arm)
              </span>
              <span className="font-mono" style={{ color: 'var(--color-error-prop)', fontWeight: 'bold' }}>
                Reflected Power: {activeStage.pbsReflected.stokes.s0.toFixed(3)} mW ({activeStage.pbsReflected.powerReflectionPercent.toFixed(1)}%)
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '8px',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              <div>
                State: <strong style={{ color: 'var(--color-text-primary)' }}>{activeStage.pbsReflected.ellipse.description}</strong>
              </div>
              <div>
                Stokes: <span className="font-mono">[{activeStage.pbsReflected.normalizedStokes.s1.toFixed(3)}, {activeStage.pbsReflected.normalizedStokes.s2.toFixed(3)}, {activeStage.pbsReflected.normalizedStokes.s3.toFixed(3)}]</span>
              </div>
              <div>
                Power Conservation: <span className="font-mono text-laser">{(activeStage.powerTransmissionPercent + activeStage.pbsReflected.powerReflectionPercent).toFixed(1)}% total</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 5. AMO Physics Handedness & Phase Convention Card */}
      <PolarizationConventionCard />
    </div>
  );
};
