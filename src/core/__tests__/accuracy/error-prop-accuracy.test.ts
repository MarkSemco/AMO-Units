import { describe, it, expect } from 'vitest';
import goldenErrorProp from '../../../../tests/fixtures/wolfram-golden-error-prop.json';
import { parseExpression } from '../../error-prop/parser';
import {
  computePartialDerivatives,
  computeSecondDerivatives
} from '../../error-prop/differentiator';
import { evaluateErrorPropagation } from '../../error-prop/evaluator';

function toMathJsSyntax(wolframExpr: string): string {
  return wolframExpr
    .replace(/Sqrt\[([^\]]+)\]/g, 'sqrt($1)')
    .replace(/Log\[([^\]]+)\]/g, 'ln($1)')
    .replace(/Sin\[([^\]]+)\]/g, 'sin($1)')
    .replace(/Cos\[([^\]]+)\]/g, 'cos($1)')
    .replace(/\bPi\b/g, 'pi');
}

describe('Zero-Trust Error Propagation & Second-Order Corrections Suite (Wolfram & ISO GUM Ground Truth)', () => {
  const cases = goldenErrorProp.testCases;

  it('contains expected number of verified analytical & numerical uncertainty benchmarks', () => {
    expect(cases.length).toBeGreaterThanOrEqual(12);
  });

  describe.each(cases)('$name', (tc) => {
    it('accurately derives first & second partial derivatives and matches Wolfram numerical evaluation', () => {
      const expr = toMathJsSyntax(tc.expression);
      const parseRes = parseExpression(expr);
      expect(parseRes.isValid).toBe(true);
      expect(parseRes.astNode).not.toBeNull();

      const varNames = Object.keys(tc.variables);
      const firstDerivs = computePartialDerivatives(parseRes.astNode!, varNames);
      const secondDerivs = computeSecondDerivatives(firstDerivs);

      const relErr = (a: number, b: number) => {
        if (Math.abs(b) < 1e-12) return Math.abs(a - b);
        return Math.abs(a - b) / Math.abs(b);
      };

      const varVals = tc.variables as unknown as Record<string, number>;
      const uncerts = tc.uncertainties as unknown as Record<string, number>;

      // Verify each variable's first derivative evaluation against Wolfram
      for (const expectedD of tc.firstDerivatives) {
        const found = firstDerivs.find(d => d.variable === expectedD.variable);
        expect(found).toBeDefined();

        const compiled = found!.simplifiedNode.compile();
        const evaluated = compiled.evaluate(varVals);
        expect(relErr(evaluated, expectedD.evaluated)).toBeLessThan(1e-9);
      }

      // Verify each variable's second derivative evaluation against Wolfram
      for (const expectedD2 of tc.secondDerivatives) {
        const found2 = secondDerivs.find(d => d.variable === expectedD2.variable);
        expect(found2).toBeDefined();

        const compiled2 = found2!.simplifiedNode.compile();
        const evaluated2 = compiled2.evaluate(varVals);
        expect(relErr(evaluated2, expectedD2.evaluated)).toBeLessThan(1e-9);
      }

      // Run full evaluation
      const evalRes = evaluateErrorPropagation({
        expressionNode: parseRes.astNode!,
        variableValues: varVals,
        uncertainties: uncerts,
        derivatives: firstDerivs,
        secondDerivatives: secondDerivs,
        covarianceEnabled: tc.correlations.length > 0,
        correlations: tc.correlations.map((c: any) => ({
          id: `${c.var1}-${c.var2}`,
          var1: c.var1,
          var2: c.var2,
          coefficient: c.r
        }))
      });

      // 1. Nominal value f(x)
      expect(relErr(evalRes.nominalValue, tc.nominalValue)).toBeLessThan(1e-9);

      // 2. Standard linear uncertainty σ_linear
      expect(relErr(evalRes.totalUncertainty, tc.linearUncertainty)).toBeLessThan(1e-9);

      // 3. Second-order induced bias shift Δ
      if (Math.abs(tc.biasShift) > 1e-12) {
        expect(relErr(evalRes.biasShift, tc.biasShift)).toBeLessThan(1e-9);
      } else {
        expect(Math.abs(evalRes.biasShift)).toBeLessThan(1e-12);
      }

      // 4. Second-order corrected nominal f_corrected = f0 + Δ
      expect(relErr(evalRes.correctedNominal, tc.correctedNominal)).toBeLessThan(1e-9);

      // 5. Second-order corrected combined uncertainty σ_corrected
      expect(relErr(evalRes.correctedUncertainty, tc.correctedUncertainty)).toBeLessThan(1e-9);

      // 6. ISO GUM nonlinearity regime classification
      expect(evalRes.regime).toBe(tc.regime);
    });
  });
});
