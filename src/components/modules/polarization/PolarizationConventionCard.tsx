import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { MathView } from '../../common/MathView';
import { Button } from '../../common/Button';
import { Compass, ChevronDown, ChevronUp } from 'lucide-react';

export const PolarizationConventionCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <Card
      title="AMO Physics Handedness & Phase Convention"
      subtitle="Standard definitions for laser propagation, right-hand rule helicity, and Poincaré sphere mapping."
      category="laser"
      icon={<Compass size={20} />}
      collapsible={true}
      actions={
        <Button
          size="sm"
          variant="ghost"
          category="laser"
          icon={isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          onClick={() => setIsExpanded(prev => !prev)}
        >
          {isExpanded ? 'Hide Details' : 'Show Convention Guide'}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Quick Summary Pill Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-sm)',
            fontSize: 'var(--font-size-xs)'
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              borderLeft: '3px solid var(--color-laser)'
            }}
          >
            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Propagation Geometry</div>
            <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
              Viewer at source, beam propagating along <span className="font-mono text-laser">+z</span> (into screen, <MathView math="\hat{k} = +\hat{z}" displayMode={false} />).
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              borderLeft: '3px solid var(--color-optical)'
            }}
          >
            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Time Phase Definition</div>
            <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
              <MathView math="\vec{E}(t) = \text{Re}\{\mathbf{E}e^{i\omega t}\}" displayMode={false} /> (<MathView math="e^{i\omega t}" displayMode={false} /> convention, <MathView math="\delta = \phi_y - \phi_x" displayMode={false} />).
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              borderLeft: '3px solid var(--color-magnetic)'
            }}
          >
            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Right-Handed (RHC / Helicity +1)</div>
            <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
              Right-Hand Rule (thumb +z, curl CW): Clockwise (CW) rotation looking along +z <span className="font-mono text-magnetic">S₃ = +1</span> (North Pole). Intrinsic spin <MathView math="+\hbar\hat{k}" displayMode={false} /> (Helicity +1).
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              borderLeft: '3px solid var(--color-rf)'
            }}
          >
            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Left-Handed (LHC / Helicity -1)</div>
            <div style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
              Counter-Clockwise (CCW) rotation looking along +z (opposite finger curl) <span className="font-mono text-rf">S₃ = -1</span> (South Pole). Intrinsic spin <MathView math="-\hbar\hat{k}" displayMode={false} /> (Helicity -1).
            </div>
          </div>
        </div>

        {/* Detailed Expandable Section */}
        {isExpanded && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
              padding: 'var(--space-md)',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
              {/* Left Column: Equations & Phase */}
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-laser)', marginBottom: 'var(--space-xs)' }}>
                  1. Electric Field & Phase Difference
                </h4>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  In AMO spectroscopy and quantum optics, the real electric field vector harmonic time evolution is represented by:
                </p>
                <div style={{ margin: '8px 0' }}>
                  <MathView
                    math="\vec{E}(t) = \text{Re}\left\{ \begin{pmatrix} E_{0x} e^{i\phi_x} \\ E_{0y} e^{i\phi_y} \end{pmatrix} e^{i\omega t} \right\} = \begin{pmatrix} E_{0x} \cos(\omega t + \phi_x) \\ E_{0y} \cos(\omega t + \phi_y) \end{pmatrix}"
                    displayMode={true}
                  />
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Factoring out global phase <MathView math="\phi_x = 0" displayMode={false} />, the relative phase difference is <MathView math="\delta = \phi_y - \phi_x" displayMode={false} />. When <MathView math="\delta = +\pi/2" displayMode={false} />, <MathView math="E_y" displayMode={false} /> leads <MathView math="E_x" displayMode={false} /> by a quarter-cycle.
                </p>
              </div>

              {/* Right Column: Handedness & Helicity */}
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-optical)', marginBottom: 'var(--space-xs)' }}>
                  2. Helicity & Right-Hand Rule in AMO Labs
                </h4>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Imagine looking down the laser beam path from the laser source towards your science chamber or detector (<MathView math="+z" displayMode={false} /> into the screen). With your right thumb pointing in the photon propagation direction (<MathView math="\hat{k} = +\hat{z}" displayMode={false} />):
                </p>
                <div style={{ margin: '8px 0' }}>
                  <MathView
                    math="\vec{E}(t) = E_0 \begin{pmatrix} \cos(\omega t) \\ -\sin(\omega t) \end{pmatrix} \implies \text{Rotates Clockwise (CW)}"
                    displayMode={true}
                  />
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Your right-hand fingers curl <strong style={{ color: 'var(--color-text-primary)' }}>Clockwise (CW)</strong> in the transverse plane. This defines <strong style={{ color: 'var(--color-text-primary)' }}>Right-Handed Circular (RHC)</strong> with positive photon helicity <MathView math="S_z = +\hbar" displayMode={false} />, mapping to the North Pole (<MathView math="S_3 = +1" displayMode={false} />) of the Poincaré sphere. Conversely, <strong style={{ color: 'var(--color-text-primary)' }}>Left-Handed Circular (LHC)</strong> rotates Counter-Clockwise (CCW) with negative photon helicity <MathView math="S_z = -\hbar" displayMode={false} /> and maps to the South Pole (<MathView math="S_3 = -1" displayMode={false} />).
                </p>
              </div>
            </div>

            {/* DEDICATED SECTION 3: Photon Helicity vs. Atomic Zeeman Transitions & Quantization Axis */}
            <div
              style={{
                borderTop: '1px solid var(--color-border-subtle)',
                paddingTop: 'var(--space-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)'
              }}
            >
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-laser)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>3. Photon Helicity vs. Atomic Zeeman Transitions (σ⁺, σ⁻, π) &amp; The Quantization Axis</span>
                </h4>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginTop: '4px', marginBottom: 0 }}>
                  The interaction between laser polarization and an atom or molecule is fundamentally a coordinate-system mapping problem: projecting the electric field vector <MathView math="\mathbf{E}" displayMode={false} /> of the light onto the internal angular momentum basis <MathView math="|F, m_F\rangle" displayMode={false} /> of the particle. Because the quantization axis (<MathView math="\hat{z}" displayMode={false} />) is purely a mathematical choice of basis—while physical evolution is basis-independent—evaluating transitions requires distinguishing between convenient basis choices, handedness vs. helicity, and competing energy scales.
                </p>
              </div>

              {/* A. Spherical Tensor Basis & Selection Rules */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 'var(--space-sm)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                <div>
                  <div style={{ color: 'var(--color-optical)', fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px' }}>
                    Spherical Tensor Basis Relative to <MathView math="\hat{z}" displayMode={false} />:
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    <div style={{ margin: '4px 0' }}>
                      <MathView math="\hat{\epsilon}_{\pm 1} = \mp \frac{1}{\sqrt{2}}(\hat{x} \pm i\hat{y}), \qquad \hat{\epsilon}_0 = \hat{z}" displayMode={false} />
                    </div>
                    By the Wigner-Eckart theorem, <MathView math="\langle F', m_F' | d_q | F, m_F \rangle \neq 0" displayMode={false} /> only when <MathView math="\Delta m_F = q" displayMode={false} />:
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                      <li><strong style={{ color: 'var(--color-text-primary)' }}>π (q = 0, Δm_F = 0):</strong> Driven by <MathView math="\mathbf{E} \parallel \hat{z}" displayMode={false} />.</li>
                      <li><strong style={{ color: 'var(--color-magnetic)' }}>σ⁺ (q = +1, Δm_F = +1):</strong> Driven by <MathView math="\mathbf{E}" displayMode={false} /> rotating <strong style={{ color: 'var(--color-text-primary)' }}>Clockwise (CW)</strong> in the transverse plane viewed from the source looking along <MathView math="+\hat{z}" displayMode={false} /> (Right-Hand Rule thumb along <MathView math="+\hat{z}" displayMode={false} />).</li>
                      <li><strong style={{ color: 'var(--color-rf)' }}>σ⁻ (q = -1, Δm_F = -1):</strong> Driven by <MathView math="\mathbf{E}" displayMode={false} /> rotating <strong style={{ color: 'var(--color-text-primary)' }}>Counter-Clockwise (CCW)</strong> in the transverse plane viewed from the source looking along <MathView math="+\hat{z}" displayMode={false} /> (Right-Hand Rule thumb along <MathView math="-\hat{z}" displayMode={false} />).</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-laser)', fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px' }}>
                    Critical Distinction: Beam Helicity vs. Transition Projection
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    <MathView math="\sigma^+" displayMode={false} />, <MathView math="\sigma^-" displayMode={false} />, and <MathView math="\pi" displayMode={false} /> are <strong style={{ color: 'var(--color-text-primary)' }}>not</strong> intrinsic properties of a laser beam; they describe the geometric projection of <MathView math="\mathbf{E}" displayMode={false} /> onto a chosen quantization axis <MathView math="\hat{z}" displayMode={false} />. Conversely, optical handedness (RHC/LHC) and photon helicity (<MathView math="\hat{s}_{\text{photon}} = \pm\hat{k}" displayMode={false} />) are invariant properties relative to wavevector <MathView math="\mathbf{k}" displayMode={false} />.
                    <div style={{ marginTop: '6px', padding: '6px 8px', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xs)', borderLeft: '2px solid var(--color-laser)' }}>
                      <strong>Directional Rule:</strong> If <MathView math="\hat{k} \parallel +\hat{z}" displayMode={false} />, RHC (+1 helicity) drives <MathView math="\sigma^+" displayMode={false} />. If <MathView math="\hat{k} \parallel -\hat{z}" displayMode={false} /> (such as a retro-reflected beam without a waveplate), that exact same beam drives <MathView math="\sigma^-" displayMode={false} /> because its rotation sense is reversed relative to <MathView math="+\hat{z}" displayMode={false} />!
                    </div>
                  </div>
                </div>
              </div>

              {/* B. Arbitrary Angle Projections Table */}
              <div>
                <div style={{ color: 'var(--color-optical)', fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px' }}>
                  Arbitrary Angle Transition Fractions (<MathView math="\theta = \angle(\hat{k}, \hat{z})" displayMode={false} /> with <MathView math="\hat{z} \parallel \mathbf{B}" displayMode={false} />)
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11px',
                      textAlign: 'left',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-bg-input)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Laser Polarization (Relative to <MathView math="\hat{k}" displayMode={false} />)</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Angle <MathView math="\theta" displayMode={false} /></th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-magnetic)' }}><MathView math="\sigma^+" displayMode={false} /> Fraction (<MathView math="I_{\sigma^+}/I_0" displayMode={false} />)</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-laser)' }}><MathView math="\pi" displayMode={false} /> Fraction (<MathView math="I_\pi/I_0" displayMode={false} />)</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-rf)' }}><MathView math="\sigma^-" displayMode={false} /> Fraction (<MathView math="I_{\sigma^-}/I_0" displayMode={false} />)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: 'var(--color-laser)' }}>Circular (<MathView math="\hat{s} \parallel +\hat{k}" displayMode={false} />, RHC)</td>
                        <td style={{ padding: '6px 10px' }}>Arbitrary <MathView math="\theta" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\frac{1}{4}(1 + \cos\theta)^2" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\frac{1}{2}\sin^2\theta" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\frac{1}{4}(1 - \cos\theta)^2" displayMode={false} /></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: 'var(--color-optical)' }}>Circular (<MathView math="\hat{s} \parallel -\hat{k}" displayMode={false} />, LHC)</td>
                        <td style={{ padding: '6px 10px' }}>Arbitrary <MathView math="\theta" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\frac{1}{4}(1 - \cos\theta)^2" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\frac{1}{2}\sin^2\theta" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\frac{1}{4}(1 + \cos\theta)^2" displayMode={false} /></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Linear (<MathView math="\mathbf{E}" displayMode={false} /> in <MathView math="\hat{k}\text{--}\hat{z}" displayMode={false} /> plane)</td>
                        <td style={{ padding: '6px 10px' }}>Arbitrary <MathView math="\theta" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\frac{1}{2}\cos^2\theta" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\sin^2\theta" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\frac{1}{2}\cos^2\theta" displayMode={false} /></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Linear (<MathView math="\mathbf{E} \perp \hat{k}\text{--}\hat{z}" displayMode={false} /> plane)</td>
                        <td style={{ padding: '6px 10px' }}>Any <MathView math="\theta" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }} className="font-mono">50%</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono">0% (Strictly forbidden)</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono">50%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Geometry Breakdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                {/* Longitudinal Geometry */}
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    borderLeft: '3px solid var(--color-laser)'
                  }}
                >
                  <div style={{ color: 'var(--color-laser)', fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '6px' }}>
                    A. Longitudinal Geometry (<MathView math="\vec{k} \parallel \vec{B},\; \theta = 0^\circ" displayMode={false} />)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    <li>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Co-propagating (<MathView math="\vec{B} \parallel +\hat{k}" displayMode={false} />)</strong>:
                      RHC delivers <MathView math="+\hbar" displayMode={false} /> along <MathView math="\hat{B}" displayMode={false} />, driving <MathView math="\Delta m_F = +1\ (\sigma^+)" displayMode={false} />. LHC drives <MathView math="\Delta m_F = -1\ (\sigma^-)" displayMode={false} />.
                    </li>
                    <li>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Counter-propagating (<MathView math="\vec{B} \parallel -\hat{k}" displayMode={false} />)</strong>:
                      RHC propagates against <MathView math="\vec{B}" displayMode={false} />, delivering <MathView math="-\hbar" displayMode={false} /> along <MathView math="\hat{B}" displayMode={false} /> and driving <MathView math="\Delta m_F = -1\ (\sigma^-)" displayMode={false} />! LHC drives <MathView math="\Delta m_F = +1\ (\sigma^+)" displayMode={false} />.
                    </li>
                    <li>
                      <strong style={{ color: 'var(--color-rf)' }}>Forbidden π Transitions</strong>:
                      Because vacuum EM waves are transverse (<MathView math="\vec{E} \perp \vec{k}" displayMode={false} />), <MathView math="\vec{E} \cdot \hat{B} = 0" displayMode={false} />. Pure <MathView math="\pi" displayMode={false} /> transitions (<MathView math="\Delta m_F = 0" displayMode={false} />) are <strong style={{ color: 'var(--color-rf)' }}>strictly forbidden</strong> in longitudinal propagation.
                    </li>
                  </ul>
                </div>

                {/* Transverse Geometry */}
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--color-bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    borderLeft: '3px solid var(--color-magnetic)'
                  }}
                >
                  <div style={{ color: 'var(--color-magnetic)', fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '6px' }}>
                    B. Transverse Geometry (<MathView math="\vec{k} \perp \vec{B},\; \theta = 90^\circ" displayMode={false} />)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    <li>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Linear with <MathView math="\vec{E} \parallel \vec{B}" displayMode={false} /></strong>:
                      Electric field oscillates parallel to the quantization axis, driving pure <strong style={{ color: 'var(--color-text-primary)' }}>π transitions (<MathView math="\Delta m_F = 0" displayMode={false} />)</strong>.
                    </li>
                    <li>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Linear with <MathView math="\vec{E} \perp \vec{B}" displayMode={false} /></strong>:
                      Decomposes as <MathView math="\frac{1}{\sqrt{2}}(|\sigma^+\rangle - |\sigma^-\rangle)" displayMode={false} />. Drives an equal 50% / 50% coherent superposition of <MathView math="\sigma^+" displayMode={false} /> and <MathView math="\sigma^-" displayMode={false} /> transitions with zero <MathView math="\pi" displayMode={false} />.
                    </li>
                    <li>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Circular Light (RHC / LHC)</strong>:
                      Does <strong style={{ color: 'var(--color-text-primary)' }}>NOT</strong> drive pure <MathView math="\sigma^\pm" displayMode={false} />! The rotating <MathView math="\vec{E}" displayMode={false} /> field contains both parallel and perpendicular projections to <MathView math="\vec{B}" displayMode={false} />, driving 50% <MathView math="\pi" displayMode={false} />, 25% <MathView math="\sigma^+" displayMode={false} />, and 25% <MathView math="\sigma^-" displayMode={false} />.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Quick Transition Reference Table */}
              <div>
                <div style={{ color: 'var(--color-laser)', fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px' }}>
                  Laboratory Transition Reference Table
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11px',
                      textAlign: 'left',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-bg-input)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Laser Polarization</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Geometry (<MathView math="\vec{k}" displayMode={false} /> vs <MathView math="\vec{B}" displayMode={false} />)</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Photon Helicity</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Transition (<MathView math="\Delta m_F" displayMode={false} />)</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Spectroscopic Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: 'var(--color-laser)' }}>RHC (|R⟩)</td>
                        <td style={{ padding: '6px 10px' }}><MathView math="\vec{B} \parallel +\hat{k}" displayMode={false} /> (Co-propagating)</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono">+1 (+ħ)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-magnetic)', fontWeight: 'bold' }}>+1 (σ⁺)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Optical pumping to highest <MathView math="m_F" displayMode={false} /> state</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: 'var(--color-optical)' }}>LHC (|L⟩)</td>
                        <td style={{ padding: '6px 10px' }}><MathView math="\vec{B} \parallel +\hat{k}" displayMode={false} /> (Co-propagating)</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono">-1 (-ħ)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-rf)', fontWeight: 'bold' }}>-1 (σ⁻)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Optical pumping to lowest <MathView math="m_F" displayMode={false} /> state</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: 'var(--color-laser)' }}>RHC (|R⟩)</td>
                        <td style={{ padding: '6px 10px' }}><MathView math="\vec{B} \parallel -\hat{k}" displayMode={false} /> (Counter-propagating)</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono">+1 (+ħ)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-rf)', fontWeight: 'bold' }}>-1 (σ⁻)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Helicity opposes B-field direction</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: 'var(--color-optical)' }}>LHC (|L⟩)</td>
                        <td style={{ padding: '6px 10px' }}><MathView math="\vec{B} \parallel -\hat{k}" displayMode={false} /> (Counter-propagating)</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono">-1 (-ħ)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-magnetic)', fontWeight: 'bold' }}>+1 (σ⁺)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Helicity aligns with B-field direction</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Linear <MathView math="\vec{E} \parallel \vec{B}" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }}><MathView math="\vec{k} \perp \vec{B}" displayMode={false} /> (Transverse)</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono">0</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-laser)', fontWeight: 'bold' }}>0 (π)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Pure clock transitions / Zeeman-insensitive</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Linear <MathView math="\vec{E} \perp \vec{B}" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px' }}><MathView math="\vec{k} \perp \vec{B}" displayMode={false} /> (Transverse)</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono">0</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-primary)' }}>50% σ⁺ + 50% σ⁻</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Coherent equal superposition, strictly zero π</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* C. Defining the Quantization Axis: Zero-Field Physics & Competing Rates */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ color: 'var(--color-laser)', fontWeight: 'bold', fontSize: 'var(--font-size-xs)' }}>
                  3. Defining the Quantization Axis: Physics vs. Math
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Quantum mechanics is strictly basis-independent: you can define <MathView math="\hat{z}" displayMode={false} /> along any direction in the laboratory provided you track off-diagonal coherences <MathView math="\rho_{m, m'}" displayMode={false} /> in the density matrix. A <em>physically natural</em> quantization axis is one where the dominant interaction Hamiltonian is diagonal.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-sm)', marginTop: '4px' }}>
                  <div style={{ padding: '8px 10px', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xs)' }}>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xs)' }}>In the Lack of an External Field (B = 0):</strong>
                    <p style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                      All <MathView math="(2F+1)" displayMode={false} /> magnetic sublevels are degenerate in energy. Without a magnetic field to break rotational symmetry, the <strong>laser's own symmetry axis defines the natural quantization axis</strong>:
                    </p>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <li>Single linear beam: choose <MathView math="\hat{z} \parallel \mathbf{E} \implies" displayMode={false} /> pure π (<MathView math="\Delta m_F = 0" displayMode={false} />).</li>
                      <li>Single circular beam: choose <MathView math="\hat{z} \parallel \hat{k} \implies" displayMode={false} /> pure <MathView math="\sigma^+" displayMode={false} /> or <MathView math="\sigma^-" displayMode={false} />.</li>
                      <li>Unpolarized atoms absorb any polarization with equal total cross-section (Wigner-Eckart completeness).</li>
                    </ul>
                  </div>

                  <div style={{ padding: '8px 10px', backgroundColor: 'var(--color-bg-base)', borderRadius: 'var(--radius-xs)' }}>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xs)' }}>When Does the B-Field Define the Axis? (Competing Energy Scales):</strong>
                    <p style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                      Compare the Larmor frequency <MathView math="\omega_L = |g_F \mu_B B| / \hbar" displayMode={false} /> against physical rates:
                    </p>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <li>
                        <strong>Optical Pumping vs. Larmor Precession (<MathView math="\omega_L" displayMode={false} /> vs <MathView math="\gamma_{\text{pump}}" displayMode={false} />):</strong> On Type-II transitions (<MathView math="F \ge F'" displayMode={false} />), atoms pump into coherent dark states. If <MathView math="\omega_L \ll \gamma_{\text{pump}}" displayMode={false} />, laser polarization defines the axis, atoms trap in dark states, and scattering extinguishes (<em>zero-field Hanle dip</em>). If <MathView math="\omega_L \sim \gamma_{\text{pump}}" displayMode={false} />, Larmor precession remixes dark states into bright states, restoring maximum scattering.
                      </li>
                      <li>
                        <strong>Zeeman Resolution (<MathView math="\Delta\omega_Z" displayMode={false} /> vs <MathView math="\Gamma" displayMode={false} />):</strong> If <MathView math="\Delta\omega_Z \ll \Gamma" displayMode={false} />, lines overlap and light drives coherent superpositions. If <MathView math="\Delta\omega_Z \gtrsim \Gamma\sqrt{1+s}" displayMode={false} />, pathways are spectrally resolved along <MathView math="\mathbf{B}" displayMode={false} />.
                      </li>
                      <li>
                        <strong>Lab Stray Fields:</strong> Residual fields (<MathView math="B_{\text{stray}} \sim 10\text{--}100\text{ mG}" displayMode={false} />) cause uncontrolled precession. Experimentalists routinely apply a deliberate bias/guide field (<MathView math="0.5\text{--}5\text{ G}" displayMode={false} />) to pin <MathView math="\hat{z}" displayMode={false} />.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* D. Atomic vs. Diatomic Molecular Nuances */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  borderLeft: '3px solid var(--color-preset)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ color: 'var(--color-preset)', fontWeight: 'bold', fontSize: 'var(--font-size-xs)' }}>
                  4. Atomic vs. Diatomic Molecular Nuances
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  <li>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Mandatory Type-II Cycling:</strong> To prevent rotational branching into <MathView math="N''=2" displayMode={false} />, molecular cycling must drive <MathView math="N''=1 \to N'=0" displayMode={false} /> (or <MathView math="J'' \ge J'" displayMode={false} />). This enforces an <MathView math="F'' \ge F'" displayMode={false} /> structure where dark states <em>always form</em> in zero field.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--color-text-primary)' }}>¹Σ Nuclear Magneton vs. ²Σ Bohr Magneton:</strong> Radical molecules (CaF, SrF, <MathView math="^2\Sigma" displayMode={false} />) have an unpaired electron spin (<MathView math="g_F \sim 1\,\mu_B" displayMode={false} />), so a few Gauss yields <MathView math="\omega_L/2\pi \sim \text{MHz}" displayMode={false} />, readily remixing dark states. In contrast, closed-shell molecules (AlCl, <MathView math="^1\Sigma" displayMode={false} />) have <MathView math="S=0, \Lambda=0" displayMode={false} /> in the ground state; their magnetic moment is purely nuclear (<MathView math="\mu_N \approx \mu_B/1836" displayMode={false} />). A static field of a few Gauss yields only <em>kHz</em> precession—far too slow to remix dark states against a ~25 MHz optical pumping rate! In AlCl, ground-state dark states must be destabilized using polarization switching (EOMs), multi-angle beams, or RF/microwave coupling rather than static B-fields.
                  </li>
                </ul>
              </div>

              {/* E. Summary: Which Axis Dominates? Table */}
              <div>
                <div style={{ color: 'var(--color-laser)', fontWeight: 'bold', fontSize: 'var(--font-size-xs)', marginBottom: '4px' }}>
                  5. Summary: Which Quantization Axis Dominates?
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11px',
                      textAlign: 'left',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-bg-input)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Physical Regime</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Rate Inequality</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Dominant Quantization Axis</th>
                        <th style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Physical Consequence</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Zero / Ultra-Weak Field</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\omega_L \ll \gamma_{\text{pump}},\; \Delta E_{\text{AC}}/\hbar" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-optical)', fontWeight: 'bold' }}>Local Laser Polarization (<MathView math="\hat{z} \parallel \mathbf{E}" displayMode={false} /> or <MathView math="\hat{k}" displayMode={false} />)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Rapid optical pumping into dark states (Type-II) or stretched states (Type-I). Hanle extinction.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Hanle / Remixing Field</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\omega_L \sim \gamma_{\text{pump}},\; \Delta\omega_Z < \Gamma" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-magnetic)', fontWeight: 'bold' }}>Competing (<MathView math="\mathbf{B}" displayMode={false} /> vs. <MathView math="\mathbf{E}" displayMode={false} />)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Larmor precession remixes dark states into bright states; maximum scattering on Type-II lines.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>High-Field / Zeeman Resolved</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\Delta\omega_Z \gtrsim \Gamma\sqrt{1+s}" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-laser)', fontWeight: 'bold' }}>External Magnetic Field (<MathView math="\hat{z} \parallel \mathbf{B}" displayMode={false} />)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Individual Zeeman lines spectrally resolved; rate equations in B-basis valid.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>MOT Quadrupole Zero</td>
                        <td style={{ padding: '6px 10px' }} className="font-mono"><MathView math="\omega_L(r) < v/r" displayMode={false} /></td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-rf)', fontWeight: 'bold' }}>Fixed Laboratory Frame (<MathView math="\hat{z}_{\text{lab}}" displayMode={false} />)</td>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>Spins cannot adiabatically follow rotating B-field; non-adiabatic / Majorana transitions occur.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Waveplate Crystal Axis Conventions */}
            <div
              style={{
                borderTop: '1px solid var(--color-border-subtle)',
                paddingTop: 'var(--space-sm)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>4. Waveplate Retardance & Fast Axis:</strong> A birefringent waveplate has a <em>Fast axis</em> (lower refractive index <MathView math="n_{\text{fast}} < n_{\text{slow}}" displayMode={false} />) where light experiences less phase delay, advancing its phase relative to the <em>Slow axis</em>.
              Passing horizontal light <MathView math="|H\rangle" displayMode={false} /> through a Quarter-Wave Plate (QWP) with its Fast axis set at <MathView math="+45^\circ" displayMode={false} /> produces pure Right Circular light <MathView math="|R\rangle\ (\text{Helicity } +1)" displayMode={false} />.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
