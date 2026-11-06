# 🎨 Design System & UI Specifications — AMO Units

## 1. Design Philosophy

**AMO Units** is engineered specifically for high-intensity, dim-room scientific laboratories. The interface balances high information density with zero visual fatigue.

1. **Precision Scientific Dark Palette**: Basement optics laboratories, laser cleanrooms, and spectroscopic workstations operate in dim lighting. The primary theme uses a deep slate/zinc base (`#0B0F17`) with refined slate-900 surfaces (`#111827`) and crisp 1px neutral borders (`#243042`). High-luminance neon glows and saturated blinding highlights are strictly eliminated to prevent eye strain.
2. **Harmonized Domain Accent Colors**: Subtle, non-neon accent colors visually categorize physical and mathematical domains:
   - **Scientific Sky / Cyan (`#38BDF8`)** for Optical, Photon Energy, Wavelength, and Frequency.
   - **Amber (`#F59E0B`)** for RF Electronics, Microwave Power, Attenuation, and Impedance.
   - **Emerald (`#10B981`)** for Magnetic Fields, Zeeman Splitting, and Magnetons.
   - **Purple / Lilac (`#C084FC`)** for Laser Optics, Gaussian Waists, and Rabi Frequencies.
   - **Indigo (`#818CF8`)** for Error Propagation, Symbolic Derivatives, and Nonlinearity Diagnostics.
   - **Blue (`#60A5FA`)** for Atomic/Molecular Presets and Species Libraries.
3. **Tabular Monospaced Digits & Rendered KaTeX**: Every numerical input, calculated result, and table entry uses tabular monospaced typography (`JetBrains Mono`, `Fira Code`, `Roboto Mono`, or system monospace). Physical formulas and generated uncertainty equations are rendered using publication-grade KaTeX typography.
4. **Ergonomic Density & Touch Standards**: High desktop information density allows experimentalists to monitor interconnected parameters simultaneously, with mobile-first touch targets $\ge 44\text{px}$ for tablets and lab smartphones.

---

## 2. Color Palette & Design Tokens

### 2.1 CSS Custom Properties (`src/styles/tokens.css`)

```css
:root {
  /* Precision Scientific Dark Theme (Default) */
  --color-bg-base: #0B0F17;              /* Deep space slate */
  --color-bg-surface: #111827;           /* Refined slate-900 surface */
  --color-bg-surface-elevated: #1E293B;  /* Slate-800 elevated panels & modals */
  --color-bg-input: #090D16;             /* Inset dark input background */
  --color-bg-input-hover: #0F172A;
  
  --color-border-subtle: #243042;        /* Crisp 1px neutral border */
  --color-border-strong: #3E4C5E;        /* Active/focused neutral border */
  
  --color-text-primary: #F8FAFC;         /* High-contrast white/slate */
  --color-text-secondary: #94A3B8;       /* Muted label text */
  --color-text-muted: #64748B;           /* Hints, shortcuts, inactive icons */
  
  /* Tasteful, Non-Neon Domain Accent Colors */
  --color-optical: #38BDF8;              /* Scientific Sky/Cyan - Optical */
  --color-optical-glow: rgba(56, 189, 248, 0.08);
  --color-optical-badge: rgba(56, 189, 248, 0.12);
  
  --color-rf: #F59E0B;                   /* Amber - RF Electronics */
  --color-rf-glow: rgba(245, 158, 11, 0.08);
  --color-rf-badge: rgba(245, 158, 11, 0.12);
  
  --color-magnetic: #10B981;             /* Emerald - Magnetic & Zeeman */
  --color-magnetic-glow: rgba(16, 185, 129, 0.08);
  --color-magnetic-badge: rgba(16, 185, 129, 0.12);
  
  --color-laser: #C084FC;                /* Purple/Lilac - Laser & Rabi */
  --color-laser-glow: rgba(192, 132, 252, 0.08);
  --color-laser-badge: rgba(192, 132, 252, 0.12);
  
  --color-error-prop: #818CF8;           /* Indigo - Error Propagation */
  --color-error-prop-glow: rgba(129, 140, 248, 0.08);
  --color-error-prop-badge: rgba(129, 140, 248, 0.12);
  
  --color-preset: #60A5FA;               /* Blue - Presets & Species */
  --color-preset-glow: rgba(96, 165, 250, 0.08);
  --color-preset-badge: rgba(96, 165, 250, 0.12);
  
  /* Status Colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Typography Scale */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Roboto Mono', Menlo, Monaco, Consolas, monospace;
  
  --font-size-2xs: 0.6875rem; /* 11px */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing */
  --space-2xs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Border Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  /* Shadows - Crisp, non-glow */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4);

  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Light Theme Overrides (Cleanroom / Bright Office Mode) */
[data-theme="light"] {
  --color-bg-base: #F8FAFC;
  --color-bg-surface: #FFFFFF;
  --color-bg-surface-elevated: #F1F5F9;
  --color-bg-input: #FFFFFF;
  --color-bg-input-hover: #F8FAFC;
  
  --color-border-subtle: #E2E8F0;
  --color-border-strong: #CBD5E1;
  
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #94A3B8;
  
  --color-optical: #0284C7;
  --color-optical-glow: rgba(2, 132, 199, 0.06);
  --color-optical-badge: rgba(2, 132, 199, 0.10);
  
  --color-rf: #D97706;
  --color-rf-glow: rgba(217, 119, 6, 0.06);
  --color-rf-badge: rgba(217, 119, 6, 0.10);
  
  --color-magnetic: #059669;
  --color-magnetic-glow: rgba(5, 150, 105, 0.06);
  --color-magnetic-badge: rgba(5, 150, 105, 0.10);
  
  --color-laser: #9333EA;
  --color-laser-glow: rgba(147, 51, 234, 0.06);
  --color-laser-badge: rgba(147, 51, 234, 0.10);
  
  --color-error-prop: #6366F1;
  --color-error-prop-glow: rgba(99, 102, 241, 0.06);
  --color-error-prop-badge: rgba(99, 102, 241, 0.10);
  
  --color-preset: #2563EB;
  --color-preset-glow: rgba(37, 99, 235, 0.06);
  --color-preset-badge: rgba(37, 99, 235, 0.10);

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
}
```

