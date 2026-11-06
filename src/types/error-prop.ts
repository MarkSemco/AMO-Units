/**
 * Types for Error Propagation AST, Variables, Derivatives, and Evaluation
 */

export interface DetectedVariable {
  name: string;
  hasUncertainty: boolean;
  value: number;
  uncertainty: number;
  unit?: string;
}

export interface PartialDerivativeResult {
  variable: string;
  derivativeNode: any;
  derivativeLatex: string;
  evaluatedDerivative: number;
}

export interface SecondDerivativeResult {
  variable: string;
  derivativeNode: any;
  derivativeLatex: string;
  evaluatedDerivative: number;
}

export type NonlinearityRegime = 'linear' | 'mild' | 'severe' | 'extremum';

export interface CorrelationItem {
  var1: string;
  var2: string;
  coefficient: number; // r_ij in [-1, 1]
}

export interface ErrorPropagationResult {
  nominalValue: number;
  totalUncertainty: number;
  relativeUncertaintyPercent: number;
  formattedNominal: string;
  formattedUncertainty: string;
  formattedCombined: string; // f +/- sigma_f
  latexEquation: string;
  individualPartials: PartialDerivativeResult[];
  covarianceIncluded: boolean;
  // ISO GUM Supplement 1 Nonlinearity fields
  nonlinearityIndex: number;
  regime: NonlinearityRegime;
  biasShift: number;
  correctedNominal: number;
  correctedUncertainty: number;
  formattedCorrectedNominal?: string;
  formattedCorrectedUncertainty?: string;
  formattedCorrectedCombined?: string;
  secondDerivatives: SecondDerivativeResult[];
}
