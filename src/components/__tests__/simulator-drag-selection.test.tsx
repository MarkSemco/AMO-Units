import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { PoincareSphereVisualizer } from '../modules/polarization/PoincareSphereVisualizer';
import { PolarizationWave3DVisualizer } from '../modules/polarization/PolarizationWave3DVisualizer';
import { SmithChart } from '../modules/SmithChart';
import { BeamPropagationCanvas } from '../modules/BeamPropagationCanvas';
import { complex, StageResult } from '../../core/polarization';

describe('Simulator Drag Selection Prevention', () => {
  const dummyJones = {
    Ex: complex(1, 0),
    Ey: complex(0, 0)
  };

  const dummyStage: StageResult = {
    stageIndex: 0,
    opticName: 'Input',
    jones: dummyJones,
    stokes: { s0: 1, s1: 1, s2: 0, s3: 0 },
    normalizedStokes: { s0: 1, s1: 1, s2: 0, s3: 0 },
    poincare: {
      s1Norm: 1,
      s2Norm: 0,
      s3Norm: 0,
      longitudeDeg: 0,
      latitudeDeg: 0
    },
    ellipse: {
      psiDeg: 0,
      chiDeg: 0,
      axialRatio: 0,
      semiMajor: 1,
      semiMinor: 0,
      handedness: 'linear' as const,
      description: 'Horizontal Linear'
    },
    powerTransmissionPercent: 100,
    stepTransmissionPercent: 100
  };

  it('prevents default and toggles is-sim-dragging on document.body in PoincareSphereVisualizer', () => {
    const { container } = render(
      <PoincareSphereVisualizer
        stages={[dummyStage]}
        selectedStageIndex={0}
        onSelectStage={vi.fn()}
      />
    );

    const canvas = container.querySelector('.simulator-canvas') as HTMLElement;
    expect(canvas).toBeInTheDocument();
    expect(canvas.style.userSelect).toBe('none');

    // Mousedown starts drag
    act(() => {
      fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 });
    });
    expect(document.body.classList.contains('is-sim-dragging')).toBe(true);

    // Mouseup ends drag
    act(() => {
      fireEvent.mouseUp(window);
    });
    expect(document.body.classList.contains('is-sim-dragging')).toBe(false);
  });

  it('prevents default and toggles is-sim-dragging on document.body in PolarizationWave3DVisualizer', () => {
    const { container } = render(
      <PolarizationWave3DVisualizer
        stages={[dummyStage]}
        selectedStageIndex={0}
        onSelectStage={vi.fn()}
      />
    );

    const canvas = container.querySelector('.simulator-canvas') as HTMLElement;
    expect(canvas).toBeInTheDocument();
    expect(canvas.style.userSelect).toBe('none');

    act(() => {
      fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 });
    });
    expect(document.body.classList.contains('is-sim-dragging')).toBe(true);

    act(() => {
      fireEvent.mouseUp(window);
    });
    expect(document.body.classList.contains('is-sim-dragging')).toBe(false);
  });

  it('prevents default and toggles is-sim-dragging in SmithChart', () => {
    const { container } = render(
      <SmithChart
        rOhms={50}
        xOhms={25}
        z0={50}
        onImpedanceChange={vi.fn()}
        onImpedanceCommit={vi.fn()}
      />
    );

    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).toBeInTheDocument();

    act(() => {
      fireEvent.pointerDown(svg, { clientX: 150, clientY: 150 });
    });
    expect(document.body.classList.contains('is-sim-dragging')).toBe(true);

    act(() => {
      fireEvent.pointerUp(svg);
    });
    expect(document.body.classList.contains('is-sim-dragging')).toBe(false);
  });

  it('prevents default and toggles is-sim-dragging in BeamPropagationCanvas caliper drag', () => {
    const { container } = render(
      <BeamPropagationCanvas
        initialWaistUm={100}
        wavelengthNm={1064}
      />
    );

    const caliper = container.querySelector('g[style*="cursor: ew-resize"]') as SVGGElement;
    expect(caliper).toBeInTheDocument();

    act(() => {
      fireEvent.pointerDown(caliper, { clientX: 200, clientY: 100, pointerId: 1 });
    });
    expect(document.body.classList.contains('is-sim-dragging')).toBe(true);

    const svg = container.querySelector('svg') as SVGSVGElement;
    act(() => {
      fireEvent.pointerUp(svg, { pointerId: 1 });
    });
    expect(document.body.classList.contains('is-sim-dragging')).toBe(false);
  });
});
