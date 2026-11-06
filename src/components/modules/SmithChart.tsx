import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { gammaFromNormalizedZ, normalizedZFromGamma, LMatchSolution, Complex } from '../../core/rf-complex';

export interface SmithChartProps {
  rOhms: number;
  xOhms: number;
  z0: number;
  onImpedanceChange: (r: number, x: number) => void;
  onImpedanceCommit?: (prevR: number, prevX: number, nextR: number, nextX: number) => void;
  size?: number;
  matchingSolutions?: LMatchSolution[];
  selectedTopology?: 'Low-Pass' | 'High-Pass' | 'None';
}

export const SmithChart: React.FC<SmithChartProps> = ({
  rOhms,
  xOhms,
  z0,
  onImpedanceChange,
  onImpedanceCommit,
  size = 380,
  matchingSolutions,
  selectedTopology = 'Low-Pass'
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showVswrCircle, setShowVswrCircle] = useState(true);
  const [showYChart, setShowYChart] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const activeTopology = selectedTopology;

  // SVG coordinate dimensions
  const viewBoxSize = 400;
  const cx0 = viewBoxSize / 2; // 200
  const cy0 = viewBoxSize / 2; // 200
  const R0 = 175; // Unit circle radius in SVG px

  // Normalized impedance z = r + jx
  const safeZ0 = z0 > 0 ? z0 : 50;
  const safeR = Math.max(0, isNaN(rOhms) ? 50 : rOhms);
  const safeX = isNaN(xOhms) ? 0 : xOhms;
  const rNorm = safeR / safeZ0;
  const xNorm = safeX / safeZ0;

  // Reflection coefficient Gamma = u + jv
  const gamma = useMemo(() => {
    return gammaFromNormalizedZ({ re: rNorm, im: xNorm });
  }, [rNorm, xNorm]);

  // Clamp cursor position inside unit circle
  const gammaMag = Math.hypot(gamma.re, gamma.im);
  const safeMag = Math.min(0.999999, Math.max(0, isNaN(gammaMag) ? 0 : gammaMag));
  const vswr = (1 + safeMag) / (1 - safeMag);
  const zMax = safeZ0 * vswr;
  const zMin = safeZ0 / vswr;
  const vswrRadiusSvg = Math.min(R0, safeMag * R0);

  const clampedGamma = useMemo(() => {
    if (gammaMag > 0.998) {
      const scale = 0.998 / gammaMag;
      return { re: gamma.re * scale, im: gamma.im * scale };
    }
    return gamma;
  }, [gamma, gammaMag]);

  // Cursor position in SVG coordinates
  const cursorX = cx0 + clampedGamma.re * R0;
  const cursorY = cy0 - clampedGamma.im * R0; // SVG Y is inverted

  const initialZRef = useRef<{ r: number; x: number }>({ r: rOhms, x: xOhms });
  const currentZRef = useRef<{ r: number; x: number }>({ r: rOhms, x: xOhms });

  // Keep currentZRef updated when props change externally
  useEffect(() => {
    currentZRef.current = { r: rOhms, x: xOhms };
  }, [rOhms, xOhms]);

  // Handler to convert SVG pointer coordinates into (R, X)
  const updateImpedanceFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const xPixel = clientX - rect.left;
      const yPixel = clientY - rect.top;

      const xSvg = (xPixel / rect.width) * viewBoxSize;
      const ySvg = (yPixel / rect.height) * viewBoxSize;

      let u = (xSvg - cx0) / R0;
      let v = -(ySvg - cy0) / R0; // Invert SVG y

      const dist = Math.hypot(u, v);
      if (dist >= 0.995) {
        const factor = 0.995 / dist;
        u *= factor;
        v *= factor;
      }

      const z = normalizedZFromGamma({ re: u, im: v });
      const newR = Math.max(0, Math.round(z.re * safeZ0 * 10) / 10);
      const newX = Math.round(z.im * safeZ0 * 10) / 10;
      currentZRef.current = { r: newR, x: newX };
      onImpedanceChange(newR, newX);
    },
    [cx0, cy0, R0, safeZ0, onImpedanceChange]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    initialZRef.current = { r: rOhms, x: xOhms };
    currentZRef.current = { r: rOhms, x: xOhms };
    if (typeof e.currentTarget.setPointerCapture === 'function') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore in environments without pointer capture
      }
    }
    setIsDragging(true);
    updateImpedanceFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      updateImpedanceFromPointer(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (typeof e.currentTarget.releasePointerCapture === 'function') {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored if already released
      }
    }
    setIsDragging(false);

    const startZ = initialZRef.current;
    const endZ = currentZRef.current;
    if ((startZ.r !== endZ.r || startZ.x !== endZ.x) && onImpedanceCommit) {
      onImpedanceCommit(startZ.r, startZ.x, endZ.r, endZ.x);
    }
  };

  // Active solution for trajectory
  const activeSolution = useMemo(() => {
    if (!matchingSolutions || activeTopology === 'None') return null;
    return matchingSolutions.find(s => s.name === activeTopology) || null;
  }, [matchingSolutions, activeTopology]);

  // Compute L-Section Matching Trajectory
  const trajectory = useMemo(() => {
    if (!activeSolution) return null;

    const zL: Complex = { re: safeR, im: safeX };
    const steps = 30;
    const stage1Pts: { x: number; y: number }[] = [];
    const stage2Pts: { x: number; y: number }[] = [];

    const isSeriesFirst = activeSolution.order === 'source-series-shunt-load';
    let intermediateZ: Complex = { re: safeZ0, im: 0 };
    let stage1Label = '';
    let stage2Label = '';

    const toSvg = (z: Complex) => {
      const g = gammaFromNormalizedZ({ re: z.re / safeZ0, im: z.im / safeZ0 });
      const u = isNaN(g.re) ? 0 : g.re;
      const v = isNaN(g.im) ? 0 : g.im;
      const mag = Math.hypot(u, v);
      const scale = mag > 0.995 ? 0.995 / mag : 1;
      return {
        x: cx0 + u * scale * R0,
        y: cy0 - v * scale * R0
      };
    };

    if (isSeriesFirst) {
      // Shunt across load, then series to source
      const shuntEl = activeSolution.elements.loadSide;
      const seriesEl = activeSolution.elements.sourceSide;
      const Bp = shuntEl.reactanceOhms !== 0 ? -1 / shuntEl.reactanceOhms : 0;
      const Xs = seriesEl.reactanceOhms;

      stage1Label = `Shunt ${shuntEl.type} (${shuntEl.valueDisplay}) → const G`;
      stage2Label = `Series ${seriesEl.type} (${seriesEl.valueDisplay}) → const R=50Ω`;

      const denL = zL.re * zL.re + zL.im * zL.im;
      const GL = denL > 0 ? zL.re / denL : 0;
      const BL = denL > 0 ? -zL.im / denL : 0;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const G = GL;
        const B = BL + t * Bp;
        const den = G * G + B * B;
        const zCur = den > 0 ? { re: G / den, im: -B / den } : zL;
        stage1Pts.push(toSvg(zCur));
        if (i === steps) intermediateZ = zCur;
      }

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const zCur = { re: intermediateZ.re, im: intermediateZ.im + t * Xs };
        stage2Pts.push(toSvg(zCur));
      }
    } else {
      // Series with load, then shunt to source
      const seriesEl = activeSolution.elements.loadSide;
      const shuntEl = activeSolution.elements.sourceSide;
      const Xs = seriesEl.reactanceOhms;
      const Bp = shuntEl.reactanceOhms !== 0 ? -1 / shuntEl.reactanceOhms : 0;

      stage1Label = `Series ${seriesEl.type} (${seriesEl.valueDisplay}) → const R`;
      stage2Label = `Shunt ${shuntEl.type} (${shuntEl.valueDisplay}) → const G=20mS`;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const zCur = { re: zL.re, im: zL.im + t * Xs };
        stage1Pts.push(toSvg(zCur));
        if (i === steps) intermediateZ = zCur;
      }

      const denInt = intermediateZ.re * intermediateZ.re + intermediateZ.im * intermediateZ.im;
      const Gint = denInt > 0 ? intermediateZ.re / denInt : 0;
      const Bint = denInt > 0 ? -intermediateZ.im / denInt : 0;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const G = Gint;
        const B = Bint + t * Bp;
        const den = G * G + B * B;
        const zCur = den > 0 ? { re: G / den, im: -B / den } : intermediateZ;
        stage2Pts.push(toSvg(zCur));
      }
    }

    return {
      stage1Pts,
      stage2Pts,
      intermediateZ,
      stage1Label,
      stage2Label,
      intermediateSvg: toSvg(intermediateZ)
    };
  }, [activeSolution, safeR, safeX, safeZ0, cx0, cy0, R0]);

  // Resistance circles: r = 0, 0.2, 0.5, 1.0, 2.0, 5.0
  const rCircles = [0.2, 0.5, 1.0, 2.0, 5.0];
  // Reactance arcs: x = 0.2, 0.5, 1.0, 2.0, 5.0 (+ and -)
  const xArcs = [0.2, 0.5, 1.0, 2.0, 5.0];

  // Y-Chart Admittance (conductance circles & susceptance arcs)
  const gCircles = [0.2, 0.5, 1.0, 2.0, 5.0];
  const bArcs = [0.2, 0.5, 1.0, 2.0, 5.0];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{
          width: '100%',
          maxWidth: `${size}px`,
          height: 'auto',
          aspectRatio: '1 / 1',
          cursor: isDragging ? 'grabbing' : 'crosshair',
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <clipPath id="smith-outer-circle">
            <circle cx={cx0} cy={cy0} r={R0} />
          </clipPath>
          <radialGradient id="smith-bg-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-bg-surface-elevated)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-bg-input)" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* Outer Background Circle */}
        <circle
          cx={cx0}
          cy={cy0}
          r={R0}
          fill="url(#smith-bg-grad)"
          stroke="var(--color-border-strong)"
          strokeWidth="1.5"
        />

        {/* Smith Grid Group clipped to outer boundary */}
        <g clipPath="url(#smith-outer-circle)">
          {/* Horizontal Real Resistance Axis (x = 0) */}
          <line
            x1={cx0 - R0}
            y1={cy0}
            x2={cx0 + R0}
            y2={cy0}
            stroke="var(--color-border-subtle)"
            strokeWidth="1.2"
          />

          {/* Constant Resistance Circles */}
          {rCircles.map(r => {
            const circleCenterSvgX = cx0 + (r / (1 + r)) * R0;
            const circleRadiusSvg = (1 / (1 + r)) * R0;
            const isMatch = Math.abs(r - 1.0) < 1e-4;

            return (
              <circle
                key={`r-${r}`}
                cx={circleCenterSvgX}
                cy={cy0}
                r={circleRadiusSvg}
                fill="none"
                stroke={isMatch ? 'var(--color-rf)' : 'var(--color-border-subtle)'}
                strokeWidth={isMatch ? '1.5' : '0.8'}
                strokeOpacity={isMatch ? '0.75' : '0.45'}
              />
            );
          })}

          {/* Constant Reactance Arcs */}
          {xArcs.map(x => {
            // Inductive Arc (+x)
            const arcRadius = (1 / x) * R0;

            // Start point on unit circle boundary
            const uEdge = (x * x - 1) / (x * x + 1);
            const vEdge = (2 * x) / (x * x + 1);

            const xStart = cx0 + uEdge * R0;
            const yStartPos = cy0 - vEdge * R0;
            const yStartNeg = cy0 + vEdge * R0;

            const xEnd = cx0 + R0;
            const yEnd = cy0;

            return (
              <React.Fragment key={`x-${x}`}>
                {/* Upper arc: +x (Inductive) */}
                <path
                  d={`M ${xStart} ${yStartPos} A ${arcRadius} ${arcRadius} 0 0 0 ${xEnd} ${yEnd}`}
                  fill="none"
                  stroke="var(--color-border-subtle)"
                  strokeWidth="0.8"
                  strokeOpacity="0.4"
                />
                {/* Lower arc: -x (Capacitive) */}
                <path
                  d={`M ${xStart} ${yStartNeg} A ${arcRadius} ${arcRadius} 0 0 1 ${xEnd} ${yEnd}`}
                  fill="none"
                  stroke="var(--color-border-subtle)"
                  strokeWidth="0.8"
                  strokeOpacity="0.4"
                />
              </React.Fragment>
            );
          })}

          {/* Optional Y-Chart (Admittance) Grid: Conductance Circles & Susceptance Arcs */}
          {showYChart && (
            <g id="smith-y-chart-grid">
              {/* Constant Conductance (g) Circles - tangent to left pole (0Ω / ∞S) */}
              {gCircles.map(g => {
                const circleCenterSvgX = cx0 - (g / (1 + g)) * R0;
                const circleRadiusSvg = (1 / (1 + g)) * R0;
                const isMatchG = Math.abs(g - 1.0) < 1e-4;

                return (
                  <circle
                    key={`g-${g}`}
                    cx={circleCenterSvgX}
                    cy={cy0}
                    r={circleRadiusSvg}
                    fill="none"
                    stroke={isMatchG ? '#10b981' : '#059669'}
                    strokeWidth={isMatchG ? '1.5' : '0.8'}
                    strokeDasharray="2 3"
                    strokeOpacity={isMatchG ? '0.85' : '0.4'}
                  />
                );
              })}

              {/* Constant Susceptance (b) Arcs */}
              {bArcs.map(b => {
                const arcRadius = (1 / b) * R0;
                const uEdge = (1 - b * b) / (1 + b * b);
                const vEdge = (2 * b) / (1 + b * b);

                const xStart = cx0 + uEdge * R0;
                const yStartCap = cy0 + vEdge * R0;
                const yStartInd = cy0 - vEdge * R0;

                const xEnd = cx0 - R0;
                const yEnd = cy0;

                return (
                  <React.Fragment key={`b-${b}`}>
                    {/* Capacitive Susceptance Arc (+b) */}
                    <path
                      d={`M ${xStart} ${yStartCap} A ${arcRadius} ${arcRadius} 0 0 1 ${xEnd} ${yEnd}`}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="0.8"
                      strokeDasharray="2 3"
                      strokeOpacity="0.35"
                    />
                    {/* Inductive Susceptance Arc (-b) */}
                    <path
                      d={`M ${xStart} ${yStartInd} A ${arcRadius} ${arcRadius} 0 0 0 ${xEnd} ${yEnd}`}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="0.8"
                      strokeDasharray="2 3"
                      strokeOpacity="0.35"
                    />
                  </React.Fragment>
                );
              })}
            </g>
          )}

          {/* Reference matched center dot (r = 1.0, x = 0) */}
          <circle cx={cx0} cy={cy0} r="3" fill="var(--color-text-muted)" opacity="0.6" />
        </g>

        {/* Transmission Line Directional Guides (Perimeter) */}
        <text
          x={cx0}
          y="14"
          fill="var(--color-rf)"
          fontSize="8"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          opacity="0.8"
        >
          Toward Generator ↻ (1 turn = λ/2)
        </text>
        <text
          x={cx0}
          y="393"
          fill="var(--color-text-muted)"
          fontSize="8"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          opacity="0.65"
        >
          ↺ Toward Load
        </text>

        {/* Center label */}
        <text
          x={cx0}
          y={cy0 - 13}
          fill="var(--color-text-muted)"
          fontSize="7.5"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          opacity="0.65"
        >
          r = 1.0
        </text>
        <text
          x={cx0}
          y={cy0 - 4}
          fill="var(--color-rf)"
          fontSize="9.5"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontWeight="bold"
          opacity="0.95"
        >
          {safeZ0}Ω Matched
        </text>

        {/* Labels at key poles */}
        <text
          x={cx0 - R0 + 8}
          y={cy0 - 4}
          fill="var(--color-text-muted)"
          fontSize="9"
          fontFamily="var(--font-mono)"
          opacity="0.8"
        >
          0Ω (Short)
        </text>
        <text
          x={cx0 + R0 - 6}
          y={cy0 - 4}
          fill="var(--color-text-muted)"
          fontSize="9"
          fontFamily="var(--font-mono)"
          textAnchor="end"
          opacity="0.8"
        >
          ∞ (Open)
        </text>
        <text
          x={cx0}
          y={cy0 - R0 + 16}
          fill="var(--color-text-muted)"
          fontSize="9"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
          opacity="0.75"
        >
          +jX (Inductive)
        </text>
        <text
          x={cx0}
          y={cy0 + R0 - 8}
          fill="var(--color-text-muted)"
          fontSize="9"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
          opacity="0.75"
        >
          -jX (Capacitive)
        </text>

        {/* Real axis resistance value labels (r = 0.2, 0.5, 2.0, 5.0) */}
        {[
          { r: 0.2, label: '0.2', ohms: `${(safeZ0 * 0.2).toFixed(0)}Ω` },
          { r: 0.5, label: '0.5', ohms: `${(safeZ0 * 0.5).toFixed(0)}Ω` },
          { r: 2.0, label: '2.0', ohms: `${(safeZ0 * 2.0).toFixed(0)}Ω` },
          { r: 5.0, label: '5.0', ohms: `${(safeZ0 * 5.0).toFixed(0)}Ω` }
        ].map(({ r, label, ohms }) => {
          const xPos = cx0 + ((r - 1) / (r + 1)) * R0;
          return (
            <g key={`r-lbl-${r}`}>
              <text
                x={xPos}
                y={cy0 + 10}
                fill="var(--color-text-muted)"
                fontSize="7.5"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                opacity="0.75"
              >
                {label}
              </text>
              <text
                x={xPos}
                y={cy0 + 17}
                fill="var(--color-text-muted)"
                fontSize="5.5"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                opacity="0.5"
              >
                {ohms}
              </text>
            </g>
          );
        })}

        {/* Outer boundary reactance arc labels */}
        {[
          { xVal: 0.2, label: '+0.2j', isPos: true },
          { xVal: 0.5, label: '+0.5j', isPos: true },
          { xVal: 1.0, label: '+1.0j', isPos: true },
          { xVal: 2.0, label: '+2.0j', isPos: true },
          { xVal: 5.0, label: '+5.0j', isPos: true },
          { xVal: 0.2, label: '-0.2j', isPos: false },
          { xVal: 0.5, label: '-0.5j', isPos: false },
          { xVal: 1.0, label: '-1.0j', isPos: false },
          { xVal: 2.0, label: '-2.0j', isPos: false },
          { xVal: 5.0, label: '-5.0j', isPos: false }
        ].map(({ xVal, label, isPos }) => {
          const uEdge = (xVal * xVal - 1) / (xVal * xVal + 1);
          const vEdge = (2 * xVal) / (xVal * xVal + 1);
          const xLbl = cx0 + uEdge * (R0 - 12);
          const yLbl = isPos ? cy0 - vEdge * (R0 - 12) + 3 : cy0 + vEdge * (R0 - 12) + 3;
          return (
            <text
              key={`x-lbl-${label}`}
              x={xLbl}
              y={yLbl}
              fill="var(--color-text-muted)"
              fontSize="6.5"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              opacity="0.55"
            >
              {label}
            </text>
          );
        })}

        {/* Constant |Γ| (VSWR) Circle centered at (cx0, cy0) through load impedance */}
        {showVswrCircle && vswrRadiusSvg > 3 && (
          <g>
            <circle
              cx={cx0}
              cy={cy0}
              r={vswrRadiusSvg}
              fill="var(--color-rf)"
              fillOpacity="0.04"
              stroke="var(--color-rf)"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              strokeOpacity="0.75"
            />

            {/* Z_max marker on real axis (right side) */}
            <circle
              cx={cx0 + vswrRadiusSvg}
              cy={cy0}
              r="3"
              fill="var(--color-rf)"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
            {vswrRadiusSvg > 20 && (
              <text
                x={cx0 + vswrRadiusSvg}
                y={cy0 - 6}
                fill="var(--color-rf)"
                fontSize="7"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                fontWeight="bold"
              >
                Z_max
              </text>
            )}

            {/* Z_min marker on real axis (left side) */}
            <circle
              cx={cx0 - vswrRadiusSvg}
              cy={cy0}
              r="3"
              fill="var(--color-rf)"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
            {vswrRadiusSvg > 20 && (
              <text
                x={cx0 - vswrRadiusSvg}
                y={cy0 - 6}
                fill="var(--color-rf)"
                fontSize="7"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                fontWeight="bold"
              >
                Z_min
              </text>
            )}
          </g>
        )}

        {/* L-Section Matching Trajectory (Stage 1 & Stage 2) */}
        {trajectory && (
          <g id="smith-matching-trajectory">
            {/* Stage 1 Path (Load Z_L -> Z_int) */}
            <path
              d={trajectory.stage1Pts
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.6))' }}
            />

            {/* Stage 2 Path (Z_int -> 50Ω Center) */}
            <path
              d={trajectory.stage2Pts
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 3px rgba(56, 189, 248, 0.6))' }}
            />

            {/* Intermediate Node Dot (Z_int) */}
            <circle
              cx={trajectory.intermediateSvg.x}
              cy={trajectory.intermediateSvg.y}
              r="4.5"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="1.5"
            />

            {/* Intermediate Node Tooltip Label */}
            <g
              transform={`translate(${trajectory.intermediateSvg.x}, ${
                trajectory.intermediateSvg.y < 80
                  ? trajectory.intermediateSvg.y + 18
                  : trajectory.intermediateSvg.y - 12
              })`}
              style={{ pointerEvents: 'none' }}
            >
              <rect
                x="-36"
                y="-9"
                width="72"
                height="16"
                rx="3"
                fill="var(--color-bg-base)"
                stroke="#f59e0b"
                strokeWidth="1"
                opacity="0.95"
              />
              <text
                x="0"
                y="3"
                fill="#f59e0b"
                fontSize="7.5"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                fontWeight="bold"
              >
                Z_int: {trajectory.intermediateZ.re.toFixed(1)}
                {trajectory.intermediateZ.im >= 0 ? '+' : '-'}j
                {Math.abs(trajectory.intermediateZ.im).toFixed(1)}Ω
              </text>
            </g>
          </g>
        )}

        {/* Vector line from center to current cursor */}
        <line
          x1={cx0}
          y1={cy0}
          x2={cursorX}
          y2={cursorY}
          stroke="var(--color-rf)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          opacity="0.6"
        />

        {/* Draggable Load Impedance Point */}
        <circle
          cx={cursorX}
          cy={cursorY}
          r={isDragging ? 9 : 7}
          fill="var(--color-rf)"
          stroke="#FFFFFF"
          strokeWidth="2"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            transition: isDragging ? 'none' : 'r 0.15s ease'
          }}
        />

        {/* Current position readout tooltip in SVG */}
        <g
          transform={`translate(${Math.max(50, Math.min(viewBoxSize - 120, cursorX - 45))}, ${
            cursorY < 60 ? cursorY + 18 : cursorY - 30
          })`}
          style={{ pointerEvents: 'none' }}
        >
          <rect
            x="0"
            y="0"
            width="90"
            height="22"
            rx="4"
            fill="var(--color-bg-base)"
            stroke="var(--color-border-subtle)"
            strokeWidth="1"
            opacity="0.9"
          />
          <text
            x="45"
            y="14"
            fill="var(--color-text-primary)"
            fontSize="10"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            fontWeight="bold"
          >
            {safeR.toFixed(1)} {safeX >= 0 ? `+ j${safeX.toFixed(1)}` : `- j${Math.abs(safeX).toFixed(1)}`}Ω
          </text>
        </g>
      </svg>

      {/* Active Matching Path Route Banner */}
      {trajectory && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            maxWidth: `${size}px`,
            marginTop: '6px',
            padding: '6px 10px',
            backgroundColor: 'var(--color-bg-base)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '11px',
            lineHeight: 1.3
          }}
        >
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>
            ① {trajectory.stage1Label}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>➔</span>
          <span
            style={{
              padding: '1px 5px',
              backgroundColor: 'var(--color-bg-surface-elevated)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid #f59e0b',
              color: '#f59e0b',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              fontSize: '10px'
            }}
          >
            Z_int: {trajectory.intermediateZ.re.toFixed(1)}
            {trajectory.intermediateZ.im >= 0 ? '+' : '-'}j
            {Math.abs(trajectory.intermediateZ.im).toFixed(1)}Ω
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>➔</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>
            ② {trajectory.stage2Label}
          </span>
        </div>
      )}

      {/* Interactive VSWR Circle Toolbar & Impedance Extrema */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          width: '100%',
          maxWidth: `${size}px`,
          marginTop: '8px',
          padding: '6px 10px',
          backgroundColor: 'var(--color-bg-base)',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--color-border-subtle)',
          fontSize: 'var(--font-size-2xs)'
        }}
      >
        {/* Buttons Row - strictly on a single line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            width: '100%',
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setShowVswrCircle(!showVswrCircle)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 7px',
                borderRadius: 'var(--radius-xs)',
                border: `1px solid ${showVswrCircle ? 'var(--color-rf)' : 'var(--color-border-subtle)'}`,
                backgroundColor: showVswrCircle ? 'var(--color-rf-badge)' : 'transparent',
                color: showVswrCircle ? 'var(--color-rf)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '11px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: showVswrCircle ? 'var(--color-rf)' : 'var(--color-text-muted)'
                }}
              />
              VSWR Circle: {showVswrCircle ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => setShowYChart(!showYChart)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 7px',
                borderRadius: 'var(--radius-xs)',
                border: `1px solid ${showYChart ? '#10b981' : 'var(--color-border-subtle)'}`,
                backgroundColor: showYChart ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: showYChart ? '#10b981' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '11px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: showYChart ? '#10b981' : 'var(--color-text-muted)'
                }}
              />
              Y-Chart: {showYChart ? 'ON' : 'OFF'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              border: `1px solid ${showGuide ? 'var(--color-rf)' : 'var(--color-border-subtle)'}`,
              backgroundColor: showGuide ? 'var(--color-rf-badge)' : 'transparent',
              color: showGuide ? 'var(--color-rf)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px'
            }}
          >
            Chart Guide {showGuide ? '▲' : '▼'}
          </button>
        </div>

        {/* Extrema Readout Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--color-border-subtle)',
            paddingTop: '5px',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px'
          }}
        >
          <span>Line Extrema:</span>
          <span>
            Z_max:{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {zMax >= 1000 ? `${(zMax / 1000).toFixed(2)} kΩ` : `${zMax.toFixed(1)} Ω`}
            </strong>{' '}
            · Z_min:{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {zMin.toFixed(1)} Ω
            </strong>
          </span>
        </div>
      </div>

      {/* Collapsible Explanatory Guide */}
      {showGuide && (
        <div
          style={{
            width: '100%',
            maxWidth: `${size}px`,
            marginTop: '6px',
            padding: '10px 12px',
            backgroundColor: 'var(--color-bg-base)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '11px',
            lineHeight: '1.45',
            color: 'var(--color-text-secondary)'
          }}
        >
          <div style={{ fontWeight: 'bold', color: 'var(--color-rf)', marginBottom: '4px' }}>
            📖 How to Read This Smith Chart:
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>
              <strong>Center Dot ({safeZ0}Ω Matched)</strong>: Perfect match (|Γ| = 0, VSWR = 1:1). All RF power is delivered to the load with zero reflection.
            </li>
            <li>
              <strong>Horizontal Equator (Pure R)</strong>: Reactance X = 0. Left pole is <strong>0Ω Short</strong> (|Γ| = 1, ∠180°), right pole is <strong>∞ Open</strong> (|Γ| = 1, ∠0°).
            </li>
            <li>
              <strong>Top vs Bottom Half</strong>: Top half is <strong>+jX Inductive</strong> (coils, magnetic fields). Bottom half is <strong>-jX Capacitive</strong> (plates, electric fields).
            </li>
            <li>
              <strong>Circles vs Arcs</strong>: Circles tangent to the right pole represent constant resistance (R = r · Z₀). Arcs represent constant reactance (X = x · Z₀).
            </li>
            <li>
              <strong>Dashed VSWR Circle</strong>: Moving along a transmission line rotates around this circle. One full revolution (360°) represents half a wavelength (λ/2). Clockwise = Toward Generator.
            </li>
            <li>
              <strong>L-Section Matching Trajectory</strong>: When active, shows the 2-step journey from load to center. The <strong style={{ color: '#f59e0b' }}>Amber path</strong> is Stage 1 (moving from load to the intermediate junction node <strong>Z_int</strong>). The <strong style={{ color: '#38bdf8' }}>Sky Blue path</strong> is Stage 2 (moving from Z_int straight into the <strong>50Ω bullseye</strong>).
            </li>
            <li>
              <strong>Y-Chart Grid (Green Dashed)</strong>: Overlays the <em>Admittance</em> plane. Green dashed circles represent <strong>constant conductance (G)</strong> tangent to the left pole (0Ω / ∞S). Parallel (shunt) inductors and capacitors travel along these green circles!
            </li>
            <li>
              <strong>Matching Strategy</strong>: Series L/C moves along constant resistance circles; shunt L/C moves along constant conductance circles into the center {safeZ0}Ω.
            </li>
          </ul>
        </div>
      )}

      <div
        style={{
          marginTop: '6px',
          fontSize: 'var(--font-size-2xs)',
          color: 'var(--color-text-muted)',
          textAlign: 'center'
        }}
      >
        Click or drag cursor on Smith Chart to adjust complex load impedance Z_L
      </div>
    </div>
  );
};
