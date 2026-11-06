/**
 * Precision Digit Place Number Stepper
 *
 * Allows Up and Down arrow keys to increment/decrement the specific decimal place
 * where the user's cursor is positioned (e.g. hundreds, tens, ones, tenths, hundredths),
 * eliminating floating-point artifacts and preserving cursor position.
 */

export interface StepNumberResult {
  newValue: string;
  newCursorPos: number;
}

/**
 * Steps the numeric value in `currentStr` at the cursor or selection by 10^power (or 10x with Shift).
 *
 * @param currentStr - The current input string
 * @param selectionStart - Start of cursor/selection
 * @param selectionEnd - End of cursor/selection
 * @param direction - 1 for increment (ArrowUp), -1 for decrement (ArrowDown)
 * @param isShift - True if Shift key is held (10x step multiplier)
 * @returns Object with newValue and newCursorPos, or null if input is non-numeric
 */
export function stepNumberAtCursor(
  currentStr: string,
  selectionStart: number,
  selectionEnd: number,
  direction: 1 | -1,
  isShift: boolean
): StepNumberResult | null {
  if (!currentStr || typeof currentStr !== 'string') {
    return null;
  }

  // Support European comma decimal separator if string contains a comma and no period
  const hasComma = currentStr.includes(',') && !currentStr.includes('.');
  const workingStr = hasComma ? currentStr.replace(',', '.') : currentStr;

  // Check if string contains at least one digit
  if (!/\d/.test(workingStr)) {
    return null;
  }

  // Handle scientific notation (e.g. 1.23e-4 or 2E5)
  const ePos = workingStr.search(/[eE]/);
  if (ePos !== -1) {
    const sciMatch = workingStr.match(/^([+-]?\d*(?:\.\d*)?)[eE]([+-]?\d+)$/);
    if (!sciMatch) {
      return null;
    }

    const mantissaStr = sciMatch[1];
    const exponentStr = sciMatch[2];

    // If cursor is in the exponent
    if (selectionStart > ePos) {
      const expVal = parseInt(exponentStr, 10);
      if (isNaN(expVal)) return null;

      const step = direction * (isShift ? 10 : 1);
      const newExpVal = expVal + step;
      const keepPlus = exponentStr.startsWith('+') && newExpVal >= 0;
      const newExpStr = (keepPlus ? '+' : '') + newExpVal.toString();
      const newValue = workingStr.slice(0, ePos + 1) + newExpStr;

      let newCursorPos: number;
      if (selectionStart === currentStr.length) {
        newCursorPos = newValue.length;
      } else {
        const cursorOffsetFromE = selectionStart - (ePos + 1);
        newCursorPos = Math.min(newValue.length, ePos + 1 + cursorOffsetFromE);
      }
      return {
        newValue: hasComma ? newValue.replace('.', ',') : newValue,
        newCursorPos
      };
    } else {
      // Cursor is in the mantissa
      const mStart = Math.min(selectionStart, ePos);
      const mEnd = Math.min(selectionEnd, ePos);
      const mResult = stepDecimal(mantissaStr, mStart, mEnd, direction, isShift);
      if (!mResult) return null;

      const suffix = workingStr.slice(ePos);
      const newValue = mResult.newValue + suffix;
      return {
        newValue: hasComma ? newValue.replace('.', ',') : newValue,
        newCursorPos: mResult.newCursorPos
      };
    }
  }

  const result = stepDecimal(workingStr, selectionStart, selectionEnd, direction, isShift);
  if (!result) return null;

  return {
    newValue: hasComma ? result.newValue.replace('.', ',') : result.newValue,
    newCursorPos: result.newCursorPos
  };
}

/**
 * Internal decimal stepper handling integers, decimals, signs, and boundary rollover.
 */
