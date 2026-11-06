/**
 * VSWR, Reflection Coefficient, Return Loss, and Mismatch Loss Engine
 */

export interface VswrQuantities {
  vswr: number;
  gamma: number; // |Gamma| reflection coefficient magnitude (0 to 1)
  returnLossDb: number;
  mismatchLossDb: number;
  reflectedPowerPercent: number;
  transmittedPowerPercent: number;
}

/**
 * Derive all VSWR and mismatch metrics from reflection coefficient |Gamma| (0 to 1)
 */
export function deriveFromGamma(gamma: number): VswrQuantities {
  const safeGamma = Math.max(0, Math.min(0.999999, Math.abs(gamma)));

  const vswr = (1 + safeGamma) / (1 - safeGamma);
  const returnLossDb = safeGamma > 0 ? -20 * Math.log10(safeGamma) : Infinity;
  const reflectedFraction = Math.pow(safeGamma, 2);
  const transmittedFraction = Math.max(0, 1 - reflectedFraction);
  const mismatchLossDb = transmittedFraction >= 1 ? 0 : (transmittedFraction > 0 ? -10 * Math.log10(transmittedFraction) : Infinity);

  return {
    vswr,
    gamma: safeGamma,
    returnLossDb,
    mismatchLossDb,
    reflectedPowerPercent: reflectedFraction * 100,
    transmittedPowerPercent: transmittedFraction * 100
  };
}

/**
 * Derive from VSWR (>= 1.0)
 */
export function deriveFromVswr(vswr: number): VswrQuantities {
  const safeVswr = Math.max(1.0, isNaN(vswr) ? 1.0 : vswr);
  const gamma = (safeVswr - 1) / (safeVswr + 1);
  return deriveFromGamma(gamma);
}

/**
 * Derive from Return Loss in dB (>= 0)
 */
export function deriveFromReturnLoss(returnLossDb: number): VswrQuantities {
  if (returnLossDb <= 0 || !isFinite(returnLossDb)) {
    return deriveFromGamma(1.0);
  }
  const gamma = Math.pow(10, -returnLossDb / 20);
  return deriveFromGamma(gamma);
}

/**
 * Derive from Mismatch Loss in dB (>= 0)
 */
export function deriveFromMismatchLoss(mismatchLossDb: number): VswrQuantities {
  if (mismatchLossDb <= 0 || !isFinite(mismatchLossDb)) {
    return deriveFromGamma(0);
  }
  const transFraction = Math.pow(10, -mismatchLossDb / 10);
  const reflFraction = Math.max(0, 1 - transFraction);
  const gamma = Math.sqrt(reflFraction);
  return deriveFromGamma(gamma);
}

/**
 * Derive from Reflected Power Percentage (0 to 100)
 */
export function deriveFromReflectedPowerPercent(reflPercent: number): VswrQuantities {
  const safePercent = Math.max(0, Math.min(100, isNaN(reflPercent) ? 0 : reflPercent));
  const gamma = Math.sqrt(safePercent / 100);
  return deriveFromGamma(gamma);
}
