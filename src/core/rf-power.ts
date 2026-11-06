/**
 * RF Power and Voltage Conversion Engine with Configurable Impedance
 */

export interface RfPowerState {
  powerWatts: number; // Canonical SI base
  impedanceOhms: number; // Z0 (default 50)
}

export interface RfQuantities {
  power: {
    W: number;
    mW: number;
    uW: number;
    dBm: number;
    dBW: number;
  };
  voltage: {
    Vrms: number;
    mVrms: number;
    uVrms: number;
    Vpp: number;
    mVpp: number;
    Vpeak: number;
    dBuV: number;
    dBmV: number;
  };
  impedanceOhms: number;
}

export interface RfAttenuationResults {
  attenuationDb: number;
  powerRatio: number; // P_out / P_in
  powerRatioPercent: number; // %
  voltageRatio: number; // V_out / V_in
  voltageRatioPercent: number; // %
}

/**
 * Convert representations to canonical power (Watts)
 */
export function wattsFromDbm(dbm: number): number {
  return Math.pow(10, dbm / 10) / 1000;
}

export function dbmFromWatts(watts: number): number {
  if (watts <= 0) return -Infinity;
  return 10 * Math.log10(watts * 1000);
}

export function wattsFromDbw(dbw: number): number {
  return Math.pow(10, dbw / 10);
}

export function dbwFromWatts(watts: number): number {
  if (watts <= 0) return -Infinity;
  return 10 * Math.log10(watts);
}

export function wattsFromMicrowatts(uW: number): number {
  return uW * 1e-6;
}

export function wattsFromVrms(vrms: number, impedanceOhms: number): number {
  if (impedanceOhms <= 0) return 0;
  return Math.pow(vrms, 2) / impedanceOhms;
}

export function wattsFromVpp(vpp: number, impedanceOhms: number): number {
  const vrms = vpp / (2 * Math.SQRT2);
  return wattsFromVrms(vrms, impedanceOhms);
}

export function wattsFromVpeak(vpeak: number, impedanceOhms: number): number {
  const vrms = vpeak / Math.SQRT2;
  return wattsFromVrms(vrms, impedanceOhms);
}

export function wattsFromDbuv(dbuv: number, impedanceOhms: number): number {
  // Vrms = 10^((dBuV - 120) / 20)
  const vrms = Math.pow(10, dbuv / 20) * 1e-6;
  return wattsFromVrms(vrms, impedanceOhms);
}

export function wattsFromDbmv(dbmv: number, impedanceOhms: number): number {
  // Vrms = 10^(dBmV / 20) * 1e-3
  const vrms = Math.pow(10, dbmv / 20) * 1e-3;
  return wattsFromVrms(vrms, impedanceOhms);
}

export function wattsFromDbv(dbv: number, impedanceOhms: number): number {
  // Vrms = 10^(dBV / 20)
  const vrms = Math.pow(10, dbv / 20);
  return wattsFromVrms(vrms, impedanceOhms);
}

/**
 * Derive all RF power and voltage quantities given canonical Watts and Impedance Z0
 */
export function deriveRfQuantities(watts: number, impedanceOhms: number): RfQuantities {
  const safeZ = impedanceOhms > 0 ? impedanceOhms : 50;

  if (watts <= 0 || !isFinite(watts)) {
    return {
      power: {
        W: 0,
        mW: 0,
        uW: 0,
        dBm: -Infinity,
        dBW: -Infinity
      },
      voltage: {
        Vrms: 0,
        mVrms: 0,
        uVrms: 0,
        Vpp: 0,
        mVpp: 0,
        Vpeak: 0,
        dBuV: -Infinity,
        dBmV: -Infinity
      },
      impedanceOhms: safeZ
    };
  }

  const mW = watts * 1e3;
  const uW = watts * 1e6;
  const dBm = 10 * Math.log10(mW);
  const dBW = 10 * Math.log10(watts);

  const Vrms = Math.sqrt(watts * safeZ);
  const Vpeak = Vrms * Math.SQRT2;
  const Vpp = 2 * Vpeak;

  const dBuV = 20 * Math.log10(Vrms * 1e6);
  const dBmV = dBuV - 60;

  return {
    power: {
      W: watts,
      mW,
      uW,
      dBm,
      dBW
    },
    voltage: {
      Vrms,
      mVrms: Vrms * 1e3,
      uVrms: Vrms * 1e6,
      Vpp,
      mVpp: Vpp * 1e3,
      Vpeak,
      dBuV,
      dBmV
    },
    impedanceOhms: safeZ
  };
}

/**
 * Calculate linear attenuation and gain ratios
 */
export function calculateAttenuationFromDb(attenuationDb: number): RfAttenuationResults {
  // Attenuation: positive dB means reduction (e.g. 10 dB attenuator = 0.1 power ratio)
  const powerRatio = Math.pow(10, -Math.abs(attenuationDb) / 10);
  const voltageRatio = Math.sqrt(powerRatio);

  return {
    attenuationDb,
    powerRatio,
    powerRatioPercent: powerRatio * 100,
    voltageRatio,
    voltageRatioPercent: voltageRatio * 100
  };
}

export function calculateAttenuationFromPowerRatio(ratio: number): RfAttenuationResults {
  if (ratio <= 0) {
    return {
      attenuationDb: Infinity,
      powerRatio: 0,
      powerRatioPercent: 0,
      voltageRatio: 0,
      voltageRatioPercent: 0
    };
  }

  const attenuationDb = -10 * Math.log10(ratio);
  const voltageRatio = Math.sqrt(ratio);

  return {
    attenuationDb,
    powerRatio: ratio,
    powerRatioPercent: ratio * 100,
    voltageRatio,
    voltageRatioPercent: voltageRatio * 100
  };
}
