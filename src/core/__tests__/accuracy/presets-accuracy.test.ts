import { describe, it, expect } from 'vitest';
import goldenPresets from '../../../../tests/fixtures/wolfram-golden-presets.json';
import { DEFAULT_PRESETS } from '../../../constants/default-presets';

describe('Zero-Trust Atomic & Molecular Preset Accuracy Suite (Steck & NIST Ground Truth)', () => {
  const expectedPresets = goldenPresets.presets;

  it('contains all 12 canonical atomic & molecular preset transitions', () => {
    expect(DEFAULT_PRESETS.length).toBeGreaterThanOrEqual(expectedPresets.length);
  });

  describe.each(expectedPresets)('$name ($species)', (expected) => {
    it('accurately matches peer-reviewed transition parameters within experimental uncertainty', () => {
      const found = DEFAULT_PRESETS.find(p => p.id === expected.id);
      expect(found).toBeDefined();

      // 1. Wavelength in nm
      expect(found!.wavelengthNm).toBeCloseTo(expected.wavelengthNm, 3);

      // 2. Linewidth Γ in MHz
      if (expected.linewidthMHz !== undefined) {
        expect(found!.linewidthMHz).toBeCloseTo(expected.linewidthMHz, 4);
      }

      // 3. Saturation intensity in mW/cm^2
      if (expected.saturationIntensityMwPerCm2 !== undefined) {
        expect(found!.saturationIntensityMwPerCm2).toBeCloseTo(expected.saturationIntensityMwPerCm2, 2);
      }

      // 4. Dipole moment in Debye
      if (expected.dipoleMomentDebye !== undefined) {
        expect(found!.dipoleMomentDebye).toBeCloseTo(expected.dipoleMomentDebye, 2);
      }
    });
  });
});
