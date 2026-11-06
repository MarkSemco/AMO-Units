import React, { useEffect } from 'react';
import { X, Trash2, Clock, Copy } from 'lucide-react';
import { useHistory } from '../../context/HistoryContext';
import { useSettings } from '../../context/SettingsContext';
import { useClipboard } from '../../hooks/useClipboard';
import { Button } from '../common/Button';

export const HistoryDrawer: React.FC = () => {
  const { history, clearHistory, deleteEntry } = useHistory();
  const { isHistoryDrawerOpen, setHistoryDrawerOpen } = useSettings();
  const { copyToClipboard } = useClipboard();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHistoryDrawerOpen) {
        setHistoryDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryDrawerOpen, setHistoryDrawerOpen]);

  if (!isHistoryDrawerOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9995,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 150ms ease-out'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) setHistoryDrawerOpen(false);
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          backgroundColor: 'var(--color-bg-surface)',
          borderLeft: '1px solid var(--color-border-strong)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-surface-elevated)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--color-optical)" />
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', margin: 0 }}>
              Conversion History
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {history.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 size={14} />}
                onClick={clearHistory}
                title="Clear all conversion history"
              >
                Clear
              </Button>
            )}
            <button
              onClick={() => setHistoryDrawerOpen(false)}
              aria-label="Close history drawer"
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--color-text-secondary)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* History List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)'
          }}
        >
          {history.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              No conversions recorded yet. Perform conversions in any tab to view history.
            </div>
          ) : (
            history.map(item => {
              const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-bg-surface-elevated)',
                    border: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-xs)',
                          textTransform: 'uppercase',
                          backgroundColor: 'var(--color-bg-base)',
                          color: `var(--color-${item.category})`
                        }}
                      >
                        {item.category}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                        {dateStr}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteEntry(item.id)}
                      title="Remove from history"
                      style={{
                        padding: '2px',
                        color: 'var(--color-text-muted)',
                        borderRadius: 'var(--radius-xs)'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div className="font-mono" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                      {item.sourceValue} {item.sourceUnit}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                      via {item.sourceField}
                    </span>
                  </div>

                  {/* Calculated details */}
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border-subtle)',
                      paddingTop: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      fontSize: 'var(--font-size-2xs)'
                    }}
                  >
                    {Object.entries(item.details).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{k}:</span>
                        <span className="font-mono" style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                    <button
                      onClick={() => {
                        const str = `${item.sourceValue} ${item.sourceUnit}`;
                        copyToClipboard(str, `Copied ${str}`);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border-subtle)'
                      }}
                    >
                      <Copy size={12} />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
