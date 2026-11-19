# Cog Project Roadmap

This document outlines the architectural milestones and future directions for the Cog language kernel, standard libraries, and tooling.

---

## 1. Milestone 1: Developer Preview (v0.1.0 / v0.3-Contract) — Current

- **Ontology-Agnostic Core**: Restrained AST, deterministic IR compiler, bounded execution planner, semantic validator, and execution engine (`@winmedia/cog-core`).
- **Standard Cognition Library (`STDLIB`)**:
  - Universal primitives (`observe`, `identify`, `compare`, `classify`, `relate`, `group`, `project`, `resolve`, `evaluate`, `explain`, `compose`).
  - Standard CogLib routines (`shape`, `compare`, `trace`, `challenge`).
  - Cognitive diagnostic instruments (`driftLens`, `epistemicMap`, `provenanceLineage`, `tensionField`).
  - Distributed multi-runtime node contracts, discovery protocols, and trust models.
- **Developer Tooling (`DEV_TOOL`)**:
  - Cog CLI (`cog validate`, `cog run`, `cog discover`, `cog workflows`).
  - Language Server Protocol (`LspService`) and VS Code extension scaffold.
  - Static linters, quality metrics, trace visualizers (Mermaid flowcharts), and snapshot testing.
- **Reference Domain Libraries (`DOMAIN_LIBRARY`)**:
  - 12 reference domain libraries (Research, Editorial, Decision, Audit, Graph, Orientation, Governance, etc.).
- **Companion Adapters (`OPTIONAL_PUBLIC`)**:
  - `@winmedia/cog-adapter-mom`: Mind-over-Matter (`mom:`) level and relation mapping.
  - `@winmedia/cog-adapter-decision`: Decision domain workflow adapter.

---

## 2. Milestone 2: Ecosystem & Language Server Expansion

- **Language Server & IDE Richness**: Full autocompletion, hover docs, jump-to-definition, and semantic tokens for `.cog` source files.
- **Wasm Runtime Integration**: Browser-compatible compilation and sandbox execution of `.cog` workflows.
- **Expanded Cognitive Instruments**: Additional diagnostic lenses for reasoning verification and multi-agent coordination.

---

## 3. Milestone 3: Multi-Agent & Distributed Networks

- **Federated Node Execution**: Distributed execution of composed `.cog` pipelines across heterogeneous network nodes.
- **Cryptographic Lineage**: Cryptographically signed execution traces and provenance auditing.
