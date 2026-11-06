/**
 * Laser Polarization Calculus & Optical Train Engine
 *
 * Implements hybrid Jones & Stokes/Mueller calculus for AMO physics and laser laboratories:
 * - Complex Electric field Jones vectors (Ex, Ey) and 2x2 Jones matrices
 * - Full Stokes parameters (S0, S1, S2, S3), normalized (s1, s2, s3), and DOP
 * - Polarization ellipse geometry (azimuth psi, ellipticity chi, axial ratio b/a, handedness)
 * - 3D Poincaré sphere coordinates (longitude 2psi, latitude 2chi, Cartesian s1, s2, s3)
 * - Optical elements: Half-Wave Plate (HWP), Quarter-Wave Plate (QWP), General Retarder (lambda/x),
 *   Linear Polarizer (with extinction ratio), Polarizing Beam Splitter (PBS), Faraday Rotator
 * - Optical train propagation with power transmission tracking and stage-by-stage diagnostics
 *
 * Handedness & Phase Convention (Standard AMO Physics Right-Hand Rule):
 * - Viewer is at the light source looking towards the detector/screen (propagation along +z into screen).
 * - Right-Hand Rule: Right thumb points in the photon propagation direction (+z).
 * - Therefore, right-hand fingers curl CLOCKWISE in the transverse xy plane.
 * - For Right-Handed Circular (RHC / sigma+ / S3 > 0 / North Pole of Poincaré sphere),
 *   the electric field vector E(t) rotates CLOCKWISE on the screen/transverse plane as seen by the viewer at the source.
 * - For Left-Handed Circular (LHC / sigma- / S3 < 0 / South Pole of Poincaré sphere),
 *   the electric field vector E(t) rotates COUNTER-CLOCKWISE on the screen/transverse plane.
 */

// ============================================================================
// Complex Number Operations
// ============================================================================

export interface Complex {
  re: number;
  im: number;
}

export function complex(re: number, im = 0): Complex {
  return { re, im };
}

export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function complexSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

export function complexMulScalar(c: Complex, s: number): Complex {
  return { re: c.re * s, im: c.im * s };
}

export function complexDiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  if (denom === 0) return { re: 0, im: 0 };
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom
  };
}

export function complexAbs(c: Complex): number {
  return Math.hypot(c.re, c.im);
}

export function complexAbsSq(c: Complex): number {
  return c.re * c.re + c.im * c.im;
}

export function complexArg(c: Complex): number {
  return Math.atan2(c.im, c.re);
}

export function complexExp(c: Complex): Complex {
  const expRe = Math.exp(c.re);
  return {
    re: expRe * Math.cos(c.im),
    im: expRe * Math.sin(c.im)
  };
}

export function complexConj(c: Complex): Complex {
  return { re: c.re, im: -c.im };
}

// ============================================================================
// Data Types for Polarization
// ============================================================================

export interface JonesVector {
  Ex: Complex;
  Ey: Complex;
}

export type JonesMatrix = [
  [Complex, Complex],
  [Complex, Complex]
];

export interface StokesVector {
  s0: number; // Total intensity (mW or normalized)
  s1: number; // Horizontal vs Vertical (IH - IV)
  s2: number; // +45 vs -45 Diagonal (ID - IA)
  s3: number; // Right vs Left Circular (IR - IL)
}

export type HandednessType = 'linear' | 'right' | 'left';

export interface EllipseGeometry {
  psiDeg: number;       // Azimuth / tilt angle [-90, +90] deg
  chiDeg: number;       // Ellipticity angle [-45, +45] deg
  axialRatio: number;   // b / a = |tan(chi)| in [0, 1]
  semiMajor: number;    // a
  semiMinor: number;    // b
  handedness: HandednessType;
  description: string;  // e.g. "Horizontal Linear", "RHC (sigma+)", "Right Elliptical"
}

export interface PoincareCoordinates {
  longitudeDeg: number; // 2 * psi in [-180, 180] deg
  latitudeDeg: number;  // 2 * chi in [-90, 90] deg
  s1Norm: number;       // normalized s1 in [-1, 1]
  s2Norm: number;       // normalized s2 in [-1, 1]
  s3Norm: number;       // normalized s3 in [-1, 1]
}

