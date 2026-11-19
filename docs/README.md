# Cog Documentation Portal

Welcome to the Cog Documentation Portal. Cog is a standalone TypeScript cognition-kernel, parser, compiler, planner, validator, and deterministic execution pipeline for the `.cog` cognitive-spec language.

## 1. Core Architecture & Language Design

- **[Philosophy & Design Constitution](./PHILOSOPHY_AND_DESIGN_CONSTITUTION.md)**: Constitutional principles for Cog.
- **[Language Spec v0.4](./LANGUAGE_SPEC_v0.4.md)**: Grammars, operators, levels, and parser directives.
- **[Language Semantic Model](./LANGUAGE_SEMANTIC_MODEL.md)**: Execution environment, namespaces, scoping rules, and memory model.
- **[Getting Started](./GETTING_STARTED.md)**: Step-by-step guide to installing and running Cog.
- **[Authoring Tutorial](./AUTHORING_TUTORIAL.md)**: Tutorial for writing `.cog` workflows.

## 2. Domain Libraries

- **[Domain Library Architecture](./DOMAIN_LIBRARY_ARCHITECTURE.md)**: Generator design patterns and decoupled adapters.
- **[Domain Library Contract](./DOMAIN_LIBRARY_CONTRACT.md)**: Decoupled schemas and registries.
- **[Domain Library Catalog](./DOMAIN_LIBRARY_CATALOG.md)**: Complete library capabilities, mappings, and validation results.
- **[Domain Library Tutorials](./DOMAIN_LIBRARY_TUTORIALS.md)**: Specialized tutorials for standard domain libraries.
- **[Domain Library Adapter Policy](./DOMAIN_LIBRARY_ADAPTER_POLICY.md)**: Projection semantics, mapping rules, and boundaries.

## 3. Application Integration

- **[Canonical Program Catalog](./CANONICAL_PROGRAM_CATALOG.md)**: Curated program fixtures.
- **[Consumer Integration Handoff](./CONSUMER_HANDOFF.md)**: Imports, compile-validate-plan execution pipelines, and adapter boundaries.

## 4. Platform Services & Developer Experience (DX)

- **[Local Runtime Service API](../packages/cog-core/src/service/runtimeService.ts)**: Local execution APIs.
- **[Library Discovery Service](../packages/cog-core/src/service/discoveryService.ts)**: Metadata capabilities lookup.
- **[Workflow Catalog Service](../packages/cog-core/src/service/workflowCatalogService.ts)**: Workflow configuration definitions.
- **[Trace Visualization Service](../packages/cog-core/src/service/traceVisualizationService.ts)**: Mermaid diagram flowcharts formatter.
- **[Language Server Protocol (LSP) Service](../packages/cog-core/src/lsp/lspService.ts)**: Diagnostic support for editor clients.
- **[VS Code Extension Scaffold](../packages/cog-vscode-extension)**: Scaffold files for extension integration.
- **[CLI Dispatcher](../packages/cog-core/src/cli)**: Command line utility runner.
