import { CODATA_2022 } from '../constants/codata2022';

export interface OpticalState {
  energyJoules: number; // Canonical SI base
}

export interface OpticalQuantities {
  wavelength: {
    nm: number;
    um: number;
    m: number;
    angstrom: number;
  };
  frequency: {
    Hz: number;
    kHz: number;
    MHz: number;
    GHz: number;
    THz: number;
  };
  angularFrequency: {
    radPerSec: number;
    MradPerSec: number;
    GradPerSec: number;
  };
  energy: {
    eV: number;
    meV: number;
    ueV: number;
    J: number;
    Eh: number;
  };
  wavenumber: {
    cmInv: number;
    mInv: number;
  };
  temperature: {
    K: number;
    mK: number;
    uK: number;
    nK: number;
  };
}

/**
 * Compute canonical energy (Joules) from any representation
 */
export function energyFromWavelength(wavelengthMeters: number): number {
  if (wavelengthMeters <= 0) return 0;
  return (CODATA_2022.h * CODATA_2022.c) / wavelengthMeters;
}

export function energyFromFrequency(frequencyHz: number): number {
  if (frequencyHz < 0) return 0;
  return CODATA_2022.h * frequencyHz;
}

export function energyFromAngularFrequency(omegaRadPerSec: number): number {
  if (omegaRadPerSec < 0) return 0;
  return CODATA_2022.hbar * omegaRadPerSec;
}

export function energyFromElectronVolts(eV: number): number {
  return eV * CODATA_2022.e;
}

export function energyFromWavenumber(cmInv: number): number {
  // nu_tilde = 1/lambda in cm^-1 -> lambda = 1/(cmInv * 100) meters
  // E = h*c / lambda = h * c * (cmInv * 100)
  if (cmInv <= 0) return 0;
  return CODATA_2022.h * CODATA_2022.c * (cmInv * 100);
}

export function energyFromTemperature(tempKelvin: number): number {
  if (tempKelvin < 0) return 0;
  return CODATA_2022.kB * tempKelvin;
}

/**
 * Derive all optical and energy quantities from canonical energy (Joules)
 */
export function deriveOpticalQuantities(energyJoules: number): OpticalQuantities {
  if (energyJoules <= 0 || !isFinite(energyJoules)) {
    return {
      wavelength: { nm: 0, um: 0, m: 0, angstrom: 0 },
      frequency: { Hz: 0, kHz: 0, MHz: 0, GHz: 0, THz: 0 },
      angularFrequency: { radPerSec: 0, MradPerSec: 0, GradPerSec: 0 },
      energy: { eV: 0, meV: 0, ueV: 0, J: 0, Eh: 0 },
      wavenumber: { cmInv: 0, mInv: 0 },
      temperature: { K: 0, mK: 0, uK: 0, nK: 0 }
    };
  }

  // Wavelength in meters: lambda = h * c / E
  const lambdaMeters = (CODATA_2022.h * CODATA_2022.c) / energyJoules;
  const freqHz = energyJoules / CODATA_2022.h;
  const omegaRadPerSec = energyJoules / CODATA_2022.hbar;
  const energyEV = energyJoules / CODATA_2022.e;
  const wavenumberMInv = 1 / lambdaMeters;
  const wavenumberCmInv = wavenumberMInv / 100;
  const tempK = energyJoules / CODATA_2022.kB;

  return {
    wavelength: {
      m: lambdaMeters,
      um: lambdaMeters * 1e6,
      nm: lambdaMeters * 1e9,
      angstrom: lambdaMeters * 1e10
    },
    frequency: {
      Hz: freqHz,
      kHz: freqHz / 1e3,
      MHz: freqHz / 1e6,
      GHz: freqHz / 1e9,
      THz: freqHz / 1e12
    },
    angularFrequency: {
      radPerSec: omegaRadPerSec,
      MradPerSec: omegaRadPerSec / 1e6,
      GradPerSec: omegaRadPerSec / 1e9
    },
    energy: {
      J: energyJoules,
      eV: energyEV,
      meV: energyEV * 1e3,
      ueV: energyEV * 1e6,
      Eh: energyJoules / CODATA_2022.Eh
    },
    wavenumber: {
      mInv: wavenumberMInv,
      cmInv: wavenumberCmInv
    },
    temperature: {
      K: tempK,
      mK: tempK * 1e3,
      uK: tempK * 1e6,
      nK: tempK * 1e9
    }
  };
}
