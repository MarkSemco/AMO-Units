export interface FormulaDocumentation {
  id: string;
  title: string;
  category: 'optical' | 'magnetic' | 'laser' | 'rf' | 'error-prop';
  latex: string;
  description: string;
  variables: Array<{ symbol: string; meaning: string; siUnit: string }>;
}

export const FORMULA_CATALOG: FormulaDocumentation[] = [
  // ==========================================
  // --- Optical & Energy ---
  // ==========================================
  {
    id: 'opt-photon-energy',
    title: 'Photon Energy & Frequency',
    category: 'optical',
    latex: 'E = h\\nu = \\frac{hc}{\\lambda} = \\hbar \\omega',
    description: 'Fundamental Planck-Einstein quantum relation connecting photon energy, frequency, wavelength, and angular frequency.',
    variables: [
      { symbol: 'E', meaning: 'Photon energy', siUnit: 'Joules (J) or eV' },
      { symbol: 'h', meaning: 'Planck constant', siUnit: 'J · s' },
      { symbol: '\\nu', meaning: 'Frequency', siUnit: 'Hertz (Hz)' },
      { symbol: '\\lambda', meaning: 'Vacuum wavelength', siUnit: 'Meters (m)' },
      { symbol: 'c', meaning: 'Speed of light', siUnit: 'm / s' }
    ]
  },
  {
    id: 'opt-wavenumber',
    title: 'Spectroscopic Wavenumber',
    category: 'optical',
    latex: '\\tilde{\\nu} = \\frac{1}{\\lambda} = \\frac{\\nu}{c}',
    description: 'Number of wave cycles per unit length, standard in infrared and optical molecular spectroscopy.',
    variables: [
      { symbol: '\\tilde{\\nu}', meaning: 'Wavenumber', siUnit: 'cm⁻¹ or m⁻¹' },
      { symbol: '\\lambda', meaning: 'Vacuum wavelength', siUnit: 'cm or m' }
    ]
  },
  {
    id: 'opt-thermal-temp',
    title: 'Equivalent Thermal Temperature',
    category: 'optical',
    latex: 'T = \\frac{E}{k_B} = \\frac{h\\nu}{k_B}',
    description: 'Thermal equivalent temperature corresponding to photon or transition energy scale.',
    variables: [
      { symbol: 'T', meaning: 'Temperature', siUnit: 'Kelvin (K)' },
      { symbol: 'k_B', meaning: 'Boltzmann constant', siUnit: 'J / K' }
    ]
  },

  // ==========================================
  // --- Magnetic Field & Zeeman ---
  // ==========================================
  {
    id: 'zeeman-frequency-shift',
    title: 'Linear Zeeman Frequency Shift',
    category: 'magnetic',
    latex: '\\Delta \\nu = \\frac{\\mu_B g_F m_F B}{h}',
    description: 'First-order magnetic sublevel frequency shift of an atomic state under external magnetic field B.',
    variables: [
      { symbol: '\\Delta\\nu', meaning: 'Zeeman frequency shift', siUnit: 'Hz or MHz' },
      { symbol: '\\mu_B', meaning: 'Bohr magneton', siUnit: 'J / Tesla' },
      { symbol: 'g_F', meaning: 'Effective Landé g-factor', siUnit: 'dimensionless' },
      { symbol: 'm_F', meaning: 'Magnetic quantum number projection', siUnit: 'dimensionless' },
      { symbol: 'B', meaning: 'Magnetic flux density', siUnit: 'Tesla or Gauss' }
    ]
  },
  {
    id: 'zeeman-bohr-baseline',
    title: 'Bohr Magneton Frequency Rate',
    category: 'magnetic',
    latex: '\\frac{\\mu_B}{h} \\approx 1.399\\,624\\,49\\text{ MHz/Gauss} = 13.996\\,245\\text{ GHz/Tesla}',
    description: 'Fundamental frequency shift scaling per unit magnetic field for a unit Bohr magneton transition.',
    variables: [
      { symbol: '\\mu_B/h', meaning: 'Gyromagnetic ratio baseline', siUnit: 'Hz / T' }
    ]
  },

  // ==========================================
  // --- Laser Beam, ABCD Propagation & Rabi ---
  // ==========================================
  {
    id: 'laser-peak-intensity',
    title: 'Gaussian Beam Peak Intensity',
    category: 'laser',
    latex: 'I_0 = \\frac{2P}{\\pi w_0^2}',
    description: 'On-axis maximum optical intensity of a TEM₀₀ fundamental Gaussian laser beam with total power P and 1/e² radius w₀.',
    variables: [
      { symbol: 'I_0', meaning: 'Peak on-axis intensity', siUnit: 'W / m² or W / cm²' },
      { symbol: 'P', meaning: 'Total optical power', siUnit: 'Watts (W)' },
      { symbol: 'w_0', meaning: '1/e² beam waist radius', siUnit: 'Meters (m) or µm' }
    ]
  },
  {
    id: 'laser-rayleigh-range',
    title: 'Rayleigh Range & Divergence',
    category: 'laser',
    latex: 'z_R = \\frac{\\pi w_0^2}{\\lambda}, \\quad \\theta = \\frac{\\lambda}{\\pi w_0}',
    description: 'Distance along propagation axis over which beam cross-sectional area doubles, and far-field divergence half-angle.',
    variables: [
      { symbol: 'z_R', meaning: 'Rayleigh range', siUnit: 'Meters (m)' },
      { symbol: '\\theta', meaning: 'Far-field divergence half-angle', siUnit: 'Radians (rad)' }
    ]
  },
  {
    id: 'laser-electric-field',
    title: 'Peak Optical Electric Field',
    category: 'laser',
    latex: 'E_0 = \\sqrt{\\frac{2 I_0}{c \\epsilon_0}}',
    description: 'Electric field amplitude of the propagating laser light in vacuum.',
    variables: [
      { symbol: 'E_0', meaning: 'Electric field amplitude', siUnit: 'V / m' },
      { symbol: '\\epsilon_0', meaning: 'Vacuum permittivity', siUnit: 'F / m' }
    ]
  },
  {
    id: 'laser-rabi-frequency',
    title: 'Rabi Frequency & Pi-Pulse',
    category: 'laser',
    latex: '\\Omega = \\frac{d \\cdot E_0}{\\hbar} = \\Gamma \\sqrt{\\frac{I_0}{2 I_{\\text{sat}}}}, \\quad \\tau_\\pi = \\frac{\\pi}{\\Omega}',
    description: 'Coupling frequency between two quantum states in an oscillating electric field, and duration of a coherent π inversion pulse.',
    variables: [
      { symbol: '\\Omega', meaning: 'Rabi frequency', siUnit: 'rad / s or Hz' },
      { symbol: 'd', meaning: 'Transition dipole moment', siUnit: 'C · m or Debye' },
      { symbol: '\\Gamma', meaning: 'Natural transition linewidth', siUnit: 'rad / s' },
      { symbol: 'I_{\\text{sat}}', meaning: 'Saturation intensity', siUnit: 'W / m²' },
      { symbol: '\\tau_\\pi', meaning: 'π-pulse duration', siUnit: 'Seconds (s) or ns' }
    ]
  },
  {
    id: 'laser-complex-beam-parameter',
    title: 'Complex Beam Parameter q(z)',
    category: 'laser',
    latex: '\\frac{1}{q(z)} = \\frac{1}{R(z)} - j \\frac{\\lambda}{\\pi n w(z)^2}, \\quad q(z) = z + j z_R',
    description: 'Compact complex representation unifying wavefront radius of curvature R(z) and 1/e² spot radius w(z) into a single analytical parameter q(z) in a medium of refractive index n.',
    variables: [
      { symbol: 'q(z)', meaning: 'Complex beam parameter', siUnit: 'Meters (m)' },
      { symbol: 'R(z)', meaning: 'Wavefront radius of curvature', siUnit: 'Meters (m)' },
      { symbol: 'w(z)', meaning: '1/e² beam spot radius', siUnit: 'Meters (m)' },
      { symbol: 'z_R', meaning: 'Rayleigh range π n w₀² / λ', siUnit: 'Meters (m)' },
      { symbol: 'n', meaning: 'Medium refractive index', siUnit: 'dimensionless' },
      { symbol: '\\lambda', meaning: 'Vacuum optical wavelength', siUnit: 'Meters (m)' }
    ]
  },
  {
    id: 'laser-kogelnik-abcd-law',
    title: 'Kogelnik ABCD Beam Transformation Law',
    category: 'laser',
    latex: 'q_2 = \\frac{A q_1 + B}{C q_1 + D}, \\quad \\begin{pmatrix} A & B \\\\ C & D \\end{pmatrix} = \\mathbf{M}_N \\cdots \\mathbf{M}_2 \\mathbf{M}_1',
    description: 'Fundamental transformation law governing the propagation and focusing of Gaussian beams through arbitrary cascaded paraxial optical systems.',
    variables: [
      { symbol: 'q_1', meaning: 'Incident complex beam parameter', siUnit: 'Meters (m)' },
      { symbol: 'q_2', meaning: 'Transformed complex beam parameter', siUnit: 'Meters (m)' },
      { symbol: 'A, B, C, D', meaning: 'Ray transfer matrix elements (det M = AD - BC = 1)', siUnit: 'dimensionless / m / m⁻¹' }
    ]
  },
  {
    id: 'laser-abcd-drift-matrix',
    title: 'Ray Transfer Matrix: Free-Space Drift',
    category: 'laser',
    latex: '\\mathbf{M}_{\\text{drift}}(d) = \\begin{pmatrix} 1 & d \\\\ 0 & 1 \\end{pmatrix}',
    description: 'ABCD matrix for paraxial propagation over distance d in a homogeneous medium.',
    variables: [
      { symbol: 'd', meaning: 'Propagation drift distance along optical axis', siUnit: 'Meters (m) or mm' }
    ]
  },
  {
    id: 'laser-abcd-thin-lens',
    title: 'Ray Transfer Matrix: Thin Lens',
    category: 'laser',
    latex: '\\mathbf{M}_{\\text{lens}}(f) = \\begin{pmatrix} 1 & 0 \\\\ -\\frac{1}{f} & 1 \\end{pmatrix}',
    description: 'ABCD matrix for an idealized thin lens of focal length f (+ converging/focusing, - diverging), imparting quadratic phase curvature without longitudinal translation.',
    variables: [
      { symbol: 'f', meaning: 'Focal length of thin lens', siUnit: 'Meters (m) or mm' }
    ]
  },
  {
    id: 'laser-abcd-thick-lens',
    title: 'Ray Transfer Matrix: Thick Spherical Lens',
    category: 'laser',
    latex: '\\mathbf{M}_{\\text{thick}} = \\begin{pmatrix} 1 - \\frac{n-1}{n}\\frac{d}{R_1} & \\frac{d}{n} \\\\ -\\frac{1}{f} & 1 + \\frac{n-1}{n}\\frac{d}{R_2} \\end{pmatrix}, \\quad \\frac{1}{f} = (n-1)\\left[ \\frac{1}{R_1} - \\frac{1}{R_2} + \\frac{(n-1)d}{n R_1 R_2} \\right]',
    description: 'Full ray transfer matrix and Thick Lensmaker equation for a physical lens of center thickness d, glass index n, and surface curvatures R₁ (front) and R₂ (back).',
    variables: [
      { symbol: 'R_1', meaning: 'Front surface curvature radius (+ convex to incident beam)', siUnit: 'mm' },
      { symbol: 'R_2', meaning: 'Back surface curvature radius (- convex back surface)', siUnit: 'mm' },
      { symbol: 'd', meaning: 'Center glass thickness', siUnit: 'mm' },
      { symbol: 'n', meaning: 'Glass refractive index (e.g. 1.517 for N-BK7)', siUnit: 'dimensionless' },
      { symbol: 'f', meaning: 'Effective focal length', siUnit: 'mm' }
    ]
  },
  {
    id: 'laser-secondary-waist',
    title: 'Transformed Secondary Waist Location & Spot Size',
    category: 'laser',
    latex: 'w_{0,2} = w_{0,1} \\frac{|f|}{\\sqrt{(d_1 - f)^2 + z_{R,1}^2}}, \\quad d_2 = f + \\frac{(d_1 - f) f^2}{(d_1 - f)^2 + z_{R,1}^2}',
    description: 'Closed-form expressions for the secondary beam waist radius w₀,₂ and downstream waist position d₂ produced by a lens at distance d₁ from an incident waist.',
    variables: [
      { symbol: 'w_{0,1}', meaning: 'Initial beam waist radius', siUnit: 'µm or m' },
      { symbol: 'w_{0,2}', meaning: 'Transformed focused beam waist radius', siUnit: 'µm or m' },
      { symbol: 'd_1', meaning: 'Distance from initial waist to lens front principal plane', siUnit: 'mm or m' },
      { symbol: 'd_2', meaning: 'Distance from lens back principal plane to secondary waist', siUnit: 'mm or m' },
      { symbol: 'z_{R,1}', meaning: 'Rayleigh range of initial beam', siUnit: 'mm or m' },
      { symbol: 'f', meaning: 'Lens focal length', siUnit: 'mm or m' }
    ]
  },
  {
    id: 'laser-paraxial-diffraction-limit',
    title: 'Paraxial Gaussian Diffraction Limit',
    category: 'laser',
    latex: 'w_{0, \\text{limit}} = \\frac{\\lambda}{\\pi \\cdot \\text{NA}} \\approx \\frac{\\lambda}{\\pi} \\quad (\\text{for } \\text{NA} \\approx 1)',
    description: 'Fundamental lower physical limit on the minimum achievable Gaussian beam waist radius w₀ imposed by paraxial wave diffraction.',
    variables: [
      { symbol: 'w_{0, \\text{limit}}', meaning: 'Diffraction-limited waist radius', siUnit: 'nm or µm' },
      { symbol: '\\lambda', meaning: 'Optical wavelength', siUnit: 'nm or µm' },
      { symbol: '\\text{NA}', meaning: 'Numerical aperture (sin θ)', siUnit: 'dimensionless' }
    ]
  },

  // ==========================================
  // --- RF Electronics & Complex Impedance ---
  // ==========================================
  {
    id: 'rf-power-voltage',
    title: 'RF Power & Voltage Relation',
    category: 'rf',
    latex: 'P = \\frac{V_{\\text{rms}}^2}{Z_0}, \\quad V_{\\text{peak}} = \\sqrt{2}V_{\\text{rms}}, \\quad V_{\\text{pp}} = 2\\sqrt{2}V_{\\text{rms}}',
    description: 'AC power dissipation across characteristic impedance Z₀ (commonly 50Ω, 75Ω, or high-Z).',
    variables: [
      { symbol: 'P', meaning: 'Average RF power', siUnit: 'Watts (W)' },
      { symbol: 'V_{\\text{rms}}', meaning: 'Root-mean-square voltage', siUnit: 'Volts (V)' },
      { symbol: 'V_{\\text{pp}}', meaning: 'Peak-to-peak voltage', siUnit: 'Volts (V)' },
      { symbol: 'Z_0', meaning: 'Transmission line impedance', siUnit: 'Ohms (Ω)' }
    ]
  },
  {
    id: 'rf-dbm-definition',
    title: 'Decibel-Milliwatts (dBm)',
    category: 'rf',
    latex: 'P_{\\text{dBm}} = 10 \\log_{10}\\left(\\frac{P}{1\\text{ mW}}\\right) = 10 \\log_{10}(P_{\\text{Watts}} \\times 1000)',
    description: 'Logarithmic RF power level referenced to 1 milliwatt.',
    variables: [
      { symbol: 'P_{\\text{dBm}}', meaning: 'Power in dBm', siUnit: 'dBm' },
      { symbol: 'P', meaning: 'Power in Watts', siUnit: 'W' }
    ]
  },
  {
    id: 'rf-vswr-gamma',
    title: 'VSWR, Return Loss & Reflection',
    category: 'rf',
    latex: '|\\Gamma| = \\frac{\\text{VSWR} - 1}{\\text{VSWR} + 1}, \\quad \\text{RL} = -20\\log_{10}|\\Gamma|\\text{ dB}, \\quad \\text{ML} = -10\\log_{10}(1 - |\\Gamma|^2)\\text{ dB}',
    description: 'Transmission line impedance mismatch reflection coefficient |Γ|, Voltage Standing Wave Ratio, Return Loss, and Mismatch Loss.',
    variables: [
      { symbol: '|\\Gamma|', meaning: 'Reflection coefficient magnitude', siUnit: 'dimensionless (0 to 1)' },
      { symbol: '\\text{VSWR}', meaning: 'Voltage Standing Wave Ratio', siUnit: 'dimensionless (≥ 1)' },
      { symbol: '\\text{RL}', meaning: 'Return Loss', siUnit: 'dB' },
      { symbol: '\\text{ML}', meaning: 'Mismatch Loss', siUnit: 'dB' }
    ]
  },
  {
    id: 'rf-complex-impedance',
    title: 'Complex Load Impedance & Admittance',
    category: 'rf',
    latex: 'Z_L = R_L + j X_L, \\quad Y_L = \\frac{1}{Z_L} = G_L + j B_L = \\frac{R_L - j X_L}{R_L^2 + X_L^2}',
    description: 'Complex load impedance with resistive dissipation R_L and reactive energy storage X_L (+ inductive, - capacitive), and its dual admittance Y_L.',
    variables: [
      { symbol: 'Z_L', meaning: 'Complex load impedance', siUnit: 'Ohms (Ω)' },
      { symbol: 'R_L', meaning: 'Load resistance (real resistive part)', siUnit: 'Ohms (Ω)' },
      { symbol: 'X_L', meaning: 'Load reactance (+ inductive, - capacitive)', siUnit: 'Ohms (Ω)' },
      { symbol: 'Y_L', meaning: 'Complex load admittance', siUnit: 'Siemens (S)' },
      { symbol: 'G_L', meaning: 'Load conductance', siUnit: 'Siemens (S)' },
      { symbol: 'B_L', meaning: 'Load susceptance', siUnit: 'Siemens (S)' }
    ]
  },
  {
    id: 'rf-complex-reflection-coefficient',
    title: 'Complex Reflection Coefficient (Smith Chart)',
    category: 'rf',
    latex: '\\Gamma = \\frac{Z_L - Z_0}{Z_L + Z_0} = |\\Gamma| e^{j \\phi}, \\quad z_L = \\frac{Z_L}{Z_0} = \\frac{1 + \\Gamma}{1 - \\Gamma}',
    description: 'Bilinear conformal mapping between complex load impedance Z_L and reflection coefficient Γ in the complex plane (the mathematical foundation of the Smith Chart).',
    variables: [
      { symbol: '\\Gamma', meaning: 'Complex reflection coefficient', siUnit: 'dimensionless (|Γ| ≤ 1)' },
      { symbol: '|\\Gamma|', meaning: 'Reflection magnitude', siUnit: 'dimensionless' },
      { symbol: '\\phi', meaning: 'Phase angle arg(Γ)', siUnit: 'Radians or Degrees' },
      { symbol: 'Z_L', meaning: 'Complex load impedance', siUnit: 'Ohms (Ω)' },
      { symbol: 'Z_0', meaning: 'Transmission line characteristic impedance (e.g. 50 Ω)', siUnit: 'Ohms (Ω)' },
      { symbol: 'z_L', meaning: 'Normalized load impedance Z_L / Z_0', siUnit: 'dimensionless' }
    ]
  },
  {
    id: 'rf-real-reactive-power',
    title: 'Delivered Real Power & Stored Reactive Power (VAR)',
    category: 'rf',
    latex: 'P_{\\text{del}} = P_{\\text{inc}}(1 - |\\Gamma|^2), \\quad Q = 2 P_{\\text{inc}} |\\Gamma| \\sin(\\phi)',
    description: 'Active power absorbed and dissipated by the load versus circulating reactive exchange power Q stored in oscillating near-fields, expressed in Volt-Amperes Reactive (VAR).',
    variables: [
      { symbol: 'P_{\\text{del}}', meaning: 'Real active power delivered to load', siUnit: 'Watts (W)' },
      { symbol: 'P_{\\text{inc}}', meaning: 'Incident forward RF power', siUnit: 'Watts (W)' },
      { symbol: '|\\Gamma|', meaning: 'Reflection coefficient magnitude', siUnit: 'dimensionless' },
      { symbol: 'Q', meaning: 'Stored reactive power', siUnit: 'Volt-Amperes Reactive (VAR)' },
      { symbol: '\\phi', meaning: 'Phase angle of complex reflection coefficient', siUnit: 'Radians' }
    ]
  },
  {
    id: 'rf-l-matching-network',
    title: 'L-Section Reactive Impedance Matching',
    category: 'rf',
    latex: 'Q_{\\text{match}} = \\sqrt{\\frac{R_{\\text{high}}}{R_{\\text{low}}} - 1}, \\quad X_s = Q_{\\text{match}} R_{\\text{low}}, \\quad X_p = \\frac{R_{\\text{high}}}{Q_{\\text{match}}}',
    description: 'Analytic design equations for lossless two-reactive-element L-networks transforming load resistance R_L to Z₀ at operating frequency f₀. Lowpass (series L, shunt C) or Highpass (series C, shunt L) topologies cancel reactive mismatch.',
    variables: [
      { symbol: 'Q_{\\text{match}}', meaning: 'Loaded quality factor of matching network', siUnit: 'dimensionless' },
      { symbol: 'R_{\\text{high}}', meaning: 'Greater of {Z₀, R_L}', siUnit: 'Ohms (Ω)' },
      { symbol: 'R_{\\text{low}}', meaning: 'Lesser of {Z₀, R_L}', siUnit: 'Ohms (Ω)' },
      { symbol: 'X_s', meaning: 'Series arm reactance', siUnit: 'Ohms (Ω)' },
      { symbol: 'X_p', meaning: 'Parallel shunt arm reactance', siUnit: 'Ohms (Ω)' },
      { symbol: 'L', meaning: 'Inductor value L = |X| / (2π f)', siUnit: 'Henries (H) or nH' },
      { symbol: 'C', meaning: 'Capacitor value C = 1 / (2π f |X|)', siUnit: 'Farads (F) or pF' }
    ]
  },

  // ==========================================
  // --- Error Propagation & Derivatives ---
  // ==========================================
  {
    id: 'error-propagation-gaussian',
    title: 'Gaussian Error Propagation (ISO GUM)',
    category: 'error-prop',
    latex: '\\sigma_f = \\sqrt{ \\sum_{i} \\left( \\frac{\\partial f}{\\partial x_i} \\sigma_{x_i} \\right)^2 + 2 \\sum_{i < j} \\left( \\frac{\\partial f}{\\partial x_i} \\right) \\left( \\frac{\\partial f}{\\partial x_j} \\right) \\text{Cov}(x_i, x_j) }',
    description: 'Analytical propagation of experimental standard uncertainties through an arbitrary multi-variable function f(x₁, x₂, ...) in accordance with the ISO Guide to the Expression of Uncertainty in Measurement (GUM).',
    variables: [
      { symbol: '\\sigma_f', meaning: 'Combined standard uncertainty', siUnit: 'Same unit as f' },
      { symbol: '\\partial f / \\partial x_i', meaning: 'Analytical partial derivative with respect to variable x_i', siUnit: 'unit(f) / unit(x_i)' },
      { symbol: '\\sigma_{x_i}', meaning: 'Standard uncertainty of input variable x_i', siUnit: 'unit(x_i)' },
      { symbol: '\\text{Cov}(x_i, x_j)', meaning: 'Covariance term = r_{ij} σ_{x_i} σ_{x_j}', siUnit: 'unit(x_i) · unit(x_j)' }
    ]
  },
  {
    id: 'error-prop-logarithmic-derivatives',
    title: 'Logarithmic Partial Derivatives',
    category: 'error-prop',
    latex: '\\frac{d}{dx}\\ln(x) = \\frac{1}{x}, \\quad \\frac{d}{dx}\\log_{10}(x) = \\frac{1}{x \\ln(10)}, \\quad \\frac{d}{dx}\\log_b(x) = \\frac{1}{x \\ln(b)}',
    description: 'Exact analytical derivative formulas for natural logarithms ln(x), decadic (common) logarithms log₁₀(x), and arbitrary base-b logarithms log_b(x) across decibel, optical density, and logarithmic gain uncertainty calculations.',
    variables: [
      { symbol: 'x', meaning: 'Input argument (x > 0)', siUnit: 'dimensionless or physical unit' },
      { symbol: '\\ln(x)', meaning: 'Natural logarithm (base e)', siUnit: 'dimensionless' },
      { symbol: '\\log_{10}(x)', meaning: 'Common decadic logarithm (base 10)', siUnit: 'dimensionless' },
      { symbol: 'b', meaning: 'Arbitrary logarithm base (b > 0, b ≠ 1)', siUnit: 'dimensionless' }
    ]
  },
  {
    id: 'error-prop-second-order-extrema',
    title: 'Second-Order Extrema Uncertainty Expansion',
    category: 'error-prop',
    latex: '\\sigma_f \\approx \\frac{1}{\\sqrt{2}} \\left| f^{\\prime\\prime}(x_0) \\right| \\sigma_x^2 \\quad \\left( \\text{when } f^\\prime(x_0) = 0 \\right)',
    description: 'Second-order Taylor expansion error propagation at a local extremum or stationary inflection point where the first derivative f\'(x₀) vanishes. The standard linear first-order GUM equation evaluates to zero, requiring quadratic curvature |f\'\'(x₀)| with the root-mean-square normal distribution factor 1/√2.',
    variables: [
      { symbol: '\\sigma_f', meaning: 'Propagated second-order standard uncertainty at the extremum', siUnit: 'Same unit as f' },
      { symbol: 'f^{\\prime\\prime}(x_0)', meaning: 'Second derivative (curvature) evaluated at x₀', siUnit: 'unit(f) / unit(x)²' },
      { symbol: '\\sigma_x', meaning: 'Standard uncertainty of input variable x', siUnit: 'unit(x)' },
      { symbol: '1/\\sqrt{2}', meaning: 'Root-mean-square coefficient for normally distributed quadratic variable (≈ 0.7071)', siUnit: 'dimensionless' }
    ]
  }
];
