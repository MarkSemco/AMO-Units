# 🗺️ Implementation Plan — AMO Units

## Overview & Execution Strategy

This implementation plan records the sequential development, testing, and mathematical validation of the AMO Units Progressive Web Application. Every phase has been fully implemented, rigorously tested against automated test suites, and verified in production builds.

---

## Phase 1: Project Scaffolding & Tooling

> Initialize the Vite + React + TypeScript repository, install base dependencies, configure TypeScript strict mode, and establish the folder structure.

- [x] **1.1 Initialize Vite React TS Project**:
  - Run Vite initialization in the current directory.
  - Dependencies: `lucide-react`, `mathjs`, `katex`, `vite-plugin-pwa`.
  - Dev dependencies: `typescript`, `@types/katex`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `happy-dom`.
- [x] **1.2 Configure TypeScript & Vite**:
  - Configure `tsconfig.json` (strict mode, path aliases `@/*` -> `src/*`).
  - Configure `vite.config.ts` with PWA plugin and manifest settings.
- [x] **1.3 Create Project Folder Hierarchy**:
  - Create directories: `src/assets`, `src/constants`, `src/core`, `src/core/error-prop`, `src/types`, `src/context`, `src/hooks`, `src/components`, `src/styles`.
- [x] **1.4 Verification**:
  - Run `npm run build` and verify clean compilation with 0 errors.

---

## Phase 2: Design Tokens & Base UI Primitives

> Implement CSS custom properties, global resets, and reusable atomic UI components.

- [x] **2.1 Implement CSS Design Tokens**:
  - Create `src/styles/tokens.css` with dark/light themes, domain colors (Cyan, Amber, Emerald, Fuchsia, Violet/Error-Prop, Blue), spacing, and font definitions.
  - Create `src/styles/global.css` with modern CSS resets, KaTeX local styling, and responsive rules.
- [x] **2.2 Create UI Primitives**:
  - Create `src/components/common/Button.tsx` (primary, secondary, ghost, icon variants).
  - Create `src/components/common/Card.tsx` (elevated surface container with category borders).
  - Create `src/components/common/ToggleGroup.tsx` (segmented controls for impedance and unit scales).
  - Create `src/components/common/Toast.tsx` (clipboard copy confirmation notification).
  - Create `src/components/common/Modal.tsx` (accessible dialog component with backdrop blur).
  - Create `src/components/common/MathView.tsx` (KaTeX LaTeX formula rendering wrapper with error boundary).
- [x] **2.3 Create Layout Components**:
  - Create `src/components/layout/Header.tsx` (title, precision selector, dark/light theme switch, PWA install pill).
  - Create `src/components/layout/TabNavigation.tsx` (top navigation tabs with category indicators: Optical, Magnetic, Laser/Rabi, RF, Error Prop, Presets, Formulas).
  - Create `src/components/layout/Footer.tsx` (CODATA 2022 attribution, offline status badge, shortcut hints).
- [x] **2.4 Verification**:
  - Verify layout renders responsively on both desktop and mobile viewports.

---

## Phase 3: Physical Constants & Math Engines

> Implement pure, strictly tested mathematical conversion engines using official CODATA 2022 values.

- [x] **3.1 CODATA 2022 & Formatting Utilities**:
  - Create `src/constants/codata2022.ts` with exact values for $c, h, \hbar, e, k_B, \mu_B, \mu_N, a_0, \epsilon_0, \mu_0, E_h$.
  - Create `src/core/formatters.ts` with precision-controlled formatter (4–10 sig figs), scientific notation thresholding, and SI prefix scaling.
  - Create `src/types/units.ts` for unit unions and conversion types.
- [x] **3.2 Optical & Energy Conversion Engine**:
  - Create `src/core/optical.ts`: Functions to convert bidirectionally between Wavelength ($\text{nm}, \mu\text{m}, \text{m}, \text{Å}$), Frequency ($\text{Hz}, \text{kHz}, \text{MHz}, \text{GHz}, \text{THz}$), Angular Frequency ($\text{rad/s}$), Energy ($\text{eV}, \text{meV}, \mu\text{eV}, \text{J}, E_h$), Wavenumber ($\text{cm}^{-1}, \text{m}^{-1}$), and Equivalent Temperature ($\text{K}, \text{mK}, \mu\text{K}, \text{nK}$).
  - Create unit tests in `src/core/__tests__/optical.test.ts`.
