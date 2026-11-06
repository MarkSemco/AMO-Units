# 📋 Requirements & System Specifications — AMO Units

## 1. Executive Summary & Project Overview

**AMO Units** is an ultra-high-precision, offline-first scientific unit conversion, microwave RF modeling, and symbolic laboratory mathematics Progressive Web Application (PWA). It is engineered specifically for experimental physicists, quantum optics researchers, atomic clock metrologists, and RF/microwave laboratory engineers working in Atomic, Molecular, and Optical (AMO) physics environments.

### 1.1 Problem Statement & Background
Experimental AMO laboratories operate at the convergence of quantum mechanics, precision optical physics, and RF electronics. Daily lab operations require bridging diverse physical units and mathematical frameworks:
- Converting between optical wavelengths ($\lambda$), transition frequencies ($\nu$), wavenumbers ($\tilde{\nu}$), photon energies ($E$), laser beam intensities ($I_0$), Rabi frequencies ($\Omega$), and magnetic Zeeman splittings ($\Delta\nu$).
- Analyzing RF signal generators, power amplifiers, AOM/EOM drivers, and transmission line mismatches ($50\,\Omega$ coaxial cables, $V_{\text{pp}}$, $V_{\text{rms}}$, $\text{dBm}$, $\text{dBW}$, $\text{VSWR}$, Return Loss, and complex load impedance $Z_L = R + jX$).
- Designing optical trains and modeling Gaussian beam propagation through drift spaces, thin lenses, and thick curved optical elements using ray-transfer matrices ($ABCD$) and the complex beam parameter $q(z)$.
- Calculating rigorous measurement uncertainties according to the ISO Guide to the Expression of Uncertainty in Measurement (GUM) and ISO GUM Supplement 1, requiring analytical partial derivatives, covariance propagation, and second-order curvature corrections.

Traditionally, researchers switch between fragmented, error-prone resources: custom Mathematica/Python notebooks, static vendor PDFs (e.g. Steck alkali data sheets), manual hand derivations, or generic web converters that lack AMO-specific relationships, offline execution, and symbolic capabilities. Furthermore, basement laser facilities, cleanrooms, and RF-shielded Faraday cages frequently operate without reliable internet connectivity, making cloud-tethered applications unusable.

### 1.2 Core Value Proposition & Architectural Highlights
1. **Bidirectional Live Synchronization**: Modifying any parameter instantly recalculates all interconnected quantities across the entire module without "Convert" buttons or modal popups.
2. **Deep AMO & Microwave Electronics Synthesis**: Integrates atomic transitions, Gaussian laser profiles, Rabi atom-light couplings, and RF transmission line / Smith chart networks into a unified platform.
3. **Automated Symbolic & Second-Order Error Propagation**: Client-side mathematical AST parser computes exact analytical partial derivatives ($\partial f/\partial x_i$), supports multi-base logarithms ($\ln$, $\log_{10}$, $\log_b$), generates publication-ready KaTeX equations, calculates Pearson covariance contributions, evaluates ISO GUM Supplement 1 scale-invariant nonlinearity diagnostics ($\eta_{\text{nl}}$), and computes second-order expectation bias shifts ($\Delta_{\text{bias}}$) and corrected uncertainties ($\sigma_{\text{corrected}}$).
4. **Interactive ABCD Optical Bench Simulator**: Live paraxial Gaussian beam simulator with Kogelnik $q$-parameter propagation, 60 FPS draggable thin/thick lenses, calibrated millimeter rail, real secondary waist detection, draggable virtual caliper line, and paraxial diffraction limit warning ($w_0 < \lambda/\pi$).
5. **Interactive Vector Smith Chart & Analytical L-Section Matcher**: Full complex impedance analyzer ($Z_L = R + jX$, polar $|Z|\angle\theta$, complex $\Gamma$, real delivered power, reactive power in VAR), vector SVG Smith chart with draggable cursor, and analytical dual-solution L-section matching network synthesizer (Low-Pass and High-Pass $L$-$C$ topologies).
6. **Curated Molecular & Atomic Presets**: Built-in transitions verified against peer-reviewed publications and official standards for cold-molecule laser cooling systems (AlCl [Daniel et al., PRA 2023; Liu et al., PRA 2025], CaF [Truppe et al., Nat. Phys. 2017; Cheuk et al., PRL 2016], AlF [Truppe et al., PRA 2019]), alkali atoms ($^{87}\text{Rb}$, $^{85}\text{Rb}$, $^{133}\text{Cs}$ D1/D2 lines [Steck Alkali Data / NIST]), and alkaline-earth optical clock species ($^{88}\text{Sr}$ blue/red lines [NIST ASD; Katori et al., PRL 1999], $^{87}\text{Sr}$ optical clock transition [Boyd et al., Science 2006; Ludlow et al., RMP 2015]), plus a persistent custom user preset manager.
7. **Lab-Ergonomic UX & 100% Offline PWA**: Precision Scientific Dark Theme (slate/zinc palette, zero neon glare), place-aware digit stepper (ArrowUp/ArrowDown on any digit across all inputs), compact unit pills with descriptive dropdowns, `Cmd+K` command palette, conversion history drawer, and 20+ documented KaTeX formulas with CODATA 2022 physical constants.

---

## 2. High-Level Feature Matrix

