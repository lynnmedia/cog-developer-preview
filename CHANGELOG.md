# Changelog

All notable changes to the Cog codebase will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Developer Preview refresh

### Changed
- Refreshed the Distribution, Adoption, and Operational Hardening (DAOH) release posture against the current monorepo.
- Clarified `@cog/core` as the primary public language/kernel package, with MoM and decision adapters as optional distributable packages.
- Clarified Cognitive Workspace and Book Assistant as downstream applications rather than part of the cog language distribution.
- Updated Getting Started requirements to Node.js 20.x / npm 10+.
- Updated the v0.3 build to include the Cog VS Code extension.
- Strengthened `validate:release` to verify the private root boundary, current documentation, distributable package metadata, v0.3 regression tests, and npm package dry-runs.

### Added
- Developer Preview release notes documenting scope, compatibility, known limitations, and release governance.

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
