import * as math from 'mathjs';
import { AnalyticalDerivative, AnalyticalSecondDerivative, computeSecondDerivatives } from './differentiator';

export interface LatexEquationBundle {
  nominalFormulaLatex: string;
  combinedSymbolicLatex: string;
  combinedAnalyticalLatex: string;
  individualPartialsLatex: Array<{ variable: string; latex: string }>;
  biasFormulaSymbolicLatex: string;
  biasFormulaAnalyticalLatex: string;
  secondOrderSymbolicLatex: string;
  secondOrderAnalyticalLatex: string;
  individualSecondPartialsLatex: Array<{ variable: string; latex: string }>;
}

const GREEK_NAMES = new Set([
  'alpha', 'beta', 'gamma', 'Gamma', 'delta', 'Delta', 'epsilon', 'zeta', 'eta',
  'theta', 'Theta', 'iota', 'kappa', 'lambda', 'Lambda', 'mu', 'nu', 'xi', 'Xi',
  'rho', 'sigma', 'Sigma', 'tau', 'upsilon', 'Upsilon', 'phi', 'Phi', 'chi', 'psi', 'Psi', 'omega', 'Omega'
]);

/**
 * Format LaTeX representation of a variable symbol, converting e.g. "w0" -> "w_{0}", "x1" -> "x_{1}", "Gamma" -> "\Gamma"
 */
export function formatVariableSymbolLatex(varName: string): string {
  // If variable has digits at end, e.g. w0 -> w_0, x1 -> x_1, s0 -> s_0
  const match = varName.match(/^([a-zA-Z]+)(\d+)$/);
  if (match) {
    const base = match[1];
    const sub = match[2];
    const baseTex = GREEK_NAMES.has(base) ? `\\${base}` : base;
    return `${baseTex}_{${sub}}`;
  }
  if (GREEK_NAMES.has(varName)) {
    return `\\${varName}`;
  }
  return varName;
}

/**
 * Custom mathjs toTex handler to ensure consistent LaTeX rendering of logarithmic functions:
 * - ln(x) -> \ln\left(x\right)
 * - log(x, 10) / log10(x) / log(x) -> \log_{10}\left(x\right)
 * - log(x, N) / log<N>(x) -> \log_{N}\left(x\right)
 */
export function customLatexHandler(node: any, options?: any): string | undefined {
  if (node && node.isFunctionNode) {
    if (node.name === 'ln' && node.args.length === 1) {
      return `\\ln\\left(${node.args[0].toTex(options)}\\right)`;
    }
    if (node.name === 'log') {
      if (node.args.length === 1) {
        return `\\ln\\left(${node.args[0].toTex(options)}\\right)`;
      } else if (node.args.length === 2 && node.args[1].isConstantNode) {
        return `\\log_{${node.args[1].value}}\\left(${node.args[0].toTex(options)}\\right)`;
      } else if (node.args.length === 2) {
        return `\\log_{${node.args[1].toTex(options)}}\\left(${node.args[0].toTex(options)}\\right)`;
      }
    }
    const match = typeof node.name === 'string' ? node.name.match(/^log_?(\d+)$/) : null;
    if (match && node.args.length === 1) {
      return `\\log_{${match[1]}}\\left(${node.args[0].toTex(options)}\\right)`;
    }
  }
  return undefined;
}

/**
 * Generate full LaTeX equation set for Error Propagation
 */
