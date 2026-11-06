# ⚛️ AMO Units — Physics & RF Laboratory Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-365%20Passed%20(100%25)-success?logo=vitest&logoColor=white)](https://vitest.dev/)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-00E5FF?logo=pwa&logoColor=black)](#-offline-pwa-architecture)
[![CODATA](https://img.shields.io/badge/Constants-CODATA_2022-brightgreen)](https://physics.nist.gov/cuu/Constants/)
[![Privacy](https://img.shields.io/badge/Privacy-Zero_Telemetry-success)](#-offline-pwa-architecture)
[![Buy Me A Coffee](https://img.shields.io/badge/Ko--fi-Buy_Me_A_Coffee-FF5E5B?logo=kofi&logoColor=white)](https://ko-fi.com/marksdev)
[![Feedback](https://img.shields.io/badge/Feedback-Tally_Form-4F46E5?logo=tally&logoColor=white)](https://tally.so/r/e5D6ol)

> **Atomic, Molecular & Optical (AMO) physics laboratory converter, laser beam propagation and polarization bench, RF electronics suite, and symbolic error propagation engine.**  
> Built as an offline-first Progressive Web App (PWA) for experimental quantum optics, atomic clock metrology, cold-molecule laser cooling, and microwave laboratory engineering.

---

## 📑 Table of Contents

- [Overview & Capabilities](#-overview--capabilities)
- [Key Features](#-key-features)
- [Core Functional Modules](#-core-functional-modules)
  - [1. Optical, Frequency & Energy Converter](#1-optical-frequency--energy-converter)
  - [2. Magnetic Field & Zeeman Splitting](#2-magnetic-field--zeeman-splitting)
  - [3. Laser Optics & Beam Propagation](#3-laser-optics--beam-propagation)
    - [3.1 Single Spot & Atom-Light Rabi Coupling](#31-single-spot--atom-light-rabi-coupling)
    - [3.2 ABCD Matrix Gaussian Beam Simulator](#32-abcd-matrix-gaussian-beam-simulator)
    - [3.3 Laser Polarization & Optical Beamline](#33-laser-polarization--optical-beamline)
  - [4. RF Microwave Electronics, Complex Impedance & Smith Chart](#4-rf-microwave-electronics-complex-impedance--smith-chart)
  - [5. Symbolic Error Propagation Equation Generator (ISO GUM)](#5-symbolic-error-propagation-equation-generator-iso-gum)
  - [6. Atomic & Molecular Preset Library](#6-atomic--molecular-preset-library)
  - [7. Formula Inspector & Metrological Standards](#7-formula-inspector--metrological-standards)
  - [8. Lab Productivity & Ergonomic UX](#8-lab-productivity--ergonomic-ux)
- [Numerical Verification & Testing Methodology](#-numerical-verification--testing-methodology)
- [Offline PWA Architecture](#-offline-pwa-architecture)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Automated Verification & Testing](#-automated-verification--testing)
- [Scientific Bibliography & References](#-scientific-bibliography--references)
- [Feedback & Feature Requests](#-feedback--feature-requests)
- [Support the Project](#-support-the-project)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview & Capabilities

Experimental AMO physics and microwave engineering operate at the intersection of atomic quantum transitions, paraxial Gaussian optics, polarization manipulation, transmission line electronics, and measurement metrology. During laboratory operations, researchers frequently need to:

1. **Translate Energy & Frequency Scales**: Convert between optical wavelengths ($\lambda$), laser frequencies ($\nu$), photon energies in electron-volts ($\text{eV}$) or atomic units (Hartree $E_h$), spectroscopic wavenumbers ($\text{cm}^{-1}$), and equivalent Doppler temperatures ($T_D$).
2. **Model Gaussian Laser Trains**: Cascade paraxial ray-transfer matrices ($ABCD$) with the Kogelnik complex beam parameter $q(z)$ through free-space drift distances, thin lenses, and thick curved optical glass elements, identifying focal waists while monitoring the paraxial diffraction limit ($w_0 < \lambda/\pi$).
3. **Analyze and Control Laser Polarization**: Model arbitrary polarization states using Jones vectors and Stokes parameters ($S_0, S_1, S_2, S_3$), inspect transverse field ellipses and 3D propagating waves, visualize states on a 3D Poincaré sphere, and evaluate beam transmission through sequential waveplates, polarizers, and rotators.
4. **Model Microwave & RF Networks**: Convert signal generator power levels ($\text{dBm}$, $\text{dBW}$, Watts, $V_{\text{rms}}$, $V_{\text{pp}}$), analyze complex transmission line terminations ($Z_L = R + jX$), visualize complex reflection coefficients ($\Gamma$) on an interactive Smith chart, and synthesize analytical dual-solution $L$-$C$ impedance matching networks.
5. **Propagate Experimental Uncertainties Under ISO GUM**: Compute exact analytical partial derivatives ($\partial f / \partial x_i$), evaluate Pearson covariance contributions, diagnose scale-invariant non-linearity ($\eta_{\text{nl}}$ under ISO GUM Supplement 1), and compute second-order expectation bias shifts and curvature-corrected standard uncertainties.

AMO Units provides an offline-first web tool with bidirectional field synchronization, high-precision CODATA 2022 recommended constants, and an automated verification suite cross-checked against independent Wolfram Language benchmarks.

---

## ⚡ Key Features

- 🔄 **Bidirectional Synchronization**: Modifying any field immediately recalculates interconnected quantities across physical units and representations.
- 📐 **ABCD Matrix Gaussian Beam Simulator**: Models paraxial beam propagation through free space, thin lenses, and thick spherical lenses with optical glass presets (N-BK7, Fused Silica, SF11). Includes focal waist detection, beam inspection calipers, and paraxial diffraction limit alerts.
- 🧭 **Laser Polarization & Optical Beamline**: Stokes vector ($S_0, S_1, S_2, S_3$) and Jones calculus engine with 3D Poincaré sphere visualization, 2D electric field ellipse animations, and sequential waveplate/polarizer beamline simulation with common laboratory optical train presets.
- 🎛️ **RF Electronics & Interactive Smith Chart**: Complex impedance analysis, conformal bilinear mapping onto the reflection coefficient unit disk ($|\Gamma| \le 1$), and analytical dual-solution $L$-$C$ matching network synthesis (Low-Pass and High-Pass topologies).
- 🔬 **Symbolic Error Propagation (ISO GUM)**: Client-side mathematical AST parser supporting multi-base logarithms, exact analytical partial derivatives, covariance cross-terms, ISO GUM Supplement 1 non-linearity diagnostics, expectation bias shifts, and LaTeX clipboard export.
- 🧬 **Curated Atomic & Cold-Molecule Presets**: Verified transitions for molecular laser cooling ($\text{AlCl}$, $\text{CaF}$, $\text{AlF}$), alkali atoms ($^{87}\text{Rb}$, $^{85}\text{Rb}$, $^{133}\text{Cs}$ D1/D2 lines), and alkaline-earth optical clocks ($^{88}\text{Sr}$, $^{87}\text{Sr}$), plus custom preset storage in `localStorage`.
- 🔢 **Place-Aware Digit Stepper**: Cursor-sensitive `ArrowUp`/`ArrowDown` stepping by decimal position with `Shift` for a $10\times$ multiplier, supporting scientific notation and decimal commas.
- 🛡️ **Numerical Verification & Metrology Standards**: 26 cataloged reference formulas, CODATA 2022 recommended constants, and an automated verification suite (365 tests) cross-validated against 152 precompiled Wolfram Language golden test fixtures, with explicit documentation of physical assumptions and limitations.
- 🌐 **Offline PWA Architecture**: Client-only architecture with zero network dependencies, precaching application assets and KaTeX mathematical fonts for offline laboratory environments.

---

## 🧩 Core Functional Modules

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                               AMO Units Workspace                                 │
├───────────────┬─────────────────┬─────────────────┬───────────────┬───────────────┤
│ 1. Optical &  │ 2. Magnetic &   │ 3. Laser Beam & │ 4. RF & Micro-│ 5. Error      │
│    Energy     │    Zeeman       │    Polarization │    wave Suite │    Propagation│
├───────────────┴─────────────────┴─────────────────┴───────────────┴───────────────┤
│ 6. Curated Atomic & Molecular Presets (AlCl, CaF, AlF, Rb, Cs, Sr)                │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 7. Formulas & Metrology Standards (CODATA 2022, 26 Formulas, Wolfram Benchmarks)  │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 8. Lab Productivity (Digit Stepper, Global Undo/Redo, Cmd+K Palette, Dark Theme) │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Optical, Frequency & Energy Converter

Provides bidirectional synchronization across six physical representations of an optical photon:

| Representation | Symbol | Units Supported | Governing Equation |
|---|---|---|---|
| **Wavelength** | $\lambda$ | $\text{nm}, \mu\text{m}, \text{m}, \text{Å}$ | $\lambda = c / \nu = hc / E$ |
| **Frequency** | $\nu$ | $\text{Hz}, \text{kHz}, \text{MHz}, \text{GHz}, \text{THz}$ | $\nu = c / \lambda = E / h$ |
| **Angular Frequency** | $\omega$ | $\text{rad/s}, \text{Mrad/s}, \text{Grad/s}$ | $\omega = 2\pi\nu$ |
| **Photon Energy** | $E$ | $\text{eV}, \text{meV}, \mu\text{eV}, \text{J}, E_h \text{ (Hartree)}$ | $E = h\nu = \hbar\omega = 2\,\text{Ry} \times E_h$ |
| **Wavenumber** | $\tilde{\nu}$ | $\text{cm}^{-1}, \text{m}^{-1}$ | $\tilde{\nu} = 1 / \lambda = \nu / c$ |
| **Equivalent Temperature** | $T$ | $\text{K}, \text{mK}, \mu\text{K}, \text{nK}$ | $T = E / k_B = h\nu / k_B$ |

- **Default Transition**: Initializes at $\lambda = 261.5\,\text{nm}$, matching the primary ultraviolet cycling transition $A^1\Pi(v'=0) \leftarrow X^1\Sigma^+(v''=0)$ of Aluminum Monochloride ($\text{AlCl}$).
- **Scientific Unit Controls**: Compact unit selectors with dropdowns displaying full unit definitions.

---

### 2. Magnetic Field & Zeeman Splitting

Calculates magnetic flux density and resulting first-order Zeeman energy and frequency shifts:

$$\Delta\nu = \frac{\mu_B \cdot g_F \cdot m_F \cdot B}{h}$$

- **Magnetic Field Units**: Gauss ($\text{G}$), Tesla ($\text{T}$), MilliTesla ($\text{mT}$), MicroTesla ($\mu\text{T}$).
- **Physical Gyromagnetic Baselines**:
  - **Free Electron Spin ($g_e \approx 2.002319$)**: Gyromagnetic ratio $\approx 2.802495\,\text{MHz/G}$.
  - **Bohr Magneton Baseline ($g_F \cdot m_F = 1.0$)**: $\mu_B / h \approx 1.39962449\,\text{MHz/G} = 13.996245\,\text{GHz/T}$.
  - **Nuclear Magneton Baseline ($\mu_N / h$)**: $\mu_N / h \approx 762.2593285\,\text{Hz/G} = 762.2593285\,\text{kHz/T}$.
- **Configurable Quantum Numbers**: Effective Landé factor ($g_J$ or $g_F$) and magnetic sub-level projection difference ($\Delta m_F$).

---

### 3. Laser Optics & Beam Propagation

Combines single-spot Gaussian laser calculations, paraxial ray matrix propagation, and complete laser polarization modeling:

#### 3.1 Single Spot & Atom-Light Rabi Coupling

- **Gaussian Profile Relations**:
  - Peak on-axis intensity: $I_0 = \frac{2P}{\pi w_0^2}$
  - Average intensity within waist: $I_{\text{avg}} = \frac{P}{\pi w_0^2} = \frac{I_0}{2}$
  - Rayleigh range: $z_R = \frac{\pi w_0^2}{\lambda}$
  - Peak optical electric field amplitude: $E_0 = \sqrt{\frac{2 I_0}{c \epsilon_0}}$
- **Rabi Frequency Coupling ($\Omega$)**:
  - **Natural Linewidth & Saturation**: $\Omega = \Gamma \sqrt{\frac{s_0}{2}} = \Gamma \sqrt{\frac{I_0}{2 I_{\text{sat}}}}$
  - **Transition Dipole Moment**: $\Omega = \frac{d \cdot E_0}{\hbar}$ (supports Debye, atomic units $e \cdot a_0$, and SI $\text{C}\cdot\text{m}$).
  - Coherent $\pi$-pulse inversion duration: $\tau_\pi = \pi / \Omega$.

#### 3.2 ABCD Matrix Gaussian Beam Simulator

Propagates the Kogelnik complex beam parameter through paraxial optical elements:

$$\frac{1}{q(z)} = \frac{1}{R(z)} - j \frac{\lambda}{\pi n w^2(z)}, \qquad q_2 = \frac{A q_1 + B}{C q_1 + D}, \qquad w(z) = \sqrt{-\frac{\lambda}{\pi n \operatorname{Im}(1/q(z))}}$$

- **Optical Elements**:
  - **Free-Space Drift ($d$)**: $\begin{pmatrix} 1 & d \\ 0 & 1 \end{pmatrix}$
  - **Thin Lens ($f$)**: $\begin{pmatrix} 1 & 0 \\ -1/f & 1 \end{pmatrix}$
  - **Thick Spherical Lens ($R_1, R_2, d_{\text{lens}}, n$)**:
    $$M_{\text{thick}} = \begin{pmatrix} 1 - \frac{n-1}{n}\frac{d_{\text{lens}}}{R_1} & \frac{d_{\text{lens}}}{n} \\ -(n-1)\left[\frac{1}{R_1} - \frac{1}{R_2} + \frac{(n-1)d_{\text{lens}}}{n R_1 R_2}\right] & 1 + \frac{n-1}{n}\frac{d_{\text{lens}}}{R_2} \end{pmatrix}$$
    Includes optical glass presets: N-BK7 ($n=1.517$), Fused Silica ($n=1.458$), SF11 ($n=1.785$), High-Index ($n=2.0$).
- **Bench Capabilities**:
  - Draggable optical elements along a calibrated millimetric rail.
  - Secondary waist detection distinguishing internal focal waists from virtual waists.
  - Caliper HUD reporting position $z$, beam radius $w(z)$, wavefront curvature $R(z)$, and peak intensity $I_0(z)$.
  - Paraxial diffraction limit warnings when $w_0 < \lambda / \pi$.

#### 3.3 Laser Polarization & Optical Beamline

Models arbitrary polarization states and their evolution through optical components:

- **State Representations**:
  - **Stokes Parameters**: $S = [S_0, S_1, S_2, S_3]^T$ with degree of polarization $\text{DOP} = \sqrt{S_1^2 + S_2^2 + S_3^2} / S_0$.
  - **Normalized Coordinates**: $s_1 = S_1/S_0$, $s_2 = S_2/S_0$, $s_3 = S_3/S_0$.
  - **Jones Vectors**: Normalized two-component complex vectors $[E_x, E_y]^T$ for fully polarized states.
  - **Ellipse Geometry**: Orientation angle $\psi \in [-\pi/2, \pi/2]$ and ellipticity angle $\chi \in [-\pi/4, \pi/4]$.
  - **Convention**: Follows the AMO physics handedness convention (looking into the oncoming beam; $S_3 > 0$ corresponds to Right Circular Polarization / $\sigma^+$).
- **Interactive Visualizers**:
  - **Transverse Electric Field Ellipse**: 2D animation showing the rotating electric field vector and bounding polarization ellipse.
  - **3D Propagating Wave**: Dynamic spatial visualization of the rotating helical or planar electric field vector along the propagation axis.
  - **3D Poincaré Sphere**: Spherical Stokes representation showing state vectors, projection axes, and trajectories through optical elements.
- **Optical Beamline**:
  - Cascade waveplates (half-wave $\lambda/2$, quarter-wave $\lambda/4$, arbitrary retardance $\delta$) at orientation $\theta$, linear polarizers, and polarization rotators.
  - Preset optical configurations: Circular Polarizer, Variable Attenuator, Optical Isolator, and Waveplate Compensator.

---

### 4. RF Microwave Electronics, Complex Impedance & Smith Chart

Designed for microwave signal generators, AOM/EOM drivers, power amplifiers, and transmission line networks:

#### 4.1 Scalar Power, Voltage & Attenuation Sync

- **System Impedance ($Z_0$)**: $50\,\Omega$, $75\,\Omega$, $1\,\text{M}\Omega$, or custom user-defined resistance.
- **Power & Voltage Conversions**:
  - Power: $\text{dBm}, \text{dBW}, \text{W}, \text{mW}, \mu\text{W}, \text{dB}\mu\text{V}, \text{dBmV}$.
  - Voltage (across $Z_0$): $V_{\text{rms}} = \sqrt{P \cdot Z_0}$, $V_{\text{pp}} = 2\sqrt{2} V_{\text{rms}}$, $V_{\text{pk}} = \sqrt{2} V_{\text{rms}}$.
- **Transmission Line Metrics**:
  - Attenuation in $\text{dB} = 10 \log_{10}(P_1 / P_2) = 20 \log_{10}(V_1 / V_2)$.
  - Symmetrical VSWR, reflection coefficient $|\Gamma| = \frac{\text{VSWR}-1}{\text{VSWR}+1}$, Return Loss $\text{RL} = -20\log_{10}|\Gamma|$, and Mismatch Loss $\text{ML} = -10\log_{10}(1-|\Gamma|^2)$.

#### 4.2 Complex Load Analyzer & Interactive Smith Chart

- **Complex Load Representation**:
  - Rectangular format: $Z_L = R_L + j X_L\,\Omega$.
  - Polar format: $|Z_L|\angle\theta$ and complex load admittance $Y_L = 1/Z_L = G_L + j B_L$.
  - Complex reflection coefficient: $\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0} = |\Gamma|e^{j\phi}$.
  - Delivered active power: $P_{\text{real}} = P_{\text{inc}}(1 - |\Gamma|^2)$.
  - Stored reactive power: $Q_{\text{VAR}} = 2 P_{\text{inc}} \operatorname{Im}(\Gamma)$ in Volt-Amperes Reactive.
- **Interactive Smith Chart**:
  - Conformal bilinear mapping of normalized impedance $z = Z_L / Z_0$ onto the unit disk.
  - Constant resistance circles and constant reactance arcs.
  - Draggable cursor with bidirectional numerical synchronization.

#### 4.3 Analytical L-Section Matching Network Synthesizer

- Synthesizes matching networks for operating frequency $f_0$, system impedance $Z_0$, and complex load $Z_L$:
  - **Shunt-First Topology** ($R_L > Z_0$) and **Series-First Topology** ($R_L < Z_0$).
  - **Low-Pass Solution**: Series $L$ and Shunt $C$ (DC conduction and harmonic suppression).
  - **High-Pass Solution**: Series $C$ and Shunt $L$ (DC blocking).
- Displays component values, matching network quality factor $Q_{\text{match}}$, and connection schematic.

---

### 5. Symbolic Error Propagation Equation Generator (ISO GUM)

Implements client-side symbolic differentiation and uncertainty propagation compliant with the ISO Guide to the Expression of Uncertainty in Measurement (GUM) and ISO GUM Supplement 1:

#### 5.1 Symbolic Calculus & Multi-Base Logarithms

- Parses mathematical expressions using client-side AST traversal.
- Extracts variables while recognizing physical constants (`pi`, `e`, `c`, `h`, `hbar`, `kB`, `muB`, `muN`, `a0`, `eps0`).
- Evaluates analytical multi-base logarithmic derivatives:
  $$\frac{d}{dx}\ln(x) = \frac{1}{x}, \qquad \frac{d}{dx}\log_{10}(x) = \frac{1}{x \ln 10}, \qquad \frac{d}{dx}\log_b(x) = \frac{1}{x \ln b}$$

#### 5.2 First-Order Propagation with Covariance

$$\sigma_f = \sqrt{ \sum_{i} \left( \frac{\partial f}{\partial x_i} \sigma_{x_i} \right)^2 + 2 \sum_{i < j} \left( \frac{\partial f}{\partial x_i} \right) \left( \frac{\partial f}{\partial x_j} \right) \text{Cov}(x_i, x_j) }$$

- Configurable Pearson correlation matrix for correlation coefficients $r_{ij} \in [-1, 1]$.
- Toggle between analytical expanded derivatives and compact partial derivative notation.

#### 5.3 ISO GUM Supplement 1 Non-Linearity Diagnostics & Second-Order Corrections

Evaluates the dimensionless non-linearity diagnostic index:

$$\eta_{\text{nl}} = \frac{|\Delta_{\text{bias}}|}{\sigma_{\text{linear}}} = \frac{\frac{1}{2}\left| \sum_i \frac{\partial^2 f}{\partial x_i^2} \sigma_{x_i}^2 \right|}{\sigma_{\text{linear}}}$$

- **Non-Linearity Regimes**:
  - `linear`: $\eta_{\text{nl}} < 0.05$ (first-order linear approximation is valid).
  - `mild`: $0.05 \le \eta_{\text{nl}} \le 0.15$ (5% to 15% non-linear bias).
  - `severe`: $\eta_{\text{nl}} > 0.15$ (>15% bias; curvature corrections recommended).
  - `extremum`: First derivative vanishes ($\sigma_{\text{linear}} \approx 0$) in the presence of curvature.
- **Second-Order Curvature Corrections**:
  - Expectation bias shift: $\Delta_{\text{bias}} = \frac{1}{2}\sum_i \frac{\partial^2 f}{\partial x_i^2} \sigma_{x_i}^2$
  - Corrected expectation: $E[f] = f_0 + \Delta_{\text{bias}}$
  - Second-order standard uncertainty:
    $$\sigma_{\text{corrected}} = \sqrt{ \sigma_{\text{linear}}^2 + \frac{1}{2}\sum_i \left( \frac{\partial^2 f}{\partial x_i^2} \cdot \sigma_{x_i}^2 \right)^2 }$$
- **Exports**: Copy publication-ready LaTeX equation string or formatted numerical result with ISO GUM significant figures.

---

### 6. Atomic & Molecular Preset Library

A reference repository of literature-verified transitions across cold molecules, alkali standards, and optical clock species:

#### Cold Molecule Laser Cooling Systems

- **AlCl (Aluminum Monochloride)**:
  - References: J. R. Daniel et al., *Phys. Rev. A* 108, 062821 (2023); L.-R. Liu et al., *Phys. Rev. A* 111, 062810 (2025).
  - Cycling transition: $A^1\Pi(v'=0) \leftarrow X^1\Sigma^+(v''=0)$ at $\lambda = 261.5\,\text{nm}$, $\Gamma/2\pi = 25.0\,\text{MHz}$ ($\tau \approx 6.0\,\text{ns}$), $I_{\text{sat}} = 232.0\,\text{mW/cm}^2$, permanent dipole moment $\mu_X = 1.68\,\text{D}$, with vibrational repump lines at $261.8\,\text{nm}$ and $262.2\,\text{nm}$.
- **CaF (Calcium Monofluoride)**:
  - References: S. Truppe et al., *Nature Physics* 13, 1173 (2017); L. W. Cheuk et al., *Phys. Rev. Lett.* 116, 143001 (2016); B. Hemmerling et al., *J. Phys. B* 49, 174001 (2016).
  - Green slowing line: $B^2\Sigma^+ \leftarrow X^2\Sigma^+$ at $531.0\,\text{nm}$ ($\Gamma/2\pi = 6.3\,\text{MHz}$, $I_{\text{sat}} = 4.4\,\text{mW/cm}^2$, $d = 3.07\,\text{D}$).
  - Orange cooling/MOT line: $A^2\Pi_{1/2} \leftarrow X^2\Sigma^+$ at $606.3\,\text{nm}$ ($\Gamma/2\pi = 8.3\,\text{MHz}$, $I_{\text{sat}} = 4.9\,\text{mW/cm}^2$).
- **AlF (Aluminum Monofluoride)**:
  - Reference: S. Truppe et al., *Phys. Rev. A* 100, 052513 (2019).
  - Deep UV cycling line: $A^1\Pi \leftarrow X^1\Sigma^+$ at $227.5\,\text{nm}$ ($\Gamma/2\pi = 84.0\,\text{MHz}$, $\tau = 1.90\,\text{ns}$, $I_{\text{sat}} = 930.0\,\text{mW/cm}^2$, dipole $\mu_X = 1.515\,\text{D}$).

#### Alkali Metal Standards (Steck Data Sheets & NIST)

- **Rubidium-87 ($^{87}\text{Rb}$)** & **Rubidium-85 ($^{85}\text{Rb}$)**:
  - D2 line: $780.241\,\text{nm}$, $\Gamma/2\pi = 6.067\,\text{MHz}$, $I_{\text{sat}} = 1.669\,\text{mW/cm}^2$, $d = 10.745\,\text{D}$.
  - D1 line: $794.979\,\text{nm}$, $\Gamma/2\pi = 5.750\,\text{MHz}$, $I_{\text{sat}} = 4.484\,\text{mW/cm}^2$, $d = 7.606\,\text{D}$.
- **Cesium-133 ($^{133}\text{Cs}$)**:
  - Primary SI standard D2 line: $852.347\,\text{nm}$, $\Gamma/2\pi = 5.234\,\text{MHz}$, $I_{\text{sat}} = 1.102\,\text{mW/cm}^2$, $d = 11.956\,\text{D}$.
  - D1 line: $894.593\,\text{nm}$, $\Gamma/2\pi = 4.575\,\text{MHz}$, $I_{\text{sat}} = 2.498\,\text{mW/cm}^2$, $d = 8.343\,\text{D}$.

#### Alkaline-Earth Optical Clocks & Cooling

- **Strontium-88 ($^{88}\text{Sr}$)**:
  - Blue cooling line: $^1S_0 \rightarrow {}^1P_1$ at $460.862\,\text{nm}$, $\Gamma/2\pi = 30.5\,\text{MHz}$, $I_{\text{sat}} = 40.3\,\text{mW/cm}^2$.
  - Red intercombination line: $^1S_0 \rightarrow {}^3P_1$ at $689.449\,\text{nm}$, $\Gamma/2\pi = 7.40\,\text{kHz}$, $I_{\text{sat}} = 3.0\,\mu\text{W/cm}^2$.
- **Strontium-87 ($^{87}\text{Sr}$)**:
  - Optical lattice clock transition: $^1S_0 \rightarrow {}^3P_0$ at $698.446\,\text{nm}$, natural linewidth $1.2\,\text{mHz}$, $I_{\text{sat}} \approx 4 \times 10^{-10}\,\text{mW/cm}^2$.

#### Custom Preset Storage

- Add, edit, and delete custom user transitions persisted in `localStorage`.
- One-click loading populates wavelength, linewidth, and saturation parameters across all calculators.
- JSON export and import for sharing presets across laboratory setups.

---

### 7. Formula Inspector & Metrological Standards

- **CODATA 2022 Physical Constants Table**: Lists recommended values and standard uncertainties for $c$, $h$, $\hbar$, $e$, $k_B$, $\mu_B$, $\mu_N$, $a_0$, $\epsilon_0$, $\mu_0$.
- **26 Verified KaTeX Formula Cards**: Formula cards documenting governing physics equations, variable definitions, and applicable units.
- **Independent Verification Benchmarks**: Displays SHA-256 checksums and parameter coverage for 152 precompiled Wolfram Language benchmark fixtures.
- **Physical Assumptions & Limitations**: Explicit documentation of model assumptions (TEM₀₀ Gaussian modes, paraxial ray propagation, non-relativistic atomic states, and IEEE 754 floating-point considerations).

---

### 8. Lab Productivity & Ergonomic UX

- **Place-Aware Digit Stepper**:
  - Clicking any numeric input and pressing `ArrowUp` or `ArrowDown` steps the specific decimal digit at the cursor position (e.g., stepping the tenths place on `780.24` increments to `780.34`).
  - Holding `Shift` applies a $10\times$ step multiplier.
  - Handles negative numbers, scientific notation mantissas/exponents (`1.5e-4`), and European comma decimal formats (`123,45`).
- **Global Undo / Redo**: Keyboard shortcuts (`Cmd+Z` / `Ctrl+Z`, `Cmd+Shift+Z` / `Ctrl+Y`) allow undoing and redoing numeric inputs, preset changes, and component edits with toast feedback.
- **Command Palette (`Cmd+K` / `Ctrl+K`)**: Fuzzy search to navigate directly to any tab, calculator, preset, or setting.
- **Conversion History Drawer**: Slide-over drawer recording recent calculations with timestamps and one-click value restore.
- **Dark Theme**: High-contrast palette designed for darkened laser laboratories to minimize screen glare.

---

## 🔬 Numerical Verification & Testing Methodology

To ensure calculation reliability, AMO Units uses an automated verification harness tested against independent standards:

```
 ┌────────────────────────────────────────────────────────┐
 │      Wolfram Language 14 / Mathematica Kernel CAS      │
 └───────────────────────────┬────────────────────────────┘
                             │ Deterministic Symbolic Calculus &
                             │ Arbitrary-Precision Float Benchmarks
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │        Precompiled Golden Reference JSON Fixtures      │
 │             (tests/fixtures/*.json)                    │
 │         Protected by Immutable SHA-256 Hashes          │
 └───────────────────────────┬────────────────────────────┘
                             │ Local Vitest Test Harness
                             │ (Runs in <2s, 0 Network, 0 Commercial License)
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │        AMO Units Application Core Engines              │
 │        23 / 23 Test Files Passed (100%)                │
 │        365 / 365 Automated Tests Passed (100%)         │
 └────────────────────────────────────────────────────────┘
```

### Development Methodology & Validation

AMO Units was developed with AI assistance. To guarantee mathematical and metrological correctness, calculation logic is audited against deterministic external benchmarks rather than self-graded:

1. **Decoupled Expectation Generation**: Test expectations were evaluated independently using the **Wolfram Language (Mathematica)** kernel and official metrological standards (CODATA 2022, NIST, Steck alkali data).
2. **Precompiled Test Fixtures**: 152 benchmark test cases are stored as static JSON fixtures under [`tests/fixtures/`](tests/fixtures/PROVENANCE.md), protected by SHA-256 hashes.
3. **Reproducibility**: The benchmark generation script is preserved in [`scripts/generate-wolfram-fixtures.wls`](scripts/generate-wolfram-fixtures.wls).
4. **Known Physical Boundaries**:
   - Beam propagation assumes paraxial rays and fundamental TEM₀₀ modes. Non-paraxial diffraction effects dominate when $w_0 < \lambda/\pi$.
   - Atomic couplings assume the electric dipole approximation and non-relativistic energy levels.
   - Numerical calculations use IEEE 754 64-bit floating point; precision limits may appear near extreme asymptotes ($R \to 0$ in RF reactances).

---

## 📦 Offline PWA Architecture

AMO Units operates as a 100% offline Progressive Web App via `vite-plugin-pwa` and Workbox:
- **Cache-First Strategy**: Precaches all application assets, including HTML, CSS, JavaScript chunks, and mathematical WOFF/WOFF2 fonts for KaTeX.
- **Zero Runtime Network Calls**: The application executes entirely within the browser's JavaScript engine with zero telemetry or remote dependencies.
- **Direct Verification**: All test fixtures and reproduction scripts are maintained in the repository for local auditing.

---

## 💻 Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | [React](https://react.dev/) + [Vite](https://vitejs.dev/) | React 18.3, Vite 5.4 | Fast HMR, component architecture, sub-second cold boot |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | 5.6 (Strict Mode) | Type safety across physical units, matrix dimensions, and AST structures |
| **Symbolic Math** | [mathjs](https://mathjs.org/) | 13.2 | Client-side AST parsing, symbolic partial differentiation, simplification |
| **Equation Typesetting** | [KaTeX](https://katex.org/) | 0.16 | Offline-bundled LaTeX math typography |
| **Styling** | Modern CSS Variables | Modular Tokens | Theme tokens with zero runtime CSS overhead |
| **Icons** | [Lucide React](https://lucide.dev/) | 0.453 | Tree-shakeable SVG scientific iconography |
| **PWA Engine** | [Vite PWA Plugin](https://vite-pwa-org.netlify.app/) | 0.20 | Service Worker precaching and offline manifest |
| **Testing** | [Vitest](https://vitest.dev/) + Testing Library | 2.1 | Unit, component, and accuracy benchmarking |

---

## 📂 Repository Structure

```
AMO-Units/
├── docs/                               # Engineering & specification documentation
│   ├── requirements.md                 # System requirements & user acceptance criteria
│   ├── architecture.md                 # System architecture, math derivations & models
│   ├── design-system.md                # Design tokens & theme specifications
│   ├── implementation-plan.md          # Implementation records
│   └── qa-report.md                    # Verification test report & provenance audit
├── public/                             # Static public assets & PWA manifest
│   ├── manifest.webmanifest            # Standalone PWA web manifest
│   └── favicon.svg                     # Application favicon
├── scripts/                            # Verification & build utilities
│   └── generate-wolfram-fixtures.wls   # Wolfram Mathematica benchmark generator
├── tests/                              # Benchmark fixtures & provenance data
│   └── fixtures/
│       ├── PROVENANCE.md               # Checksums & standards audit log
│       ├── wolfram-golden-optical.json
│       ├── wolfram-golden-rf-complex.json
│       ├── wolfram-golden-beam-abcd.json
│       ├── wolfram-golden-error-prop.json
│       └── wolfram-golden-presets.json
├── src/
│   ├── assets/                         # SVG icons and logos
│   ├── components/
│   │   ├── common/                     # Reusable UI controls (Button, Card, SyncedInput, MathView)
│   │   ├── layout/                     # Header, TabNavigation, Footer
│   │   ├── modules/                    # Core modules (Optical, Laser, RF, Smith Chart, ABCD, etc.)
│   │   │   └── polarization/           # Laser Polarization & Waveplate beamline components
│   │   └── productivity/               # CommandPalette, HistoryDrawer
│   ├── constants/
│   │   ├── codata2022.ts               # Official CODATA 2022 physical constants
│   │   ├── default-presets.ts          # Molecular, alkali, and clock transitions
│   │   └── formulas.ts                 # 26 documented KaTeX reference formulas
│   ├── context/                        # React context providers (Theme, Settings, Preset, History, UndoRedo)
│   ├── core/                           # Mathematical & physics calculation engines
│   │   ├── beam-abcd.ts                # Ray matrices, Kogelnik q-propagation, secondary waists
│   │   ├── error-prop/                 # Symbolic AST parsing, multi-base logs, GUM evaluator
│   │   ├── formatters.ts               # ISO GUM sig-fig rounder & scientific formatters
│   │   ├── laser-beam.ts               # Gaussian beam waist, Rayleigh range, Rabi coupling
│   │   ├── number-stepper.ts           # Cursor place-aware digit stepping algorithm
│   │   ├── optical.ts                  # Bidirectional photon conversion engine
│   │   ├── polarization.ts             # Stokes vectors, Jones calculus, Poincaré coordinates
│   │   ├── rf-complex.ts               # Complex impedance, reflection, Smith chart mapping, L-C matcher
│   │   ├── rf-power.ts                 # Scalar RF power, voltage, and attenuation
│   │   ├── rf-vswr.ts                  # Scalar VSWR, return loss, mismatch loss
│   │   └── zeeman.ts                   # Magnetic field and linear Zeeman splittings
│   ├── hooks/                          # Custom React hooks (useClipboard, useKeyboardShortcuts)
│   ├── styles/                         # Global styling and design system tokens
│   ├── types/                          # TypeScript interface and type declarations
│   ├── App.tsx                         # Root application component
│   └── main.tsx                        # Application entry point
├── package.json                        # Scripts and dependencies
├── tsconfig.json                       # TypeScript compiler configuration
└── vite.config.ts                      # Vite build and PWA configuration
```

---

## 🚀 Getting Started & Local Development

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MarkSemco/AMO-Units.git
   cd AMO-Units
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 🧪 Automated Verification & Testing

To run the complete test suite:

```bash
# Execute all 23 test suites (365 unit & accuracy benchmark tests)
npm test

# Run TypeScript static typechecker (Strict mode)
npm run typecheck

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Test Suite Summary

- **Test Files**: 23 passed (100%)
- **Tests**: 365 passed (100%)
- **Execution Time**: ~3.5 seconds
- **Typecheck Errors**: 0 (`tsc --noEmit` clean)

---

## 📚 Scientific Bibliography & References

1. **AlCl Molecule (Aluminum Monochloride)**:
   - J. R. Daniel, M. R. Herms, D. J. McCarron et al., *"Optical cycling in aluminum monochloride"*, *Phys. Rev. A* **108**, 062821 (2023). [DOI: 10.1103/PhysRevA.108.062821](https://doi.org/10.1103/PhysRevA.108.062821)
   - L.-R. Liu, D. Mitra, B. Hemmerling et al., *"Rotational and hyperfine structure of the $A^1\Pi$ state of AlCl"*, *Phys. Rev. A* **111**, 062810 (2025). [DOI: 10.1103/PhysRevA.111.062810](https://doi.org/10.1103/PhysRevA.111.062810)
2. **CaF Molecule (Calcium Monofluoride)**:
   - S. Truppe, H. J. Williams, M. Hambach et al., *"Molecules cooled below the Doppler limit in a magneto-optical trap"*, *Nature Physics* **13**, 1173–1179 (2017). [DOI: 10.1038/nphys4241](https://doi.org/10.1038/nphys4241)
   - L. W. Cheuk, B. L. Augenbraun, J. M. Doyle et al., *"Sub-Doppler RF Molasses for Calcium Monofluoride Molecules"*, *Phys. Rev. Lett.* **116**, 143001 (2016). [DOI: 10.1103/PhysRevLett.116.143001](https://doi.org/10.1103/PhysRevLett.116.143001)
3. **AlF Molecule (Aluminum Monofluoride)**:
   - S. Truppe, S. Marx, S. Kray, G. Meijer et al., *"Spectroscopic characterization of the $A^1\Pi$ state of AlF for laser cooling and trapping"*, *Phys. Rev. A* **100**, 052513 (2019). [DOI: 10.1103/PhysRevA.100.052513](https://doi.org/10.1103/PhysRevA.100.052513)
4. **Alkali Metal Transitions**:
   - D. A. Steck, *"Rubidium 87 D Line Data"*, *"Rubidium 85 D Line Data"*, and *"Cesium D Line Data"*, Los Alamos National Laboratory / University of Oregon. [steck.us/alkalidata](https://steck.us/alkalidata/)
5. **Strontium Optical Clock & Transitions**:
   - A. D. Ludlow, M. M. Boyd, J. Ye, E. Peik, P. O. Schmidt, *"Optical atomic clocks"*, *Rev. Mod. Phys.* **87**, 637 (2015). [DOI: 10.1103/RevModPhys.87.637](https://doi.org/10.1103/RevModPhys.87.637)
   - H. Katori, T. Ido, Y. Isoya, M. Kuwata-Gonokami, *"Magneto-optical trapping and cooling of strontium atoms down to the photon recoil limit"*, *Phys. Rev. Lett.* **82**, 1116 (1999). [DOI: 10.1103/PhysRevLett.82.1116](https://doi.org/10.1103/PhysRevLett.82.1116)
6. **Physical Constants**:
   - E. Tiesinga, P. J. Mohr, D. B. Newell, B. N. Taylor, *"The 2022 CODATA Recommended Values of the Fundamental Physical Constants"*, National Institute of Standards and Technology (NIST), Gaithersburg, MD.
7. **Uncertainty Metrology**:
   - Joint Committee for Guides in Metrology (JCGM/WG1), *"Evaluation of measurement data — Guide to the expression of uncertainty in measurement"* (JCGM 100:2008, GUM 1995 with minor corrections).
   - JCGM 101:2008, *"Evaluation of measurement data — Supplement 1 to the 'Guide to the expression of uncertainty in measurement' — Propagation of distributions using a Monte Carlo method"*.

---

## 💬 Feedback & Feature Requests

We actively welcome suggestions, bug reports, and formula requests from researchers, professors, and students across atomic physics and RF engineering:

- **Quick Web Form (No GitHub account needed)**: [Submit via Tally](https://tally.so/r/e5D6ol) (takes <30 seconds, 100% private)
- **GitHub Issues**: [Open an Issue](https://github.com/MarkSemco/AMO-Units/issues) (for public bug tracking and molecule constant verification)

---

## ☕ Support the Project

AMO Units is 100% free, open-source, and runs completely offline without ads or tracking. If you find this laboratory suite useful for your experiments, calculations, or coursework, consider buying a coffee to support hosting and continued development:

[![Buy me a coffee on Ko-fi](https://img.shields.io/badge/Ko--fi-Buy%20Me%20A%20Coffee-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/marksdev)

---

## 🤝 Contributing

Contributions from the experimental AMO physics, quantum optics, and RF microwave communities are welcome.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/polarization-extension`)
3. Verify test suites pass (`npm test && npm run typecheck`)
4. Commit your Changes (`git commit -m 'feat: add custom retarder presets'`)
5. Push to the Branch (`git push origin feat/polarization-extension`)
6. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
