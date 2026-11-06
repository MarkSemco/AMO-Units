import React, { useState, useRef, useEffect } from 'react';
import { Type, ChevronDown, ChevronUp } from 'lucide-react';
import { useSettings, TEXT_SCALE_PRESETS } from '../../context/SettingsContext';

export const TextScaleMenu: React.FC = () => {
  const { textScale, setTextScale } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '310px'
  });

  const currentPercent = Math.round(textScale * 100);

  // Position popover responsively to prevent left-overflow on mobile viewports (<480px)
  useEffect(() => {
    if (isOpen && menuRef.current && typeof window !== 'undefined') {
      const rect = menuRef.current.getBoundingClientRect();
      const menuWidth = Math.min(310, window.innerWidth - 24);
      if (rect.right - menuWidth < 12) {
        const leftShift = 12 - rect.left;
        setPopoverStyle({
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: `${leftShift}px`,
          right: 'auto',
          width: `${menuWidth}px`
        });
      } else {
        setPopoverStyle({
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          left: 'auto',
          width: `${menuWidth}px`
        });
      }
    }
  }, [isOpen]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent | PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleStep = (deltaPercent: number) => {
    const nextPercent = Math.max(80, Math.min(140, currentPercent + deltaPercent));
    setTextScale(nextPercent / 100);
  };

  const sliderPercent = ((currentPercent - 80) / (140 - 80)) * 100;

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* 1. Header Pill Trigger (matching rounded-rect design in reference) */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="UI text scaling menu"
        aria-expanded={isOpen}
        title="Scale UI text size (80% - 140%)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: isOpen ? 'var(--color-bg-surface-elevated)' : 'var(--color-bg-input)',
          border: isOpen ? '1.5px solid var(--color-optical)' : '1px solid var(--color-border-subtle)',
          borderRadius: '12px',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 1px var(--color-optical-glow)' : 'none',
          transition: 'all var(--transition-fast)'
        }}
      >
        <Type size={14} style={{ color: 'var(--color-optical)', flexShrink: 0 }} />
        <span className="font-mono" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
          {currentPercent}%
        </span>
        {isOpen ? (
          <ChevronUp size={13} style={{ color: 'var(--color-text-muted)' }} />
        ) : (
          <ChevronDown size={13} style={{ color: 'var(--color-text-muted)' }} />
        )}
      </button>

      {/* 2. Popover Dropdown Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="UI text scaling settings"
          style={{
            ...popoverStyle,
            backgroundColor: 'var(--color-bg-surface)',
            border: '1.5px solid var(--color-border-subtle)',
            borderRadius: '16px',
            boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 4px 8px -2px rgba(0, 0, 0, 0.4)',
            padding: '18px 20px 20px 20px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 150ms ease-out'
          }}
        >
          {/* Header Row: Title & Active Percentage */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.01em'
              }}
            >
              UI Text Scaling
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: '1.15rem',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-optical)'
              }}
            >
              {currentPercent}%
            </span>
          </div>

          {/* Stepper / Continuous Slider Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => handleStep(-5)}
              title="Decrease text size (A-)"
              aria-label="Decrease text size"
              disabled={currentPercent <= 80}
              style={{
                width: '40px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
                cursor: currentPercent <= 80 ? 'not-allowed' : 'pointer',
                opacity: currentPercent <= 80 ? 0.35 : 1,
                flexShrink: 0,
                transition: 'all var(--transition-fast)'
              }}
            >
              A-
            </button>

            {/* Slider with rounded white pill/capsule thumb */}
            <input
              type="range"
              min="80"
              max="140"
              step="1"
              value={currentPercent}
              onChange={e => setTextScale(Number(e.target.value) / 100)}
              aria-label="UI text size scaling slider"
              className="text-resizer-slider"
              style={{
                flex: 1,
                height: '10px',
                background: `linear-gradient(to right, var(--color-optical) 0%, var(--color-optical) ${sliderPercent}%, #2C3342 ${sliderPercent}%, #2C3342 100%)`,
                borderRadius: '9999px',
                cursor: 'pointer'
              }}
            />

            <button
              onClick={() => handleStep(5)}
              title="Increase text size (A+)"
              aria-label="Increase text size"
              disabled={currentPercent >= 140}
              style={{
                width: '40px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
                cursor: currentPercent >= 140 ? 'not-allowed' : 'pointer',
                opacity: currentPercent >= 140 ? 0.35 : 1,
                flexShrink: 0,
                transition: 'all var(--transition-fast)'
              }}
            >
              A+
            </button>
          </div>

          {/* 2x2 Preset Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}
          >
            {TEXT_SCALE_PRESETS.map(preset => {
              const isSelected = Math.abs(currentPercent - Math.round(preset.value * 100)) < 2;
              return (
                <button
                  key={preset.value}
                  onClick={() => setTextScale(preset.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: isSelected ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                    color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.05)' : 'var(--color-bg-input)',
                    border: isSelected ? '1.5px solid var(--color-optical)' : '1px solid var(--color-border-subtle)',
                    boxShadow: isSelected ? '0 0 0 1px rgba(56, 189, 248, 0.25)' : 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'center'
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
