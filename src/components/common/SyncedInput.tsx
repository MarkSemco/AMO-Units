import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { CategoryColor } from '../../types/units';
import { useClipboard } from '../../hooks/useClipboard';
import { useSettings } from '../../context/SettingsContext';
import { handleNumberStepperKeyDown } from '../../core/number-stepper';

const getCompactUnitDisplay = (unitCode: string): string => {
  switch (unitCode) {
    case 'angstrom':
      return 'Å';
    case 'um':
      return 'µm';
    case 'ueV':
      return 'µeV';
    case 'uW':
      return 'µW';
    case 'uT':
      return 'µT';
    case 'uK':
      return 'µK';
    case 'uV':
      return 'µV';
    case 'uA':
      return 'µA';
    case 'dBuV':
      return 'dBµV';
    case 'cm^-1':
      return 'cm⁻¹';
    case 'm^-1':
      return 'm⁻¹';
    case 'Eh':
      return 'E_h';
    case 'Debye':
      return 'D';
    default:
      return unitCode;
  }
};

export interface SyncedInputProps {
  id: string;
  label: string;
  symbol?: string;
  value: string | number;
  unit: string;
  category: CategoryColor;
  onChange: (value: string) => void;
  onCommit?: (prevValue: string, nextValue: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  description?: string;
  unitOptions?: Array<{ value: string; label: string }>;
  onUnitChange?: (newUnit: string) => void;
  placeholder?: string;
}

export const SyncedInput: React.FC<SyncedInputProps> = ({
  id,
  label,
  symbol,
  value,
  unit,
  category,
  onChange,
  onCommit,
  onFocus,
  onBlur,
  isActive = false,
  disabled = false,
  description,
  unitOptions,
  onUnitChange,
  placeholder = '0.0'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // Local state to store draft user typing so trailing decimals and partial scientific notation ('1e-') are preserved
  const [draftValue, setDraftValue] = useState<string>(String(value ?? ''));
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isSelectFocused, setIsSelectFocused] = useState<boolean>(false);
  const initialValueOnFocusRef = useRef<string>(String(value ?? ''));
  const lastRevertedDraftRef = useRef<string | null>(null);
  const stepperCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { copyToClipboard, hasCopied } = useClipboard();
  const { copyFormatWithUnits } = useSettings();

  // Only update draft value when the field is NOT being actively edited by the user
  useEffect(() => {
    if (!isFocused && !isActive) {
      setDraftValue(String(value ?? ''));
      initialValueOnFocusRef.current = String(value ?? '');
      lastRevertedDraftRef.current = null;
    }
  }, [value, isFocused, isActive]);

  useEffect(() => {
    return () => {
      if (stepperCommitTimerRef.current) {
        clearTimeout(stepperCommitTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    lastRevertedDraftRef.current = null;
    const val = e.target.value;
    setDraftValue(val);
    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      return;
    }

    const isCmdOrCtrl = e.metaKey || e.ctrlKey;

    // In-input Undo: Cmd+Z or Ctrl+Z (without Shift)
    if (isCmdOrCtrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      if (draftValue !== initialValueOnFocusRef.current) {
        e.preventDefault();
        e.stopPropagation();
        lastRevertedDraftRef.current = draftValue;
        const prev = initialValueOnFocusRef.current;
        setDraftValue(prev);
        onChange(prev);
        return;
      }
      // If draft matches initial focus value, allow bubbling to window for global undo
    }

    // In-input Redo: Shift+Cmd+Z, Ctrl+Shift+Z, Cmd+Y, or Ctrl+Y
    if (
      (isCmdOrCtrl && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
      (isCmdOrCtrl && (e.key === 'y' || e.key === 'Y'))
    ) {
      if (lastRevertedDraftRef.current !== null && draftValue === initialValueOnFocusRef.current) {
        e.preventDefault();
        e.stopPropagation();
        const restored = lastRevertedDraftRef.current;
        lastRevertedDraftRef.current = null;
        setDraftValue(restored);
        onChange(restored);
        return;
      }
      // If no local reverted draft, allow bubbling to window for global redo
    }

    handleNumberStepperKeyDown(e, newVal => {
      lastRevertedDraftRef.current = null;
      setDraftValue(newVal);
      onChange(newVal);

      if (stepperCommitTimerRef.current) {
        clearTimeout(stepperCommitTimerRef.current);
      }
      stepperCommitTimerRef.current = setTimeout(() => {
        if (onCommit && initialValueOnFocusRef.current !== newVal) {
          onCommit(initialValueOnFocusRef.current, newVal);
          initialValueOnFocusRef.current = newVal;
        }
      }, 700);
    });
  };

  const handleFocus = () => {
    initialValueOnFocusRef.current = String(value ?? '');
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    lastRevertedDraftRef.current = null;
    if (stepperCommitTimerRef.current) {
      clearTimeout(stepperCommitTimerRef.current);
    }
    setIsFocused(false);
    if (onBlur) onBlur();

    if (onCommit && initialValueOnFocusRef.current !== draftValue) {
      onCommit(initialValueOnFocusRef.current, draftValue);
      initialValueOnFocusRef.current = draftValue;
    }
  };

  const handleCopy = () => {
    const compactUnit = getCompactUnitDisplay(unit);
    const textToCopy = copyFormatWithUnits && compactUnit ? `${draftValue} ${compactUnit}` : draftValue;
    copyToClipboard(textToCopy, `Copied ${label}: ${textToCopy}`);
  };

  const categoryColor = `var(--color-${category})`;
  const categoryBadge = `var(--color-${category}-badge)`;

  // Match option value robustly if caller passes either canonical code ('um') or compact symbol ('µm')
  const matchedSelectValue = unitOptions?.find(
    opt => opt.value === unit || getCompactUnitDisplay(opt.value) === unit
  )?.value ?? unit;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '100%',
        minWidth: 0
      }}
    >
      {/* Top Header: Label & Symbol */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)'
        }}
      >
        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
          {label}
        </span>
        {symbol && (
          <span
            className="font-mono"
            style={{
              color: categoryColor,
              fontWeight: 'var(--font-weight-semibold)'
            }}
          >
            {symbol}
          </span>
        )}
      </div>

      {/* Main Input Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isFocused ? 'var(--color-bg-input-hover)' : 'var(--color-bg-input)',
          border: `1px solid ${isFocused ? categoryColor : 'var(--color-border-subtle)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: isFocused ? `0 0 0 2px ${categoryBadge}` : 'var(--shadow-sm)',
          transition: 'all var(--transition-fast)',
          overflow: 'hidden',
          padding: '3px 8px 3px 10px',
          width: '100%',
          minWidth: 0
        }}
      >
        <input
          ref={inputRef}
          id={id}
          data-synced-input="true"
          type="text"
          inputMode="decimal"
          value={draftValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          title={draftValue}
          aria-label={`${label}${unit ? ` in ${unit}` : ''}`}
          className="font-mono"
          style={{
            flex: 1,
            width: '100%',
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-primary)',
            padding: '5px 0',
            minWidth: 0,
            outline: 'none',
            background: 'transparent'
          }}
        />

        {/* Trailing Controls: Compact Unit Pill + Copy button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px', flexShrink: 0 }}>
          {unitOptions && unitOptions.length > 1 && onUnitChange ? (
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              {/* Compact Unit Pill Button */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  padding: '3px 7px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: categoryBadge,
                  color: categoryColor,
                  border: `1px solid ${categoryColor}`,
                  boxShadow: isSelectFocused ? `0 0 0 2px ${categoryColor}` : 'none',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  transition: 'box-shadow var(--transition-fast)'
                }}
              >
                <span className="font-mono">{getCompactUnitDisplay(unit)}</span>
                <ChevronDown size={12} style={{ opacity: 0.8 }} />
              </div>

              {/* Native Select Overlay with Full Names */}
              <select
                value={matchedSelectValue}
                onChange={e => onUnitChange(e.target.value)}
                onFocus={() => setIsSelectFocused(true)}
                onBlur={() => setIsSelectFocused(false)}
                aria-label={`Select unit for ${label}`}
                title="Change unit"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {unitOptions.map(opt => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px'
                    }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : unit ? (
            <span
              className="font-mono"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                padding: '3px 7px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: categoryBadge,
                color: categoryColor,
                border: `1px solid ${categoryColor}`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                lineHeight: 1.2
              }}
            >
              {getCompactUnitDisplay(unit)}
            </span>
          ) : null}

          <button
            type="button"
            onClick={handleCopy}
            title={hasCopied ? 'Copied!' : 'Copy to clipboard'}
            aria-label={`Copy ${label} value`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              borderRadius: 'var(--radius-xs)',
              color: hasCopied ? 'var(--color-success)' : 'var(--color-text-muted)',
              transition: 'all var(--transition-fast)',
              flexShrink: 0
            }}
          >
            {hasCopied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      {description && (
        <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
          {description}
        </span>
      )}
    </div>
  );
};
