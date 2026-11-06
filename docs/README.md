# 📚 Technical Documentation & Metrology Manifest

Welcome to the technical documentation and metrology specification suite for **AMO Units** (AMO & RF Physics Laboratory Unit Converter).

This directory contains the authoritative technical specifications, architectural designs, mathematical models, and quality assurance audit records supporting the application.

---

## Documentation Index

| Document | Primary Focus | Description |
|---|---|---|
| [`requirements.md`](./requirements.md) | **Laboratory Requirements & Specifications** | Comprehensive physics requirements, experimentalist user stories, domain conversion specifications, and precision acceptance criteria. |
| [`architecture.md`](./architecture.md) | **System Architecture & Data Flow** | High-level system design, modular numerical engines, state management, offline PWA architecture, and zero-trust verification strategy. |
| [`implementation-plan.md`](./implementation-plan.md) | **Implementation & Engineering Log** | Chronological record of completed phases, architectural milestones, and mathematical engine implementations across the codebase. |
| [`design-system.md`](./design-system.md) | **Design System & Laboratory UX** | "Modern Lab Dark" visual design tokens, category-specific semantic color codes, typography scales, and accessible UI component guidelines. |
| [`qa-report.md`](./qa-report.md) | **Quality Assurance & Verification Report** | Automated test suite breakdown (23 test files / 365 unit tests), edge case boundary validation, and zero-trust accuracy verification against Wolfram Mathematica. |

---

## Related Metrology & Verification Resources

- **Mathematical Formula Catalog**: [`src/constants/formulas.ts`](../src/constants/formulas.ts) — Full catalog of 26 governing physical equations with variable definitions, LaTeX markup, and literature references.
- **Verification Provenance & Audit Trail**: [`tests/fixtures/PROVENANCE.md`](../tests/fixtures/PROVENANCE.md) — Independent Wolfram Language fixture audit trail, governing metrological standards (BIPM, NIST, ISO/IEC, IEEE MTT-S), and SHA-256 checksums.
- **Wolfram Fixture Generator Script**: [`scripts/generate-wolfram-fixtures.wls`](../scripts/generate-wolfram-fixtures.wls) — Standalone Wolfram Language script used to generate algorithmic reference fixtures with arbitrary precision.
