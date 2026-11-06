import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LaserBeamConverter } from '../modules/LaserBeamConverter';
import { PolarizationBench } from '../modules/polarization/PolarizationBench';
import { SettingsProvider } from '../../context/SettingsContext';
import { PresetProvider } from '../../context/PresetContext';
import { HistoryProvider } from '../../context/HistoryContext';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SettingsProvider>
    <PresetProvider>
      <HistoryProvider>{children}</HistoryProvider>
    </PresetProvider>
  </SettingsProvider>
);

describe('Laser Polarization Bench Integration', () => {
  it('renders both modes in LaserBeamConverter toggle and switches to Laser Polarization Bench', () => {
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    // Verify mode buttons exist
    const abcdTab = screen.getByRole('button', { name: /ABCD Beam Propagation/i });
    const polTab = screen.getByRole('button', { name: /Laser Polarization/i });

    expect(abcdTab).toBeInTheDocument();
    expect(polTab).toBeInTheDocument();

    // Click on Laser Polarization
    fireEvent.click(polTab);

    // Verify Polarization bench components render
    expect(screen.getByText(/Input Polarization State/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Optical Beamline$/i })).toBeInTheDocument();
    expect(screen.getByText(/Transverse Electric Field Ellipse/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Poincaré Sphere/i })).toBeInTheDocument();
    expect(screen.getByText(/AMO Physics Handedness & Phase Convention/i)).toBeInTheDocument();
  });

  it('updates polarization state when clicking standard AMO quick presets', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Look for preset button |R⟩ RHC
    const sigmaPlusBtn = screen.getByRole('button', { name: /\|R⟩ RHC/i });
    expect(sigmaPlusBtn).toBeInTheDocument();

    fireEvent.click(sigmaPlusBtn);

    // Verify input fields update to reflect sigma+ (Ellipticity chi = 45°)
    const chiInput = screen.getByDisplayValue('45.00');
    expect(chiInput).toBeInTheDocument();
  });

  it('allows adding and removing optics on the optical rail', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Open Add Optic menu
    const addOpticBtn = screen.getByRole('button', { name: /Add Optic/i });
    fireEvent.click(addOpticBtn);

    // Click to add a Linear Polarizer
    const addPolItem = screen.getByText(/Linear Polarizer/i);
    fireEvent.click(addPolItem);

    // Verify new element was added
    const polItems = screen.getAllByText(/Linear Polarizer 1/i);
    expect(polItems.length).toBeGreaterThanOrEqual(1);
  });

  it('toggles the AMO Physics Handedness & Phase Convention details', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Toggle button
    const toggleBtn = screen.getByRole('button', { name: /Show Convention Guide/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Helicity & Right-Hand Rule in AMO Labs/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Hide Details/i }));
    expect(screen.queryByText(/Helicity & Right-Hand Rule in AMO Labs/i)).not.toBeInTheDocument();
  });

  it('switches inspected stage when clicking a stage monitor', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Initial stage is Stage 0 (Input)
    expect(screen.getByText(/Stage 0 \(Input\) Diagnostics/i)).toBeInTheDocument();

    // Add an optic to the beamline
    const addOpticBtn = screen.getByRole('button', { name: /Add Optic/i });
    fireEvent.click(addOpticBtn);
    const addPolItem = screen.getByText(/Linear Polarizer/i);
    fireEvent.click(addPolItem);

    // Click Stage 1 monitor on the beamline
    const stage1Elements = screen.getAllByText('Stage 1');
    fireEvent.click(stage1Elements[0]);

    // Diagnostics updates to Stage 1
    expect(screen.getByText(/Stage 1 Diagnostics: Linear Polarizer 1/i)).toBeInTheDocument();

    // Click back to Stage 0 (Input) monitor
    const inputStages = screen.getAllByText('Stage 0 (Input)');
    fireEvent.click(inputStages[0]);
    expect(screen.getByText(/Stage 0 \(Input\) Diagnostics/i)).toBeInTheDocument();
  });

  it('displays PBS Reflected Port diagnostics and power readout when PBS is in the optical train', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Open Presets menu and select Variable Attenuator (HWP + PBS)
    const trainsBtn = screen.getByRole('button', { name: /Optical Trains/i });
    fireEvent.click(trainsBtn);

    const attenuatorPreset = screen.getByText(/HWP \+ PBS Variable Attenuator/i);
    fireEvent.click(attenuatorPreset);

    // Click on Stage 2 (PBS) on the beamline rail
    const stage2Elements = screen.getAllByText('Stage 2');
    fireEvent.click(stage2Elements[0]);

    // Verify PBS Reflected Port diagnostics appears
    expect(screen.getByText(/PBS Reflected Port \(s-polarization orthogonal arm\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Power Conservation:/i)).toBeInTheDocument();
  });

  it('renders Extinction Ratio on Linear Polarizer and allows editing', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Add a Linear Polarizer
    const addOpticBtn = screen.getByRole('button', { name: /Add Optic/i });
    fireEvent.click(addOpticBtn);
    const addPolItem = screen.getByText(/Linear Polarizer/i);
    fireEvent.click(addPolItem);

    // Look for Ext Ratio input
    const extLabel = screen.getByText(/Ext Ratio:/i);
    expect(extLabel).toBeInTheDocument();

    const extInput = screen.getByDisplayValue('0.00001');
    expect(extInput).toBeInTheDocument();

    fireEvent.change(extInput, { target: { value: '0.001' } });
    expect(screen.getByDisplayValue('0.001')).toBeInTheDocument();
  });

  it('preserves draft values while user is focused and typing in 5-way converter', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Find Azimuth input by aria-label
    const azimuthInput = screen.getByLabelText(/Azimuth psi/i);
    expect(azimuthInput).toBeInTheDocument();

    // Focus and type partial string '1.'
    fireEvent.focus(azimuthInput);
    fireEvent.change(azimuthInput, { target: { value: '1.' } });

    // Ensure it was NOT instantly overwritten with '1.0000'
    expect(azimuthInput).toHaveValue('1.');

    // Blur field
    fireEvent.blur(azimuthInput);
    // After blur it should format cleanly to fixed digits
    expect(azimuthInput).toHaveValue('1.00');
  });

  it('resets viewMode back to abcd when hash changes to #laser', () => {
    window.location.hash = '#laser-polarization';
    render(
      <TestWrapper>
        <LaserBeamConverter />
      </TestWrapper>
    );

    expect(screen.getByText(/Polarization & Waveplate Beamline/i)).toBeInTheDocument();

    // Simulate navigation to #laser
    act(() => {
      window.location.hash = '#laser';
      fireEvent(window, new HashChangeEvent('hashchange'));
    });

    // Should switch back to ABCD simulator
    expect(screen.getByText(/ABCD Matrix Gaussian Beam Simulator/i)).toBeInTheDocument();
  });

  it('switches Electric Field Visualizer between 2D Ellipse and 3D Propagating Wave view', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Initial 2D view title
    expect(screen.getByText(/Transverse Electric Field Ellipse/i)).toBeInTheDocument();

    // Click 3D Wave toggle button
    const wave3dBtn = screen.getByRole('button', { name: /3D Wave/i });
    expect(wave3dBtn).toBeInTheDocument();
    fireEvent.click(wave3dBtn);

    // Verify 3D Propagating Wave card and elements
    expect(screen.getByText(/3D Propagating Wave/i)).toBeInTheDocument();
    expect(screen.getByText(/Laser Source \(\+z →\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Screen \(z = L\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Screen Face-On \(2D\)/i)).toBeInTheDocument();

    // Verify camera angle presets
    expect(screen.getByRole('button', { name: /3D Lab View/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Top \(Ex\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Side \(Ey\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Face-On/i })).toBeInTheDocument();

    // Switch back to 2D view
    const ellipse2dBtn = screen.getByRole('button', { name: /2D Ellipse/i });
    fireEvent.click(ellipse2dBtn);
    expect(screen.getByText(/Transverse Electric Field Ellipse/i)).toBeInTheDocument();
  });

  it('displays Right-Hand Rule Clockwise (CW) rotation for RHC', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Select R preset for input beam
    const sigmaPlusBtn = screen.getByRole('button', { name: /\|R⟩ RHC/i });
    fireEvent.click(sigmaPlusBtn);

    // Select Stage 0 (Input) stage to inspect the RHC state in the visualizer
    const inputStageBtns = screen.getAllByText('Stage 0 (Input)');
    fireEvent.click(inputStageBtns[0]);

    // Verify CW indicator in telemetry overlay
    expect(screen.getByText(/RHC \(CW\)/i)).toBeInTheDocument();

    // Expand convention guide and verify CW rule explanation
    const showGuideBtn = screen.getByRole('button', { name: /Show Convention Guide/i });
    fireEvent.click(showGuideBtn);
    expect(screen.getByText(/Clockwise \(CW\) rotation looking along \+z/i)).toBeInTheDocument();
    expect(screen.getByText(/Your right-hand fingers curl/i)).toBeInTheDocument();
  });

  it('auto-scales electric field vector ellipse without requiring manual scale mode toggle', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Ensure scale mode toggle button was removed from 2D ellipse and 3D visualizers
    expect(screen.queryByRole('button', { name: /Power-Relative/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Auto-Fit/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/100% P₀ Reference/i)).not.toBeInTheDocument();

    // Verify canvas renders SVG ellipse with auto-scaled dimensions
    const ellipseSvg = document.querySelector('svg');
    expect(ellipseSvg).toBeInTheDocument();
  });

  it('renders simplified PBS mount with clean optic axis line matching waveplates without prism cube or p/s labels', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Add a PBS
    const addOpticBtn = screen.getByRole('button', { name: /Add Optic/i });
    fireEvent.click(addOpticBtn);
    const addPbsItem = screen.getByText(/Polarizing Beam Splitter/i);
    fireEvent.click(addPbsItem);

    // Ensure p and s indicators and split arrows are NOT present in the SVG texts
    const svgTexts = Array.from(document.querySelectorAll('text')).map(t => t.textContent?.trim());
    expect(svgTexts).not.toContain('p');
    expect(svgTexts).not.toContain('s');

    // Verify optic axis line is rendered on the mount SVG
    const svgLines = Array.from(document.querySelectorAll('line'));
    expect(svgLines.length).toBeGreaterThan(0);
  });

  it('allows freely clearing and editing angle text box without snapping back', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Add a Half-Wave Plate
    const addOpticBtn = screen.getByRole('button', { name: /Add Optic/i });
    fireEvent.click(addOpticBtn);
    const addHwpItem = screen.getByText(/Half-Wave Plate/i);
    fireEvent.click(addHwpItem);

    // Find the Angle input (default 0 for HWP)
    const angleInput = screen.getByLabelText(/Angle for Half-Wave Plate/i);
    expect(angleInput).toBeInTheDocument();
    expect(angleInput).toHaveValue('0');

    // Focus and clear the input completely (empty string)
    fireEvent.focus(angleInput);
    fireEvent.change(angleInput, { target: { value: '' } });
    expect(angleInput).toHaveValue('');

    // Type a new value, e.g. -22.5
    fireEvent.change(angleInput, { target: { value: '-22.5' } });
    expect(angleInput).toHaveValue('-22.5');

    // Blur to commit
    fireEvent.blur(angleInput);
    expect(screen.getByDisplayValue('-22.5')).toBeInTheDocument();
  });

  it('initializes with empty beamline and allows clearing beamline', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Check empty state message
    expect(screen.getByText(/Beamline is empty/i)).toBeInTheDocument();
    // Ensure no "Add Quarter-Wave Plate" button in empty state
    expect(screen.queryByRole('button', { name: /Add Quarter-Wave Plate/i })).not.toBeInTheDocument();

    // Add an optic
    const addOpticBtn = screen.getByRole('button', { name: /Add Optic/i });
    fireEvent.click(addOpticBtn);
    const addHwpItem = screen.getByText(/Half-Wave Plate/i);
    fireEvent.click(addHwpItem);
    expect(screen.getAllByText(/Stage 1/i).length).toBeGreaterThanOrEqual(1);

    // Click "Clear Beamline"
    const clearBtn = screen.getByRole('button', { name: /Clear Beamline/i });
    fireEvent.click(clearBtn);

    // Back to empty state
    expect(screen.getByText(/Beamline is empty/i)).toBeInTheDocument();
  });

  it('allows collapsing and expanding cards via chevron button', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Find chevron collapse buttons (aria-label="Collapse section")
    const collapseButtons = screen.getAllByRole('button', { name: /Collapse section/i });
    expect(collapseButtons.length).toBeGreaterThan(0);

    // Click the first collapsible card's chevron
    fireEvent.click(collapseButtons[0]);

    // The button label changes to "Expand section"
    expect(screen.getAllByRole('button', { name: /Expand section/i }).length).toBeGreaterThanOrEqual(1);

    // Click again to expand
    const expandButtons = screen.getAllByRole('button', { name: /Expand section/i });
    fireEvent.click(expandButtons[0]);
    expect(screen.getAllByRole('button', { name: /Collapse section/i }).length).toBe(collapseButtons.length);
  });

  it('aligns all 4 converter panels with uniform label and input heights for baseline alignment', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // All converter inputs have aria-labels
    const e0xInput = screen.getByLabelText(/E0x Amplitude/i);
    const s0Input = screen.getByLabelText(/Stokes S0 Power/i);
    const psiInput = screen.getByLabelText(/Azimuth psi/i);
    const longInput = screen.getByLabelText(/Poincare Longitude 2psi/i);

    expect(e0xInput).toBeInTheDocument();
    expect(s0Input).toBeInTheDocument();
    expect(psiInput).toBeInTheDocument();
    expect(longInput).toBeInTheDocument();

    // Verify inputs have 32px height style
    expect(e0xInput.style.height).toBe('32px');
    expect(s0Input.style.height).toBe('32px');
    expect(psiInput.style.height).toBe('32px');
    expect(longInput.style.height).toBe('32px');

    // Verify parent labels have uniform 34px height style
    const e0xLabel = e0xInput.previousElementSibling as HTMLElement;
    const s0Label = s0Input.previousElementSibling as HTMLElement;
    const psiLabel = psiInput.previousElementSibling as HTMLElement;
    const longLabel = longInput.previousElementSibling as HTMLElement;

    expect(e0xLabel.style.height).toBe('34px');
    expect(s0Label.style.height).toBe('34px');
    expect(psiLabel.style.height).toBe('34px');
    expect(longLabel.style.height).toBe('34px');
  });

  it('explicitly states Right-Hand Rule in convention quick summary bar and badges', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Verify explicit Right-Hand Rule in summary pill bar
    expect(
      screen.getByText(/Right-Hand Rule \(thumb \+z, curl CW\): Clockwise \(CW\) rotation looking along \+z/i)
    ).toBeInTheDocument();

    // Verify propagation geometry
    expect(screen.getByText(/Viewer at source, beam propagating along/i)).toBeInTheDocument();
  });

  it('rotates Poincare Sphere intuitively in 3D when dragging mouse and touch', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Initial Poincaré Sphere perspective badge: Azimuth: 35°, Elevation: 20°
    expect(screen.getByText(/Azimuth:/i)).toBeInTheDocument();
    expect(screen.getByText(/35°/i)).toBeInTheDocument();
    expect(screen.getByText(/20°/i)).toBeInTheDocument();

    const dragHint = screen.getByText(/Drag to rotate 3D sphere/i);
    const canvasContainer = dragHint.parentElement!;

    // Drag right (dx = +20) and down (dy = +10)
    fireEvent.mouseDown(canvasContainer, { clientX: 200, clientY: 200 });
    fireEvent.mouseMove(window, { clientX: 220, clientY: 210 });
    fireEvent.mouseUp(window);

    // Azimuth: 35 + 20*0.8 = 51°
    // Elevation: 20 + 10*0.8 = 28°
    expect(screen.getByText('51°')).toBeInTheDocument();
    expect(screen.getByText('28°')).toBeInTheDocument();

    // Touch drag left (dx = -10) and up (dy = -5)
    fireEvent.touchStart(canvasContainer, { touches: [{ clientX: 200, clientY: 200 }] });
    fireEvent.touchMove(canvasContainer, { touches: [{ clientX: 190, clientY: 195 }] });
    fireEvent.touchEnd(canvasContainer);

    // Azimuth: 51 + (-10)*0.8 = 43°
    // Elevation: 28 + (-5)*0.8 = 24°
    expect(screen.getByText('43°')).toBeInTheDocument();
    expect(screen.getByText('24°')).toBeInTheDocument();

    // Probe elevation clamping edge case: Drag down heavily (dy = +200) -> clamped at +85°
    fireEvent.mouseDown(canvasContainer, { clientX: 200, clientY: 200 });
    fireEvent.mouseMove(window, { clientX: 200, clientY: 400 });
    fireEvent.mouseUp(window);
    expect(screen.getByText('85°')).toBeInTheDocument();

    // Probe negative elevation clamping edge case: Drag up heavily (dy = -300) -> clamped at -85°
    fireEvent.mouseDown(canvasContainer, { clientX: 200, clientY: 200 });
    fireEvent.mouseMove(window, { clientX: 200, clientY: -100 });
    fireEvent.mouseUp(window);
    expect(screen.getByText('-85°')).toBeInTheDocument();

    // Touch cancel cleans up dragging state without mutating angles
    fireEvent.touchStart(canvasContainer, { touches: [{ clientX: 200, clientY: 200 }] });
    fireEvent.touchCancel(canvasContainer);

    // Click Reset View to return to initial perspective (Azimuth: 35°, Elevation: 20°)
    const resetViewBtn = screen.getByRole('button', { name: /Reset View/i });
    fireEvent.click(resetViewBtn);
    expect(screen.getByText('35°')).toBeInTheDocument();
    expect(screen.getByText('20°')).toBeInTheDocument();
  });

  it('rotates 3D Wave Propagator orbit intuitively when dragging', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Switch to 3D Wave Propagator view
    const wave3DBtn = screen.getByRole('button', { name: /3D Wave/i });
    fireEvent.click(wave3DBtn);

    // Initial lab view: Yaw: 25°, Pitch: 18°
    expect(screen.getByText(/Yaw: 25°, Pitch: 18°/i)).toBeInTheDocument();

    // Find the 3D SVG container
    const orbitBadge = screen.getByText(/Drag to Orbit/i);
    const svgContainer = orbitBadge.parentElement!.parentElement!;

    // Drag right (dx = +10) and down (dy = +10)
    fireEvent.mouseDown(svgContainer, { clientX: 300, clientY: 300 });
    fireEvent.mouseMove(window, { clientX: 310, clientY: 310 });
    fireEvent.mouseUp(window);

    // Yaw: 25 - 10*0.7 = 18° (foreground source pulls right)
    // Pitch: 18 + 10*0.7 = 25° (front surface tilts down smoothly)
    expect(screen.getByText(/Yaw: 18°, Pitch: 25°/i)).toBeInTheDocument();
  });

  it('renders numbered stage selector pills in PoincareSphereVisualizer and allows selecting stages', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Add an optic to create Stage 1
    const addOpticBtn = screen.getByRole('button', { name: /Add Optic/i });
    fireEvent.click(addOpticBtn);
    const addHwpItem = screen.getByText(/Half-Wave Plate/i);
    fireEvent.click(addHwpItem);

    // Verify stage selector pills in Poincaré Sphere section
    const stage0Pills = screen.getAllByRole('button', { name: /Stage 0 \(Input\)/i });
    const stage1Pills = screen.getAllByRole('button', { name: /Stage 1/i });

    // Both 2D visualizer and Poincaré Sphere should now have Stage 0 and Stage 1 pills
    expect(stage0Pills.length).toBeGreaterThanOrEqual(2);
    expect(stage1Pills.length).toBeGreaterThanOrEqual(2);

    // Click Stage 1 on Poincaré Sphere
    fireEvent.click(stage1Pills[1]);

    // Diagnostics updates to Stage 1
    expect(screen.getByText(/Stage 1 Diagnostics/i)).toBeInTheDocument();
  });

  it('commits angle on Enter key and defaults to 0 on empty blur', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Add an optic
    const addOpticBtn = screen.getByRole('button', { name: /Add Optic/i });
    fireEvent.click(addOpticBtn);
    const addHwpItem = screen.getByText(/Half-Wave Plate/i);
    fireEvent.click(addHwpItem);

    const angleInput = screen.getByLabelText(/Angle for Half-Wave Plate/i);

    // Focus and type -45 then press Enter
    fireEvent.focus(angleInput);
    fireEvent.change(angleInput, { target: { value: '-45' } });
    fireEvent.keyDown(angleInput, { key: 'Enter', code: 'Enter' });
    expect(angleInput).toHaveValue('-45');

    // Focus, clear completely to empty string, and blur
    fireEvent.focus(angleInput);
    fireEvent.change(angleInput, { target: { value: '' } });
    expect(angleInput).toHaveValue('');
    fireEvent.blur(angleInput);

    // Empty angle input defaults to 0 on blur
    expect(angleInput).toHaveValue('0');
  });

  it('toggles reference planes and isometric/perspective camera modes in 3D Wave Visualizer', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Switch to 3D Wave Propagator view
    const wave3DBtn = screen.getByRole('button', { name: /3D Wave/i });
    fireEvent.click(wave3DBtn);

    // Verify reference planes toggle is on by default and renders floor and wall labels
    const refPlanesCheckbox = screen.getByLabelText(/Ref Planes \(xz\/yz\)/i);
    expect(refPlanesCheckbox).toBeInTheDocument();
    expect(refPlanesCheckbox).toBeChecked();
    expect(screen.getByText(/\+x \(Table\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\+y \(Vert\)/i)).toBeInTheDocument();

    // Toggle reference planes off
    fireEvent.click(refPlanesCheckbox);
    expect(refPlanesCheckbox).not.toBeChecked();
    expect(screen.queryByText(/\+x \(Table\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+y \(Vert\)/i)).not.toBeInTheDocument();

    // Toggle back on
    fireEvent.click(refPlanesCheckbox);
    expect(screen.getByText(/\+x \(Table\)/i)).toBeInTheDocument();

    // Verify Perspective and Isometric projection buttons
    const perspectiveBtn = screen.getByRole('button', { name: /^Perspective$/i });
    const isometricBtn = screen.getByRole('button', { name: /^Isometric$/i });
    expect(perspectiveBtn).toBeInTheDocument();
    expect(isometricBtn).toBeInTheDocument();

    // Switch to Isometric view
    fireEvent.click(isometricBtn);
    // Switch back to Perspective view
    fireEvent.click(perspectiveBtn);
  });

  it('displays comprehensive Photon Helicity vs Atomic Transitions section in convention guide', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Open convention guide
    const showGuideBtn = screen.getByRole('button', { name: /Show Convention Guide/i });
    fireEvent.click(showGuideBtn);

    // Verify Section 3 header
    expect(
      screen.getByText(/3\. Photon Helicity vs\. Atomic Zeeman Transitions \(σ⁺, σ⁻, π\)/i)
    ).toBeInTheDocument();

    // Verify Longitudinal Geometry explanation & Forbidden pi transitions
    expect(screen.getByText(/A\. Longitudinal Geometry/i)).toBeInTheDocument();
    expect(screen.getByText(/Forbidden π Transitions/i)).toBeInTheDocument();

    // Verify Transverse Geometry explanation
    expect(screen.getByText(/B\. Transverse Geometry/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Linear with/i).length).toBeGreaterThanOrEqual(1);

    // Verify transition reference table
    expect(screen.getByText(/Spectroscopic Role/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Co-propagating/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Counter-propagating/i).length).toBeGreaterThanOrEqual(1);

    // Verify Quantization Axis, Arbitrary Angle, and Zero-Field subsections
    expect(screen.getByText(/Critical Distinction: Beam Helicity vs\. Transition Projection/i)).toBeInTheDocument();
    expect(screen.getByText(/Arbitrary Angle Transition Fractions/i)).toBeInTheDocument();
    expect(screen.getByText(/In the Lack of an External Field \(B = 0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Atomic vs\. Diatomic Molecular Nuances/i)).toBeInTheDocument();
    expect(screen.getByText(/Summary: Which Quantization Axis Dominates\?/i)).toBeInTheDocument();
  });

  it('renders clean RHC and LHC labels and Stokes s3 (RHC - LHC) parameter', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Verify clean s3 label in 5-way converter
    expect(screen.getByText(/s₃ \(RHC - LHC\):/i)).toBeInTheDocument();

    // Verify clean preset button labels
    expect(screen.getByRole('button', { name: /\|R⟩ RHC/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\|L⟩ LHC/i })).toBeInTheDocument();

    // Verify clean labels on Poincaré sphere
    expect(screen.getByText(/\+S₃ \(\|R⟩ RHC\)/i)).toBeInTheDocument();
    expect(screen.getByText('|R⟩ RHC')).toBeInTheDocument();
    expect(screen.getByText('|L⟩ LHC')).toBeInTheDocument();
  });

  it('initializes polarization with unit amplitude (1.0) and resets to unit power with Reset to |H⟩', () => {
    render(
      <TestWrapper>
        <PolarizationBench />
      </TestWrapper>
    );

    // Verify initial unit amplitude E0x = 1.0000, E0y = 0.0000, S0 = 1.0000 (not 3.1623 / 10.0000)
    const e0xInput = screen.getByLabelText('E0x Amplitude');
    const e0yInput = screen.getByLabelText('E0y Amplitude');
    const s0Input = screen.getByLabelText('Stokes S0 Power');

    expect(e0xInput).toHaveValue('1.0000');
    expect(e0yInput).toHaveValue('0.0000');
    expect(s0Input).toHaveValue('1.0000');

    // Change S0 power to 25.0
    fireEvent.change(s0Input, { target: { value: '25.0' } });
    expect(e0xInput).toHaveValue('5.0000');

    // Click Reset to |H⟩
    const resetHBtn = screen.getByRole('button', { name: /Reset to \|H⟩/i });
    fireEvent.click(resetHBtn);

    // Verify reset to unit power 1.0 mW
    expect(e0xInput).toHaveValue('1.0000');
    expect(e0yInput).toHaveValue('0.0000');
    expect(s0Input).toHaveValue('1.0000');

    // Verify Clear Beamline also preserves/resets unit power 1.0 mW
    fireEvent.change(s0Input, { target: { value: '4.0' } });
    expect(e0xInput).toHaveValue('2.0000');
    const clearBtn = screen.getByRole('button', { name: /Clear Beamline/i });
    fireEvent.click(clearBtn);
    expect(e0xInput).toHaveValue('1.0000');
    expect(s0Input).toHaveValue('1.0000');
  });
});

