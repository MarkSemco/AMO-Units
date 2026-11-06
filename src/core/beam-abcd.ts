/**
 * ABCD Matrix Gaussian Beam Propagation Simulator Engine
 * Implements Kogelnik complex beam parameter q(z) and 2x2 ray transfer matrices.
 */

import { Complex } from './rf-complex';
import { CODATA_2022 } from '../constants/codata2022';

export interface Matrix2x2 {
  A: number;
  B: number;
  C: number;
  D: number;
}

export type OpticalElementType = 'thin-lens' | 'thick-lens';

export interface OpticalElement {
  id: string;
  name: string;
  type: OpticalElementType;
  positionZMm: number; // Position on optical bench in mm
  // Thin lens parameters:
  focalLengthMm?: number; // Positive = converging, Negative = diverging
  // Thick lens parameters:
  frontCurvatureR1Mm?: number; // Radius of curvature of front surface (+ for convex)
  backCurvatureR2Mm?: number;  // Radius of curvature of back surface (- for biconvex)
  thicknessMm?: number;        // Center thickness in mm
  refractiveIndex?: number;    // Medium refractive index n (e.g. 1.5168 for N-BK7)
  glassName?: string;
  enabled?: boolean;
}

export interface BeamWaistPoint {
  positionZMm: number;
  waistRadiusUm: number;
  rayleighRangeMm: number;
  isReal: boolean; // True if within physical range of the segment
  segmentIndex: number;
}

export interface BeamProfileSample {
  zMm: number;
  wUm: number;
  radiusCurvatureMm: number; // Wavefront curvature R(z), Infinity if planar
  peakIntensityWPerCm2: number;
  avgIntensityWPerCm2: number;
  electricFieldVPerCm: number;
  electricFieldVPerM: number;
  rayleighRangeMm: number;
  q: Complex;
  segmentIndex: number;
}

export interface BeamSegmentState {
  index: number;
  startZMeters: number;
  endZMeters: number;
  qAtStart: Complex;
}

export interface BeamSimulationResult {
  samples: BeamProfileSample[];
  waists: BeamWaistPoint[];
  elements: OpticalElement[];
  segments: BeamSegmentState[];
  zMaxMm: number;
  initialWaistUm: number;
  initialRayleighRangeMm: number;
  wavelengthNm: number;
}

export const GLASS_PRESETS: Record<string, { name: string; n: number }> = {
  nbk7: { name: 'N-BK7 (Standard Crown)', n: 1.5168 },
  fusedSilica: { name: 'Fused Silica (UV grade)', n: 1.4585 },
  sf11: { name: 'SF11 (High-Index Flint)', n: 1.7845 },
  sapphire: { name: 'Sapphire (Al₂O₃)', n: 1.7682 }
};

/**
 * 2x2 Matrix arithmetic
 */
export const matrix2x2 = {
  create: (A: number, B: number, C: number, D: number): Matrix2x2 => ({ A, B, C, D }),

  identity: (): Matrix2x2 => ({ A: 1, B: 0, C: 0, D: 1 }),

  multiply: (m1: Matrix2x2, m2: Matrix2x2): Matrix2x2 => ({
    A: m1.A * m2.A + m1.B * m2.C,
    B: m1.A * m2.B + m1.B * m2.D,
    C: m1.C * m2.A + m1.D * m2.C,
    D: m1.C * m2.B + m1.D * m2.D
  }),

  determinant: (m: Matrix2x2): number => m.A * m.D - m.B * m.C,

  /**
   * Free space drift matrix for distance d (meters)
   */
  drift: (dMeters: number): Matrix2x2 => ({
    A: 1,
    B: dMeters,
    C: 0,
    D: 1
  }),

  /**
   * Thin lens matrix for focal length f (meters)
   */
  thinLens: (fMeters: number): Matrix2x2 => {
    if (fMeters === 0 || !isFinite(fMeters)) {
      return { A: 1, B: 0, C: 0, D: 1 };
    }
    return {
      A: 1,
      B: 0,
      C: -1 / fMeters,
      D: 1
    };
  },

  /**
   * Thick lens matrix with curvatures R1, R2, thickness d, and index n (all SI meters)
   * R1 > 0 for convex front, R2 < 0 for convex back in standard biconvex
   */
  thickLens: (
    R1Meters: number,
    R2Meters: number,
    dMeters: number,
    n: number
  ): Matrix2x2 => {
    const safeN = n > 1 ? n : 1.5;
    const d = Math.max(0, dMeters);

    // Front surface curvature term
    const c1 = R1Meters !== 0 && isFinite(R1Meters) ? 1 / R1Meters : 0;
    // Back surface curvature term
    const c2 = R2Meters !== 0 && isFinite(R2Meters) ? 1 / R2Meters : 0;

    const A = 1 - ((safeN - 1) / (safeN)) * d * c1;
    const B = d / safeN;
    const C = -(safeN - 1) * (c1 - c2 + ((safeN - 1) * d * c1 * c2) / safeN);
    const D = 1 + ((safeN - 1) / (safeN)) * d * c2;

    return { A, B, C, D };
  }
};

