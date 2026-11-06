import React from 'react';
import { Search, History, Undo2, Redo2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useUndoRedo } from '../../context/UndoRedoContext';
import { TextScaleMenu } from './TextScaleMenu';

export const Header: React.FC = () => {
  const {
    precisionDigits,
    setPrecisionDigits,
    setCommandPaletteOpen,
    setHistoryDrawerOpen
  } = useSettings();
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } = useUndoRedo();

  return (
    <header
      style={{
        borderBottom: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
          gap: 'var(--space-md)'
        }}
      >
        {/* Brand & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/icons/logo.svg"
            alt="AMO Units Logo"
            style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  letterSpacing: '0.02em',
                  margin: 0
                }}
              >
                AMO Units
              </h1>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-2xs)',
                color: 'var(--color-text-muted)',
                margin: 0
              }}
            >
              by Mark Semco
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Undo / Redo Button Group */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden'
            }}
          >
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              title={undoDescription ? `Undo: ${undoDescription} (⌘Z / Ctrl+Z)` : 'Undo (⌘Z / Ctrl+Z)'}
              aria-label="Undo last action"
              style={{
                padding: '7px 9px',
                color: canUndo ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                borderRight: '1px solid var(--color-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                opacity: canUndo ? 1 : 0.4,
                transition: 'all var(--transition-fast)'
              }}
            >
              <Undo2 size={15} />
            </button>
            <button
              onClick={() => redo()}
              disabled={!canRedo}
              title={redoDescription ? `Redo: ${redoDescription} (⇧⌘Z / Ctrl+Y)` : 'Redo (⇧⌘Z / Ctrl+Y)'}
              aria-label="Redo last undone action"
              style={{
                padding: '7px 9px',
                color: canRedo ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canRedo ? 'pointer' : 'not-allowed',
                opacity: canRedo ? 1 : 0.4,
                transition: 'all var(--transition-fast)'
              }}
            >
              <Redo2 size={15} />
            </button>
          </div>

          {/* Quick Search / Cmd+K Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            title="Open Command Palette (Cmd+K / Ctrl+K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-xs)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Search size={14} />
            <span style={{ display: 'none', minWidth: '60px', textAlign: 'left' }} className="search-label">Search...</span>
            <kbd
              style={{
                backgroundColor: 'var(--color-bg-surface-elevated)',
                padding: '2px 5px',
                borderRadius: '3px',
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* UI Text Size Scaling Pill & Popover Menu */}
          <TextScaleMenu />

          {/* Precision Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <span className="header-label-hide" style={{ color: 'var(--color-text-muted)' }}>Sig Figs:</span>
            <select
              value={precisionDigits}
              onChange={e => setPrecisionDigits(Number(e.target.value))}
              aria-label="Significant digits precision"
              className="font-mono"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              {[4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n} style={{ backgroundColor: '#131B2E', color: '#F8FAFC' }}>
                  {n} digits
                </option>
              ))}
            </select>
          </div>

          {/* History Drawer Trigger */}
          <button
            onClick={() => setHistoryDrawerOpen(true)}
            title="Conversion History (Cmd+H)"
            aria-label="Open conversion history"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }}
          >
            <History size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