- [x] **3.3 Magnetic Field & Zeeman Splitting Engine**:
  - Create `src/core/zeeman.ts`: Gauss $\leftrightarrow$ Tesla conversions, Bohr magneton ($\mu_B$) frequency shift, Nuclear magneton ($\mu_N$) frequency shift, and arbitrary Landé $g$-factor with $m_F$ splitting.
  - Create unit tests in `src/core/__tests__/zeeman.test.ts`.
- [x] **3.4 Laser Beam & Rabi Frequency Engine**:
  - Create `src/core/laser-beam.ts`: Gaussian beam peak intensity $I_0 = 2P/(\pi w_0^2)$, Rayleigh range $z_R = \pi w_0^2/\lambda$, electric field $E_0 = \sqrt{2I/(c\epsilon_0)}$, Rabi frequency from dipole moment $\Omega = d \cdot E_0/\hbar$, Rabi frequency from saturation $\Omega = \Gamma \sqrt{I / (2 I_{\text{sat}})}$, and $\pi$-pulse duration.
  - Create unit tests in `src/core/__tests__/laser-beam.test.ts`.
- [x] **3.5 RF Power, Voltage, Attenuation & VSWR Engines**:
  - Create `src/core/rf-power.ts`: $\text{dBm} \leftrightarrow \text{Watts} \leftrightarrow \text{mW} \leftrightarrow V_{\text{rms}} \leftrightarrow V_{\text{pp}} \leftrightarrow V_{\text{peak}}$ at impedance $Z_0$; Attenuation $\text{dB} \leftrightarrow \text{Power Ratio} \leftrightarrow \text{Voltage Ratio}$.
  - Create `src/core/rf-vswr.ts`: $\text{VSWR} \leftrightarrow |\Gamma| \leftrightarrow \text{Return Loss (dB)} \leftrightarrow \text{Mismatch Loss (dB)} \leftrightarrow P_{\text{refl}}\% \leftrightarrow P_{\text{trans}}\%$.
  - Create unit tests in `src/core/__tests__/rf.test.ts`.
- [x] **3.6 Verification**:
  - Run `npm test` and verify that all mathematical engine unit tests pass with zero errors.

---

## Phase 4: Error Propagation Symbolic & Numeric Engine

> Implement 100% client-side symbolic differentiation, variable detection, LaTeX equation generation, and numerical uncertainty propagation.

- [x] **4.1 Expression Parser & Variable Detector**:
  - Create `src/core/error-prop/parser.ts`:
    - Parses input math string into an AST using `mathjs`.
    - Scans AST symbols to extract unique variables.
    - Filters out known constants (`pi`, `e`, `c`, `h`, `hbar`, `kB`, etc.).
    - Validates syntax and returns friendly error messages for malformed input.
- [x] **4.2 Symbolic Differentiator & LaTeX Generator**:
  - Create `src/core/error-prop/differentiator.ts`:
    - Computes analytical partial derivatives $\frac{\partial f}{\partial x_i}$ using `math.derivative`.
    - Simplifies derivative AST expressions (`math.simplify`) with protected logarithmic constants.
  - Create `src/core/error-prop/latex-generator.ts`:
    - Converts the nominal formula AST into LaTeX string.
    - Generates LaTeX for each individual partial derivative $\frac{\partial f}{\partial x_i}$.
    - Constructs the combined Gaussian error equation in LaTeX:
      $$\sigma_f = \sqrt{ \sum_i \left( \frac{\partial f}{\partial x_i} \sigma_{x_i} \right)^2 }$$
      (and includes correlation terms $2 \sum \frac{\partial f}{\partial x_i}\frac{\partial f}{\partial x_j}\text{Cov}(x_i, x_j)$ when covariance is enabled).
