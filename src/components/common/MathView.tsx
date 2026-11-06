import React, { useMemo } from 'react';
import katex from 'katex';

export interface MathViewProps {
  math: string;
  displayMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MathView: React.FC<MathViewProps> = ({
  math,
  displayMode = true,
  className = '',
  style
}) => {
  const html = useMemo(() => {
    if (!math || math.trim() === '') return '';
    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        strict: false
      });
    } catch (err: any) {
      console.warn('KaTeX rendering error:', err);
      return `<span style="color: var(--color-error); font-family: var(--font-mono); font-size: 0.85em;">${math}</span>`;
    }
  }, [math, displayMode]);

  if (!html) return null;

  const Component = displayMode ? 'div' : 'span';

  return (
    <Component
      className={`amo-math-view ${className}`}
      style={{
        overflowX: displayMode ? 'auto' : undefined,
        overflowY: displayMode ? 'hidden' : undefined,
        padding: displayMode ? 'var(--space-xs) 0' : 0,
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
