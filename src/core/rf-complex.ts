/**
 * Complex RF Impedance, Reflection Coefficient, and L-Section Matching Network Engine
 */

export interface Complex {
  re: number;
  im: number;
}

export interface ComplexGammaResult {
  gamma: Complex;
  mag: number;
  phaseDeg: number;
  returnLossDb: number;
  mismatchLossDb: number;
  vswr: number;
  incidentPowerWatts: number;
  realPowerWatts: number;
  reflectedPowerWatts: number;
  reactiveVar: number;
  realPowerPercent: number;
  reflectedPowerPercent: number;
  zMax: number;
  zMin: number;
}

export interface MatchingElement {
  type: 'inductor' | 'capacitor';
  placement: 'series' | 'shunt';
  valueHenries?: number;
  valueFarads?: number;
  valueDisplay: string;
  reactanceOhms: number;
}

export interface LMatchSolution {
  name: 'Low-Pass' | 'High-Pass';
  topologyDescription: string;
  order: 'source-series-shunt-load' | 'source-shunt-series-load';
  elements: {
    sourceSide: MatchingElement;
    loadSide: MatchingElement;
  };
  qFactor: number;
}

/**
 * Complex number basic arithmetic
 */
export const complex = {
  create: (re: number, im: number): Complex => ({ re, im }),

  add: (a: Complex, b: Complex): Complex => ({
    re: a.re + b.re,
    im: a.im + b.im
  }),

  sub: (a: Complex, b: Complex): Complex => ({
    re: a.re - b.re,
    im: a.im - b.im
  }),

  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  }),

  div: (a: Complex, b: Complex): Complex => {
    const den = b.re * b.re + b.im * b.im;
    if (den === 0 || !isFinite(den)) {
      return { re: Infinity, im: Infinity };
    }
    return {
      re: (a.re * b.re + a.im * b.im) / den,
      im: (a.im * b.re - a.re * b.im) / den
    };
  },

  mag: (a: Complex): number => Math.hypot(a.re, a.im),

  arg: (a: Complex): number => Math.atan2(a.im, a.re),

  argDeg: (a: Complex): number => {
    const deg = (Math.atan2(a.im, a.re) * 180) / Math.PI;
    return deg;
  },

  fromPolar: (mag: number, phaseDeg: number): Complex => {
    const rad = (phaseDeg * Math.PI) / 180;
    return {
      re: mag * Math.cos(rad),
      im: mag * Math.sin(rad)
    };
  }
};

/**
 * Calculate complex reflection coefficient Gamma = (Z_L - Z_0) / (Z_L + Z_0)
 * and related RF power quantities given an incident forward power (default 1 Watt or P_fwd).
 */
export function calculateComplexGamma(
  zL: Complex,
  z0: number = 50,
  powerWatts: number = 0.01 // Default 10 mW
): ComplexGammaResult {
  const safeZ0 = z0 > 0 ? z0 : 50;
  const num = complex.sub(zL, { re: safeZ0, im: 0 });
  const den = complex.add(zL, { re: safeZ0, im: 0 });

  const gamma = complex.div(num, den);
  const mag = complex.mag(gamma);
  const phaseDeg = complex.argDeg(gamma);

  const safeMag = Math.min(0.999999, Math.max(0, isNaN(mag) ? 0 : mag));

  const returnLossDb = safeMag > 0 ? (mag >= 0.999999 ? 0 : -20 * Math.log10(safeMag)) : Infinity;
  const vswr = (1 + safeMag) / (1 - safeMag);

  const reflectedFraction = safeMag * safeMag;
  const transmittedFraction = Math.max(0, 1 - reflectedFraction);

  const mismatchLossDb =
    transmittedFraction > 0 ? -10 * Math.log10(transmittedFraction) : Infinity;

  const realPowerWatts = powerWatts * transmittedFraction;
  const reflectedPowerWatts = powerWatts * reflectedFraction;
  // Reactive power in VAR: Q = 2 * P_inc * Im(Gamma)
  const reactiveVar = 2 * powerWatts * (isNaN(gamma.im) ? 0 : gamma.im);

  const zMax = safeZ0 * vswr;
  const zMin = safeZ0 / vswr;

  return {
    gamma,
    mag,
    phaseDeg,
    returnLossDb,
    mismatchLossDb,
    vswr,
    incidentPowerWatts: powerWatts,
    realPowerWatts,
    reflectedPowerWatts,
    reactiveVar,
    realPowerPercent: transmittedFraction * 100,
    reflectedPowerPercent: reflectedFraction * 100,
    zMax,
    zMin
  };
}