/**
 * Transform complex beam parameter q by ABCD matrix:
 * q2 = (A*q1 + B) / (C*q1 + D)
 */
export function transformQ(M: Matrix2x2, q: Complex): Complex {
  const numRe = M.A * q.re + M.B;
  const numIm = M.A * q.im;

  const denRe = M.C * q.re + M.D;
  const denIm = M.C * q.im;

  const denNormSq = denRe * denRe + denIm * denIm;
  if (denNormSq === 0 || !isFinite(denNormSq)) {
    return { re: q.re, im: q.im };
  }

  return {
    re: (numRe * denRe + numIm * denIm) / denNormSq,
    im: (numIm * denRe - numRe * denIm) / denNormSq
  };
}

/**
 * Extract 1/e^2 beam radius w(z) in meters from complex q parameter
 */
export function getBeamRadiusFromQ(q: Complex, wavelengthMeters: number, nMedium: number = 1.0): number {
  if (q.im <= 0 || wavelengthMeters <= 0) return 0;
  // w^2 = (lambda / (pi * n)) * (|q|^2 / q.im)
  const qMagSq = q.re * q.re + q.im * q.im;
  const wSq = (wavelengthMeters * qMagSq) / (Math.PI * nMedium * q.im);
  return Math.sqrt(Math.max(0, wSq));
}

/**
 * Extract wavefront curvature radius R(z) in meters from complex q parameter
 * Returns Infinity if wavefront is planar (at beam waist)
 */
export function getWavefrontCurvatureFromQ(q: Complex): number {
  if (Math.abs(q.re) < 1e-12) {
    return Infinity;
  }
  const qMagSq = q.re * q.re + q.im * q.im;
  return qMagSq / q.re;
}

/**
 * Construct initial complex beam parameter at a waist: q_0 = j * z_R
 */
export function createWaistQ(waistRadiusMeters: number, wavelengthMeters: number, nMedium: number = 1.0): Complex {
  const zR = (Math.PI * nMedium * waistRadiusMeters * waistRadiusMeters) / wavelengthMeters;
  return { re: 0, im: zR };
}

/**
 * Get the ABCD matrix for an optical element
 */
export function getElementMatrix(elem: OpticalElement): Matrix2x2 {
  if (elem.enabled === false) {
    return matrix2x2.identity();
  }

  switch (elem.type) {
    case 'thin-lens': {
      const fMeters = (elem.focalLengthMm || 100) * 1e-3;
      return matrix2x2.thinLens(fMeters);
    }
    case 'thick-lens': {
      const R1 = (elem.frontCurvatureR1Mm || 50) * 1e-3;
      const R2 = (elem.backCurvatureR2Mm || -50) * 1e-3;
      const d = (elem.thicknessMm || 3) * 1e-3;
      const n = elem.refractiveIndex || 1.5168;
      return matrix2x2.thickLens(R1, R2, d, n);
    }
    default:
      return matrix2x2.identity();
  }
}

/**
 * Simulate multi-segment Gaussian beam propagation along an optical bench [0, zMaxMm]
 */
