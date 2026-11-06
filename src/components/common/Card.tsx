import React, { useState } from 'react';
import { CategoryColor } from '../../types/units';
import { ChevronDown } from 'lucide-react';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  category?: CategoryColor;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  icon,
  category,
  actions,
  children,
  className = '',
  style,
  collapsible = true,
  defaultCollapsed = false,
  isCollapsed,
  onToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(defaultCollapsed);
  const isSectionCollapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (!collapsible) return;
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(prev => !prev);
    }
  };

  const getCategoryColor = () => {
    if (!category) return 'var(--color-border-subtle)';
    return `var(--color-${category})`;
  };

  const hasHeader = Boolean(title || subtitle || actions || icon);

  return (
    <div
      className={`amo-card glass-panel ${className}`}
      style={{
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderTop: category ? `2px solid ${getCategoryColor()}` : '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: isSectionCollapsed ? 0 : 'var(--space-sm)',
        minWidth: 0,
        ...style
      }}
    >
      {hasHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-sm)',
            borderBottom: isSectionCollapsed ? 'none' : '1px solid var(--color-border-subtle)',
            paddingBottom: isSectionCollapsed ? 0 : 'var(--space-xs)',
            marginBottom: isSectionCollapsed ? 0 : 'var(--space-xs)',
            userSelect: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && (
              <span style={{ color: getCategoryColor(), display: 'flex' }}>
                {icon}
              </span>
            )}
            <div>
              {title && (
                <h3
                  style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    margin: 0
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && !isSectionCollapsed && (
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    margin: 0
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {actions && <div>{actions}</div>}
            {collapsible && (
              <button
                type="button"
                className="card-chevron-button"
                onClick={e => {
                  e.stopPropagation();
                  handleToggle();
                }}
                aria-label={isSectionCollapsed ? 'Expand section' : 'Collapse section'}
                title={isSectionCollapsed ? 'Expand section' : 'Collapse section'}
              >
                <ChevronDown
                  size={18}
                  style={{
                    transform: isSectionCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>
            )}
          </div>
        </div>
      )}
      {!isSectionCollapsed && <div style={{ minWidth: 0, width: '100%' }}>{children}</div>}
    </div>
  );
};
