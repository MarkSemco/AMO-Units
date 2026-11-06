import { describe, it, expect } from 'vitest';
import {
  calculateGaussianBeam,
  calculateSaturationRabi,
  calculateDipoleRabi,
  dipoleFromDebye
} from '../laser-beam';

describe('Laser Beam & Rabi Frequency Engine', () => {
  it('calculates Gaussian peak intensity and Rayleigh range accurately', () => {
    // 10 mW beam focused to 100 um waist at 780.241 nm
    const beam = calculateGaussianBeam({
      powerWatts: 0.01,
      waistRadiusMeters: 100e-6,
      wavelengthMeters: 780.241e-9
    });

    // I0 = 2 * P / (pi * w0^2) approx 63.6619 W/cm^2
    expect(beam.peakIntensityWPerCm2).toBeCloseTo(63.662, 2);

    // Avg intensity = I0 / 2 approx 31.831 W/cm^2
    expect(beam.avgIntensityWPerCm2).toBeCloseTo(31.831, 2);

    // Rayleigh range z_R = pi * w0^2 / lambda approx 40.264 mm
    expect(beam.rayleighRangeMm).toBeCloseTo(40.264, 2);

    // Divergence half angle theta = lambda / (pi * w0) approx 2.4835 mrad
    expect(beam.divergenceHalfAngleMrad).toBeCloseTo(2.4835, 3);
  });

  it('calculates Rabi frequency from saturation parameter', () => {
    // Gamma / 2pi = 6.0 MHz, Isat = 1.67 mW/cm^2 = 16.7 W/m^2
    // Beam intensity = 33.4 W/m^2 -> s0 = 2.0 -> Omega = Gamma * sqrt(2/2) = Gamma
    const linewidthRadPerSec = 6.0 * 2 * Math.PI * 1e6;
    const isat = 16.7;
    const beamIntensity = 33.4;

    const rabi = calculateSaturationRabi({
      naturalLinewidthRadPerSec: linewidthRadPerSec,
      saturationIntensityWPerM2: isat,
      beamIntensityWPerM2: beamIntensity
    });

    // For s0 = 2, Omega / 2pi should equal Gamma / 2pi = 6.0 MHz
    expect(rabi.rabiFreqMHz).toBeCloseTo(6.0, 3);

    // tau_pi = pi / Omega = 1 / (2 * 6 MHz) approx 83.333 ns
    expect(rabi.piPulseNanoseconds).toBeCloseTo(83.333, 2);
    expect(rabi.piOver2PulseNanoseconds).toBeCloseTo(41.667, 2);
  });

  it('calculates Rabi frequency from dipole moment and electric field', () => {
    // Dipole moment d = 1.0 Debye, E0 = 1000 V/m
    const rabi = calculateDipoleRabi({
      dipoleMomentCm: dipoleFromDebye(1.0),
      electricFieldVPerM: 1000
    });

    expect(rabi.rabiFreqHz).toBeGreaterThan(0);
    expect(rabi.piPulseSeconds).toBeGreaterThan(0);
  });

  it('safely handles zero / invalid inputs without NaN', () => {
    const zeroBeam = calculateGaussianBeam({
      powerWatts: 0,
      waistRadiusMeters: 0,
      wavelengthMeters: 0
    });
    expect(zeroBeam.peakIntensityWPerCm2).toBe(0);
    expect(zeroBeam.rayleighRangeMeters).toBe(0);

    const zeroRabi = calculateSaturationRabi({
      naturalLinewidthRadPerSec: 0,
      saturationIntensityWPerM2: 0,
      beamIntensityWPerM2: 0
    });
    expect(zeroRabi.rabiFreqMHz).toBe(0);
    expect(zeroRabi.piPulseNanoseconds).toBe(0);
  });
});
