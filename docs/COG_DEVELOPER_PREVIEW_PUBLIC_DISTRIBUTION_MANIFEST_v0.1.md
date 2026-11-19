# Cog Developer Preview Public Distribution Manifest (v0.1)

```text
document_version: 0.1.0
status: RATIFIED
governing_hdcp: COG-PUBLIC-BOUNDARY-003
canonical_distributable_package: @winmedia/cog-core
optional_distributable_packages:
  - @winmedia/cog-adapter-mom
  - @winmedia/cog-adapter-decision
tooling_packages:
  - cog-vscode-extension
root_package_status: PRIVATE_WORKSPACE_COORDINATOR
```

## 1. Executive Summary & Boundary Constitution

This manifest establishes the canonical public distribution boundary for the **Cog Developer Preview (v0.1 / v0.3-series contract)** following the successful extraction of downstream applications (`book-assistant` and `cognitive-workspace`).

The boundary adheres strictly to the following principles:
1. **Kernel Ontology Agnosticism**: Core language compilation and deterministic runtime execution must remain free of proprietary application ontologies.
2. **Canonical Package Identity**: `@winmedia/cog-core` is the primary distributable package. The root `cog` package remains a private workspace coordinator.
3. **Explicit Layer Partitioning**: Every surface is assigned an exact architectural classification with declared Preview 1 inclusion and support tier.
4. **Zero Silent Domain Infiltration**: Proprietary integration bridges (e.g. `integration/*`) are excluded from the public API boundary.

---

## 2. Classification Taxonomy

| Classification | Definition |
|---|---|
| `CORE` | Fundamental language grammar, lexer, parser, AST, IR, compiler, planner, validator, runtime execution engine, and context/execution types. |
| `STDLIB` | Generic cognitive primitive operations, standard routines (`shape`, `compare`, `trace`, `challenge`), proof harnesses, instruments, and fluent builders. |
| `DEV_TOOL` | Language server (LSP), CLI, linters, static analyzers, metrics calculators, visualizers, documentation generators, trace diffing, and test assertions. |
| `OPTIONAL_PUBLIC` | Standalone companion adapter packages demonstrating domain protocol integration (`@winmedia/cog-adapter-mom`, `@winmedia/cog-adapter-decision`). |
| `DOMAIN_LIBRARY` | Reference domain libraries illustrating typed domain transformations (research, editorial, decision, audit, graph, orientation, governance, etc.). |
| `INTERNAL` | Implementation details, private helpers, or internal monorepo fixtures not exposed for external consumption. |
| `EXCLUDE_FROM_PREVIEW` | Legacy monolithic artifacts, proprietary integration bridges, or unproven surfaces excluded from public API re-exports. |

---

## 3. Surface-by-Surface Public Distribution Register

### 3.1. Core Language & Runtime Engine (`CORE`)

| Surface / Path | Preview 1 Inclusion | API Status | Rationale |
|---|---|---|---|
| `packages/cog-core/src/types/values.ts` | **YES** | Supported | Core primitive, literal, level, and collection value types. |
| `packages/cog-core/src/types/ast.ts` | **YES** | Supported | Abstract Syntax Tree node definitions for the `.cog` language. |
| `packages/cog-core/src/types/ir.ts` | **YES** | Supported | Intermediate Representation schema for compiled workflows. |
| `packages/cog-core/src/types/context.ts` | **YES** | Supported | Execution context, runtime variables, and environment contracts. |
| `packages/cog-core/src/types/execution.ts` | **YES** | Supported | Execution results, step outcomes, and emission records. |
| `packages/cog-core/src/types/validation.ts` | **YES** | Supported | Validation diagnostics, severity levels, and issue codes. |
| `packages/cog-core/src/types/trace.ts` | **YES** | Supported | Deterministic execution trace records and timing metrics. |
| `packages/cog-core/src/types/adapter.ts` | **YES** | Supported | `CogDomainAdapter` interface contract and mapping hooks. |
| `packages/cog-core/src/types/errors.ts` | **YES** | Supported | Structured error types for lexer, parser, compiler, validator, and runtime. |
| `packages/cog-core/src/types/limits.ts` | **YES** | Supported | Bounded execution limits (max steps, memory, recursion depth). |
| `packages/cog-core/src/lexer/tokenTypes.ts` | **YES** | Supported | Token definitions and keywords for `.cog`. |
| `packages/cog-core/src/lexer/lexer.ts` | **YES** | Supported | Tokenizer implementation with line/column tracking. |
| `packages/cog-core/src/parser/parser.ts` | **YES** | Supported | Recursive-descent parser producing validated AST. |
| `packages/cog-core/src/compiler/compileCog.ts` | **YES** | Supported | AST-to-IR compiler with deterministic entity and transition numbering. |
| `packages/cog-core/src/compiler/compileCogIncremental.ts` | **YES** | Supported | Incremental compilation for IDE/LSP responsiveness. |
| `packages/cog-core/src/planner/planCog.ts` | **YES** | Supported | Deterministic execution step planner and dependency topological sorter. |
| `packages/cog-core/src/validator/validateCog.ts` | **YES** | Supported | Structural, relational, level, and constraint semantic validator. |
| `packages/cog-core/src/runtime/executeCog.ts` | **YES** | Supported | Deterministic cognition runtime engine with emission lifecycle management. |

