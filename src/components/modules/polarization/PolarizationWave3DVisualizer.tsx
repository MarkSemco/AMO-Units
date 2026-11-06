import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '../../common/Button';
import {
  StageResult,
  jonesToAmplitudesAndPhase
} from '../../../core/polarization';
import { Play, Pause, RotateCcw, FastForward, Layers, Compass } from 'lucide-react';

export interface PolarizationWave3DVisualizerProps {
  stages: StageResult[];
  selectedStageIndex: number;
  onSelectStage: (stageIndex: number) => void;
}

export const PolarizationWave3DVisualizer: React.FC<PolarizationWave3DVisualizerProps> = ({
  stages,
  selectedStageIndex,
  onSelectStage
}) => {
  const currentStage = stages[selectedStageIndex] || stages[0];
  const { jones, ellipse } = currentStage;
  const { E0x, E0y, deltaDeg, phiXDeg, phiYDeg } = jonesToAmplitudesAndPhase(jones);

  // Animation controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [phaseRad, setPhaseRad] = useState<number>(0);

  // 3D Camera Angles (degrees) - Source perspective looking towards screen
  const [yawDeg, setYawDeg] = useState<number>(25);
  const [pitchDeg, setPitchDeg] = useState<number>(18);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Visibility toggles
  const [showTotalWave, setShowTotalWave] = useState<boolean>(true);
  const [showHorizontalEx, setShowHorizontalEx] = useState<boolean>(true);
  const [showVerticalEy, setShowVerticalEy] = useState<boolean>(true);
  const [showCombs, setShowCombs] = useState<boolean>(true);
  const [showScreen, setShowScreen] = useState<boolean>(true);
  const [showRefPlanes, setShowRefPlanes] = useState<boolean>(true);
  const [projectionMode, setProjectionMode] = useState<'perspective' | 'isometric'>('perspective');

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

  // Mouse & Touch Orbit Controls - Matches Poincaré Sphere intuitive pan/rotate
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!lastMousePosRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      setYawDeg(prev => ((prev - dx * 0.7) % 360 + 360) % 360);
      setPitchDeg(prev => Math.max(-85, Math.min(85, prev + dy * 0.7)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      lastMousePosRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !lastMousePosRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePosRef.current.x;
    const dy = e.touches[0].clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setYawDeg(prev => ((prev - dx * 0.7) % 360 + 360) % 360);
    setPitchDeg(prev => Math.max(-85, Math.min(85, prev + dy * 0.7)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastMousePosRef.current = null;
  };

  // SVG dimensions
  const width = 640;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2;

  // Amplitude auto-scaling
  const maxAmpRadius = 55;
  const currentAmp = Math.max(0.0001, Math.hypot(E0x, E0y));
  const ampScale = maxAmpRadius / currentAmp;

  // 3D projection function: (x, y, z) -> screen (X, Y, depth)
  // Supports both Perspective (depth foreshortening) and Isometric (parallel projection)
  const project3D = (x: number, y: number, z: number) => {
    const yawRad = (yawDeg * Math.PI) / 180;
    const pitchRad = (pitchDeg * Math.PI) / 180;

    // 1. Yaw around y axis
    const x1 = x * Math.cos(yawRad) + z * Math.sin(yawRad);
    const z1 = -x * Math.sin(yawRad) + z * Math.cos(yawRad);
    const y1 = y;

    // 2. Pitch around horizontal axis
    const x2 = x1;
    const y2 = y1 * Math.cos(pitchRad) + z1 * Math.sin(pitchRad);
    const z2 = -y1 * Math.sin(pitchRad) + z1 * Math.cos(pitchRad);

    const fov = 600;
    const perspective = projectionMode === 'isometric' ? 1.0 : fov / (fov + z2);

    return {
      x: cx + x2 * perspective,
      y: cy - y2 * perspective,
      depth: z2
    };
  };

  // Propagation geometry parameters: Source in foreground (zStart), Screen in distance (zEnd)
  const zStart = -160; // Laser source position (foreground)
  const zEnd = 160;    // Target screen position (distance)
  const numWavePoints = 140;
  const numWavelengths = 2.0;
  const k = (2 * Math.PI * numWavelengths) / (zEnd - zStart);

  const phiXRad = (phiXDeg * Math.PI) / 180;
  const phiYRad = (phiYDeg * Math.PI) / 180;

  // Generate 3D wave trajectories at instantaneous phaseRad
  const wavePoints = useMemo(() => {
    const totalPts: { x: number; y: number; depth: number }[] = [];
    const exPts: { x: number; y: number; depth: number }[] = [];
    const eyPts: { x: number; y: number; depth: number }[] = [];
    const axisPts: { x: number; y: number; depth: number }[] = [];
    const combLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

    const combStep = Math.floor(numWavePoints / 16);

    for (let i = 0; i <= numWavePoints; i++) {
      const frac = i / numWavePoints;
      const z = zStart + frac * (zEnd - zStart);
      // Traveling wave moving forward from source (zStart) to screen (zEnd): phase advances as phaseRad - k*(z - zStart)
      const theta = phaseRad - k * (z - zStart);

      const exVal = E0x * Math.cos(theta + phiXRad) * ampScale;
      const eyVal = E0y * Math.cos(theta + phiYRad) * ampScale;

      const pTotal = project3D(exVal, eyVal, z);
      const pEx = project3D(exVal, 0, z);
      const pEy = project3D(0, eyVal, z);
      const pAxis = project3D(0, 0, z);

      totalPts.push(pTotal);
      exPts.push(pEx);
      eyPts.push(pEy);
      axisPts.push(pAxis);

      if (i % combStep === 0 && i > 0 && i < numWavePoints) {
        combLines.push({
          x1: pAxis.x,
          y1: pAxis.y,
          x2: pTotal.x,
          y2: pTotal.y
        });
      }
    }

    return {
      totalPath: totalPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      exPath: exPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      eyPath: eyPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      axisPath: axisPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      combLines
    };
  }, [phaseRad, E0x, E0y, phiXRad, phiYRad, ampScale, yawDeg, pitchDeg, projectionMode]);

  // Target Screen geometry at z = zEnd
  const screenHalfWidth = 65;
  const screenHalfHeight = 65;
  const screenCorners = [
    project3D(-screenHalfWidth, -screenHalfHeight, zEnd),
    project3D(screenHalfWidth, -screenHalfHeight, zEnd),
    project3D(screenHalfWidth, screenHalfHeight, zEnd),
    project3D(-screenHalfWidth, screenHalfHeight, zEnd)
  ];
  const screenPolygonStr = screenCorners.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Axes on target screen
  const screenCenter = project3D(0, 0, zEnd);
  const screenXAxis = project3D(screenHalfWidth * 0.9, 0, zEnd);
  const screenYAxis = project3D(0, screenHalfHeight * 0.9, zEnd);

  // 2D Polarization ellipse trace on target screen
  const screenEllipsePoints: string[] = [];
  const numScreenPts = 80;
  for (let i = 0; i <= numScreenPts; i++) {
    const t = (i / numScreenPts) * 2 * Math.PI;
    const px = E0x * Math.cos(t + phiXRad) * ampScale;
    const py = E0y * Math.cos(t + phiYRad) * ampScale;
    const proj = project3D(px, py, zEnd);
    screenEllipsePoints.push(`${proj.x.toFixed(1)},${proj.y.toFixed(1)}`);
  }
  const screenEllipsePath = screenEllipsePoints.join(' ');

  // Instantaneous electric field vector hitting the screen at z = zEnd
  const screenHitEx = E0x * Math.cos(phaseRad + phiXRad) * ampScale;
  const screenHitEy = E0y * Math.cos(phaseRad + phiYRad) * ampScale;
  const screenHitProj = project3D(screenHitEx, screenHitEy, zEnd);

  // Source Emitter Ring at z = zStart
  const sourceRingPts: string[] = [];
  for (let i = 0; i <= 36; i++) {
    const ang = (i / 36) * 2 * Math.PI;
    const proj = project3D(maxAmpRadius * Math.cos(ang), maxAmpRadius * Math.sin(ang), zStart);
    sourceRingPts.push(`${proj.x.toFixed(1)},${proj.y.toFixed(1)}`);
  }

  // Reference Coordinate Planes & Perspective Anchors
  // Table floor (xz plane, y = 0) and vertical oscillation wall (yz plane, x = 0)
  const gridSpan = 65;
  const refPlanesData = useMemo(() => {
    // 1. Horizontal xz plane (Optical Table Floor at y = 0)
    const floorCorners = [
      project3D(-gridSpan, 0, zStart),
      project3D(gridSpan, 0, zStart),
      project3D(gridSpan, 0, zEnd),
      project3D(-gridSpan, 0, zEnd)
    ];
    const floorPolygon = floorCorners.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // Longitudinal grid lines on table (along z)
    const xzLongitudinalLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const xSteps = [-45, -22, 22, 45];
    xSteps.forEach(gx => {
      const p1 = project3D(gx, 0, zStart);
      const p2 = project3D(gx, 0, zEnd);
      xzLongitudinalLines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    });

    // Transverse grid lines on table (along x)
    const xzTransverseLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const zSteps = [-100, -50, 0, 50, 100];
    zSteps.forEach(gz => {
      const p1 = project3D(-gridSpan, 0, gz);
      const p2 = project3D(gridSpan, 0, gz);
      xzTransverseLines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    });

    // Table +x axis indicator near source
    const tableAxisOrigin = project3D(0, 0, zStart + 35);
    const tableAxisEnd = project3D(gridSpan * 0.85, 0, zStart + 35);

    // 2. Vertical yz plane (Vertical Oscillation Wall at x = 0)
    const wallCorners = [
      project3D(0, -gridSpan, zStart),
      project3D(0, gridSpan, zStart),
      project3D(0, gridSpan, zEnd),
      project3D(0, -gridSpan, zEnd)
    ];
    const wallPolygon = wallCorners.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // Longitudinal grid lines on wall (along z)
    const yzLongitudinalLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const ySteps = [-45, -22, 22, 45];
    ySteps.forEach(gy => {
      const p1 = project3D(0, gy, zStart);
      const p2 = project3D(0, gy, zEnd);
      yzLongitudinalLines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    });

    // Vertical transverse grid lines on wall (along y)
    const yzTransverseLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    zSteps.forEach(gz => {
      const p1 = project3D(0, -gridSpan, gz);
      const p2 = project3D(0, gridSpan, gz);
      yzTransverseLines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    });

    // Wall +y axis indicator near source
    const wallAxisOrigin = project3D(0, 0, zStart + 35);
    const wallAxisEnd = project3D(0, gridSpan * 0.85, zStart + 35);

    // 3. Physical posts & anchors
    const tableSurfaceY = -85;
    const screenBottomCenter = project3D(0, -screenHalfHeight, zEnd);
    const screenPostBase = project3D(0, tableSurfaceY, zEnd);
    const screenNormalEnd = project3D(0, 0, zEnd + 30);

    const sourceBottomCenter = project3D(0, -maxAmpRadius, zStart);
    const sourcePostBase = project3D(0, tableSurfaceY, zStart);
    const tableRailP1 = project3D(0, tableSurfaceY, zStart);
    const tableRailP2 = project3D(0, tableSurfaceY, zEnd);

    return {
      floorPolygon,
      xzLongitudinalLines,
      xzTransverseLines,
      tableAxisOrigin,
      tableAxisEnd,
      wallPolygon,
      yzLongitudinalLines,
      yzTransverseLines,
      wallAxisOrigin,
      wallAxisEnd,
      screenBottomCenter,
      screenPostBase,
      screenNormalEnd,
      sourceBottomCenter,
      sourcePostBase,
      tableRailP1,
      tableRailP2
    };
  }, [yawDeg, pitchDeg, projectionMode]);

  // Camera presets
  const applyPreset = (preset: 'lab' | 'top' | 'side' | 'screen') => {
    switch (preset) {
      case 'lab':
        setYawDeg(25);
        setPitchDeg(18);
        break;
      case 'top':
        setYawDeg(0);
        setPitchDeg(88);
        break;
      case 'side':
        setYawDeg(90);
        setPitchDeg(0);
        break;
      case 'screen':
        setYawDeg(0);
        setPitchDeg(0);
        break;
    }
  };

  return (
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

      {/* 3D Wave Perspective SVG Canvas */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-base)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
          overflow: 'hidden',
          padding: '8px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Toggleable Perspective Reference Planes (Table floor xz and vertical wall yz) */}
          {showRefPlanes && (
            <g>
              {/* 1. Horizontal Table Floor (xz plane at y = 0) */}
              <polygon
                points={refPlanesData.floorPolygon}
                fill="rgba(56, 189, 248, 0.03)"
                stroke="var(--color-optical)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.35"
              />
              {refPlanesData.xzLongitudinalLines.map((line, idx) => (
                <line
                  key={`xz-long-${idx}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="var(--color-optical)"
                  strokeWidth="0.8"
                  strokeDasharray="3 4"
                  opacity="0.22"
                />
              ))}
              {refPlanesData.xzTransverseLines.map((line, idx) => (
                <line
                  key={`xz-trans-${idx}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="var(--color-optical)"
                  strokeWidth="0.8"
                  strokeDasharray="3 4"
                  opacity="0.22"
                />
              ))}
              {/* +x Table Axis Indicator */}
              <line
                x1={refPlanesData.tableAxisOrigin.x}
                y1={refPlanesData.tableAxisOrigin.y}
                x2={refPlanesData.tableAxisEnd.x}
                y2={refPlanesData.tableAxisEnd.y}
                stroke="var(--color-optical)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <text
                x={refPlanesData.tableAxisEnd.x + 3}
                y={refPlanesData.tableAxisEnd.y + 3}
                fill="var(--color-optical)"
                fontSize="9"
                fontFamily="var(--font-mono)"
                opacity="0.8"
              >
                +x (Table)
              </text>

              {/* 2. Vertical Oscillation Wall (yz plane at x = 0) */}
              <polygon
                points={refPlanesData.wallPolygon}
                fill="rgba(244, 63, 94, 0.025)"
                stroke="var(--color-magnetic)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              {refPlanesData.yzLongitudinalLines.map((line, idx) => (
                <line
                  key={`yz-long-${idx}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="var(--color-magnetic)"
                  strokeWidth="0.8"
                  strokeDasharray="3 4"
                  opacity="0.18"
                />
              ))}
              {refPlanesData.yzTransverseLines.map((line, idx) => (
                <line
                  key={`yz-trans-${idx}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="var(--color-magnetic)"
                  strokeWidth="0.8"
                  strokeDasharray="3 4"
                  opacity="0.18"
                />
              ))}
              {/* +y Vertical Wall Axis Indicator */}
              <line
                x1={refPlanesData.wallAxisOrigin.x}
                y1={refPlanesData.wallAxisOrigin.y}
                x2={refPlanesData.wallAxisEnd.x}
                y2={refPlanesData.wallAxisEnd.y}
                stroke="var(--color-magnetic)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <text
                x={refPlanesData.wallAxisEnd.x + 3}
                y={refPlanesData.wallAxisEnd.y - 2}
                fill="var(--color-magnetic)"
                fontSize="9"
                fontFamily="var(--font-mono)"
                opacity="0.8"
              >
                +y (Vert)
              </text>
              {/* Optical Table Mounting Rail connecting posts */}
              <line
                x1={refPlanesData.tableRailP1.x}
                y1={refPlanesData.tableRailP1.y}
                x2={refPlanesData.tableRailP2.x}
                y2={refPlanesData.tableRailP2.y}
                stroke="var(--color-border-strong)"
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity="0.45"
              />
            </g>
          )}

          {/* Laser Source Emitter Mount & Ring at z = zStart */}
          <line
            x1={refPlanesData.sourceBottomCenter.x}
            y1={refPlanesData.sourceBottomCenter.y}
            x2={refPlanesData.sourcePostBase.x}
            y2={refPlanesData.sourcePostBase.y}
            stroke="var(--color-border-strong)"
            strokeWidth="2"
            opacity="0.5"
          />
          <circle
            cx={refPlanesData.sourcePostBase.x}
            cy={refPlanesData.sourcePostBase.y}
            r="2.5"
            fill="var(--color-border-strong)"
            opacity="0.6"
          />
          <polygon
            points={sourceRingPts.join(' ')}
            fill="rgba(192, 132, 252, 0.05)"
            stroke="var(--color-border-subtle)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.6"
          />
          <text
            x={project3D(0, -screenHalfHeight * 0.9, zStart).x}
            y={project3D(0, -screenHalfHeight * 0.9, zStart).y + 16}
            fill="var(--color-text-muted)"
            fontSize="10"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
          >
            Laser Source (+z →)
          </text>

          {/* Target Detector Screen Plate Backdrop (rendered behind waves when screen is in distance) */}
          {showScreen && screenCenter.depth >= 0 && (
            <g>
              <line
                x1={refPlanesData.screenBottomCenter.x}
                y1={refPlanesData.screenBottomCenter.y}
                x2={refPlanesData.screenPostBase.x}
                y2={refPlanesData.screenPostBase.y}
                stroke="var(--color-border-strong)"
                strokeWidth="2.5"
                opacity="0.75"
              />
              <circle
                cx={refPlanesData.screenPostBase.x}
                cy={refPlanesData.screenPostBase.y}
                r="3"
                fill="var(--color-border-strong)"
              />
              <polygon
                points={screenPolygonStr}
                fill="rgba(17, 24, 39, 0.75)"
                stroke="var(--color-border-strong)"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Central Beam Propagation Axis */}
          <polyline
            points={wavePoints.axisPath}
            fill="none"
            stroke="var(--color-border-strong)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.7"
          />

          {/* Horizontal Component Wave Ex(z, t) in xz plane */}
          {showHorizontalEx && (
            <polyline
              points={wavePoints.exPath}
              fill="none"
              stroke="var(--color-optical)"
              strokeWidth="2"
              opacity="0.85"
            />
          )}

          {/* Vertical Component Wave Ey(z, t) in yz plane */}
          {showVerticalEy && (
            <polyline
              points={wavePoints.eyPath}
              fill="none"
              stroke="var(--color-magnetic)"
              strokeWidth="2"
              opacity="0.85"
            />
          )}

          {/* Vector Field Combs connecting axis to composite wave */}
          {showCombs && (
            <g opacity="0.4">
              {wavePoints.combLines.map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="var(--color-laser)"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}

          {/* Composite 3D Helical Electric Field Corkscrew E(z, t) */}
          {showTotalWave && (
            <polyline
              points={wavePoints.totalPath}
              fill="none"
              stroke="var(--color-laser)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Target Detector Screen Plate and Indicators at z = zEnd */}
          {showScreen && (
            <g>
              {/* If screen is in foreground (depth < 0), draw mounting post and backdrop in front of waves */}
              {screenCenter.depth < 0 && (
                <>
                  <line
                    x1={refPlanesData.screenBottomCenter.x}
                    y1={refPlanesData.screenBottomCenter.y}
                    x2={refPlanesData.screenPostBase.x}
                    y2={refPlanesData.screenPostBase.y}
                    stroke="var(--color-border-strong)"
                    strokeWidth="2.5"
                    opacity="0.75"
                  />
                  <circle
                    cx={refPlanesData.screenPostBase.x}
                    cy={refPlanesData.screenPostBase.y}
                    r="3"
                    fill="var(--color-border-strong)"
                  />
                  <polygon
                    points={screenPolygonStr}
                    fill="rgba(17, 24, 39, 0.75)"
                    stroke="var(--color-border-strong)"
                    strokeWidth="1.5"
                  />
                </>
              )}

              {/* Screen Normal Vector pointing along +z (k̂) */}
              <line
                x1={screenCenter.x}
                y1={screenCenter.y}
                x2={refPlanesData.screenNormalEnd.x}
                y2={refPlanesData.screenNormalEnd.y}
                stroke="var(--color-laser)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              <circle
                cx={refPlanesData.screenNormalEnd.x}
                cy={refPlanesData.screenNormalEnd.y}
                r="2.5"
                fill="var(--color-laser)"
              />
              <text
                x={refPlanesData.screenNormalEnd.x + 4}
                y={refPlanesData.screenNormalEnd.y + 3}
                fill="var(--color-laser)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                +z (k̂)
              </text>

              {/* Screen local axes */}
              <line
                x1={screenCenter.x}
                y1={screenCenter.y}
                x2={screenXAxis.x}
                y2={screenXAxis.y}
                stroke="var(--color-optical)"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <text
                x={screenXAxis.x + 4}
                y={screenXAxis.y + 4}
                fill="var(--color-optical)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                +x
              </text>

              <line
                x1={screenCenter.x}
                y1={screenCenter.y}
                x2={screenYAxis.x}
                y2={screenYAxis.y}
                stroke="var(--color-magnetic)"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <text
                x={screenYAxis.x}
                y={screenYAxis.y - 4}
                fill="var(--color-magnetic)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                +y
              </text>

              {/* 2D Stationary Ellipse Trace directly on the screen */}
              <polyline
                points={screenEllipsePath}
                fill="rgba(192, 132, 252, 0.08)"
                stroke="var(--color-laser)"
                strokeWidth="2"
              />

              {/* Instantaneous Rotating Vector Impacting the Screen */}
              <line
                x1={screenCenter.x}
                y1={screenCenter.y}
                x2={screenHitProj.x}
                y2={screenHitProj.y}
                stroke="var(--color-text-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle
                cx={screenHitProj.x}
                cy={screenHitProj.y}
                r="4.5"
                fill="var(--color-laser)"
                stroke="#fff"
                strokeWidth="1"
              />

              <text
                x={screenCorners[1].x - 4}
                y={screenCorners[1].y + 14}
                fill="var(--color-text-secondary)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                Target Screen (z = L)
              </text>
            </g>
          )}

          {/* Viewer perspective badge */}
          <text
            x="14"
            y="22"
            fill="var(--color-text-muted)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            Drag to Orbit (Yaw: {yawDeg.toFixed(0)}°, Pitch: {pitchDeg.toFixed(0)}°)
          </text>
        </svg>

        {/* Real-time Telemetry Overlay Box */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(17, 24, 39, 0.88)',
            backdropFilter: 'blur(6px)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            pointerEvents: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Handedness:</span>
            <span
              title={
                ellipse.handedness === 'right'
                  ? 'Right-Hand Rule: Viewer at laser source looking along +z (into screen). Right thumb points along +k̂, curled fingers point Clockwise (CW). Photon carries +ħ along k̂ (Helicity +1). Drives σ⁺ (Δm = +1) if B⃗ ∥ +k̂; drives σ⁻ (Δm = -1) if B⃗ ∥ -k̂.'
                  : ellipse.handedness === 'left'
                  ? 'Left-Handed: Counter-Clockwise (CCW) rotation looking along +k̂. Photon carries -ħ along k̂ (Helicity -1). Drives σ⁻ (Δm = -1) if B⃗ ∥ +k̂; drives σ⁺ (Δm = +1) if B⃗ ∥ -k̂.'
                  : 'Linear polarization (zero net rotation)'
              }
              style={{
                fontWeight: 'bold',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
            <span style={{ color: 'var(--color-optical)' }}>Horizontal E₀x:</span>
            <span className="font-mono text-optical">{E0x.toFixed(3)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
            <span style={{ color: 'var(--color-magnetic)' }}>Vertical E₀y:</span>
            <span className="font-mono text-magnetic">{E0y.toFixed(3)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Phase Shift δ:</span>
            <span className="font-mono text-laser">{deltaDeg.toFixed(1)}°</span>
          </div>
        </div>

        {/* Mini 2D Screen Face-On Inset Preview */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            backgroundColor: 'rgba(17, 24, 39, 0.92)',
            backdropFilter: 'blur(6px)',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Screen Face-On (2D)
          </span>
          <svg width="76" height="76" viewBox="0 0 76 76">
            <rect x="0" y="0" width="76" height="76" fill="rgba(0,0,0,0.3)" rx="3" />
            <line x1="38" y1="4" x2="38" y2="72" stroke="var(--color-border-subtle)" strokeWidth="1" />
            <line x1="4" y1="38" x2="72" y2="38" stroke="var(--color-border-subtle)" strokeWidth="1" />
            {/* 2D Ellipse trace */}
            {(() => {
              const pts: string[] = [];
              const miniScale = 28 / Math.max(0.001, Math.hypot(E0x, E0y));
              for (let i = 0; i <= 36; i++) {
                const t = (i / 36) * 2 * Math.PI;
                const px = 38 + E0x * Math.cos(t + phiXRad) * miniScale;
                const py = 38 - E0y * Math.cos(t + phiYRad) * miniScale;
                pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              }
              const miniEx = E0x * Math.cos(phaseRad + phiXRad) * miniScale;
              const miniEy = E0y * Math.cos(phaseRad + phiYRad) * miniScale;
              return (
                <>
                  <polyline points={pts.join(' ')} fill="none" stroke="var(--color-laser)" strokeWidth="1.5" />
                  <line x1="38" y1="38" x2={38 + miniEx} y2={38 - miniEy} stroke="#fff" strokeWidth="2" />
                  <circle cx={38 + miniEx} cy={38 - miniEy} r="3" fill="var(--color-laser)" />
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Camera View Angle Presets & Component Visibility Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'var(--color-bg-base)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border-subtle)',
          fontSize: '11px'
        }}
      >
        {/* Camera angle presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--color-text-secondary)', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Compass size={13} /> Camera:
          </span>
          <button
            onClick={() => applyPreset('lab')}
            style={cameraPresetBtnStyle(yawDeg === 25 && pitchDeg === 18)}
          >
            3D Lab View
          </button>
          <button
            onClick={() => applyPreset('top')}
            style={cameraPresetBtnStyle(pitchDeg >= 85)}
          >
            Top (Ex)
          </button>
          <button
            onClick={() => applyPreset('side')}
            style={cameraPresetBtnStyle(yawDeg === 90 && pitchDeg === 0)}
          >
            Side (Ey)
          </button>
          <button
            onClick={() => applyPreset('screen')}
            style={cameraPresetBtnStyle(yawDeg === 0 && pitchDeg === 0)}
          >
            Face-On
          </button>
          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-border-subtle)', margin: '0 4px' }} />
          <button
            onClick={() => setProjectionMode('perspective')}
            style={cameraPresetBtnStyle(projectionMode === 'perspective')}
            title="Perspective projection with depth foreshortening (default)"
          >
            Perspective
          </button>
          <button
            onClick={() => setProjectionMode('isometric')}
            style={cameraPresetBtnStyle(projectionMode === 'isometric')}
            title="Isometric orthographic projection (parallel wavefront lines remain parallel)"
          >
            Isometric
          </button>
        </div>

        {/* Wave component visibility toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Layers size={13} /> Waves:
          </span>
          <label style={checkboxLabelStyle('var(--color-laser)')}>
            <input
              type="checkbox"
              checked={showTotalWave}
              onChange={e => setShowTotalWave(e.target.checked)}
              style={{ accentColor: 'var(--color-laser)' }}
            />
            E⃗(z,t)
          </label>
          <label style={checkboxLabelStyle('var(--color-optical)')}>
            <input
              type="checkbox"
              checked={showHorizontalEx}
              onChange={e => setShowHorizontalEx(e.target.checked)}
              style={{ accentColor: 'var(--color-optical)' }}
            />
            Ex (Horiz)
          </label>
          <label style={checkboxLabelStyle('var(--color-magnetic)')}>
            <input
              type="checkbox"
              checked={showVerticalEy}
              onChange={e => setShowVerticalEy(e.target.checked)}
              style={{ accentColor: 'var(--color-magnetic)' }}
            />
            Ey (Vert)
          </label>
          <label style={checkboxLabelStyle('var(--color-text-secondary)')}>
            <input
              type="checkbox"
              checked={showCombs}
              onChange={e => setShowCombs(e.target.checked)}
              style={{ accentColor: 'var(--color-text-secondary)' }}
            />
            Combs
          </label>
          <label style={checkboxLabelStyle('var(--color-text-secondary)')}>
            <input
              type="checkbox"
              checked={showScreen}
              onChange={e => setShowScreen(e.target.checked)}
              style={{ accentColor: 'var(--color-text-secondary)' }}
            />
            Screen
          </label>
          <label style={checkboxLabelStyle('var(--color-laser)')}>
            <input
              type="checkbox"
              checked={showRefPlanes}
              onChange={e => setShowRefPlanes(e.target.checked)}
              style={{ accentColor: 'var(--color-laser)' }}
            />
            Ref Planes (xz/yz)
          </label>
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
  );
};

const cameraPresetBtnStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '2px 6px',
  fontSize: '10px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: isActive ? 'var(--color-laser-badge)' : 'var(--color-bg-surface-elevated)',
  border: isActive ? '1px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
  color: isActive ? 'var(--color-laser)' : 'var(--color-text-secondary)',
  cursor: 'pointer'
});

const checkboxLabelStyle = (color: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  color: color,
  cursor: 'pointer',
  fontSize: '11px'
});
