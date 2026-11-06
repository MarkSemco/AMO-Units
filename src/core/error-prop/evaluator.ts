import * as math from 'mathjs';
import { AnalyticalDerivative, AnalyticalSecondDerivative, computeSecondDerivatives } from './differentiator';
import { BUILTIN_PHYSICAL_CONSTANTS } from './parser';
import { formatMetrologyError } from '../formatters';
import {
  CorrelationItem,
  PartialDerivativeResult,
  SecondDerivativeResult,
  NonlinearityRegime
} from '../../types/error-prop';

export interface EvaluationInput {
  expressionNode: math.MathNode;
  variableValues: Record<string, number>;
  uncertainties: Record<string, number>;
  derivatives: AnalyticalDerivative[];
  secondDerivatives?: AnalyticalSecondDerivative[];
  covarianceEnabled?: boolean;
  correlations?: CorrelationItem[];
}

export interface EvaluationOutput {
  nominalValue: number;
  totalUncertainty: number;
  relativeUncertaintyPercent: number;
  formattedNominal: string;
  formattedUncertainty: string;
  formattedCombined: string;
  individualPartials: PartialDerivativeResult[];
  // Second-order / nonlinearity fields
  nonlinearityIndex: number;
  regime: NonlinearityRegime;
  biasShift: number;
  correctedNominal: number;
  correctedUncertainty: number;
  formattedCorrectedNominal: string;
  formattedCorrectedUncertainty: string;
  formattedCorrectedCombined: string;
  secondDerivatives: SecondDerivativeResult[];
  error?: string;
}

