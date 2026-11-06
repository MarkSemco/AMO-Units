import { describe, it, expect } from 'vitest';
import {
  deriveOpticalQuantities,
  energyFromWavelength,
  energyFromFrequency,
  energyFromElectronVolts,
  energyFromWavenumber,
  energyFromTemperature
} from '../../optical';
import { calculateComplexGamma } from '../../rf-complex';
import { matrix2x2 } from '../../beam-abcd';

describe('Mathematical Symmetry & Invariance Property Suite', () => {
  it('guarantees bidirectional loss-less identity across optical representations across 5 decades of frequency', () => {
    const testFrequenciesHz = [
      1e9,    // 1 GHz (Microwave / Hyperfine)
      1e12,   // 1 THz (Far Infrared)
      3.84e14, // 384 THz (Rb D2 line)
      6.50e14, // 650 THz (Sr 461nm blue line)
      3e15    // 3 PHz (Vacuum UV)
    ];

    for (const freq of testFrequenciesHz) {
      const e0 = energyFromFrequency(freq);
      const q = deriveOpticalQuantities(e0);

      const relErr = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

      // Round-trip from wavelength
      const eFromLambda = energyFromWavelength(q.wavelength.m);
      expect(relErr(eFromLambda, e0)).toBeLessThan(1e-12);

      // Round-trip from eV
      const eFromEv = energyFromElectronVolts(q.energy.eV);
      expect(relErr(eFromEv, e0)).toBeLessThan(1e-12);

      // Round-trip from wavenumber
      const eFromWn = energyFromWavenumber(q.wavenumber.cmInv);
      expect(relErr(eFromWn, e0)).toBeLessThan(1e-12);

      // Round-trip from temperature
      const eFromT = energyFromTemperature(q.temperature.K);
      expect(relErr(eFromT, e0)).toBeLessThan(1e-12);
    }
  });

  it('proves Smith Chart passive stability invariant: |Gamma| <= 1.0 for all R >= 0', () => {
    const testR = [0, 0.01, 1, 10, 50, 75, 100, 1000, 100000];
    const testX = [-10000, -100, -50, -1, 0, 1, 50, 100, 10000];

    for (const r of testR) {
      for (const x of testX) {
        const res50 = calculateComplexGamma({ re: r, im: x }, 50);
        expect(res50.mag).toBeLessThanOrEqual(1.0000001);
        expect(res50.realPowerPercent).toBeGreaterThanOrEqual(-1e-6);
        expect(res50.reflectedPowerPercent).toBeLessThanOrEqual(100.000001);
        expect(res50.vswr).toBeGreaterThanOrEqual(1.0);

        const res75 = calculateComplexGamma({ re: r, im: x }, 75);
        expect(res75.mag).toBeLessThanOrEqual(1.0000001);
        expect(res75.vswr).toBeGreaterThanOrEqual(1.0);
      }
    }
  });

  it('guarantees unitary ray transfer matrix determinant det(M) = 1 for all drift & lens cascades', () => {
    const drifts = [0.01, 0.05, 0.1, 0.5, 2.0];
    const thinFocals = [0.025, 0.05, 0.1, 0.2, -0.05, -0.1];

    for (const d of drifts) {
      const mD = matrix2x2.drift(d);
      expect(matrix2x2.determinant(mD)).toBeCloseTo(1.0, 12);
    }

    for (const f of thinFocals) {
      const mL = matrix2x2.thinLens(f);
      expect(matrix2x2.determinant(mL)).toBeCloseTo(1.0, 12);
    }

    // Cascade of 5 elements
    const cascade = matrix2x2.multiply(
      matrix2x2.multiply(
        matrix2x2.drift(0.1),
        matrix2x2.thinLens(0.05)
      ),
      matrix2x2.multiply(
        matrix2x2.drift(0.2),
        matrix2x2.thinLens(-0.025)
      )
    );
    expect(matrix2x2.determinant(cascade)).toBeCloseTo(1.0, 11);
  });
});