- [x] **4.3 Numeric Evaluator & Metrology Formatter**:
  - Create `src/core/error-prop/evaluator.ts`:
    - Evaluates $f(x_1, \dots, x_n)$ and partial derivative values given numeric inputs.
    - Computes combined uncertainty $\sigma_f$ with quadrature and optional covariance.
    - Implements ISO GUM metrology rounding (rounds uncertainty to 1-2 sig figs and value to the matching decimal place).
- [x] **4.4 Error Propagation Unit Tests**:
  - Create `src/core/__tests__/error-prop.test.ts`:
    - Test product rule ($f = x \cdot y$), quotient rule ($f = x / y$), power rule ($f = x^n$), and Gaussian beam formula ($f = 2P / (\pi w_0^2)$).
    - Test variable filtering and syntax error handling.
- [x] **4.5 Verification**:
  - Run `npm test` to confirm all symbolic and numeric error propagation tests pass.

---

## Phase 5: Interactive UI Modules & Tab Views

> Build the interactive converter modules and Error Propagation view using the Event-Driven Master Value pattern.

- [x] **5.1 SyncedInput Component with Copy & Formatting**:
  - Create `src/components/common/SyncedInput.tsx`:
    - Handles raw draft input without losing decimal points or typing state.
    - Category-colored focus glow and active state tracking.
    - Integrated copy button (raw value or value + unit string).
- [x] **5.2 Optical & Energy Converter View**:
  - Create `src/components/modules/OpticalConverter.tsx`:
    - Synchronized grid for Wavelength, Frequency, Angular Frequency, Energy, Wavenumber, and Temperature.
    - Default starting state: AlCl $261.5\,\text{nm}$ UV cycling line.
    - Compact unit pills with full names in dropdown.
- [x] **5.3 Magnetic Field & Zeeman Converter View**:
  - Create `src/components/modules/ZeemanConverter.tsx`:
    - Synchronized inputs for Field (Gauss, Tesla, mT, $\mu$T), frequency shift ($\text{kHz}, \text{MHz}, \text{GHz}$), and configurable $g$-factor / $m_F$ controls.
- [x] **5.4 Laser Beam & Rabi Frequency Converter View**:
  - Create `src/components/modules/LaserBeamConverter.tsx`:
    - Parameter inputs for Power, Waist radius, Wavelength.
    - Calculated outputs for Peak Intensity, Rayleigh range, and Rabi frequency (Saturation and Dipole modes).
- [x] **5.5 RF Electronics Converter View**:
  - Create `src/components/modules/RfElectronicsConverter.tsx`:
    - Impedance selector buttons ($50\,\Omega$, $75\,\Omega$, $1\,\text{M}\Omega$, custom input).
    - Power and Voltage synchronized grid ($\text{dBm}$, $\text{dBW}$, $\text{W}$, $\text{mW}$, $V_{\text{rms}}$, $V_{\text{pp}}$, $V_{\text{peak}}$, $\text{dB}\mu\text{V}$, $\text{dBmV}$).
    - Attenuation & Gain section ($\text{dB}$, $P_2/P_1$, $V_2/V_1$).
    - Scalar VSWR, Return Loss, and Mismatch Loss section.
- [x] **5.6 Error Propagation View**:
  - Create `src/components/modules/ErrorPropagationView.tsx`:
    - Blank formula input field with live syntax validation and example formulas.
    - Auto-detected variable checklist (`[x]` uncertain vs exact).
    - Rendered LaTeX equation display (`MathView.tsx`) showing analytical derivatives and full $\sigma_f$ equation.
    - Persistent analytical partial derivative substitution toggle in final equation (default: on).
    - "Copy LaTeX" and "Copy Result" buttons.
    - Numeric input table for $x_i$ and $\sigma_{x_i}$.
    - Computed result display ($f \pm \sigma_f$).
    - Expandable Covariance matrix for cross-correlations ($r_{ij}$).
- [x] **5.7 Verification & Pause Point**:
  - Tested live typing in every converter tab and verified error propagation equation generator.

---

## Phase 6: Atomic/Molecular Preset Engine & User Library

> Implement built-in datasets for cold molecules and atoms, alongside the user custom library stored in LocalStorage.