---

### 3.2. Standard Cognition Library & Protocols (`STDLIB`)

| Surface / Path | Preview 1 Inclusion | API Status | Rationale |
|---|---|---|---|
| `packages/cog-core/src/stdlib/stdlib.ts` | **YES** | Supported | Universal cognition operations (`observe`, `identify`, `compare`, `classify`, `relate`, `group`, `project`, `resolve`, `evaluate`, `explain`, `compose`). |
| `packages/cog-core/src/coglib/routineContract.ts` | **YES** | Supported | Standard routine interface, input/output contracts, and validation rules. |
| `packages/cog-core/src/coglib/admissionStandard.ts` | **YES** | Supported | Three-domain admission standard for standard library routines. |
| `packages/cog-core/src/coglib/compositionModel.ts` | **YES** | Supported | Deterministic multi-routine composition and pipeline chaining model. |
| `packages/cog-core/src/coglib/routines/shape.ts` | **YES** | Supported | SHAPE standard routine (epistemic state classification). |
| `packages/cog-core/src/coglib/routines/compare.ts` | **YES** | Supported | COMPARE standard routine (structural and semantic divergence detection). |
| `packages/cog-core/src/coglib/routines/trace.ts` | **YES** | Supported | TRACE standard routine (transformation lineage and causality projection). |
| `packages/cog-core/src/coglib/routines/challenge.ts` | **YES** | Supported | CHALLENGE standard routine (adversarial constraint verification). |
| `packages/cog-core/src/coglib/proofHarness.ts` | **YES** | Supported | Multi-domain validation harness for routine correctness verification. |
| `packages/cog-core/src/coglib/cognitiveInstrumentContract.ts`| **YES** | Supported | Contract for non-invasive cognitive diagnostic instruments. |
| `packages/cog-core/src/coglib/instruments/driftLens.ts` | **YES** | Supported | Drift Lens instrument for tracking semantic drift across transformations. |
| `packages/cog-core/src/coglib/instruments/epistemicMap.ts` | **YES** | Supported | Epistemic Map instrument for certainty/knowledge state visualization. |
| `packages/cog-core/src/coglib/instruments/provenanceLineage.ts`| **YES**| Supported | Provenance Lineage instrument for graph transformation tracking. |
| `packages/cog-core/src/coglib/instruments/tensionField.ts` | **YES** | Supported | Tension Field instrument for unresolved constraint tension detection. |
| `packages/cog-core/src/coglib/memoryInterface.ts` | **YES** | Supported | Governed memory interface contract. |
| `packages/cog-core/src/coglib/memoryAuthorityModel.ts` | **YES** | Supported | Multi-tier memory authority and retention model. |
| `packages/cog-core/src/coglib/networkNodeContract.ts` | **YES** | Supported | Network node identity and capability advertisement contract. |
| `packages/cog-core/src/coglib/networkDiscovery.ts` | **YES** | Supported | Distributed cognition network discovery protocol. |
| `packages/cog-core/src/coglib/networkRouting.ts` | **YES** | Supported | Protocol routing, delegation, and hops limits. |
| `packages/cog-core/src/coglib/networkTrustModel.ts` | **YES** | Supported | Trust boundaries, signature checks, and node authority governance. |
| `packages/cog-core/src/coglib/networkContribution.ts` | **YES** | Supported | Multi-node contribution tracking and lineage reconciliation. |
| `packages/cog-core/src/coglib/toolEpistemicContract.ts` | **YES** | Supported | Tool boundary and epistemic side-effect contract. |
| `packages/cog-core/src/coglib/toolInfluenceGovernance.ts` | **YES** | Supported | Tool influence containment and governance enforcement. |
| `packages/cog-core/src/coglib/domainCapability.ts` | **YES** | Supported | Domain capability specification and registration contract. |
| `packages/cog-core/src/coglib/capabilityAdapter.ts` | **YES** | Supported | Generic capability adapter runtime bridge. |
| `packages/cog-core/src/coglib/capabilityNegotiation.ts` | **YES** | Supported | Runtime capability negotiation and protocol mismatch resolution. |
| `packages/cog-core/src/coglib/evaluationContract.ts` | **YES** | Supported | Deterministic architecture and workflow evaluation contract. |
| `packages/cog-core/src/coglib/evaluationMetrics.ts` | **YES** | Supported | Metric calculators for cognitive complexity and governance efficiency. |
| `packages/cog-core/src/builder/cogProgramBuilder.ts` | **YES** | Supported | Programmatic builder for complete Cog programs. |
| `packages/cog-core/src/builder/cogAstBuilder.ts` | **YES** | Supported | Low-level AST node factory and builder. |
| `packages/cog-core/src/builder/cogDomainBuilder.ts` | **YES** | Supported | Fluent domain specification builder. |

