/**
 * Types for Atomic, Molecular, and Cavity Presets
 */

export type PresetCategory = 'molecular' | 'alkali' | 'alkaline-earth' | 'cavity' | 'custom';

export interface TransitionPreset {
  id: string;
  name: string;
  species: string;
  category: PresetCategory;
  transitionName: string;
  wavelengthNm: number;
  linewidthMHz?: number; // Natural linewidth Gamma / 2pi in MHz
  saturationIntensityMwPerCm2?: number; // Isat in mW / cm^2
  dipoleMomentDebye?: number; // Matrix element in Debye
  branchingRatio?: number; // Vibrational / optical branching ratio
  repumpWavelengthsNm?: number[]; // Relevant repump transitions
  laboratory?: string; // Reference research lab / primary metrology institution
  description?: string;
  citation?: string; // Formal peer-reviewed literature reference (Authors, Journal, Year)
  doi?: string; // Digital Object Identifier or official data URL
  isCustom?: boolean;
  createdAt?: string;
}
