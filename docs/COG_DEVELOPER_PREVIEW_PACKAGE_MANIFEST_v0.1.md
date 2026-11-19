# Cog Developer Preview Package Manifest (v0.1)

```text
manifest_version: 0.1.0
governing_hdcp: COG-RELEASE-MACHINERY-005
status: PROVEN
canonical_runtime: Node 20.x / npm >=10
validation_date: 2026-08-20
```

## 1. Executive Summary

This manifest documents the distribution topology, packaging verification, clean-install proofs, and execution guarantees for the **Cog Developer Preview (v0.1 / v0.3-series contract)**.

Release machinery proves that all distributable packages can be packed into standalone archives (`.tgz`), installed into an isolated external consumer environment without source-tree or monorepo assumptions, and successfully execute canonical cognition flows across core, adapters, and stdlib primitives.

---

## 2. Distributable Package Register

### 2.1. `@winmedia/cog-core` (Canonical Kernel & Substrate)

- **Package Name**: `@winmedia/cog-core`
- **Version**: `0.3.0`
- **Public Role**: Canonical ontology-agnostic cognition kernel, AST/IR compiler, validator, execution runtime, standard library (`coglib`), developer tooling, and reference domain libraries.
- **Package Archive**: `cog-core-0.3.0.tgz` (~127.8 kB packed, 565.5 kB unpacked, 228 files)
- **Root Entrypoint**:
  - `main`: `./dist/index.js`
  - `types`: `./dist/index.d.ts`
  - `exports`: `{ ".": { "types": "./dist/index.d.ts", "require": "./dist/index.js", "default": "./dist/index.js" } }`
- **Dependencies**: None (Zero runtime dependencies).
- **Public Export Count**: Exactly **114 symbols** locked and enforced by regression suite.
- **Packed File Inventory**:
  - `dist/types/**`: Value, AST, IR, context, execution, validation, trace, adapter, and error type declarations.
  - `dist/lexer/**`: Tokenizer and lexer definitions.
  - `dist/parser/**`: Recursive-descent AST parser.
  - `dist/compiler/**`: AST-to-IR deterministic and incremental compiler.
  - `dist/planner/**`: Deterministic execution step planner.
  - `dist/validator/**`: Semantic IR validator.
  - `dist/runtime/**`: Deterministic runtime execution engine.
  - `dist/stdlib/**`: Universal cognition primitives (`observe`, `identify`, `compare`, `relate`, etc.).
  - `dist/coglib/**`: Standard routines (`shape`, `compare`, `trace`, `challenge`), proof harnesses, instruments, and network contracts.
  - `dist/builder/**`: `CogProgramBuilder`, `CogAstBuilder`, `CogDomainBuilder`.
  - `dist/domain/**`: 12 reference domain libraries (`research`, `editorial`, `decision`, `audit`, `graph`, `orientation`, etc.).
  - `dist/service/**`: Developer services (CLI, LSP, linters, visualizers, diffing, snapshot tester, documentation generators).
  - `dist/lsp/**` & `dist/cli/**`: Language server and CLI runners.
  - `package.json`, `README.md`.
- **Excluded Path Assertions**:
  - Excluded: `src/tests/**`, `*.test.ts`, `node_modules`, `temp-*`, `artifacts/**`, proprietary application bridges.
  - Excluded from public index: `dist/integration/**` (unreachable from `@winmedia/cog-core` export barrel).
- **Clean-Install & Execution Proof**:
  - Installed into isolated temporary consumer without monorepo link.
  - Proven canonical flow: `lex → parseCog → compileCog → validateCog → executeCog`.
  - Proven stdlib primitives: `observe()`, `identify()`, `compare()`.
  - Proven programmatic builder: `CogProgramBuilder`.

---

### 2.2. `@winmedia/cog-adapter-mom` (Mind-over-Matter Adapter)

- **Package Name**: `@winmedia/cog-adapter-mom`
- **Version**: `0.3.0`
- **Public Role**: First-class companion adapter mapping Cog core levels to Mind-over-Matter tiers (`R1`–`R5`), enriching execution plans with verification steps, and emitting `mom:` payloads.
- **Package Archive**: `cog-adapter-mom-0.3.0.tgz` (~1.3 kB packed, 2.9 kB unpacked, 5 files)
- **Root Entrypoint**:
  - `main`: `./dist/index.js`
  - `types`: `./dist/index.d.ts`
  - `exports`: `{ ".": { "types": "./dist/index.d.ts", "require": "./dist/index.js", "default": "./dist/index.js" } }`
