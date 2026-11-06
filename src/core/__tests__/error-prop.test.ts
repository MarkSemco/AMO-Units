import { describe, it, expect } from 'vitest';
import { parseExpression } from '../error-prop/parser';
import { computePartialDerivatives, computeSecondDerivatives } from '../error-prop/differentiator';
import { generateLatexEquations } from '../error-prop/latex-generator';
import { evaluateErrorPropagation } from '../error-prop/evaluator';
import { formatMetrologyError } from '../formatters';

describe('Error Propagation Symbolic & Numeric Engine', () => {
  it('parses expressions and auto-detects variables while filtering known physical constants', () => {
    const res = parseExpression('2 * P / (pi * w0^2)');
    expect(res.isValid).toBe(true);
    // 'pi' must be filtered out; detected variables must be 'P' and 'w0'
    expect(res.detectedVariables).toEqual(['P', 'w0']);
  });

  it('correctly handles equations with LHS like "f = 2*P / (pi * w0^2)"', () => {
    const res = parseExpression('I0 = 2 * P / (pi * w0^2)');
    expect(res.isValid).toBe(true);
    expect(res.detectedVariables).toEqual(['P', 'w0']);
  });

  it('computes analytical partial derivatives for product rule (x * y)', () => {
    const parseRes = parseExpression('x * y');
    expect(parseRes.isValid).toBe(true);
    const partials = computePartialDerivatives(parseRes.astNode!, ['x', 'y']);

    // df/dx = y
    const dx = partials.find(p => p.variable === 'x');
    expect(dx?.simplifiedNode.toString()).toBe('y');

    // df/dy = x
    const dy = partials.find(p => p.variable === 'y');
    expect(dy?.simplifiedNode.toString()).toBe('x');
  });

  it('computes analytical partial derivatives for quotient rule (x / y)', () => {
    const parseRes = parseExpression('x / y');
    expect(parseRes.isValid).toBe(true);
    const partials = computePartialDerivatives(parseRes.astNode!, ['x', 'y']);

    // Evaluate df/dx and df/dy at x=6, y=2
    // f = 3. df/dx = 1/y = 0.5. df/dy = -x/y^2 = -6/4 = -1.5
    const evalRes = evaluateErrorPropagation({
      expressionNode: parseRes.astNode!,
      variableValues: { x: 6, y: 2 },
      uncertainties: { x: 0.1, y: 0.05 },
      derivatives: partials
    });

    expect(evalRes.nominalValue).toBeCloseTo(3.0, 4);

    const partX = evalRes.individualPartials.find(p => p.variable === 'x');
    const partY = evalRes.individualPartials.find(p => p.variable === 'y');

    expect(partX?.evaluatedDerivative).toBeCloseTo(0.5, 4);
    expect(partY?.evaluatedDerivative).toBeCloseTo(-1.5, 4);

    // Total variance: (0.5 * 0.1)^2 + (-1.5 * 0.05)^2 = (0.05)^2 + (-0.075)^2 = 0.0025 + 0.005625 = 0.008125
    // sigma_f = sqrt(0.008125) approx 0.090138
    expect(evalRes.totalUncertainty).toBeCloseTo(0.09014, 4);
  });

  it('generates accurate analytical partial derivatives for Gaussian beam peak intensity', () => {
    const parseRes = parseExpression('2 * P / (pi * w0^2)');
    expect(parseRes.isValid).toBe(true);

    const partials = computePartialDerivatives(parseRes.astNode!, ['P', 'w0']);
    expect(partials.length).toBe(2);

    const latex = generateLatexEquations(parseRes.astNode, partials, false);
    expect(latex.combinedSymbolicLatex).toContain('\\sigma_f = \\sqrt{');
    expect(latex.combinedSymbolicLatex).toContain('\\sigma_{P}');
    expect(latex.combinedSymbolicLatex).toContain('\\sigma_{w_{0}}');
  });

  it('evaluates numerical error propagation with optional covariance correlation', () => {
    // f = x + y
    const parseRes = parseExpression('x + y');
    const partials = computePartialDerivatives(parseRes.astNode!, ['x', 'y']);

    // Case 1: Independent variables (r = 0)
    // sigma_x = 1, sigma_y = 1 -> sigma_f = sqrt(1^2 + 1^2) = sqrt(2) approx 1.4142
    const indep = evaluateErrorPropagation({
      expressionNode: parseRes.astNode!,
      variableValues: { x: 10, y: 20 },
      uncertainties: { x: 1, y: 1 },
      derivatives: partials,
      covarianceEnabled: false
    });
    expect(indep.nominalValue).toBe(30);
    expect(indep.totalUncertainty).toBeCloseTo(Math.SQRT2, 4);

    // Case 2: Fully correlated variables (r = 1)
    // sigma_f = sqrt(1 + 1 + 2 * 1 * 1 * 1 * 1) = sqrt(4) = 2.0
    const corr = evaluateErrorPropagation({
      expressionNode: parseRes.astNode!,
      variableValues: { x: 10, y: 20 },
      uncertainties: { x: 1, y: 1 },
      derivatives: partials,
      covarianceEnabled: true,
      correlations: [{ var1: 'x', var2: 'y', coefficient: 1.0 }]
    });
    expect(corr.totalUncertainty).toBeCloseTo(2.0, 4);

    // Case 3: Anti-correlated variables (r = -1)
    // sigma_f = sqrt(1 + 1 - 2) = 0
    const antiCorr = evaluateErrorPropagation({
      expressionNode: parseRes.astNode!,
      variableValues: { x: 10, y: 20 },
      uncertainties: { x: 1, y: 1 },
      derivatives: partials,
      covarianceEnabled: true,
      correlations: [{ var1: 'x', var2: 'y', coefficient: -1.0 }]
    });
    expect(antiCorr.totalUncertainty).toBeCloseTo(0, 4);
  });

  it('formats metrology error according to ISO GUM guidelines', () => {
    // If leading digit of uncertainty is 1 or 2 -> 2 sig figs
    const res1 = formatMetrologyError(12.3456, 0.0123);
    // uncertainty 0.0123 -> leading digit 1 -> rounds to 0.012 (2 sig figs)
    expect(res1.formattedUncertainty).toBe('0.012');
    expect(res1.formattedValue).toBe('12.346');
    expect(res1.combined).toBe('12.346 ± 0.012');

    // If leading digit is 3..9 -> 1 sig fig
    const res2 = formatMetrologyError(100.482, 0.43);
    // uncertainty 0.43 -> leading digit 4 -> rounds to 0.4 (1 sig fig)
    expect(res2.formattedUncertainty).toBe('0.4');
    expect(res2.formattedValue).toBe('100.5');
    expect(res2.combined).toBe('100.5 ± 0.4');
  });

  it('formats scientific notation metrology error with aligned decimal precision', () => {
    // Small values: 1.2345e-7 +/- 5e-9
    // In 10^-7 base: scaledVal = 1.2345, scaledUnc = 0.05
    const resSmall = formatMetrologyError(1.2345e-7, 5e-9);
    expect(resSmall.combined).toBe('(1.23 ± 0.05) × 10^-7');
    expect(resSmall.formattedValue).toBe('1.23e-7');
    expect(resSmall.formattedUncertainty).toBe('0.05e-7');

    // Large values: 1.234567e8 +/- 3000
    // In 10^8 base: scaledVal = 1.234567, scaledUnc = 0.00003
    const resLarge = formatMetrologyError(1.234567e8, 3000);
    expect(resLarge.combined).toBe('(1.23457 ± 0.00003) × 10^8');

    // Non-finite values safely return invalid indicator without throwing
    const resInf = formatMetrologyError(Infinity, 1.0);
    expect(resInf.combined).toBe('Invalid calculation');
  });

  it('filters CODATA physical constants (h, c, kB) and evaluates them automatically', () => {
    // Formula: E = h * nu
    const parseRes = parseExpression('h * nu');
    expect(parseRes.isValid).toBe(true);
    expect(parseRes.detectedVariables).toEqual(['nu']);
    expect(parseRes.detectedConstants).toContain('h');

    const partials = computePartialDerivatives(parseRes.astNode!, ['nu']);
    expect(partials.length).toBe(1);

    // Evaluate at nu = 1e14 Hz with uncertainty 1e11 Hz
    const evalRes = evaluateErrorPropagation({
      expressionNode: parseRes.astNode!,
      variableValues: { nu: 1e14 },
      uncertainties: { nu: 1e11 },
      derivatives: partials
    });

    // Nominal E = 6.62607015e-34 * 1e14 = 6.62607015e-20 J
    expect(evalRes.nominalValue).toBeCloseTo(6.62607015e-20, 24);
    // Uncertainty sigma_E = h * 1e11 = 6.62607015e-23 J
    expect(evalRes.totalUncertainty).toBeCloseTo(6.62607015e-23, 27);
  });

  it('handles division by zero and negative radical safely in numerical evaluation', () => {
    const parseRes = parseExpression('1 / x');
    const partials = computePartialDerivatives(parseRes.astNode!, ['x']);

    const evalRes = evaluateErrorPropagation({
      expressionNode: parseRes.astNode!,
      variableValues: { x: 0 },
      uncertainties: { x: 0.1 },
      derivatives: partials
    });

    expect(isNaN(evalRes.nominalValue)).toBe(true);
    expect(evalRes.error).toBeDefined();
    expect(evalRes.formattedCombined).toBe('Invalid calculation');
  });

  describe('Logarithmic Functions: ln, log base 10, arbitrary base log<N>', () => {
    it('handles natural logarithm ln(x): parses, differentiates, renders \\ln, and evaluates numerically', () => {
      const parseRes = parseExpression('ln(x)');
      expect(parseRes.isValid).toBe(true);
      expect(parseRes.detectedVariables).toEqual(['x']);

      const partials = computePartialDerivatives(parseRes.astNode!, ['x']);
      expect(partials.length).toBe(1);

      const dx = partials[0];
      expect(dx.simplifiedNode.toString()).toBe('1 / x');
      expect(dx.latex).toContain('\\frac{1}{');

      const latexBundle = generateLatexEquations(parseRes.astNode, partials, false);
      expect(latexBundle.nominalFormulaLatex).toContain('\\ln');

      // Evaluate at x = e (should give 1.0)
      const evalResE = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: Math.E },
        uncertainties: { x: 0.1 },
        derivatives: partials
      });
      expect(evalResE.nominalValue).toBeCloseTo(1.0, 5);

      // Evaluate at x = 2 with unc = 0.2: df/dx = 1/2 = 0.5, totalUncertainty = 0.5 * 0.2 = 0.1
      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 2 },
        uncertainties: { x: 0.2 },
        derivatives: partials
      });
      expect(evalRes.nominalValue).toBeCloseTo(Math.log(2), 5);
      expect(evalRes.individualPartials[0].evaluatedDerivative).toBeCloseTo(0.5, 5);
      expect(evalRes.totalUncertainty).toBeCloseTo(0.1, 5);
    });

    it('handles base-10 logarithm log(x): renders \\log_{10}, computes d/dx = 1/(x * ln(10)), and evaluates', () => {
      const parseRes = parseExpression('log(x)');
      expect(parseRes.isValid).toBe(true);
      expect(parseRes.detectedVariables).toEqual(['x']);

      const partials = computePartialDerivatives(parseRes.astNode!, ['x']);
      expect(partials.length).toBe(1);

      const dx = partials[0];
      // simplifiedNode should keep symbolic log(10) without decimal approximation
      expect(dx.simplifiedNode.toString()).toBe('1 / (x * log(10))');
      expect(dx.latex).toContain('\\ln\\left(10\\right)');

      const latexBundle = generateLatexEquations(parseRes.astNode, partials, false);
      expect(latexBundle.nominalFormulaLatex).toContain('\\log_{10}');

      // Evaluate at x = 100 -> log10(100) = 2.0
      const evalRes100 = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 100 },
        uncertainties: { x: 5 },
        derivatives: partials
      });
      expect(evalRes100.nominalValue).toBeCloseTo(2.0, 5);

      // Evaluate at x = 10 with unc = 1.0: df/dx = 1 / (10 * ln(10)) approx 0.0434294
      const evalRes10 = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 10 },
        uncertainties: { x: 1.0 },
        derivatives: partials
      });
      const expectedDeriv = 1 / (10 * Math.LN10);
      expect(evalRes10.individualPartials[0].evaluatedDerivative).toBeCloseTo(expectedDeriv, 6);
      expect(evalRes10.totalUncertainty).toBeCloseTo(expectedDeriv * 1.0, 6);
    });

    it('handles arbitrary base logarithm log5(x) and log2(x): renders \\log_{5}, \\log_{2}, and computes correct partials', () => {
      // Base 5: log5(x)
      const parseRes5 = parseExpression('log5(x)');
      expect(parseRes5.isValid).toBe(true);
      expect(parseRes5.detectedVariables).toEqual(['x']);

      const partials5 = computePartialDerivatives(parseRes5.astNode!, ['x']);
      const dx5 = partials5[0];
      expect(dx5.simplifiedNode.toString()).toBe('1 / (x * log(5))');
      expect(dx5.latex).toContain('\\ln\\left(5\\right)');

      const latexBundle5 = generateLatexEquations(parseRes5.astNode, partials5, false);
      expect(latexBundle5.nominalFormulaLatex).toContain('\\log_{5}');

      // Evaluate log5(25) -> 2.0
      const evalRes25 = evaluateErrorPropagation({
        expressionNode: parseRes5.astNode!,
        variableValues: { x: 25 },
        uncertainties: { x: 1.0 },
        derivatives: partials5
      });
      expect(evalRes25.nominalValue).toBeCloseTo(2.0, 5);

      // Base 2: log2(x)
      const parseRes2 = parseExpression('log2(x)');
      expect(parseRes2.isValid).toBe(true);
      const partials2 = computePartialDerivatives(parseRes2.astNode!, ['x']);
      const latexBundle2 = generateLatexEquations(parseRes2.astNode, partials2, false);
      expect(latexBundle2.nominalFormulaLatex).toContain('\\log_{2}');

      // Evaluate log2(8) -> 3.0
      const evalRes8 = evaluateErrorPropagation({
        expressionNode: parseRes2.astNode!,
        variableValues: { x: 8 },
        uncertainties: { x: 0.5 },
        derivatives: partials2
      });
      expect(evalRes8.nominalValue).toBeCloseTo(3.0, 5);
    });

    it('handles non-integer float base logarithm log(x, 2.5) without symbol leakage or evaluation crash', () => {
      const parseRes = parseExpression('log(x, 2.5)');
      expect(parseRes.isValid).toBe(true);
      expect(parseRes.detectedVariables).toEqual(['x']);

      const partials = computePartialDerivatives(parseRes.astNode!, ['x']);
      expect(partials.length).toBe(1);

      const dx = partials[0];
      // simplifiedNode should preserve log(2.5) symbolically and must NOT leak __LOG_CONST_
      expect(dx.simplifiedNode.toString()).toBe('1 / (x * log(2.5))');
      expect(dx.simplifiedNode.toString()).not.toContain('__LOG_CONST_');
      expect(dx.latex).not.toContain('__LOG_CONST_');
      expect(dx.latex).toContain('\\ln\\left(2.5\\right)');

      // Evaluate at x = 6.25 (2.5^2 -> should equal 2.0)
      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 6.25 },
        uncertainties: { x: 0.1 },
        derivatives: partials
      });

      expect(evalRes.nominalValue).toBeCloseTo(2.0, 5);
      const expectedDeriv = 1 / (6.25 * Math.log(2.5));
      expect(evalRes.individualPartials[0].evaluatedDerivative).toBeCloseTo(expectedDeriv, 6);
      expect(evalRes.totalUncertainty).toBeCloseTo(expectedDeriv * 0.1, 6);
    });

    it('supports underscore base notations log_10(x) and log_5(x)', () => {
      const parseRes10 = parseExpression('log_10(x)');
      expect(parseRes10.isValid).toBe(true);
      expect(parseRes10.detectedVariables).toEqual(['x']);
      const latex10 = generateLatexEquations(parseRes10.astNode, [], false);
      expect(latex10.nominalFormulaLatex).toContain('\\log_{10}');

      const parseRes5 = parseExpression('log_5(x)');
      expect(parseRes5.isValid).toBe(true);
      expect(parseRes5.detectedVariables).toEqual(['x']);
      const latex5 = generateLatexEquations(parseRes5.astNode, [], false);
      expect(latex5.nominalFormulaLatex).toContain('\\log_{5}');
    });

    it('correctly handles RF decibel formula 10 * log(P / P0) with quotient partials', () => {
      const parseRes = parseExpression('10 * log(P / P0)');
      expect(parseRes.isValid).toBe(true);
      expect(parseRes.detectedVariables).toEqual(['P', 'P0']);

      const partials = computePartialDerivatives(parseRes.astNode!, ['P', 'P0']);
      const dP = partials.find(p => p.variable === 'P');
      const dP0 = partials.find(p => p.variable === 'P0');

      expect(dP?.simplifiedNode.toString()).toBe('10 / (P * log(10))');
      expect(dP0?.simplifiedNode.toString()).toBe('-(10 / (P0 * log(10)))');

      const latex = generateLatexEquations(parseRes.astNode, partials, false);
      expect(latex.nominalFormulaLatex).toContain('\\log_{10}');

      // Evaluate at P = 100, P0 = 10 -> 10 * log10(10) = 10 dB
      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { P: 100, P0: 10 },
        uncertainties: { P: 1, P0: 0.1 },
        derivatives: partials
      });

      expect(evalRes.nominalValue).toBeCloseTo(10.0, 5);
      expect(evalRes.error).toBeUndefined();
    });

    it('generates distinct combinedSymbolicLatex and combinedAnalyticalLatex for toggle in final equation', () => {
      const parseRes = parseExpression('x * y');
      const partials = computePartialDerivatives(parseRes.astNode!, ['x', 'y']);
      const latex = generateLatexEquations(parseRes.astNode, partials, false);

      // Symbolic version retains \partial f / \partial x
      expect(latex.combinedSymbolicLatex).toContain('\\frac{\\partial f}{\\partial x}');
      expect(latex.combinedSymbolicLatex).toContain('\\frac{\\partial f}{\\partial y}');

      // Analytical version substitutes the partial derivatives (y for dx, x for dy)
      expect(latex.combinedAnalyticalLatex).toContain('y \\cdot \\sigma_{x}');
      expect(latex.combinedAnalyticalLatex).toContain('x \\cdot \\sigma_{y}');
      expect(latex.combinedAnalyticalLatex).not.toContain('\\frac{\\partial f}{\\partial x}');
    });
  });

  describe('ISO GUM Supplement 1: Second-Order Curvature & Nonlinearity Diagnostic Engine', () => {
    it('computes analytical second partial derivatives ∂²f/∂x_i² correctly', () => {
      // f = x^3
      const parseRes = parseExpression('x^3');
      expect(parseRes.isValid).toBe(true);

      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['x']);
      expect(firstPartials.length).toBe(1);
      // df/dx = 3 * x^2
      expect(firstPartials[0].simplifiedNode.toString()).toBe('3 * x ^ 2');

      const secondPartials = computeSecondDerivatives(firstPartials);
      expect(secondPartials.length).toBe(1);
      // d²f/dx² = 6 * x
      expect(secondPartials[0].simplifiedNode.toString()).toBe('6 * x');
      expect(secondPartials[0].latex).toBe('6\\cdot x');
    });

    it('computes second partial derivatives for multivariable functions (x^2 * y^3)', () => {
      const parseRes = parseExpression('x^2 * y^3');
      expect(parseRes.isValid).toBe(true);

      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['x', 'y']);
      const secondPartials = computeSecondDerivatives(firstPartials);

      const sX = secondPartials.find(p => p.variable === 'x');
      const sY = secondPartials.find(p => p.variable === 'y');

      // d²f/dx² = 2 * y^3
      expect(sX?.simplifiedNode.toString()).toBe('2 * y ^ 3');
      // d²f/dy² = 6 * x^2 * y
      expect(sY?.simplifiedNode.toString()).toBe('6 * x ^ 2 * y');
    });

    it('accurately detects stationary point / local extremum (f = x^2 at x = 0)', () => {
      // f = x^2 at x = 0 with sigma_x = 0.5
      // Linear Taylor says df/dx = 0, so sigma_linear = 0!
      // Curvature d²f/dx² = 2.
      // Expected bias shift: Δ_bias = 0.5 * 2 * (0.5)^2 = 0.25.
      // Corrected uncertainty: sqrt(0 + 0.5 * (2 * 0.25)^2) = sqrt(0.5 * 0.25) = sqrt(0.125) approx 0.353553.
      const parseRes = parseExpression('x^2');
      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['x']);
      const secondPartials = computeSecondDerivatives(firstPartials);

      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 0 },
        uncertainties: { x: 0.5 },
        derivatives: firstPartials,
        secondDerivatives: secondPartials
      });

      expect(evalRes.nominalValue).toBe(0);
      expect(evalRes.totalUncertainty).toBe(0); // linear fails and says 0 error
      expect(evalRes.regime).toBe('extremum');
      expect(evalRes.nonlinearityIndex).toBe(Infinity);
      expect(evalRes.biasShift).toBeCloseTo(0.25, 5);
      expect(evalRes.correctedNominal).toBeCloseTo(0.25, 5);
      expect(evalRes.correctedUncertainty).toBeCloseTo(Math.sqrt(0.125), 5);

      // Check formatted output under ISO GUM (uncertainty 0.35 rounds to 0.4, nominal 0.25 rounds to 0.3)
      expect(evalRes.formattedNominal).toBe('0');
      expect(evalRes.formattedCorrectedCombined).toBe('0.3 ± 0.4');
    });

    it('classifies severe nonlinearity regime (η_nl > 0.15)', () => {
      // f(x) = x^2 at x = 1.0, sigma_x = 1.0
      // df/dx = 2 -> sigma_linear = 2 * 1 = 2.
      // d²f/dx² = 2 -> Δ_bias = 0.5 * 2 * 1^2 = 1.0.
      // η_nl = 1.0 / 2.0 = 0.50 (> 0.15) -> 'severe'.
      const parseRes = parseExpression('x^2');
      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['x']);

      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 1.0 },
        uncertainties: { x: 1.0 },
        derivatives: firstPartials
      });

      expect(evalRes.regime).toBe('severe');
      expect(evalRes.nonlinearityIndex).toBeCloseTo(0.5, 4);
      expect(evalRes.biasShift).toBeCloseTo(1.0, 4);
      expect(evalRes.nominalValue).toBe(1.0);
      expect(evalRes.correctedNominal).toBe(2.0); // 1.0 + 1.0 bias
      // Corrected uncertainty: sqrt(2^2 + 0.5 * (2 * 1)^2) = sqrt(4 + 0.5 * 4) = sqrt(6) approx 2.44949
      expect(evalRes.correctedUncertainty).toBeCloseTo(Math.sqrt(6), 4);
    });

    it('classifies mild nonlinearity regime (0.05 <= η_nl <= 0.15)', () => {
      // f(x) = 100 * x + 5 * x^2 at x = 10, sigma_x = 2
      // df/dx = 100 + 10 * x = 200.
      // sigma_linear = 200 * 2 = 400.
      // d²f/dx² = 10.
      // Δ_bias = 0.5 * 10 * 2^2 = 20.
      // η_nl = 20 / 400 = 0.05 -> 'mild'.
      const parseRes = parseExpression('100 * x + 5 * x^2');
      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['x']);

      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 10 },
        uncertainties: { x: 2 },
        derivatives: firstPartials
      });

      expect(evalRes.regime).toBe('mild');
      expect(evalRes.nonlinearityIndex).toBeCloseTo(0.05, 4);
      expect(evalRes.biasShift).toBeCloseTo(20.0, 4);
      expect(evalRes.correctedNominal).toBeCloseTo(evalRes.nominalValue + 20, 4);
    });

    it('classifies linear regime (η_nl < 0.05) when curvature is zero or negligible', () => {
      // f(x, y) = 3 * x + 4 * y
      // Second derivatives are 0, Δ_bias = 0, η_nl = 0 -> 'linear'
      const parseRes = parseExpression('3 * x + 4 * y');
      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['x', 'y']);

      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 5, y: 10 },
        uncertainties: { x: 0.1, y: 0.2 },
        derivatives: firstPartials
      });

      expect(evalRes.regime).toBe('linear');
      expect(evalRes.nonlinearityIndex).toBe(0);
      expect(evalRes.biasShift).toBe(0);
      expect(evalRes.correctedNominal).toBe(evalRes.nominalValue);
      expect(evalRes.correctedUncertainty).toBeCloseTo(evalRes.totalUncertainty, 6);
    });

    it('generates full second-order LaTeX bundle with bias and variance equations', () => {
      const parseRes = parseExpression('2 * P / (pi * w0^2)');
      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['P', 'w0']);
      const secondPartials = computeSecondDerivatives(firstPartials);
      const latexBundle = generateLatexEquations(parseRes.astNode, firstPartials, false, secondPartials);

      // Bias equation
      expect(latexBundle.biasFormulaSymbolicLatex).toContain('E[f] = f_0 + \\frac{1}{2}');
      expect(latexBundle.biasFormulaSymbolicLatex).toContain('\\frac{\\partial^2 f}{\\partial P^2}');
      expect(latexBundle.biasFormulaSymbolicLatex).toContain('\\frac{\\partial^2 f}{\\partial w_{0}^2}');

      // Second partial derivatives
      expect(latexBundle.individualSecondPartialsLatex.length).toBe(2);
      const sdP = latexBundle.individualSecondPartialsLatex.find(p => p.variable === 'P');
      const sdW0 = latexBundle.individualSecondPartialsLatex.find(p => p.variable === 'w0');
      expect(sdP?.latex).toContain('\\frac{\\partial^2 f}{\\partial P^2} = 0');
      expect(sdW0?.latex).toContain('\\frac{\\partial^2 f}{\\partial w_{0}^2}');

      // Second order combined uncertainty equations
      expect(latexBundle.secondOrderSymbolicLatex).toContain('\\sigma_f = \\sqrt{');
      expect(latexBundle.secondOrderSymbolicLatex).toContain('\\frac{1}{2}');
      expect(latexBundle.secondOrderAnalyticalLatex).toContain('\\sigma_f = \\sqrt{');
    });

    it('handles zero uncertainty safely without crashing in second-order evaluation', () => {
      const parseRes = parseExpression('x^2');
      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['x']);

      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 5 },
        uncertainties: { x: 0 },
        derivatives: firstPartials
      });

      expect(evalRes.nominalValue).toBe(25);
      expect(evalRes.totalUncertainty).toBe(0);
      expect(evalRes.biasShift).toBe(0);
      expect(evalRes.correctedNominal).toBe(25);
      expect(evalRes.correctedUncertainty).toBe(0);
      expect(evalRes.regime).toBe('linear');
      expect(evalRes.nonlinearityIndex).toBe(0);
    });

    it('performs scale-invariant nonlinearity evaluation for small physical SI units (AMO physics)', () => {
      // E = h * c / lambda for 780 nm laser with 1 pm uncertainty
      // In SI units, total uncertainty is ~3.26e-25 J (far below 1e-12 J), but nonlinearity is ~1.3e-6 (linear)
      const parseRes = parseExpression('h * c / lambda');
      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['lambda']);

      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { lambda: 780e-9 },
        uncertainties: { lambda: 1e-12 },
        derivatives: firstPartials
      });

      expect(evalRes.nominalValue).toBeCloseTo(2.5467e-19, 23);
      expect(evalRes.totalUncertainty).toBeLessThan(1e-12); // extremely small in Joules
      expect(evalRes.regime).toBe('linear'); // MUST be linear, NOT falsely flagged as extremum!
      expect(evalRes.nonlinearityIndex).toBeLessThan(0.001);
    });

    it('detects trigonometric stationary points despite floating-point roundoff (sin(x) at pi/2)', () => {
      // sin(x) at pi/2 has local maximum. cos(pi/2) in JS is ~6.12e-17 (not exactly 0)
      const parseRes = parseExpression('sin(x)');
      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['x']);

      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: Math.PI / 2 },
        uncertainties: { x: 0.1 },
        derivatives: firstPartials
      });

      expect(evalRes.regime).toBe('extremum');
      expect(evalRes.nonlinearityIndex).toBe(Infinity);
      expect(evalRes.correctedUncertainty).toBeGreaterThan(0);
    });

    it('detects hyperbolic saddle point where expectation bias cancels (x^2 - y^2 at 0,0)', () => {
      // f(x, y) = x^2 - y^2 at (0, 0) with sigma_x = 1, sigma_y = 1
      // df/dx = 0, df/dy = 0 -> sigma_linear = 0
      // d²f/dx² = 2, d²f/dy² = -2 -> Δ_bias = 0.5 * (2*1 - 2*1) = 0
      // But 2nd-order variance term = 0.5 * [(2)^2 + (-2)^2] = 4 -> sigma_corrected = 2.0
      const parseRes = parseExpression('x^2 - y^2');
      const firstPartials = computePartialDerivatives(parseRes.astNode!, ['x', 'y']);

      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: { x: 0, y: 0 },
        uncertainties: { x: 1, y: 1 },
        derivatives: firstPartials
      });

      expect(evalRes.nominalValue).toBe(0);
      expect(evalRes.totalUncertainty).toBe(0);
      expect(evalRes.biasShift).toBe(0);
      expect(evalRes.regime).toBe('extremum');
      expect(evalRes.nonlinearityIndex).toBe(Infinity);
      expect(evalRes.correctedUncertainty).toBeCloseTo(2.0, 5);
    });
  });
});
