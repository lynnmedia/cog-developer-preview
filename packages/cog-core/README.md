# `@cog/core`

`@cog/core` is the ontology-agnostic cognition kernel for the project. It owns the neutral syntax surface, AST, IR, execution context, planning, validation, trace, and adapter contracts needed to compile and execute a program without committing to a product or domain model.

It is not a domain package. Core does not define MoM, Mandala, MU, RL, PV, REL, SROW, canon, personalization, journey, or profile semantics. Those concerns now live in adapters.

## Package Boundary

Core is responsible for:

- neutral AST and IR contracts
- restrained lexer and parser surfaces
- AST to IR compilation
- conservative IR validation
- minimal execution planning
- minimal runtime execution and trace
- adapter interfaces for domain projection

Adapters are responsible for:

- domain vocabulary mapping
- domain validation extensions
- plan enrichment
- domain-specific emission mapping
- optional external reference resolution
- optional domain trace projection

## Why MoM Is An Adapter

MoM is useful, but it is one interpretation of the kernel rather than the kernel itself. Moving it out of core keeps the contracts reusable across multiple domains while preserving a clean extension seam for MoM-specific execution and emission behavior.

## Developer Preview Public API Surface

The `@cog/core` package provides a fully governed, ontology-agnostic cognition substrate structured into four tiers:

### 1. Core Language Kernel (`CORE`)
- **Parsing & Compilation**: `lex()`, `parseCog()`, `compileCog()`, `compileCogIncremental()`, `planCog()`.
- **Validation & Execution**: `validateCog()`, `executeCog()`.
- **Types**: All AST, IR, validation, context, execution, and error contracts under `types/*`.

### 2. Standard Cognition Library (`STDLIB`)
- **Primitive Operations**: `observe()`, `identify()`, `compare()`, `classify()`, `relate()`, `group()`, `project()`, `resolve()`, `evaluate()`, `explain()`, `compose()`.
- **Standard CogLib Routines**: `shapeRoutine`, `compareRoutine`, `traceRoutine`, `challengeRoutine`.
- **Cognitive Instruments**: `driftLensInstrument`, `epistemicMapInstrument`, `provenanceLineageInstrument`, `tensionFieldInstrument`.
- **Protocol & Network Contracts**: Multi-node contribution, routing, discovery, memory authority, tool governance, and capability negotiation.
- **Fluent Builders**: `CogProgramBuilder`, `CogAstBuilder`, `CogDomainBuilder`.

### 3. Developer Tooling & Services (`DEV_TOOL`)
- **CLI & Language Server**: `runCli()`, `LspService`.
- **Static Analysis & Metrics**: `WorkflowLinter`, `WorkflowQualityMetricsService`, `PatternSuggestionEngine`.
- **Visualizers & Explorers**: `TraceVisualizationService`, `WorkflowGraphViewerService`, `TraceDiffVisualizer`, `TraceExplorer`, `LibraryCompositionVisualizer`.
- **Documentation & Refactoring**: `WorkflowDocumentationGenerator`, `LibraryDocumentationGenerator`, `CanonicalDocumentationSynchronizer`, `WorkflowRefactoringService`.
- **Testing Frameworks**: `SnapshotTester`, `GoldenTraceAssertor`, `WorkflowFixtureLibrary`, `TestReporter`.

### 4. Reference Domain Libraries (`DOMAIN_LIBRARY`)
- Standard domain library registry (`domainRegistry`) and contract (`CogDomainLibrary`).
- 12 reference domain libraries: `researchLibrary`, `editorialLibrary`, `decisionLibrary`, `auditLibrary`, `graphLibrary`, `orientationLibrary`, `cognitiveEcologyLibrary`, `devotionalIntelligenceLibrary`, `governanceLibrary`, `learningLibrary`, `planningLibrary`, and integration proof workflows.

## Current Validation Surface

`@cog/core` is validated with:

```bash
npm run test:v0.3
```

## Boundary Invariants

- Core language grammar and execution engine are strictly ontology-agnostic.
- Proprietary application bindings and monolithic integrations are quarantined outside the public package barrel.
- Companion adapters (`@cog/adapter-mom`, `@cog/adapter-decision`) operate in independent companion packages.
