/**
 * CODATA 2022 Recommended Values of the Fundamental Physical Constants
 * Source: NIST SP 961 / Committee on Data for Science and Technology (CODATA)
 * https://physics.nist.gov/cuu/Constants/
 */

export interface PhysicalConstant {
  symbol: string;
  name: string;
  value: number;
  unit: string;
  isExact: boolean;
  latex: string;
  description: string;
}

export const CODATA_2022 = {
  /** Speed of light in vacuum (exact) */
  c: 299792458, // m / s

  /** Planck constant (exact) */
  h: 6.62607015e-34, // J * s

  /** Reduced Planck constant h / 2pi */
  hbar: 1.0545718176461565e-34, // J * s

  /** Elementary charge (exact) */
  e: 1.602176634e-19, // C

  /** Boltzmann constant (exact) */
  kB: 1.380649e-23, // J / K

  /** Bohr magneton (e * hbar / (2 * m_e)) */
  muB: 9.2740100783e-24, // J / T

  /** Nuclear magneton (e * hbar / (2 * m_p)) */
  muN: 5.0507837461e-27, // J / T

  /** Bohr radius */
  a0: 5.29177210903e-11, // m

  /** Electric permittivity of vacuum */
  epsilon0: 8.8541878128e-12, // F / m

  /** Magnetic permeability of vacuum */
  mu0: 1.25663706212e-6, // N / A^2

  /** Electron rest mass */
  me: 9.1093837015e-31, // kg

  /** Proton rest mass */
  mp: 1.67262192369e-27, // kg

  /** Free electron Lande g-factor (negative convention: g_e = 2.00231930436256) */
  ge: 2.00231930436256,

  /** Hartree energy in Joules (2 * Ry * h * c) */
  Eh: 4.3597447222071e-18, // J

  /** 1 Debye in Coulomb * meters */
  Debye: 3.33564095198152e-30 // C * m
} as const;

export const CONSTANTS_LIST: PhysicalConstant[] = [
  {
    symbol: 'c',
    name: 'Speed of light in vacuum',
    value: CODATA_2022.c,
    unit: 'm / s',
    isExact: true,
    latex: 'c = 299\\,792\\,458\\text{ m/s}',
    description: 'Exact defined constant in the SI system.'
  },
  {
    symbol: 'h',
    name: 'Planck constant',
    value: CODATA_2022.h,
    unit: 'J · s',
    isExact: true,
    latex: 'h = 6.626\\,070\\,15 \\times 10^{-34}\\text{ J}\\cdot\\text{s}',
    description: 'Relates photon energy to frequency (E = hν).'
  },
  {
    symbol: 'ℏ',
    name: 'Reduced Planck constant',
    value: CODATA_2022.hbar,
    unit: 'J · s',
    isExact: true,
    latex: '\\hbar = \\frac{h}{2\\pi} \\approx 1.054\\,571\\,818 \\times 10^{-34}\\text{ J}\\cdot\\text{s}',
    description: 'Quantum of angular momentum.'
  },
  {
    symbol: 'e',
    name: 'Elementary charge',
    value: CODATA_2022.e,
    unit: 'C',
    isExact: true,
    latex: 'e = 1.602\\,176\\,634 \\times 10^{-19}\\text{ C}',
    description: 'Electric charge carried by a single proton or electron.'
  },
  {
    symbol: 'k_B',
    name: 'Boltzmann constant',
    value: CODATA_2022.kB,
    unit: 'J / K',
    isExact: true,
    latex: 'k_B = 1.380\\,649 \\times 10^{-23}\\text{ J/K}',
    description: 'Relates thermal energy to thermodynamic temperature.'
  },
  {
    symbol: 'μ_B',
    name: 'Bohr magneton',
    value: CODATA_2022.muB,
    unit: 'J / T',
    isExact: false,
    latex: '\\mu_B = \\frac{e\\hbar}{2m_e} \\approx 9.274\\,010\\,078 \\times 10^{-24}\\text{ J/T}',
    description: 'Natural magnetic dipole moment of the electron (~1.399624 MHz/Gauss).'
  },
  {
    symbol: 'μ_N',
    name: 'Nuclear magneton',
    value: CODATA_2022.muN,
    unit: 'J / T',
    isExact: false,
    latex: '\\mu_N = \\frac{e\\hbar}{2m_p} \\approx 5.050\\,783\\,746 \\times 10^{-27}\\text{ J/T}',
    description: 'Natural magnetic dipole moment of nucleons (~762.259 Hz/Gauss).'
  },
  {
    symbol: 'a_0',
    name: 'Bohr radius',
    value: CODATA_2022.a0,
    unit: 'm',
    isExact: false,
    latex: 'a_0 = \\frac{4\\pi \\epsilon_0 \\hbar^2}{m_e e^2} \\approx 5.291\\,772 \\times 10^{-11}\\text{ m}',
    description: 'Most probable distance between proton and electron in ground-state hydrogen.'
  },
  {
    symbol: 'ε_0',
    name: 'Vacuum permittivity',
    value: CODATA_2022.epsilon0,
    unit: 'F / m',
    isExact: false,
    latex: '\\epsilon_0 \\approx 8.854\\,187\\,813 \\times 10^{-12}\\text{ F/m}',
    description: 'Capability of vacuum to permit electric field lines.'
  },
  {
    symbol: 'μ_0',
    name: 'Vacuum permeability',
    value: CODATA_2022.mu0,
    unit: 'N / A²',
    isExact: false,
    latex: '\\mu_0 \\approx 1.256\\,637\\,062 \\times 10^{-6}\\text{ N/A}^2',
    description: 'Magnetic permeability of free space.'
  }
];
