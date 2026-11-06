import { CODATA_2022 } from '../constants/codata2022';

export interface ZeemanConfig {
  gFactor: number; // e.g. 2.002319 for free electron, or custom gF
  deltaMF: number; // magnetic sublevel difference (default 1)
  isNuclearMagneton?: boolean; // whether using mu_N instead of mu_B
}

export interface MagneticFieldValues {
  Tesla: number;
  Gauss: number;
  milliTesla: number;
  microTesla: number;
}

export interface ZeemanShiftValues {
  Hz: number;
  kHz: number;
  MHz: number;
  GHz: number;
  wavenumberCmInv: number;
  energyJoules: number;
  energyEV: number;
}

/**
 * Baseline Bohr magneton splitting constant: mu_B / h in Hz / Tesla
 * ~ 13.9962449 GHz / T = 1.39962449 MHz / Gauss
 */
export const BOHR_MAGNETON_HZ_PER_TESLA = CODATA_2022.muB / CODATA_2022.h;
export const BOHR_MAGNETON_MHZ_PER_GAUSS = (BOHR_MAGNETON_HZ_PER_TESLA * 1e-4) / 1e6;

/**
 * Baseline Nuclear magneton splitting constant: mu_N / h in Hz / Tesla
 * ~ 7.622593 MHz / T = 762.2593 Hz / Gauss
 */
export const NUCLEAR_MAGNETON_HZ_PER_TESLA = CODATA_2022.muN / CODATA_2022.h;
export const NUCLEAR_MAGNETON_HZ_PER_GAUSS = NUCLEAR_MAGNETON_HZ_PER_TESLA * 1e-4;

/**
 * Convert magnetic field between units (Canonical: Tesla)
 */
export function teslaFromGauss(gauss: number): number {
  return gauss * 1e-4;
}

export function gaussFromTesla(tesla: number): number {
  return tesla * 1e4;
}

export function deriveFieldValues(fieldTesla: number): MagneticFieldValues {
  return {
    Tesla: fieldTesla,
    Gauss: fieldTesla * 1e4,
    milliTesla: fieldTesla * 1e3,
    microTesla: fieldTesla * 1e6
  };
}

/**
 * Calculate Zeeman frequency shift:
 * Delta nu = (mu * g * deltaMF * B) / h
 */
export function calculateZeemanShift(
  fieldTesla: number,
  config: ZeemanConfig
): ZeemanShiftValues {
  const magneton = config.isNuclearMagneton ? CODATA_2022.muN : CODATA_2022.muB;
  const energyJ = Math.abs(magneton * config.gFactor * config.deltaMF * fieldTesla);
  const freqHz = energyJ / CODATA_2022.h;
  const wavenumberCmInv = freqHz / (CODATA_2022.c * 100);

  return {
    Hz: freqHz,
    kHz: freqHz / 1e3,
    MHz: freqHz / 1e6,
    GHz: freqHz / 1e9,
    wavenumberCmInv,
    energyJoules: energyJ,
    energyEV: energyJ / CODATA_2022.e
  };
}

/**
 * Calculate required Magnetic Field (in Tesla) from desired Zeeman frequency shift
 */
export function calculateFieldFromZeemanShift(
  freqHz: number,
  config: ZeemanConfig
): number {
  const denominator = (config.isNuclearMagneton ? CODATA_2022.muN : CODATA_2022.muB) * Math.abs(config.gFactor * config.deltaMF);
  if (denominator === 0) return 0;
  return (freqHz * CODATA_2022.h) / denominator;
}