- [x] **6.1 Preset Data Catalog**:
  - Create `src/constants/default-presets.ts`:
    - **AlCl** (Daniel et al., PRA 2023; Liu et al., PRA 2025: $261.5\,\text{nm}$, $\Gamma/2\pi = 25.0\,\text{MHz}$, $I_{\text{sat}} = 232.0\,\text{mW/cm}^2$, $\mu_X = 1.68\,\text{D}$, $261.8/262.2\,\text{nm}$ repumps).
    - **CaF** (Hemmerling et al. 2016; Truppe et al. 2017: $531.0\,\text{nm}$ green slowing $\Gamma/2\pi = 6.3\,\text{MHz}, I_{\text{sat}} = 4.4\,\text{mW/cm}^2$; $606.3\,\text{nm}$ cooling $\Gamma/2\pi = 8.3\,\text{MHz}$, $I_{\text{sat}} = 4.9\,\text{mW/cm}^2$).
    - **AlF** (Truppe et al., PRA 2019: $227.5\,\text{nm}$, $\Gamma/2\pi = 84.0\,\text{MHz}$, $I_{\text{sat}} = 930.0\,\text{mW/cm}^2$, $\mu_X = 1.515\,\text{D}$).
    - **Rb-87 & Rb-85** (Steck Alkali Data / NIST: D2 $780.241\,\text{nm}$, D1 $794.979\,\text{nm}$, $\Gamma/2\pi = 6.067/5.750\,\text{MHz}$, $I_{\text{sat}} = 1.669/4.484\,\text{mW/cm}^2$).
    - **Cs-133** (Steck / SI Primary: D2 $852.347\,\text{nm}$, D1 $894.593\,\text{nm}$, $\Gamma/2\pi = 5.234/4.575\,\text{MHz}$, $I_{\text{sat}} = 1.102/2.498\,\text{mW/cm}^2$).
    - **Strontium (Sr-88/Sr-87)** (NIST ASD; Katori et al.; Boyd et al.; Ludlow et al. RMP 2015: Blue $460.862\,\text{nm}$, Red intercombination $689.449\,\text{nm}$, Clock $698.446\,\text{nm}$).
- [x] **6.2 Preset Context & LocalStorage Provider**:
  - Create `src/context/PresetContext.tsx`:
    - Loads default presets.
    - CRUD for custom user presets (add, edit, delete, export/import JSON).
    - "Apply Preset" action dispatching to active converter modules.
- [x] **6.3 Preset Library UI View**:
  - Create `src/components/modules/PresetLibraryView.tsx`:
    - Filterable cards by category (Molecules, Alkali Atoms, Alkaline-Earth Clocks, Custom).
    - "Load into Converter" quick action.
    - "Add Custom Preset" modal form.
- [x] **6.4 Verification**:
  - Selected AlCl, verified values load into Optical and Laser Beam/Rabi modules.
  - Created custom preset, verified persistence in LocalStorage.

---

## Phase 7: Lab Productivity & PWA Polish

> Add keyboard shortcuts, command palette (`Cmd+K`), formula inspector drawer, history tracking, and offline service worker caching.

- [x] **7.1 Formula & Constants Inspector View**:
  - Create `src/constants/formulas.ts` documenting exact equations.
  - Create `src/components/modules/FormulaInspectorView.tsx` with clean rendered equations, variable definitions, and CODATA 2022 copyable constants.
- [x] **7.2 Command Palette Modal (`Cmd+K` / `Ctrl+K`)**:
  - Create `src/components/productivity/CommandPalette.tsx`:
    - Keyboard listener for `Cmd+K` and `Ctrl+K`.
    - Fuzzy search for presets, converter views, and quick actions.
- [x] **7.3 Conversion History Drawer**:
  - Create `src/context/HistoryContext.tsx`: Records last 30 conversions.
  - Create `src/components/productivity/HistoryDrawer.tsx`: Slide-over panel with recall buttons and timestamps.
- [x] **7.4 PWA Manifest & Service Worker Registration**:
  - Create `public/manifest.json` and SVG app icons.
  - Implement `src/registerServiceWorker.ts` with offline verification.
- [x] **7.5 Verification & Final Build**:
  - Run `npm run build` (Clean exit code 0, 46 precached offline assets).
  - 100% offline functionality.