/**
 * Convert normalized impedance z = r + jx to reflection coefficient Gamma (u + jv)
 */
export function gammaFromNormalizedZ(z: Complex): Complex {
  const num = complex.sub(z, { re: 1, im: 0 });
  const den = complex.add(z, { re: 1, im: 0 });
  return complex.div(num, den);
}

/**
 * Convert reflection coefficient Gamma (u + jv) to normalized impedance z = r + jx
 */
export function normalizedZFromGamma(gamma: Complex): Complex {
  const u = gamma.re;
  const v = gamma.im;
  const den = (1 - u) * (1 - u) + v * v;
  if (den < 1e-12) {
    return { re: 1e6, im: 0 };
  }
  const r = Math.max(0, (1 - u * u - v * v) / den);
  const x = (2 * v) / den;
  return { re: r, im: x };
}

/**
 * Format component values into practical engineering units (nH, uH, pF, nF)
 */
/**
 * Format component values into practical engineering units (pH, nH, uH, mH, fF, pF, nF, uF)
 */
export function formatInductance(henries: number): { value: number; display: string } {
  const absH = Math.abs(henries);
  if (absH < 1e-9) {
    const pH = henries * 1e12;
    return { value: pH, display: `${pH.toFixed(2)} pH` };
  }
  if (absH < 1e-6) {
    const nH = henries * 1e9;
    return { value: nH, display: `${nH.toFixed(2)} nH` };
  }
  if (absH < 1e-3) {
    const uH = henries * 1e6;
    return { value: uH, display: `${uH.toFixed(3)} µH` };
  }
  const mH = henries * 1e3;
  return { value: mH, display: `${mH.toFixed(3)} mH` };
}

export function formatCapacitance(farads: number): { value: number; display: string } {
  const absF = Math.abs(farads);
  if (absF < 1e-12) {
    const fF = farads * 1e15;
    return { value: fF, display: `${fF.toFixed(2)} fF` };
  }
  if (absF < 1e-9) {
    const pF = farads * 1e12;
    return { value: pF, display: `${pF.toFixed(2)} pF` };
  }
  if (absF < 1e-6) {
    const nF = farads * 1e9;
    return { value: nF, display: `${nF.toFixed(3)} nF` };
  }
  const uF = farads * 1e6;
  return { value: uF, display: `${uF.toFixed(3)} µF` };
}

export interface EquivalentLoadResult {
  type: 'inductive' | 'capacitive' | 'purely-resistive';
  rOhms: number;
  xOhms: number;
  valueHenries?: number;
  valueFarads?: number;
  componentDisplay: string; // e.g. "3.411 µH inductor" or "15.2 pF capacitor"
  qFactor: number; // |X_L| / R_L
  admittance: Complex; // Y_L = G + jB in Siemens
  admittanceMilliSiemens: Complex; // in mS
  admittanceDisplay: string; // e.g. "5.53 - j20.75 mS"
}

/**
 * Calculates physical equivalent lumped elements (L or C) and admittance Y_L for a load Z_L = R + jX.
 */
