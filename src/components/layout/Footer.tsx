import React from 'react';
import { Coffee, MessageSquare, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)',
        padding: 'var(--space-md) 0',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-muted)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <a
            href="https://ko-fi.com/marksdev"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee on Ko-fi"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FF5E5B')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            <Coffee size={14} color="#FF5E5B" />
            <span>Buy me a coffee</span>
          </a>

          <span style={{ color: 'var(--color-border-subtle)', userSelect: 'none' }}>•</span>

          <a
            href="https://tally.so/r/e5D6ol"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Give feedback or request features"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-optical, #38BDF8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            <MessageSquare size={14} color="var(--color-optical, #38BDF8)" />
            <span>Feedback</span>
          </a>

          <span style={{ color: 'var(--color-border-subtle)', userSelect: 'none' }}>•</span>

          <a
            href="https://github.com/MarkSemco/AMO-Units"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source repository on GitHub"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            <Github size={14} />
            <span>GitHub</span>
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Shortcuts: <kbd>⌘K</kbd> Palette · <kbd>⌘H</kbd> History · <kbd>1-7</kbd> Tabs</span>
        </div>
      </div>
    </footer>
  );
};