---

### 3.3. Developer Tooling & Services (`DEV_TOOL`)

| Surface / Path | Preview 1 Inclusion | API Status | Rationale |
|---|---|---|---|
| `packages/cog-core/src/cli/index.ts` | **YES** | Supported | Cog CLI entrypoint (`validate`, `run`, `discover`, `workflows`). |
| `packages/cog-core/src/lsp/lspService.ts` | **YES** | Supported | Language Server protocol service for editor integration. |
| `packages/cog-core/src/service/runtimeService.ts` | **YES** | Supported | High-level execution orchestration service. |
| `packages/cog-core/src/service/discoveryService.ts` | **YES** | Supported | Domain library discovery and reflection service. |
| `packages/cog-core/src/service/workflowCatalogService.ts` | **YES** | Supported | Workflow catalog query and inspection service. |
| `packages/cog-core/src/service/workflowLinter.ts` | **YES** | Supported | Static analysis linter detecting orphans, loops, and dead transitions. |
| `packages/cog-core/src/service/workflowQualityMetrics.ts` | **YES** | Supported | Quality and governance metric analysis. |
| `packages/cog-core/src/service/traceVisualizationService.ts` | **YES** | Supported | Trace to Mermaid flowchart generator. |
| `packages/cog-core/src/service/workflowGraphViewerService.ts`| **YES** | Supported | Workflow graph structure projector. |
| `packages/cog-core/src/service/traceExplorer.ts` | **YES** | Supported | Step-by-step trace navigation and inspection. |
| `packages/cog-core/src/service/traceDiffVisualizer.ts` | **YES** | Supported | Visual comparison between execution traces. |
| `packages/cog-core/src/service/libraryCompositionVisualizer.ts`| **YES**| Supported | Multi-library composition graph generator. |
| `packages/cog-core/src/service/workflowDocumentationGenerator.ts`| **YES**| Supported | Markdown/Mermaid documentation generator for workflows. |
| `packages/cog-core/src/service/libraryDocumentationGenerator.ts`| **YES**| Supported | Markdown documentation generator for domain libraries. |
| `packages/cog-core/src/service/canonicalDocumentationSynchronizer.ts`| **YES**| Supported | Automated documentation verification and synchronization. |
| `packages/cog-core/src/service/patternSuggestionEngine.ts` | **YES** | Supported | Workflow optimization and refactoring suggestion engine. |
| `packages/cog-core/src/service/workflowRefactoringService.ts` | **YES** | Supported | Automated sub-workflow extraction and inlining. |
| `packages/cog-core/src/service/snapshotTester.ts` | **YES** | Supported | Golden trace snapshot assertion framework. |
| `packages/cog-core/src/service/goldenTraceAssertor.ts` | **YES** | Supported | Strict execution trace parity verification. |
| `packages/cog-core/src/service/workflowFixtureLibrary.ts` | **YES** | Supported | Reusable test workflow fixtures. |
| `packages/cog-core/src/service/testReporter.ts` | **YES** | Supported | Structured test execution reporter. |
| `packages/cog-vscode-extension/**` | **YES** | Experimental | VS Code extension providing syntax highlighting and workflow validation. |

---

### 3.4. Optional Companion Adapters (`OPTIONAL_PUBLIC`)

| Surface / Package | Preview 1 Inclusion | API Status | Rationale |
|---|---|---|---|
| `packages/cog-adapter-mom` | **YES** | Supported | Mind-over-Matter (`mom:`) level and relation mapping adapter. |
| `packages/cog-adapter-decision` | **YES** | Supported | Decision/clinical governance (`decision:`) workflow adapter. |

---

### 3.5. Reference Domain Libraries (`DOMAIN_LIBRARY`)