export function simulateBeamPropagation(params: {
  initialWaistUm: number;
  wavelengthNm: number;
  powerWatts?: number;
  elements: OpticalElement[];
  zMaxMm?: number;
  numSamples?: number;
}): BeamSimulationResult {
  const {
    initialWaistUm,
    wavelengthNm,
    powerWatts = 0.01, // 10 mW default
    zMaxMm = 500,
    numSamples = 300
  } = params;

  const wavelengthM = Math.max(1e-12, wavelengthNm * 1e-9);
  const initialWaistM = Math.max(1e-9, initialWaistUm * 1e-6);
  const zMaxM = Math.max(0.01, zMaxMm * 1e-3);

  const initialZRM = (Math.PI * initialWaistM * initialWaistM) / wavelengthM;
  const initialRayleighRangeMm = initialZRM * 1e3;

  // Filter and sort enabled elements along propagation axis z
  const sortedElements = [...params.elements]
    .filter(e => e.enabled !== false && e.positionZMm >= 0 && e.positionZMm <= zMaxMm)
    .sort((a, b) => a.positionZMm - b.positionZMm);

  // Optical bench segments:
  // Segment 0: z in [0, z1]
  // Segment k: z in [zk, zk+1]
  // Segment N: z in [zN, zMax]
  interface SegmentState {
    index: number;
    startZMeters: number;
    endZMeters: number;
    qAtStart: Complex; // q parameter immediately at startZMeters
  }

  const segments: SegmentState[] = [];
  let currentZM = 0;
  let currentQ: Complex = { re: 0, im: initialZRM };

  for (let i = 0; i < sortedElements.length; i++) {
    const elem = sortedElements[i];
    const elemZM = elem.positionZMm * 1e-3;

    if (elemZM > currentZM) {
      // Free space drift up to element
      segments.push({
        index: segments.length,
        startZMeters: currentZM,
        endZMeters: elemZM,
        qAtStart: currentQ
      });
      // Drift q to element front: q(z) = q + delta_z
      const driftDist = elemZM - currentZM;
      currentQ = { re: currentQ.re + driftDist, im: currentQ.im };
      currentZM = elemZM;
    }

    // Transform q through element matrix
    const M = getElementMatrix(elem);
    currentQ = transformQ(M, currentQ);

    // If thick lens, advance position by lens physical thickness
    if (elem.type === 'thick-lens') {
      const thickM = Math.max(0, (elem.thicknessMm || 0) * 1e-3);
      currentZM = Math.min(zMaxM, currentZM + thickM);
    }
  }

  // Final segment from last element to zMaxM
  if (currentZM < zMaxM) {
    segments.push({
      index: segments.length,
      startZMeters: currentZM,
      endZMeters: zMaxM,
      qAtStart: currentQ
    });
  }

  // Detect all waists across segments
  const waists: BeamWaistPoint[] = [];

  for (const seg of segments) {
    // In free space, q(z) = (qAtStart.re + (z - startZ)) + j * qAtStart.im
    // Waist occurs when Re(q(z)) = 0 => z - startZ + qAtStart.re = 0
    // => z_waist = startZ - qAtStart.re
    const waistZM = seg.startZMeters - seg.qAtStart.re;
    const waistZMm = waistZM * 1e3;
    const waistRayleighM = seg.qAtStart.im;

    if (waistRayleighM > 0) {
      const waistRadiusM = Math.sqrt((wavelengthM * waistRayleighM) / Math.PI);
      const isReal = waistZM >= seg.startZMeters && waistZM <= seg.endZMeters;

      waists.push({
        positionZMm: waistZMm,
        waistRadiusUm: waistRadiusM * 1e6,
        rayleighRangeMm: waistRayleighM * 1e3,
        isReal,
        segmentIndex: seg.index
      });
    }
  }

  // Sample profile along z
  const samples: BeamProfileSample[] = [];
  const stepM = zMaxM / (numSamples - 1);

  for (let s = 0; s < numSamples; s++) {
    const zM = Math.min(zMaxM, s * stepM);
    const zMm = zM * 1e3;

    // Find applicable segment
    let seg = segments[segments.length - 1];
    for (const sg of segments) {
      if (zM >= sg.startZMeters && zM <= sg.endZMeters) {
        seg = sg;
        break;
      }
    }

    const deltaZM = zM - seg.startZMeters;
    const qZ: Complex = {
      re: seg.qAtStart.re + deltaZM,
      im: seg.qAtStart.im
    };

    const wM = getBeamRadiusFromQ(qZ, wavelengthM, 1.0);
    const RM = getWavefrontCurvatureFromQ(qZ);

    const wUm = wM * 1e6;
    const RMm = isFinite(RM) ? RM * 1e3 : Infinity;

    // Peak intensity I0 = 2 * P / (pi * w^2), avg intensity = P / (pi * w^2)
    const areaM2 = Math.PI * wM * wM;
    const peakIntensityWPerM2 = areaM2 > 0 ? (2 * powerWatts) / areaM2 : 0;
    const peakIntensityWPerCm2 = peakIntensityWPerM2 * 1e-4;
    const avgIntensityWPerM2 = areaM2 > 0 ? powerWatts / areaM2 : 0;
    const avgIntensityWPerCm2 = avgIntensityWPerM2 * 1e-4;

    const electricFieldVPerM = Math.sqrt(
      (2 * peakIntensityWPerM2) / (CODATA_2022.c * CODATA_2022.epsilon0)
    );
    const electricFieldVPerCm = electricFieldVPerM * 1e-2;
    const rayleighRangeMm = qZ.im * 1e3;

    samples.push({
      zMm,
      wUm,
      radiusCurvatureMm: RMm,
      peakIntensityWPerCm2,
      avgIntensityWPerCm2,
      electricFieldVPerCm,
      electricFieldVPerM,
      rayleighRangeMm,
      q: qZ,
      segmentIndex: seg.index
    });
  }

  return {
    samples,
    waists,
    elements: sortedElements,
    segments,
    zMaxMm,
    initialWaistUm,
    initialRayleighRangeMm,
    wavelengthNm
  };
}

