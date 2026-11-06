import { describe, it, expect } from 'vitest';
import { stepNumberAtCursor } from '../number-stepper';

describe('stepNumberAtCursor', () => {
  describe('Integer Stepping', () => {
    it('increments and decrements ones place when cursor is at the end', () => {
      const up = stepNumberAtCursor('123', 3, 3, 1, false);
      expect(up).toEqual({ newValue: '124', newCursorPos: 3 });

      const down = stepNumberAtCursor('123', 3, 3, -1, false);
      expect(down).toEqual({ newValue: '122', newCursorPos: 3 });
    });

    it('steps tens place when cursor is between tens and ones', () => {
      const up = stepNumberAtCursor('123', 2, 2, 1, false);
      expect(up).toEqual({ newValue: '133', newCursorPos: 2 });

      const down = stepNumberAtCursor('123', 2, 2, -1, false);
      expect(down).toEqual({ newValue: '113', newCursorPos: 2 });
    });

    it('steps hundreds place when cursor is after or before hundreds digit', () => {
      const afterHundreds = stepNumberAtCursor('123', 1, 1, 1, false);
      expect(afterHundreds).toEqual({ newValue: '223', newCursorPos: 1 });

      const beforeHundreds = stepNumberAtCursor('123', 0, 0, 1, false);
      expect(beforeHundreds).toEqual({ newValue: '223', newCursorPos: 0 });
    });

    it('multiplies step by 10 when isShift is true', () => {
      const shifted = stepNumberAtCursor('123', 3, 3, 1, true);
      // ones place * 10 = 10 -> 123 + 10 = 133
      expect(shifted).toEqual({ newValue: '133', newCursorPos: 3 });
    });

    it('handles digit rollover expanding string length', () => {
      const rollover = stepNumberAtCursor('9', 1, 1, 1, false);
      expect(rollover).toEqual({ newValue: '10', newCursorPos: 2 });

      const rolloverTens = stepNumberAtCursor('95', 1, 1, 1, false);
      // 9 in tens place + 10 = 105
      expect(rolloverTens).toEqual({ newValue: '105', newCursorPos: 2 });
    });

    it('handles digit roll-under contracting string length', () => {
      const rollUnder = stepNumberAtCursor('10', 2, 2, -1, false);
      expect(rollUnder).toEqual({ newValue: '9', newCursorPos: 1 });

      const rollUnderTens = stepNumberAtCursor('105', 2, 2, -1, false);
      // 10 in tens place - 10 = 95
      expect(rollUnderTens).toEqual({ newValue: '95', newCursorPos: 1 });
    });
  });

  describe('Decimal Stepping & Precision', () => {
    it('steps tenths place accurately without floating point garbage', () => {
      // '123.4|5' -> pos 5 is after tenths digit '4'
      const up = stepNumberAtCursor('123.45', 5, 5, 1, false);
      expect(up).toEqual({ newValue: '123.55', newCursorPos: 5 });

      const down = stepNumberAtCursor('123.45', 5, 5, -1, false);
      expect(down).toEqual({ newValue: '123.35', newCursorPos: 5 });
    });

    it('steps hundredths place accurately', () => {
      // '123.45|' -> pos 6 is after hundredths digit '5'
      const up = stepNumberAtCursor('123.45', 6, 6, 1, false);
      expect(up).toEqual({ newValue: '123.46', newCursorPos: 6 });

      const down = stepNumberAtCursor('123.45', 6, 6, -1, false);
      expect(down).toEqual({ newValue: '123.44', newCursorPos: 6 });
    });

    it('preserves trailing zeros on decimal rollover (e.g. 0.09 -> 0.10)', () => {
      const rollHundredths = stepNumberAtCursor('0.09', 4, 4, 1, false);
      expect(rollHundredths).toEqual({ newValue: '0.10', newCursorPos: 4 });

      const rollTenths = stepNumberAtCursor('0.99', 4, 4, 1, false);
      expect(rollTenths).toEqual({ newValue: '1.00', newCursorPos: 4 });

      const rollInteger = stepNumberAtCursor('9.99', 4, 4, 1, false);
      // 9.99 + 0.01 = 10.00
      expect(rollInteger).toEqual({ newValue: '10.00', newCursorPos: 5 });
    });

    it('handles decimal roll-under preserving decimal places', () => {
      const downHundredths = stepNumberAtCursor('0.10', 4, 4, -1, false);
      expect(downHundredths).toEqual({ newValue: '0.09', newCursorPos: 4 });

      const downTenths = stepNumberAtCursor('1.00', 4, 4, -1, false);
      expect(downTenths).toEqual({ newValue: '0.99', newCursorPos: 4 });
    });

    it('steps tenths place when cursor is immediately after decimal point', () => {
      // '123.|45' -> pos 4 is right after dot
      const step = stepNumberAtCursor('123.45', 4, 4, 1, false);
      expect(step).toEqual({ newValue: '123.55', newCursorPos: 4 });
    });

    it('steps ones place when cursor is immediately before decimal point', () => {
      // '123|.45' -> pos 3 is right before dot
      const step = stepNumberAtCursor('123.45', 3, 3, 1, false);
      expect(step).toEqual({ newValue: '124.45', newCursorPos: 3 });
    });
  });

  describe('Negative Numbers & Crossing Zero', () => {
    it('steps negative numbers mathematically correctly', () => {
      const up = stepNumberAtCursor('-5', 2, 2, 1, false);
      // -5 + 1 = -4
      expect(up).toEqual({ newValue: '-4', newCursorPos: 2 });

      const down = stepNumberAtCursor('-5', 2, 2, -1, false);
      // -5 - 1 = -6
      expect(down).toEqual({ newValue: '-6', newCursorPos: 2 });
    });

    it('crosses zero from positive to negative and vice versa', () => {
      const crossToNeg = stepNumberAtCursor('0.00', 4, 4, -1, false);
      // 0.00 - 0.01 = -0.01
      expect(crossToNeg).toEqual({ newValue: '-0.01', newCursorPos: 5 });

      const crossToPos = stepNumberAtCursor('-0.01', 5, 5, 1, false);
      // -0.01 + 0.01 = 0.00
      expect(crossToPos).toEqual({ newValue: '0.00', newCursorPos: 4 });
    });
  });

  describe('Selection Ranges', () => {
    it('steps ones place when entire number is selected', () => {
      const allSelected = stepNumberAtCursor('123.45', 0, 6, 1, false);
      expect(allSelected?.newValue).toBe('124.45');
    });

    it('steps selected single digit place', () => {
      // select digit '2' (index 1 to 2) in '123.45'
      const digitSelected = stepNumberAtCursor('123.45', 1, 2, 1, false);
      expect(digitSelected?.newValue).toBe('133.45');
    });
  });

  describe('Scientific Notation', () => {
    it('steps mantissa when cursor is in the mantissa portion', () => {
      // '1.2|3e-4' -> pos 3
      const step = stepNumberAtCursor('1.23e-4', 3, 3, 1, false);
      expect(step).toEqual({ newValue: '1.33e-4', newCursorPos: 3 });
    });

    it('steps exponent when cursor is in the exponent portion', () => {
      // '1.23e-4|' -> pos 7
      const step = stepNumberAtCursor('1.23e-4', 7, 7, 1, false);
      // -4 + 1 = -3
      expect(step).toEqual({ newValue: '1.23e-3', newCursorPos: 7 });
    });

    it('preserves cursor at the end when exponent crosses from positive/zero to negative', () => {
      // '1.23e0|' -> pos 6
      const step = stepNumberAtCursor('1.23e0', 6, 6, -1, false);
      // 0 - 1 = -1 -> '1.23e-1|' (pos 7)
      expect(step).toEqual({ newValue: '1.23e-1', newCursorPos: 7 });
    });
  });

  describe('European Comma Decimal Support', () => {
    it('steps number formatted with comma decimal separator and preserves comma', () => {
      const step = stepNumberAtCursor('123,45', 6, 6, 1, false);
      expect(step).toEqual({ newValue: '123,46', newCursorPos: 6 });

      const stepTenths = stepNumberAtCursor('123,45', 5, 5, -1, false);
      expect(stepTenths).toEqual({ newValue: '123,35', newCursorPos: 5 });
    });
  });

  describe('Sign Preservation & Multi-magnitude Stepping', () => {
    it('preserves leading plus sign when stepped', () => {
      const step = stepNumberAtCursor('+123', 4, 4, 1, false);
      expect(step).toEqual({ newValue: '+124', newCursorPos: 4 });
    });

    it('correctly steps across multiple orders of magnitude with Shift', () => {
      let val = '0.001';
      let pos = 5; // at the end '0.001|'

      // Step by 0.01 with Shift 100 times to reach > 1.000
      for (let i = 0; i < 100; i++) {
        const res = stepNumberAtCursor(val, pos, pos, 1, true);
        expect(res).not.toBeNull();
        val = res!.newValue;
        pos = res!.newCursorPos;
        expect(pos).toBe(val.length);
      }
      expect(val).toBe('1.001');

      // Step by 0.01 with Shift another 9900 times to reach 100.001
      for (let i = 0; i < 990; i++) {
        const res = stepNumberAtCursor(val, pos, pos, 1, true);
        val = res!.newValue;
        pos = res!.newCursorPos;
        expect(pos).toBe(val.length);
      }
      expect(val).toBe('10.901');
    });
  });

  describe('Invalid or Non-numeric Strings', () => {
    it('returns null for empty strings or strings without digits', () => {
      expect(stepNumberAtCursor('', 0, 0, 1, false)).toBeNull();
      expect(stepNumberAtCursor('   ', 0, 0, 1, false)).toBeNull();
      expect(stepNumberAtCursor('abc', 1, 1, 1, false)).toBeNull();
      expect(stepNumberAtCursor('-', 1, 1, 1, false)).toBeNull();
      expect(stepNumberAtCursor('.', 1, 1, 1, false)).toBeNull();
    });
  });
});
