/**
 * High-precision formatting utilities for AMO and RF laboratory calculations
 */

/**
 * Format a number to a specified number of significant digits (4 to 10),
 * switching cleanly between decimal and scientific notation.
 */
export function formatSignificantDigits(
  value: number | null | undefined,
  sigFigs = 6,
  options?: {
    scientificThresholdSmall?: number;
    scientificThresholdLarge?: number;
    forceScientific?: boolean;
    trimTrailingZeros?: boolean;
  }
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }

  if (value === 0) {
    return '0';
  }

  if (!isFinite(value)) {
    return value > 0 ? '∞' : '-∞';
  }

  const clampedSigFigs = Math.max(3, Math.min(12, sigFigs));
  const absVal = Math.abs(value);

  const threshSmall = options?.scientificThresholdSmall ?? 1e-4;
  const threshLarge = options?.scientificThresholdLarge ?? 1e6;

  if (options?.forceScientific || absVal < threshSmall || absVal >= threshLarge) {
    // Format in scientific notation
    const expStr = value.toExponential(clampedSigFigs - 1);
    // Format "1.234e-5" to "1.234e-5"
    return expStr;
  }

  // Decimal notation with significant digits
  const str = Number(value.toPrecision(clampedSigFigs)).toString();
  return str;
}

/**
 * Metrology standard rounding:
 * Uncertainty is rounded to 1 or 2 sig figs (if first non-zero digit is 1 or 2, use 2 sig figs; else 1 sig fig).
 * Value is rounded to the same decimal position as the uncertainty.
 */
export function formatMetrologyError(
  value: number,
  uncertainty: number
): { formattedValue: string; formattedUncertainty: string; combined: string } {
  if (isNaN(value) || isNaN(uncertainty) || uncertainty < 0 || !isFinite(value)) {
    return {
      formattedValue: isNaN(value) ? 'NaN' : (!isFinite(value) ? (value > 0 ? '∞' : '-∞') : value.toString()),
      formattedUncertainty: isNaN(uncertainty) ? 'NaN' : uncertainty.toString(),
      combined: 'Invalid calculation'
    };
  }

  if (uncertainty === 0 || !isFinite(uncertainty)) {
    const valStr = formatSignificantDigits(value, 6);
    return {
      formattedValue: valStr,
      formattedUncertainty: '0',
      combined: `${valStr} ± 0`
    };
  }

  // Determine exponent of uncertainty
  const exp = Math.floor(Math.log10(uncertainty));
  const leadingDigit = Math.floor(uncertainty / Math.pow(10, exp));

  // If leading digit is 1 or 2, retain 2 significant figures; otherwise 1
  const uncSigFigs = (leadingDigit === 1 || leadingDigit === 2) ? 2 : 1;
  const roundedUnc = Number(uncertainty.toPrecision(uncSigFigs));

  // Determine decimal places of the rounded uncertainty
  const uncExp = Math.floor(Math.log10(roundedUnc));
  const decimalPlaces = Math.max(0, (uncSigFigs - 1) - uncExp);

  let valStr: string;
  let uncStr: string;

  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    // For large/small scientific magnitudes
    const valExp = Math.floor(Math.log10(Math.abs(value)));
    const scaledVal = value / Math.pow(10, valExp);
    const scaledUnc = roundedUnc / Math.pow(10, valExp);
    
    // Scale decimal places to match between scaled value and scaled uncertainty
    const scaledDecimals = Math.max(0, Math.min(15, valExp - uncExp + uncSigFigs - 1));
    valStr = scaledVal.toFixed(scaledDecimals);
    uncStr = scaledUnc.toFixed(scaledDecimals);
    return {
      formattedValue: `${valStr}e${valExp}`,
      formattedUncertainty: `${uncStr}e${valExp}`,
      combined: `(${valStr} ± ${uncStr}) × 10^${valExp}`
    };
  } else {
    valStr = value.toFixed(decimalPlaces);
    uncStr = roundedUnc.toFixed(decimalPlaces);
    return {
      formattedValue: valStr,
      formattedUncertainty: uncStr,
      combined: `${valStr} ± ${uncStr}`
    };
  }
}

/**
 * Format SI units with standard SI prefixes (p, n, u, m, k, M, G, T)
 */
export function formatWithSIPrefix(value: number, baseUnit: string, sigFigs = 4): string {
  if (value === 0 || !isFinite(value) || isNaN(value)) {
    return `0 ${baseUnit}`;
  }

  const prefixes = [
    { factor: 1e12, symbol: 'T' },
    { factor: 1e9, symbol: 'G' },
    { factor: 1e6, symbol: 'M' },
    { factor: 1e3, symbol: 'k' },
    { factor: 1, symbol: '' },
    { factor: 1e-3, symbol: 'm' },
    { factor: 1e-6, symbol: 'µ' },
    { factor: 1e-9, symbol: 'n' },
    { factor: 1e-12, symbol: 'p' },
    { factor: 1e-15, symbol: 'f' }
  ];

  const abs = Math.abs(value);
  for (const p of prefixes) {
    if (abs >= p.factor * 0.999) {
      const scaled = value / p.factor;
      return `${formatSignificantDigits(scaled, sigFigs)} ${p.symbol}${baseUnit}`;
    }
  }

  return `${formatSignificantDigits(value, sigFigs)} ${baseUnit}`;
}
