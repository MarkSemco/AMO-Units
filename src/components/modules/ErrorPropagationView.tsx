import React, { useState, useMemo, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { MathView } from '../common/MathView';
import { Sigma, Copy, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { parseExpression } from '../../core/error-prop/parser';
import { computePartialDerivatives, computeSecondDerivatives } from '../../core/error-prop/differentiator';
import { generateLatexEquations } from '../../core/error-prop/latex-generator';
import { evaluateErrorPropagation } from '../../core/error-prop/evaluator';
import { useClipboard } from '../../hooks/useClipboard';
import { CorrelationItem } from '../../types/error-prop';
import { handleNumberStepperKeyDown } from '../../core/number-stepper';
import { formatSignificantDigits } from '../../core/formatters';
import { useUndoRedo } from '../../context/UndoRedoContext';

const EXAMPLE_FORMULAS = [
  { label: 'Gaussian Laser Peak Intensity: 2P / (π w₀²)', formula: '2 * P / (pi * w0^2)' },
  { label: 'Natural Logarithm: ln(x)', formula: 'ln(x)' },
  { label: 'Decibel RF Power (Base 10): 10 * log(P / P0)', formula: '10 * log(P / P0)' },
  { label: 'Arbitrary Base Logarithm: log5(x)', formula: 'log5(x)' },
  { label: 'Ohmic Electric Power: V² / R', formula: 'V^2 / R' },
  { label: 'Rabi Saturation Coupling: Γ √(s₀ / 2)', formula: 'Gamma * sqrt(s0 / 2)' },
  { label: 'Quotient Rule: x / y', formula: 'x / y' },
  { label: 'Product Rule: x * y', formula: 'x * y' },
  { label: 'Kinetic Energy: 0.5 * m * v²', formula: '0.5 * m * v^2' }
];

export const ErrorPropagationView: React.FC = () => {
  const { copyToClipboard } = useClipboard();
  const { recordAction } = useUndoRedo();

  // Formula input
  const [formulaInput, setFormulaInput] = useState<string>('2 * P / (pi * w0^2)');
  const focusedFormulaRef = useRef<string>('2 * P / (pi * w0^2)');
  const focusedVarValuesRef = useRef<Record<string, string>>({});
  const focusedVarUncsRef = useRef<Record<string, string>>({});
  const focusedCorrelationsRef = useRef<Record<string, number>>({});

  // Toggle to substitute analytical partial derivatives into final error equation
  const [substitutePartials, setSubstitutePartials] = useState<boolean>(true);

  // Toggle to include second-order curvature corrections (ISO GUM Supplement 1)
  const [includeSecondOrder, setIncludeSecondOrder] = useState<boolean>(false);

  // Uncertain variables toggles (variable name -> boolean)
  const [uncertaintyFlags, setUncertaintyFlags] = useState<Record<string, boolean>>({
    P: true,
    w0: true
  });

  // Numeric input values and uncertainties (stored as strings for smooth typing)
  const [variableValues, setVariableValues] = useState<Record<string, string>>({
    P: '10',
    w0: '100'
  });

  const [variableUncertainties, setVariableUncertainties] = useState<Record<string, string>>({
    P: '0.5',
    w0: '5'
  });

  // Covariance toggle and correlation coefficients map (key "${v1}:${v2}" -> coefficient)
  const [covarianceEnabled, setCovarianceEnabled] = useState<boolean>(false);
  const [correlationMap, setCorrelationMap] = useState<Record<string, number>>({});
  const [draftCorrelations, setDraftCorrelations] = useState<Record<string, string>>({});

  // Parse expression
  const parseResult = useMemo(() => {
    return parseExpression(formulaInput);
  }, [formulaInput]);

  // Detected variables
  const detectedVariables = parseResult.detectedVariables;

  // Active uncertain variables
  const uncertainVars = useMemo(() => {
    return detectedVariables.filter(v => uncertaintyFlags[v] !== false);
  }, [detectedVariables, uncertaintyFlags]);

  // Compute analytical partial derivatives
  const analyticalPartials = useMemo(() => {
    if (!parseResult.isValid || !parseResult.astNode) return [];
    return computePartialDerivatives(parseResult.astNode, uncertainVars);
  }, [parseResult, uncertainVars]);

  // Compute analytical second partial derivatives (∂²f / ∂x_i²)
  const analyticalSecondPartials = useMemo(() => {
    if (!parseResult.isValid || !parseResult.astNode || analyticalPartials.length === 0) return [];
    return computeSecondDerivatives(analyticalPartials);
  }, [parseResult, analyticalPartials]);

  // Generate LaTeX equation bundle
  const latexBundle = useMemo(() => {
    return generateLatexEquations(
      parseResult.astNode,
      analyticalPartials,
      covarianceEnabled,
      analyticalSecondPartials
    );
  }, [parseResult.astNode, analyticalPartials, covarianceEnabled, analyticalSecondPartials]);

  // Derived correlation pairs (pure, no setState in render)
  const correlations: CorrelationItem[] = useMemo(() => {
    if (uncertainVars.length < 2) return [];
    const pairs: CorrelationItem[] = [];
    for (let i = 0; i < uncertainVars.length; i++) {
      for (let j = i + 1; j < uncertainVars.length; j++) {
        const v1 = uncertainVars[i];
        const v2 = uncertainVars[j];
        const key = `${v1}:${v2}`;
        pairs.push({
          var1: v1,
          var2: v2,
          coefficient: correlationMap[key] ?? 0
        });
      }
    }
    return pairs;
  }, [uncertainVars, correlationMap]);

  // Evaluate numerically
  const evaluation = useMemo(() => {
    if (!parseResult.isValid || !parseResult.astNode) {
      return null;
    }

    const numericVals: Record<string, number> = {};
    for (const v of detectedVariables) {
      const parsed = parseFloat(variableValues[v] ?? '0');
      numericVals[v] = isNaN(parsed) ? 0 : parsed;
    }

    const numericUncs: Record<string, number> = {};
    for (const v of detectedVariables) {
      const parsed = parseFloat(variableUncertainties[v] ?? '0');
      numericUncs[v] = isNaN(parsed) ? 0 : parsed;
    }

    return evaluateErrorPropagation({
      expressionNode: parseResult.astNode,
      variableValues: numericVals,
      uncertainties: numericUncs,
      derivatives: analyticalPartials,
      secondDerivatives: analyticalSecondPartials,
      covarianceEnabled,
      correlations
    });
  }, [
    parseResult,
    detectedVariables,
    variableValues,
    variableUncertainties,
    analyticalPartials,
    analyticalSecondPartials,
    covarianceEnabled,
    correlations
  ]);

  const toggleVariableUncertainty = (varName: string) => {
    const nextVal = uncertaintyFlags[varName] === false ? true : false;
    setUncertaintyFlags(prev => ({
      ...prev,
      [varName]: nextVal
    }));
    recordAction({
      description: `Toggle ${varName} uncertainty: ${nextVal ? 'active' : 'exact'}`,
      category: 'error-prop',
      undo: () => {
        setUncertaintyFlags(prev => ({ ...prev, [varName]: !nextVal }));
      },
      redo: () => {
        setUncertaintyFlags(prev => ({ ...prev, [varName]: nextVal }));
      }
    });
  };

  const setVarValue = (varName: string, valStr: string) => {
    setVariableValues(prev => ({ ...prev, [varName]: valStr }));
  };

  const setVarUnc = (varName: string, uncStr: string) => {
    setVariableUncertainties(prev => ({ ...prev, [varName]: uncStr }));
  };

  const setCorrelationCoeff = (v1: string, v2: string, coeff: number) => {
    const key = `${v1}:${v2}`;
    setCorrelationMap(prev => ({
      ...prev,
      [key]: Math.max(-1, Math.min(1, coeff))
    }));
  };

  const handleToggleSubstitutePartials = (checked: boolean) => {
    setSubstitutePartials(checked);
    recordAction({
      description: `${checked ? 'Enable' : 'Disable'} substitute partials`,
      category: 'error-prop',
      undo: () => setSubstitutePartials(!checked),
      redo: () => setSubstitutePartials(checked)
    });
  };

  const handleToggleIncludeSecondOrder = (checked: boolean) => {
    setIncludeSecondOrder(checked);
    recordAction({
      description: `${checked ? 'Enable' : 'Disable'} 2nd-order corrections`,
      category: 'error-prop',
      undo: () => setIncludeSecondOrder(!checked),
      redo: () => setIncludeSecondOrder(checked)
    });
  };

  const handleToggleCovariance = () => {
    const nextVal = !covarianceEnabled;
    setCovarianceEnabled(nextVal);
    recordAction({
      description: `${nextVal ? 'Show' : 'Hide'} covariance terms`,
      category: 'error-prop',
      undo: () => setCovarianceEnabled(!nextVal),
      redo: () => setCovarianceEnabled(nextVal)
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* 1. Formula Input & Variable Detection */}
      <Card
        title="Symbolic Error Propagation Equation Generator"
        subtitle="Analytical partial derivatives and combined standard uncertainty (ISO GUM)."
        category="error-prop"
        icon={<Sigma size={20} />}
      >
        {/* Preset Formulas Dropdown */}
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={14} color="var(--color-error-prop)" />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
              Load Example Physical Equation:
            </span>
          </div>
          <select
            onChange={e => {
              if (e.target.value) {
                const prev = formulaInput;
                const next = e.target.value;
                setFormulaInput(next);
                recordAction({
                  description: `Load formula: ${next}`,
                  category: 'error-prop',
                  undo: () => setFormulaInput(prev),
                  redo: () => setFormulaInput(next)
                });
                focusedFormulaRef.current = next;
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="">Select a lab formula template...</option>
            {EXAMPLE_FORMULAS.map((ex, idx) => (
              <option key={idx} value={ex.formula} style={{ backgroundColor: '#131B2E', color: '#F8FAFC' }}>
                {ex.label}
              </option>
            ))}
          </select>
        </div>

        {/* Formula Input Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>
            Enter Mathematical Equation f(x₁, x₂, ...):
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-bg-input)',
              border: `1px solid ${parseResult.isValid ? 'var(--color-error-prop)' : 'var(--color-error)'}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              padding: '6px 12px'
            }}
          >
            <input
              type="text"
              value={formulaInput}
              onFocus={() => {
                focusedFormulaRef.current = formulaInput;
              }}
              onBlur={() => {
                const prev = focusedFormulaRef.current;
                const next = formulaInput;
                if (prev !== next) {
                  recordAction({
                    description: `Edit formula: ${next}`,
                    category: 'error-prop',
                    undo: () => setFormulaInput(prev),
                    redo: () => setFormulaInput(next)
                  });
                  focusedFormulaRef.current = next;
                }
              }}
              onChange={e => setFormulaInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              placeholder="e.g. 2 * P / (pi * w0^2)"
              aria-label="Mathematical formula for error propagation"
              className="font-mono"
              style={{
                flex: 1,
                fontSize: 'var(--font-size-lg)',
                color: 'var(--color-text-primary)',
                padding: '6px 0'
              }}
            />
          </div>

          {!parseResult.isValid && parseResult.errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-error)',
                fontSize: 'var(--font-size-xs)',
                marginTop: '4px'
              }}
            >
              <AlertCircle size={14} />
              <span>Syntax Error: {parseResult.errorMessage}</span>
            </div>
          )}
        </div>

        {/* Detected Variables Checklist */}
        {detectedVariables.length > 0 && (
          <div
            style={{
              marginTop: 'var(--space-md)',
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--color-bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}
            >
              Auto-Detected Variables (Check to propagate uncertainty σ_i, uncheck for exact constants):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {detectedVariables.map(varName => {
                const isUncertain = uncertaintyFlags[varName] !== false;
                return (
                  <label
                    key={varName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      backgroundColor: isUncertain ? 'var(--color-error-prop-badge)' : 'var(--color-bg-surface)',
                      border: `1px solid ${isUncertain ? 'var(--color-error-prop)' : 'var(--color-border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      userSelect: 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isUncertain}
                      onChange={() => toggleVariableUncertainty(varName)}
                      style={{ cursor: 'pointer', accentColor: 'var(--color-error-prop)' }}
                    />
                    <span className="font-mono" style={{ fontWeight: 'bold' }}>
                      {varName}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-2xs)', color: isUncertain ? 'var(--color-error-prop)' : 'var(--color-text-muted)' }}>
                      {isUncertain ? '(has error σ)' : '(exact)'}
                    </span>
                  </label>
                );
              })}
            </div>

            {parseResult.detectedConstants.length > 0 && (
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  fontSize: 'var(--font-size-xs)'
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                  Auto-Detected Physical/Math Constants:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {parseResult.detectedConstants.map(c => (
                    <span
                      key={c}
                      className="font-mono"
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-optical-badge)',
                        color: 'var(--color-optical)',
                        border: '1px solid var(--color-border-subtle)',
                        fontSize: '11px',
                        fontWeight: 'semibold'
                      }}
                    >
                      {c} (CODATA exact)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 2. Rendered Analytical Error Equations Card */}
      {parseResult.isValid && (
        <Card
          title="Derived Error Propagation Equations"
          category="error-prop"
          icon={<Sigma size={20} />}
          actions={
            <Button
              size="sm"
              variant="outline"
              category="error-prop"
              icon={<Copy size={14} />}
              onClick={() => {
                const targetLatex = includeSecondOrder
                  ? (substitutePartials ? latexBundle.secondOrderAnalyticalLatex : latexBundle.secondOrderSymbolicLatex)
                  : (substitutePartials ? latexBundle.combinedAnalyticalLatex : latexBundle.combinedSymbolicLatex);
                copyToClipboard(targetLatex, 'Copied LaTeX Equation');
              }}
            >
              Copy LaTeX
            </Button>
          }
        >
          {/* Nominal Formula Rendered */}
          <div
            style={{
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--color-bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              marginBottom: 'var(--space-sm)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Nominal Function:
            </div>
            <MathView math={latexBundle.nominalFormulaLatex} />
          </div>

          {/* Individual Partial Derivatives */}
          {latexBundle.individualPartialsLatex.length > 0 && (
            <div
              style={{
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--color-bg-input)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
                marginBottom: 'var(--space-sm)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                Analytical Partial Derivatives (∂f / ∂x_i):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {latexBundle.individualPartialsLatex.map(part => (
                  <MathView key={part.variable} math={part.latex} />
                ))}
              </div>
            </div>
          )}

          {/* Second Partial Derivatives & Bias Formula when 2nd-order is active */}
          {includeSecondOrder && (
            <>
              {latexBundle.individualSecondPartialsLatex.length > 0 && (
                <div
                  style={{
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    marginBottom: 'var(--space-sm)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    Analytical Second Partial Derivatives (∂²f / ∂x_i²):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {latexBundle.individualSecondPartialsLatex.map(part => (
                      <MathView key={part.variable} math={part.latex} />
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  padding: 'var(--space-sm)',
                  backgroundColor: 'var(--color-bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  marginBottom: 'var(--space-sm)'
                }}
              >
                <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  2nd-Order Induced Expectation Bias Shift E[f] (ISO GUM Supplement 1):
                </div>
                <MathView
                  math={substitutePartials ? latexBundle.biasFormulaAnalyticalLatex : latexBundle.biasFormulaSymbolicLatex}
                />
              </div>
            </>
          )}

          {/* Full Combined Error Equation */}
          <div
            style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--color-bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${includeSecondOrder ? 'var(--color-error-prop)' : 'var(--color-border-strong)'}`,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '8px'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                Combined Uncertainty Equation ({includeSecondOrder ? '2nd-Order Corrected' : 'Linear 1st-Order'},{' '}
                {substitutePartials ? 'Analytical Substituted' : 'Symbolic'}):
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-primary)',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={substitutePartials}
                    onChange={e => handleToggleSubstitutePartials(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: 'var(--color-error-prop)' }}
                  />
                  <span style={{ fontWeight: 500 }}>Substitute partials</span>
                </label>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-primary)',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeSecondOrder}
                    onChange={e => handleToggleIncludeSecondOrder(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: 'var(--color-error-prop)' }}
                  />
                  <span style={{ fontWeight: 500 }}>Include 2nd-order (GUM S1)</span>
                </label>
              </div>
            </div>
            <MathView
              math={
                includeSecondOrder
                  ? (substitutePartials ? latexBundle.secondOrderAnalyticalLatex : latexBundle.secondOrderSymbolicLatex)
                  : (substitutePartials ? latexBundle.combinedAnalyticalLatex : latexBundle.combinedSymbolicLatex)
              }
            />
          </div>

          {/* Covariance / Correlation Expandable Section */}
          {uncertainVars.length > 1 && (
            <div style={{ marginTop: 'var(--space-sm)' }}>
              <button
                type="button"
                onClick={handleToggleCovariance}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-error-prop)',
                  padding: '6px 0',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {covarianceEnabled ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>{covarianceEnabled ? 'Hide' : 'Expand'} Covariance & Correlation Terms (r_ij)</span>
              </button>

              {covarianceEnabled && (
                <div
                  style={{
                    padding: 'var(--space-md)',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    marginTop: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-sm)'
                  }}
                >
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Enter Pearson correlation coefficients (r_ij ∈ [-1, 1]) for cross-correlated variables:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                    {correlations.map((corr) => (
                      <div
                        key={`${corr.var1}-${corr.var2}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '6px 12px',
                          backgroundColor: 'var(--color-bg-surface)',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--color-border-subtle)'
                        }}
                      >
                        <span className="font-mono" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold' }}>
                          r({corr.var1}, {corr.var2})
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={draftCorrelations[`${corr.var1}:${corr.var2}`] ?? corr.coefficient.toString()}
                          onFocus={() => {
                            const pairKey = `${corr.var1}:${corr.var2}`;
                            focusedCorrelationsRef.current[pairKey] = correlationMap[pairKey] ?? 0;
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            const pairKey = `${corr.var1}:${corr.var2}`;
                            handleNumberStepperKeyDown(e, newVal => {
                              setDraftCorrelations(prev => ({ ...prev, [pairKey]: newVal }));
                              const val = parseFloat(newVal);
                              if (!isNaN(val)) {
                                const clamped = Math.max(-1, Math.min(1, val));
                                setCorrelationCoeff(corr.var1, corr.var2, clamped);
                              }
                            });
                          }}
                          onChange={e => {
                            const pairKey = `${corr.var1}:${corr.var2}`;
                            const raw = e.target.value;
                            setDraftCorrelations(prev => ({ ...prev, [pairKey]: raw }));
                            const val = parseFloat(raw);
                            if (!isNaN(val)) {
                              const clamped = Math.max(-1, Math.min(1, val));
                              setCorrelationCoeff(corr.var1, corr.var2, clamped);
                            }
                          }}
                          onBlur={() => {
                            const pairKey = `${corr.var1}:${corr.var2}`;
                            const currentDraft = draftCorrelations[pairKey];
                            const prev = focusedCorrelationsRef.current[pairKey] ?? 0;
                            if (currentDraft !== undefined) {
                              const val = parseFloat(currentDraft);
                              if (isNaN(val)) {
                                setDraftCorrelations(prevDraft => ({ ...prevDraft, [pairKey]: (correlationMap[pairKey] ?? 0).toString() }));
                              } else {
                                const clamped = Math.max(-1, Math.min(1, val));
                                setDraftCorrelations(prevDraft => ({ ...prevDraft, [pairKey]: clamped.toString() }));
                                setCorrelationCoeff(corr.var1, corr.var2, clamped);
                                if (prev !== clamped) {
                                  recordAction({
                                    description: `Set r(${corr.var1}, ${corr.var2}) to ${clamped}`,
                                    category: 'error-prop',
                                    undo: () => {
                                      setCorrelationCoeff(corr.var1, corr.var2, prev);
                                      setDraftCorrelations(p => ({ ...p, [pairKey]: prev.toString() }));
                                    },
                                    redo: () => {
                                      setCorrelationCoeff(corr.var1, corr.var2, clamped);
                                      setDraftCorrelations(p => ({ ...p, [pairKey]: clamped.toString() }));
                                    }
                                  });
                                  focusedCorrelationsRef.current[pairKey] = clamped;
                                }
                              }
                            }
                          }}
                          className="font-mono"
                          style={{
                            width: '80px',
                            padding: '4px',
                            backgroundColor: 'var(--color-bg-base)',
                            border: '1px solid var(--color-border-subtle)',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--font-size-xs)'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* 3. Numerical Evaluation & Metrology Rounding Card */}
      {parseResult.isValid && evaluation && (
        <Card
          title="Numerical Uncertainty Evaluation"
          subtitle="Combined standard uncertainty and variable sensitivity budget for f(x₁, x₂, ...)."
          category="error-prop"
          icon={<Sigma size={20} />}
          actions={
            <Button
              size="sm"
              variant="primary"
              category="error-prop"
              icon={<Copy size={14} />}
              onClick={() => {
                copyToClipboard(
                  includeSecondOrder ? evaluation.formattedCorrectedCombined : evaluation.formattedCombined,
                  'Copied Result'
                );
              }}
            >
              Copy Result
            </Button>
          }
        >
          {/* Persistent Interactive Second-Order Curvature Toggle (Always accessible) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: includeSecondOrder ? 'var(--color-error-prop-badge)' : 'var(--color-bg-input)',
              border: `1px solid ${includeSecondOrder ? 'var(--color-error-prop)' : 'var(--color-border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-md)',
              transition: 'all 0.15s ease',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', flex: 1 }}>
              <input
                type="checkbox"
                checked={includeSecondOrder}
                onChange={e => handleToggleIncludeSecondOrder(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--color-error-prop)', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Include 2nd-order curvature corrections (ISO GUM Supplement 1)
                </div>
                <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Evaluates expectation bias shift Δ_bias = 0.5 Σ (∂²f/∂x_i² · σ_i²) and non-linear variance term 0.5 Σ (∂²f/∂x_i² · σ_i²)²
                </div>
              </div>
            </label>
            <span
              style={{
                fontSize: 'var(--font-size-2xs)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: includeSecondOrder ? 'var(--color-error-prop)' : 'var(--color-bg-surface)',
                color: includeSecondOrder ? '#FFFFFF' : 'var(--color-text-muted)',
                fontWeight: 'bold',
                letterSpacing: '0.04em'
              }}
            >
              {includeSecondOrder ? '2nd-ORDER ACTIVE' : 'LINEAR (1st-ORDER)'}
            </span>
          </div>

          {/* Automatic Diagnostic Warning Banner (ISO GUM Supplement 1) */}
          {evaluation && !evaluation.error && isFinite(evaluation.nominalValue) && (
            <>
              {evaluation.regime === 'extremum' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: 'var(--space-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-md)',
                    boxShadow: '0 0 12px rgba(239, 68, 68, 0.15)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={20} color="var(--color-error)" />
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-error)' }}>
                        Critical Metrology Diagnostic: Local Extremum / Stationary Point (∂f/∂x ≈ 0)
                      </span>
                    </div>
                    {includeSecondOrder ? (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={15} /> 2nd-Order Correction Applied
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        category="error-prop"
                        onClick={() => handleToggleIncludeSecondOrder(true)}
                      >
                        Enable 2nd-Order Correction
                      </Button>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                    At this operating point, first-order partial derivatives vanish (<strong>σ_linear ≈ 0</strong>), causing standard linear error propagation to falsely underestimate or report zero measurement uncertainty. Second-order curvature dominates! Under ISO GUM Supplement 1, curvature induces a significant bias shift and uncertainty.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-base)', padding: '8px 12px', borderRadius: 'var(--radius-xs)' }}>
                    <span>Nonlinearity Index: <strong className="font-mono" style={{ color: 'var(--color-error)' }}>η_nl = ∞ (Degenerate Linear)</strong></span>
                    <span>·</span>
                    <span>Induced Bias Shift: <strong className="font-mono">{isFinite(evaluation.biasShift) ? evaluation.biasShift.toPrecision(5) : '0'}</strong></span>
                    <span>·</span>
                    <span>True Uncertainty: <strong className="font-mono" style={{ color: 'var(--color-success)' }}>σ_corrected = {evaluation.formattedCorrectedUncertainty}</strong></span>
                  </div>
                </div>
              )}

              {evaluation.regime === 'severe' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: 'var(--space-md)',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid var(--color-warning)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-md)',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={20} color="var(--color-warning)" />
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                        Warning: Severe Function Curvature Detected (η_nl = {(evaluation.nonlinearityIndex * 100).toFixed(1)}%)
                      </span>
                    </div>
                    {includeSecondOrder ? (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={15} /> 2nd-Order Correction Applied
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        category="error-prop"
                        onClick={() => handleToggleIncludeSecondOrder(true)}
                      >
                        Enable 2nd-Order Correction
                      </Button>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                    The dimensionless nonlinearity index <strong>η_nl = {(evaluation.nonlinearityIndex * 100).toFixed(1)}%</strong> exceeds the 15% threshold defined by ISO GUM Supplement 1. High curvature induces an expectation bias shift of Δ_bias = {evaluation.biasShift.toPrecision(5)}, and the linear Taylor series understates measurement uncertainty.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-base)', padding: '8px 12px', borderRadius: 'var(--radius-xs)' }}>
                    <span>Nonlinearity Index: <strong className="font-mono" style={{ color: 'var(--color-warning)' }}>{(evaluation.nonlinearityIndex * 100).toFixed(1)}% (&gt;15%)</strong></span>
                    <span>·</span>
                    <span>Expectation Bias Shift: <strong className="font-mono">{evaluation.biasShift.toPrecision(5)}</strong></span>
                    <span>·</span>
                    <span>Uncertainty Comparison: <strong className="font-mono">{evaluation.formattedUncertainty} (lin) → {evaluation.formattedCorrectedUncertainty} (2nd-ord)</strong></span>
                  </div>
                </div>
              )}

              {evaluation.regime === 'mild' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: 'var(--space-md)',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid var(--color-info)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Info size={18} color="var(--color-info)" />
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-info)' }}>
                        Diagnostic Notice: Mild Curvature Detected (η_nl = {(evaluation.nonlinearityIndex * 100).toFixed(1)}%)
                      </span>
                    </div>
                    {includeSecondOrder ? (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={15} /> 2nd-Order Correction Applied
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        category="error-prop"
                        onClick={() => handleToggleIncludeSecondOrder(true)}
                      >
                        Include 2nd-Order Correction
                      </Button>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                    Dimensionless nonlinearity index is in the 5% – 15% range. Function curvature contributes moderate bias (Δ_bias = {evaluation.biasShift.toPrecision(5)}). Linear Taylor propagation is adequate for rough estimates, while 2nd-order correction provides refined metrological accuracy.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-base)', padding: '8px 12px', borderRadius: 'var(--radius-xs)' }}>
                    <span>Nonlinearity Index: <strong className="font-mono">{(evaluation.nonlinearityIndex * 100).toFixed(1)}% (5% – 15%)</strong></span>
                    <span>·</span>
                    <span>Expectation Bias Shift: <strong className="font-mono">{evaluation.biasShift.toPrecision(5)}</strong></span>
                  </div>
                </div>
              )}

              {evaluation.regime === 'linear' && includeSecondOrder && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid var(--color-success)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 'var(--space-md)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  <CheckCircle2 size={16} color="var(--color-success)" />
                  <span>
                    Linear Regime (η_nl = {(evaluation.nonlinearityIndex * 100).toFixed(2)}% &lt; 5%): Curvature corrections have negligible effect (&lt;0.1% change).
                  </span>
                </div>
              )}
            </>
          )}

          {/* Inputs Table for Variables */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-md)'
            }}
          >
            {detectedVariables.map(varName => {
              const isUncertain = uncertaintyFlags[varName] !== false;
              const val = variableValues[varName] ?? '';
              const unc = variableUncertainties[varName] ?? '';

              return (
                <div
                  key={varName}
                  style={{
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="font-mono" style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', color: 'var(--color-error-prop)' }}>
                      Variable {varName}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-2xs)', color: isUncertain ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {isUncertain ? 'Uncertainty Active' : 'Exact Value'}
                    </span>
                  </div>

                  {/* Nominal Value Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', minWidth: '40px' }}>
                      Value:
                    </span>
                    <input
                      type="text"
                      value={val}
                      onFocus={() => {
                        focusedVarValuesRef.current[varName] = val;
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        handleNumberStepperKeyDown(e, newVal => {
                          setVarValue(varName, newVal);
                        });
                      }}
                      onChange={e => setVarValue(varName, e.target.value)}
                      onBlur={() => {
                        const prev = focusedVarValuesRef.current[varName] ?? '';
                        const next = variableValues[varName] ?? '';
                        if (prev !== next) {
                          recordAction({
                            description: `Change ${varName}: ${prev} -> ${next}`,
                            category: 'error-prop',
                            undo: () => setVarValue(varName, prev),
                            redo: () => setVarValue(varName, next)
                          });
                          focusedVarValuesRef.current[varName] = next;
                        }
                      }}
                      placeholder="0.0"
                      className="font-mono"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '6px 10px',
                        backgroundColor: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    />
                  </div>

                  {/* Uncertainty Input if marked uncertain */}
                  {isUncertain && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', minWidth: '40px' }}>
                        ± σ_{varName}:
                      </span>
                      <input
                        type="text"
                        value={unc}
                        onFocus={() => {
                          focusedVarUncsRef.current[varName] = unc;
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          handleNumberStepperKeyDown(e, newVal => {
                            setVarUnc(varName, newVal);
                          });
                        }}
                        onChange={e => setVarUnc(varName, e.target.value)}
                        onBlur={() => {
                          const prev = focusedVarUncsRef.current[varName] ?? '';
                          const next = variableUncertainties[varName] ?? '';
                          if (prev !== next) {
                            recordAction({
                              description: `Change σ_${varName}: ${prev} -> ${next}`,
                              category: 'error-prop',
                              undo: () => setVarUnc(varName, prev),
                              redo: () => setVarUnc(varName, next)
                            });
                            focusedVarUncsRef.current[varName] = next;
                          }
                        }}
                        placeholder="0.0"
                        className="font-mono"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: '6px 10px',
                          backgroundColor: 'var(--color-bg-base)',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--font-size-sm)'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Formatted Result Banner */}
          <div
            style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--color-bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${
                evaluation.error || !isFinite(evaluation.nominalValue)
                  ? 'var(--color-error)'
                  : includeSecondOrder
                  ? 'var(--color-error-prop)'
                  : 'var(--color-border-subtle)'
              }`,
              boxShadow: includeSecondOrder ? 'var(--shadow-md), 0 0 12px var(--color-error-prop-glow)' : 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Final Evaluated Result ({includeSecondOrder ? '2nd-Order Corrected: E[f] ± σ_corrected' : 'Linear: f ± σ_linear'})
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'bold',
                color:
                  evaluation.error || !isFinite(evaluation.nominalValue)
                    ? 'var(--color-error)'
                    : 'var(--color-text-primary)',
                letterSpacing: '0.02em',
                textAlign: 'center'
              }}
            >
              {includeSecondOrder ? evaluation.formattedCorrectedCombined : evaluation.formattedCombined}
            </div>

            {/* Comparison Pill when toggle is ON */}
            {includeSecondOrder && !evaluation.error && isFinite(evaluation.nominalValue) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-error-prop)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                  marginTop: '4px'
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Linear:</span>
                <strong className="font-mono">{evaluation.formattedCombined}</strong>
                <span style={{ color: 'var(--color-error-prop)', fontWeight: 'bold' }}>→</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>2nd-Order Corrected:</span>
                <strong className="font-mono" style={{ color: 'var(--color-error-prop)' }}>
                  {evaluation.formattedCorrectedCombined}
                </strong>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  (Shift: {Math.abs(evaluation.biasShift) < 1e-15 ? '0' : `${evaluation.biasShift > 0 ? '+' : ''}${formatSignificantDigits(evaluation.biasShift, 4)}`})
                </span>
              </div>
            )}

            {evaluation.error || !isFinite(evaluation.nominalValue) ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-error)',
                  fontSize: 'var(--font-size-xs)',
                  marginTop: '4px'
                }}
              >
                <AlertCircle size={14} />
                <span>{evaluation.error || 'Evaluation resulted in non-finite value or division by zero'}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                <span>
                  Relative Uncertainty: <strong className="font-mono" style={{ color: 'var(--color-error-prop)' }}>
                    {includeSecondOrder
                      ? (isFinite(evaluation.correctedNominal) && evaluation.correctedNominal !== 0
                          ? (evaluation.correctedUncertainty / Math.abs(evaluation.correctedNominal) * 100).toFixed(2)
                          : '0.00')
                      : evaluation.relativeUncertaintyPercent.toFixed(2)}%
                  </strong>
                </span>
                <span>·</span>
                <span>
                  {includeSecondOrder ? 'E[f]:' : 'Nominal f:'} <strong className="font-mono">
                    {includeSecondOrder
                      ? (isFinite(evaluation.correctedNominal) ? evaluation.correctedNominal.toPrecision(6) : 'N/A')
                      : (isFinite(evaluation.nominalValue) ? evaluation.nominalValue.toPrecision(6) : 'N/A')}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  {includeSecondOrder ? 'σ_corrected:' : 'σ_linear:'} <strong className="font-mono">
                    {includeSecondOrder
                      ? (isFinite(evaluation.correctedUncertainty) ? evaluation.correctedUncertainty.toPrecision(4) : 'N/A')
                      : (isFinite(evaluation.totalUncertainty) ? evaluation.totalUncertainty.toPrecision(4) : 'N/A')}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  η_nl: <strong className="font-mono">
                    {isFinite(evaluation.nonlinearityIndex)
                      ? `${(evaluation.nonlinearityIndex * 100).toFixed(1)}%`
                      : '∞'}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
