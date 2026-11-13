import { describe, it, expect } from 'vitest';
import {
  deriveOpticalQuantities,
  deriveOpticalUncertainties,
  energyFromWavelength,
  energyFromFrequency,
  energyFromAngularFrequency,
  energyFromElectronVolts,
  energyFromWavenumber,
  energyFromTemperature,
  energyUncertaintyFromWavelength,
  energyUncertaintyFromFrequency,
  energyUncertaintyFromAngularFrequency,
  energyUncertaintyFromElectronVolts,
  energyUncertaintyFromWavenumber,
  energyUncertaintyFromTemperature
} from '../optical';

describe('Optical & Energy Conversion Engine', () => {
  it('converts 780.241 nm (Rb D2 line) correctly to frequency and energy', () => {
    const lambdaMeters = 780.241e-9;
    const energyJ = energyFromWavelength(lambdaMeters);
    const quantities = deriveOpticalQuantities(energyJ);

    // nu = c / lambda = 299792458 / 780.241e-9 approx 384.230 THz
    expect(quantities.frequency.THz).toBeCloseTo(384.23048, 2);

    // E = h * nu in eV = E_J / 1.602176634e-19 approx 1.5890 eV
    expect(quantities.energy.eV).toBeCloseTo(1.58905, 2);

    // Wavenumber: 1 / (lambda in cm) = 1 / (780.241e-7) approx 12816.5 cm^-1
    expect(quantities.wavenumber.cmInv).toBeCloseTo(12816.55, 1);

    // Wavelength in nm
    expect(quantities.wavelength.nm).toBeCloseTo(780.241, 3);
  });

  it('guarantees bidirectional round-trip consistency across all representations', () => {
    const originalFreqHz = 384.230e12; // 384.230 THz
    const energyFromFreq = energyFromFrequency(originalFreqHz);
    const q1 = deriveOpticalQuantities(energyFromFreq);

    // Round-trip from wavelength
    const energyFromWavelengthDerived = energyFromWavelength(q1.wavelength.m);
    expect(energyFromWavelengthDerived).toBeCloseTo(energyFromFreq, 20);

    // Round-trip from eV
    const energyFromEvDerived = energyFromElectronVolts(q1.energy.eV);
    expect(energyFromEvDerived).toBeCloseTo(energyFromFreq, 20);

    // Round-trip from wavenumber
    const energyFromWavenumberDerived = energyFromWavenumber(q1.wavenumber.cmInv);
    expect(energyFromWavenumberDerived).toBeCloseTo(energyFromFreq, 20);

    // Round-trip from angular frequency
    const energyFromOmegaDerived = energyFromAngularFrequency(q1.angularFrequency.radPerSec);
    expect(energyFromOmegaDerived).toBeCloseTo(energyFromFreq, 20);

    // Round-trip from temperature
    const energyFromTempDerived = energyFromTemperature(q1.temperature.K);
    expect(energyFromTempDerived).toBeCloseTo(energyFromFreq, 20);
  });

  it('safely handles non-positive and boundary inputs without crashing', () => {
    expect(energyFromWavelength(0)).toBe(0);
    expect(energyFromWavelength(-500)).toBe(0);
    expect(energyFromFrequency(-100)).toBe(0);

    const zeroQuantities = deriveOpticalQuantities(0);
    expect(zeroQuantities.wavelength.nm).toBe(0);
    expect(zeroQuantities.frequency.Hz).toBe(0);
    expect(zeroQuantities.energy.eV).toBe(0);
  });

  it('correctly calculates angular frequency (rad/s, Mrad/s, Grad/s) and Hartree energy', () => {
    // 780.241 nm: freq = 384.230 THz -> omega = 2pi * nu approx 2.41418e15 rad/s
    const energyJ = energyFromWavelength(780.241e-9);
    const q = deriveOpticalQuantities(energyJ);

    expect(q.angularFrequency.radPerSec).toBeCloseTo(2.41418e15, -11);
    expect(q.angularFrequency.MradPerSec).toBeCloseTo(2.41418e9, -5);
    expect(q.angularFrequency.GradPerSec).toBeCloseTo(2.41418e6, -2);

    // Hartree energy Eh: 1 Hartree = 4.3597447222071e-18 J approx 27.2114 eV
    expect(q.energy.Eh).toBeCloseTo(energyJ / 4.3597447222071e-18, 5);

    // Wavelength in Angstroms: 780.241 nm = 7802.41 Angstroms
    expect(q.wavelength.angstrom).toBeCloseTo(7802.41, 2);
  });

  it('accurately converts cold molecule transition AlCl 261.5 nm (McCarron / Hemmerling labs)', () => {
    const eAlCl = energyFromWavelength(261.5e-9);
    const qAlCl = deriveOpticalQuantities(eAlCl);

    // Frequency = c / 261.5 nm approx 1146.434 THz
    expect(qAlCl.frequency.THz).toBeCloseTo(1146.434, 1);
    // Wavenumber approx 38240.9 cm^-1
    expect(qAlCl.wavenumber.cmInv).toBeCloseTo(38240.9, 0);
    // Energy in eV approx 4.741 eV (UV photon)
    expect(qAlCl.energy.eV).toBeCloseTo(4.741, 2);
  });

  describe('Uncertainty Propagation Engine (ISO GUM)', () => {
    it('propagates 1 pm uncertainty at 780.241 nm Rb transition across all optical representations', () => {
      const lambda = 780.241e-9;
      const sigmaLambda = 0.001e-9; // 1 pm uncertainty
      const energyJ = energyFromWavelength(lambda);
      const sigmaEnergyJ = energyUncertaintyFromWavelength(lambda, sigmaLambda);

      const q = deriveOpticalQuantities(energyJ);
      const u = deriveOpticalUncertainties(energyJ, sigmaEnergyJ);

      // Relative uncertainty should be identically preserved
      const relUncertainty = sigmaLambda / lambda;
      expect(u.wavelength.nm / q.wavelength.nm).toBeCloseTo(relUncertainty, 10);
      expect(u.frequency.THz / q.frequency.THz).toBeCloseTo(relUncertainty, 10);
      expect(u.angularFrequency.radPerSec / q.angularFrequency.radPerSec).toBeCloseTo(relUncertainty, 10);
      expect(u.energy.eV / q.energy.eV).toBeCloseTo(relUncertainty, 10);
      expect(u.wavenumber.cmInv / q.wavenumber.cmInv).toBeCloseTo(relUncertainty, 10);
      expect(u.temperature.K / q.temperature.K).toBeCloseTo(relUncertainty, 10);

      // Derived wavelength uncertainty in nm matches 0.001 nm (1 pm)
      expect(u.wavelength.nm).toBeCloseTo(0.001, 6);
      expect(u.wavelength.um).toBeCloseTo(0.000001, 8);
      expect(u.wavelength.angstrom).toBeCloseTo(0.01, 5);

      // Derived frequency uncertainty: ~384.23 THz * (1e-12 / 780.241e-9) approx 492.45 kHz = 0.00049245 GHz
      expect(u.frequency.MHz).toBeCloseTo(492.45, 1);
    });

    it('guarantees bidirectional round-trip consistency of uncertainties across all representations', () => {
      const baseFreqHz = 384.230e12; // 384.23 THz
      const baseEnergyJ = energyFromFrequency(baseFreqHz);

      // 1. Frequency uncertainty round-trip
      const sigmaFreqHz = 10e6; // 10 MHz uncertainty
      const sigmaEJ_fromFreq = energyUncertaintyFromFrequency(sigmaFreqHz);
      const uFromFreq = deriveOpticalUncertainties(baseEnergyJ, sigmaEJ_fromFreq);
      expect(uFromFreq.frequency.Hz).toBeCloseTo(sigmaFreqHz, 5);

      // 2. Wavelength uncertainty round-trip
      const lambdaMeters = deriveOpticalQuantities(baseEnergyJ).wavelength.m;
      const sigmaLambdaMeters = 0.005e-9; // 5 pm
      const sigmaEJ_fromWavelength = energyUncertaintyFromWavelength(lambdaMeters, sigmaLambdaMeters);
      const uFromWavelength = deriveOpticalUncertainties(baseEnergyJ, sigmaEJ_fromWavelength);
      expect(uFromWavelength.wavelength.m).toBeCloseTo(sigmaLambdaMeters, 15);

      // 3. Angular frequency uncertainty round-trip
      const sigmaOmega = 1e6; // 1 Mrad/s
      const sigmaEJ_fromOmega = energyUncertaintyFromAngularFrequency(sigmaOmega);
      const uFromOmega = deriveOpticalUncertainties(baseEnergyJ, sigmaEJ_fromOmega);
      expect(uFromOmega.angularFrequency.radPerSec).toBeCloseTo(sigmaOmega, 5);

      // 4. Energy eV uncertainty round-trip
      const sigmaEV = 1e-4; // 0.1 meV
      const sigmaEJ_fromEV = energyUncertaintyFromElectronVolts(sigmaEV);
      const uFromEV = deriveOpticalUncertainties(baseEnergyJ, sigmaEJ_fromEV);
      expect(uFromEV.energy.eV).toBeCloseTo(sigmaEV, 8);

      // 5. Wavenumber cm^-1 uncertainty round-trip
      const sigmaCmInv = 0.05; // 0.05 cm^-1
      const sigmaEJ_fromCmInv = energyUncertaintyFromWavenumber(sigmaCmInv);
      const uFromCmInv = deriveOpticalUncertainties(baseEnergyJ, sigmaEJ_fromCmInv);
      expect(uFromCmInv.wavenumber.cmInv).toBeCloseTo(sigmaCmInv, 8);

      // 6. Temperature Kelvin uncertainty round-trip
      const sigmaK = 0.2; // 0.2 Kelvin
      const sigmaEJ_fromTemp = energyUncertaintyFromTemperature(sigmaK);
      const uFromTemp = deriveOpticalUncertainties(baseEnergyJ, sigmaEJ_fromTemp);
      expect(uFromTemp.temperature.K).toBeCloseTo(sigmaK, 8);
    });

    it('safely handles zero, negative, NaN, and boundary uncertainty inputs without crashing', () => {
      expect(energyUncertaintyFromWavelength(500e-9, 0)).toBe(0);
      expect(energyUncertaintyFromWavelength(500e-9, -1e-9)).toBe(0);
      expect(energyUncertaintyFromWavelength(0, 1e-9)).toBe(0);
      expect(energyUncertaintyFromWavelength(NaN, 1e-9)).toBe(0);

      expect(energyUncertaintyFromFrequency(0)).toBe(0);
      expect(energyUncertaintyFromFrequency(-50)).toBe(0);
      expect(energyUncertaintyFromFrequency(NaN)).toBe(0);

      expect(energyUncertaintyFromAngularFrequency(-10)).toBe(0);
      expect(energyUncertaintyFromElectronVolts(-1)).toBe(0);
      expect(energyUncertaintyFromWavenumber(-0.5)).toBe(0);
      expect(energyUncertaintyFromTemperature(-5)).toBe(0);

      const zeroUnc = deriveOpticalUncertainties(1e-19, 0);
      expect(zeroUnc.wavelength.nm).toBe(0);
      expect(zeroUnc.frequency.Hz).toBe(0);
      expect(zeroUnc.energy.eV).toBe(0);
      expect(zeroUnc.wavenumber.cmInv).toBe(0);
      expect(zeroUnc.temperature.K).toBe(0);

      const zeroEnergyUnc = deriveOpticalUncertainties(0, 1e-21);
      expect(zeroEnergyUnc.wavelength.nm).toBe(0);
      expect(zeroEnergyUnc.frequency.Hz).toBe(0);
    });
  });
});