---

## 3. Core Component UI Patterns

### 3.1 Synced Input Field with Compact Unit Pills (`SyncedInput.tsx`)
The fundamental building block across all conversion modules:
- **Layout & Structure**:
  - Top Line: Field label, mathematical symbol ($\lambda, \nu, P, \Gamma$), and optional tooltip description.
  - Center Input: Large monospaced input field (`--font-size-lg`, `--font-mono`) displaying the numeric string.
  - Trailing Accessories:
    - **Compact Unit Pill**: Renders clean abbreviated scientific units (e.g. `nm`, `µm`, `Å`, `cm⁻¹`, `E_h`, `D`). Clicking the pill reveals a native dropdown with full descriptive unit names (e.g. `Angstroms (Å)`, `Hartree (E_h)`).
    - **One-Click Copy Button**: Icon button that copies either raw number or formatted `value + unit` to clipboard with instant visual checkmark feedback.
- **Interactive States**:
  - Normal: Subtle 1px neutral border (`--color-border-subtle`).
  - Hover: Background subtle lift (`--color-bg-input-hover`).
  - Active/Typing: Crisp 1px border highlighted with domain accent color and a subtle 2px glow ring (`box-shadow: 0 0 0 2px var(--color-[domain]-glow)`).
  - Place-Aware Digit Stepper: `ArrowUp` / `ArrowDown` increments/decrements the digit at the cursor position without losing selection state.

### 3.2 Interactive Vector SVG Smith Chart (`SmithChart.tsx`)
A vector-based RF impedance visualization and interactive matching interface:
- **Geometry & Rendering**:
  - Bounding Circle: Neutral perimeter circle representing $|\Gamma| = 1.0$ ($0\,\text{dB}$ Return Loss).
  - Constant Resistance Circles ($r \in \{0, 0.2, 0.5, 1.0, 2.0, 5.0\}$): Fine 1px SVG arcs centered along the real axis.
  - Constant Reactance Arcs ($x \in \{\pm 0.2, \pm 0.5, \pm 1.0, \pm 2.0, \pm 5.0\}$): Upper arcs (inductive $+jX$) and lower arcs (capacitive $-jX$).
  - Center Match Marker: Distinct crosshair at normalized $z = 1.0 + j0.0$ ($50\,\Omega$ match, $|\Gamma| = 0$).
- **Interaction Model**:
  - Draggable Impedance Cursor: Highlighted circular cursor representing active load $Z_L = R_L + jX_L$.
  - Real-Time Pointer Tracking: Supports click, touch, and drag across the Smith disk with `setPointerCapture`.
  - Floating Tooltip HUD: Displays real-time readout of $R + jX\,\Omega$, polar impedance $|Z_L|\angle\theta$, reflection coefficient $\Gamma$, and Return Loss.
  - Dynamic Sync: Dragging the cursor immediately updates the numeric inputs and L-section matching network synthesizer.

