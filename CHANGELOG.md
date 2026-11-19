# Changelog

All notable changes to the Cog codebase will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Developer Preview refresh

### Changed
- Corrected the pre-publication npm namespace from the reserved design identity `@cog/*` to the owner-controlled canonical `@winmedia/*` scope. No `@cog/*` package was published, so this is not a compatibility migration.
- Refreshed the Distribution, Adoption, and Operational Hardening (DAOH) release posture against the current monorepo.
- Clarified `@winmedia/cog-core` as the primary public language/kernel package, with MoM and decision adapters as optional distributable packages.
- Clarified Cognitive Workspace and Book Assistant as downstream applications rather than part of the Cog language distribution.
- Updated Developer Preview requirements to Node.js 20.x / npm 10+.
- Updated the v0.3 build to include the Cog VS Code extension.
- Reconciled the Developer Preview language specification and semantic model to current parser/runtime behavior and explicit kernel boundaries.
- Replaced the historical API-first onboarding path with CLI-first `START_HERE`, while retaining older onboarding files as compatibility redirects.
- Expanded release validation to verify the private root boundary, distributable package metadata, public API lock, package archives, isolated consumer installation, and documentation/release boundaries.

### Added
- Installed `cog` executable in `@winmedia/cog-core` with the Developer Preview command surface: `discover`, `workflows`, `validate`, `lint`, `graph`, `run`, `trace`, and execution-trace `diff`.
- Three-level Developer Preview learning curriculum: Language & Cognitive Patterns, Composable Cognitive Utilities, and Cognitive Applications.
- Progressive governed-decision tutorial.
- Ten synchronized Level-1 canonical primitive/pattern examples.
- Level-2 CLI utility proofs over existing workflow-lint, graph, trace, and trace-diff services.
- Five Level-3 canonical reference application shapes: Research Synthesis, Document Review / Drift Detection, Decision Analysis, Audit Reasoning, and Knowledge Graph.
- Pack-time learning assembly so `@winmedia/cog-core` publishes `learning/` and `examples/` alongside `dist/` and `README.md`.
- Clean-recipient stranger test that installs the packed package and exercises the curriculum, CLI, canonical examples, tutorial, and Level-3 applications without monorepo-local assumptions.
- Developer Preview learning-pack GitHub Actions gate.
- Developer Preview release notes documenting the current CLI, learning path, package contents, scope, compatibility, known limitations, and release governance.
- Long-lived `developer-preview` stabilization branch policy, with `main` reserved for forward development and immutable tags for exact published release identity.

## [0.3.0] - 2026-07-12

### Added
- **Language**: Neutral DSL parser, lexer, and AST structure supporting `define entity`, `relate`, `view`, `resolve`, and `emit`.
- **IR**: Neutral intermediate representation (`CoreIR`) compiler.
- **Runtime**: Deterministic pipeline execution of compiled IR with support for domain-specific adapters (`executeCog`).
- **Tooling**: LSP (Language Server Protocol) service with live validation, semantic completion, quick fixes, and reference navigation.
- **Adapters**:
  - `@cog/adapter-mom`: Model-of-Models adapter mapping verification levels and resolving views.
  - `@cog/adapter-decision`: Decision-domain adapter supporting metrics, options, and threshold evaluations.
- **Services**:
  - `WorkflowCatalogService` and `DiscoveryService` for discoverable workflows and libraries.
  - `TraceVisualizationService` and `WorkflowGraphViewerService` formatting workflows to Mermaid formats.
  - `WorkflowLinter` detecting orphaned entities, circular dependencies, and redundant transforms.
  - `WorkflowRefactoringService` supporting sub-workflow extraction.

### Changed
- Refactored legacy monolithic package structure to modular workspaces (`@cog/core`, `@cog/adapter-mom`, `@cog/adapter-decision`, `cog-vscode-extension`).

## [0.1.6] - Historical Legacy

*Historical details prior to 0.3.0 require source confirmation.*
- Legacy monolithic cog release.