export type OpticType = 'hwp' | 'qwp' | 'retarder' | 'polarizer' | 'pbs' | 'rotator';

export interface PolarizationOptic {
  id: string;
  name: string;
  type: OpticType;
  angleDeg: number; // Fast axis angle (waveplates), transmission axis (polarizers), or rotation angle (rotator)
  axisMode?: 'fast' | 'slow'; // For waveplates: whether angleDeg sets the fast or slow axis (default 'fast')
  retardanceDeg?: number; // For general retarder (default 90 for QWP, 180 for HWP)
  retardanceFraction?: number; // e.g. 4 for lambda/4, 2 for lambda/2, 8 for lambda/8
  extinctionRatio?: number; // For linear polarizer, power extinction ratio (default 1e-5)
  enabled: boolean;
}

export interface StageResult {
  stageIndex: number;
  opticId?: string;
  opticName?: string;
  opticType?: OpticType;
  opticAngleDeg?: number;
  enabled?: boolean;
  jones: JonesVector;
  stokes: StokesVector;
  normalizedStokes: StokesVector;
  ellipse: EllipseGeometry;
  poincare: PoincareCoordinates;
  powerTransmissionPercent: number; // relative to initial beam
  stepTransmissionPercent: number;  // relative to previous stage
  pbsReflected?: {
    jones: JonesVector;
    stokes: StokesVector;
    normalizedStokes: StokesVector;
    ellipse: EllipseGeometry;
    poincare: PoincareCoordinates;
    powerReflectionPercent: number; // relative to initial beam
  };
}

export interface PolarizationPropagationResult {
  stages: StageResult[];
  finalJones: JonesVector;
  finalStokes: StokesVector;
  finalEllipse: EllipseGeometry;
  finalPoincare: PoincareCoordinates;
  totalTransmissionPercent: number;
  overallMatrix: JonesMatrix;
}

// ============================================================================
// Matrix Math Helpers
// ============================================================================

export function identityMatrix(): JonesMatrix {
  return [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(1, 0)]
  ];
}

export function multiplyMatrices(A: JonesMatrix, B: JonesMatrix): JonesMatrix {
  const result: JonesMatrix = [
    [complex(0, 0), complex(0, 0)],
    [complex(0, 0), complex(0, 0)]
  ];

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      let sum = complex(0, 0);
      for (let k = 0; k < 2; k++) {
        sum = complexAdd(sum, complexMul(A[i][k], B[k][j]));
      }
      result[i][j] = sum;
    }
  }

  return result;
}