| Module | Core Capabilities | Key Physical Models & Equations | Offline Status |
|--------|-------------------|---------------------------------|----------------|
| **Module 1: Optical & Energy** | Bidirectional photon sync across $\lambda, \nu, \omega, E, \tilde{\nu}, T$; compact unit pills; Hartree atomic energy; AlCl default state. | $E = h\nu = hc/\lambda = \hbar\omega = k_B T$, $\tilde{\nu} = 1/\lambda$, $E_h = \hbar^2/(m_e a_0^2)$ | 100% Offline |
| **Module 2: Magnetic & Zeeman** | Magnetic field conversion ($\text{G}, \text{T}, \text{mT}, \mu\text{T}$); linear Zeeman shift; Bohr and Nuclear magneton baselines; Landé $g$-factor and $\Delta m_F$. | $\Delta\nu = \frac{\mu_B g_F m_F B}{h}$, $\mu_B/h \approx 1.3996\,\text{MHz/G}$, $\mu_N/h \approx 762.26\,\text{Hz/G}$ | 100% Offline |
| **Module 3: Laser Optics & Rabi** | Single spot Gaussian calculator (waist, Rayleigh range, peak/avg intensity, $E$-field, Isat & Debye dipole Rabi modes); ABCD Matrix Simulator with draggable rail, thin/thick lenses, caliper, and diffraction limit warnings. | $I_0 = \frac{2P}{\pi w_0^2}$, $z_R = \frac{\pi w_0^2}{\lambda}$, $\Omega = \frac{d E_0}{\hbar} = \Gamma\sqrt{\frac{I_0}{2I_{\text{sat}}}}$, $q_2 = \frac{A q_1 + B}{C q_1 + D}$, $w_{0,\text{diff}} = \frac{\lambda}{\pi}$ | 100% Offline |
| **Module 4: RF & Microwave** | Power/voltage sync ($\text{dBm}, \text{dBW}, \text{W}, \text{mW}, \mu\text{W}, V_{\text{rms}}, V_{\text{pp}}, V_{\text{pk}}, \text{dB}\mu\text{V}, \text{dBmV}$); attenuation ratios; scalar VSWR/RL/ML; Complex load analyzer ($Z_L$, $\Gamma$, $P_{\text{del}}$, $Q_{\text{VAR}}$); interactive SVG Smith chart; analytical L-C matching synthesizer. | $P = V_{\text{rms}}^2/Z_0$, $|\Gamma| = \frac{\text{VSWR}-1}{\text{VSWR}+1}$, $\Gamma = \frac{Z_L-Z_0}{Z_L+Z_0}$, $P_{\text{del}} = P_{\text{inc}}(1-|\Gamma|^2)$, $Q = 2P_{\text{inc}} \operatorname{Im}(\Gamma)$, $L$-$C$ matching equations | 100% Offline |
| **Module 5: Error Propagation** | Arbitrary math formula parser; auto variable detection; analytical partial derivatives via mathjs AST; multi-base logs ($\ln$, $\log_{10}$, $\log_b$); ISO GUM covariance; substitution toggle; ISO GUM Supp 1 nonlinearity diagnostic ($\eta_{\text{nl}}$); 2nd-order curvature correction toggle; dual-mode copy. | $\sigma_f = \sqrt{\sum (\frac{\partial f}{\partial x_i}\sigma_{x_i})^2 + 2\sum \frac{\partial f}{\partial x_i}\frac{\partial f}{\partial x_j}\text{Cov}}$, $\eta_{\text{nl}} = \frac{|\Delta_{\text{bias}}|}{\sigma_{\text{linear}}}$, $E[f] = f_0 + \Delta_{\text{bias}}$, $\sigma_{\text{corrected}} = \sqrt{\sigma_{\text{linear}}^2 + \frac{1}{2}\sum(\frac{\partial^2 f}{\partial x_i^2}\sigma_i^2)^2}$ | 100% Offline |
| **Module 6: Preset Library** | Molecular laser cooling presets (AlCl, CaF, AlF); alkali lines ($^{87}\text{Rb}$, $^{85}\text{Rb}$, $^{133}\text{Cs}$); alkaline-earth clocks ($^{88}\text{Sr}$, $^{87}\text{Sr}$); custom preset editor with `localStorage` persistence and JSON export/import. | Transition wavelengths, natural linewidths $\Gamma$, saturation intensities $I_{\text{sat}}$, dipole moments $d$, vibrational repump lines | 100% Offline |
| **Module 7: Productivity & System** | Precision Scientific Dark theme; place-aware digit stepper (ArrowUp/Down on cursor decimal place); `Cmd+K` command palette; conversion history drawer; Formula & Constants Inspector (20+ KaTeX formulas, CODATA 2022). | Exact CODATA 2022 values ($c, h, \hbar, e, k_B, \mu_B, \mu_N, a_0, \epsilon_0, \mu_0$); cursor decimal place powers $10^p$; Service Worker caching | 100% Offline |

---

## 3. Core Functional Modules — Detailed Specifications

### Module 1: Optical, Frequency & Energy Converter
Provides live, bidirectional synchronization across six fundamental physical representations of an optical photon or quantum transition:
1. **Wavelength ($\lambda$)**:
   - Units: Nanometers ($\text{nm}$), Micrometers ($\mu\text{m}$), Meters ($\text{m}$), Angstroms ($\text{Å}$).
   - Default Starting State: $\lambda = 261.5\,\text{nm}$ (AlCl $A^1\Pi \leftarrow X^1\Sigma^+$ ultraviolet laser cooling cycling transition).
2. **Frequency ($\nu$)**:
   - Units: Hertz ($\text{Hz}$), Kilohertz ($\text{kHz}$), Megahertz ($\text{MHz}$), Gigahertz ($\text{GHz}$), Terahertz ($\text{THz}$).
   - Exact conversion: $\nu = c / \lambda$.
3. **Angular Frequency ($\omega = 2\pi\nu$)**:
   - Units: Radians per second ($\text{rad/s}$), Megaradians per second ($\text{Mrad/s}$), Gigaradians per second ($\text{Grad/s}$).
4. **Energy ($E$)**:
   - Units: Electron-volts ($\text{eV}$), Millielectron-volts ($\text{meV}$), Microelectron-volts ($\mu\text{eV}$), Joules ($\text{J}$), Hartree atomic units ($E_h$).
   - Fundamental quantum link: $E = h\nu = hc/\lambda$. Hartree conversion: $1\,E_h = 2\,\text{Ry} \approx 27.211386\,\text{eV} \approx 4.35974472 \times 10^{-18}\,\text{J}$.
5. **Wavenumber ($\tilde{\nu} = 1/\lambda$)**:
   - Units: Inverse centimeters ($\text{cm}^{-1}$), Inverse meters ($\text{m}^{-1}$).
6. **Equivalent Thermal Temperature ($T$)**:
   - Units: Kelvin ($\text{K}$), Millikelvin ($\text{mK}$), Microkelvin ($\mu\text{K}$), Nanokelvin ($\text{nK}$).
   - Relation: $T = E / k_B = h\nu / k_B$.
7. **Ergonomic Unit Pills**:
   - Every input features a compact unit pill with abbreviated scientific symbol (e.g. `nm`, `µm`, `Å`, `cm⁻¹`, `E_h`).
   - Clicking the pill opens a dropdown menu displaying the full unabbreviated unit name (e.g. `Angstroms (Å)`, `Hartree (E_h)`, `Inverse cm (cm⁻¹)`).

### Module 2: Magnetic Field & Zeeman Splitting
Calculates magnetic flux density and the resulting first-order Zeeman energy and frequency splittings:
1. **Magnetic Field Strength ($B$)**:
   - Units: Gauss ($\text{G}$), Tesla ($\text{T}$), MilliTesla ($\text{mT}$), MicroTesla ($\mu\text{T}$).
   - Exact conversion: $1\,\text{T} = 10^4\,\text{G}$.
2. **Linear Zeeman Frequency Shift ($\Delta\nu$)**:
   - Live bidirectional synchronization: $\Delta\nu = \frac{\mu_B g_F m_F B}{h}$ in $\text{kHz}$, $\text{MHz}$, $\text{GHz}$.
