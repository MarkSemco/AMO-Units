import { describe, it, expect } from 'vitest';
import {
  calculateZeemanShift,
  calculateFieldFromZeemanShift,
  deriveFieldValues,
  BOHR_MAGNETON_MHZ_PER_GAUSS,
  NUCLEAR_MAGNETON_HZ_PER_GAUSS
} from '../zeeman';

describe('Magnetic Field & Zeeman Splitting Engine', () => {
  it('accurately verifies Bohr magneton baseline rate (~1.399624 MHz/Gauss)', () => {
    expect(BOHR_MAGNETON_MHZ_PER_GAUSS).toBeCloseTo(1.399624, 4);

    const shift1Gauss = calculateZeemanShift(1e-4, { gFactor: 1.0, deltaMF: 1.0 });
    expect(shift1Gauss.MHz).toBeCloseTo(1.399624, 4);
  });

  it('accurately verifies Nuclear magneton baseline rate (~762.259 Hz/Gauss)', () => {
    expect(NUCLEAR_MAGNETON_HZ_PER_GAUSS).toBeCloseTo(762.259, 2);

    const shiftNuc = calculateZeemanShift(1e-4, {
      gFactor: 1.0,
      deltaMF: 1.0,
      isNuclearMagneton: true
    });
    expect(shiftNuc.Hz).toBeCloseTo(762.259, 2);
  });

  it('calculates free electron ESR splitting in 1 Tesla (~28.025 GHz)', () => {
    const shift1T = calculateZeemanShift(1.0, { gFactor: 2.002319, deltaMF: 1.0 });
    // Delta nu = 2.002319 * 13.9962449 GHz approx 28.0249 GHz
    expect(shift1T.GHz).toBeCloseTo(28.0249, 2);
  });

  it('supports bidirectional field calculation from target frequency shift', () => {
    const targetFreqHz = 10e6; // 10 MHz
    const config = { gFactor: 1.0, deltaMF: 1.0 };
    const requiredTesla = calculateFieldFromZeemanShift(targetFreqHz, config);

    // Verify forward calculation gives back targetFreqHz
    const forwardShift = calculateZeemanShift(requiredTesla, config);
    expect(forwardShift.Hz).toBeCloseTo(targetFreqHz, 4);
  });

  it('handles field conversions between Gauss, Tesla, mT, and uT', () => {
    const fields = deriveFieldValues(0.01); // 0.01 Tesla = 100 Gauss
    expect(fields.Tesla).toBe(0.01);
    expect(fields.Gauss).toBe(100);
    expect(fields.milliTesla).toBe(10);
    expect(fields.microTesla).toBe(10000);
  });
});
