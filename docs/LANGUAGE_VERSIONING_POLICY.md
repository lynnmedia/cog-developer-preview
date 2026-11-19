# Cog Language Versioning Policy

This document defines the versioning rules for the `cog` language, compilation compiler pipeline, Intermediate Representation (IR), adapters, and downstream packages.

## 1. Versioning Strategy (SemVer Alignment)

All public surfaces in the `cog` ecosystem follow Semantic Versioning (SemVer) `MAJOR.MINOR.PATCH`:
- **MAJOR**: Incompatible API changes (breaking grammar syntax, IR schema mutations, or adapter contract breaks).
- **MINOR**: Backward-compatible functionality additions (adding new stdlib functions, optional AST metadata, or new core libraries).
- **PATCH**: Backward-compatible bug fixes (parser correctness fixes, lexer edge-case resolutions, or execution trace visualizer fixes).

---

## 2. Core Versioning Surfaces

### 2.1 Language Grammar and Parser (DSL Syntax)
- **Stable Versions**: The current stable grammar is version `0.3.0`.
- **Breaking Changes**: Changing syntax keywords (e.g., changing `relate` to `link`) or removing language constructs requires incrementing the Major version.
- **Additions**: Adding optional blocks (e.g., adding `attributes` block to entities) increment the Minor version.

### 2.2 Core Intermediate Representation (CoreIR)
- **IR Schema**: Defined in `packages/cog-core/src/types/ir.ts`.
- **Consumer Stability**: Downstream adapters and platforms rely on `CoreIR`. Any structural changes (removing properties, changing type shapes) require a major version bump.

### 2.3 Adapter Interface (`CogDomainAdapter`)
- **Signature Breaks**: Removing hook declarations (like `mapEmission` or `enrichPlan`) or adding required hooks requires a major version increment.
- **Optional Hooks**: Adding optional hook overrides increment the minor version.

### 2.4 Domain Libraries
- Domain libraries (e.g., `planningLibrary`, `researchLibrary`) are packaged within `@cog/core` and follow its release cadence.
- Enhancing domain generators to support new optional arguments increments the minor version.

---

## 3. Releases and Packages

- Core packages (such as `@cog/core`, `@cog/adapter-mom`, `@cog/adapter-decision`) are versioned concurrently.
- Package versions are updated via unified release scripts (`npm run release:local` or CI release steps) to prevent dependency version drift.
