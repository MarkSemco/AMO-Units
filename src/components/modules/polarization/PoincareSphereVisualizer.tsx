import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { StageResult } from '../../../core/polarization';
import { Globe, RotateCcw } from 'lucide-react';

export interface PoincareSphereVisualizerProps {
  stages: StageResult[];
  selectedStageIndex: number;
  onSelectStage: (stageIndex: number) => void;
}

export const PoincareSphereVisualizer: React.FC<PoincareSphereVisualizerProps> = ({
  stages,
  selectedStageIndex,
  onSelectStage
}) => {
  // 3D Rotation Angles (degrees)
  const [azimuthDeg, setAzimuthDeg] = useState<number>(35);
  const [elevationDeg, setElevationDeg] = useState<number>(20);

  // Dragging state for mouse rotation
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // SVG dimensions
  const width = 360;
  const height = 320;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 110;

  // Mouse drag handlers
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

      setAzimuthDeg(prev => ((prev + dx * 0.8) % 360 + 360) % 360);
      setElevationDeg(prev => Math.max(-85, Math.min(85, prev + dy * 0.8)));
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

  // Touch drag handlers for mobile / tablet
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

    setAzimuthDeg(prev => ((prev + dx * 0.8) % 360 + 360) % 360);
    setElevationDeg(prev => Math.max(-85, Math.min(85, prev + dy * 0.8)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastMousePosRef.current = null;
  };

  // 3D projection function from (s1, s2, s3) to screen (X, Y, depth)
  const project3D = (s1: number, s2: number, s3: number) => {
    const azRad = (azimuthDeg * Math.PI) / 180;
    const elRad = (elevationDeg * Math.PI) / 180;

    // 1. Azimuth rotation around z (s3)
    const x1 = s1 * Math.cos(azRad) - s2 * Math.sin(azRad);
    const y1 = s1 * Math.sin(azRad) + s2 * Math.cos(azRad);
    const z1 = s3;

    // 2. Elevation rotation around horizontal axis
    const x2 = x1;
    const y2 = y1 * Math.cos(elRad) - z1 * Math.sin(elRad);
    const z2 = y1 * Math.sin(elRad) + z1 * Math.cos(elRad);

    const screenX = cx + x2 * radius;
    const screenY = cy - z2 * radius;
    const depth = y2; // > 0 front, < 0 back

    return { x: screenX, y: screenY, depth };
  };

  // Pre-calculate latitude grid lines
  const latitudeLines = useMemo(() => {
    const lats = [-60, -30, 0, 30, 60];
    return lats.map(latDeg => {
      const latRad = (latDeg * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const sinLat = Math.sin(latRad);
      const numSegs = 64;
      const pts: { x: number; y: number; depth: number }[] = [];

      for (let i = 0; i <= numSegs; i++) {
        const lonRad = (i / numSegs) * 2 * Math.PI;
        const s1 = cosLat * Math.cos(lonRad);
        const s2 = cosLat * Math.sin(lonRad);
        const s3 = sinLat;
        pts.push(project3D(s1, s2, s3));
      }

      // Split into front and back segments based on depth
      const frontPts: string[] = [];
      const backPts: string[] = [];
      for (const p of pts) {
        if (p.depth >= 0) frontPts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
        else backPts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      }

      return {
        latDeg,
        isEquator: latDeg === 0,
        allPtsStr: pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      };
    });
  }, [azimuthDeg, elevationDeg]);

  // Pre-calculate meridian lines
  const meridianLines = useMemo(() => {
    const lons = [0, 45, 90, 135];
    return lons.map(lonDeg => {
      const lonRad = (lonDeg * Math.PI) / 180;
      const numSegs = 64;
      const pts: { x: number; y: number }[] = [];

      for (let i = 0; i <= numSegs; i++) {
        const theta = (i / numSegs) * 2 * Math.PI;
        const s1 = Math.cos(theta) * Math.cos(lonRad);
        const s2 = Math.cos(theta) * Math.sin(lonRad);
        const s3 = Math.sin(theta);
        const proj = project3D(s1, s2, s3);
        pts.push({ x: proj.x, y: proj.y });
      }

      return {
        lonDeg,
        ptsStr: pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      };
    });
  }, [azimuthDeg, elevationDeg]);

  // Standard AMO presets projected onto the sphere
  const presetPoints = useMemo(() => {
    const presets = [
      { name: '|H⟩', s1: 1, s2: 0, s3: 0, color: 'var(--color-laser)' },
      { name: '|V⟩', s1: -1, s2: 0, s3: 0, color: 'var(--color-laser)' },
      { name: '|D⟩', s1: 0, s2: 1, s3: 0, color: 'var(--color-optical)' },
      { name: '|A⟩', s1: 0, s2: -1, s3: 0, color: 'var(--color-optical)' },
      { name: '|R⟩ RHC', s1: 0, s2: 0, s3: 1, color: 'var(--color-magnetic)' },
      { name: '|L⟩ LHC', s1: 0, s2: 0, s3: -1, color: 'var(--color-rf)' }
    ];
    return presets.map(p => ({
      ...p,
      proj: project3D(p.s1, p.s2, p.s3)
    }));
  }, [azimuthDeg, elevationDeg]);

  // Stage trajectory line & markers
  const stageMarkers = useMemo(() => {
    return stages.map((stg, idx) => {
      const { s1Norm, s2Norm, s3Norm } = stg.poincare;
      const proj = project3D(s1Norm, s2Norm, s3Norm);
      return {
        stageIndex: idx,
        name: idx === 0 ? 'Stage 0 (Input)' : `Stage ${idx}`,
        s1: s1Norm,
        s2: s2Norm,
        s3: s3Norm,
        proj
      };
    });
  }, [stages, azimuthDeg, elevationDeg]);

  // Trajectory path connecting stages
  const trajectoryPathStr = useMemo(() => {
    if (stageMarkers.length < 2) return '';
    return stageMarkers.map(m => `${m.proj.x.toFixed(1)},${m.proj.y.toFixed(1)}`).join(' ');
  }, [stageMarkers]);

  // Coordinate axes endpoints
  const axisS1 = project3D(1.3, 0, 0);
  const axisS2 = project3D(0, 1.3, 0);
  const axisS3 = project3D(0, 0, 1.3);

  return (
    <Card
      title="Poincaré Sphere"
      subtitle="Stokes vector representation and trajectory through the optical train."
      category="laser"
      icon={<Globe size={20} />}
      collapsible={true}
      actions={
        <Button
          size="sm"
          variant="ghost"
          category="laser"
          icon={<RotateCcw size={14} />}
          onClick={() => {
            setAzimuthDeg(35);
            setElevationDeg(20);
          }}
          title="Reset to standard perspective"
        >
          Reset View
        </Button>
      }
    >
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

        {/* 3D Sphere Interactive SVG Canvas */}
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
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            padding: '12px'
          }}
        >
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Sphere Background Fill with subtle 3D radial gradient */}
            <defs>
              <radialGradient id="poincareSphereGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#111827" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0B0F17" stopOpacity="1" />
              </radialGradient>
            </defs>

            {/* Translucent Sphere Body */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="url(#poincareSphereGrad)"
              stroke="var(--color-border-subtle)"
              strokeWidth="1.5"
            />

            {/* Meridians (Longitudes) */}
            {meridianLines.map(line => (
              <polyline
                key={line.lonDeg}
                points={line.ptsStr}
                fill="none"
                stroke="var(--color-border-subtle)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.5"
              />
            ))}

            {/* Latitudes */}
            {latitudeLines.map(lat => (
              <polyline
                key={lat.latDeg}
                points={lat.allPtsStr}
                fill="none"
                stroke={lat.isEquator ? 'var(--color-border-strong)' : 'var(--color-border-subtle)'}
                strokeWidth={lat.isEquator ? 1.5 : 1}
                strokeDasharray={lat.isEquator ? undefined : '2 2'}
                opacity={lat.isEquator ? 0.9 : 0.4}
              />
            ))}

            {/* S1 Axis Line & Label */}
            <line x1={cx} y1={cy} x2={axisS1.x} y2={axisS1.y} stroke="var(--color-laser)" strokeWidth="1.5" />
            <text x={axisS1.x} y={axisS1.y} fill="var(--color-laser)" fontSize="10" fontFamily="var(--font-mono)">
              +S₁ (|H⟩)
            </text>

            {/* S2 Axis Line & Label */}
            <line x1={cx} y1={cy} x2={axisS2.x} y2={axisS2.y} stroke="var(--color-optical)" strokeWidth="1.5" />
            <text x={axisS2.x} y={axisS2.y} fill="var(--color-optical)" fontSize="10" fontFamily="var(--font-mono)">
              +S₂ (|D⟩)
            </text>

            {/* S3 Axis Line & Label (North Pole) */}
            <line x1={cx} y1={cy} x2={axisS3.x} y2={axisS3.y} stroke="var(--color-magnetic)" strokeWidth="1.5" />
            <text x={axisS3.x} y={axisS3.y - 4} fill="var(--color-magnetic)" fontSize="10" fontFamily="var(--font-mono)">
              +S₃ (|R⟩ RHC)
            </text>

            {/* Landmark Preset Points */}
            {presetPoints.map(p => (
              <g key={p.name} opacity={p.proj.depth < 0 ? 0.35 : 1}>
                <circle cx={p.proj.x} cy={p.proj.y} r="3" fill={p.color} />
                <text
                  x={p.proj.x + 5}
                  y={p.proj.y + 3}
                  fill={p.color}
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                >
                  {p.name}
                </text>
              </g>
            ))}

            {/* Trajectory Connecting Polyline */}
            {trajectoryPathStr && (
              <polyline
                points={trajectoryPathStr}
                fill="none"
                stroke="var(--color-laser)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            )}

            {/* Stage Markers along Trajectory */}
            {stageMarkers.map(m => {
              const isSelected = selectedStageIndex === m.stageIndex;
              const isFront = m.proj.depth >= 0;

              return (
                <g
                  key={m.stageIndex}
                  onClick={() => onSelectStage(m.stageIndex)}
                  style={{ cursor: 'pointer' }}
                  opacity={isFront ? 1 : 0.45}
                >
                  {/* Glowing selection ring */}
                  {isSelected && (
                    <circle
                      cx={m.proj.x}
                      cy={m.proj.y}
                      r="9"
                      fill="none"
                      stroke="var(--color-laser)"
                      strokeWidth="2"
                    />
                  )}

                  {/* Marker Circle */}
                  <circle
                    cx={m.proj.x}
                    cy={m.proj.y}
                    r={isSelected ? 6 : 4.5}
                    fill={isSelected ? 'var(--color-laser)' : 'var(--color-bg-surface-elevated)'}
                    stroke="var(--color-laser)"
                    strokeWidth="1.5"
                  />

                  {/* Number Badge */}
                  <text
                    x={m.proj.x}
                    y={m.proj.y + 3}
                    textAnchor="middle"
                    fill={isSelected ? '#000' : 'var(--color-text-primary)'}
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="var(--font-mono)"
                  >
                    {m.stageIndex}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Perspective View Angle Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              backgroundColor: 'rgba(17, 24, 39, 0.85)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: '10px',
              color: 'var(--color-text-muted)'
            }}
          >
            Azimuth: <span className="font-mono text-laser">{azimuthDeg.toFixed(0)}°</span> · Elevation:{' '}
            <span className="font-mono text-laser">{elevationDeg.toFixed(0)}°</span>
          </div>

          {/* Drag instruction hint */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none'
            }}
          >
            Drag to rotate 3D sphere
          </div>
        </div>
      </div>
    </Card>
  );
};
