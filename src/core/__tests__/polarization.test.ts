import { describe, it, expect } from 'vitest';
import {
  complex,
  complexAdd,
  complexMul,
  complexAbs,
  complexArg,
  jonesToStokes,
  stokesToNormalized,
  stokesToEllipse,
  stokesToPoincare,
  stokesToJones,
  ellipseToStokes,
  amplitudesAndPhaseToJones,
  jonesToAmplitudesAndPhase,
  getPresetPolarization,
  getOpticJonesMatrix,
  propagatePolarization,
  degreeOfPolarization,
  PolarizationOptic,
  JonesVector,
  POLARIZATION_PRESETS
} from '../polarization';

describe('Laser Polarization Math Engine', () => {
  describe('Complex Number Operations', () => {
    it('correctly performs arithmetic on complex numbers', () => {
      const a = complex(3, 4);
      const b = complex(1, -2);

      const sum = complexAdd(a, b);
      expect(sum.re).toBeCloseTo(4);
      expect(sum.im).toBeCloseTo(2);

      const prod = complexMul(a, b);
      // (3 + 4i)(1 - 2i) = 3 - 6i + 4i + 8 = 11 - 2i
      expect(prod.re).toBeCloseTo(11);
      expect(prod.im).toBeCloseTo(-2);

      expect(complexAbs(a)).toBeCloseTo(5);
      expect(complexArg(complex(0, 1))).toBeCloseTo(Math.PI / 2);
    });

    it('normalizes Stokes vectors and computes optic Jones matrices directly', () => {
      const rawStokes = { s0: 10.0, s1: 6.0, s2: 8.0, s3: 0.0 };
      const norm = stokesToNormalized(rawStokes);
      expect(norm.s0).toBe(1.0);
      expect(norm.s1).toBeCloseTo(0.6);
      expect(norm.s2).toBeCloseTo(0.8);
      expect(norm.s3).toBe(0.0);

      // Verify zero intensity Stokes normalization
      const zeroNorm = stokesToNormalized({ s0: 0, s1: 0, s2: 0, s3: 0 });
      expect(zeroNorm.s0).toBe(0);

      // Verify direct getOpticJonesMatrix
      const optic: PolarizationOptic = {
        id: 'hwp',
        name: 'HWP',
        type: 'hwp',
        angleDeg: 0,
        axisMode: 'fast',
        enabled: true
      };
      const M = getOpticJonesMatrix(optic);
      expect(M[0][0].im).toBeCloseTo(1);
      expect(M[1][1].im).toBeCloseTo(-1);
    });
  });

  describe('Jones & Stokes Representations for Standard AMO Presets', () => {
    it('computes Stokes parameters for Horizontal Linear |H⟩', () => {
      const h = getPresetPolarization('H', 1.0);
      const s = jonesToStokes(h);

      expect(s.s0).toBeCloseTo(1.0);
      expect(s.s1).toBeCloseTo(1.0);
      expect(s.s2).toBeCloseTo(0.0);
      expect(s.s3).toBeCloseTo(0.0);

      const ell = stokesToEllipse(s);
      expect(ell.psiDeg).toBeCloseTo(0);
      expect(ell.chiDeg).toBeCloseTo(0);
      expect(ell.axialRatio).toBeCloseTo(0);
      expect(ell.handedness).toBe('linear');

      const poincare = stokesToPoincare(s);
      expect(poincare.s1Norm).toBeCloseTo(1.0);
      expect(poincare.s2Norm).toBeCloseTo(0.0);
      expect(poincare.s3Norm).toBeCloseTo(0.0);
      expect(poincare.longitudeDeg).toBeCloseTo(0.0);
      expect(poincare.latitudeDeg).toBeCloseTo(0.0);
    });

    it('computes Stokes parameters for Vertical Linear |V⟩', () => {
      const v = getPresetPolarization('V', 1.0);
      const s = jonesToStokes(v);

      expect(s.s0).toBeCloseTo(1.0);
      expect(s.s1).toBeCloseTo(-1.0);
      expect(s.s2).toBeCloseTo(0.0);
      expect(s.s3).toBeCloseTo(0.0);

      const ell = stokesToEllipse(s);
      expect(Math.abs(ell.psiDeg)).toBeCloseTo(90);
      expect(ell.chiDeg).toBeCloseTo(0);
      expect(ell.handedness).toBe('linear');

      const poincare = stokesToPoincare(s);
      expect(poincare.s1Norm).toBeCloseTo(-1.0);
      expect(poincare.s2Norm).toBeCloseTo(0.0);
      expect(poincare.s3Norm).toBeCloseTo(0.0);
      expect(Math.abs(poincare.longitudeDeg)).toBeCloseTo(180);
    });

    it('computes Stokes parameters for Diagonal Linear |D⟩ (+45°)', () => {
      const d = getPresetPolarization('D', 1.0);
      const s = jonesToStokes(d);

      expect(s.s0).toBeCloseTo(1.0);
      expect(s.s1).toBeCloseTo(0.0);
      expect(s.s2).toBeCloseTo(1.0);
      expect(s.s3).toBeCloseTo(0.0);

      const ell = stokesToEllipse(s);
      expect(ell.psiDeg).toBeCloseTo(45);
      expect(ell.chiDeg).toBeCloseTo(0);
      expect(ell.handedness).toBe('linear');

      const poincare = stokesToPoincare(s);
      expect(poincare.longitudeDeg).toBeCloseTo(90);
      expect(poincare.latitudeDeg).toBeCloseTo(0);
    });

    it('computes Stokes parameters for Anti-Diagonal Linear |A⟩ (-45°)', () => {
      const a = getPresetPolarization('A', 1.0);
      const s = jonesToStokes(a);

      expect(s.s0).toBeCloseTo(1.0);
      expect(s.s1).toBeCloseTo(0.0);
      expect(s.s2).toBeCloseTo(-1.0);
      expect(s.s3).toBeCloseTo(0.0);

      const ell = stokesToEllipse(s);
      expect(ell.psiDeg).toBeCloseTo(-45);
      expect(ell.chiDeg).toBeCloseTo(0);
      expect(ell.handedness).toBe('linear');

      const poincare = stokesToPoincare(s);
      expect(poincare.longitudeDeg).toBeCloseTo(-90);
      expect(poincare.latitudeDeg).toBeCloseTo(0);
    });

    it('computes Stokes parameters for Right-Handed Circular |R⟩ RHC', () => {
      const r = getPresetPolarization('R', 1.0);
      const s = jonesToStokes(r);

      expect(s.s0).toBeCloseTo(1.0);
      expect(s.s1).toBeCloseTo(0.0);
      expect(s.s2).toBeCloseTo(0.0);
      expect(s.s3).toBeCloseTo(1.0); // North Pole

      const ell = stokesToEllipse(s);
      expect(ell.chiDeg).toBeCloseTo(45);
      expect(ell.axialRatio).toBeCloseTo(1.0);
      expect(ell.handedness).toBe('right');

      const poincare = stokesToPoincare(s);
      expect(poincare.latitudeDeg).toBeCloseTo(90); // North pole
      expect(poincare.s3Norm).toBeCloseTo(1.0);

      // Verify preset item description reflects Right-Hand Rule (Clockwise)
      const rPreset = POLARIZATION_PRESETS.find(p => p.id === 'R');
      expect(rPreset?.description).toMatch(/Clockwise \(CW\)/i);
      expect(rPreset?.description).toMatch(/thumb along \+z, fingers curl CW/i);
    });

    it('computes Stokes parameters for Left-Handed Circular |L⟩ LHC', () => {
      const l = getPresetPolarization('L', 1.0);
      const s = jonesToStokes(l);

      expect(s.s0).toBeCloseTo(1.0);
      expect(s.s1).toBeCloseTo(0.0);
      expect(s.s2).toBeCloseTo(0.0);
      expect(s.s3).toBeCloseTo(-1.0); // South Pole

      const ell = stokesToEllipse(s);
      expect(ell.chiDeg).toBeCloseTo(-45);
      expect(ell.axialRatio).toBeCloseTo(1.0);
      expect(ell.handedness).toBe('left');

      const poincare = stokesToPoincare(s);
      expect(poincare.latitudeDeg).toBeCloseTo(-90); // South pole
      expect(poincare.s3Norm).toBeCloseTo(-1.0);

      // Verify preset item description reflects Counter-Clockwise
      const lPreset = POLARIZATION_PRESETS.find(p => p.id === 'L');
      expect(lPreset?.description).toMatch(/Counter-Clockwise \(CCW\)/i);
    });
  });

  describe('Bidirectional Round-Trip Invariance', () => {
    it('preserves Stokes parameters across Stokes -> Jones -> Stokes round-trip', () => {
      const testCases = [
        { s0: 2.5, s1: 1.5, s2: 1.2, s3: 1.1 },
        { s0: 1.0, s1: 0.0, s2: 0.0, s3: 1.0 },
        { s0: 1.0, s1: 0.6, s2: -0.8, s3: 0.0 },
        { s0: 5.0, s1: -3.0, s2: 2.0, s3: -3.3166 }
      ];

      for (const orig of testCases) {
        // Ensure s1^2 + s2^2 + s3^2 = s0^2 for 100% polarized light
        const normFactor = Math.hypot(orig.s1, orig.s2, orig.s3) / orig.s0;
        const normalizedStokes = {
          s0: orig.s0,
          s1: orig.s1 / normFactor,
          s2: orig.s2 / normFactor,
          s3: orig.s3 / normFactor
        };

        const jones = stokesToJones(normalizedStokes);
        const reconstructed = jonesToStokes(jones);

        expect(reconstructed.s0).toBeCloseTo(normalizedStokes.s0, 5);
        expect(reconstructed.s1).toBeCloseTo(normalizedStokes.s1, 5);
        expect(reconstructed.s2).toBeCloseTo(normalizedStokes.s2, 5);
        expect(reconstructed.s3).toBeCloseTo(normalizedStokes.s3, 5);
      }
    });

    it('preserves geometry across Ellipse -> Stokes -> Ellipse round-trip', () => {
      const angles = [
        { psi: 20, chi: 15 },
        { psi: -35, chi: -25 },
        { psi: 0, chi: 45 },
        { psi: 60, chi: -10 }
      ];

      for (const { psi, chi } of angles) {
        const stokes = ellipseToStokes(psi, chi, 1.0);
        const ellipse = stokesToEllipse(stokes);

        expect(ellipse.psiDeg).toBeCloseTo(psi, 4);
        expect(ellipse.chiDeg).toBeCloseTo(chi, 4);
        expect(ellipse.axialRatio).toBeCloseTo(Math.abs(Math.tan((chi * Math.PI) / 180)), 4);
      }
    });

    it('converts between amplitudes & phase and Jones vectors accurately', () => {
      const E0x = 1.4;
      const E0y = 2.1;
      const deltaDeg = 65;

      const jones = amplitudesAndPhaseToJones(E0x, E0y, deltaDeg);
      const extracted = jonesToAmplitudesAndPhase(jones);

      expect(extracted.E0x).toBeCloseTo(E0x, 5);
      expect(extracted.E0y).toBeCloseTo(E0y, 5);
      expect(extracted.deltaDeg).toBeCloseTo(deltaDeg, 5);
    });
  });

  describe('Optical Waveplates & Elements', () => {
    it('rotates linear polarization by 2*theta through Half-Wave Plate (HWP)', () => {
      const inputH = getPresetPolarization('H');

      // HWP at 22.5 deg rotates |H⟩ (0 deg) to |D⟩ (+45 deg)
      const hwp22_5: PolarizationOptic = {
        id: 'hwp1',
        name: 'HWP 22.5',
        type: 'hwp',
        angleDeg: 22.5,
        axisMode: 'fast',
        enabled: true
      };

      const result = propagatePolarization(inputH, [hwp22_5]);
      expect(result.finalEllipse.psiDeg).toBeCloseTo(45, 4);
      expect(result.finalEllipse.chiDeg).toBeCloseTo(0, 4);
      expect(result.finalEllipse.handedness).toBe('linear');
      expect(result.totalTransmissionPercent).toBeCloseTo(100, 4);

      // HWP at 45 deg rotates |H⟩ to |V⟩ (90 deg)
      const hwp45: PolarizationOptic = {
        id: 'hwp2',
        name: 'HWP 45',
        type: 'hwp',
        angleDeg: 45,
        axisMode: 'fast',
        enabled: true
      };
      const result45 = propagatePolarization(inputH, [hwp45]);
      expect(Math.abs(result45.finalEllipse.psiDeg)).toBeCloseTo(90, 4);
      expect(result45.finalStokes.s1).toBeCloseTo(-1, 4);
    });

    it('reverses circular handedness through a Half-Wave Plate (HWP)', () => {
      const inputR = getPresetPolarization('R'); // sigma+
      const hwp: PolarizationOptic = {
        id: 'hwp',
        name: 'HWP 0',
        type: 'hwp',
        angleDeg: 0,
        axisMode: 'fast',
        enabled: true
      };

      const result = propagatePolarization(inputR, [hwp]);
      expect(result.finalEllipse.chiDeg).toBeCloseTo(-45, 4);
      expect(result.finalEllipse.handedness).toBe('left'); // converted to sigma-
    });

    it('transforms Linear to Circular using Quarter-Wave Plate (QWP) with Fast Axis at 45°', () => {
      const inputH = getPresetPolarization('H');
      const qwpFast45: PolarizationOptic = {
        id: 'qwp1',
        name: 'QWP Fast 45',
        type: 'qwp',
        angleDeg: 45,
        axisMode: 'fast',
        enabled: true
      };

      const result = propagatePolarization(inputH, [qwpFast45]);
      expect(result.finalStokes.s3).toBeCloseTo(1.0, 4); // North Pole |R⟩ (sigma+)
      expect(result.finalEllipse.handedness).toBe('right');
      expect(result.finalEllipse.axialRatio).toBeCloseTo(1.0, 4);
    });

    it('transforms Linear to Left Circular using QWP with Slow Axis at 45°', () => {
      const inputH = getPresetPolarization('H');
      const qwpSlow45: PolarizationOptic = {
        id: 'qwp2',
        name: 'QWP Slow 45',
        type: 'qwp',
        angleDeg: 45,
        axisMode: 'slow',
        enabled: true
      };

      const result = propagatePolarization(inputH, [qwpSlow45]);
      expect(result.finalStokes.s3).toBeCloseTo(-1.0, 4); // South Pole |L⟩ (sigma-)
      expect(result.finalEllipse.handedness).toBe('left');
    });

    it('general retarder lambda/x produces exact expected retardance', () => {
      const inputH = getPresetPolarization('H');

      // Retardance fraction 4 (lambda/4) should behave identically to QWP
      const lambda4Retarder: PolarizationOptic = {
        id: 'ret-lambda4',
        name: 'Lambda/4 Retarder',
        type: 'retarder',
        angleDeg: 45,
        axisMode: 'fast',
        retardanceFraction: 4,
        enabled: true
      };

      const result = propagatePolarization(inputH, [lambda4Retarder]);
      expect(result.finalStokes.s3).toBeCloseTo(1.0, 4);

      // Retardance fraction 2 (lambda/2) should behave identically to HWP
      const lambda2Retarder: PolarizationOptic = {
        id: 'ret-lambda2',
        name: 'Lambda/2 Retarder',
        type: 'retarder',
        angleDeg: 22.5,
        axisMode: 'fast',
        retardanceFraction: 2,
        enabled: true
      };
      const result2 = propagatePolarization(inputH, [lambda2Retarder]);
      expect(result2.finalEllipse.psiDeg).toBeCloseTo(45, 4);
    });

    it('obeys Malus’s Law through a Linear Polarizer', () => {
      const inputH = getPresetPolarization('H', 1.0); // 1.0 mW along 0 deg

      // Test angles from 0 to 90 degrees
      const angles = [0, 30, 45, 60, 90];
      for (const theta of angles) {
        const pol: PolarizationOptic = {
          id: `pol-${theta}`,
          name: `Polarizer ${theta}`,
          type: 'polarizer',
          angleDeg: theta,
          extinctionRatio: 0,
          enabled: true
        };

        const result = propagatePolarization(inputH, [pol]);
        const expectedIntensity = Math.cos((theta * Math.PI) / 180) ** 2;

        expect(result.finalStokes.s0).toBeCloseTo(expectedIntensity, 5);
        expect(result.totalTransmissionPercent).toBeCloseTo(expectedIntensity * 100, 4);
      }
    });

    it('conserves total power at a Polarizing Beam Splitter (PBS)', () => {
      // Test arbitrary elliptical state
      const inputElliptical = stokesToJones(ellipseToStokes(33, 21, 2.5));
      const pbs: PolarizationOptic = {
        id: 'pbs',
        name: 'PBS',
        type: 'pbs',
        angleDeg: 0,
        enabled: true
      };

      const result = propagatePolarization(inputElliptical, [pbs]);
      const pbsStage = result.stages[1];

      expect(pbsStage.pbsReflected).toBeDefined();
      const pTrans = pbsStage.stokes.s0;
      const pRefl = pbsStage.pbsReflected!.stokes.s0;

      expect(pTrans + pRefl).toBeCloseTo(2.5, 5);
      expect(pbsStage.powerTransmissionPercent + pbsStage.pbsReflected!.powerReflectionPercent).toBeCloseTo(100, 4);

      // Transmitted arm must be purely horizontal
      expect(pbsStage.stokes.s1).toBeCloseTo(pTrans, 5);
      // Reflected arm must be purely vertical
      expect(pbsStage.pbsReflected!.stokes.s1).toBeCloseTo(-pRefl, 5);
    });

    it('rotates polarization plane without changing ellipticity with Faraday Rotator', () => {
      const inputElliptical = stokesToJones(ellipseToStokes(10, 30, 1.0));
      const faraday: PolarizationOptic = {
        id: 'faraday',
        name: 'Faraday Rotator',
        type: 'rotator',
        angleDeg: 45,
        enabled: true
      };

      const result = propagatePolarization(inputElliptical, [faraday]);
      // Azimuth angle should be shifted by 45 degrees: 10 + 45 = 55 deg
      expect(result.finalEllipse.psiDeg).toBeCloseTo(55, 4);
      // Ellipticity chi should be strictly preserved
      expect(result.finalEllipse.chiDeg).toBeCloseTo(30, 4);
      expect(result.totalTransmissionPercent).toBeCloseTo(100, 4);
    });
  });

  describe('Multi-Element Optical Trains', () => {
    it('transmits light forward through Optical Isolator and blocks back-reflection', () => {
      // Forward path: Polarizer(0°) -> Faraday(45°) -> Polarizer(45°)
      const forwardTrain: PolarizationOptic[] = [
        { id: 'p1', name: 'Pol 0', type: 'polarizer', angleDeg: 0, enabled: true },
        { id: 'f', name: 'Faraday 45', type: 'rotator', angleDeg: 45, enabled: true },
        { id: 'p2', name: 'Pol 45', type: 'polarizer', angleDeg: 45, enabled: true }
      ];

      const inputH = getPresetPolarization('H', 1.0);
      const forwardResult = propagatePolarization(inputH, forwardTrain);
      expect(forwardResult.totalTransmissionPercent).toBeCloseTo(100, 4);

      // Backward path: light returning backwards at 45°
      // Faraday rotates non-reciprocally by +45° to 90° (Vertical), which hits Polarizer(0°) orthogonally!
      const backwardTrain: PolarizationOptic[] = [
        { id: 'p2-back', name: 'Pol 45', type: 'polarizer', angleDeg: 45, enabled: true },
        { id: 'f-back', name: 'Faraday 45', type: 'rotator', angleDeg: 45, enabled: true },
        { id: 'p1-back', name: 'Pol 0', type: 'polarizer', angleDeg: 0, extinctionRatio: 1e-6, enabled: true }
      ];
      const backwardInput = stokesToJones(ellipseToStokes(45, 0, 1.0)); // 45° light back-reflected
      const backwardResult = propagatePolarization(backwardInput, backwardTrain);

      // Light should be blocked (extinction <= 1e-4 %)
      expect(backwardResult.totalTransmissionPercent).toBeLessThan(0.001);
    });

    it('smoothly bypasses optics when enabled is false', () => {
      const inputH = getPresetPolarization('H', 1.0);
      const disabledHWP: PolarizationOptic = {
        id: 'hwp',
        name: 'Disabled HWP',
        type: 'hwp',
        angleDeg: 45,
        axisMode: 'fast',
        enabled: false // bypassed
      };

      const result = propagatePolarization(inputH, [disabledHWP]);
      // Should remain completely unchanged
      expect(result.finalStokes.s1).toBeCloseTo(1.0, 5);
      expect(result.finalStokes.s2).toBeCloseTo(0.0, 5);
      expect(result.finalStokes.s3).toBeCloseTo(0.0, 5);
    });

    it('safely handles zero / dark input state without NaN', () => {
      const darkState: JonesVector = { Ex: complex(0, 0), Ey: complex(0, 0) };
      const optic: PolarizationOptic = {
        id: 'qwp',
        name: 'QWP',
        type: 'qwp',
        angleDeg: 45,
        enabled: true
      };

      const result = propagatePolarization(darkState, [optic]);
      expect(result.finalStokes.s0).toBe(0);
      expect(result.finalEllipse.axialRatio).toBe(0);
      expect(result.totalTransmissionPercent).toBe(0);
      expect(Number.isNaN(result.finalStokes.s0)).toBe(false);
    });

    it('computes Degree of Polarization (DOP) for pure and mixed states', () => {
      // Pure states
      const hStokes = jonesToStokes(getPresetPolarization('H', 1.0));
      expect(degreeOfPolarization(hStokes)).toBeCloseTo(1.0, 5);

      const rStokes = jonesToStokes(getPresetPolarization('R', 1.0));
      expect(degreeOfPolarization(rStokes)).toBeCloseTo(1.0, 5);

      // Partially polarized Stokes vector
      const partialStokes = { s0: 10.0, s1: 3.0, s2: 4.0, s3: 0.0 };
      // DOP = sqrt(3^2 + 4^2) / 10 = 5 / 10 = 0.5
      expect(degreeOfPolarization(partialStokes)).toBeCloseTo(0.5, 5);

      // Completely unpolarized Stokes vector
      const unpolStokes = { s0: 5.0, s1: 0.0, s2: 0.0, s3: 0.0 };
      expect(degreeOfPolarization(unpolStokes)).toBeCloseTo(0.0, 5);

      // Zero intensity
      expect(degreeOfPolarization({ s0: 0, s1: 0, s2: 0, s3: 0 })).toBe(0);
    });

    it('correctly handles general retarder configured with explicit retardanceDeg', () => {
      const inputH = getPresetPolarization('H', 1.0);
      // 90 deg retardance at 45 deg orientation should produce circular polarization (QWP equivalent)
      const degRetarder: PolarizationOptic = {
        id: 'deg-ret',
        name: '90 Deg Retarder',
        type: 'retarder',
        angleDeg: 45,
        retardanceDeg: 90,
        axisMode: 'fast',
        enabled: true
      };

      const result = propagatePolarization(inputH, [degRetarder]);
      expect(result.finalStokes.s3).toBeCloseTo(1.0, 4);
      expect(result.finalEllipse.handedness).toBe('right');
    });

    it('models finite extinction ratio leakage in linear polarizer', () => {
      const inputV = getPresetPolarization('V', 1.0); // Vertical input
      // Horizontal polarizer with finite extinction ratio 1e-4
      const polH: PolarizationOptic = {
        id: 'pol-leak',
        name: 'Horizontal Polarizer with Leakage',
        type: 'polarizer',
        angleDeg: 0,
        extinctionRatio: 1e-4,
        enabled: true
      };

      const result = propagatePolarization(inputV, [polH]);
      // Orthogonal transmission should be exactly 1e-4 (0.01%)
      expect(result.totalTransmissionPercent).toBeCloseTo(0.01, 4);
      expect(result.finalStokes.s0).toBeCloseTo(1e-4, 6);
    });
  });
});
