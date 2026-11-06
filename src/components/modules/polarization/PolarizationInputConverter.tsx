import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { handleNumberStepperKeyDown } from '../../../core/number-stepper';
import {
  JonesVector,
  StokesVector,
  jonesToStokes,
  stokesToNormalized,
  stokesToEllipse,
  stokesToPoincare,
  stokesToJones,
  ellipseToStokes,
  amplitudesAndPhaseToJones,
  jonesToAmplitudesAndPhase,
  getPresetPolarization,
  POLARIZATION_PRESETS
} from '../../../core/polarization';
import { RefreshCw, Sparkles, Activity } from 'lucide-react';

export interface PolarizationInputConverterProps {
  value: JonesVector;
  onChange: (newJones: JonesVector) => void;
  onCommit?: (prevJones: JonesVector, nextJones: JonesVector) => void;
}

export const PolarizationInputConverter: React.FC<PolarizationInputConverterProps> = ({
  value,
  onChange,
  onCommit
}) => {

  // Derived properties from current Jones vector
  const stokes = jonesToStokes(value);
  const normStokes = stokesToNormalized(stokes);
  const ellipse = stokesToEllipse(stokes);
  const poincare = stokesToPoincare(stokes);
  const ampPhase = jonesToAmplitudesAndPhase(value);

  // Active focused field to prevent user typing from being overridden by effect
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const prevFocusedFieldRef = useRef<string | null>(null);
  const focusJonesRef = useRef<JonesVector>(value);

  // Commit on input field blur transitions without spamming during typing
  useEffect(() => {
    if (prevFocusedFieldRef.current === null && focusedField !== null) {
      focusJonesRef.current = value;
    } else if (prevFocusedFieldRef.current !== null && focusedField === null) {
      if (onCommit) {
        const prev = focusJonesRef.current;
        const next = value;
        if (
          Math.abs(prev.Ex.re - next.Ex.re) > 1e-4 ||
          Math.abs(prev.Ex.im - next.Ex.im) > 1e-4 ||
          Math.abs(prev.Ey.re - next.Ey.re) > 1e-4 ||
          Math.abs(prev.Ey.im - next.Ey.im) > 1e-4
        ) {
          onCommit(prev, next);
          focusJonesRef.current = next;
        }
      }
    }
    prevFocusedFieldRef.current = focusedField;
  }, [focusedField, value, onCommit]);

  // Draft states to allow free-form typing without cursor glitches
  const [draftE0x, setDraftE0x] = useState<string>(ampPhase.E0x.toFixed(4));
  const [draftE0y, setDraftE0y] = useState<string>(ampPhase.E0y.toFixed(4));
  const [draftDelta, setDraftDelta] = useState<string>(ampPhase.deltaDeg.toFixed(2));

  const [draftS0, setDraftS0] = useState<string>(stokes.s0.toFixed(4));
  const [draftS1, setDraftS1] = useState<string>(normStokes.s1.toFixed(4));
  const [draftS2, setDraftS2] = useState<string>(normStokes.s2.toFixed(4));
  const [draftS3, setDraftS3] = useState<string>(normStokes.s3.toFixed(4));

  const [draftPsi, setDraftPsi] = useState<string>(ellipse.psiDeg.toFixed(2));
  const [draftChi, setDraftChi] = useState<string>(ellipse.chiDeg.toFixed(2));

  const [draftLong, setDraftLong] = useState<string>(poincare.longitudeDeg.toFixed(2));
  const [draftLat, setDraftLat] = useState<string>(poincare.latitudeDeg.toFixed(2));

  // Sync draft states when value prop changes, except for the currently focused field
  useEffect(() => {
    if (focusedField !== 'E0x') setDraftE0x(ampPhase.E0x.toFixed(4));
    if (focusedField !== 'E0y') setDraftE0y(ampPhase.E0y.toFixed(4));
    if (focusedField !== 'delta') setDraftDelta(ampPhase.deltaDeg.toFixed(2));

    if (focusedField !== 's0') setDraftS0(stokes.s0.toFixed(4));
    if (focusedField !== 's1') setDraftS1(normStokes.s1.toFixed(4));
    if (focusedField !== 's2') setDraftS2(normStokes.s2.toFixed(4));
    if (focusedField !== 's3') setDraftS3(normStokes.s3.toFixed(4));

    if (focusedField !== 'psi') setDraftPsi(ellipse.psiDeg.toFixed(2));
    if (focusedField !== 'chi') setDraftChi(ellipse.chiDeg.toFixed(2));

    if (focusedField !== 'long') setDraftLong(poincare.longitudeDeg.toFixed(2));
    if (focusedField !== 'lat') setDraftLat(poincare.latitudeDeg.toFixed(2));
  }, [value, focusedField]);

  // Handlers for each definition format
  const handleUpdateFromJonesAmps = (newE0xStr: string, newE0yStr: string, newDeltaStr: string) => {
    const e0x = parseFloat(newE0xStr);
    const e0y = parseFloat(newE0yStr);
    const delta = parseFloat(newDeltaStr);
    if (!Number.isNaN(e0x) && !Number.isNaN(e0y) && !Number.isNaN(delta)) {
      const newJ = amplitudesAndPhaseToJones(e0x, e0y, delta);
      onChange(newJ);
    }
  };

  const handleUpdateFromStokesNorm = (
    newS1Str: string,
    newS2Str: string,
    newS3Str: string,
    s0Val = stokes.s0
  ) => {
    const s1 = parseFloat(newS1Str);
    const s2 = parseFloat(newS2Str);
    const s3 = parseFloat(newS3Str);
    if (!Number.isNaN(s1) && !Number.isNaN(s2) && !Number.isNaN(s3)) {
      const norm = Math.hypot(s1, s2, s3);
      const scale = norm > 0 ? (s0Val > 0 ? s0Val : 1) / norm : 1;
      const targetStokes: StokesVector = {
        s0: s0Val > 0 ? s0Val : 1,
        s1: s1 * scale,
        s2: s2 * scale,
        s3: s3 * scale
      };
      const newJ = stokesToJones(targetStokes);
      onChange(newJ);
    }
  };

  const handleUpdateFromEllipse = (newPsiStr: string, newChiStr: string) => {
    const psi = parseFloat(newPsiStr);
    const chi = parseFloat(newChiStr);
    if (!Number.isNaN(psi) && !Number.isNaN(chi)) {
      const clampedChi = Math.max(-45, Math.min(45, chi));
      const targetStokes = ellipseToStokes(psi, clampedChi, stokes.s0 > 0 ? stokes.s0 : 1);
      const newJ = stokesToJones(targetStokes);
      onChange(newJ);
    }
  };

  const handleUpdateFromPoincare = (newLongStr: string, newLatStr: string) => {
    const longDeg = parseFloat(newLongStr);
    const latDeg = parseFloat(newLatStr);
    if (!Number.isNaN(longDeg) && !Number.isNaN(latDeg)) {
      const psi = longDeg / 2;
      const chi = Math.max(-45, Math.min(45, latDeg / 2));
      const targetStokes = ellipseToStokes(psi, chi, stokes.s0 > 0 ? stokes.s0 : 1);
      const newJ = stokesToJones(targetStokes);
      onChange(newJ);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const prev = value;
    const newJ = getPresetPolarization(presetId, stokes.s0 > 0 ? stokes.s0 : 1);
    onChange(newJ);
    if (onCommit) onCommit(prev, newJ);
  };

  return (
    <Card
      title="Input Polarization State"
      subtitle="Define input state via Jones vector, Stokes parameters, ellipse geometry (ψ, χ), or Poincaré coordinates."
      category="laser"
      icon={<Activity size={20} />}
      collapsible={true}
      actions={
        <Button
          size="sm"
          variant="ghost"
          category="laser"
          icon={<RefreshCw size={14} />}
          onClick={() => {
            const prev = value;
            const newJ = getPresetPolarization('H', 1.0);
            onChange(newJ);
            if (onCommit) onCommit(prev, newJ);
          }}
        >
          Reset to |H⟩
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Preset Selector Row */}
        <div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} color="var(--color-laser)" />
            <span>Polarization Presets:</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {POLARIZATION_PRESETS.map(preset => {
              const isMatch =
                Math.abs(ellipse.chiDeg - preset.chiDeg) < 1.0 &&
                (Math.abs(ellipse.chiDeg) > 40 ||
                  Math.abs(Math.abs(ellipse.psiDeg) - Math.abs(preset.psiDeg)) < 2.0);

              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  title={preset.description}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: 'var(--font-size-xs)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isMatch ? 'var(--color-laser-badge)' : 'var(--color-bg-input)',
                    border: isMatch ? '1px solid var(--color-laser)' : '1px solid var(--color-border-subtle)',
                    color: isMatch ? 'var(--color-laser)' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <span className="font-mono" style={{ fontWeight: 'bold' }}>
                    {preset.ket}
                  </span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Multi-Representation Panels Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-md)'
          }}
        >
          {/* 1. Jones Vector & Phase Panel */}
          <div style={panelContainerStyle}>
            <div>
              <div style={{ ...panelHeaderStyle, color: 'var(--color-laser)' }}>
                <span>Jones Vector</span>
                <span className="font-mono text-muted">E₀ exp(iφ)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'end' }}>
                <div style={fieldGroupStyle}>
                  <label style={uniformLabelStyle}>
                    E₀x Amplitude:
                  </label>
                  <input
                    type="text"
                    aria-label="E0x Amplitude"
                    className="font-mono polarization-input"
                    value={draftE0x}
                    onFocus={() => {
                      setFocusedField('E0x');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftE0x.trim();
                      const v = text === '' ? 0 : parseFloat(text);
                      if (!Number.isNaN(v)) {
                        setDraftE0x(v.toFixed(4));
                        if (text === '') handleUpdateFromJonesAmps('0', draftE0y, draftDelta);
                      }
                    }}
                    onChange={e => {
                      setDraftE0x(e.target.value);
                      handleUpdateFromJonesAmps(e.target.value, draftE0y, draftDelta);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftE0x(newVal);
                        handleUpdateFromJonesAmps(newVal, draftE0y, draftDelta);
                      });
                    }}
                    style={getInputStyle(focusedField === 'E0x')}
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={uniformLabelStyle}>
                    E₀y Amplitude:
                  </label>
                  <input
                    type="text"
                    aria-label="E0y Amplitude"
                    className="font-mono polarization-input"
                    value={draftE0y}
                    onFocus={() => {
                      setFocusedField('E0y');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftE0y.trim();
                      const v = text === '' ? 0 : parseFloat(text);
                      if (!Number.isNaN(v)) {
                        setDraftE0y(v.toFixed(4));
                        if (text === '') handleUpdateFromJonesAmps(draftE0x, '0', draftDelta);
                      }
                    }}
                    onChange={e => {
                      setDraftE0y(e.target.value);
                      handleUpdateFromJonesAmps(draftE0x, e.target.value, draftDelta);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftE0y(newVal);
                        handleUpdateFromJonesAmps(draftE0x, newVal, draftDelta);
                      });
                    }}
                    style={getInputStyle(focusedField === 'E0y')}
                  />
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <label style={{ height: '18px', display: 'flex', alignItems: 'flex-end', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Phase Diff δ = φy - φx (deg):
                </label>
                <input
                  type="text"
                  aria-label="Phase Diff delta"
                  className="font-mono polarization-input"
                  value={draftDelta}
                  onFocus={() => {
                    setFocusedField('delta');
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    const text = draftDelta.trim();
                    const v = text === '' ? 0 : parseFloat(text);
                    if (!Number.isNaN(v)) {
                      setDraftDelta(v.toFixed(2));
                      if (text === '') handleUpdateFromJonesAmps(draftE0x, draftE0y, '0');
                    }
                  }}
                  onChange={e => {
                    setDraftDelta(e.target.value);
                    handleUpdateFromJonesAmps(draftE0x, draftE0y, e.target.value);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                      return;
                    }
                    handleNumberStepperKeyDown(e, newVal => {
                      setDraftDelta(newVal);
                      handleUpdateFromJonesAmps(draftE0x, draftE0y, newVal);
                    });
                  }}
                  style={getInputStyle(focusedField === 'delta')}
                />
              </div>
            </div>

            <div style={panelFooterStyle}>
              <span>Ratio α = arctan(Ey/Ex):</span>
              <span className="font-mono text-laser">{ampPhase.alphaDeg.toFixed(2)}°</span>
            </div>
          </div>

          {/* 2. Stokes Parameters Panel */}
          <div style={panelContainerStyle}>
            <div>
              <div style={{ ...panelHeaderStyle, color: 'var(--color-optical)' }}>
                <span>Stokes Parameters</span>
                <span className="font-mono text-muted">DOP = 100%</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', alignItems: 'end' }}>
                <div style={fieldGroupStyle}>
                  <label style={uniformLabelStyle}>
                    S₀ (Power):
                  </label>
                  <input
                    type="text"
                    aria-label="Stokes S0 Power"
                    className="font-mono polarization-input"
                    value={draftS0}
                    onFocus={() => {
                      setFocusedField('s0');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftS0.trim();
                      const v = text === '' ? 1 : parseFloat(text);
                      if (!Number.isNaN(v) && v > 0) {
                        setDraftS0(v.toFixed(4));
                        if (text === '') handleUpdateFromStokesNorm(draftS1, draftS2, draftS3, 1);
                      }
                    }}
                    onChange={e => {
                      setDraftS0(e.target.value);
                      const s0 = parseFloat(e.target.value);
                      if (!Number.isNaN(s0) && s0 > 0) {
                        handleUpdateFromStokesNorm(draftS1, draftS2, draftS3, s0);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftS0(newVal);
                        const s0 = parseFloat(newVal);
                        if (!Number.isNaN(s0) && s0 > 0) {
                          handleUpdateFromStokesNorm(draftS1, draftS2, draftS3, s0);
                        }
                      });
                    }}
                    style={getInputStyle(focusedField === 's0')}
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={uniformLabelStyle}>
                    s₁ (H - V):
                  </label>
                  <input
                    type="text"
                    aria-label="Stokes s1"
                    className="font-mono polarization-input"
                    value={draftS1}
                    onFocus={() => {
                      setFocusedField('s1');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftS1.trim();
                      const v = text === '' ? 0 : parseFloat(text);
                      if (!Number.isNaN(v)) {
                        setDraftS1(v.toFixed(4));
                        if (text === '') handleUpdateFromStokesNorm('0', draftS2, draftS3);
                      }
                    }}
                    onChange={e => {
                      setDraftS1(e.target.value);
                      handleUpdateFromStokesNorm(e.target.value, draftS2, draftS3);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftS1(newVal);
                        handleUpdateFromStokesNorm(newVal, draftS2, draftS3);
                      });
                    }}
                    style={getInputStyle(focusedField === 's1')}
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={uniformLabelStyle}>
                    s₂ (+D - -A):
                  </label>
                  <input
                    type="text"
                    aria-label="Stokes s2"
                    className="font-mono polarization-input"
                    value={draftS2}
                    onFocus={() => {
                      setFocusedField('s2');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftS2.trim();
                      const v = text === '' ? 0 : parseFloat(text);
                      if (!Number.isNaN(v)) {
                        setDraftS2(v.toFixed(4));
                        if (text === '') handleUpdateFromStokesNorm(draftS1, '0', draftS3);
                      }
                    }}
                    onChange={e => {
                      setDraftS2(e.target.value);
                      handleUpdateFromStokesNorm(draftS1, e.target.value, draftS3);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftS2(newVal);
                        handleUpdateFromStokesNorm(draftS1, newVal, draftS3);
                      });
                    }}
                    style={getInputStyle(focusedField === 's2')}
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label
                    style={uniformLabelStyle}
                    title="Stokes s₃: Difference between right- and left-circular power components (RHC - LHC). Intrinsic photon helicity along k̂."
                  >
                    s₃ (RHC - LHC):
                  </label>
                  <input
                    type="text"
                    aria-label="Stokes s3"
                    className="font-mono polarization-input"
                    value={draftS3}
                    onFocus={() => {
                      setFocusedField('s3');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftS3.trim();
                      const v = text === '' ? 0 : parseFloat(text);
                      if (!Number.isNaN(v)) {
                        setDraftS3(v.toFixed(4));
                        if (text === '') handleUpdateFromStokesNorm(draftS1, draftS2, '0');
                      }
                    }}
                    onChange={e => {
                      setDraftS3(e.target.value);
                      handleUpdateFromStokesNorm(draftS1, draftS2, e.target.value);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftS3(newVal);
                        handleUpdateFromStokesNorm(draftS1, draftS2, newVal);
                      });
                    }}
                    style={getInputStyle(focusedField === 's3')}
                  />
                </div>
              </div>
            </div>

            <div style={panelFooterStyle}>
              <span>Polarization Vector:</span>
              <span className="font-mono text-optical">
                [{normStokes.s1.toFixed(3)}, {normStokes.s2.toFixed(3)}, {normStokes.s3.toFixed(3)}]
              </span>
            </div>
          </div>

          {/* 3. Polarization Ellipse Geometry Panel */}
          <div style={panelContainerStyle}>
            <div>
              <div style={{ ...panelHeaderStyle, color: 'var(--color-magnetic)' }}>
                <span>Ellipse Geometry (ψ, χ)</span>
                <span
                  title={
                    ellipse.handedness === 'right'
                      ? 'Right-Hand Rule: Viewer at laser source looking along +z (into screen). Right thumb along +k̂, fingers curl Clockwise (CW). Photon carries +ħ along k̂ (Helicity +1). Drives σ⁺ if B⃗ ∥ +k̂; drives σ⁻ if B⃗ ∥ -k̂.'
                      : ellipse.handedness === 'left'
                      ? 'Left-Handed: Counter-Clockwise (CCW) rotation looking along +k̂. Photon carries -ħ along k̂ (Helicity -1). Drives σ⁻ if B⃗ ∥ +k̂; drives σ⁺ if B⃗ ∥ -k̂.'
                      : 'Linear polarization (zero net circularity)'
                  }
                  style={{
                    color:
                      ellipse.handedness === 'right'
                        ? 'var(--color-magnetic)'
                        : ellipse.handedness === 'left'
                        ? 'var(--color-rf)'
                        : 'var(--color-text-secondary)',
                    fontWeight: 'bold',
                    cursor: 'help'
                  }}
                >
                  {ellipse.handedness === 'right' ? 'RHC' : ellipse.handedness === 'left' ? 'LHC' : 'Linear'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'end' }}>
                <div style={fieldGroupStyle}>
                  <label style={uniformLabelStyle}>
                    Azimuth ψ [-90°, +90°]:
                  </label>
                  <input
                    type="text"
                    aria-label="Azimuth psi"
                    className="font-mono polarization-input"
                    value={draftPsi}
                    onFocus={() => {
                      setFocusedField('psi');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftPsi.trim();
                      const v = text === '' ? 0 : parseFloat(text);
                      if (!Number.isNaN(v)) {
                        setDraftPsi(v.toFixed(2));
                        if (text === '') handleUpdateFromEllipse('0', draftChi);
                      }
                    }}
                    onChange={e => {
                      setDraftPsi(e.target.value);
                      handleUpdateFromEllipse(e.target.value, draftChi);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftPsi(newVal);
                        handleUpdateFromEllipse(newVal, draftChi);
                      });
                    }}
                    style={getInputStyle(focusedField === 'psi')}
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={uniformLabelStyle}>
                    Ellipticity χ [-45°, +45°]:
                  </label>
                  <input
                    type="text"
                    aria-label="Ellipticity chi"
                    className="font-mono polarization-input"
                    value={draftChi}
                    onFocus={() => {
                      setFocusedField('chi');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftChi.trim();
                      const v = text === '' ? 0 : parseFloat(text);
                      if (!Number.isNaN(v)) {
                        setDraftChi(v.toFixed(2));
                        if (text === '') handleUpdateFromEllipse(draftPsi, '0');
                      }
                    }}
                    onChange={e => {
                      setDraftChi(e.target.value);
                      handleUpdateFromEllipse(draftPsi, e.target.value);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftChi(newVal);
                        handleUpdateFromEllipse(draftPsi, newVal);
                      });
                    }}
                    style={getInputStyle(focusedField === 'chi')}
                  />
                </div>
              </div>
            </div>

            <div style={panelFooterStyle}>
              <span>Axial Ratio b/a = |tan χ|:</span>
              <span className="font-mono text-magnetic">{ellipse.axialRatio.toFixed(3)}</span>
            </div>
          </div>

          {/* 4. Poincaré Sphere Angles Panel */}
          <div style={panelContainerStyle}>
            <div>
              <div style={{ ...panelHeaderStyle, color: 'var(--color-rf)' }}>
                <span>Poincaré Coordinates (2ψ, 2χ)</span>
                <span className="font-mono text-muted">Angles</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'end' }}>
                <div style={fieldGroupStyle}>
                  <label style={uniformLabelStyle}>
                    Longitude 2ψ [-180°, 180°]:
                  </label>
                  <input
                    type="text"
                    aria-label="Poincare Longitude 2psi"
                    className="font-mono polarization-input"
                    value={draftLong}
                    onFocus={() => {
                      setFocusedField('long');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftLong.trim();
                      const v = text === '' ? 0 : parseFloat(text);
                      if (!Number.isNaN(v)) {
                        setDraftLong(v.toFixed(2));
                        if (text === '') handleUpdateFromPoincare('0', draftLat);
                      }
                    }}
                    onChange={e => {
                      setDraftLong(e.target.value);
                      handleUpdateFromPoincare(e.target.value, draftLat);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftLong(newVal);
                        handleUpdateFromPoincare(newVal, draftLat);
                      });
                    }}
                    style={getInputStyle(focusedField === 'long')}
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={uniformLabelStyle}>
                    Latitude 2χ [-90°, 90°]:
                  </label>
                  <input
                    type="text"
                    aria-label="Poincare Latitude 2chi"
                    className="font-mono polarization-input"
                    value={draftLat}
                    onFocus={() => {
                      setFocusedField('lat');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      const text = draftLat.trim();
                      const v = text === '' ? 0 : parseFloat(text);
                      if (!Number.isNaN(v)) {
                        setDraftLat(v.toFixed(2));
                        if (text === '') handleUpdateFromPoincare(draftLong, '0');
                      }
                    }}
                    onChange={e => {
                      setDraftLat(e.target.value);
                      handleUpdateFromPoincare(draftLong, e.target.value);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                        return;
                      }
                      handleNumberStepperKeyDown(e, newVal => {
                        setDraftLat(newVal);
                        handleUpdateFromPoincare(draftLong, newVal);
                      });
                    }}
                    style={getInputStyle(focusedField === 'lat')}
                  />
                </div>
              </div>
            </div>

            <div style={panelFooterStyle}>
              <span>Spherical Coordinates:</span>
              <span className="font-mono text-rf">
                ({poincare.longitudeDeg.toFixed(1)}°, {poincare.latitudeDeg.toFixed(1)}°)
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const panelContainerStyle: React.CSSProperties = {
  padding: 'var(--space-sm)',
  backgroundColor: 'var(--color-bg-base)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '100%',
  boxSizing: 'border-box'
};

const panelHeaderStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  fontWeight: 'var(--font-weight-semibold)',
  marginBottom: 'var(--space-xs)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: '24px'
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  height: '100%'
};

const uniformLabelStyle: React.CSSProperties = {
  height: '34px',
  display: 'flex',
  alignItems: 'flex-end',
  fontSize: '11px',
  color: 'var(--color-text-secondary)',
  lineHeight: 1.2,
  marginBottom: '4px'
};

const getInputStyle = (isFocused: boolean): React.CSSProperties => ({
  width: '100%',
  height: '32px',
  padding: '6px 8px',
  fontSize: 'var(--font-size-xs)',
  color: 'var(--color-text-primary)',
  backgroundColor: isFocused ? 'var(--color-bg-input-hover)' : 'var(--color-bg-input)',
  border: `1px solid ${isFocused ? 'var(--color-laser)' : 'var(--color-border-subtle)'}`,
  borderRadius: 'var(--radius-md)',
  boxShadow: isFocused ? '0 0 0 2px var(--color-laser-badge)' : 'var(--shadow-sm)',
  transition: 'all var(--transition-fast)',
  outline: 'none',
  boxSizing: 'border-box'
});

const panelFooterStyle: React.CSSProperties = {
  marginTop: '10px',
  fontSize: '11px',
  color: 'var(--color-text-muted)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: '20px',
  borderTop: '1px solid var(--color-border-subtle)',
  paddingTop: '6px'
};
