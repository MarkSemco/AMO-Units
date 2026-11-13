import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { stepNumberAtCursor } from '../../core/number-stepper';

export const MIN_SIG_FIGS = 1;
export const MAX_SIG_FIGS = 14;

export interface SigFigsInputProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SigFigsInput: React.FC<SigFigsInputProps> = ({ className, style }) => {
  const { precisionDigits, setPrecisionDigits } = useSettings();
  const [draftValue, setDraftValue] = useState<string>(String(precisionDigits));
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const initialValueOnFocusRef = useRef<string>(String(precisionDigits));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft value when external precisionDigits changes while not actively editing/focused
  useEffect(() => {
    if (!isFocused) {
      setDraftValue(String(precisionDigits));
      initialValueOnFocusRef.current = String(precisionDigits);
    }
  }, [precisionDigits, isFocused]);

  const commitValue = (valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (isNaN(parsed)) {
      setDraftValue(String(precisionDigits));
    } else {
      const clamped = Math.max(MIN_SIG_FIGS, Math.min(MAX_SIG_FIGS, parsed));
      setDraftValue(String(clamped));
      setPrecisionDigits(clamped);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow typing digits
    const raw = e.target.value;
    const digitsOnly = raw.replace(/[^\d]/g, '');
    setDraftValue(digitsOnly);

    if (digitsOnly.length > 0) {
      const parsed = parseInt(digitsOnly, 10);
      if (!isNaN(parsed) && parsed >= MIN_SIG_FIGS && parsed <= MAX_SIG_FIGS) {
        setPrecisionDigits(parsed);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    initialValueOnFocusRef.current = String(precisionDigits);
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitValue(draftValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      return;
    }

    if (e.key === 'Escape') {
      const initial = initialValueOnFocusRef.current;
      setDraftValue(initial);
      const parsed = parseInt(initial, 10);
      if (!isNaN(parsed)) {
        setPrecisionDigits(parsed);
      }
      e.currentTarget.blur();
      return;
    }

    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    // In-input Undo: Cmd+Z or Ctrl+Z
    if (isCmdOrCtrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      if (draftValue !== initialValueOnFocusRef.current) {
        e.preventDefault();
        e.stopPropagation();
        setDraftValue(initialValueOnFocusRef.current);
        const parsed = parseInt(initialValueOnFocusRef.current, 10);
        if (!isNaN(parsed)) {
          setPrecisionDigits(parsed);
        }
        return;
      }
    }

    // Step number at cursor on ArrowUp / ArrowDown
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const input = inputRef.current;
      if (!input) return;

      const currentStr = input.value || String(precisionDigits);
      let start = currentStr.length;
      let end = currentStr.length;
      try {
        start = input.selectionStart ?? currentStr.length;
        end = input.selectionEnd ?? currentStr.length;
      } catch {
        // Selection range fallback
      }

      const direction: 1 | -1 = e.key === 'ArrowUp' ? 1 : -1;
      const isShift = e.shiftKey;

      const result = stepNumberAtCursor(currentStr, start, end, direction, isShift);
      if (!result) return;

      e.preventDefault();

      const parsed = parseInt(result.newValue, 10);
      if (!isNaN(parsed)) {
        const clamped = Math.max(MIN_SIG_FIGS, Math.min(MAX_SIG_FIGS, parsed));
        const clampedStr = String(clamped);

        // Calculate cursor position after clamping
        const finalCursorPos = clamped === parsed
          ? result.newCursorPos
          : Math.min(clampedStr.length, result.newCursorPos);

        setDraftValue(clampedStr);
        setPrecisionDigits(clamped);

        // Synchronously update DOM element to avoid flicker
        input.value = clampedStr;
        try {
          input.setSelectionRange(finalCursorPos, finalCursorPos);
        } catch {}

        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => {
            try {
              input.setSelectionRange(finalCursorPos, finalCursorPos);
            } catch {}
          });
        }
      }
    }
  };

  const handleChevronStep = (direction: 1 | -1, e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevent input blur or text deselection
    const isShift = e?.shiftKey ?? false;
    const step = (isShift ? 5 : 1) * direction;

    const currentInt = parseInt(draftValue, 10);
    const baseVal = isNaN(currentInt) ? precisionDigits : currentInt;
    const nextVal = Math.max(MIN_SIG_FIGS, Math.min(MAX_SIG_FIGS, baseVal + step));
    const nextStr = String(nextVal);

    setDraftValue(nextStr);
    setPrecisionDigits(nextVal);

    if (inputRef.current) {
      inputRef.current.value = nextStr;
      if (document.activeElement === inputRef.current) {
        try {
          const pos = nextStr.length;
          inputRef.current.setSelectionRange(pos, pos);
        } catch {}
      }
    }
  };

  return (
    <div
      className={className}
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 4px 2px 8px',
        backgroundColor: isFocused ? 'var(--color-bg-input-hover)' : 'var(--color-bg-input)',
        border: `1px solid ${isFocused ? 'var(--color-optical)' : 'var(--color-border-subtle)'}`,
        boxShadow: isFocused ? '0 0 0 2px var(--color-optical-badge)' : 'none',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-secondary)',
        height: '32px',
        boxSizing: 'border-box',
        transition: 'all var(--transition-fast)',
        cursor: 'text',
        ...style
      }}
    >
      <span
        className="header-label-hide"
        style={{
          color: 'var(--color-text-muted)',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          fontSize: 'var(--font-size-xs)'
        }}
      >
        Sig Figs:
      </span>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={draftValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label="Significant digits precision"
        title="Significant figures (type number or use Up/Down arrow keys at cursor to step)"
        className="font-mono"
        style={{
          width: '24px',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          textAlign: 'center',
          padding: 0,
          margin: 0,
          cursor: 'text'
        }}
      />

      {/* Up / Down Chevron Steppers */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '24px',
          borderLeft: '1px solid var(--color-border-subtle)',
          paddingLeft: '3px',
          marginLeft: '2px'
        }}
      >
        <button
          type="button"
          aria-label="Increase significant figures"
          title="Increase sig figs (Up arrow)"
          disabled={precisionDigits >= MAX_SIG_FIGS}
          onMouseDown={e => e.preventDefault()}
          onClick={e => handleChevronStep(1, e)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: '0 2px',
            height: '11px',
            color: precisionDigits >= MAX_SIG_FIGS ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            opacity: precisionDigits >= MAX_SIG_FIGS ? 0.35 : 1,
            cursor: precisionDigits >= MAX_SIG_FIGS ? 'not-allowed' : 'pointer',
            borderRadius: '2px',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => {
            if (precisionDigits < MAX_SIG_FIGS) {
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={e => {
            if (precisionDigits < MAX_SIG_FIGS) {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          <ChevronUp size={11} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          aria-label="Decrease significant figures"
          title="Decrease sig figs (Down arrow)"
          disabled={precisionDigits <= MIN_SIG_FIGS}
          onMouseDown={e => e.preventDefault()}
          onClick={e => handleChevronStep(-1, e)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: '0 2px',
            height: '11px',
            color: precisionDigits <= MIN_SIG_FIGS ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            opacity: precisionDigits <= MIN_SIG_FIGS ? 0.35 : 1,
            cursor: precisionDigits <= MIN_SIG_FIGS ? 'not-allowed' : 'pointer',
            borderRadius: '2px',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => {
            if (precisionDigits > MIN_SIG_FIGS) {
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={e => {
            if (precisionDigits > MIN_SIG_FIGS) {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          <ChevronDown size={11} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
