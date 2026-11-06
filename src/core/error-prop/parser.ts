import * as math from 'mathjs';
import { CODATA_2022 } from '../../constants/codata2022';

export interface ParseResult {
  isValid: boolean;
  cleanExpression: string;
  astNode: math.MathNode | null;
  detectedVariables: string[];
  detectedConstants: string[];
  errorMessage?: string;
}

// Built-in functions and mathematical constants that should NOT be treated as user variables
const RESERVED_SYMBOLS = new Set([
  'pi', 'PI', 'e', 'E', 'i', 'I_unit',
  'true', 'false', 'null', 'undefined', 'Infinity', 'NaN',
  // Functions
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'exp', 'log', 'ln', 'log10', 'log2',
  'sqrt', 'cbrt', 'abs', 'sign', 'round', 'floor', 'ceil'
]);

// Physical constants supported as predefined exact constants if present in expressions
export const BUILTIN_PHYSICAL_CONSTANTS: Record<string, number> = {
  c: CODATA_2022.c,
  h: CODATA_2022.h,
  hbar: CODATA_2022.hbar,
  kB: CODATA_2022.kB,
  muB: CODATA_2022.muB,
  muN: CODATA_2022.muN,
  a0: CODATA_2022.a0,
  epsilon0: CODATA_2022.epsilon0,
  mu0: CODATA_2022.mu0,
  e_charge: CODATA_2022.e,
  pi: Math.PI
};

/**
 * Recursively transform AST nodes to standardize logarithmic functions:
 * 1. ln(x) -> mathjs natural log: log(x)
 * 2. log(x) (single argument) -> log base 10: log(x, 10)
 * 3. log10(x) -> log(x, 10)
 * 4. log<N>(x) -> log(x, N) where N is an integer base (e.g. log5(x), log2(x))
 */
export function transformLogarithmicAst(node: math.MathNode): math.MathNode {
  const mappedNode = node.map(child => transformLogarithmicAst(child));

  if ((mappedNode as any).isFunctionNode) {
    const fnNode = mappedNode as any;
    const fnName = fnNode.name ?? fnNode.fn?.name;
    const args = fnNode.args;

    // 1. ln(x) -> log(x) (mathjs native natural log)
    if (fnName === 'ln' && args.length === 1) {
      return new math.FunctionNode('log', [args[0]]);
    }

    // 2. log(x) with 1 argument -> log(x, 10) (log base 10)
    if (fnName === 'log' && args.length === 1) {
      return new math.FunctionNode('log', [args[0], new math.ConstantNode(10)]);
    }

    // 3. log10(x) -> log(x, 10)
    if (fnName === 'log10' && args.length === 1) {
      return new math.FunctionNode('log', [args[0], new math.ConstantNode(10)]);
    }

    // 4. log<N>(x) / log_<N>(x) -> log(x, N) (arbitrary base integer log)
    const match = typeof fnName === 'string' ? fnName.match(/^log_?(\d+)$/) : null;
    if (match && args.length === 1) {
      const base = parseInt(match[1], 10);
      return new math.FunctionNode('log', [args[0], new math.ConstantNode(base)]);
    }
  }

  return mappedNode;
}

/**
 * Clean and parse a mathematical string expression into an AST.
 * Handles forms like "f(x, y) = x^2 + y" or "y = 2*x" by extracting the RHS.
 */
export function parseExpression(rawInput: string): ParseResult {
  if (!rawInput || rawInput.trim() === '') {
    return {
      isValid: false,
      cleanExpression: '',
      astNode: null,
      detectedVariables: [],
      detectedConstants: [],
      errorMessage: 'Formula is empty'
    };
  }

  let expr = rawInput.trim();

  // If input is formatted as "f = ...", "f(x) = ...", or "I0 = ...", extract the RHS
  const equalIdx = expr.indexOf('=');
  if (equalIdx !== -1 && equalIdx < expr.length - 1) {
    expr = expr.substring(equalIdx + 1).trim();
  }

  try {
    const rawNode = math.parse(expr);

    // Scan AST to find all SymbolNode instances
    const symbolsFound = new Set<string>();
    rawNode.traverse((n: any, _path: string, parent: any) => {
      if (n.isSymbolNode) {
        // If the symbol is a function being called, do not count as variable
        const isFunctionCall = parent && parent.isFunctionNode && parent.fn === n;
        if (!isFunctionCall) {
          symbolsFound.add(n.name);
        }
      }
    });

    // Transform logarithmic functions into standard AST representation
    const node = transformLogarithmicAst(rawNode);

    // Filter out reserved math symbols, function names, arbitrary base log<N>, and built-in physical constants
    const variables: string[] = [];
    const constants: string[] = [];
    for (const sym of symbolsFound) {
      if (sym in BUILTIN_PHYSICAL_CONSTANTS) {
        constants.push(sym);
      } else if (!RESERVED_SYMBOLS.has(sym) && !/^log_?\d+$/.test(sym)) {
        variables.push(sym);
      }
    }

    // Sort alphabetically for clean display
    variables.sort();
    constants.sort();

    return {
      isValid: true,
      cleanExpression: expr,
      astNode: node,
      detectedVariables: variables,
      detectedConstants: constants
    };
  } catch (err: any) {
    return {
      isValid: false,
      cleanExpression: expr,
      astNode: null,
      detectedVariables: [],
      detectedConstants: [],
      errorMessage: err.message || 'Invalid mathematical syntax'
    };
  }
}