export function generateLatexEquations(
  expressionNode: math.MathNode | null,
  derivatives: AnalyticalDerivative[],
  covarianceEnabled = false,
  secondDerivatives?: AnalyticalSecondDerivative[]
): LatexEquationBundle {
  if (!expressionNode || derivatives.length === 0) {
    return {
      nominalFormulaLatex: expressionNode ? `f = ${expressionNode.toTex({ parenthesis: 'auto', handler: customLatexHandler })}` : '',
      combinedSymbolicLatex: '\\sigma_f = 0',
      combinedAnalyticalLatex: '\\sigma_f = 0',
      individualPartialsLatex: [],
      biasFormulaSymbolicLatex: 'E[f] = f_0',
      biasFormulaAnalyticalLatex: 'E[f] = f_0',
      secondOrderSymbolicLatex: '\\sigma_f = 0',
      secondOrderAnalyticalLatex: '\\sigma_f = 0',
      individualSecondPartialsLatex: []
    };
  }

  const secondDerivList = secondDerivatives ?? computeSecondDerivatives(derivatives);

  const nominalFormulaLatex = `f = ${expressionNode.toTex({ parenthesis: 'auto', handler: customLatexHandler })}`;

  const individualPartialsLatex = derivatives.map(d => {
    const varTex = formatVariableSymbolLatex(d.variable);
    return {
      variable: d.variable,
      latex: `\\frac{\\partial f}{\\partial ${varTex}} = ${d.latex}`
    };
  });

  const individualSecondPartialsLatex = secondDerivList.map(sd => {
    const varTex = formatVariableSymbolLatex(sd.variable);
    return {
      variable: sd.variable,
      latex: `\\frac{\\partial^2 f}{\\partial ${varTex}^2} = ${sd.latex}`
    };
  });

  // Bias formula: E[f] = f_0 + 0.5 * \Sigma (\partial^2 f / \partial x_i^2 * \sigma_i^2)
  let biasFormulaSymbolicLatex = 'E[f] = f_0';
  let biasFormulaAnalyticalLatex = 'E[f] = f_0';

  if (secondDerivList.length === 1) {
    const varTex = formatVariableSymbolLatex(secondDerivList[0].variable);
    biasFormulaSymbolicLatex = `E[f] = f_0 + \\frac{1}{2} \\left( \\frac{\\partial^2 f}{\\partial ${varTex}^2} \\right) \\sigma_{${varTex}}^2`;
    biasFormulaAnalyticalLatex = `E[f] = f_0 + \\frac{1}{2} \\left( ${secondDerivList[0].latex} \\right) \\sigma_{${varTex}}^2`;
  } else if (secondDerivList.length > 1) {
    const bSymbolicTerms = secondDerivList.map(sd => {
      const varTex = formatVariableSymbolLatex(sd.variable);
      return `\\left( \\frac{\\partial^2 f}{\\partial ${varTex}^2} \\right) \\sigma_{${varTex}}^2`;
    });
    const bAnalyticalTerms = secondDerivList.map(sd => {
      const varTex = formatVariableSymbolLatex(sd.variable);
      return `\\left( ${sd.latex} \\right) \\sigma_{${varTex}}^2`;
    });
    biasFormulaSymbolicLatex = `E[f] = f_0 + \\frac{1}{2} \\left[ ${bSymbolicTerms.join(' + ')} \\right]`;
    biasFormulaAnalyticalLatex = `E[f] = f_0 + \\frac{1}{2} \\left[ ${bAnalyticalTerms.join(' + ')} \\right]`;
  }

  // If only 1 variable and no covariance
  if (derivatives.length === 1 && !covarianceEnabled) {
    const d = derivatives[0];
    const varTex = formatVariableSymbolLatex(d.variable);
    const symbolic = `\\sigma_f = \\left| \\frac{\\partial f}{\\partial ${varTex}} \\right| \\sigma_{${varTex}}`;
    const analytical = `\\sigma_f = \\left| ${d.latex} \\right| \\sigma_{${varTex}}`;

    const sd = secondDerivList[0];
    const sdLatex = sd ? sd.latex : '0';
    const secondSymbolic = `\\sigma_f = \\sqrt{ \\left( \\frac{\\partial f}{\\partial ${varTex}} \\cdot \\sigma_{${varTex}} \\right)^2 + \\frac{1}{2} \\left( \\frac{\\partial^2 f}{\\partial ${varTex}^2} \\cdot \\sigma_{${varTex}}^2 \\right)^2 }`;
    const secondAnalytical = `\\sigma_f = \\sqrt{ \\left( ${d.latex} \\cdot \\sigma_{${varTex}} \\right)^2 + \\frac{1}{2} \\left( \\left( ${sdLatex} \\right) \\cdot \\sigma_{${varTex}}^2 \\right)^2 }`;

    return {
      nominalFormulaLatex,
      combinedSymbolicLatex: symbolic,
      combinedAnalyticalLatex: analytical,
      individualPartialsLatex,
      biasFormulaSymbolicLatex,
      biasFormulaAnalyticalLatex,
      secondOrderSymbolicLatex: secondSymbolic,
      secondOrderAnalyticalLatex: secondAnalytical,
      individualSecondPartialsLatex
    };
  }

  // Multiple variables: build sum of squares terms
  const symbolicTerms: string[] = [];
  const analyticalTerms: string[] = [];

  for (const d of derivatives) {
    const varTex = formatVariableSymbolLatex(d.variable);
    symbolicTerms.push(`\\left( \\frac{\\partial f}{\\partial ${varTex}} \\cdot \\sigma_{${varTex}} \\right)^2`);
    analyticalTerms.push(`\\left( ${d.latex} \\cdot \\sigma_{${varTex}} \\right)^2`);
  }

  // Covariance terms if enabled
  if (covarianceEnabled && derivatives.length > 1) {
    for (let i = 0; i < derivatives.length; i++) {
      for (let j = i + 1; j < derivatives.length; j++) {
        const vi = formatVariableSymbolLatex(derivatives[i].variable);
        const vj = formatVariableSymbolLatex(derivatives[j].variable);
        symbolicTerms.push(
          `2 \\left( \\frac{\\partial f}{\\partial ${vi}} \\right) \\left( \\frac{\\partial f}{\\partial ${vj}} \\right) \\text{Cov}(${vi}, ${vj})`
        );
        analyticalTerms.push(
          `2 \\left( ${derivatives[i].latex} \\right) \\left( ${derivatives[j].latex} \\right) r_{${vi}, ${vj}} \\sigma_{${vi}} \\sigma_{${vj}}`
        );
      }
    }
  }

  const combinedSymbolicLatex = `\\sigma_f = \\sqrt{ ${symbolicTerms.join(' + ')} }`;
  const combinedAnalyticalLatex = `\\sigma_f = \\sqrt{ ${analyticalTerms.join(' + ')} }`;

  // Second-order terms for multiple variables: 0.5 * \Sigma (\partial^2 f / \partial x_i^2 * \sigma_i^2)^2
  const secondSymbolicTerms = secondDerivList.map(sd => {
    const varTex = formatVariableSymbolLatex(sd.variable);
    return `\\frac{1}{2} \\left( \\frac{\\partial^2 f}{\\partial ${varTex}^2} \\cdot \\sigma_{${varTex}}^2 \\right)^2`;
  });
  const secondAnalyticalTerms = secondDerivList.map(sd => {
    const varTex = formatVariableSymbolLatex(sd.variable);
    return `\\frac{1}{2} \\left( \\left( ${sd.latex} \\right) \\cdot \\sigma_{${varTex}}^2 \\right)^2`;
  });

  const allSymbolicSecond = [...symbolicTerms, ...secondSymbolicTerms];
  const allAnalyticalSecond = [...analyticalTerms, ...secondAnalyticalTerms];

  const secondOrderSymbolicLatex = `\\sigma_f = \\sqrt{ ${allSymbolicSecond.join(' + ')} }`;
  const secondOrderAnalyticalLatex = `\\sigma_f = \\sqrt{ ${allAnalyticalSecond.join(' + ')} }`;

  return {
    nominalFormulaLatex,
    combinedSymbolicLatex,
    combinedAnalyticalLatex,
    individualPartialsLatex,
    biasFormulaSymbolicLatex,
    biasFormulaAnalyticalLatex,
    secondOrderSymbolicLatex,
    secondOrderAnalyticalLatex,
    individualSecondPartialsLatex
  };
}
