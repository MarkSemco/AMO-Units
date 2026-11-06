import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import {
  StageResult,
  jonesToAmplitudesAndPhase
} from '../../../core/polarization';
import { Play, Pause, RotateCcw, FastForward, Activity, Box, CircleDot } from 'lucide-react';
import { PolarizationWave3DVisualizer } from './PolarizationWave3DVisualizer';

export interface PolarizationEllipseVisualizerProps {
  stages: StageResult[];
  selectedStageIndex: number;
  onSelectStage: (stageIndex: number) => void;
}

export const PolarizationEllipseVisualizer: React.FC<PolarizationEllipseVisualizerProps> = ({
  stages,
  selectedStageIndex,
  onSelectStage
}) => {
  const currentStage = stages[selectedStageIndex] || stages[0];
  const { jones, ellipse } = currentStage;
  const { E0x, E0y, deltaDeg, phiXDeg, phiYDeg } = jonesToAmplitudesAndPhase(jones);

  // View toggle: 2D Ellipse vs 3D Propagating Wave
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Animation controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [phaseRad, setPhaseRad] = useState<number>(0);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Animation frame loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const dt = (time - lastTimeRef.current) / 1000;
        // Angular frequency omega: 1 full cycle every 2.5 seconds at 1.0x speed
        const omega = (2 * Math.PI) / 2.5;
        setPhaseRad(prev => (prev + omega * speedMultiplier * dt) % (2 * Math.PI));
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, speedMultiplier]);

  // Canvas geometry for 2D view
  const width = 360;
  const height = 320;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = 110;

  // Always auto-scale cleanly to canvas bounds for maximum geometric clarity
  const currentAmp = Math.max(0.0001, Math.hypot(E0x, E0y));
  const scale = maxRadius / currentAmp;

  // Calculate current E-field tip coordinates
  // Right-Hand Rule convention: viewer at source looking along +z into screen.
  // E(t) = Re{ E * exp(i * omega * t) }
  // Ex(t) = E0x * cos(tau + phiX)
  // Ey(t) = E0y * cos(tau + phiY)
  // Screen Y = cy - Ey (so +y is UP on screen)
  // For RHC (delta = +90°): Ex(t) = cos(tau), Ey(t) = -sin(tau), rotating CLOCKWISE!
  const phiXRad = (phiXDeg * Math.PI) / 180;
  const phiYRad = (phiYDeg * Math.PI) / 180;

  const currentEx = E0x * Math.cos(phaseRad + phiXRad);
  const currentEy = E0y * Math.cos(phaseRad + phiYRad);

  const tipX = cx + currentEx * scale;
  const tipY = cy - currentEy * scale;

  // Generate trace ellipse points for SVG polygon / path
  const numPoints = 120;
  const ellipsePoints: string[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;
    const px = cx + E0x * Math.cos(t + phiXRad) * scale;
    const py = cy - E0y * Math.cos(t + phiYRad) * scale;
    ellipsePoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  const ellipsePointsStr = ellipsePoints.join(' ');

  // Handedness arrow position (at t = pi/4 or quarter point)
  const arrowT = Math.PI / 4;
  const arrowX = cx + E0x * Math.cos(arrowT + phiXRad) * scale;
  const arrowY = cy - E0y * Math.cos(arrowT + phiYRad) * scale;
  // Tangent vector
  const dX = -E0x * Math.sin(arrowT + phiXRad);
  const dY = E0y * Math.sin(arrowT + phiYRad);
  const arrowAngleDeg = (Math.atan2(dY, dX) * 180) / Math.PI;

  return (
    <Card
      title={viewMode === '2d' ? 'Transverse Electric Field Ellipse' : '3D Propagating Wave'}
      subtitle={
        viewMode === '2d'
          ? 'Rotating electric field vector E⃗(t) in the transverse plane looking along +z.'
          : 'Propagating beam along +z with orthogonal Ex and Ey components.'
      }
      category="laser"
      icon={<Activity size={20} />}
      collapsible={true}
      actions={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--color-bg-base)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)'
          }}
        >
          <button
            onClick={() => setViewMode('2d')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: viewMode === '2d' ? 'var(--color-laser)' : 'transparent',
              color: viewMode === '2d' ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: viewMode === '2d' ? 'bold' : 'normal',
              transition: 'all var(--transition-fast)'
            }}
          >
            <CircleDot size={13} /> 2D Ellipse
          </button>
          <button
            onClick={() => setViewMode('3d')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: viewMode === '3d' ? 'var(--color-laser)' : 'transparent',
              color: viewMode === '3d' ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: viewMode === '3d' ? 'bold' : 'normal',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Box size={13} /> 3D Wave
          </button>
        </div>
      }
    >
      {viewMode === '3d' ? (
        <PolarizationWave3DVisualizer
          stages={stages}
          selectedStageIndex={selectedStageIndex}
          onSelectStage={onSelectStage}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Stage Selector Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginRight: '4px' }}>
              Inspect Stage:
            </span>
            {stages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSelectStage(idx)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  border:
                    selectedStageIndex === idx
                      ? '1px solid var(--color-laser)'
                      : '1px solid var(--color-border-subtle)',
                  backgroundColor:
                    selectedStageIndex === idx ? 'var(--color-laser-badge)' : 'var(--color-bg-input)',
                  color:
                    selectedStageIndex === idx ? 'var(--color-laser)' : 'var(--color-text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {idx === 0 ? 'Stage 0 (Input)' : `Stage ${idx}`}
              </button>
            ))}
          </div>

          {/* 2D Canvas Display Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              overflow: 'hidden',
              padding: '12px',
              touchAction: 'none'
            }}
          >
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {/* Background Grid & Axes */}
              <circle cx={cx} cy={cy} r={maxRadius * 0.5} fill="none" stroke="var(--color-border-subtle)" strokeDasharray="3 3" opacity="0.4" />
              <circle cx={cx} cy={cy} r={maxRadius} fill="none" stroke="var(--color-border-subtle)" strokeDasharray="3 3" opacity="0.4" />

              {/* X-axis (Horizontal) */}
              <line x1={20} y1={cy} x2={width - 20} y2={cy} stroke="var(--color-border-strong)" strokeWidth="1.5" />
              <text x={width - 15} y={cy + 4} fill="var(--color-text-secondary)" fontSize="11" fontFamily="var(--font-mono)">
                +x
              </text>

              {/* Y-axis (Vertical) */}
              <line x1={cx} y1={height - 20} x2={cx} y2={20} stroke="var(--color-border-strong)" strokeWidth="1.5" />
              <text x={cx + 4} y={15} fill="var(--color-text-secondary)" fontSize="11" fontFamily="var(--font-mono)">
                +y
              </text>

              {/* Ellipse Stationary Trajectory Trace */}
              <polyline
                points={ellipsePointsStr}
                fill="rgba(192, 132, 252, 0.05)"
                stroke="var(--color-laser)"
                strokeWidth="2.5"
              />

              {/* Direction Arrow on Trajectory (Clockwise for RHC, Counter-Clockwise for LHC) */}
              {ellipse.handedness !== 'linear' && (
                <g transform={`translate(${arrowX}, ${arrowY}) rotate(${arrowAngleDeg})`}>
                  <polygon
                    points="-6,-4 6,0 -6,4"
                    fill="var(--color-laser)"
                  />
                </g>
              )}

              {/* Orthogonal Pulsing Components on X and Y axes */}
              {/* Ex on horizontal axis */}
              <line
                x1={cx}
                y1={cy}
                x2={tipX}
                y2={cy}
                stroke="var(--color-optical)"
                strokeWidth="2"
                opacity="0.8"
              />
              <circle cx={tipX} cy={cy} r="3" fill="var(--color-optical)" />

              {/* Ey on vertical axis */}
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={tipY}
                stroke="var(--color-magnetic)"
                strokeWidth="2"
                opacity="0.8"
              />
              <circle cx={cx} cy={tipY} r="3" fill="var(--color-magnetic)" />

              {/* Real-time Rotating Electric Field Vector Arrow E(t) */}
              <line
                x1={cx}
                y1={cy}
                x2={tipX}
                y2={tipY}
                stroke="var(--color-text-primary)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx={tipX} cy={tipY} r="5" fill="var(--color-laser)" />

              {/* Viewer Perspective Badge */}
              <text
                x="12"
                y="22"
                fill="var(--color-text-muted)"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                Propagation: +z into screen (RHR: thumb +z, curl CW)
              </text>
            </svg>

            {/* Real-time Telemetry Overlay Box */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'rgba(17, 24, 39, 0.88)',
                backdropFilter: 'blur(4px)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Handedness:</span>
                <span
                  title={
                    ellipse.handedness === 'right'
                      ? 'Right-Hand Rule: Viewer at laser source looking along +z (into screen). Right thumb along +k̂, fingers curl Clockwise (CW). Photon carries +ħ along k̂ (Helicity +1). Drives σ⁺ (Δm = +1) if B⃗ ∥ +k̂; drives σ⁻ (Δm = -1) if B⃗ ∥ -k̂.'
                      : ellipse.handedness === 'left'
                      ? 'Left-Handed: Counter-Clockwise (CCW) rotation looking along +k̂. Photon carries -ħ along k̂ (Helicity -1). Drives σ⁻ (Δm = -1) if B⃗ ∥ +k̂; drives σ⁺ (Δm = +1) if B⃗ ∥ -k̂.'
                      : 'Linear polarization (zero net circularity)'
                  }
                  style={{
                    fontWeight: 'bold',
                    cursor: 'help',
                    color:
                      ellipse.handedness === 'right'
                        ? 'var(--color-laser)'
                        : ellipse.handedness === 'left'
                        ? 'var(--color-optical)'
                        : 'var(--color-text-primary)'
                  }}
                >
                  {ellipse.handedness === 'right'
                    ? 'RHC (CW)'
                    : ellipse.handedness === 'left'
                    ? 'LHC (CCW)'
                    : 'Linear'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Power Throughput:</span>
                <span className="font-mono text-laser">
                  {currentStage.powerTransmissionPercent.toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Azimuth ψ:</span>
                <span className="font-mono text-laser">{ellipse.psiDeg.toFixed(1)}°</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Ellipticity χ:</span>
                <span className="font-mono text-optical">{ellipse.chiDeg.toFixed(1)}°</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Phase Diff δ:</span>
                <span className="font-mono text-magnetic">{deltaDeg.toFixed(1)}°</span>
              </div>
            </div>
          </div>

          {/* Playback Controls Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            {/* Play/Pause & Reset buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                size="sm"
                variant="outline"
                category="laser"
                icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
                onClick={() => setIsPlaying(prev => !prev)}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                category="laser"
                icon={<RotateCcw size={14} />}
                onClick={() => setPhaseRad(0)}
                title="Reset phase to t = 0"
              >
                Reset Phase
              </Button>

              {/* Step buttons when paused */}
              {!isPlaying && (
                <Button
                  size="sm"
                  variant="ghost"
                  category="laser"
                  icon={<FastForward size={14} />}
                  onClick={() => setPhaseRad(prev => (prev + Math.PI / 12) % (2 * Math.PI))}
                  title="Advance phase by 15°"
                >
                  Step +15°
                </Button>
              )}
            </div>

            {/* Speed Multiplier Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Speed:</span>
                <input
                  type="range"
                  min="0.25"
                  max="2.5"
                  step="0.25"
                  value={speedMultiplier}
                  onChange={e => setSpeedMultiplier(parseFloat(e.target.value))}
                  style={{ width: '70px', accentColor: 'var(--color-laser)' }}
                />
                <span className="font-mono text-laser" style={{ width: '28px' }}>
                  {speedMultiplier.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
