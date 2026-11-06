import { CODATA_2022 } from '../constants/codata2022';

export interface GaussianBeamParams {
  powerWatts: number;
  waistRadiusMeters: number; // w0
  wavelengthMeters: number; // lambda
}

export interface GaussianBeamResults {
  peakIntensityWPerM2: number;
  peakIntensityWPerCm2: number;
  peakIntensityMwPerMm2: number;
  avgIntensityWPerM2: number;
  avgIntensityWPerCm2: number;
  rayleighRangeMeters: number;
  rayleighRangeMm: number;
  divergenceHalfAngleRad: number;
  divergenceHalfAngleMrad: number;
  divergenceHalfAngleDeg: number;
  electricFieldVPerM: number;
  electricFieldVPerCm: number;
}

export interface DipoleRabiParams {
  dipoleMomentCm: number; // in C * m
  electricFieldVPerM: number;
}

export interface SaturationRabiParams {
  naturalLinewidthRadPerSec: number; // Gamma (rad/s)
  saturationIntensityWPerM2: number; // Isat (W/m^2)
  beamIntensityWPerM2: number; // I0
}

export interface RabiResults {
  rabiFreqRadPerSec: number; // Omega
  rabiFreqHz: number; // Omega / 2pi
  rabiFreqKHz: number;
  rabiFreqMHz: number;
  rabiFreqGHz: number;
  piPulseSeconds: number; // tau_pi = pi / Omega
  piPulseMicroseconds: number;
  piPulseNanoseconds: number;
  piOver2PulseNanoseconds: number;
  saturationParameterS0?: number;
}

/**
 * Calculate Gaussian beam optical parameters
 */
export function calculateGaussianBeam(params: GaussianBeamParams): GaussianBeamResults {
  const { powerWatts, waistRadiusMeters, wavelengthMeters } = params;

  if (powerWatts <= 0 || waistRadiusMeters <= 0 || wavelengthMeters <= 0) {
    return {
      peakIntensityWPerM2: 0,
      peakIntensityWPerCm2: 0,
      peakIntensityMwPerMm2: 0,
      avgIntensityWPerM2: 0,
      avgIntensityWPerCm2: 0,
      rayleighRangeMeters: 0,
      rayleighRangeMm: 0,
      divergenceHalfAngleRad: 0,
      divergenceHalfAngleMrad: 0,
      divergenceHalfAngleDeg: 0,
      electricFieldVPerM: 0,
      electricFieldVPerCm: 0
    };
  }

  // Beam area: pi * w0^2
  const beamAreaM2 = Math.PI * Math.pow(waistRadiusMeters, 2);

  // Peak intensity: I0 = 2 * P / (pi * w0^2)
  const peakIntensityWPerM2 = (2 * powerWatts) / beamAreaM2;
  const peakIntensityWPerCm2 = peakIntensityWPerM2 * 1e-4; // 1 m^2 = 10,000 cm^2
  const peakIntensityMwPerMm2 = (peakIntensityWPerM2 * 1e3) / 1e6; // 1 W = 1000 mW, 1 m^2 = 1e6 mm^2

  // Average intensity within waist radius: P / (pi * w0^2) = I0 / 2
  const avgIntensityWPerM2 = powerWatts / beamAreaM2;
  const avgIntensityWPerCm2 = avgIntensityWPerM2 * 1e-4;

  // Rayleigh range: z_R = pi * w0^2 / lambda
  const rayleighRangeMeters = beamAreaM2 / wavelengthMeters;
  const rayleighRangeMm = rayleighRangeMeters * 1e3;

  // Far-field divergence half-angle: theta = lambda / (pi * w0)
  const divergenceHalfAngleRad = wavelengthMeters / (Math.PI * waistRadiusMeters);
  const divergenceHalfAngleMrad = divergenceHalfAngleRad * 1e3;
  const divergenceHalfAngleDeg = (divergenceHalfAngleRad * 180) / Math.PI;

  // Electric field amplitude: E0 = sqrt(2 * I0 / (c * epsilon0))
  const electricFieldVPerM = Math.sqrt(
    (2 * peakIntensityWPerM2) / (CODATA_2022.c * CODATA_2022.epsilon0)
  );
  const electricFieldVPerCm = electricFieldVPerM * 1e-2;

  return {
    peakIntensityWPerM2,
    peakIntensityWPerCm2,
    peakIntensityMwPerMm2,
    avgIntensityWPerM2,
    avgIntensityWPerCm2,
    rayleighRangeMeters,
    rayleighRangeMm,
    divergenceHalfAngleRad,
    divergenceHalfAngleMrad,
    divergenceHalfAngleDeg,
    electricFieldVPerM,
    electricFieldVPerCm
  };
}

/**
 * Calculate Rabi frequency from electric dipole moment:
 * Omega = d * E0 / hbar
 */
export function calculateDipoleRabi(params: DipoleRabiParams): RabiResults {
  const { dipoleMomentCm, electricFieldVPerM } = params;

  if (dipoleMomentCm <= 0 || electricFieldVPerM <= 0) {
    return createZeroRabiResults();
  }

  const omegaRadPerSec = (dipoleMomentCm * electricFieldVPerM) / CODATA_2022.hbar;
  return formatRabiResults(omegaRadPerSec);
}

/**
 * Calculate Rabi frequency from saturation parameter:
 * Omega = Gamma * sqrt(s0 / 2) = Gamma * sqrt(I / (2 * Isat))
 */
export function calculateSaturationRabi(params: SaturationRabiParams): RabiResults {
  const { naturalLinewidthRadPerSec, saturationIntensityWPerM2, beamIntensityWPerM2 } = params;

  if (naturalLinewidthRadPerSec <= 0 || saturationIntensityWPerM2 <= 0 || beamIntensityWPerM2 <= 0) {
    return createZeroRabiResults();
  }

  const s0 = beamIntensityWPerM2 / saturationIntensityWPerM2;
  const omegaRadPerSec = naturalLinewidthRadPerSec * Math.sqrt(s0 / 2);
  const results = formatRabiResults(omegaRadPerSec);
  results.saturationParameterS0 = s0;
  return results;
}

/**
 * Helper to convert dipole unit representations to C * m
 */
export function dipoleFromDebye(debye: number): number {
  return debye * CODATA_2022.Debye;
}

export function dipoleFromAtomicUnits(ea0: number): number {
  return ea0 * CODATA_2022.e * CODATA_2022.a0;
}

function formatRabiResults(omegaRadPerSec: number): RabiResults {
  const rabiFreqHz = omegaRadPerSec / (2 * Math.PI);
  const piPulseSeconds = omegaRadPerSec > 0 ? Math.PI / omegaRadPerSec : 0;

  return {
    rabiFreqRadPerSec: omegaRadPerSec,
    rabiFreqHz,
    rabiFreqKHz: rabiFreqHz / 1e3,
    rabiFreqMHz: rabiFreqHz / 1e6,
    rabiFreqGHz: rabiFreqHz / 1e9,
    piPulseSeconds,
    piPulseMicroseconds: piPulseSeconds * 1e6,
    piPulseNanoseconds: piPulseSeconds * 1e9,
    piOver2PulseNanoseconds: (piPulseSeconds / 2) * 1e9
  };
}

function createZeroRabiResults(): RabiResults {
  return {
    rabiFreqRadPerSec: 0,
    rabiFreqHz: 0,
    rabiFreqKHz: 0,
    rabiFreqMHz: 0,
    rabiFreqGHz: 0,
    piPulseSeconds: 0,
    piPulseMicroseconds: 0,
    piPulseNanoseconds: 0,
    piOver2PulseNanoseconds: 0
  };
}
