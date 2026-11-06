import { describe, it, expect } from 'vitest';
import goldenOptical from '../../../../tests/fixtures/wolfram-golden-optical.json';
import {
  deriveOpticalQuantities,
  energyFromWavelength,
  energyFromFrequency,
  energyFromElectronVolts,
  energyFromWavenumber,
  energyFromTemperature
} from '../../optical';

describe('Zero-Trust Optical & Energy Accuracy Suite (Wolfram & CODATA 2022 Ground Truth)', () => {
  const cases = goldenOptical.testCases;

  it('contains expected number of verified spectral test points across UV to FIR', () => {
    expect(cases.length).toBeGreaterThanOrEqual(30);
  });

  describe.each(cases)('Wavelength $wavelengthNm nm ($frequencyTHz THz)', (tc) => {
    it('accurately derives frequency, energy, wavenumber, and thermal equivalence from wavelength', () => {
      const energyJ = energyFromWavelength(tc.wavelengthM);
      const q = deriveOpticalQuantities(energyJ);

      // Relative tolerance epsilon = 1e-11 (IEEE-754 precision limit)
      const relError = (actual: number, expected: number) =>
        Math.abs(actual - expected) / Math.abs(expected);

      // 1. Wavelength in nm
      expect(relError(q.wavelength.nm, tc.wavelengthNm)).toBeLessThan(1e-11);

      // 2. Frequency in Hz and THz
      expect(relError(q.frequency.Hz, tc.frequencyHz)).toBeLessThan(1e-11);
      expect(relError(q.frequency.THz, tc.frequencyTHz)).toBeLessThan(1e-11);

      // 3. Energy in Joules, eV, and Hartree Eh
      expect(relError(q.energy.J, tc.energyJ)).toBeLessThan(1e-11);
      expect(relError(q.energy.eV, tc.energyEV)).toBeLessThan(1e-11);
      expect(relError(q.energy.Eh, tc.energyEh)).toBeLessThan(1e-11);

      // 4. Wavenumber in cm^-1 and m^-1
      expect(relError(q.wavenumber.cmInv, tc.wavenumberCmInv)).toBeLessThan(1e-11);
      expect(relError(q.wavenumber.mInv, tc.wavenumberMInv)).toBeLessThan(1e-11);

      // 5. Equivalent Thermal Temperature in Kelvin
      expect(relError(q.temperature.K, tc.temperatureK)).toBeLessThan(1e-11);

      // 6. Angular Frequency in rad/s
      expect(relError(q.angularFrequency.radPerSec, tc.angularFrequencyRadPerSec)).toBeLessThan(1e-11);
    });

    it('reproduces canonical energy from every individual unit representation', () => {
      const eFromMeters = energyFromWavelength(tc.wavelengthM);
      const eFromHz = energyFromFrequency(tc.frequencyHz);
      const eFromEV = energyFromElectronVolts(tc.energyEV);
      const eFromCmInv = energyFromWavenumber(tc.wavenumberCmInv);
      const eFromK = energyFromTemperature(tc.temperatureK);

      const relErr = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

      expect(relErr(eFromMeters, tc.energyJ)).toBeLessThan(1e-11);
      expect(relErr(eFromHz, tc.energyJ)).toBeLessThan(1e-11);
      expect(relErr(eFromEV, tc.energyJ)).toBeLessThan(1e-11);
      expect(relErr(eFromCmInv, tc.energyJ)).toBeLessThan(1e-11);
      expect(relErr(eFromK, tc.energyJ)).toBeLessThan(1e-11);
    });
  });
});