function stepDecimal(
  str: string,
  selectionStart: number,
  selectionEnd: number,
  direction: 1 | -1,
  isShift: boolean
): StepNumberResult | null {
  // Validate format: optional sign, digits, optional dot, digits
  if (!/^[+-]?\d*(\.\d*)?$/.test(str) || !/\d/.test(str)) {
    return null;
  }

  const dotIndex = str.indexOf('.');
  let targetIdx = -1;

  if (selectionStart < selectionEnd) {
    if (selectionEnd - selectionStart === 1 && /\d/.test(str[selectionStart])) {
      targetIdx = selectionStart;
    } else if (selectionStart === 0 && selectionEnd === str.length) {
      // Entire number selected -> step ones place by default
      if (dotIndex > 0) {
        targetIdx = dotIndex - 1;
      } else if (dotIndex === 0) {
        targetIdx = str.length > 1 ? 1 : 0;
      } else {
        targetIdx = str.length - 1;
      }
    } else {
      // Multi-char sub-selection: find rightmost digit
      for (let i = selectionEnd - 1; i >= selectionStart; i--) {
        if (/\d/.test(str[i])) {
          targetIdx = i;
          break;
        }
      }
      if (targetIdx === -1) {
        targetIdx = dotIndex >= 0 ? Math.max(0, dotIndex - 1) : str.length - 1;
      }
    }
  } else {
    // Caret position
    const pos = selectionStart;
    if (pos >= str.length) {
      for (let i = str.length - 1; i >= 0; i--) {
        if (/\d/.test(str[i])) {
          targetIdx = i;
          break;
        }
      }
    } else if (pos === 0) {
      for (let i = 0; i < str.length; i++) {
        if (/\d/.test(str[i])) {
          targetIdx = i;
          break;
        }
      }
    } else {
      const leftChar = str[pos - 1];
      if (/\d/.test(leftChar)) {
        targetIdx = pos - 1;
      } else if (leftChar === '.') {
        // Right after dot, e.g. "123.|45" -> tenths place
        if (pos < str.length && /\d/.test(str[pos])) {
          targetIdx = pos;
        } else {
          // "123.|" -> ones place
          targetIdx = pos - 2 >= 0 && /\d/.test(str[pos - 2]) ? pos - 2 : pos;
        }
      } else if (leftChar === '-' || leftChar === '+') {
        targetIdx = pos < str.length && /\d/.test(str[pos]) ? pos : 1;
      } else {
        for (let i = pos - 1; i >= 0; i--) {
          if (/\d/.test(str[i])) {
            targetIdx = i;
            break;
          }
        }
        if (targetIdx === -1) {
          for (let i = pos; i < str.length; i++) {
            if (/\d/.test(str[i])) {
              targetIdx = i;
              break;
            }
          }
        }
      }
    }
  }

  if (targetIdx === -1 || !/\d/.test(str[targetIdx])) {
    return null;
  }

  // Calculate decimal place power
  let power = 0;
  if (dotIndex >= 0) {
    if (targetIdx < dotIndex) {
      power = dotIndex - 1 - targetIdx;
    } else {
      power = dotIndex - targetIdx; // Negative for tenths (-1), hundredths (-2), etc.
    }
  } else {
    power = str.length - 1 - targetIdx;
  }

  if (isShift) {
    power += 1;
  }

  // Determine required decimal places to format without precision loss
  const originalDecimals = dotIndex >= 0 ? str.length - 1 - dotIndex : 0;
  const stepDecimals = power < 0 ? -power : 0;
  const numDecimals = Math.max(originalDecimals, stepDecimals);

  // BigInt scaled integer arithmetic
  const isNeg = str.startsWith('-');
  const hasPlus = str.startsWith('+');
  const cleanStr = str.replace(/^[+-]/, '');
  const parts = cleanStr.split('.');
  const intPartStr = parts[0] || '0';
  const fracPartStr = (parts[1] || '').padEnd(numDecimals, '0').slice(0, numDecimals);
  const fullIntStr = intPartStr + fracPartStr;
  const bigVal = BigInt(fullIntStr) * (isNeg ? -1n : 1n);

  const stepExp = BigInt(power + numDecimals);
  const bigStep = 10n ** stepExp;
  const newBig = bigVal + (direction === 1 ? bigStep : -bigStep);

  const newIsNeg = newBig < 0n;
  const newAbs = newIsNeg ? -newBig : newBig;
  const newStrDigits = newAbs.toString().padStart(numDecimals + 1, '0');
  const newIntPart = numDecimals > 0 ? newStrDigits.slice(0, -numDecimals) : newStrDigits;
  const newFracPart = numDecimals > 0 ? newStrDigits.slice(-numDecimals) : '';
  let newValue = (newIsNeg ? '-' : (hasPlus ? '+' : '')) + (numDecimals > 0 ? `${newIntPart}.${newFracPart}` : newIntPart);

  if (str.endsWith('.') && numDecimals === 0) {
    newValue += '.';
  }

  // Cursor position preservation
  let newCursorPos: number;
  if (selectionStart === 0) {
    newCursorPos = 0;
  } else if (selectionStart === str.length) {
    newCursorPos = newValue.length;
  } else {
    const hasLeadingSign = newValue.startsWith('-') || newValue.startsWith('+');
    const newDot = newValue.indexOf('.');
    if (dotIndex >= 0 && newDot >= 0) {
      if (selectionStart <= dotIndex) {
        const distBeforeDot = dotIndex - selectionStart;
        newCursorPos = Math.max(hasLeadingSign ? 1 : 0, newDot - distBeforeDot);
      } else {
        const distAfterDot = selectionStart - dotIndex;
        newCursorPos = Math.min(newValue.length, newDot + distAfterDot);
      }
    } else if (dotIndex < 0 && newDot < 0) {
      const distFromEnd = str.length - selectionStart;
      newCursorPos = Math.max(hasLeadingSign ? 1 : 0, newValue.length - distFromEnd);
    } else {
      newCursorPos = Math.min(newValue.length, selectionStart);
    }
  }

  return { newValue, newCursorPos };
}

/**
 * Convenience keydown handler for React HTMLInputElement elements.
 * Call this inside `onKeyDown` of any input where numbers can be typed.
 *
 * @param e - The React KeyboardEvent
 * @param onChange - Callback to update the input value
 * @returns True if the key was handled (ArrowUp or ArrowDown), false otherwise
 */
export function handleNumberStepperKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  onChange: (newValue: string) => void
): boolean {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
    return false;
  }

  const input = e.currentTarget;
  const currentStr = input.value;
  let start = currentStr.length;
  let end = currentStr.length;

  try {
    start = input.selectionStart ?? currentStr.length;
    end = input.selectionEnd ?? currentStr.length;
  } catch {
    // If input type doesn't support selectionStart
  }

  const direction: 1 | -1 = e.key === 'ArrowUp' ? 1 : -1;
  const isShift = e.shiftKey;

  const result = stepNumberAtCursor(currentStr, start, end, direction, isShift);
  if (!result) {
    return false;
  }

  e.preventDefault();
  onChange(result.newValue);

  // Synchronously update the DOM input element to avoid flicker
  input.value = result.newValue;
  try {
    input.setSelectionRange(result.newCursorPos, result.newCursorPos);
  } catch {
    // Unsupported input types
  }

  // Restore cursor after React's re-render cycle completes
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      try {
        input.setSelectionRange(result.newCursorPos, result.newCursorPos);
      } catch {
        // Element may have unmounted or does not support selection
      }
    });
  }

  return true;
}
