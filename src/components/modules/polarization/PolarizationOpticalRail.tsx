import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { handleNumberStepperKeyDown } from '../../../core/number-stepper';
import {
  PolarizationOptic,
  OpticType,
  StageResult,
  OPTICAL_TRAIN_PRESETS
} from '../../../core/polarization';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripHorizontal,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles
} from 'lucide-react';

export interface PolarizationOpticalRailProps {
  optics: PolarizationOptic[];
  onChangeOptics: (newOptics: PolarizationOptic[]) => void;
  onCommitOptics?: (prevOptics: PolarizationOptic[], nextOptics: PolarizationOptic[], desc: string) => void;
  stages: StageResult[];
  selectedStageIndex: number;
  onSelectStage: (stageIndex: number) => void;
}

export const PolarizationOpticalRail: React.FC<PolarizationOpticalRailProps> = ({
  optics,
  onChangeOptics,
  onCommitOptics,
  stages,
  selectedStageIndex,
  onSelectStage
}) => {
  // Reordering drag state (bottom grabbers)
  const [draggedOpticIndex, setDraggedOpticIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // Rotational drag state (side grabbers) with smooth delta tracking
  const [activeRotatingOpticId, setActiveRotatingOpticId] = useState<string | null>(null);
  const rotatingStateRef = useRef<{
    center: { x: number; y: number };
    startMouseAngle: number;
    startOpticAngle: number;
  } | null>(null);
  const startRotatingOpticsRef = useRef<PolarizationOptic[] | null>(null);
  const focusOpticsRef = useRef<PolarizationOptic[] | null>(null);

  // New element dropdown toggle
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [isPresetsMenuOpen, setIsPresetsMenuOpen] = useState<boolean>(false);

  // Draft string state for text boxes so users can clear/backspace all digits without snapping
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const [focusedInputKey, setFocusedInputKey] = useState<string | null>(null);

  const getInputValue = (key: string, fallback: string | number) => {
    return draftInputs[key] ?? String(fallback);
  };

  const handleInputChange = (key: string, text: string, onValid: (num: number) => void) => {
    setDraftInputs(prev => ({ ...prev, [key]: text }));
    const val = parseFloat(text);
    if (!Number.isNaN(val)) {
      onValid(val);
    }
  };

  const handleInputBlur = (key: string, onValid?: (num: number) => void, emptyDefault?: number) => {
    const text = draftInputs[key];
    if (text !== undefined) {
      if (text.trim() === '' && emptyDefault !== undefined) {
        if (onValid) onValid(emptyDefault);
      } else {
        const val = parseFloat(text);
        if (!Number.isNaN(val) && onValid) {
          onValid(val);
        }
      }
      setDraftInputs(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleStepperChange = (e: React.KeyboardEvent<HTMLInputElement>, key: string, onValid: (num: number) => void) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
      return;
    }
    handleNumberStepperKeyDown(e, newVal => {
      const val = parseFloat(newVal);
      if (!Number.isNaN(val)) {
        setDraftInputs(prev => ({ ...prev, [key]: newVal }));
        onValid(val);
      }
    });
  };

  // Global mousemove, touchmove, mouseup & touchend listeners for smooth continuous rotation
  useEffect(() => {
    if (!activeRotatingOpticId) return;

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!rotatingStateRef.current) return;
      const { center, startMouseAngle, startOpticAngle } = rotatingStateRef.current;
      // Cartesian angle where dx = clientX - center.x and dy = center.y - clientY (screen y is inverted)
      const currentMouseAngle = (Math.atan2(center.y - clientY, clientX - center.x) * 180) / Math.PI;
      let delta = currentMouseAngle - startMouseAngle;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      let newAngle = startOpticAngle + delta;
      // Wrap smoothly into [-180, 180]
      while (newAngle > 180) newAngle -= 360;
      while (newAngle <= -180) newAngle += 360;
      newAngle = Math.round(newAngle * 10) / 10;

      onChangeOptics(
        optics.map(o => (o.id === activeRotatingOpticId ? { ...o, angleDeg: newAngle } : o))
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handlePointerEnd = () => {
      setActiveRotatingOpticId(null);
      rotatingStateRef.current = null;
      if (startRotatingOpticsRef.current && onCommitOptics) {
        const prev = startRotatingOpticsRef.current;
        const next = optics;
        const changed = prev.some((p, i) => next[i] && Math.abs(p.angleDeg - next[i].angleDeg) > 0.05);
        if (changed) {
          onCommitOptics(prev, next, 'Rotate Optic');
        }
      }
      startRotatingOpticsRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handlePointerEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handlePointerEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handlePointerEnd);
    };
  }, [activeRotatingOpticId, optics, onChangeOptics, onCommitOptics]);

  // Optic modification helpers
  const handleUpdateOptic = (id: string, updates: Partial<PolarizationOptic>) => {
    onChangeOptics(optics.map(o => (o.id === id ? { ...o, ...updates } : o)));
  };

  const handleDeleteOptic = (id: string) => {
    const prev = optics;
    const removed = optics.find(o => o.id === id);
    const next = optics.filter(o => o.id !== id);
    onChangeOptics(next);
    if (onCommitOptics) onCommitOptics(prev, next, `Remove ${removed?.name || 'Optic'}`);
  };

  const handleToggleOptic = (id: string) => {
    const prev = optics;
    const next = optics.map(o => (o.id === id ? { ...o, enabled: !o.enabled } : o));
    onChangeOptics(next);
    if (onCommitOptics) onCommitOptics(prev, next, 'Toggle Optic');
  };

  const handleMoveOptic = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= optics.length) return;
    const prev = optics;
    const updated = [...optics];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onChangeOptics(updated);
    if (onCommitOptics) onCommitOptics(prev, updated, 'Reorder Beamline Optics');
  };

  const handleAddOptic = (type: OpticType) => {
    const nextNum = optics.filter(o => o.type === type).length + 1;
    let newOptic: PolarizationOptic;

    switch (type) {
      case 'hwp':
        newOptic = {
          id: `hwp-${Date.now()}`,
          name: `Half-Wave Plate ${nextNum}`,
          type: 'hwp',
          angleDeg: 0,
          axisMode: 'fast',
          enabled: true
        };
        break;
      case 'qwp':
        newOptic = {
          id: `qwp-${Date.now()}`,
          name: `Quarter-Wave Plate ${nextNum}`,
          type: 'qwp',
          angleDeg: 45,
          axisMode: 'fast',
          enabled: true
        };
        break;
      case 'retarder':
        newOptic = {
          id: `ret-${Date.now()}`,
          name: `General Retarder (λ/8)`,
          type: 'retarder',
          angleDeg: 0,
          axisMode: 'fast',
          retardanceFraction: 8,
          enabled: true
        };
        break;
      case 'polarizer':
        newOptic = {
          id: `pol-${Date.now()}`,
          name: `Linear Polarizer ${nextNum}`,
          type: 'polarizer',
          angleDeg: 0,
          extinctionRatio: 1e-5,
          enabled: true
        };
        break;
      case 'pbs':
        newOptic = {
          id: `pbs-${Date.now()}`,
          name: `Polarizing Beam Splitter ${nextNum}`,
          type: 'pbs',
          angleDeg: 0,
          enabled: true
        };
        break;
      case 'rotator':
        newOptic = {
          id: `rot-${Date.now()}`,
          name: `Faraday Rotator ${nextNum}`,
          type: 'rotator',
          angleDeg: 45,
          enabled: true
        };
        break;
    }

    const prev = optics;
    const next = [...optics, newOptic];
    onChangeOptics(next);
    if (onCommitOptics) onCommitOptics(prev, next, `Add ${newOptic.name}`);
    setIsAddMenuOpen(false);
  };

  const handleApplyPresetTrain = (presetId: string) => {
    const preset = OPTICAL_TRAIN_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const prev = optics;
    onChangeOptics(preset.optics);
    if (onCommitOptics) onCommitOptics(prev, preset.optics, `Load Train: ${preset.name}`);
    setIsPresetsMenuOpen(false);
  };

  return (
    <Card
      title="Optical Beamline"
      subtitle="Sequential waveplates, polarizers, and rotators along the beam path."
      category="laser"
      icon={<Sliders size={20} />}
      collapsible={true}
      actions={
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          {/* Preset Optical Trains Button */}
          <div style={{ position: 'relative' }}>
            <Button
              size="sm"
              variant="outline"
              category="laser"
              icon={<Sparkles size={14} />}
              onClick={() => {
                setIsPresetsMenuOpen(prev => !prev);
                setIsAddMenuOpen(false);
              }}
            >
              Optical Trains
            </Button>

            {isPresetsMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'var(--color-bg-surface-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                  width: '280px',
                  padding: '6px'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', padding: '4px 8px' }}>
                  Optical Train Presets:
                </div>
                {OPTICAL_TRAIN_PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPresetTrain(p.id)}
                    className="dropdown-menu-item"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-primary)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontWeight: 'bold', color: 'var(--color-laser)' }}>{p.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{p.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Optic Button */}
          <div style={{ position: 'relative' }}>
            <Button
              size="sm"
              variant="primary"
              category="laser"
              icon={<Plus size={14} />}
              onClick={() => {
                setIsAddMenuOpen(prev => !prev);
                setIsPresetsMenuOpen(false);
              }}
            >
              Add Optic
            </Button>

            {isAddMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'var(--color-bg-surface-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                  width: '220px',
                  padding: '6px'
                }}
              >
                {[
                  { type: 'hwp' as OpticType, label: 'Half-Wave Plate (HWP, λ/2)', color: 'var(--color-laser)' },
                  { type: 'qwp' as OpticType, label: 'Quarter-Wave Plate (QWP, λ/4)', color: 'var(--color-optical)' },
                  { type: 'retarder' as OpticType, label: 'General Retarder (λ/x)', color: 'var(--color-magnetic)' },
                  { type: 'polarizer' as OpticType, label: 'Linear Polarizer', color: 'var(--color-rf)' },
                  { type: 'pbs' as OpticType, label: 'Polarizing Beam Splitter (PBS)', color: 'var(--color-error-prop)' },
                  { type: 'rotator' as OpticType, label: 'Faraday Rotator', color: 'var(--color-preset)' }
                ].map(item => (
                  <button
                    key={item.type}
                    onClick={() => handleAddOptic(item.type)}
                    className="dropdown-menu-item"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-primary)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: item.color
                      }}
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Optical Rail Canvas / Flow Bar */}
        <div
          style={{
            overflowX: 'auto',
            paddingBottom: 'var(--space-sm)',
            scrollbarWidth: 'thin'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 'max-content',
              padding: '16px 8px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              position: 'relative'
            }}
          >
            {/* Visual Laser Beam Central Rail Track */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                height: '4px',
                backgroundColor: 'rgba(192, 132, 252, 0.25)',
                boxShadow: '0 0 10px rgba(192, 132, 252, 0.4)',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            />

            {/* Stage 0: Input Beam Monitor */}
            <div style={{ zIndex: 2 }}>
              <MiniStageMonitor
                stage={stages[0]}
                isSelected={selectedStageIndex === 0}
                onSelect={() => onSelectStage(0)}
                label="Stage 0 (Input)"
              />
            </div>

            {/* Optics & Intermediate Stage Monitors */}
            {optics.map((optic, index) => {
              const stage = stages[index + 1];
              const isDropTarget = dropTargetIndex === index;

              return (
                <React.Fragment key={optic.id}>
                  {/* Connecting Laser Beam Segment with Arrow */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      zIndex: 2,
                      color: 'var(--color-laser)'
                    }}
                  >
                    <ChevronRight size={20} />
                  </div>

                  {/* Optic Mount Card */}
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      if (draggedOpticIndex !== null && dropTargetIndex !== index) {
                        setDropTargetIndex(index);
                      }
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      if (
                        draggedOpticIndex !== null &&
                        draggedOpticIndex !== index
                      ) {
                        const updated = [...optics];
                        const [moved] = updated.splice(draggedOpticIndex, 1);
                        updated.splice(index, 0, moved);
                        onChangeOptics(updated);
                      }
                      setDraggedOpticIndex(null);
                      setDropTargetIndex(null);
                    }}
                    style={{
                      zIndex: 2,
                      width: '210px',
                      backgroundColor: 'var(--color-bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: isDropTarget
                        ? '2px dashed var(--color-laser)'
                        : !optic.enabled
                        ? '1px dashed var(--color-border-subtle)'
                        : '1px solid var(--color-border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative',
                      opacity: optic.enabled ? 1 : 0.65
                    }}
                  >
                    {/* Top Header: Title, Enable/Disable, Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: getOpticColor(optic.type)
                        }}
                      >
                        {optic.name}
                      </span>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleToggleOptic(optic.id)}
                          title={optic.enabled ? 'Bypass Optic' : 'Enable Optic'}
                          style={iconBtnStyle}
                        >
                          {optic.enabled ? <Eye size={13} color="var(--color-laser)" /> : <EyeOff size={13} />}
                        </button>
                        <button
                          onClick={() => handleDeleteOptic(optic.id)}
                          title="Remove Optic"
                          style={iconBtnStyle}
                        >
                          <Trash2 size={13} color="var(--color-error)" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Mount Center & Side Grabbers for Turning */}
                    <div
                      style={{
                        height: '110px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <OpticVisualMount
                        optic={optic}
                        isRotating={activeRotatingOpticId === optic.id}
                        onStartRotation={(e, center, clientPos) => {
                          e.preventDefault();
                          startRotatingOpticsRef.current = optics.map(o => ({ ...o }));
                          setDraftInputs(prev => {
                            const next = { ...prev };
                            delete next[`${optic.id}-angle`];
                            return next;
                          });
                          setActiveRotatingOpticId(optic.id);
                          const startMouseAngle = (Math.atan2(center.y - clientPos.y, clientPos.x - center.x) * 180) / Math.PI;
                          rotatingStateRef.current = {
                            center,
                            startMouseAngle,
                            startOpticAngle: optic.angleDeg
                          };
                        }}
                      />
                    </div>

                    {/* Manual Numeric Angle Input with Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', width: '38px' }}>
                        Angle:
                      </label>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          type="text"
                          aria-label={`Angle for ${optic.name}`}
                          className="font-mono polarization-input"
                          value={getInputValue(`${optic.id}-angle`, optic.angleDeg)}
                          onFocus={() => {
                            setFocusedInputKey(`${optic.id}-angle`);
                            focusOpticsRef.current = optics.map(o => ({ ...o }));
                          }}
                          onChange={e =>
                            handleInputChange(`${optic.id}-angle`, e.target.value, val =>
                              handleUpdateOptic(optic.id, { angleDeg: val })
                            )
                          }
                          onBlur={() => {
                            setFocusedInputKey(null);
                            handleInputBlur(
                              `${optic.id}-angle`,
                              val => handleUpdateOptic(optic.id, { angleDeg: val }),
                              0
                            );
                            if (focusOpticsRef.current && onCommitOptics) {
                              const prev = focusOpticsRef.current;
                              const next = optics;
                              const changed = prev.some((p, i) => next[i] && Math.abs(p.angleDeg - next[i].angleDeg) > 0.01);
                              if (changed) {
                                onCommitOptics(prev, next, `Adjust ${optic.name} Angle`);
                              }
                            }
                            focusOpticsRef.current = null;
                          }}
                          onKeyDown={e =>
                            handleStepperChange(e, `${optic.id}-angle`, val =>
                              handleUpdateOptic(optic.id, { angleDeg: val })
                            )
                          }
                          style={getRailInputStyle(focusedInputKey === `${optic.id}-angle`, '22px')}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '10px',
                            color: 'var(--color-text-muted)',
                            pointerEvents: 'none'
                          }}
                        >
                          °
                        </span>
                      </div>
                    </div>

                    {/* Linear Polarizer Extinction Ratio Configuration */}
                    {optic.type === 'polarizer' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', width: '48px' }}>
                          Ext Ratio:
                        </label>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            aria-label={`Extinction Ratio for ${optic.name}`}
                            className="font-mono polarization-input"
                            value={getInputValue(`${optic.id}-ext`, optic.extinctionRatio ?? 1e-5)}
                            onFocus={() => setFocusedInputKey(`${optic.id}-ext`)}
                            onChange={e =>
                              handleInputChange(`${optic.id}-ext`, e.target.value, val => {
                                if (val >= 0) handleUpdateOptic(optic.id, { extinctionRatio: val });
                              })
                            }
                            onBlur={() => {
                              setFocusedInputKey(null);
                              handleInputBlur(`${optic.id}-ext`, val => {
                                if (val >= 0) handleUpdateOptic(optic.id, { extinctionRatio: val });
                              });
                            }}
                            onKeyDown={e =>
                              handleStepperChange(e, `${optic.id}-ext`, val => {
                                if (val >= 0) handleUpdateOptic(optic.id, { extinctionRatio: val });
                              })
                            }
                            style={getRailInputStyle(focusedInputKey === `${optic.id}-ext`)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Fast vs Slow Axis Toggle (Waveplates) */}
                    {(optic.type === 'hwp' || optic.type === 'qwp' || optic.type === 'retarder') && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleUpdateOptic(optic.id, { axisMode: 'fast' })}
                          style={{
                            flex: 1,
                            padding: '3px 0',
                            fontSize: '9px',
                            borderRadius: '2px',
                            border: optic.axisMode !== 'slow' ? '1px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                            backgroundColor: optic.axisMode !== 'slow' ? 'var(--color-laser-badge)' : 'transparent',
                            color: optic.axisMode !== 'slow' ? 'var(--color-laser)' : 'var(--color-text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          Fast Axis
                        </button>
                        <button
                          onClick={() => handleUpdateOptic(optic.id, { axisMode: 'slow' })}
                          style={{
                            flex: 1,
                            padding: '3px 0',
                            fontSize: '9px',
                            borderRadius: '2px',
                            border: optic.axisMode === 'slow' ? '1px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                            backgroundColor: optic.axisMode === 'slow' ? 'var(--color-laser-badge)' : 'transparent',
                            color: optic.axisMode === 'slow' ? 'var(--color-laser)' : 'var(--color-text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          Slow Axis
                        </button>
                      </div>
                    )}

                    {/* General Retarder Fraction / Degree Configuration */}
                    {optic.type === 'retarder' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Retard: λ/</span>
                        <input
                          type="text"
                          className="font-mono polarization-input"
                          value={getInputValue(`${optic.id}-retFrac`, optic.retardanceFraction ?? 8)}
                          onFocus={() => setFocusedInputKey(`${optic.id}-retFrac`)}
                          onChange={e =>
                            handleInputChange(`${optic.id}-retFrac`, e.target.value, val => {
                              if (val > 0) handleUpdateOptic(optic.id, { retardanceFraction: val, retardanceDeg: 360 / val });
                            })
                          }
                          onBlur={() => {
                            setFocusedInputKey(null);
                            handleInputBlur(`${optic.id}-retFrac`, val => {
                              if (val > 0) handleUpdateOptic(optic.id, { retardanceFraction: val, retardanceDeg: 360 / val });
                            });
                          }}
                          onKeyDown={e =>
                            handleStepperChange(e, `${optic.id}-retFrac`, val => {
                              if (val > 0) handleUpdateOptic(optic.id, { retardanceFraction: val, retardanceDeg: 360 / val });
                            })
                          }
                          style={{
                            ...getRailInputStyle(focusedInputKey === `${optic.id}-retFrac`),
                            width: '42px',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>or</span>
                        <input
                          type="text"
                          className="font-mono polarization-input"
                          value={getInputValue(`${optic.id}-retDeg`, (optic.retardanceDeg ?? (optic.retardanceFraction ? 360 / optic.retardanceFraction : 45)).toFixed(1))}
                          onFocus={() => setFocusedInputKey(`${optic.id}-retDeg`)}
                          onChange={e =>
                            handleInputChange(`${optic.id}-retDeg`, e.target.value, deg => {
                              if (deg > 0) handleUpdateOptic(optic.id, { retardanceDeg: deg, retardanceFraction: 360 / deg });
                            })
                          }
                          onBlur={() => {
                            setFocusedInputKey(null);
                            handleInputBlur(`${optic.id}-retDeg`, deg => {
                              if (deg > 0) handleUpdateOptic(optic.id, { retardanceDeg: deg, retardanceFraction: 360 / deg });
                            });
                          }}
                          onKeyDown={e =>
                            handleStepperChange(e, `${optic.id}-retDeg`, deg => {
                              if (deg > 0) handleUpdateOptic(optic.id, { retardanceDeg: deg, retardanceFraction: 360 / deg });
                            })
                          }
                          style={{
                            ...getRailInputStyle(focusedInputKey === `${optic.id}-retDeg`),
                            width: '50px',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>°</span>
                      </div>
                    )}

                    {/* Bottom Grabber & Reorder Nudge Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--color-border-subtle)',
                        paddingTop: '6px',
                        marginTop: '2px'
                      }}
                    >
                      <button
                        onClick={() => handleMoveOptic(index, -1)}
                        disabled={index === 0}
                        title="Move Left along beamline"
                        style={nudgeBtnStyle(index === 0)}
                      >
                        <ChevronLeft size={12} />
                      </button>

                      {/* Bottom Grabber Handle */}
                      <div
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(index));
                          setDraggedOpticIndex(index);
                        }}
                        onDragEnd={() => {
                          setDraggedOpticIndex(null);
                          setDropTargetIndex(null);
                        }}
                        title="Drag horizontally to reorder element along beamline"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: 'var(--color-text-muted)',
                          cursor: 'grab',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-bg-base)',
                          userSelect: 'none'
                        }}
                      >
                        <GripHorizontal size={14} />
                        <span style={{ fontSize: '9px' }}>Reorder</span>
                      </div>

                      <button
                        onClick={() => handleMoveOptic(index, 1)}
                        disabled={index === optics.length - 1}
                        title="Move Right along beamline"
                        style={nudgeBtnStyle(index === optics.length - 1)}
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Connecting Laser Beam Segment with Arrow */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      zIndex: 2,
                      color: 'var(--color-laser)'
                    }}
                  >
                    <ChevronRight size={20} />
                  </div>

                  {/* Stage Monitor After This Optic */}
                  {stage && (
                    <div style={{ zIndex: 2 }}>
                      <MiniStageMonitor
                        stage={stage}
                        isSelected={selectedStageIndex === index + 1}
                        onSelect={() => onSelectStage(index + 1)}
                        label={`Stage ${index + 1}`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Empty State / Add on beamline */}
            {optics.length === 0 && (
              <div
                style={{
                  zIndex: 2,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                  margin: '0 auto'
                }}
              >
                <span>Beamline is empty. Click "+ Add Optic" above to insert an optical element.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// Interactive Mount with Side Rotation Grabbers
// ============================================================================

interface OpticVisualMountProps {
  optic: PolarizationOptic;
  isRotating: boolean;
  onStartRotation: (
    e: React.MouseEvent | React.TouchEvent,
    center: { x: number; y: number },
    clientPos: { x: number; y: number }
  ) => void;
}

const OpticVisualMount: React.FC<OpticVisualMountProps> = ({
  optic,
  isRotating,
  onStartRotation
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const handleGrabberStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length !== 1) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    onStartRotation(e, { x: centerX, y: centerY }, { x: clientX, y: clientY });
  };

  const color = getOpticColor(optic.type);

  return (
    <div
      ref={mountRef}
      style={{
        width: '90px',
        height: '90px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* Outer Dial / Circular Ring */}
      <svg width="90" height="90" viewBox="0 0 90 90" style={{ position: 'absolute' }}>
        {/* Mount outer ring */}
        <circle
          cx="45"
          cy="45"
          r="38"
          fill="var(--color-bg-base)"
          stroke={isRotating ? 'var(--color-laser)' : 'var(--color-border-subtle)'}
          strokeWidth="2"
        />

        {/* Graduation tick marks every 45 deg */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
          const r1 = 34;
          const r2 = 38;
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={45 + r1 * Math.cos(rad)}
              y1={45 - r1 * Math.sin(rad)}
              x2={45 + r2 * Math.cos(rad)}
              y2={45 - r2 * Math.sin(rad)}
              stroke="var(--color-border-strong)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Rotating Optic Axis Line (Fast or Transmission axis, counter-clockwise with angleDeg) */}
        <g transform={`rotate(${-optic.angleDeg} 45 45)`}>
          {/* Main axis (rendered for waveplates, polarizers, rotators, and PBS) */}
          <line x1="12" y1="45" x2="78" y2="45" stroke={color} strokeWidth="3" strokeLinecap="round" />

          {/* Orthogonal slow axis if waveplate */}
          {(optic.type === 'hwp' || optic.type === 'qwp' || optic.type === 'retarder') && (
            <line
              x1="45"
              y1="20"
              x2="45"
              y2="70"
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.6"
            />
          )}

          {/* Grid lines if linear polarizer */}
          {optic.type === 'polarizer' && (
            <>
              <line x1="20" y1="38" x2="70" y2="38" stroke={color} strokeWidth="1" opacity="0.6" />
              <line x1="20" y1="52" x2="70" y2="52" stroke={color} strokeWidth="1" opacity="0.6" />
            </>
          )}

          {/* Faraday circular curl indicator */}
          {optic.type === 'rotator' && (
            <circle
              cx="45"
              cy="45"
              r="16"
              fill="none"
              stroke="var(--color-preset)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          )}
        </g>
      </svg>

      {/* Side Grabbers / Rotation Handles: Placed at the right and left of the ring */}
      <div
        onMouseDown={handleGrabberStart}
        onTouchStart={handleGrabberStart}
        title="Side grabber: Click and drag continuously around the ring to turn optic angle"
        style={{
          position: 'absolute',
          right: '-6px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: isRotating ? 'var(--color-laser)' : 'var(--color-bg-surface-elevated)',
          border: `2px solid ${color}`,
          boxShadow: 'var(--shadow-sm)',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          touchAction: 'none'
        }}
      >
        <RotateCw size={10} color={isRotating ? '#000' : color} />
      </div>

      <div
        onMouseDown={handleGrabberStart}
        onTouchStart={handleGrabberStart}
        title="Side grabber: Click and drag continuously around the ring to turn optic angle"
        style={{
          position: 'absolute',
          left: '-6px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: isRotating ? 'var(--color-laser)' : 'var(--color-bg-surface-elevated)',
          border: `2px solid ${color}`,
          boxShadow: 'var(--shadow-sm)',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          touchAction: 'none'
        }}
      >
        <RotateCw size={10} color={isRotating ? '#000' : color} />
      </div>

      {/* Center Label Pill */}
      <div
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          backgroundColor: 'var(--color-bg-surface)',
          padding: '2px 6px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border-subtle)',
          fontSize: '9px',
          fontWeight: 'bold',
          color: color
        }}
      >
        {optic.angleDeg.toFixed(1)}°
      </div>
    </div>
  );
};

// ============================================================================
// Miniature Stage Monitor Component
// ============================================================================

interface MiniStageMonitorProps {
  stage: StageResult;
  isSelected: boolean;
  onSelect: () => void;
  label: string;
}

const MiniStageMonitor: React.FC<MiniStageMonitorProps> = ({
  stage,
  isSelected,
  onSelect,
  label
}) => {
  const { ellipse, powerTransmissionPercent, pbsReflected } = stage;

  return (
    <div
      onClick={onSelect}
      style={{
        width: '125px',
        backgroundColor: isSelected ? 'var(--color-laser-badge)' : 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: isSelected ? '2px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
        boxShadow: isSelected ? '0 0 12px var(--color-laser-glow)' : 'var(--shadow-sm)',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)'
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>
        {label}
      </div>

      {/* Miniature SVG Ellipse Graphic */}
      <div style={{ width: '48px', height: '48px', position: 'relative' }}>
        <MiniEllipseSvg ellipse={ellipse} />
      </div>

      {/* Polarization State Label */}
      <div
        style={{
          fontSize: '10px',
          fontWeight: 'bold',
          color:
            ellipse.handedness === 'right'
              ? 'var(--color-laser)'
              : ellipse.handedness === 'left'
              ? 'var(--color-optical)'
              : 'var(--color-text-primary)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }}
      >
        {ellipse.handedness === 'right'
          ? 'RHC'
          : ellipse.handedness === 'left'
          ? 'LHC'
          : ellipse.description.split(' ')[0]}
      </div>

      {/* Power % */}
      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
        Power: <span className="font-mono text-laser">{powerTransmissionPercent.toFixed(1)}%</span>
      </div>

      {/* If PBS, show reflected power branch as well */}
      {pbsReflected && (
        <div
          style={{
            fontSize: '9px',
            color: 'var(--color-error-prop)',
            borderTop: '1px solid var(--color-border-subtle)',
            width: '100%',
            textAlign: 'center',
            paddingTop: '2px',
            marginTop: '2px'
          }}
        >
          Refl (s): {pbsReflected.powerReflectionPercent.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

// Miniature SVG Ellipse rendering helper
const MiniEllipseSvg: React.FC<{ ellipse: StageResult['ellipse'] }> = ({ ellipse }) => {
  const { psiDeg, chiDeg, handedness } = ellipse;
  const cx = 24;
  const cy = 24;
  const maxR = 20;

  // Semi-major and semi-minor radii
  const rx = maxR * Math.abs(Math.cos((chiDeg * Math.PI) / 180));
  const ry = maxR * Math.abs(Math.sin((chiDeg * Math.PI) / 180));

  const strokeColor =
    handedness === 'right'
      ? 'var(--color-laser)'
      : handedness === 'left'
      ? 'var(--color-optical)'
      : 'var(--color-text-primary)';

  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <title>
        {handedness === 'right'
          ? 'Right-Handed (RHC Helicity +1, Clockwise). Drives σ⁺ if B⃗ ∥ +k̂; drives σ⁻ if B⃗ ∥ -k̂.'
          : handedness === 'left'
          ? 'Left-Handed (LHC Helicity -1, Counter-Clockwise). Drives σ⁻ if B⃗ ∥ +k̂; drives σ⁺ if B⃗ ∥ -k̂.'
          : 'Linear Polarization'}
      </title>
      {/* Target coordinate crosshair */}
      <line x1="24" y1="4" x2="24" y2="44" stroke="var(--color-border-subtle)" strokeWidth="1" />
      <line x1="4" y1="24" x2="44" y2="24" stroke="var(--color-border-subtle)" strokeWidth="1" />

      {/* Rotated Ellipse */}
      <g transform={`rotate(${-psiDeg} 24 24)`}>
        <ellipse
          cx={cx}
          cy={cy}
          rx={Math.max(2, rx)}
          ry={Math.max(1, ry)}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* Handedness arrow on the top edge:
            Right-Hand Rule convention (viewer at source looking along +z):
            RHC (sigma+) is CW  -> at the top edge (12 o'clock), arrow points RIGHT (towards 3 o'clock)
            LHC (sigma-) is CCW -> at the top edge (12 o'clock), arrow points LEFT (towards 9 o'clock)
        */}
        {handedness === 'right' && (
          <polygon
            points={`${cx - 2},${cy - ry - 3} ${cx + 3},${cy - ry} ${cx - 2},${cy - ry + 3}`}
            fill={strokeColor}
          />
        )}
        {handedness === 'left' && (
          <polygon
            points={`${cx + 2},${cy - ry - 3} ${cx - 3},${cy - ry} ${cx + 2},${cy - ry + 3}`}
            fill={strokeColor}
          />
        )}
      </g>
    </svg>
  );
};

function getOpticColor(type: OpticType): string {
  switch (type) {
    case 'hwp':
      return 'var(--color-laser)';
    case 'qwp':
      return 'var(--color-optical)';
    case 'retarder':
      return 'var(--color-magnetic)';
    case 'polarizer':
      return 'var(--color-rf)';
    case 'pbs':
      return 'var(--color-error-prop)';
    case 'rotator':
      return 'var(--color-preset)';
    default:
      return 'var(--color-laser)';
  }
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '2px',
  color: 'var(--color-text-secondary)',
  display: 'flex',
  alignItems: 'center'
};

const nudgeBtnStyle = (disabled: boolean): React.CSSProperties => ({
  background: 'transparent',
  border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  padding: '2px',
  color: disabled ? 'var(--color-border-subtle)' : 'var(--color-text-secondary)',
  display: 'flex',
  alignItems: 'center'
});

const getRailInputStyle = (isFocused: boolean, extraPaddingRight?: string): React.CSSProperties => ({
  width: '100%',
  padding: extraPaddingRight ? `4px ${extraPaddingRight} 4px 6px` : '4px 6px',
  fontSize: '11px',
  color: 'var(--color-text-primary)',
  backgroundColor: isFocused ? 'var(--color-bg-input-hover)' : 'var(--color-bg-input)',
  border: `1px solid ${isFocused ? 'var(--color-laser)' : 'var(--color-border-subtle)'}`,
  borderRadius: 'var(--radius-md)',
  boxShadow: isFocused ? '0 0 0 2px var(--color-laser-badge)' : 'var(--shadow-sm)',
  transition: 'all var(--transition-fast)',
  outline: 'none',
  boxSizing: 'border-box'
});