- **Dependencies**:
  - `@winmedia/cog-core`: `^0.3.0`
- **Packed File Inventory**:
  - `dist/index.js`, `dist/index.d.ts`
  - `dist/momAdapter.js`, `dist/momAdapter.d.ts`
  - `package.json`
- **Clean-Install & Execution Proof**:
  - Installed and resolved alongside `@winmedia/cog-core` in isolated consumer.
  - Passed `executeCog(ir, context, momAdapter)` with plan enrichment and `mom:` emissions validated.

---

### 2.3. `@winmedia/cog-adapter-decision` (Decision Domain Adapter)

- **Package Name**: `@winmedia/cog-adapter-decision`
- **Version**: `0.3.0`
- **Public Role**: First-class companion adapter for clinical/decision support workflows with plan validation steps and `decision:` emission mappings.
- **Package Archive**: `cog-adapter-decision-0.3.0.tgz` (~1.1 kB packed, 2.5 kB unpacked, 5 files)
- **Root Entrypoint**:
  - `main`: `./dist/index.js`
  - `types`: `./dist/index.d.ts`
  - `exports`: `{ ".": { "types": "./dist/index.d.ts", "require": "./dist/index.js", "default": "./dist/index.js" } }`
- **Dependencies**:
  - `@winmedia/cog-core`: `^0.3.0`
- **Packed File Inventory**:
  - `dist/index.js`, `dist/index.d.ts`
  - `dist/decisionAdapter.js`, `dist/decisionAdapter.d.ts`
  - `package.json`
- **Clean-Install & Execution Proof**:
  - Installed and resolved alongside `@winmedia/cog-core` in isolated consumer.
  - Passed `executeCog(ir, context, decisionAdapter)` with `decision:` emissions validated.

---

### 2.4. `cog-vscode-extension` (Developer Tooling Scaffold)

- **Package Name**: `cog-vscode-extension`
- **Version**: `0.1.0`
- **Public Role**: Visual Studio Code extension scaffold providing language registration and syntax highlighting for `.cog` source files.
- **Status**: Tooling Scaffold (Excluded from npm distribution; packaged separately as VSIX).

---

## 3. Dependency & Boundary Graph

```text
[ @winmedia/cog-adapter-mom ] ------+
                            |
                            +---> [ @winmedia/cog-core ] <--- [ Isolated Consumer Proof ]
                            |
[ @winmedia/cog-adapter-decision ] --+
```

- **Root Package**: Marked `"private": true`. Never published.
- **Zero Monorepo Leakage**: No package contains `file:`, `workspace:`, or path-escaped dependencies.
- **Zero Application Residue**: Completely free of `packages/book-assistant`, `packages/cognitive-workspace`, and legacy product generators.

---

## 4. Release Validation Gate (`npm run validate:release`)

The release validation harness enforces:
1. Root package private boundary and Node 20.x engine contract.
2. Zero extracted application residue in worktree.
3. Clean TypeScript compilation across all workspace packages (`build:v0.3`).
4. Strict package metadata verification (fields, private flags, engine contracts, external dependencies).
5. Verification of all required release documentation.
6. Execution of full v0.3 regression suite (331 passing tests).
7. Strict verification of the 114-symbol `@winmedia/cog-core` public API lock.
8. Physical package packing (`npm pack`) to temporary staging directory and archive content audit.
9. Spin-up of an isolated external consumer in a separate directory:
   - `npm install` of generated `.tgz` archives
   - TypeScript compilation and runtime execution of:
     - Pure Core flow (`lex` → `parseCog` → `compileCog` → `validateCog` → `executeCog`)
     - MoM adapter execution (`mom:` emission mapping)
     - Decision adapter execution (`decision:` emission mapping)
     - Stdlib primitives (`observe`, `identify`, `compare`)
     - Fluent AST construction (`CogProgramBuilder`)
10. Automatic cleanup of staging and consumer directories.

---

## 5. Determination

```text
COG_RELEASE_MACHINERY_PROVEN
```