3. **Preset Physical Baselines**:
   - Free Electron Spin ($g_e \approx 2.002319304$): Gyromagnetic ratio $\approx 2.802495\,\text{MHz/G}$.
   - Bohr Magneton Baseline ($g_F \cdot m_F = 1.0$): $\mu_B/h \approx 1.39962449\,\text{MHz/G} = 13.996245\,\text{GHz/T}$.
   - Nuclear Magneton Baseline ($\mu_N/h$): $\mu_N/h \approx 762.2593285\,\text{Hz/G} = 762.2593285\,\text{kHz/T}$.
4. **Configurable Quantum Numbers**:
   - Configurable effective Landé $g$-factor ($g_J$ or $g_F$) and magnetic sublevel difference $\Delta m_F$.

### Module 3: Laser Optics & Rabi Frequency Calculator
Accommodates single-spot Gaussian beam calculations and complex multi-element optical train simulation:

#### Sub-Module 3A: Single Spot & Rabi Calculator
1. **Gaussian Beam Fundamentals**:
   - Inputs: Total optical laser power $P$ ($\text{mW}$, $\text{W}$, $\mu\text{W}$), $1/e^2$ beam waist radius $w_0$ ($\mu\text{m}$, $\text{mm}$), laser wavelength $\lambda$ ($\text{nm}$).
   - Outputs: Peak on-axis intensity $I_0 = \frac{2P}{\pi w_0^2}$ ($\text{W/cm}^2$, $\text{mW/mm}^2$), average intensity inside waist $I_{\text{avg}} = P / (\pi w_0^2) = I_0 / 2$, Rayleigh range $z_R = \frac{\pi w_0^2}{\lambda}$ ($\text{mm}$, $\text{cm}$, $\text{m}$), and peak optical electric field amplitude $E_0 = \sqrt{\frac{2 I_0}{c \epsilon_0}}$ ($\text{V/m}$, $\text{V/cm}$).
2. **Rabi Frequency Coupling ($\Omega$)**:
   - **Mode A (Natural Linewidth & Saturation Parameter)**:
     $$\Omega = \Gamma \sqrt{\frac{s_0}{2}} = \Gamma \sqrt{\frac{I_0}{2 I_{\text{sat}}}}$$
     Utilizes natural transition linewidth $\Gamma/2\pi$ ($\text{MHz}$, $\text{kHz}$) and saturation intensity $I_{\text{sat}}$ ($\text{mW/cm}^2$).
   - **Mode B (Transition Dipole Matrix Element)**:
     $$\Omega = \frac{d \cdot E_0}{\hbar}$$
     Accepts transition dipole moment $d$ in Debye ($\text{D}$), atomic units ($e \cdot a_0$), or $\text{C}\cdot\text{m}$ ($1\,\text{D} \approx 3.33564 \times 10^{-30}\,\text{C}\cdot\text{m} \approx 0.39343\,e\cdot a_0$).
   - Outputs: Rabi frequency $\Omega/2\pi$ ($\text{MHz}$, $\text{kHz}$, $\text{GHz}$) and coherent $\pi$-pulse inversion duration $\tau_\pi = \frac{\pi}{\Omega}$ ($\text{ns}$, $\mu\text{s}$).

#### Sub-Module 3B (US-016): Interactive ABCD Matrix Gaussian Beam Simulator
A complete virtual optical bench simulator based on paraxial ray-transfer matrices and Kogelnik complex beam parameter propagation:
1. **Sequential Optical Train**:
   - Up to $N$ arbitrary cascaded elements along a calibrated millimetric rail ($z \in [0, L_{\text{rail}}]\,\text{mm}$, default $500\,\text{mm}$).
   - Real-time 60 FPS interactive dragging of optical components along the rail with coordinate collision bounds.
2. **Element Types & Ray Transfer Matrices**:
   - **Free-Space Drift ($d$)**: $M = \begin{pmatrix} 1 & d \\ 0 & 1 \end{pmatrix}$.
   - **Thin Lens ($f$)**: $M = \begin{pmatrix} 1 & 0 \\ -1/f & 1 \end{pmatrix}$. Visually rendered as realistic biconvex (converging, $f > 0$) or biconcave (diverging, $f < 0$) curved SVG optics.
   - **Thick Spherical Lens ($R_1, R_2, d_{\text{lens}}, n$)**:
     $$M_{\text{thick}} = \begin{pmatrix} 1 - \frac{n-1}{n}\frac{d_{\text{lens}}}{R_1} & \frac{d_{\text{lens}}}{n} \\ -(n-1)\left[\frac{1}{R_1} - \frac{1}{R_2} + \frac{(n-1)d_{\text{lens}}}{n R_1 R_2}\right] & 1 + \frac{n-1}{n}\frac{d_{\text{lens}}}{R_2} \end{pmatrix}$$
     Standard Cartesian optical convention: $R_1 > 0$ for convex front surface, $R_2 < 0$ for convex back surface. Unimodular condition strictly enforced ($\det M = 1.0$).
   - Optical Glass Presets: N-BK7 ($n = 1.517$), Fused Silica ($n = 1.458$), SF11 ($n = 1.785$), High-Index ($n = 2.0$).
3. **Kogelnik Complex Beam Parameter Transformation**:
   - Complex beam parameter: $\frac{1}{q(z)} = \frac{1}{R(z)} - j \frac{\lambda}{\pi n w^2(z)}$, $q(z) = z + j z_R$.
   - Transformation law: $q_2 = \frac{A q_1 + B}{C q_1 + D}$.
   - Beam radius along propagation axis: $w(z) = \sqrt{-\frac{\lambda}{\pi n \operatorname{Im}(1/q(z))}}$.
4. **Analytical Secondary Waist Detection**:
   - Evaluates planar wavefront conditions $\operatorname{Re}(1/q) = 0 \iff \operatorname{Re}(q) = 0$.
   - Distinguishes real focal waists ($z_{\text{waist}} \in [z_k, z_{k+1}]$ within physical segment) from virtual external waists.
   - Real waists are highlighted on the canvas with interactive badge markers displaying exact focal location $z_{\text{waist}}$ and minimum waist radius $w_{0,\text{sec}}$.
5. **Interactive Virtual Profiler / Caliper Line**:
   - Draggable vertical caliper line along the optical rail with dual input: drag directly on the canvas or type precise manual position $z_{\text{caliper}}$ (with place-aware arrow stepping).
   - Live caliper readout HUD: Position $z$, local spot radius $w(z)$, full $1/e^2$ beam diameter $2w(z)$, wavefront curvature $R(z)$, and peak on-axis intensity $I_0(z)$.
6. **Calibrated Canvas Geometry & Typing State**:
   - Calibrated vertical $y$-axis with tick marks and unit labels ($w\,[\mu\text{m}]$).
   - Independent draft input state for initial waist $w_0$ typing, allowing clean backspacing, clearing, and re-typing without premature resets.