export function multiplyMatrixVector(M: JonesMatrix, v: JonesVector): JonesVector {
  return {
    Ex: complexAdd(complexMul(M[0][0], v.Ex), complexMul(M[0][1], v.Ey)),
    Ey: complexAdd(complexMul(M[1][0], v.Ex), complexMul(M[1][1], v.Ey))
  };
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Computes Stokes parameters from a Jones vector.
 * S0 = |Ex|^2 + |Ey|^2
 * S1 = |Ex|^2 - |Ey|^2
 * S2 = 2 * Re(Ex* Ey) = 2 * |Ex| * |Ey| * cos(phi_y - phi_x)
 * S3 = 2 * Im(Ex* Ey) = 2 * |Ex| * |Ey| * sin(phi_y - phi_x)
 */
export function jonesToStokes(j: JonesVector): StokesVector {
  const exAbsSq = complexAbsSq(j.Ex);
  const eyAbsSq = complexAbsSq(j.Ey);
  const s0 = exAbsSq + eyAbsSq;
  const s1 = exAbsSq - eyAbsSq;

  // Ex* * Ey
  const exConj = complexConj(j.Ex);
  const exConjEy = complexMul(exConj, j.Ey);

  const s2 = 2 * exConjEy.re;
  const s3 = 2 * exConjEy.im;

  return { s0, s1, s2, s3 };
}

/**
 * Normalizes Stokes vector so that s0 = 1, and s1^2 + s2^2 + s3^2 = 1 (for polarized light).
 */
export function stokesToNormalized(s: StokesVector): StokesVector {
  if (s.s0 <= 1e-12) {
    return { s0: 0, s1: 0, s2: 0, s3: 0 };
  }
  return {
    s0: 1.0,
    s1: s.s1 / s.s0,
    s2: s.s2 / s.s0,
    s3: s.s3 / s.s0
  };
}

/**
 * Computes Degree of Polarization (DOP):
 * DOP = sqrt(S1^2 + S2^2 + S3^2) / S0 in [0, 1]
 */
export function degreeOfPolarization(s: StokesVector): number {
  if (s.s0 <= 1e-12) return 0;
  const p = Math.sqrt(s.s1 * s.s1 + s.s2 * s.s2 + s.s3 * s.s3) / s.s0;
  return Math.max(0, Math.min(1.0, p));
}

/**
 * Computes polarization ellipse geometry from Stokes vector:
 * - Azimuth psi = 0.5 * atan2(S2, S1) in [-90, +90] deg
 * - Ellipticity chi = 0.5 * asin(s3 / s0) in [-45, +45] deg
 * - Axial ratio b / a = |tan(chi)|
 * - Handedness: s3 > 0 -> Right (sigma+), s3 < 0 -> Left (sigma-), s3 = 0 -> Linear
 */
export function stokesToEllipse(s: StokesVector): EllipseGeometry {
  if (s.s0 <= 1e-12) {
    return {
      psiDeg: 0,
      chiDeg: 0,
      axialRatio: 0,
      semiMajor: 0,
      semiMinor: 0,
      handedness: 'linear',
      description: 'Zero Intensity / Dark'
    };
  }

  // Azimuth angle: 2*psi = atan2(S2, S1) -> psi in [-pi/2, pi/2]
  const twoPsiRad = Math.atan2(s.s2, s.s1);
  let psiDeg = (twoPsiRad * 180) / (2 * Math.PI);

  // Ellipticity angle: sin(2*chi) = S3 / S0 -> chi in [-pi/4, pi/4]
  const s3Norm = Math.max(-1, Math.min(1, s.s3 / s.s0));
  const twoChiRad = Math.asin(s3Norm);
  const chiDeg = (twoChiRad * 180) / (2 * Math.PI);

  const chiRad = twoChiRad / 2;
  const axialRatio = Math.abs(Math.tan(chiRad));

  // Semi-major a and semi-minor b where S0 = a^2 + b^2
  const cosChi = Math.cos(chiRad);
  const sinChi = Math.sin(chiRad);
  const semiMajor = Math.sqrt(s.s0) * Math.abs(cosChi);
  const semiMinor = Math.sqrt(s.s0) * Math.abs(sinChi);

  // Handedness determination
  let handedness: HandednessType = 'linear';
  let description = 'Linear';

  const s3Abs = Math.abs(s3Norm);
  if (s3Abs < 1e-4) {
    handedness = 'linear';
    if (Math.abs(psiDeg) < 1) description = 'Horizontal Linear |H⟩';
    else if (Math.abs(Math.abs(psiDeg) - 90) < 1) description = 'Vertical Linear |V⟩';
    else if (Math.abs(psiDeg - 45) < 1) description = 'Diagonal Linear |D⟩ (+45°)';
    else if (Math.abs(psiDeg + 45) < 1) description = 'Anti-Diagonal Linear |A⟩ (-45°)';
    else description = `Linear (${psiDeg >= 0 ? '+' : ''}${psiDeg.toFixed(1)}°)`;
  } else if (s3Norm > 0) {
    handedness = 'right';
    if (s3Norm > 0.999) {
      description = 'Right Circular |R⟩ RHC';
    } else {
      description = `Right Elliptical (χ = +${chiDeg.toFixed(1)}°, ψ = ${psiDeg.toFixed(1)}°)`;
    }
  } else {
    handedness = 'left';
    if (s3Norm < -0.999) {
      description = 'Left Circular |L⟩ LHC';
    } else {
      description = `Left Elliptical (χ = ${chiDeg.toFixed(1)}°, ψ = ${psiDeg.toFixed(1)}°)`;
    }
  }

  return {
    psiDeg,
    chiDeg,
    axialRatio,
    semiMajor,
    semiMinor,
    handedness,
    description
  };
}

/**
 * Computes 3D Poincaré sphere coordinates from Stokes vector:
 * Longitude = 2 * psi in [-180, 180] deg
 * Latitude = 2 * chi in [-90, 90] deg
 * Normalized s1, s2, s3 Cartesian coordinates on unit sphere.
 */
export function stokesToPoincare(s: StokesVector): PoincareCoordinates {
  if (s.s0 <= 1e-12) {
    return {
      longitudeDeg: 0,
      latitudeDeg: 0,
      s1Norm: 0,
      s2Norm: 0,
      s3Norm: 0
    };
  }

  const norm = stokesToNormalized(s);
  const twoPsiRad = Math.atan2(norm.s2, norm.s1);
  const longitudeDeg = (twoPsiRad * 180) / Math.PI;

  const s3Clamped = Math.max(-1, Math.min(1, norm.s3));
  const latitudeDeg = (Math.asin(s3Clamped) * 180) / Math.PI;

  return {
    longitudeDeg,
    latitudeDeg,
    s1Norm: norm.s1,
    s2Norm: norm.s2,
    s3Norm: norm.s3
  };
}

/**
 * Reconstructs Stokes vector from Ellipse parameters:
 * s1 = s0 * cos(2*chi) * cos(2*psi)
 * s2 = s0 * cos(2*chi) * sin(2*psi)
 * s3 = s0 * sin(2*chi)
 */
export function ellipseToStokes(psiDeg: number, chiDeg: number, s0 = 1.0): StokesVector {
  const psiRad = (psiDeg * Math.PI) / 180;
  const chiRad = (chiDeg * Math.PI) / 180;

  const cos2Chi = Math.cos(2 * chiRad);
  const sin2Chi = Math.sin(2 * chiRad);

  const s1 = s0 * cos2Chi * Math.cos(2 * psiRad);
  const s2 = s0 * cos2Chi * Math.sin(2 * psiRad);
  const s3 = s0 * sin2Chi;

  return { s0, s1, s2, s3 };
}

/**
 * Converts Stokes parameters to canonical Jones vector (up to global phase):
 * Ex is taken real and positive:
 * Ex = sqrt((s0 + s1) / 2)
 * Ey = sqrt((s0 - s1) / 2) * exp(i * delta)
 * where delta = atan2(s3, s2)
 */
export function stokesToJones(s: StokesVector): JonesVector {
  if (s.s0 <= 1e-12) {
    return { Ex: complex(0, 0), Ey: complex(0, 0) };
  }

  const s1Clamped = Math.max(-s.s0, Math.min(s.s0, s.s1));
  const e0x = Math.sqrt(Math.max(0, (s.s0 + s1Clamped) / 2));
  const e0y = Math.sqrt(Math.max(0, (s.s0 - s1Clamped) / 2));

  // Phase difference delta = phi_y - phi_x
  // Since S2 = 2 * E0x * E0y * cos(delta) and S3 = 2 * E0x * E0y * sin(delta),
  // delta = atan2(S3, S2)
  let deltaRad = 0;
  if (Math.abs(s.s2) > 1e-12 || Math.abs(s.s3) > 1e-12) {
    deltaRad = Math.atan2(s.s3, s.s2);
  }

  return {
    Ex: complex(e0x, 0),
    Ey: complex(e0y * Math.cos(deltaRad), e0y * Math.sin(deltaRad))
  };
}

/**
 * Builds a Jones vector directly from E0x, E0y, and relative phase difference delta (deg).
 * delta = phi_y - phi_x.
 */
export function amplitudesAndPhaseToJones(E0x: number, E0y: number, deltaDeg: number): JonesVector {
  const deltaRad = (deltaDeg * Math.PI) / 180;
  return {
    Ex: complex(Math.max(0, E0x), 0),
    Ey: complex(Math.max(0, E0y) * Math.cos(deltaRad), Math.max(0, E0y) * Math.sin(deltaRad))
  };
}

/**
 * Extracts amplitudes E0x, E0y, and phase difference delta (deg) from a Jones vector.
 */
export function jonesToAmplitudesAndPhase(j: JonesVector): {
  E0x: number;
  E0y: number;
  deltaDeg: number;
  alphaDeg: number;
  phiXDeg: number;
  phiYDeg: number;
} {
  const E0x = complexAbs(j.Ex);
  const E0y = complexAbs(j.Ey);
  const phiXRad = complexArg(j.Ex);
  const phiYRad = complexArg(j.Ey);

  let deltaRad = phiYRad - phiXRad;
  // Wrap to (-pi, pi]
  while (deltaRad > Math.PI) deltaRad -= 2 * Math.PI;
  while (deltaRad <= -Math.PI) deltaRad += 2 * Math.PI;

  const deltaDeg = (deltaRad * 180) / Math.PI;
  const phiXDeg = (phiXRad * 180) / Math.PI;
  const phiYDeg = (phiYRad * 180) / Math.PI;

  const alphaRad = Math.atan2(E0y, E0x);
  const alphaDeg = (alphaRad * 180) / Math.PI;

  return {
    E0x,
    E0y,
    deltaDeg,
    alphaDeg,
    phiXDeg,
    phiYDeg
  };
}

// ============================================================================
// Standard AMO Presets
// ============================================================================

export interface PolarizationPresetItem {
  id: string;
  name: string;
  ket: string;
  psiDeg: number;
  chiDeg: number;
  deltaDeg: number;
  description: string;
}

export const POLARIZATION_PRESETS: PolarizationPresetItem[] = [
  {
    id: 'H',
    name: 'Horizontal Linear',
    ket: '|H⟩',
    psiDeg: 0,
    chiDeg: 0,
    deltaDeg: 0,
    description: 'Electric field along horizontal x-axis (Stokes: [1, 1, 0, 0])'
  },
  {
    id: 'V',
    name: 'Vertical Linear',
    ket: '|V⟩',
    psiDeg: 90,
    chiDeg: 0,
    deltaDeg: 0,
    description: 'Electric field along vertical y-axis (Stokes: [1, -1, 0, 0])'
  },
  {
    id: 'D',
    name: 'Diagonal Linear (+45°)',
    ket: '|D⟩',
    psiDeg: 45,
    chiDeg: 0,
    deltaDeg: 0,
    description: 'Linear at +45° to horizontal (Stokes: [1, 0, 1, 0])'
  },
  {
    id: 'A',
    name: 'Anti-Diagonal Linear (-45°)',
    ket: '|A⟩',
    psiDeg: -45,
    chiDeg: 0,
    deltaDeg: 180,
    description: 'Linear at -45° to horizontal (Stokes: [1, 0, -1, 0])'
  },
  {
    id: 'R',
    name: 'RHC',
    ket: '|R⟩',
    psiDeg: 0,
    chiDeg: 45,
    deltaDeg: 90,
    description: 'Right-Handed Circular (RHC). Clockwise (CW) rotation looking along +z (Right-Hand Rule: thumb along +z, fingers curl CW). Intrinsic photon helicity +1 (+ħ along k̂). Drives σ⁺ (Δm = +1) if B⃗ ∥ +k̂; drives σ⁻ (Δm = -1) if B⃗ ∥ -k̂. North Pole of Poincaré sphere (Stokes: [1, 0, 0, 1]).'
  },
  {
    id: 'L',
    name: 'LHC',
    ket: '|L⟩',
    psiDeg: 0,
    chiDeg: -45,
    deltaDeg: -90,
    description: 'Left-Handed Circular (LHC). Counter-Clockwise (CCW) rotation looking along +z (thumb along +z, opposite to curled fingers). Intrinsic photon helicity -1 (-ħ along k̂). Drives σ⁻ (Δm = -1) if B⃗ ∥ +k̂; drives σ⁺ (Δm = +1) if B⃗ ∥ -k̂. South Pole of Poincaré sphere (Stokes: [1, 0, 0, -1]).'
  }
];

export function getPresetPolarization(presetId: string, intensity = 1.0): JonesVector {
  switch (presetId) {
    case 'H':
      return { Ex: complex(Math.sqrt(intensity), 0), Ey: complex(0, 0) };
    case 'V':
      return { Ex: complex(0, 0), Ey: complex(Math.sqrt(intensity), 0) };
    case 'D': {
      const amp = Math.sqrt(intensity / 2);
      return { Ex: complex(amp, 0), Ey: complex(amp, 0) };
    }
    case 'A': {
      const amp = Math.sqrt(intensity / 2);
      return { Ex: complex(amp, 0), Ey: complex(-amp, 0) };
    }
    case 'R': {
      // delta = +pi/2, Ey = i * amp
      const amp = Math.sqrt(intensity / 2);
      return { Ex: complex(amp, 0), Ey: complex(0, amp) };
    }
    case 'L': {
      // delta = -pi/2, Ey = -i * amp
      const amp = Math.sqrt(intensity / 2);
      return { Ex: complex(amp, 0), Ey: complex(0, -amp) };
    }
    default:
      return { Ex: complex(Math.sqrt(intensity), 0), Ey: complex(0, 0) };
  }
}

// ============================================================================
// Optical Rail Elements & Jones Matrices
// ============================================================================

/**
 * Computes 2x2 Jones matrix for a rotation R(theta):
 * [ [cos(theta), -sin(theta)],
 *   [sin(theta),  cos(theta)] ]
 */
export function rotationMatrix(thetaRad: number): JonesMatrix {
  const c = Math.cos(thetaRad);
  const s = Math.sin(thetaRad);
  return [
    [complex(c, 0), complex(-s, 0)],
    [complex(s, 0), complex(c, 0)]
  ];
}

/**
 * Computes the 2x2 Jones matrix for any optic on the optical rail.
 */
export function getOpticJonesMatrix(optic: PolarizationOptic): JonesMatrix {
  if (!optic.enabled) {
    return identityMatrix();
  }

  const thetaRad = (optic.angleDeg * Math.PI) / 180;

  switch (optic.type) {
    case 'hwp': {
      // Half-Wave Plate: Retardance Gamma = pi rad
      // Fast axis vs Slow axis:
      // If slow axis mode, fast axis is at theta + 90 deg
      const effThetaRad = optic.axisMode === 'slow' ? thetaRad + Math.PI / 2 : thetaRad;
      const cos2 = Math.cos(2 * effThetaRad);
      const sin2 = Math.sin(2 * effThetaRad);
      // R(theta) * diag(e^{i*pi/2}, e^{-i*pi/2}) * R(-theta) = i * [ [cos(2*theta), sin(2*theta)], [sin(2*theta), -cos(2*theta)] ]
      // We retain the exact phase factor i:
      return [
        [complex(0, cos2), complex(0, sin2)],
        [complex(0, sin2), complex(0, -cos2)]
      ];
    }

    case 'qwp': {
      // Quarter-Wave Plate: Retardance Gamma = pi/2 rad
      const effThetaRad = optic.axisMode === 'slow' ? thetaRad + Math.PI / 2 : thetaRad;
      const gammaOver2 = Math.PI / 4;
      const cosG = Math.cos(gammaOver2); // 1 / sqrt(2)
      const sinG = Math.sin(gammaOver2); // 1 / sqrt(2)
      const cos2 = Math.cos(2 * effThetaRad);
      const sin2 = Math.sin(2 * effThetaRad);

      // M00 = cos(Gamma/2) + i * sin(Gamma/2) * cos(2*theta)
      // M01 = i * sin(Gamma/2) * sin(2*theta)
      // M10 = i * sin(Gamma/2) * sin(2*theta)
      // M11 = cos(Gamma/2) - i * sin(Gamma/2) * cos(2*theta)
      return [
        [complex(cosG, sinG * cos2), complex(0, sinG * sin2)],
        [complex(0, sinG * sin2), complex(cosG, -sinG * cos2)]
      ];
    }

    case 'retarder': {
      // General Retarder: Retardance Gamma
      let gammaRad = Math.PI;
      if (optic.retardanceFraction && optic.retardanceFraction > 0) {
        gammaRad = (2 * Math.PI) / optic.retardanceFraction;
      } else if (optic.retardanceDeg !== undefined) {
        gammaRad = (optic.retardanceDeg * Math.PI) / 180;
      }

      const effThetaRad = optic.axisMode === 'slow' ? thetaRad + Math.PI / 2 : thetaRad;
      const gammaOver2 = gammaRad / 2;
      const cosG = Math.cos(gammaOver2);
      const sinG = Math.sin(gammaOver2);
      const cos2 = Math.cos(2 * effThetaRad);
      const sin2 = Math.sin(2 * effThetaRad);

      return [
        [complex(cosG, sinG * cos2), complex(0, sinG * sin2)],
        [complex(0, sinG * sin2), complex(cosG, -sinG * cos2)]
      ];
    }

    case 'polarizer': {
      // Linear Polarizer with transmission axis at theta and power extinction ratio epsilon
      const eps = Math.max(0, optic.extinctionRatio ?? 1e-5);
      const sqrtEps = Math.sqrt(eps);
      const c = Math.cos(thetaRad);
      const s = Math.sin(thetaRad);

      // M = R(theta) * diag(1, sqrt(eps)) * R(-theta)
      // M00 = c^2 + sqrt(eps) * s^2
      // M01 = (1 - sqrt(eps)) * c * s
      // M10 = (1 - sqrt(eps)) * c * s
      // M11 = s^2 + sqrt(eps) * c^2
      return [
        [complex(c * c + sqrtEps * s * s, 0), complex((1 - sqrtEps) * c * s, 0)],
        [complex((1 - sqrtEps) * c * s, 0), complex(s * s + sqrtEps * c * c, 0)]
      ];
    }

    case 'pbs': {
      // Polarizing Beam Splitter: Transmits horizontal (p), reflects vertical (s)
      // By default transmission port is horizontal (theta = 0)
      const c = Math.cos(thetaRad);
      const s = Math.sin(thetaRad);
      return [
        [complex(c * c, 0), complex(c * s, 0)],
        [complex(c * s, 0), complex(s * s, 0)]
      ];
    }

    case 'rotator': {
      // Faraday Rotator: Pure optical rotation by angle theta without changing ellipticity
      return rotationMatrix(thetaRad);
    }

    default:
      return identityMatrix();
  }
}

/**
 * Computes PBS reflection arm Jones matrix (reflects s / perpendicular component).
 */
export function getPBSReflectedJonesMatrix(optic: PolarizationOptic): JonesMatrix {
  const thetaRad = (optic.angleDeg * Math.PI) / 180;
  const c = Math.cos(thetaRad);
  const s = Math.sin(thetaRad);
  // Reflects perpendicular to transmission axis (s-polarized):
  return [
    [complex(s * s, 0), complex(-c * s, 0)],
    [complex(-c * s, 0), complex(c * c, 0)]
  ];
}

// ============================================================================
// Optical Train Propagation Pipeline
// ============================================================================

/**
 * Propagates an input polarization state through an array of optical elements in order.
 * Tracks stage-by-stage Jones vectors, Stokes parameters, ellipse geometry, and power.
 */
export function propagatePolarization(
  initialState: JonesVector,
  optics: PolarizationOptic[]
): PolarizationPropagationResult {
  const initialStokes = jonesToStokes(initialState);
  const initialIntensity = Math.max(1e-12, initialStokes.s0);

  const stages: StageResult[] = [];

  // Stage 0: Input state
  stages.push({
    stageIndex: 0,
    opticName: 'Input Beam',
    jones: initialState,
    stokes: initialStokes,
    normalizedStokes: stokesToNormalized(initialStokes),
    ellipse: stokesToEllipse(initialStokes),
    poincare: stokesToPoincare(initialStokes),
    powerTransmissionPercent: 100,
    stepTransmissionPercent: 100
  });

  let currentJones = initialState;
  let currentStokes = initialStokes;
  let overallMatrix = identityMatrix();

  for (let i = 0; i < optics.length; i++) {
    const optic = optics[i];
    const prevIntensity = Math.max(1e-12, currentStokes.s0);

    let nextJones = currentJones;
    let pbsReflectedResult: StageResult['pbsReflected'] = undefined;

    if (optic.enabled) {
      const M = getOpticJonesMatrix(optic);
      nextJones = multiplyMatrixVector(M, currentJones);
      overallMatrix = multiplyMatrices(M, overallMatrix);

      // If optic is a PBS, calculate reflected branch
      if (optic.type === 'pbs') {
        const MRefl = getPBSReflectedJonesMatrix(optic);
        const reflJones = multiplyMatrixVector(MRefl, currentJones);
        const reflStokes = jonesToStokes(reflJones);
        pbsReflectedResult = {
          jones: reflJones,
          stokes: reflStokes,
          normalizedStokes: stokesToNormalized(reflStokes),
          ellipse: stokesToEllipse(reflStokes),
          poincare: stokesToPoincare(reflStokes),
          powerReflectionPercent: (reflStokes.s0 / initialIntensity) * 100
        };
      }
    }

    const nextStokes = jonesToStokes(nextJones);
    const powerTxPercent = (nextStokes.s0 / initialIntensity) * 100;
    const stepTxPercent = (nextStokes.s0 / prevIntensity) * 100;

    stages.push({
      stageIndex: i + 1,
      opticId: optic.id,
      opticName: optic.name,
      opticType: optic.type,
      opticAngleDeg: optic.angleDeg,
      enabled: optic.enabled,
      jones: nextJones,
      stokes: nextStokes,
      normalizedStokes: stokesToNormalized(nextStokes),
      ellipse: stokesToEllipse(nextStokes),
      poincare: stokesToPoincare(nextStokes),
      powerTransmissionPercent: powerTxPercent,
      stepTransmissionPercent: stepTxPercent,
      pbsReflected: pbsReflectedResult
    });

    currentJones = nextJones;
    currentStokes = nextStokes;
  }

  const finalStage = stages[stages.length - 1];

  return {
    stages,
    finalJones: currentJones,
    finalStokes: currentStokes,
    finalEllipse: finalStage.ellipse,
    finalPoincare: finalStage.poincare,
    totalTransmissionPercent: finalStage.powerTransmissionPercent,
    overallMatrix
  };
}

// ============================================================================
// Optical Train Presets
// ============================================================================

export interface OpticalTrainPreset {
  id: string;
  name: string;
  description: string;
  optics: PolarizationOptic[];
}

export const OPTICAL_TRAIN_PRESETS: OpticalTrainPreset[] = [
  {
    id: 'circular-polarizer',
    name: 'Circular Polarizer (Linear → σ⁺)',
    description: 'Linear Polarizer (0°) followed by Quarter-Wave Plate (45°) produces pure Right Circular polarization.',
    optics: [
      {
        id: 'pol-1',
        name: 'Linear Polarizer (0°)',
        type: 'polarizer',
        angleDeg: 0,
        enabled: true
      },
      {
        id: 'qwp-1',
        name: 'Quarter-Wave Plate (45°)',
        type: 'qwp',
        angleDeg: 45,
        axisMode: 'fast',
        enabled: true
      }
    ]
  },
  {
    id: 'polarization-controller',
    name: 'QWP-HWP-QWP Polarization Controller',
    description: 'Standard laser optics polarization controller capable of transforming any arbitrary input into any arbitrary output polarization state.',
    optics: [
      {
        id: 'qwp-in',
        name: 'Input QWP (45°)',
        type: 'qwp',
        angleDeg: 45,
        axisMode: 'fast',
        enabled: true
      },
      {
        id: 'hwp-mid',
        name: 'Middle HWP (22.5°)',
        type: 'hwp',
        angleDeg: 22.5,
        axisMode: 'fast',
        enabled: true
      },
      {
        id: 'qwp-out',
        name: 'Output QWP (0°)',
        type: 'qwp',
        angleDeg: 0,
        axisMode: 'fast',
        enabled: true
      }
    ]
  },
  {
    id: 'variable-attenuator',
    name: 'HWP + PBS Variable Attenuator',
    description: 'Rotating the HWP angle theta continuously varies the power split between transmission and reflection arms without beam steering.',
    optics: [
      {
        id: 'hwp-att',
        name: 'Half-Wave Plate (θ)',
        type: 'hwp',
        angleDeg: 22.5,
        axisMode: 'fast',
        enabled: true
      },
      {
        id: 'pbs-att',
        name: 'Polarizing Beam Splitter',
        type: 'pbs',
        angleDeg: 0,
        enabled: true
      }
    ]
  },
  {
    id: 'optical-isolator',
    name: 'Optical Isolator Train',
    description: 'Linear Polarizer (0°) followed by a 45° Faraday Rotator and 45° Linear Polarizer for back-reflection isolation.',
    optics: [
      {
        id: 'pol-in',
        name: 'Input Polarizer (0°)',
        type: 'polarizer',
        angleDeg: 0,
        enabled: true
      },
      {
        id: 'faraday',
        name: 'Faraday Rotator (45°)',
        type: 'rotator',
        angleDeg: 45,
        enabled: true
      },
      {
        id: 'pol-out',
        name: 'Output Polarizer (45°)',
        type: 'polarizer',
        angleDeg: 45,
        enabled: true
      }
    ]
  }
];