| Surface / Path | Preview 1 Inclusion | API Status | Rationale |
|---|---|---|---|
| `packages/cog-core/src/domain/contract.ts` | **YES** | Supported | Fundamental `CogDomainLibrary` interface definition. |
| `packages/cog-core/src/domain/registry.ts` | **YES** | Supported | Global and contextual domain library registry. |
| `packages/cog-core/src/domain/research/**` | **YES** | Supported | Research domain library (sources, claims, evidence mapping). |
| `packages/cog-core/src/domain/editorial/**` | **YES** | Supported | Editorial domain library (reviews, revisions, decisions). |
| `packages/cog-core/src/domain/decision/**` | **YES** | Supported | Decision logic domain library. |
| `packages/cog-core/src/domain/audit/**` | **YES** | Supported | Audit trail and compliance domain library. |
| `packages/cog-core/src/domain/graph/**` | **YES** | Supported | Graph topology and pathfinding domain library. |
| `packages/cog-core/src/domain/orientation/**` | **YES** | Supported | Cognitive orientation domain library. |
| `packages/cog-core/src/domain/cognitiveEcology/**` | **YES** | Supported | Systemic cognitive ecology domain library. |
| `packages/cog-core/src/domain/devotionalIntelligence/**` | **YES** | Supported | Devotional intelligence domain library. |
| `packages/cog-core/src/domain/governance/**` | **YES** | Supported | Multi-stakeholder governance domain library. |
| `packages/cog-core/src/domain/learning/**` | **YES** | Supported | Cognitive learning and pedagogical domain library. |
| `packages/cog-core/src/domain/planning/**` | **YES** | Supported | High-level goal decomposition and planning domain library. |
| `packages/cog-core/src/domain/proofs/**` | **YES** | Supported | Cross-domain integration proof workflows. |

---

### 3.6. Excluded Proprietary & Legacy Surfaces (`EXCLUDE_FROM_PREVIEW` / `INTERNAL`)

| Surface / Path | Preview 1 Inclusion | Classification | Rationale |
|---|---|---|---|
| `packages/cog-core/src/integration/**` | **NO** | `EXCLUDE_FROM_PREVIEW` | Proprietary WinMedia / MandalaStacks bridge code (`bookFactory`, `mandalaStacks`, `auditWorkbench`, etc.). Must be un-exported from `@winmedia/cog-core` index in `COG-PUBLIC-API-SANITATION-004`. |
| Root `src/**` (legacy) | **NO** | `INTERNAL` | Pre-v0.3 legacy monolithic prototype code. Retained internally only for backward test comparison; not part of public distribution. |
| Root `package.json` | **NO** | `INTERNAL` | Marked `"private": true`. Acts purely as monorepo coordinator; distribution is via individual packages. |

---

## 4. Key Architectural Decisions Ratified

1. **Root vs. Workspace Identity**:
   - The root package remains strictly private.
   - `@winmedia/cog-core` is the singular, authoritative package published to registries for public consumption.

2. **Core vs. Standard Library Boundary**:
   - `CORE` is purely syntactic, structural, and execution-oriented (lexer, parser, compiler, planner, validator, runtime).
   - `STDLIB` contains universal cognition operations (`observe`, `relate`, `compose`, etc.), the 4 standard CogLib routines (`shape`, `compare`, `trace`, `challenge`), cognitive instruments, and builder tooling.

3. **Domain Library Policy**:
   - The domain contract and registry are core features.
   - Reference domain libraries are distributed with `@winmedia/cog-core` to provide immediately useful, proven cognitive patterns across 12 distinct knowledge areas.

4. **Integration Surface Quarantine**:
   - Proprietary integration modules (`integration/*`) are officially marked for removal from the `@winmedia/cog-core` public barrel export. They will not be accessible to standard public consumers.

5. **Companion Adapters**:
   - `@winmedia/cog-adapter-mom` and `@winmedia/cog-adapter-decision` remain first-class optional public packages providing documented examples of the CogDomainAdapter extension protocol.

---

## 5. Next Actions for API Sanitation & Release Machinery

- **`COG-PUBLIC-API-SANITATION-004`**:
  - Remove `export * from "./integration/*"` from `packages/cog-core/src/index.ts`.
  - Ensure all `CORE`, `STDLIB`, `DEV_TOOL`, and `DOMAIN_LIBRARY` exports adhere to clean public type signatures.
  - Verify zero leakage of proprietary application symbols.
- **`COG-RELEASE-MACHINERY-005`**:
  - Align package tarball packing scripts, CI release gates, and developer preview publishing checklists.
