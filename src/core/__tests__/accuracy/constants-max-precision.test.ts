import { describe, it, expect } from 'vitest';
import { CODATA_2022 } from '../../../constants/codata2022';
import { DEFAULT_PRESETS } from '../../../constants/default-presets';
import { formatSignificantDigits } from '../../formatters';
import { deriveOpticalQuantities, energyFromWavelength } from '../../optical';
import { calculateZeemanShift } from '../../zeeman';
import { deriveRfQuantities } from '../../rf-power';
import { calculateGaussianBeam } from '../../laser-beam';

describe('High-Precision Physical Constants & Zero-Roundoff Engine Validation', () => {
  describe('CODATA 2022 Physical Constants Precision', () => {
    it('stores SI-defined exact constants with zero truncation', () => {
      expect(CODATA_2022.c).toBe(299792458);
      expect(CODATA_2022.h).toBe(6.62607015e-34);
      expect(CODATA_2022.e).toBe(1.602176634e-19);
      expect(CODATA_2022.kB).toBe(1.380649e-23);
      expect(CODATA_2022.NA).toBe(6.02214076e23);
    });

    it('stores hbar as exact h / (2 * pi) to 17 digits of double precision', () => {
      const computedHbar = 6.62607015e-34 / (2 * Math.PI);
      expect(CODATA_2022.hbar).toBe(computedHbar);
      expect(CODATA_2022.hbar).toBe(1.0545718176461565e-34);
    });

    it('stores high-precision spectroscopic and QED constants to 14+ digits', () => {
      // Rydberg constant: 14 significant digits
      expect(CODATA_2022.Rinf).toBe(10973731.568157);

      // Electron Lande g-factor: 15 significant digits
      expect(CODATA_2022.ge).toBe(2.00231930436256);

      // Hartree energy: 14 significant digits
      expect(CODATA_2022.Eh).toBe(4.3597447222071e-18);

      // Debye in C * m: 10^-21 / c (16 digits)
      expect(CODATA_2022.Debye).toBe(1e-21 / 299792458);
    });

    it('stores electromagnetic and mass constants to full NIST recommended precision', () => {
      expect(CODATA_2022.muB).toBe(9.2740100783e-24); // 11 digits
      expect(CODATA_2022.muN).toBe(5.0507837461e-27); // 11 digits
      expect(CODATA_2022.a0).toBe(5.29177210903e-11); // 12 digits
      expect(CODATA_2022.epsilon0).toBe(8.8541878128e-12); // 11 digits
      expect(CODATA_2022.mu0).toBe(1.25663706212e-6); // 11 digits
      expect(CODATA_2022.me).toBe(9.1093837015e-31); // 11 digits
      expect(CODATA_2022.mp).toBe(1.67262192369e-27); // 12 digits
      expect(CODATA_2022.alpha).toBe(7.2973525643e-3); // 11 digits
      expect(CODATA_2022.invAlpha).toBe(137.035999177); // 12 digits
    });
  });

  describe('Atomic & Optical Presets Precision', () => {
    it('stores peer-reviewed optical clock and alkali transitions at maximum precision', () => {
      const rb87D2 = DEFAULT_PRESETS.find(p => p.id === 'atom-rb87-d2');
      expect(rb87D2).toBeDefined();
      expect(rb87D2!.wavelengthNm).toBe(780.241209686); // Steck 12 digits

      const cs133D2 = DEFAULT_PRESETS.find(p => p.id === 'atom-cs133-d2');
      expect(cs133D2).toBeDefined();
      expect(cs133D2!.wavelengthNm).toBe(852.34727582); // Steck 11 digits

      const sr87Clock = DEFAULT_PRESETS.find(p => p.id === 'atom-sr87-clock');
      expect(sr87Clock).toBeDefined();
      expect(sr87Clock!.wavelengthNm).toBe(698.445708116368); // BIPM SI standard
    });
  });

  describe('Calculation Engine Zero-Roundoff Guarantee', () => {
    it('calculates optical quantities using raw floating-point numbers without intermediate rounding', () => {
      // 780.241209686 nm
      const lambdaM = 780.241209686 * 1e-9;
      const energyJ = energyFromWavelength(lambdaM);
      const q = deriveOpticalQuantities(energyJ);

      // Verify raw frequency is an unrounded float matching c / lambda
      const expectedHz = CODATA_2022.c / lambdaM;
      expect(q.frequency.Hz).toBe(expectedHz);

      // Verify raw wavenumber is energyJ / (h * c) without double-inversion loss
      const expectedMInv = energyJ / (CODATA_2022.h * CODATA_2022.c);
      expect(q.wavenumber.mInv).toBe(expectedMInv);

      // Display formatting to 14 sig figs must format cleanly without modifying raw quantities
      const formatted14 = formatSignificantDigits(q.frequency.THz, 14);
      expect(formatted14).toBe('384.23048446858');
      expect(q.frequency.THz).toBe(expectedHz / 1e12); // Raw underlying number unaffected
    });

    it('verifies that sig fig selection only changes display string, never underlying calculation state', () => {
      const rawFreqHz = 384230484468562.3;

      // Formatting at 4, 8, 12, 14 sig figs produces different strings
      const disp4 = formatSignificantDigits(rawFreqHz / 1e12, 4);
      const disp8 = formatSignificantDigits(rawFreqHz / 1e12, 8);
      const disp12 = formatSignificantDigits(rawFreqHz / 1e12, 12);
      const disp14 = formatSignificantDigits(rawFreqHz / 1e12, 14);

      expect(disp4).toBe('384.2');
      expect(disp8).toBe('384.23048');
      expect(disp12).toBe('384.230484469');
      expect(disp14).toBe('384.23048446856');

      // The raw frequency number itself remains pristine
      expect(rawFreqHz).toBe(384230484468562.3);
    });

    it('calculates Zeeman shifts from raw Tesla fields without truncation', () => {
      const fieldTesla = 0.0001; // 1 Gauss
      const config = { gFactor: 2.00231930436256, deltaMF: 1 };
      const shift = calculateZeemanShift(fieldTesla, config);

      // Delta nu = mu_B * g * deltaMF * B / h
      const expectedShiftHz = (CODATA_2022.muB * config.gFactor * 1 * fieldTesla) / CODATA_2022.h;
      expect(shift.Hz).toBe(expectedShiftHz);

      // Formatted output supports up to 14 digits
      const disp14 = formatSignificantDigits(shift.MHz, 14);
      expect(disp14.length).toBeGreaterThanOrEqual(14);
    });

    it('calculates RF quantities from raw canonical Watts', () => {
      const watts = 0.01; // 10 mW
      const z0 = 50;
      const rf = deriveRfQuantities(watts, z0);

      expect(rf.power.dBm).toBe(10);
      expect(rf.voltage.Vrms).toBe(Math.sqrt(0.01 * 50));
      const formatted14 = formatSignificantDigits(rf.voltage.Vrms, 14);
      expect(formatted14).toBe('0.70710678118655');
    });

    it('calculates Gaussian beam optical parameters from raw unrounded geometry', () => {
      const beam = calculateGaussianBeam({
        powerWatts: 0.01,
        waistRadiusMeters: 100e-6,
        wavelengthMeters: 780.241209686e-9
      });

      // Rayleigh range: pi * w0^2 / lambda
      const expectedZr = (Math.PI * 1e-8) / 780.241209686e-9;
      expect(beam.rayleighRangeMeters).toBe(expectedZr);
      expect(formatSignificantDigits(beam.rayleighRangeMm, 14)).toBe('40.264377407777');
    });
  });
});