export function calculateEquivalentLoad(
  rOhms: number,
  xOhms: number,
  freqHz: number
): EquivalentLoadResult {
  const safeR = Math.max(0, isNaN(rOhms) ? 0 : rOhms);
  const safeX = isNaN(xOhms) ? 0 : xOhms;
  const safeF = freqHz > 0 ? freqHz : 1e6;
  const omega = 2 * Math.PI * safeF;

  const den = safeR * safeR + safeX * safeX;
  const admittance: Complex =
    den > 0 ? { re: safeR / den, im: -safeX / den } : { re: 0, im: 0 };

  const admittanceMilliSiemens: Complex = {
    re: admittance.re * 1e3,
    im: admittance.im * 1e3
  };

  const gMsStr = (Math.round(admittanceMilliSiemens.re * 100) / 100).toFixed(2);
  const bMsStr = (Math.round(Math.abs(admittanceMilliSiemens.im) * 100) / 100).toFixed(2);
  const sign = admittanceMilliSiemens.im >= 0 ? '+' : '-';
  const admittanceDisplay = `${gMsStr} ${sign} j${bMsStr} mS`;

  const qFactor = safeR > 0 ? Math.abs(safeX) / safeR : Math.abs(safeX) > 0 ? Infinity : 0;

  if (Math.abs(safeX) < 1e-9) {
    return {
      type: 'purely-resistive',
      rOhms: safeR,
      xOhms: 0,
      componentDisplay: 'Pure resistance (no reactive element)',
      qFactor: 0,
      admittance,
      admittanceMilliSiemens,
      admittanceDisplay
    };
  }

  if (safeX > 0) {
    const L = safeX / omega;
    const formatted = formatInductance(L);
    return {
      type: 'inductive',
      rOhms: safeR,
      xOhms: safeX,
      valueHenries: L,
      componentDisplay: `${formatted.display} inductor`,
      qFactor,
      admittance,
      admittanceMilliSiemens,
      admittanceDisplay
    };
  } else {
    const C = -1 / (omega * safeX);
    const formatted = formatCapacitance(C);
    return {
      type: 'capacitive',
      rOhms: safeR,
      xOhms: safeX,
      valueFarads: C,
      componentDisplay: `${formatted.display} capacitor`,
      qFactor,
      admittance,
      admittanceMilliSiemens,
      admittanceDisplay
    };
  }
}

/**
 * Synthesize L-section impedance matching network to match complex Z_L to real Z_0
 * at operating frequency f (Hz).
 * Returns both Low-Pass and High-Pass solutions if physically realizable.
 */