---

## Phase 8: Complex RF & Smith Chart

> Implement complex impedance modeling ($Z_L = R + jX$), reflection coefficient $\Gamma$, active and reactive power, interactive SVG Smith Chart, and analytical L-section matching network synthesis.

- [x] **8.1 Complex RF Math Engine**:
  - Create `src/core/rf-complex.ts`:
    - Complex number arithmetic: add, sub, mul, div, mag, argDeg.
    - Complex reflection coefficient $\Gamma = (Z_L - Z_0)/(Z_L + Z_0)$.
    - VSWR, Return Loss, real delivered power $P_{\text{real}}$, reactive power $Q_{\text{VAR}}$.
    - Analytical L-section matching network synthesizer for low-pass and high-pass topologies.
- [x] **8.2 Interactive SVG Smith Chart Component**:
  - Create `src/components/modules/SmithChart.tsx`:
    - Vector rendering of $|\Gamma| = 1$ boundary circle, constant $r$ circles, and constant $x$ arcs.
    - Draggable pointer cursor with real-time bidirectional synchronization with $R_L$ and $X_L$.
    - Tooltip HUD displaying $|Z_L|\angle\theta$, $\Gamma$, and Return Loss.
- [x] **8.3 UI Integration in RF Converter**:
  - Update `src/components/modules/RfElectronicsConverter.tsx`:
    - Embed "Complex Impedance & Reactive Load Analyzer" card.
    - Live metrics for VSWR, Return Loss, $\Gamma$, real power, and reactive VAR.
    - Matching network results displaying $L$ (nH), $C$ (pF), and topology layout.
- [x] **8.4 Complex RF Unit Tests**:
  - Create `src/core/__tests__/rf-complex.test.ts`.

---

## Phase 9: ABCD Gaussian Beam Propagation Simulator

> Implement Kogelnik complex beam parameter $q(z)$ modeling, $2 \times 2$ ABCD matrices for drift, thin lenses, and thick lenses, real-time beam envelope sampling, secondary waist detection, and interactive optical bench canvas.

- [x] **9.1 ABCD Beam Propagation Engine**:
  - Create `src/core/beam-abcd.ts`:
    - Complex beam parameter $q(z)$ and conversions to/from $w(z), R(z)$.
    - ABCD matrices for free space drift, thin lens ($f$), thick lens ($R_1, R_2, d_{\text{lens}}, n$).
    - Optical glass presets (N-BK7, Fused Silica, SF11).
    - Multi-segment beam envelope calculation along optical axis $z$.
    - Analytical secondary waist detection and Rayleigh range calculations.
- [x] **9.2 Interactive SVG Optical Bench Canvas**:
  - Create `src/components/modules/BeamPropagationCanvas.tsx`:
    - Calibrated millimetric optical rail with coordinate scale and grid.
    - Symmetrical shaded Gaussian beam profile $w(z)$.
    - Draggable optical elements (thin lens, thick lens) with 60 FPS slider responsiveness.
    - Dynamic waist marker badges ($w_0, z_{\text{waist}}$).
    - Draggable Virtual Beam Profiler / Caliper line with live readouts: $z, w(z), 2w(z), R(z), I_0(z)$.
    - Optical presets: Keplerian Telescope, Galilean Expander, Fiber-to-Atom Focusing Lens.
- [x] **9.3 UI Integration in Laser Beam Converter**:
  - Update `src/components/modules/LaserBeamConverter.tsx`:
    - Segmented toggle: [Single Spot & Rabi Calculator] vs [ABCD Beam Propagation Bench].
    - Seamless sharing of laser wavelength $\lambda$ and initial waist $w_0$.
- [x] **9.4 ABCD Beam Propagation Unit Tests**:
  - Create `src/core/__tests__/beam-abcd.test.ts`.

---

## Phase 10: Zero-Trust Accuracy Suite, Place-Aware Stepper, Lens Geometry & Metrology Provenance

> Implement place-aware digit stepping across all inputs, realistic SVG lens geometry, ISO GUM Supplement 1 second-order diagnostics, comprehensive 20+ formula catalog, zero-trust numerical accuracy verification against Wolfram fixtures, and automatic source packaging.

