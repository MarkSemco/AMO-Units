import React from 'react';
import { CategoryColor } from '../../types/units';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  category?: CategoryColor;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  category,
  icon,
  children,
  className = '',
  style,
  ...props
}) => {
  const getCategoryColor = () => {
    if (!category) return 'var(--color-text-primary)';
    return `var(--color-${category})`;
  };

  const getBaseStyle = (): React.CSSProperties => {
    const isIconOnly = !children && Boolean(icon);

    const padding =
      isIconOnly
        ? size === 'sm'
          ? '6px'
          : size === 'lg'
          ? '12px'
          : '8px'
        : size === 'sm'
        ? '6px 12px'
        : size === 'lg'
        ? '12px 24px'
        : '8px 16px';

    const fontSize =
      size === 'sm'
        ? 'var(--font-size-xs)'
        : size === 'lg'
        ? 'var(--font-size-base)'
        : 'var(--font-size-sm)';

    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding,
      fontSize,
      fontWeight: 'var(--font-weight-medium)',
      borderRadius: 'var(--radius-sm)',
      transition: 'all var(--transition-fast)',
      border: '1px solid transparent',
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: props.disabled ? 0.5 : 1,
      lineHeight: 1.2,
      ...style
    };

    if (variant === 'primary') {
      return {
        ...base,
        backgroundColor: category ? getCategoryColor() : 'var(--color-optical)',
        color: '#0B0F17',
        fontWeight: 'var(--font-weight-semibold)',
        boxShadow: 'var(--shadow-sm)'
      };
    }

    if (variant === 'outline') {
      return {
        ...base,
        backgroundColor: 'transparent',
        borderColor: category ? getCategoryColor() : 'var(--color-border-strong)',
        color: category ? getCategoryColor() : 'var(--color-text-primary)'
      };
    }

    if (variant === 'ghost') {
      return {
        ...base,
        backgroundColor: 'transparent',
        color: category ? getCategoryColor() : 'var(--color-text-secondary)'
      };
    }

    if (variant === 'icon') {
      return {
        ...base,
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
        borderRadius: 'var(--radius-xs)',
        padding: '6px'
      };
    }

    // Secondary (default)
    return {
      ...base,
      backgroundColor: 'var(--color-bg-surface-elevated)',
      borderColor: 'var(--color-border-subtle)',
      color: 'var(--color-text-primary)'
    };
  };

  return (
    <button
      className={`amo-button ${className}`}
      style={getBaseStyle()}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
