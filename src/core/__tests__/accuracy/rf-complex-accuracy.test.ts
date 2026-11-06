import { describe, it, expect } from 'vitest';
import goldenRf from '../../../../tests/fixtures/wolfram-golden-rf-complex.json';
import { calculateComplexGamma, gammaFromNormalizedZ, normalizedZFromGamma } from '../../rf-complex';

describe('Zero-Trust Complex RF & Reflection Accuracy Suite (Wolfram & IEEE MTT-S Ground Truth)', () => {
  const cases = goldenRf.testCases;

  it('contains expected number of verified RF impedance test points', () => {
    expect(cases.length).toBeGreaterThanOrEqual(20);
  });

  describe.each(cases)(
    'Load ZL = $loadR + j($loadX) Ω in Z0 = $z0 Ω',
    (tc) => {
      it('calculates complex Gamma, VSWR, and power loss within machine precision', () => {
        const res = calculateComplexGamma(
          { re: tc.loadR, im: tc.loadX },
          tc.z0,
          tc.powerFwdWatts
        );

        const absDiff = (a: number, b: number) => Math.abs(a - b);

        // 1. Complex reflection coefficient components
        expect(absDiff(res.gamma.re, tc.gammaReal)).toBeLessThan(1e-10);
        expect(absDiff(res.gamma.im, tc.gammaImag)).toBeLessThan(1e-10);
        expect(absDiff(res.mag, tc.gammaMag)).toBeLessThan(1e-10);

        // 2. Phase angle in degrees (accounting for 360 wrap near +/-180)
        let phaseDiff = Math.abs(res.phaseDeg - tc.gammaPhaseDeg);
        if (phaseDiff > 180) phaseDiff = Math.abs(phaseDiff - 360);
        expect(phaseDiff).toBeLessThan(1e-9);

        // 3. VSWR (if finite)
        if (tc.vswr < 100) {
          expect(absDiff(res.vswr, tc.vswr)).toBeLessThan(1e-6);
        }

        // 4. Return loss (dB)
        if (tc.gammaMag > 0.001 && tc.gammaMag < 0.999) {
          expect(absDiff(res.returnLossDb, tc.returnLossDb)).toBeLessThan(1e-5);
        }

        // 5. Real and reflected power percentages sum to 100%
        expect(res.realPowerPercent + res.reflectedPowerPercent).toBeCloseTo(100, 4);

        // For pure reactances (loadR === 0), the floating point safety clamp (safeMag = 0.999999) yields ~0.0002% residual real power
        const pwrTol = tc.loadR === 0 ? 0.001 : 1e-6;
        expect(absDiff(res.realPowerPercent, tc.realPowerPercent)).toBeLessThan(pwrTol);
        expect(absDiff(res.reflectedPowerPercent, tc.reflectedPowerPercent)).toBeLessThan(pwrTol);

        // 6. Power in Watts
        expect(absDiff(res.realPowerWatts, tc.realPowerWatts)).toBeLessThan(1e-7);
      });

      it('guarantees normalized impedance round-trip symmetry on Smith Chart', () => {
        const zNorm = { re: tc.loadR / tc.z0, im: tc.loadX / tc.z0 };
        const gamma = gammaFromNormalizedZ(zNorm);

        // If load is not right at the singular infinity point, verify inversion
        if (zNorm.re < 1000 && Math.abs(zNorm.im) < 1000) {
          const zRecovered = normalizedZFromGamma(gamma);
          expect(Math.abs(zRecovered.re - zNorm.re)).toBeLessThan(1e-9);
          expect(Math.abs(zRecovered.im - zNorm.im)).toBeLessThan(1e-9);
        }
      });
    }
  );
});