7. **Paraxial Diffraction Limit Warning System**:
   - Whenever the initial waist or any focused secondary waist falls below the paraxial diffraction limit ($w_0 < \frac{\lambda}{\pi}$ for $\text{NA} \approx 1$), the simulator renders an amber alert banner:
     > ⚠️ *Paraxial Diffraction Limit Warning: Beam waist $w_0 < \lambda/\pi$ enters the non-paraxial vector diffraction regime. Scalar ABCD matrix approximations break down.*

### Module 4: RF Electronics & Microwave Converter
Dedicated microwave engineering and RF physics module for signal generators, frequency synthesizers, acousto-optic/electro-optic modulators, and transmission lines:

#### Sub-Module 4A: Real RF Power, Voltage & Attenuation Sync
1. **System Characteristic Impedance ($Z_0$)**:
   - Segmented selector for $50\,\Omega$ (standard RF lab standard), $75\,\Omega$ (video/telecom), $1\,\text{M}\Omega$ (high-Z oscilloscope input), and custom numeric input with draft state.
2. **Scalar RF Power & Voltage Synchronized Grid**:
   - Power: $\text{dBm}$, $\text{dBW}$, Watts ($\text{W}$), Milliwatts ($\text{mW}$), Microwatts ($\mu\text{W}$), $\text{dB}\mu\text{V}$, $\text{dBmV}$.
   - Voltage (across $Z_0$): Root-mean-square voltage $V_{\text{rms}} = \sqrt{P \cdot Z_0}$, Peak-to-peak voltage $V_{\text{pp}} = 2\sqrt{2} V_{\text{rms}}$, Peak voltage $V_{\text{pk}} = \sqrt{2} V_{\text{rms}}$.
3. **RF Attenuation & Gain**:
   - Attenuation in $\text{dB} = 10 \log_{10}(P_1 / P_2) = 20 \log_{10}(V_1 / V_2)$.
   - Bidirectional sync with linear power ratio ($P_2 / P_1$) and linear voltage ratio ($V_2 / V_1$).
4. **Scalar Transmission Line Mismatches**:
   - Voltage Standing Wave Ratio ($\text{VSWR} \ge 1.0$).
   - Scalar reflection coefficient magnitude $|\Gamma| = \frac{\text{VSWR}-1}{\text{VSWR}+1}$.
   - Return Loss $\text{RL} = -20 \log_{10}|\Gamma|\,(\text{dB})$.
   - Mismatch Loss $\text{ML} = -10 \log_{10}(1 - |\Gamma|^2)\,(\text{dB})$.
   - Reflected Power Percentage ($|\Gamma|^2 \times 100\%$) and Transmitted Power Percentage ($(1 - |\Gamma|^2) \times 100\%$).

#### Sub-Module 4B (US-015): Complex RF & Reactive Load Analyzer
Advanced complex impedance analyzer and impedance matching synthesizer:
1. **Complex Load Representation**:
   - Rectangular format: $Z_L = R_L + j X_L\,\Omega$ ($R_L \ge 0$, $X_L > 0$ inductive, $X_L < 0$ capacitive).
   - Polar format: Magnitude $|Z_L| = \sqrt{R_L^2 + X_L^2}$ and phase angle $\theta = \operatorname{atan2}(X_L, R_L)$.
   - Complex load admittance: $Y_L = 1/Z_L = G_L + j B_L = \frac{R_L - j X_L}{R_L^2 + X_L^2}$.
   - Physical Equivalent Load Model: Automatically calculates equivalent lumped series inductance $L_s = X_L / (2\pi f)$ or capacitance $C_s = -1 / (2\pi f X_L)$ with auto-scaled units ($\text{pH, nH, }\mu\text{H, mH}$ or $\text{fF, pF, nF, }\mu\text{F}$), load intrinsic quality factor $Q_L = |X_L| / R_L$, and admittance $Y_L$ in $\text{mS}$.
2. **Complex Reflection Coefficient & Power Conservation Balance**:
   - Complex $\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0} = u + j v = |\Gamma| e^{j \phi}$.
   - Complex Return Loss ($\text{RL} = -20\log_{10}|\Gamma|\,\text{dB}$), VSWR, Mismatch Loss ($\text{ML} = -10\log_{10}(1-|\Gamma|^2)\,\text{dB}$), and phase angle $\phi = \operatorname{atan2}(v, u)$.
   - Rigorous RF Power Conservation Grid ($P_{\text{inc}} = P_{\text{del}} + P_{\text{refl}}$ synced from active forward power converter above):
     - Forward Incident Power: $P_{\text{inc}}$ in $\text{mW/W}$ and $\text{dBm}$.
     - Real Active Power Delivered to load: $P_{\text{del}} = P_{\text{inc}} (1 - |\Gamma|^2)$ in $\text{mW/W}$ with transmitted percentage.
     - Reflected Power: $P_{\text{refl}} = P_{\text{inc}} |\Gamma|^2$ in $\text{mW/W}$ with reflected percentage and high-reflection warning flag.
     - Reactive Stored Near-Field Power: $Q_{\text{VAR}} = 2 P_{\text{inc}} \operatorname{Im}(\Gamma)$ in $\text{VAR/mVAR}$ (Inductive $+Q$ or Capacitive $-Q$).
3. **Interactive Vector SVG Smith Chart**:
   - Conformal bilinear mapping of normalized impedance $z = r + j x = Z_L / Z_0$ onto the complex unit disk $|\Gamma| \le 1$.
   - Constant resistance circles: $r \in \{0, 0.2, 0.5, 1.0, 2.0, 5.0\}$.
   - Constant reactance arcs: $x \in \{\pm 0.2, \pm 0.5, \pm 1.0, \pm 2.0, \pm 5.0\}$.
   - Prime center match point ($z = 1 + j 0 \implies \Gamma = 0$), open circuit ($z = \infty \implies \Gamma = +1$), and short circuit ($z = 0 \implies \Gamma = -1$).
   - Constant-$|\Gamma|$ VSWR Circle: Interactive toggleable dashed circle centered at $(0,0)$ through the cursor, with real-axis line impedance extrema markers $Z_{\max} = Z_0 \times \text{VSWR}$ and $Z_{\min} = Z_0 / \text{VSWR}$.
   - Interactive draggable impedance cursor with pointer capture, bidirectional real-time synchronization with $R_L$ and $X_L$ inputs, and polar tooltip.
