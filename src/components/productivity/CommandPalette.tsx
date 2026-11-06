import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Lightbulb, Zap, Radio, Sigma, Atom, BookOpen, ALargeSmall, Undo2, Redo2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { usePresets } from '../../context/PresetContext';
import { useUndoRedo } from '../../context/UndoRedoContext';

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTab,
    setPrecisionDigits,
    setTextScale
  } = useSettings();

  const { allPresets, applyPreset } = usePresets();
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } = useUndoRedo();

  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Build searchable items
  const items: PaletteItem[] = [
    // Global Undo / Redo Actions
    ...(canUndo
      ? [
          {
            id: 'action-undo',
            title: `Undo: ${undoDescription || 'last action'}`,
            subtitle: 'Undo recent change (⌘Z / Ctrl+Z)',
            category: 'Actions',
            icon: <Undo2 size={16} color="var(--color-primary-accent)" />,
            action: () => {
              undo();
              setCommandPaletteOpen(false);
            }
          }
        ]
      : []),
    ...(canRedo
      ? [
          {
            id: 'action-redo',
            title: `Redo: ${redoDescription || 'last undone action'}`,
            subtitle: 'Redo previously undone change (⇧⌘Z / Ctrl+Y)',
            category: 'Actions',
            icon: <Redo2 size={16} color="var(--color-primary-accent)" />,
            action: () => {
              redo();
              setCommandPaletteOpen(false);
            }
          }
        ]
      : []),

    // Tabs
    {
      id: 'tab-optical',
      title: 'Optical & Energy Converter',
      subtitle: 'Wavelength, frequency, energy, wavenumber, and temperature',
      category: 'Calculators',
      icon: <Lightbulb size={16} color="var(--color-optical)" />,
      action: () => {
        setActiveTab('optical');
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'tab-laser',
      title: 'Laser Beam & ABCD Propagation',
      subtitle: 'Gaussian beam waist, ABCD matrices, intensity, Rayleigh range, and polarization bench',
      category: 'Calculators',
      icon: <Zap size={16} color="var(--color-laser)" />,
      action: () => {
        setActiveTab('laser');
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'tab-laser-polarization',
      title: 'Laser Polarization & Waveplates',
      subtitle: 'Jones vectors, Stokes parameters, waveplates, and Poincaré sphere',
      category: 'Calculators',
      icon: <Zap size={16} color="var(--color-laser)" />,
      action: () => {
        setActiveTab('laser');
        window.location.hash = '#laser-polarization';
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'tab-rf',
      title: 'RF Electronics & VSWR',
      subtitle: 'dBm, Watts, Vrms, Vpp, attenuation, return loss, and mismatch loss',
      category: 'Calculators',
      icon: <Radio size={16} color="var(--color-rf)" />,
      action: () => {
        setActiveTab('rf');
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'tab-error-prop',
      title: 'Error Propagation Equation Generator',
      subtitle: 'Symbolic partial derivatives and numerical uncertainty evaluation',
      category: 'Calculators',
      icon: <Sigma size={16} color="var(--color-error-prop)" />,
      action: () => {
        setActiveTab('error-propagation');
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'tab-formulas',
      title: 'Formulas and Presets',
      subtitle: 'CODATA 2022 constants, equations catalog, and atomic/molecular transition presets',
      category: 'Calculators',
      icon: <BookOpen size={16} color="var(--color-optical)" />,
      action: () => {
        setActiveTab('formulas');
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'tab-presets',
      title: 'Atomic & Molecular Presets',
      subtitle: 'AlCl, CaF, AlF, Rb-87, Cs-133, Sr-88/87 (in Formulas and Presets)',
      category: 'Calculators',
      icon: <Atom size={16} color="var(--color-preset)" />,
      action: () => {
        setActiveTab('presets');
        setCommandPaletteOpen(false);
      }
    },

    // Actions
    {
      id: 'action-text-85',
      title: 'Set Text Size to 85% (Compact)',
      subtitle: 'Compact density scale factor (0.85x)',
      category: 'Settings',
      icon: <ALargeSmall size={16} />,
      action: () => {
        setTextScale(0.85);
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'action-text-100',
      title: 'Reset Text Size to 100% (Standard)',
      subtitle: 'Standard readability scale factor (1.0x)',
      category: 'Settings',
      icon: <ALargeSmall size={16} />,
      action: () => {
        setTextScale(1.0);
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'action-text-115',
      title: 'Set Text Size to 115% (Relaxed)',
      subtitle: 'Relaxed readability scale factor (1.15x)',
      category: 'Settings',
      icon: <ALargeSmall size={16} />,
      action: () => {
        setTextScale(1.15);
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'action-text-130',
      title: 'Set Text Size to 130% (Large)',
      subtitle: 'Large high-legibility scale factor (1.3x)',
      category: 'Settings',
      icon: <ALargeSmall size={16} />,
      action: () => {
        setTextScale(1.3);
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'action-prec-6',
      title: 'Set Precision to 6 Significant Digits (Default)',
      subtitle: 'Standard laboratory metrology precision',
      category: 'Settings',
      icon: <Lightbulb size={16} />,
      action: () => {
        setPrecisionDigits(6);
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'action-prec-8',
      title: 'Set Precision to 8 Significant Digits',
      subtitle: 'High-precision wavemeter readout',
      category: 'Settings',
      icon: <Lightbulb size={16} />,
      action: () => {
        setPrecisionDigits(8);
        setCommandPaletteOpen(false);
      }
    },

    // Dynamic presets
    ...allPresets.map(p => ({
      id: `preset-${p.id}`,
      title: `Load ${p.name} (${p.wavelengthNm} nm)`,
      subtitle: `${p.transitionName || 'Main'} · ${p.citation || p.laboratory || p.category}`,
      category: 'Atomic Presets',
      icon: <Atom size={16} color="var(--color-preset)" />,
      action: () => {
        applyPreset(p);
        setActiveTab('optical');
        setCommandPaletteOpen(false);
      }
    }))
  ];

  // Filter items by query
  const filteredItems = items.filter(
    item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        paddingLeft: 'var(--space-md)',
        paddingRight: 'var(--space-md)',
        zIndex: 9990,
        animation: 'fadeIn 150ms ease-out'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) setCommandPaletteOpen(false);
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
          animation: 'slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-surface-elevated)'
          }}
        >
          <Search size={18} color="var(--color-optical)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search calculators, presets, or commands (e.g. 'AlCl', 'VSWR', 'Error Prop')..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-primary)',
              backgroundColor: 'transparent'
            }}
          />
          <kbd
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          style={{
            overflowY: 'auto',
            padding: '6px'
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              No matching tools or presets found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--color-bg-surface-elevated)' : 'transparent',
                    border: isSelected ? '1px solid var(--color-optical)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-bg-input)',
                        display: 'flex'
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--color-text-muted)',
                        backgroundColor: 'var(--color-bg-base)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)'
                      }}
                    >
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight size={14} color="var(--color-optical)" />}
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
