/**
 * Unit types and category definitions for AMO and RF conversions
 */

export type CategoryColor = 'optical' | 'rf' | 'magnetic' | 'laser' | 'error-prop' | 'preset';

export type OpticalWavelengthUnit = 'nm' | 'um' | 'm' | 'angstrom';
export type OpticalFrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz' | 'THz';
export type OpticalAngularFreqUnit = 'rad/s' | 'Mrad/s' | 'Grad/s';
export type OpticalEnergyUnit = 'eV' | 'meV' | 'ueV' | 'J' | 'Eh';
export type OpticalWavenumberUnit = 'cm^-1' | 'm^-1';
export type OpticalTemperatureUnit = 'K' | 'mK' | 'uK' | 'nK';

export type MagneticFieldUnit = 'G' | 'T' | 'mT' | 'uT';
export type ZeemanShiftUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz';

export type RfPowerUnit = 'dBm' | 'dBW' | 'W' | 'mW' | 'uW' | 'dBuV' | 'dBmV';
export type RfVoltageUnit = 'Vrms' | 'Vpp' | 'Vpeak' | 'mVrms' | 'uVrms';

export interface FieldDefinition<TUnit extends string = string> {
  id: string;
  name: string;
  symbol: string;
  unit: TUnit;
  category: CategoryColor;
  description: string;
}
