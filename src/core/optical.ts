import { CODATA_2022 } from '../constants/codata2022';

export interface OpticalState {
  energyJoules: number; // Canonical SI base
  energyUncertaintyJoules?: number; // Canonical SI base uncertainty (>= 0)
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

export interface OpticalUncertainties {
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
  const wavenumberMInv = energyJoules / (CODATA_2022.h * CODATA_2022.c);
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

/**
 * Compute canonical energy uncertainty (Joules) from wavelength uncertainty:
 * |dE/dlambda| = h*c / lambda^2
 * sigma_E = (h*c / lambda^2) * sigma_lambda
 */
export function energyUncertaintyFromWavelength(wavelengthMeters: number, uncertaintyMeters: number): number {
  if (wavelengthMeters <= 0 || uncertaintyMeters <= 0 || !isFinite(wavelengthMeters) || !isFinite(uncertaintyMeters)) {
    return 0;
  }
  return ((CODATA_2022.h * CODATA_2022.c) / (wavelengthMeters * wavelengthMeters)) * uncertaintyMeters;
}

/**
 * Compute canonical energy uncertainty (Joules) from frequency uncertainty:
 * E = h * nu => sigma_E = h * sigma_nu
 */
export function energyUncertaintyFromFrequency(uncertaintyHz: number): number {
  if (uncertaintyHz <= 0 || !isFinite(uncertaintyHz)) return 0;
  return CODATA_2022.h * uncertaintyHz;
}

/**
 * Compute canonical energy uncertainty (Joules) from angular frequency uncertainty:
 * E = hbar * omega => sigma_E = hbar * sigma_omega
 */
export function energyUncertaintyFromAngularFrequency(uncertaintyRadPerSec: number): number {
  if (uncertaintyRadPerSec <= 0 || !isFinite(uncertaintyRadPerSec)) return 0;
  return CODATA_2022.hbar * uncertaintyRadPerSec;
}

/**
 * Compute canonical energy uncertainty (Joules) from electron-volt uncertainty:
 * E = e * eV => sigma_E = e * sigma_eV
 */
export function energyUncertaintyFromElectronVolts(uncertaintyEV: number): number {
  if (uncertaintyEV <= 0 || !isFinite(uncertaintyEV)) return 0;
  return uncertaintyEV * CODATA_2022.e;
}

/**
 * Compute canonical energy uncertainty (Joules) from wavenumber uncertainty (in cm^-1):
 * E = h * c * (cm^-1 * 100) => sigma_E = h * c * 100 * sigma_cmInv
 */
export function energyUncertaintyFromWavenumber(uncertaintyCmInv: number): number {
  if (uncertaintyCmInv <= 0 || !isFinite(uncertaintyCmInv)) return 0;
  return CODATA_2022.h * CODATA_2022.c * (uncertaintyCmInv * 100);
}

/**
 * Compute canonical energy uncertainty (Joules) from temperature uncertainty (in Kelvin):
 * E = kB * T => sigma_E = kB * sigma_T
 */
export function energyUncertaintyFromTemperature(uncertaintyKelvin: number): number {
  if (uncertaintyKelvin <= 0 || !isFinite(uncertaintyKelvin)) return 0;
  return CODATA_2022.kB * uncertaintyKelvin;
}

/**
 * Derive optical standard uncertainties from canonical energy and its uncertainty (ISO GUM first-order)
 */
export function deriveOpticalUncertainties(
  energyJoules: number,
  energyUncertaintyJoules: number
): OpticalUncertainties {
  if (
    energyJoules <= 0 ||
    energyUncertaintyJoules <= 0 ||
    !isFinite(energyJoules) ||
    !isFinite(energyUncertaintyJoules)
  ) {
    return {
      wavelength: { nm: 0, um: 0, m: 0, angstrom: 0 },
      frequency: { Hz: 0, kHz: 0, MHz: 0, GHz: 0, THz: 0 },
      angularFrequency: { radPerSec: 0, MradPerSec: 0, GradPerSec: 0 },
      energy: { eV: 0, meV: 0, ueV: 0, J: 0, Eh: 0 },
      wavenumber: { cmInv: 0, mInv: 0 },
      temperature: { K: 0, mK: 0, uK: 0, nK: 0 }
    };
  }

  // Fractional / relative uncertainty: sigma_E / E
  const relUncertainty = energyUncertaintyJoules / energyJoules;

  // Wavelength uncertainty: sigma_lambda = lambda * (sigma_E / E)
  const lambdaMeters = (CODATA_2022.h * CODATA_2022.c) / energyJoules;
  const sigmaLambdaMeters = lambdaMeters * relUncertainty;

  // Frequency uncertainty: sigma_nu = sigma_E / h
  const sigmaFreqHz = energyUncertaintyJoules / CODATA_2022.h;

  // Angular frequency uncertainty: sigma_omega = sigma_E / hbar
  const sigmaOmegaRadPerSec = energyUncertaintyJoules / CODATA_2022.hbar;

  // Energy uncertainty in eV: sigma_E / e
  const sigmaEnergyEV = energyUncertaintyJoules / CODATA_2022.e;

  // Wavenumber uncertainty: sigma_nu_tilde = sigma_E / (h * c)
  const sigmaWavenumberMInv = energyUncertaintyJoules / (CODATA_2022.h * CODATA_2022.c);
  const sigmaWavenumberCmInv = sigmaWavenumberMInv / 100;

  // Temperature uncertainty: sigma_T = sigma_E / kB
  const sigmaTempK = energyUncertaintyJoules / CODATA_2022.kB;

  return {
    wavelength: {
      m: sigmaLambdaMeters,
      um: sigmaLambdaMeters * 1e6,
      nm: sigmaLambdaMeters * 1e9,
      angstrom: sigmaLambdaMeters * 1e10
    },
    frequency: {
      Hz: sigmaFreqHz,
      kHz: sigmaFreqHz / 1e3,
      MHz: sigmaFreqHz / 1e6,
      GHz: sigmaFreqHz / 1e9,
      THz: sigmaFreqHz / 1e12
    },
    angularFrequency: {
      radPerSec: sigmaOmegaRadPerSec,
      MradPerSec: sigmaOmegaRadPerSec / 1e6,
      GradPerSec: sigmaOmegaRadPerSec / 1e9
    },
    energy: {
      J: energyUncertaintyJoules,
      eV: sigmaEnergyEV,
      meV: sigmaEnergyEV * 1e3,
      ueV: sigmaEnergyEV * 1e6,
      Eh: energyUncertaintyJoules / CODATA_2022.Eh
    },
    wavenumber: {
      mInv: sigmaWavenumberMInv,
      cmInv: sigmaWavenumberCmInv
    },
    temperature: {
      K: sigmaTempK,
      mK: sigmaTempK * 1e3,
      uK: sigmaTempK * 1e6,
      nK: sigmaTempK * 1e9
    }
  };
}
