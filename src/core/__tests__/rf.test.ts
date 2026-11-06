import { describe, it, expect } from 'vitest';
import {
  deriveRfQuantities,
  wattsFromDbm,
  calculateAttenuationFromDb
} from '../rf-power';
import {
  deriveFromVswr,
  deriveFromReturnLoss
} from '../rf-vswr';

describe('RF Electronics & VSWR Engine', () => {
  it('converts 13 dBm at 50Ω to ~20 mW and ~1.0 Vrms (~2.828 Vpp)', () => {
    const watts = wattsFromDbm(13); // approx 0.01995 W
    expect(watts * 1000).toBeCloseTo(19.95, 2);

    const rf = deriveRfQuantities(watts, 50);
    expect(rf.power.dBm).toBeCloseTo(13.0, 3);
    expect(rf.voltage.Vrms).toBeCloseTo(0.9988, 3);
    // Vpp = 2 * sqrt(2) * 0.9988 approx 2.825 V
    expect(rf.voltage.Vpp).toBeCloseTo(2.825, 2);
  });

  it('correctly adapts voltages when changing impedance to 75Ω and 1MΩ', () => {
    const powerWatts = 0.02; // 20 mW
    const rf50 = deriveRfQuantities(powerWatts, 50);
    const rf75 = deriveRfQuantities(powerWatts, 75);
    const rfHighZ = deriveRfQuantities(powerWatts, 1000000);

    // Vrms = sqrt(P * Z0)
    expect(rf50.voltage.Vrms).toBeCloseTo(Math.sqrt(0.02 * 50), 4);
    expect(rf75.voltage.Vrms).toBeCloseTo(Math.sqrt(0.02 * 75), 4);
    expect(rfHighZ.voltage.Vrms).toBeCloseTo(Math.sqrt(0.02 * 1000000), 4);
  });

  it('calculates attenuation linear power and voltage ratios', () => {
    // 10 dB attenuator -> 10% power, 31.62% voltage
    const atten10 = calculateAttenuationFromDb(10);
    expect(atten10.powerRatio).toBeCloseTo(0.1, 4);
    expect(atten10.powerRatioPercent).toBeCloseTo(10.0, 2);
    expect(atten10.voltageRatio).toBeCloseTo(0.3162, 3);

    // 20 dB attenuator -> 1% power, 10% voltage
    const atten20 = calculateAttenuationFromDb(20);
    expect(atten20.powerRatio).toBeCloseTo(0.01, 4);
    expect(atten20.voltageRatio).toBeCloseTo(0.1, 4);
  });

  it('calculates VSWR, Reflection Coefficient, Return Loss, and Mismatch Loss', () => {
    // Ideal match: VSWR = 1.0 -> |Gamma| = 0, RL = Infinity, ML = 0 dB
    const ideal = deriveFromVswr(1.0);
    expect(ideal.gamma).toBe(0);
    expect(ideal.returnLossDb).toBe(Infinity);
    expect(ideal.mismatchLossDb).toBe(0);
    expect(ideal.reflectedPowerPercent).toBe(0);
    expect(ideal.transmittedPowerPercent).toBe(100);

    // VSWR = 1.5 -> |Gamma| = 0.20
    const vswr15 = deriveFromVswr(1.5);
    expect(vswr15.gamma).toBeCloseTo(0.20, 3);
    // RL = -20 * log10(0.2) approx 13.979 dB
    expect(vswr15.returnLossDb).toBeCloseTo(13.979, 3);
    // Reflected power % = (0.2)^2 * 100 = 4%
    expect(vswr15.reflectedPowerPercent).toBeCloseTo(4.0, 2);
    // Transmitted power % = 96%
    expect(vswr15.transmittedPowerPercent).toBeCloseTo(96.0, 2);
    // Mismatch loss = -10 * log10(0.96) approx 0.177 dB
    expect(vswr15.mismatchLossDb).toBeCloseTo(0.177, 3);
  });

  it('guarantees round-trip consistency across VSWR and Return Loss', () => {
    const originalRL = 20.0; // 20 dB Return Loss
    const fromRL = deriveFromReturnLoss(originalRL);
    expect(fromRL.returnLossDb).toBeCloseTo(originalRL, 3);

    // VSWR from that gamma
    const fromVswr = deriveFromVswr(fromRL.vswr);
    expect(fromVswr.returnLossDb).toBeCloseTo(originalRL, 3);
  });

  it('correctly converts across dBW, microwatts, dBuV, and dBmV', () => {
    // 0 dBW = 1.0 Watt = 1000 mW = 30 dBm
    const wFromDbw = wattsFromDbm(30);
    expect(wFromDbw).toBeCloseTo(1.0, 3);

    // 500 uW = 0.0005 W
    const q500uW = deriveRfQuantities(0.0005, 50);
    expect(q500uW.power.uW).toBeCloseTo(500, 3);
    expect(q500uW.power.mW).toBeCloseTo(0.5, 3);

    // 1 Vrms: dBuV = 20 * log10(1e6) = 120 dBuV, dBmV = 60 dBmV
    // Power at 50 ohms = 1^2 / 50 = 0.02 W
    const q1V = deriveRfQuantities(0.02, 50);
    expect(q1V.voltage.Vrms).toBeCloseTo(1.0, 4);
    expect(q1V.voltage.dBuV).toBeCloseTo(120.0, 3);
    expect(q1V.voltage.dBmV).toBeCloseTo(60.0, 3);
  });

  it('safely handles zero and non-positive power levels', () => {
    const zeroQ = deriveRfQuantities(0, 50);
    expect(zeroQ.power.W).toBe(0);
    expect(zeroQ.power.dBm).toBe(-Infinity);
    expect(zeroQ.voltage.Vrms).toBe(0);
    expect(zeroQ.voltage.dBuV).toBe(-Infinity);
  });
});