- [x] **10.1 Place-Aware Digit Stepper Engine**:
  - Create `src/core/number-stepper.ts`:
    - Cursor position analysis to determine power of ten $10^p$.
    - `ArrowUp` / `ArrowDown` stepping without floating-point artifacts.
    - Holding `Shift` applies $10\times$ multiplier.
    - Full support for scientific notation mantissas and exponents, European comma decimals, and selection replacement.
    - Wire `handleNumberStepperKeyDown` into `SyncedInput.tsx` and all manual inputs across modules.
    - Unit tests in `src/core/__tests__/number-stepper.test.ts` (23 tests).
- [x] **10.2 Realistic SVG Lens Geometry & Calibrated Canvas**:
  - Enhance `src/components/modules/BeamPropagationCanvas.tsx`:
    - Realistic biconvex ($f > 0$) and biconcave ($f < 0$) thin lens SVG profiles with central optical axis line.
    - Calibrated vertical $y$-axis with tick marks and unit labels ($w\,[\mu\text{m}]$).
    - Draggable vertical caliper line with manual position numeric input.
    - Independent draft input state for initial waist typing.
    - Paraxial diffraction limit warning banner ($w_0 < \lambda/\pi$).
- [x] **10.3 Expanded 26 KaTeX Formula Catalog**:
  - Expand `src/constants/formulas.ts`: Document 26 comprehensive formulas across Optical, Zeeman, Laser/ABCD, RF/Smith, and Error Propagation domains with variable definitions, SI units, and independent mathematical fidelity audit.
- [x] **10.4 ISO GUM Supplement 1 Nonlinearity Diagnostic & 2nd-Order Curvature Toggle**:
  - Enhance `src/core/error-prop/`:
    - Support multi-base logarithms: $\ln(x)$, $\log_{10}(x)$, arbitrary $\log_b(x)$.
    - Analytical second partial derivatives $\frac{\partial^2 f}{\partial x_i^2}$.
    - Dimensionless nonlinearity index $\eta_{\text{nl}} = |\Delta_{\text{bias}}| / \sigma_{\text{linear}}$ with `'linear'`, `'mild'`, `'severe'`, and `'extremum'` regimes.
    - Persistent toggle for second-order curvature corrections evaluating $\Delta_{\text{bias}}$, $E[f]$, and $\sigma_{\text{corrected}}$.
    - Dual-mode "Copy LaTeX" and "Copy Result" with metrology significant figures.
- [x] **10.5 Zero-Trust Accuracy Verification Suites & Wolfram Fixtures**:
  - Create `scripts/generate-wolfram-fixtures.wls` generating high-precision Mathematica reference datasets.
  - Implement 6 dedicated accuracy test suites in `src/core/__tests__/accuracy/`:
    - `optical-accuracy.test.ts` (67 tests): Multi-decade photon energy, frequency, wavenumber, and thermal temp precision.
    - `rf-complex-accuracy.test.ts` (47 tests): Complex $\Gamma$, Smith chart conformal mapping, delivered/reactive power, and L-section matching.
    - `beam-abcd-accuracy.test.ts` (9 tests): ABCD matrix determinental unimodularity ($\det M = 1$), Kogelnik $q$-law, waist locations.
    - `error-prop-accuracy.test.ts` (13 tests): First and second partial derivatives, multi-base log derivatives, GUM covariance, and second-order corrections.
    - `presets-accuracy.test.ts` (14 tests): Precision checks of all built-in transition parameters.
    - `symmetry-invariance.test.ts` (3 tests): Roundtrip numerical symmetry across conversions.
- [x] **10.6 Open-Source Verification Suite & GitHub Integration**:
  - Direct UI link to GitHub repository (`https://github.com/MarkSemco/AMO-Units`) for local verification and code audit.
- [x] **10.7 Verification**:
  - `npm test`: 23 test files, 365 passed tests (100%).
  - `npm run typecheck`: 0 TypeScript errors.
  - `npm run lint`: 0 linter errors.
  - `npm run build`: Clean production build with 46 precached offline assets.