4. **Analytical L-Section Matching Network Synthesizer & Circuit Schematics**:
   - Given operating RF frequency $f_0$ ($\text{MHz}$), characteristic impedance $Z_0$, and complex load $Z_L$:
     - For $R_L > Z_0$: Synthesizes shunt-first topology (shunt element across load, series element toward source).
     - For $R_L < Z_0$: Synthesizes series-first topology (series element on load side, shunt element on source side).
   - Generates dual circuit solutions:
     - **Low-Pass Topology**: Series inductor ($L$ in $\text{nH}$) and shunt capacitor ($C$ in $\text{pF}$) providing DC path and harmonic suppression.
     - **High-Pass Topology**: Series capacitor ($C$ in $\text{pF}$) and shunt inductor ($L$ in $\text{nH}$) providing DC blocking.
   - Interactive Inline Circuit Schematics: Dedicated vector SVG schematic rendered for each topology, graphically displaying the exact connection order (Source $Z_0 \to$ series/shunt $\to$ Load $Z_L \to$ Ground), inductor coils, capacitor plates, loaded quality factor $Q$, and component engineering values.

### Module 5: Error Propagation Equation Generator
Full mathematical uncertainty derivation and propagation engine compliant with ISO GUM and ISO GUM Supplement 1:
1. **Formula Input & Auto-Detection**:
   - Plain text mathematical expression input supporting: `+`, `-`, `*`, `/`, `^`, `sqrt`, `exp`, `ln`, `log10`, `log_b`, `sin`, `cos`, `tan`, `atan`.
   - Automatic variable extraction, intelligently ignoring mathematical and physical constants (`pi`, `e`, `c`, `h`, `hbar`, `kB`, `muB`, `muN`, `a0`, `eps0`).
   - Interactive variable list with individual checkboxes allowing users to specify which parameters have measurement error ($\sigma_i$) and which are exact.
2. **Multi-Base Logarithmic Differentiation**:
   - Natural Logarithm: $\frac{d}{dx}\ln(x) = \frac{1}{x}$.
   - Common (Decadic) Logarithm: $\frac{d}{dx}\log_{10}(x) = \frac{1}{x \ln(10)}$.
   - Arbitrary Base Logarithm: $\frac{d}{dx}\log_b(x) = \frac{1}{x \ln(b)}$ (supports integer and floating-point bases, e.g. $\log_5(x)$, $\log_{2.5}(x)$).
3. **Symbolic Analytical Derivatives via mathjs AST**:
   - Computes analytical first partial derivatives $\frac{\partial f}{\partial x_i}$ and analytical second partial derivatives $\frac{\partial^2 f}{\partial x_i^2}$.
   - Preserves logarithmic constants in AST from collapsing into lossy floating-point decimals during algebraic simplification.
4. **ISO GUM First-Order Gaussian Propagation**:
   - Standard linear uncertainty propagation:
     $$\sigma_f = \sqrt{ \sum_{i \in \text{Uncertain}} \left( \frac{\partial f}{\partial x_i} \sigma_{x_i} \right)^2 + 2 \sum_{i < j} \left( \frac{\partial f}{\partial x_i} \right) \left( \frac{\partial f}{\partial x_j} \right) \text{Cov}(x_i, x_j) }$$
   - Covariance Matrix Toggle: Expandable correlation matrix allowing entry of Pearson correlation coefficients $r_{ij} \in [-1, 1]$, where $\text{Cov}(x_i, x_j) = r_{ij} \sigma_{x_i} \sigma_{x_j}$.
5. **Analytical Substitution Toggle**:
   - Persistent toggle: "Substitute analytical partial derivatives into final equation" (enabled by default).
   - When enabled, displays fully expanded analytical derivative formulas inside the combined radical. When disabled, displays clean compact partial notation $\partial f / \partial x_i$.
6. **ISO GUM Supplement 1 Scale-Invariant Nonlinearity Diagnostic**:
   - Evaluates the dimensionless nonlinearity index:
     $$\eta_{\text{nl}} = \frac{|\Delta_{\text{bias}}|}{\sigma_{\text{linear}}} = \frac{\frac{1}{2} \left| \sum_i \frac{\partial^2 f}{\partial x_i^2} \sigma_{x_i}^2 \right|}{\sigma_{\text{linear}}}$$
   - Regimes:
     - `'extremum'`: Triggered when first derivatives vanish ($\sigma_{\text{linear}} \approx 0$) while curvature exists ($|\frac{\partial^2 f}{\partial x_i^2}| > 0$). Warns that first-order linear expansion is degenerate.
     - `'severe'`: $\eta_{\text{nl}} > 0.15$ (>15% induced expectation bias).
     - `'mild'`: $0.05 \le \eta_{\text{nl}} \le 0.15$ (5% to 15% bias).
     - `'linear'`: $\eta_{\text{nl}} < 0.05$ (<5% bias).
7. **Persistent Second-Order Curvature Correction Toggle**:
   - Accessible at all times to assess non-linear curvature corrections.
   - Computes induced expectation bias shift: $\Delta_{\text{bias}} = \frac{1}{2} \sum_i \frac{\partial^2 f}{\partial x_i^2} \sigma_{x_i}^2$.
   - Computes corrected expected value: $E[f] = f_0 + \Delta_{\text{bias}}$.
   - Computes second-order corrected standard uncertainty:
     $$\sigma_{f,\text{2nd}} = \sqrt{ \sigma_{\text{linear}}^2 + \frac{1}{2} \sum_i \left( \frac{\partial^2 f}{\partial x_i^2} \cdot \sigma_{x_i}^2 \right)^2 }$$
   - Comparison pill renders: `Linear: f ± σ_linear → 2nd-Order Corrected: E[f] ± σ_corrected (Shift: Δ_bias)`.
8. **Dual-Mode Clipboard Copy & Metrology Formatting**:
   - "Copy LaTeX": Copies clean, formatted LaTeX source code for papers and reports.
   - "Copy Result": Copies formatted $f \pm \sigma_f$ with strict ISO GUM significant figure rounding (uncertainties rounded to 1 or 2 sig figs, nominal value rounded to matching decimal place).

