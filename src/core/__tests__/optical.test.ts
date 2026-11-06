import { describe, it, expect } from 'vitest';
import {
  deriveOpticalQuantities,
  energyFromWavelength,
  energyFromFrequency,
  energyFromElectronVolts,
  energyFromWavenumber,
  energyFromTemperature
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
});