/**
 * Analytical beam profile evaluation at an exact coordinate z (mm)
 */
export function evaluateBeamAtZ(
  simulation: BeamSimulationResult,
  zMm: number,
  powerWatts: number = 0.01
): BeamProfileSample | null {
  if (!simulation.segments || simulation.segments.length === 0) {
    return simulation.samples.length > 0 ? simulation.samples[0] : null;
  }

  const zM = Math.max(0, Math.min(simulation.zMaxMm * 1e-3, zMm * 1e-3));
  const wavelengthM = Math.max(1e-12, simulation.wavelengthNm * 1e-9);

  let seg = simulation.segments[simulation.segments.length - 1];
  for (const s of simulation.segments) {
    if (zM >= s.startZMeters && zM <= s.endZMeters) {
      seg = s;
      break;
    }
  }

  const deltaZM = zM - seg.startZMeters;
  const qZ: Complex = {
    re: seg.qAtStart.re + deltaZM,
    im: seg.qAtStart.im
  };

  const wM = getBeamRadiusFromQ(qZ, wavelengthM, 1.0);
  const RM = getWavefrontCurvatureFromQ(qZ);

  const wUm = wM * 1e6;
  const RMm = isFinite(RM) ? RM * 1e3 : Infinity;

  const areaM2 = Math.PI * wM * wM;
  const peakIntensityWPerM2 = areaM2 > 0 ? (2 * powerWatts) / areaM2 : 0;
  const peakIntensityWPerCm2 = peakIntensityWPerM2 * 1e-4;
  const avgIntensityWPerM2 = areaM2 > 0 ? powerWatts / areaM2 : 0;
  const avgIntensityWPerCm2 = avgIntensityWPerM2 * 1e-4;

  const electricFieldVPerM = Math.sqrt(
    (2 * peakIntensityWPerM2) / (CODATA_2022.c * CODATA_2022.epsilon0)
  );
  const electricFieldVPerCm = electricFieldVPerM * 1e-2;
  const rayleighRangeMm = qZ.im * 1e3;

  return {
    zMm,
    wUm,
    radiusCurvatureMm: RMm,
    peakIntensityWPerCm2,
    avgIntensityWPerCm2,
    electricFieldVPerCm,
    electricFieldVPerM,
    rayleighRangeMm,
    q: qZ,
    segmentIndex: seg.index
  };
}

/**
 * Optical presets
 */
export const OPTICAL_BENCH_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  initialWaistUm: number;
  zMaxMm: number;
  elements: OpticalElement[];
}> = [
  {
    id: 'keplerian-telescope',
    name: 'Keplerian Beam Expander (3×)',
    description: 'Two positive lenses (f1 = 50 mm, f2 = 150 mm) separated by f1 + f2 = 200 mm with an intermediate focus',
    initialWaistUm: 100,
    zMaxMm: 450,
    elements: [
      {
        id: 'lens-1',
        name: 'Input Lens (f = 50mm)',
        type: 'thin-lens',
        positionZMm: 100,
        focalLengthMm: 50,
        enabled: true
      },
      {
        id: 'lens-2',
        name: 'Output Lens (f = 150mm)',
        type: 'thin-lens',
        positionZMm: 300,
        focalLengthMm: 150,
        enabled: true
      }
    ]
  },
  {
    id: 'galilean-expander',
    name: 'Galilean Beam Expander (3×, No Focus)',
    description: 'Diverging input lens (f1 = -50 mm) and converging output lens (f2 = 150 mm) without internal high-intensity focus',
    initialWaistUm: 100,
    zMaxMm: 400,
    elements: [
      {
        id: 'lens-1',
        name: 'Negative Lens (f = -50mm)',
        type: 'thin-lens',
        positionZMm: 80,
        focalLengthMm: -50,
        enabled: true
      },
      {
        id: 'lens-2',
        name: 'Positive Lens (f = 150mm)',
        type: 'thin-lens',
        positionZMm: 180,
        focalLengthMm: 150,
        enabled: true
      }
    ]
  },
  {
    id: 'fiber-to-atom-focus',
    name: 'Fiber-to-Atom Dipole Trap Focus',
    description: 'Collimated fiber output (w0 = 1 mm) tightly focused down to ~20 µm for optical tweezers / single-atom trapping',
    initialWaistUm: 1000, // 1 mm
    zMaxMm: 350,
    elements: [
      {
        id: 'focus-lens',
        name: 'Achromat / Objective (f = 75mm)',
        type: 'thin-lens',
        positionZMm: 100,
        focalLengthMm: 75,
        enabled: true
      }
    ]
  }
];