### Module 6: Atomic & Molecular Preset Library
Curated transition library covering benchmark atomic and cold-molecule laser cooling systems:
1. **Cold Molecule Laser Cooling Presets (Peer-Reviewed Literature Ground Truth)**:
   - **AlCl (Aluminum Monochloride)**: Reference: J. R. Daniel et al., *Phys. Rev. A* 108, 062821 (2023) and L.-R. Liu et al., *Phys. Rev. A* 111, 062810 (2025) (UConn & UC Riverside). Main cycling line $A^1\Pi(v'=0) \leftarrow X^1\Sigma^+(v''=0)$ at $\lambda = 261.5\,\text{nm}$, $\Gamma/2\pi = 25.0\,\text{MHz}$ ($\tau \approx 6.0\,\text{ns}$), $I_{\text{sat}} = 232.0\,\text{mW/cm}^2$, Stark-measured permanent dipole moment $\mu_X = 1.679(2)\,\text{D} \approx 1.68\,\text{D}$, with vibrational repump lines near $261.8\,\text{nm}$ ($v=1\to 0$) and $262.2\,\text{nm}$ ($v=2\to 1$).
   - **CaF (Calcium Monofluoride)**: Reference: S. Truppe et al., *Nature Physics* 13, 1173 (2017); L. W. Cheuk et al., *Phys. Rev. Lett.* 116, 143001 (2016); B. Hemmerling et al., *J. Phys. B* 49, 174001 (2016); T. E. Wall et al., *Phys. Rev. A* 78, 062509 (2008). Green slowing/detection line $B^2\Sigma^+ \leftarrow X^2\Sigma^+$ at $531.0\,\text{nm}$ ($\Gamma/2\pi = 6.3\,\text{MHz}$, $I_{\text{sat}} = 4.4\,\text{mW/cm}^2$, $d = 3.07\,\text{D}$) and orange main cooling/trapping line $A^2\Pi_{1/2} \leftarrow X^2\Sigma^+$ at $606.3\,\text{nm}$ ($\Gamma/2\pi = 8.3\,\text{MHz}$, $I_{\text{sat}} = 4.9\,\text{mW/cm}^2$, $d = 3.07\,\text{D}$).
   - **AlF (Aluminum Monofluoride)**: Reference: S. Truppe, S. Marx, S. Kray, M. Doppelbauer, S. Hofsäss et al., *Phys. Rev. A* 100, 052513 (2019) (Fritz Haber Institute of the Max Planck Society). Deep UV cycling line $A^1\Pi \leftarrow X^1\Sigma^+$ at $227.5\,\text{nm}$ ($\tau = 1.90\,\text{ns} \implies \Gamma/2\pi = 84.0\,\text{MHz}$, $I_{\text{sat}} = 930.0\,\text{mW/cm}^2$ or $0.93\,\text{W/cm}^2$, Stark dipole $\mu_X = 1.515\,\text{D}$).
2. **Alkali Metal Presets (Steck Alkali Data Sheets & NIST)**:
   - Reference: D. A. Steck, *Rubidium 87 D Line Data*, *Rubidium 85 D Line Data*, *Cesium D Line Data*, University of Oregon / Los Alamos National Laboratory.
   - **Rubidium-87 ($^{87}\text{Rb}$)**: D2 line ($780.241\,\text{nm}$, $\Gamma/2\pi = 6.067\,\text{MHz}$, $I_{\text{sat}} = 1.669\,\text{mW/cm}^2$, dipole matrix element $10.745\,\text{D} = 3.584 \times 10^{-29}\,\text{C}\cdot\text{m}$) and D1 line ($794.979\,\text{nm}$, $\Gamma/2\pi = 5.750\,\text{MHz}$, $I_{\text{sat}} = 4.484\,\text{mW/cm}^2$, dipole matrix element $7.606\,\text{D} = 2.537 \times 10^{-29}\,\text{C}\cdot\text{m}$).
   - **Rubidium-85 ($^{85}\text{Rb}$)**: D2 line ($780.241\,\text{nm}$, $\Gamma/2\pi = 6.067\,\text{MHz}$, $I_{\text{sat}} = 1.669\,\text{mW/cm}^2$, $d = 10.745\,\text{D}$) and D1 line ($794.979\,\text{nm}$, $\Gamma/2\pi = 5.750\,\text{MHz}$, $I_{\text{sat}} = 4.484\,\text{mW/cm}^2$, $d = 7.606\,\text{D}$).
   - **Cesium-133 ($^{133}\text{Cs}$)**: Primary SI standard D2 line ($852.347\,\text{nm}$, $\Gamma/2\pi = 5.234\,\text{MHz}$, $I_{\text{sat}} = 1.102\,\text{mW/cm}^2$, dipole matrix element $11.956\,\text{D} = 3.988 \times 10^{-29}\,\text{C}\cdot\text{m}$) and D1 line ($894.593\,\text{nm}$, $\Gamma/2\pi = 4.575\,\text{MHz}$, $I_{\text{sat}} = 2.498\,\text{mW/cm}^2$, dipole matrix element $8.343\,\text{D} = 2.783 \times 10^{-29}\,\text{C}\cdot\text{m}$).
3. **Alkaline-Earth Optical Clocks & Cooling**:
   - Reference: NIST Atomic Spectra Database; J. E. Sansonetti and G. Nave, *J. Phys. Chem. Ref. Data* 39, 033103 (2010); A. D. Ludlow et al., *Rev. Mod. Phys.* 87, 637 (2015); M. M. Boyd et al., *Science* 314, 1430 (2006); H. Katori et al., *Phys. Rev. Lett.* 82, 1116 (1999).
   - **Strontium-88 ($^{88}\text{Sr}$)**: Broad blue cooling line ($^1S_0 \rightarrow {}^1P_1$, $460.862\,\text{nm}$, $\Gamma/2\pi = 30.5\,\text{MHz}$, $I_{\text{sat}} = 40.3\,\text{mW/cm}^2$, reduced dipole element $13.34\,\text{D}$) and narrow red intercombination line ($^1S_0 \rightarrow {}^3P_1$, $689.449\,\text{nm}$, $\Gamma/2\pi = 7.40\,\text{kHz}$, $I_{\text{sat}} = 3.0\,\mu\text{W/cm}^2$, $d = 0.05\,\text{D}$).
   - **Strontium-87 ($^{87}\text{Sr}$)**: Ultra-narrow optical lattice clock transition ($^1S_0 \rightarrow {}^3P_0$, $698.446\,\text{nm}$, natural linewidth $1.2\,\text{mHz}$, $I_{\text{sat}} \approx 4 \times 10^{-10}\,\text{mW/cm}^2$). CIPM recommended optical frequency standard.
4. **Custom User Preset Manager**:
   - Persistent `localStorage` store for custom species, cavity resonances, or lab-specific lasers.
   - Full CRUD: Add, edit, delete, export as JSON, import from JSON.
   - One-click "Load into Converter" populates wavelength, linewidth, and saturation intensity into all calculators.

### Module 7: Lab Productivity & System Features
1. **Command Palette (`Cmd+K` / `Ctrl+K`)**:
   - Instant fuzzy search across all calculators, tabs, atomic presets, and system settings.
2. **Formula & Metrology Provenance Inspector**:
   - Comprehensive reference panel with official CODATA 2022 physical constants, 26 publication-grade KaTeX mathematical formulas, and a dedicated Zero-Trust Verification & Metrology Provenance Card.
   - Displays SHA-256 cryptographic checksums for all 5 precompiled Wolfram golden reference fixtures (`tests/fixtures/`).
   - Full AI authorship disclosure explaining the decoupled Wolfram CAS verification methodology, inherent limitations, and distinguishing autonomous symbolic calculus from scripted textbook formulas.
   - Open-Source Verification Suite & Provenance button linking directly to GitHub (`https://github.com/MarkSemco/AMO-Units`), allowing researchers to inspect source code and reproduce all tests locally.
3. **Conversion History Drawer**:
   - Slide-over panel tracking recent calculations with timestamps and one-click value recall.
4. **Place-Aware Digit Stepper**:
   - Global keyboard handler: Pressing `ArrowUp` or `ArrowDown` inside any numeric input increments or decrements the exact decimal place where the cursor is positioned (e.g. stepping the tenths place on `780.24` increments to `780.34`).
   - Holding `Shift` applies a $10\times$ multiplier.
   - Full support for scientific notation exponents and mantissas, European comma decimals, and selection ranges.
5. **Precision Scientific Dark Theme**:
   - Refined slate/zinc palette (`#0B0F17` base, `#111827` surface, `#1E293B` elevated) designed for dim optics rooms with zero neon glare.
6. **100% Offline Progressive Web App (PWA)**:
   - Client-side Service Worker precaching with local KaTeX fonts.

---

## 4. User Stories

### P0 (Must-Have Production Scope)

| ID | As a... | I want to... | So that... | Priority | Status |
|----|---------|-------------|-----------|----------|--------|
| **US-001** | AMO Researcher | Type in an optical wavelength ($\lambda = 261.5\,\text{nm}$) | All related units ($\text{THz}, \text{eV}, \text{J}, \text{cm}^{-1}, \text{K}, E_h$) update instantly without clicking convert | P0 | ✅ Implemented |
| **US-002** | Lab Physicist | Type an RF power in dBm (e.g. 13 dBm) | I immediately see $V_{\text{pp}}$, $V_{\text{rms}}$, and mW at $50\,\Omega$ for my signal generator | P0 | ✅ Implemented |
| **US-003** | Laser Experimentalist | Select an atomic/molecular preset (e.g. AlCl 261.5 nm or Sr 461 nm) | The wavelength, frequency, linewidth, and saturation intensity populate into all calculators | P0 | ✅ Implemented |
| **US-004** | Optics Student | Adjust laser power and waist radius | I get peak intensity $I_0$, Rayleigh range, and Rabi frequency for my transition | P0 | ✅ Implemented |
| **US-005** | RF Engineer | Toggle system impedance from $50\,\Omega$ to $75\,\Omega$ or High-Z ($1\,\text{M}\Omega$) | Voltages and power recalculate accurately according to $V^2/Z_0$ | P0 | ✅ Implemented |
| **US-006** | Experimentalist | Use the app in a basement lab without WiFi | The app loads instantly and performs all calculations offline via PWA caching | P0 | ✅ Implemented |
| **US-007** | Bench Researcher | Switch between dark and light modes | The interface is comfortable to read in a darkened optics room or under fluorescent lighting | P0 | ✅ Implemented |
| **US-008** | Precision Metrologist | Adjust displayed significant figures (4 to 10 digits) | I can match the precision of my wavemeter or frequency comb readout | P0 | ✅ Implemented |
| **US-009** | Lab Physicist | Click a copy icon next to any calculated value | The exact number (or number + unit) is copied to my clipboard for lab notebooks | P0 | ✅ Implemented |
| **US-010** | Researcher | Save a custom laser transition into my user library | I can reuse my lab's specific cavity or laser lines without re-typing parameters | P0 | ✅ Implemented |
| **US-011** | Microwave Specialist | Enter a VSWR (e.g. 1.25) or Return Loss (e.g. 20 dB) | The reflection coefficient $\Gamma$ and mismatch loss update symmetrically | P0 | ✅ Implemented |
| **US-012** | Experimentalist | Open the Formula & Provenance Inspector | I can audit the exact CODATA 2022 constants, 26 physical formulas, Wolfram golden fixture checksums, AI transparency disclosures, and download the standalone source verification archive | P0 | ✅ Implemented |
| **US-013** | AMO Experimentalist | Enter an arbitrary equation (e.g. `2*P / (pi * w0^2)`) and select which variables have errors | The tab automatically generates analytical partial derivatives and the exact symbolic LaTeX error equation | P0 | ✅ Implemented |
| **US-014** | Lab Physicist | Enter numeric values and uncertainties ($x_i \pm \sigma_i$) in error propagation | The tab evaluates nominal $f$ and combined uncertainty $\sigma_f$ with one-click copy buttons | P0 | ✅ Implemented |
| **US-015** | RF Engineer / Experimentalist | Enter complex load $Z_L = R + jX$ or drag on an interactive Smith Chart | I can view complex $\Gamma$, delivered active power, reactive power (VAR), and synthesize L-section matching networks | P0 | ✅ Implemented |
| **US-016** | Optics Experimentalist | Build an optical train with draggable thin and thick lenses | The live ABCD matrix engine simulates Gaussian envelope $w(z)$, detects waists, provides a caliper, and warns on diffraction limits | P0 | ✅ Implemented |
| **US-017** | Metrologist / Physicist | Use ArrowUp/ArrowDown on any digit in any input | The specific decimal place increments or decrements smoothly without floating-point artifacts | P0 | ✅ Implemented |

---

## 5. Acceptance Criteria

### US-001 to US-005: Core AMO & RF Conversion Modules
- [x] Entering optical wavelength $\lambda = 261.5\,\text{nm}$ (AlCl default) live synchronizes frequency ($1146.43\,\text{THz}$), angular frequency, energy ($4.741\,\text{eV}$, Hartree atomic units $E_h \approx 0.1742\,E_h$), wavenumber ($38240.9\,\text{cm}^{-1}$), and equivalent temperature ($55021\,\text{K}$).
- [x] Compact unit pills render abbreviated scientific notation (e.g. `nm`, `µm`, `Å`, `cm⁻¹`, `E_h`) and expand on click into full descriptive unit dropdowns.
- [x] Modifying magnetic field $B$ bidirectionally synchronizes linear Zeeman splittings across Gauss, Tesla, mT, and $\mu$T, with configurable Landé $g$-factor, $\Delta m_F$, and Bohr/Nuclear magneton baselines.
- [x] Modifying RF power (in dBm, dBW, W, mW, $\mu$W) updates $V_{\text{rms}}$, $V_{\text{pp}}$, and $V_{\text{pk}}$ according to characteristic impedance $Z_0$ ($50\,\Omega$, $75\,\Omega$, $1\,\text{M}\Omega$, or custom).
- [x] Attenuation in dB synchronizes with linear power and voltage ratios; scalar VSWR synchronizes symmetrically with reflection coefficient $|\Gamma|$, Return Loss, Mismatch Loss, and percentage power flows.
- [x] Single-spot laser calculator evaluates peak intensity $I_0 = 2P/(\pi w_0^2)$, average intensity $I_0/2$, Rayleigh range $z_R$, and peak electric field $E_0$; Rabi frequency $\Omega$ evaluates under both Saturation ($I_{\text{sat}}, \Gamma$) and Debye dipole moment modes ($d \cdot E_0/\hbar$).

### US-006 to US-012: Lab Productivity, Presets & Metrology Infrastructure
- [x] PWA offline caching via Vite PWA plugin precaches all 46 assets (including KaTeX WOFF/WOFF2 fonts), allowing 100% offline cold boot and execution.
- [x] Precision Scientific Dark Theme (`#0B0F17` base, `#111827` surface, subtle 1px `#243042` borders) eliminates neon glare in dark optics labs, with seamless toggle to cleanroom light mode.
- [x] Precision selector configures 4 to 10 significant digits across all calculated outputs.
- [x] One-click copy buttons copy raw number or formatted `value + unit` to clipboard with visual checkmark confirmation.
- [x] Built-in preset library allows one-click loading of AlCl ($261.5\,\text{nm}$), CaF, AlF, $^{87}\text{Rb}$, $^{85}\text{Rb}$, $^{133}\text{Cs}$, $^{88}\text{Sr}$, and $^{87}\text{Sr}$ into all calculators; Custom preset manager supports LocalStorage CRUD and JSON export/import.
- [x] Command Palette (`Cmd+K` / `Ctrl+K`) allows instant fuzzy navigation to any tab, calculator, or atomic preset.
- [x] Formula & Metrology Provenance Inspector provides complete transparency into official CODATA 2022 constants, 26 verified KaTeX formulas, precompiled Wolfram golden fixture SHA-256 checksums, AI bias mitigation disclosures, and an on-demand download button for the complete verification archive.

### US-013 & US-014: Error Propagation Equation Generator
- [x] Entering expression `2 * P / (pi * w0^2)` auto-detects variables `P` and `w0` (ignoring constant `pi`).
- [x] Toggling checkboxes marks variables as uncertain ($\sigma_i$) or exact.
- [x] Multi-base logarithm differentiation correctly derives $\frac{d}{dx}\ln(x) = \frac{1}{x}$, $\frac{d}{dx}\log_{10}(x) = \frac{1}{x\ln 10}$, and $\frac{d}{dx}\log_b(x) = \frac{1}{x\ln b}$.
- [x] Substitution toggle expands analytical derivatives directly into the final LaTeX equation.
- [x] Covariance matrix toggle allows entering correlation coefficients $r_{ij} \in [-1, 1]$ and includes cross terms in LaTeX and numeric output.
- [x] Evaluates ISO GUM Supplement 1 scale-invariant nonlinearity index $\eta_{\text{nl}} = |\Delta_{\text{bias}}| / \sigma_{\text{linear}}$ and renders status badges (`linear`, `mild`, `severe`, `extremum`).
- [x] Second-order curvature toggle computes expectation bias shift $\Delta_{\text{bias}}$, corrected value $E[f]$, and corrected standard uncertainty $\sigma_{\text{corrected}}$.
- [x] One-click buttons copy clean LaTeX and formatted $f \pm \sigma_f$ with metrology significant figures.

### US-015: Complex RF, Reactive Load, Smith Chart & L-C Matcher
- [x] Entering complex load $Z_L = R + jX$ calculates complex reflection coefficient $\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0}$, return loss, VSWR, delivered real power $P_{\text{del}}$, and reactive power $Q_{\text{VAR}}$.
- [x] Interactive SVG Smith Chart renders constant resistance circles ($r = 0, 0.2, 0.5, 1, 2, 5$) and constant reactance arcs ($x = \pm 0.2, \pm 0.5, \pm 1, \pm 2, \pm 5$).
- [x] Pointer drag on Smith chart updates $R$ and $X$ smoothly and symmetrically in real time.
- [x] Analytical L-section matching synthesizer produces Low-Pass and High-Pass solutions with component values ($L$ in nH, $C$ in pF) and topology layout.

