import { describe, it, expect } from 'vitest';
import goldenBeam from '../../../../tests/fixtures/wolfram-golden-beam-abcd.json';
import {
  transformQ,
  getBeamRadiusFromQ,
  getWavefrontCurvatureFromQ,
  matrix2x2
} from '../../beam-abcd';

describe('Zero-Trust ABCD Gaussian Beam Propagation Suite (Wolfram & ISO 11146 Ground Truth)', () => {
  const cases = goldenBeam.testCases;

  it('contains expected number of verified ABCD optical configurations', () => {
    expect(cases.length).toBeGreaterThanOrEqual(7);
  });

  describe.each(cases)('$name', (tc) => {
    it('accurately transforms complex beam parameter q(z) and matches Wolfram spot size', () => {
      const lambdaMeters = tc.wavelengthNm * 1e-9;
      const w0Meters = tc.initialWaistUm * 1e-6;
      const zRMeters = (Math.PI * w0Meters * w0Meters) / lambdaMeters;

      // Initial q parameter at waist (z = 0, R = Infinity) -> q1 = 0 + j*zR
      const q1 = { re: 0, im: zRMeters };

      const matrix = {
        A: tc.A,
        B: tc.B,
        C: tc.C,
        D: tc.D
      };

      // 1. Matrix determinant conservation: det(M) = 1 in free space and thin/thick lenses
      const det = matrix2x2.determinant(matrix);
      expect(Math.abs(det - tc.determinant)).toBeLessThan(1e-10);

      // 2. Transform complex beam parameter q2 = (A*q1 + B) / (C*q1 + D)
      const q2 = transformQ(matrix, q1);

      expect(Math.abs(q2.re - tc.q2Real)).toBeLessThan(1e-9);
      expect(Math.abs(q2.im - tc.q2Imag)).toBeLessThan(1e-9);

      // 3. Derived spot radius w(z) in micrometers
      const spotRadiusMeters = getBeamRadiusFromQ(q2, lambdaMeters);
      const spotRadiusUm = spotRadiusMeters * 1e6;

      const relErr = Math.abs(spotRadiusUm - tc.outputSpotRadiusUm) / tc.outputSpotRadiusUm;
      expect(relErr).toBeLessThan(1e-9);

      // 4. Derived wavefront curvature R(z) in millimeters (if finite)
      if (tc.outputCurvatureMm < 100000) {
        const curvatureMeters = getWavefrontCurvatureFromQ(q2);
        const curvatureMm = curvatureMeters * 1e3;
        const curvErr = Math.abs(curvatureMm - tc.outputCurvatureMm) / Math.abs(tc.outputCurvatureMm);
        expect(curvErr).toBeLessThan(1e-6);
      }
    });
  });
});