### 3.3 Interactive ABCD Optical Bench Canvas (`BeamPropagationCanvas.tsx`)
A paraxial Gaussian beam propagation simulator canvas:
- **Calibrated Coordinate Frame**:
  - Calibrated millimetric horizontal rail ($z$-axis) with tick intervals, distance labels, and dark grid backdrop.
  - Calibrated vertical scale ($y$-axis) displaying beam spot radius $w\,[\mu\text{m}]$.
- **Beam Envelope & Optics Geometry**:
  - Symmetrical Shaded Gaussian Profile: Dynamically sampled polygon displaying the $1/e^2$ beam envelope $w(z)$ in semi-transparent purple/lilac (`--color-laser-glow`).
  - Thin Lenses: Rendered with realistic biconvex (converging, $f > 0$) or biconcave (diverging, $f < 0$) curved SVG geometry with optical axis reference line.
  - Thick Spherical Lenses: Realistic glass blocks with front curvature $R_1$, back curvature $R_2$, glass thickness $d_{\text{lens}}$, and refractive index tint.
  - Interactive Drag Handles: Optical elements can be dragged along the rail at 60 FPS with immediate envelope recalculation.
- **Waist Markers & Profiling Caliper**:
  - Secondary Focal Waist Badges: Rendered at focal locations $z_{\text{waist}}$ with spot size pills ($w_{0,\text{sec}}$).
  - Virtual Caliper Line: Draggable vertical caliper line along the rail, complemented by a manual numeric input field with place-aware digit stepping.
  - Live Caliper HUD: Instant readout of $z$, $w(z)$, full beam diameter $2w(z)$, wavefront curvature $R(z)$, and peak optical intensity $I_0(z)$.
  - Paraxial Diffraction Warning Banner: Prominent amber banner alerts the user whenever $w_0 < \lambda/\pi$.

### 3.4 Error Propagation Equation & Nonlinearity Card (`ErrorPropagationView.tsx`)
- **Formula Input Bar**: Monospaced mathematical expression input with instant syntax validation and variable extraction tags.
- **Variable Checklist**: Horizontal pill list of detected symbols with toggles for uncertain ($\sigma_i$) vs exact parameters.
- **KaTeX Equation Display**: Recessed dark container rendering publication-ready LaTeX error equations, with a persistent toggle for analytical partial derivative substitution.
- **ISO GUM Supplement 1 Diagnostic Banner**:
  - Automatically classifies the measurement function into `'linear'`, `'mild'`, `'severe'`, or `'extremum'` regimes.
  - Renders appropriate status badges and warnings when first-order linear expansion is invalid.
- **Second-Order Curvature Comparison Pill**:
  - When second-order corrections are activated, displays comparison pill:
    `Linear: f ± σ_linear → 2nd-Order Corrected: E[f] ± σ_corrected (Shift: Δ_bias)`.
- **Action Toolbar**: Dual action buttons for "Copy LaTeX" (clean code for papers) and "Copy Result" (formatted $f \pm \sigma_f$).

### 3.5 Segmented Toggle Group (`ToggleGroup.tsx`)
Used for impedance selection ($50\,\Omega$, $75\,\Omega$, $1\,\text{M}\Omega$, Custom) and simulator view modes ([Single Spot] vs [ABCD Bench]):
- Recessed pill-shaped container (`--radius-full` or `--radius-sm`).
- Active segment features elevated background surface, strong contrast text, and smooth 150ms ease transition.

### 3.6 Preset Selection Cards (`PresetLibraryView.tsx`)
- Categorized cards for Molecular Systems (AlCl, CaF, AlF), Alkali Metals ($^{87}\text{Rb}$, $^{85}\text{Rb}$, $^{133}\text{Cs}$), and Alkaline-Earth Clocks ($^{88}\text{Sr}$, $^{87}\text{Sr}$).
- Displays transition details, lab provenance, wavelength, natural linewidth $\Gamma$, and saturation intensity $I_{\text{sat}}$.
- "Load into Converter" action immediately populates active values across all calculators.
- "Add Custom Preset" modal dialog allows saving lab-specific cavity and laser parameters into browser storage.

### 3.7 Command Palette Modal (`CommandPalette.tsx`)
- Activated globally via `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux).
- Centered accessible modal dialog with fuzzy filtering across all calculators, formulas, atomic presets, and system settings.
- Keyboard-driven navigation: `ArrowUp`, `ArrowDown`, `Enter` to select, `Esc` to close.