### US-016: Interactive ABCD Matrix Gaussian Beam Simulator
- [x] Simulates Gaussian beam propagation via Kogelnik transformation $q_2 = \frac{A q_1 + B}{C q_1 + D}$.
- [x] Supports free-space drift, thin lenses ($f$), and thick spherical lenses ($R_1, R_2, d_{\text{lens}}, n$) with optical glass presets (N-BK7, Fused Silica, SF11).
- [x] Symmetrical shaded beam envelope $w(z)$ rendered on calibrated millimetric rail at 60 FPS.
- [x] Automatic detection of real focal waist locations $z_{\text{waist}}$ and waist radii $w_{0,\text{sec}}$ with visual badges.
- [x] Draggable virtual caliper line with manual position input and live HUD readout ($z, w(z), 2w(z), R(z), I_0(z)$).
- [x] Paraxial diffraction limit warning triggers when $w_0 < \lambda/\pi$.

### US-017: Place-Aware Digit Stepper
- [x] Pressing ArrowUp / ArrowDown increments/decrements the specific digit place at the cursor.
- [x] Shift key applies $10\times$ step multiplier.
- [x] Fully handles scientific notation mantissas and exponents without loss of cursor position.

---

## 6. Non-Functional Requirements

- **Performance**:
  - Initial cold load time < 800ms.
  - Conversion latency < 10ms (imperceptible delay on keystroke).
  - Symbolic differentiation execution time < 50ms on client CPU.
  - Interactive SVG canvas dragging maintained at 60 FPS.
- **Precision & Numerical Stability**:
  - IEEE 754 64-bit float math with official CODATA 2022 physical constants.
  - Configurable precision formatting (4 to 10 significant digits, default 6).
  - ISO GUM / NIST significant figure uncertainty rounding.
- **Accessibility & UX**:
  - Full keyboard accessibility: Tab navigation across all inputs, `Esc` to close modals, `Cmd+K` / `Ctrl+K` for command palette, ArrowUp/ArrowDown for digit stepping.
  - Graceful error boundaries and inline error indicators for malformed expressions without application crashes.
- **Responsive Layout**:
  - Mobile phone: 375px – 640px (single-column cards, touch targets $\ge 44\text{px}$).
  - Tablet / Small laptop: 641px – 1024px (2-column adaptive grid).
  - Desktop: $\ge 1025px$ (multi-column lab dashboard, side-by-side calculators).
- **Offline Reliability & Cross-Platform Support**:
  - 100% offline functionality via Vite PWA plugin and Service Worker precaching of all HTML, JS, CSS, and KaTeX fonts.
  - Zero external runtime network requests or remote API dependencies.
  - Verified on macOS (Safari, Chrome, Firefox, Edge) and Windows (Chrome, Edge, Firefox).