export function evaluateErrorPropagation(input: EvaluationInput): EvaluationOutput {
  const {
    expressionNode,
    variableValues,
    uncertainties,
    derivatives,
    secondDerivatives,
    covarianceEnabled = false,
    correlations = []
  } = input;

  const secondDerivList = secondDerivatives ?? computeSecondDerivatives(derivatives);

  // Build complete scope including built-in physical constants
  const scope: Record<string, any> = {
    ...BUILTIN_PHYSICAL_CONSTANTS,
    ln: (x: number) => Math.log(x),
    ...variableValues
  };

  try {
    // 1. Evaluate nominal value f(x)
    const compiledExpr = expressionNode.compile();
    const nominalRaw = compiledExpr.evaluate(scope);
    const nominalValue = typeof nominalRaw === 'number' ? nominalRaw : Number(nominalRaw);

    if (isNaN(nominalValue) || !isFinite(nominalValue)) {
      return {
        nominalValue: NaN,
        totalUncertainty: NaN,
        relativeUncertaintyPercent: NaN,
        formattedNominal: 'NaN',
        formattedUncertainty: 'NaN',
        formattedCombined: 'Invalid calculation',
        individualPartials: [],
        nonlinearityIndex: NaN,
        regime: 'linear',
        biasShift: NaN,
        correctedNominal: NaN,
        correctedUncertainty: NaN,
        formattedCorrectedNominal: 'NaN',
        formattedCorrectedUncertainty: 'NaN',
        formattedCorrectedCombined: 'Invalid calculation',
        secondDerivatives: [],
        error: 'Nominal evaluation resulted in NaN or non-finite number'
      };
    }

    // 2. Evaluate individual first derivatives
    const partialResults: PartialDerivativeResult[] = [];
    let varianceSum = 0;

    for (const d of derivatives) {
      let evaluatedDeriv = 0;
      try {
        const compiledDeriv = d.simplifiedNode.compile();
        const rawD = compiledDeriv.evaluate(scope);
        evaluatedDeriv = typeof rawD === 'number' ? rawD : Number(rawD);
      } catch (err: any) {
        try {
          const rawD2 = d.derivativeNode.compile().evaluate(scope);
          evaluatedDeriv = typeof rawD2 === 'number' ? rawD2 : Number(rawD2);
        } catch {
          evaluatedDeriv = 0;
        }
      }

      if (isNaN(evaluatedDeriv) || !isFinite(evaluatedDeriv)) {
        evaluatedDeriv = 0;
      }

      partialResults.push({
        variable: d.variable,
        derivativeNode: d.simplifiedNode,
        derivativeLatex: d.latex,
        evaluatedDerivative: evaluatedDeriv
      });

      const sigma = Math.max(0, isFinite(uncertainties[d.variable]) ? (uncertainties[d.variable] ?? 0) : 0);
      const term = evaluatedDeriv * sigma;
      varianceSum += term * term;
    }

    // 3. Covariance contributions if enabled
    if (covarianceEnabled && derivatives.length > 1) {
      // Index derivatives by variable name
      const derivMap = new Map<string, number>();
      for (const pr of partialResults) {
        derivMap.set(pr.variable, pr.evaluatedDerivative);
      }

      for (const corr of correlations) {
        const d1 = derivMap.get(corr.var1) ?? 0;
        const d2 = derivMap.get(corr.var2) ?? 0;
        const s1 = Math.max(0, isFinite(uncertainties[corr.var1]) ? (uncertainties[corr.var1] ?? 0) : 0);
        const s2 = Math.max(0, isFinite(uncertainties[corr.var2]) ? (uncertainties[corr.var2] ?? 0) : 0);
        const r = Math.max(-1, Math.min(1, corr.coefficient ?? 0));

        // 2 * d1 * d2 * r * s1 * s2
        const covTerm = 2 * d1 * d2 * r * s1 * s2;
        varianceSum += covTerm;
      }
    }

    // Standard linear uncertainty is sqrt of variance
    const totalUncertainty = Math.sqrt(Math.max(0, varianceSum));
    const relativeUncertaintyPercent = nominalValue !== 0
      ? (totalUncertainty / Math.abs(nominalValue)) * 100
      : 0;

    // 4. Evaluate individual second derivatives and compute second-order corrections
    const secondPartialResults: SecondDerivativeResult[] = [];
    let biasShift = 0;
    let secondOrderVarTermSum = 0;

    for (const sd of secondDerivList) {
      let evaluatedDeriv2 = 0;
      try {
        const compiledDeriv2 = sd.simplifiedNode.compile();
        const rawD2 = compiledDeriv2.evaluate(scope);
        evaluatedDeriv2 = typeof rawD2 === 'number' ? rawD2 : Number(rawD2);
      } catch (err: any) {
        try {
          const rawFallback = sd.derivativeNode.compile().evaluate(scope);
          evaluatedDeriv2 = typeof rawFallback === 'number' ? rawFallback : Number(rawFallback);
        } catch {
          evaluatedDeriv2 = 0;
        }
      }

      if (isNaN(evaluatedDeriv2) || !isFinite(evaluatedDeriv2)) {
        evaluatedDeriv2 = 0;
      }

      secondPartialResults.push({
        variable: sd.variable,
        derivativeNode: sd.simplifiedNode,
        derivativeLatex: sd.latex,
        evaluatedDerivative: evaluatedDeriv2
      });

      const sigma = Math.max(0, isFinite(uncertainties[sd.variable]) ? (uncertainties[sd.variable] ?? 0) : 0);
      const sigma2 = sigma * sigma;

      // Induced bias shift: 0.5 * (∂²f/∂x_i² * σ_i²)
      biasShift += 0.5 * evaluatedDeriv2 * sigma2;

      // Second-order uncertainty term: (∂²f/∂x_i² * σ_i²)^2
      const term2 = evaluatedDeriv2 * sigma2;
      secondOrderVarTermSum += term2 * term2;
    }

    // Corrected uncertainty: sqrt(σ_linear² + 0.5 * Σ (∂²f/∂x_i² * σ_i²)²)
    const secondOrderUncertainty = Math.sqrt(Math.max(0, 0.5 * secondOrderVarTermSum));
    const correctedVariance = Math.max(0, totalUncertainty * totalUncertainty + 0.5 * secondOrderVarTermSum);
    const correctedUncertainty = Math.sqrt(correctedVariance);
    const correctedNominal = nominalValue + biasShift;

    // 5. Dimensionless nonlinearity index and regime classification
    // In physics (especially AMO / quantum optics), quantities often have small SI units (e.g. 10^-34 J·s, 10^-9 m).
    // An extremum / stationary point occurs when the linear sensitivity vanishes relative to the curvature
    // while non-zero uncertainty exists in the system (secondOrderUncertainty > 0).
    let nonlinearityIndex = 0;
    let regime: NonlinearityRegime = 'linear';

    if (secondOrderUncertainty <= 0) {
      // Zero second-order curvature contribution (e.g. all input uncertainties are zero or linear function)
      nonlinearityIndex = 0;
      regime = 'linear';
    } else if (totalUncertainty <= 0 || totalUncertainty / secondOrderUncertainty < 1e-9) {
      // Linear sensitivity vanishes at stationary point / extremum (σ_linear ≈ 0 and curvature produces spread)
      regime = 'extremum';
      nonlinearityIndex = Infinity;
    } else {
      nonlinearityIndex = Math.abs(biasShift) / totalUncertainty;
      if (nonlinearityIndex > 0.15) {
        regime = 'severe';
      } else if (nonlinearityIndex >= 0.05) {
        regime = 'mild';
      } else {
        regime = 'linear';
      }
    }

    const formatted = formatMetrologyError(nominalValue, totalUncertainty);
    const formattedCorrected = formatMetrologyError(correctedNominal, correctedUncertainty);

    return {
      nominalValue,
      totalUncertainty,
      relativeUncertaintyPercent,
      formattedNominal: formatted.formattedValue,
      formattedUncertainty: formatted.formattedUncertainty,
      formattedCombined: formatted.combined,
      individualPartials: partialResults,
      nonlinearityIndex,
      regime,
      biasShift,
      correctedNominal,
      correctedUncertainty,
      formattedCorrectedNominal: formattedCorrected.formattedValue,
      formattedCorrectedUncertainty: formattedCorrected.formattedUncertainty,
      formattedCorrectedCombined: formattedCorrected.combined,
      secondDerivatives: secondPartialResults
    };
  } catch (err: any) {
    return {
      nominalValue: NaN,
      totalUncertainty: NaN,
      relativeUncertaintyPercent: NaN,
      formattedNominal: 'NaN',
      formattedUncertainty: 'NaN',
      formattedCombined: 'Error in evaluation',
      individualPartials: [],
      nonlinearityIndex: NaN,
      regime: 'linear',
      biasShift: NaN,
      correctedNominal: NaN,
      correctedUncertainty: NaN,
      formattedCorrectedNominal: 'NaN',
      formattedCorrectedUncertainty: 'NaN',
      formattedCorrectedCombined: 'Error in evaluation',
      secondDerivatives: [],
      error: err.message || 'Evaluation error'
    };
  }
}
