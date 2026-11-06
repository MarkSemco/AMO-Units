import * as math from 'mathjs';
import { customLatexHandler } from './latex-generator';

export interface AnalyticalDerivative {
  variable: string;
  derivativeNode: math.MathNode;
  simplifiedNode: math.MathNode;
  latex: string;
}

export interface AnalyticalSecondDerivative {
  variable: string;
  derivativeNode: math.MathNode;
  simplifiedNode: math.MathNode;
  latex: string;
}

/**
 * Simplify a derivative AST node while protecting logarithmic base constants
 * (e.g. log(10), log(5)) from being collapsed into decimal approximations.
 */
export function simplifyDerivativeNode(derivNode: math.MathNode): math.MathNode {
  // 1. Protect log(ConstantNode) from being evaluated into decimal floats
  const protectedAst = derivNode.transform(node => {
    if ((node as any).isFunctionNode && (node as any).name === 'log' && (node as any).args.length === 1 && (node as any).args[0].isConstantNode) {
      const val = (node as any).args[0].value;
      const safeVal = String(val).replace(/[^a-zA-Z0-9]/g, '_DOT_');
      return new math.SymbolNode(`__LOG_CONST_${safeVal}__`);
    }
    return node;
  });

  // 2. Perform algebraic simplification
  let simplified: math.MathNode;
  try {
    simplified = math.simplify(protectedAst);
  } catch {
    simplified = protectedAst;
  }

  // 3. Restore log(ConstantNode) with support for float/integer bases
  let restored = simplified.transform(node => {
    if ((node as any).isSymbolNode && typeof (node as any).name === 'string' && (node as any).name.startsWith('__LOG_CONST_')) {
      const match = (node as any).name.match(/^__LOG_CONST_(.+)__$/);
      if (match) {
        const numStr = match[1].replace(/_DOT_/g, '.');
        const num = Number(numStr);
        if (!isNaN(num)) {
          return new math.FunctionNode('log', [new math.ConstantNode(num)]);
        }
      }
    }
    return node;
  });

  // 4. Clean compound fractions (A / B) / C into A / (B * C) with ParenthesisNode unwrapping
  const unwrap = (n: any): any => {
    let curr = n;
    while (curr && curr.isParenthesisNode) {
      curr = curr.content;
    }
    return curr;
  };

  let changed = true;
  let iterations = 0;
  while (changed && iterations < 5) {
    changed = false;
    iterations++;
    restored = restored.transform(node => {
      if ((node as any).isOperatorNode && (node as any).op === '/' && (node as any).args.length === 2) {
        const left = unwrap((node as any).args[0]);
        const right = (node as any).args[1];
        if (left && left.isOperatorNode && left.op === '/' && left.args.length === 2) {
          const num = left.args[0];
          const denom = left.args[1];
          changed = true;
          if (denom && denom.isFunctionNode && denom.name === 'log') {
            return new math.OperatorNode('/', 'divide', [
              num,
              new math.OperatorNode('*', 'multiply', [right, denom])
            ]);
          } else {
            return new math.OperatorNode('/', 'divide', [
              num,
              new math.OperatorNode('*', 'multiply', [denom, right])
            ]);
          }
        }
      }
      return node;
    });
  }

  return restored;
}

/**
 * Compute analytical partial derivatives for a given set of variables
 */
export function computePartialDerivatives(
  expressionNode: math.MathNode,
  variableNames: string[]
): AnalyticalDerivative[] {
  const results: AnalyticalDerivative[] = [];

  for (const varName of variableNames) {
    try {
      const deriv = math.derivative(expressionNode, varName, { simplify: false });
      let simplified: math.MathNode;
      try {
        simplified = simplifyDerivativeNode(deriv);
      } catch {
        simplified = deriv;
      }

      const latex = simplified.toTex({ parenthesis: 'auto', handler: customLatexHandler });

      results.push({
        variable: varName,
        derivativeNode: deriv,
        simplifiedNode: simplified,
        latex
      });
    } catch (err: any) {
      // In case a derivative fails, create a zero node
      const zeroNode = math.parse('0');
      results.push({
        variable: varName,
        derivativeNode: zeroNode,
        simplifiedNode: zeroNode,
        latex: '0'
      });
    }
  }

  return results;
}

/**
 * Compute analytical second partial derivatives (∂²f / ∂x_i²) for a given set of first derivatives
 */
export function computeSecondDerivatives(
  firstDerivatives: AnalyticalDerivative[]
): AnalyticalSecondDerivative[] {
  const results: AnalyticalSecondDerivative[] = [];

  for (const d of firstDerivatives) {
    try {
      let deriv2: math.MathNode;
      try {
        deriv2 = math.derivative(d.simplifiedNode, d.variable, { simplify: false });
      } catch {
        deriv2 = math.derivative(d.derivativeNode, d.variable, { simplify: false });
      }

      let simplified2: math.MathNode;
      try {
        simplified2 = simplifyDerivativeNode(deriv2);
      } catch {
        simplified2 = deriv2;
      }

      const latex = simplified2.toTex({ parenthesis: 'auto', handler: customLatexHandler });

      results.push({
        variable: d.variable,
        derivativeNode: deriv2,
        simplifiedNode: simplified2,
        latex
      });
    } catch {
      const zeroNode = math.parse('0');
      results.push({
        variable: d.variable,
        derivativeNode: zeroNode,
        simplifiedNode: zeroNode,
        latex: '0'
      });
    }
  }

  return results;
}
