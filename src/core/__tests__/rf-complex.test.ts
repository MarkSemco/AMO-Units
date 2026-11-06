import { describe, it, expect } from 'vitest';
import {
  complex,
  calculateComplexGamma,
  gammaFromNormalizedZ,
  normalizedZFromGamma,
  synthesizeLMatch,
  calculateEquivalentLoad,
  formatInductance,
  formatCapacitance
} from '../rf-complex';

describe('Complex RF & Smith Chart Engine', () => {
  it('performs basic complex number arithmetic accurately', () => {
    const a = complex.create(3, 4);
    const b = complex.create(1, -2);

    const sum = complex.add(a, b);
    expect(sum.re).toBe(4);
    expect(sum.im).toBe(2);

    const diff = complex.sub(a, b);
    expect(diff.re).toBe(2);
    expect(diff.im).toBe(6);

    const prod = complex.mul(a, b);
    // (3 + 4j)(1 - 2j) = 3 - 6j + 4j - 8j^2 = 11 - 2j
    expect(prod.re).toBe(11);
    expect(prod.im).toBe(-2);

    const quot = complex.div(a, b);
    // (3 + 4j) / (1 - 2j) = (3 + 4j)(1 + 2j) / 5 = (-5 + 10j) / 5 = -1 + 2j
    expect(quot.re).toBe(-1);
    expect(quot.im).toBe(2);

    expect(complex.mag(a)).toBe(5);
    expect(complex.argDeg(complex.create(0, 1))).toBeCloseTo(90, 4);
    expect(complex.argDeg(complex.create(-1, 0))).toBeCloseTo(180, 4);
  });

  it('calculates complex reflection coefficient Gamma for standard terminations', () => {
    // Matched load: 50 + 0j at 50 ohms -> Gamma = 0
    const matched = calculateComplexGamma({ re: 50, im: 0 }, 50, 0.01);
    expect(matched.mag).toBeCloseTo(0, 5);
    expect(matched.vswr).toBeCloseTo(1.0, 5);
    expect(matched.returnLossDb).toBe(Infinity);
    expect(matched.realPowerPercent).toBeCloseTo(100, 4);
    expect(matched.reactiveVar).toBeCloseTo(0, 5);

    // Short circuit: 0 + 0j -> Gamma = -1 (mag = 1, phase = 180 deg)
    const short = calculateComplexGamma({ re: 0, im: 0 }, 50, 0.01);
    expect(short.mag).toBeCloseTo(1.0, 5);
    expect(short.phaseDeg).toBeCloseTo(180, 4);
    expect(short.returnLossDb).toBeCloseTo(0, 4);
    expect(short.realPowerWatts).toBeCloseTo(0, 5);

    // Reactive load: 50 + 50j at 50 ohms
    // Gamma = (50 + 50j - 50) / (50 + 50j + 50) = 50j / (100 + 50j) = j / (2 + j) = (1 + 2j) / 5
    // mag = sqrt(5) / 5 = 1 / sqrt(5) approx 0.44721
    const reactive = calculateComplexGamma({ re: 50, im: 50 }, 50, 0.01);
    expect(reactive.mag).toBeCloseTo(1 / Math.sqrt(5), 4);
    expect(reactive.gamma.re).toBeCloseTo(0.2, 4);
    expect(reactive.gamma.im).toBeCloseTo(0.4, 4);
    expect(reactive.phaseDeg).toBeCloseTo((Math.atan2(0.4, 0.2) * 180) / Math.PI, 3);

    // Delivered active power: P_inc * (1 - |Gamma|^2) = 10 mW * 0.8 = 8 mW
    expect(reactive.realPowerWatts).toBeCloseTo(0.008, 5);
    // Reactive power: 2 * P_inc * Im(Gamma) = 2 * 0.01 * 0.4 = 0.008 VAR = 8 mVAR
    expect(reactive.reactiveVar).toBeCloseTo(0.008, 5);
    // VSWR = (1 + 0.4472) / (1 - 0.4472) approx 2.618
    expect(reactive.vswr).toBeCloseTo((1 + 1 / Math.sqrt(5)) / (1 - 1 / Math.sqrt(5)), 3);
  });

  it('correctly maps between normalized impedance and Gamma (Smith chart mapping)', () => {
    const testCases = [
      { r: 1.0, x: 0.0 }, // center (Gamma = 0)
      { r: 0.5, x: 1.0 },
      { r: 2.0, x: -0.8 },
      { r: 0.0, x: 1.5 }
    ];

    for (const { r, x } of testCases) {
      const zNorm = complex.create(r, x);
      const gamma = gammaFromNormalizedZ(zNorm);
      const reconstructedZ = normalizedZFromGamma(gamma);

      expect(reconstructedZ.re).toBeCloseTo(r, 4);
      expect(reconstructedZ.im).toBeCloseTo(x, 4);
    }
  });

  it('synthesizes analytical L-section matching for RL > Z0', () => {
    // ZL = 100 + 50j, Z0 = 50 ohms, f = 100 MHz
    const zL = { re: 100, im: 50 };
    const z0 = 50;
    const freqHz = 100e6;

    const solutions = synthesizeLMatch(zL, z0, freqHz);
    expect(solutions.length).toBe(2);

    const lowPass = solutions.find(s => s.name === 'Low-Pass');
    const highPass = solutions.find(s => s.name === 'High-Pass');

    expect(lowPass).toBeDefined();
    expect(highPass).toBeDefined();

    // RL > Z0 order: Source -> Series -> Shunt -> Load
    expect(lowPass?.order).toBe('source-series-shunt-load');
    expect(lowPass?.elements.sourceSide.type).toBe('inductor');
    expect(lowPass?.elements.loadSide.type).toBe('capacitor');

    expect(highPass?.elements.sourceSide.type).toBe('capacitor');
    expect(highPass?.elements.loadSide.type).toBe('inductor');

    // Values should be positive physical values
    expect(lowPass?.elements.sourceSide.valueHenries).toBeGreaterThan(0);
    expect(lowPass?.elements.loadSide.valueFarads).toBeGreaterThan(0);
  });

  it('synthesizes analytical L-section matching for RL < Z0', () => {
    // ZL = 25 - 25j, Z0 = 50 ohms, f = 100 MHz
    const zL = { re: 25, im: -25 };
    const z0 = 50;
    const freqHz = 100e6;

    const solutions = synthesizeLMatch(zL, z0, freqHz);
    expect(solutions.length).toBe(2);

    // RL < Z0 order: Source -> Shunt -> Series -> Load
    const lowPass = solutions.find(s => s.name === 'Low-Pass');
    expect(lowPass?.order).toBe('source-shunt-series-load');
    expect(lowPass?.elements.sourceSide.type).toBe('capacitor');
    expect(lowPass?.elements.loadSide.type).toBe('inductor');

    expect(lowPass?.elements.sourceSide.valueFarads).toBeGreaterThan(0);
    expect(lowPass?.elements.loadSide.valueHenries).toBeGreaterThan(0);
  });

  it('synthesizes optimal complementary Low-Pass and High-Pass solutions for AOM coil (25+35j)', () => {
    // Default preset in application: 25 + 35j at 50 ohms and 100 MHz
    const zL = { re: 25, im: 35 };
    const solutions = synthesizeLMatch(zL, 50, 100e6);

    expect(solutions.length).toBe(2);
    const lowPass = solutions.find(s => s.name === 'Low-Pass');
    const highPass = solutions.find(s => s.name === 'High-Pass');

    expect(lowPass).toBeDefined();
    expect(highPass).toBeDefined();

    // Low-Pass topology should use series inductor and shunt capacitor
    expect(lowPass?.elements.sourceSide.type).toBe('inductor');
    expect(lowPass?.elements.loadSide.type).toBe('capacitor');
    expect(lowPass?.elements.sourceSide.valueHenries).toBeGreaterThan(0);
    expect(lowPass?.elements.loadSide.valueFarads).toBeGreaterThan(0);

    // High-Pass topology should be present with complementary elements
    expect(highPass?.elements.sourceSide.type).not.toBe(highPass?.elements.loadSide.type);
  });

  it('correctly classifies pure reactance cancellation when RL = Z0', () => {
    // Inductive excess at RL = 50 requires series capacitor -> High-Pass
    const indSol = synthesizeLMatch({ re: 50, im: 25 }, 50, 100e6);
    expect(indSol.length).toBe(1);
    expect(indSol[0].name).toBe('High-Pass');
    expect(indSol[0].elements.sourceSide.type).toBe('capacitor');

    // Capacitive excess at RL = 50 requires series inductor -> Low-Pass
    const capSol = synthesizeLMatch({ re: 50, im: -25 }, 50, 100e6);
    expect(capSol.length).toBe(1);
    expect(capSol[0].name).toBe('Low-Pass');
    expect(capSol[0].elements.sourceSide.type).toBe('inductor');
  });

  it('handles edge cases safely (invalid frequency, negative resistance, zero)', () => {
    const invalidFreq = synthesizeLMatch({ re: 50, im: 0 }, 50, 0);
    expect(invalidFreq).toEqual([]);

    const invalidR = synthesizeLMatch({ re: -10, im: 0 }, 50, 100e6);
    expect(invalidR).toEqual([]);

    const matchedPure = synthesizeLMatch({ re: 50, im: 0 }, 50, 100e6);
    expect(matchedPure).toEqual([]);

    // Pure short circuit has 0 dB return loss exactly
    const shortGamma = calculateComplexGamma({ re: 0, im: 0 }, 50);
    expect(shortGamma.returnLossDb).toBe(0);
  });

  it('calculates physical equivalent load and admittance accurately', () => {
    // 1. User screenshot test case: RL = 12, XL = 45 at 2.1 MHz
    const eq1 = calculateEquivalentLoad(12, 45, 2.1e6);
    expect(eq1.type).toBe('inductive');
    // L = 45 / (2 * pi * 2.1e6) approx 3.4105 uH
    expect(eq1.valueHenries).toBeCloseTo(3.4105e-6, 7);
    expect(eq1.qFactor).toBeCloseTo(45 / 12, 4);
    // Y = 1 / (12 + 45j) = (12 - 45j) / 2169
    expect(eq1.admittanceMilliSiemens.re).toBeCloseTo(12000 / 2169, 2);
    expect(eq1.admittanceMilliSiemens.im).toBeCloseTo(-45000 / 2169, 2);
    expect(eq1.componentDisplay).toContain('µH inductor');

    // 2. Capacitive test case: RL = 50, XL = -50 at 100 MHz
    const eq2 = calculateEquivalentLoad(50, -50, 100e6);
    expect(eq2.type).toBe('capacitive');
    // C = 1 / (2 * pi * 100e6 * 50) approx 31.83 pF
    expect(eq2.valueFarads).toBeCloseTo(31.831e-12, 14);
    expect(eq2.componentDisplay).toContain('pF capacitor');

    // 3. Pure resistive test case
    const eq3 = calculateEquivalentLoad(50, 0, 100e6);
    expect(eq3.type).toBe('purely-resistive');
    expect(eq3.qFactor).toBe(0);
  });

  it('enforces rigorous RF power conservation (P_inc = P_del + P_refl)', () => {
    const pInc = 0.05; // 50 mW
    const gammaRes = calculateComplexGamma({ re: 12, im: 45 }, 50, pInc);

    expect(gammaRes.incidentPowerWatts).toBe(pInc);
    // P_del + P_refl = P_inc
    expect(gammaRes.realPowerWatts + gammaRes.reflectedPowerWatts).toBeCloseTo(pInc, 8);
    expect(gammaRes.realPowerPercent + gammaRes.reflectedPowerPercent).toBeCloseTo(100, 5);

    // Mismatch Loss ML = -10 log10(1 - |Gamma|^2)
    const expectedMl = -10 * Math.log10(1 - gammaRes.mag * gammaRes.mag);
    expect(gammaRes.mismatchLossDb).toBeCloseTo(expectedMl, 4);

    // Line impedance extrema
    expect(gammaRes.zMax).toBeCloseTo(50 * gammaRes.vswr, 3);
    expect(gammaRes.zMin).toBeCloseTo(50 / gammaRes.vswr, 3);
  });

  it('formats inductors and capacitors with auto-scaled units', () => {
    expect(formatInductance(500e-12).display).toBe('500.00 pH');
    expect(formatInductance(47e-9).display).toBe('47.00 nH');
    expect(formatInductance(3.41e-6).display).toBe('3.410 µH');
    expect(formatInductance(10e-3).display).toBe('10.000 mH');

    expect(formatCapacitance(800e-15).display).toBe('800.00 fF');
    expect(formatCapacitance(22e-12).display).toBe('22.00 pF');
    expect(formatCapacitance(4.7e-9).display).toBe('4.700 nF');
    expect(formatCapacitance(10e-6).display).toBe('10.000 µF');
  });
});
