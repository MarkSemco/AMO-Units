import React from 'react';
import { CategoryColor } from '../../types/units';

export interface ToggleOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
}

export interface ToggleGroupProps<T extends string | number> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  category?: CategoryColor;
  size?: 'sm' | 'md';
  className?: string;
}

export function ToggleGroup<T extends string | number>({
  options,
  value,
  onChange,
  category = 'optical',
  size = 'md',
  className = ''
}: ToggleGroupProps<T>) {
  const getCategoryColor = () => `var(--color-${category})`;
  const getCategoryBadge = () => `var(--color-${category}-badge)`;

  return (
    <div
      className={`amo-toggle-group ${className}`}
      role="group"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        backgroundColor: 'var(--color-bg-input)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-sm)',
        gap: '4px',
        userSelect: 'none'
      }}
    >
      {options.map(option => {
        const isSelected = String(option.value) === String(value);
        return (
          <button
            key={String(option.value)}
            type="button"
            role="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className="amo-toggle-group-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: size === 'sm' ? '4px 10px' : '6px 14px',
              fontSize: size === 'sm' ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
              fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: isSelected ? getCategoryColor() : 'var(--color-text-secondary)',
              backgroundColor: isSelected ? getCategoryBadge() : 'transparent',
              border: isSelected ? `1.5px solid ${getCategoryColor()}` : '1.5px solid transparent',
              borderRadius: 'var(--radius-xs)',
              boxShadow: isSelected ? `0 0 0 1px ${getCategoryColor()}` : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {option.icon && (
              <span style={{ color: isSelected ? getCategoryColor() : 'inherit' }}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.badge && (
              <span
                style={{
                  fontSize: 'var(--font-size-2xs)',
                  padding: '1px 4px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--color-bg-base)',
                  color: isSelected ? getCategoryColor() : 'var(--color-text-muted)'
                }}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