export function synthesizeLMatch(
  zL: Complex,
  z0: number = 50,
  freqHz: number = 100e6 // Default 100 MHz
): LMatchSolution[] {
  if (freqHz <= 0 || z0 <= 0 || zL.re <= 0) {
    return [];
  }

  const omega = 2 * Math.PI * freqHz;
  const RL = zL.re;
  const XL = zL.im;

  // Loaded Q factor
  const rRatio = Math.max(RL, z0) / Math.min(RL, z0);
  const qFactor = Math.sqrt(Math.max(0, rRatio - 1));

  if (Math.abs(RL - z0) < 1e-4) {
    // Pure reactive cancellation if RL approx equal to Z0
    if (Math.abs(XL) > 1e-4) {
      const cancelX = -XL;
      const element: MatchingElement =
        cancelX > 0
          ? {
              type: 'inductor',
              placement: 'series',
              valueHenries: cancelX / omega,
              valueDisplay: formatInductance(cancelX / omega).display,
              reactanceOhms: cancelX
            }
          : {
              type: 'capacitor',
              placement: 'series',
              valueFarads: -1 / (omega * cancelX),
              valueDisplay: formatCapacitance(-1 / (omega * cancelX)).display,
              reactanceOhms: cancelX
            };

      const dummyShunt: MatchingElement = {
        type: 'capacitor',
        placement: 'shunt',
        valueFarads: 0,
        valueDisplay: 'None (Direct)',
        reactanceOhms: 0
      };

      const solName = cancelX > 0 ? 'Low-Pass' : 'High-Pass';
      return [{
        name: solName,
        topologyDescription: `Series ${element.type} cancellation (R_L ≈ Z_0)`,
        order: 'source-series-shunt-load',
        elements: {
          sourceSide: element,
          loadSide: dummyShunt
        },
        qFactor
      }];
    }
    return [];
  }

  const rawSolutions: LMatchSolution[] = [];

  // Topology 1: Source -> Series -> Shunt -> Load
  // (Shunt element across Load, Series element toward Source)
  // Real solutions exist when GL <= 1/z0 <=> RL^2 + XL^2 >= RL * z0
  const YL_den = RL * RL + XL * XL;
  const GL = RL / YL_den;
  const BL = -XL / YL_den;
  const term1 = GL * (1 / z0 - GL);

  if (term1 >= 0) {
    const sqrtTerm1 = Math.sqrt(term1);
    const branches1 = [
      { Bp: -BL + sqrtTerm1, isLowPass: true },
      { Bp: -BL - sqrtTerm1, isLowPass: false }
    ];

    for (const b of branches1) {
      const Xs = ((BL + b.Bp) / GL) * z0;

      const seriesEl: MatchingElement =
        Xs >= 0
          ? {
              type: 'inductor',
              placement: 'series',
              valueHenries: Xs / omega,
              valueDisplay: formatInductance(Xs / omega).display,
              reactanceOhms: Xs
            }
          : {
              type: 'capacitor',
              placement: 'series',
              valueFarads: -1 / (omega * Xs),
              valueDisplay: formatCapacitance(-1 / (omega * Xs)).display,
              reactanceOhms: Xs
            };

      const shuntEl: MatchingElement =
        b.Bp >= 0
          ? {
              type: 'capacitor',
              placement: 'shunt',
              valueFarads: b.Bp / omega,
              valueDisplay: formatCapacitance(b.Bp / omega).display,
              reactanceOhms: b.Bp !== 0 ? -1 / b.Bp : 0
            }
          : {
              type: 'inductor',
              placement: 'shunt',
              valueHenries: -1 / (omega * b.Bp),
              valueDisplay: formatInductance(-1 / (omega * b.Bp)).display,
              reactanceOhms: b.Bp !== 0 ? -1 / b.Bp : 0
            };

      const name: 'Low-Pass' | 'High-Pass' = b.isLowPass ? 'Low-Pass' : 'High-Pass';
      rawSolutions.push({
        name,
        topologyDescription: `Series ${seriesEl.type} (source side) + Shunt ${shuntEl.type} (load side)`,
        order: 'source-series-shunt-load',
        elements: {
          sourceSide: seriesEl,
          loadSide: shuntEl
        },
        qFactor
      });
    }
  }

  // Topology 2: Source -> Shunt -> Series -> Load
  // (Series element on Load side, Shunt element on Source side)
  // Real solutions exist when RL <= z0
  const term2 = RL * (z0 - RL);
  if (term2 >= 0) {
    const sqrtTerm2 = Math.sqrt(term2);
    const branches2 = [
      { Xs: -XL + sqrtTerm2, isLowPass: true },
      { Xs: -XL - sqrtTerm2, isLowPass: false }
    ];

    for (const b of branches2) {
      const Bp = (b.Xs + XL) / (RL * z0);

      const shuntEl: MatchingElement =
        Bp >= 0
          ? {
              type: 'capacitor',
              placement: 'shunt',
              valueFarads: Bp / omega,
              valueDisplay: formatCapacitance(Bp / omega).display,
              reactanceOhms: Bp !== 0 ? -1 / Bp : 0
            }
          : {
              type: 'inductor',
              placement: 'shunt',
              valueHenries: -1 / (omega * Bp),
              valueDisplay: formatInductance(-1 / (omega * Bp)).display,
              reactanceOhms: Bp !== 0 ? -1 / Bp : 0
            };

      const seriesEl: MatchingElement =
        b.Xs >= 0
          ? {
              type: 'inductor',
              placement: 'series',
              valueHenries: b.Xs / omega,
              valueDisplay: formatInductance(b.Xs / omega).display,
              reactanceOhms: b.Xs
            }
          : {
              type: 'capacitor',
              placement: 'series',
              valueFarads: -1 / (omega * b.Xs),
              valueDisplay: formatCapacitance(-1 / (omega * b.Xs)).display,
              reactanceOhms: b.Xs
            };

      const name: 'Low-Pass' | 'High-Pass' = b.isLowPass ? 'Low-Pass' : 'High-Pass';
      rawSolutions.push({
        name,
        topologyDescription: `Shunt ${shuntEl.type} (source side) + Series ${seriesEl.type} (load side)`,
        order: 'source-shunt-series-load',
        elements: {
          sourceSide: shuntEl,
          loadSide: seriesEl
        },
        qFactor
      });
    }
  }

  // Select optimal Low-Pass and High-Pass solutions.
  // Prefer complementary element types (one inductor and one capacitor) for standard filtering behavior.
  const isComplementary = (sol: LMatchSolution) =>
    sol.elements.sourceSide.type !== sol.elements.loadSide.type;

  const lowPassCandidates = rawSolutions.filter(s => s.name === 'Low-Pass');
  const highPassCandidates = rawSolutions.filter(s => s.name === 'High-Pass');

  const bestLowPass =
    lowPassCandidates.find(isComplementary) || lowPassCandidates[0];
  const bestHighPass =
    highPassCandidates.find(isComplementary) || highPassCandidates[0];

  const result: LMatchSolution[] = [];
  if (bestLowPass) result.push(bestLowPass);
  if (bestHighPass) result.push(bestHighPass);

  return result;
}
