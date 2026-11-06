import { describe, it, expect } from 'vitest';
import {
  matrix2x2,
  transformQ,
  getBeamRadiusFromQ,
  getWavefrontCurvatureFromQ,
  createWaistQ,
  simulateBeamPropagation
} from '../beam-abcd';

describe('ABCD Matrix Gaussian Beam Propagation Engine', () => {
  it('maintains unit determinant for unimodular optical ray matrices', () => {
    const drift = matrix2x2.drift(0.15); // 150 mm drift
    expect(matrix2x2.determinant(drift)).toBeCloseTo(1.0, 6);

    const thin = matrix2x2.thinLens(0.1); // 100 mm lens
    expect(matrix2x2.determinant(thin)).toBeCloseTo(1.0, 6);

    // Thick lens: R1 = +50mm, R2 = -50mm, d = 5mm, n = 1.5168
    const thick = matrix2x2.thickLens(0.05, -0.05, 0.005, 1.5168);
    expect(matrix2x2.determinant(thick)).toBeCloseTo(1.0, 6);

    // Combined system: drift + lens + drift
    const system = matrix2x2.multiply(
      matrix2x2.drift(0.2),
      matrix2x2.multiply(thin, matrix2x2.drift(0.1))
    );
    expect(matrix2x2.determinant(system)).toBeCloseTo(1.0, 6);
  });

  it('accurately reproduces free-space Gaussian beam expansion', () => {
    // 780 nm beam with 100 um initial waist
    const lambda = 780e-9;
    const w0 = 100e-6; // 100 um
    const zR = (Math.PI * w0 * w0) / lambda; // ~40.27 mm

    const q0 = createWaistQ(w0, lambda);
    expect(q0.re).toBe(0);
    expect(q0.im).toBeCloseTo(zR, 5);

    // At z = zR, beam radius should expand by sqrt(2)
    const driftZR = matrix2x2.drift(zR);
    const qAtZR = transformQ(driftZR, q0);
    const wAtZR = getBeamRadiusFromQ(qAtZR, lambda);

    expect(wAtZR).toBeCloseTo(w0 * Math.SQRT2, 7);

    // Wavefront radius of curvature at zR should be 2 * zR
    const RAtZR = getWavefrontCurvatureFromQ(qAtZR);
    expect(RAtZR).toBeCloseTo(2 * zR, 4);
  });

  it('calculates thick lens matrix matching thick lensmaker formula', () => {
    // Symmetrical biconvex lens: R1 = 50 mm, R2 = -50 mm, d = 5 mm, n = 1.5
    const R1 = 0.05;
    const R2 = -0.05;
    const d = 0.005;
    const n = 1.5;

    const thickM = matrix2x2.thickLens(R1, R2, d, n);

    // Thick lensmaker formula for 1/f:
    // 1/f = (n - 1) * (1/R1 - 1/R2 + ((n - 1)*d) / (n * R1 * R2))
    const c1 = 1 / R1;
    const c2 = 1 / R2;
    const invFExpected = (n - 1) * (c1 - c2 + ((n - 1) * d * c1 * c2) / n);
    const fExpected = 1 / invFExpected;

    // In ABCD matrix, C = -1/f
    expect(-thickM.C).toBeCloseTo(invFExpected, 4);
    expect(1 / -thickM.C).toBeCloseTo(fExpected, 4);
  });

  it('accurately simulates beam focusing and detects secondary waists', () => {
    // 100 um waist at 780 nm
    // Lens of f = 50 mm at z = 100 mm on a 300 mm optical rail
    const sim = simulateBeamPropagation({
      initialWaistUm: 100,
      wavelengthNm: 780,
      powerWatts: 0.01,
      zMaxMm: 300,
      numSamples: 150,
      elements: [
        {
          id: 'lens1',
          name: 'Test Lens',
          type: 'thin-lens',
          positionZMm: 100,
          focalLengthMm: 50,
          enabled: true
        }
      ]
    });

    expect(sim.samples.length).toBe(150);
    expect(sim.waists.length).toBeGreaterThanOrEqual(1);

    // The initial waist is at z = 0 mm
    const initialWaist = sim.waists.find(w => w.segmentIndex === 0);
    expect(initialWaist).toBeDefined();
    expect(initialWaist?.positionZMm).toBeCloseTo(0, 1);
    expect(initialWaist?.waistRadiusUm).toBeCloseTo(100, 1);

    // A secondary waist should be detected after the lens (z > 100 mm)
    const secondaryWaist = sim.waists.find(w => w.segmentIndex === 1 && w.isReal);
    expect(secondaryWaist).toBeDefined();
    expect(secondaryWaist!.positionZMm).toBeGreaterThan(100);
    expect(secondaryWaist!.positionZMm).toBeLessThan(300);
    expect(secondaryWaist!.waistRadiusUm).toBeGreaterThan(0);
  });

  it('accurately advances position through thick lens and simulates secondary focus', () => {
    // Thick lens at z = 100 mm with thickness d = 10 mm
    const sim = simulateBeamPropagation({
      initialWaistUm: 100,
      wavelengthNm: 780,
      powerWatts: 0.01,
      zMaxMm: 400,
      elements: [
        {
          id: 'thick-test',
          name: 'Thick Lens Test',
          type: 'thick-lens',
          positionZMm: 100,
          frontCurvatureR1Mm: 60,
          backCurvatureR2Mm: -60,
          thicknessMm: 10,
          refractiveIndex: 1.5168,
          enabled: true
        }
      ]
    });

    expect(sim.segments.length).toBe(2);
    // Segment 0: 0 to 100 mm
    expect(sim.segments[0].startZMeters).toBeCloseTo(0, 4);
    expect(sim.segments[0].endZMeters).toBeCloseTo(0.1, 4);

    // Segment 1 (after thick lens): starts at 100 mm + 10 mm = 110 mm
    expect(sim.segments[1].startZMeters).toBeCloseTo(0.11, 4);
    expect(sim.segments[1].endZMeters).toBeCloseTo(0.4, 4);

    // The secondary waist must be detected after the back surface (z > 110 mm)
    const secondaryWaist = sim.waists.find(w => w.segmentIndex === 1 && w.isReal);
    expect(secondaryWaist).toBeDefined();
    expect(secondaryWaist!.positionZMm).toBeGreaterThan(110);
  });

  it('correctly marks virtual waists as isReal: false for diverging lenses', () => {
    // Diverging lens: f = -50 mm at z = 100 mm
    const sim = simulateBeamPropagation({
      initialWaistUm: 100,
      wavelengthNm: 780,
      zMaxMm: 400,
      elements: [
        {
          id: 'neg-lens',
          name: 'Diverging Lens',
          type: 'thin-lens',
          positionZMm: 100,
          focalLengthMm: -50,
          enabled: true
        }
      ]
    });

    // The secondary waist is virtual (behind the lens, z < 100 mm)
    const waistAfterLens = sim.waists.find(w => w.segmentIndex === 1);
    expect(waistAfterLens).toBeDefined();
    expect(waistAfterLens!.isReal).toBe(false);
    expect(waistAfterLens!.positionZMm).toBeLessThan(100);
  });

  it('safely handles zero / invalid element configurations without crashing', () => {
    const sim = simulateBeamPropagation({
      initialWaistUm: 0,
      wavelengthNm: 0,
      zMaxMm: 0,
      elements: []
    });

    expect(sim.samples.length).toBeGreaterThan(0);
    expect(sim.waists).toBeDefined();
  });
});
