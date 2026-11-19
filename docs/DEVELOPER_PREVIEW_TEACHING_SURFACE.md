<!-- cog-doc-conformance -->
# Cog Developer Preview Teaching Surface

HDCP: `DP-LEARN-002`

Determination target: `COG_DP_TEACHING_SURFACE_RATIFIED`

This document freezes the public teaching contract for the Cog Developer Preview. It is deliberately narrower than the total repository capability surface.

## 1. Definition

Cog is a small, declarative language and execution substrate for constructing governed semantic graphs with explicit entities, relationships, perspectives, resolutions, transformation intent, constraints, emissions, validation, planning, and execution traces.

Cog core is not a general-purpose programming language and does not claim that every cognitive operation named in a graph is automatically inferred by the kernel.

## 2. Supported Environment

```text
Node.js 20.x
npm >= 10
@winmedia/cog-core
```

## 3. Beginner Execution Path

The Developer Preview is CLI-first. A new user should not need to write a TypeScript harness merely to execute or inspect a `.cog` program.

```bash
cog help
cog discover
cog workflows
cog validate example.cog
cog run example.cog
cog lint example.cog
cog graph example.cog
cog trace example.cog
cog diff before.cog after.cog
```

The `@winmedia/cog-core` package declares `cog` as an installed executable. The package test suite includes a packed-consumer installation proof for the complete Developer Preview command surface above.

## 4. Canonical Language Surface

The Developer Preview teaches seven statement families:

```text
define entity
relate
view
resolve
transform
constrain
emit
```

Canonical examples use double-quoted strings, `//` comments, flat blocks, flat lists, and explicit targets.

### Canonical forms

```cog
define entity "proposal" {
  kind: proposal
  level: L1
}
```

```cog
relate "evidence" -> "proposal" {
  kind: supports
}
```

```cog
view "proposal" as operational {
}
```

```cog
resolve "proposal" to L3 {
}
```

```cog
transform {
  target: "proposal"
  to: assessed
}
```

```cog
constrain {
  target: "proposal"
  rule: "requires-evidence"
}
```

```cog
emit {
  target: "proposal"
  kind: assessment
}
```

The parser currently retains a narrow one-entity implicit emit-target compatibility fallback. It is not part of the Developer Preview authoring profile and must not appear in new learning material.

## 5. Execution Model

The canonical consumer sequence is:

```text
LEX → PARSE → COMPILE → VALIDATE → PLAN → EXECUTE → EMISSIONS + TRACE
```

Core plan phases are:

```text
bind → transform → validate → emit
```

Every runtime execution returns a trace.

## 6. Cognitive Responsibility Boundary

The kernel preserves governed declarations and execution structure.

Higher-order cognition is supplied by higher layers:

```text
Cog Kernel
  ↓
CogLib
  ↓
Domain Libraries / Machine Editions
  ↓
Tools & Memory Substrates
  ↓
Applications & Consumer Surfaces
```

Examples of capabilities that must not be attributed automatically to a kernel keyword include:

- discovering semantic differences merely because a relation is named `differs-from`;
- performing arbitrary classification merely because an entity carries `operation: classify`;
- executing an arbitrary semantic transform merely because a `transform` statement exists;
- evaluating arbitrary domain predicates merely because a constraint contains a `rule:` string.

Those capabilities require an implementation in CogLib, a domain library, an adapter, a tool, or an application.

## 7. Standard-Library Terminology

The Developer Preview distinguishes three surfaces:

### Cog language primitives

The seven `.cog` statement families.

### Core helpers

Small TypeScript helpers exported from `src/stdlib`, including operations such as observation, identification, comparison, classification, relation construction, grouping, projection, resolution helpers, evaluation helpers, explanation, and composition.

These helpers are not additional `.cog` syntax.

### CogLib

CogLib is the Universal Cognitive Standard Library above the kernel. Its currently admitted exported routines include:

```text
SHAPE
COMPARE
TRACE
CHALLENGE
```

CogLib also contains cognitive contracts, epistemic/provenance governance, composition machinery, cognitive instruments, memory contracts, and network cognition contracts.

## 8. Three-Level Learning Architecture

### Level 1 — Language and Cognitive Patterns

The current Level-1 teaching authority is:

```text
docs/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md
```

It teaches the seven language primitives through the existing canonical primitive examples:

- Observation
- Identification
- Comparison
- Classification
- Relation
- Projection
- Resolution
- Constraint
- Transformation
- Emission

The guide is intentionally calibrated to the executable tests: it distinguishes represented cognitive intent from actual higher-layer algorithms. A dedicated test keeps its ten embedded `.cog` programs identical to the ten canonical primitive fixtures.

### Level 2 — Composable Cognitive Utilities

The current Level-2 teaching authority is:

```text
docs/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md
```

Level 2 exposes small developer-facing instruments through the CLI by reusing existing services rather than inventing a parallel pseudo-Unix semantics layer.

The ratified Developer Preview utility surface is:

```text
discover
workflows
validate
lint
graph
run
trace
diff
```

The four Level-2 inspection utilities map directly to existing implementations:

```text
lint  → WorkflowLinter
graph → WorkflowGraphViewerService
trace → executeCog + TraceExplorer
diff  → executeCog + TraceDiffVisualizer
```

`trace` may be filtered with `--phase <phase>`. `diff` compares execution traces for two successfully executing `.cog` programs; it is not a source-text diff. Shell pipes, redirection, `grep`, and similar composition remain shell behavior.

This surface is covered by direct CLI tests and the packed downstream-consumer execution proof.

### Level 3 — Cognitive Applications

The current Level-3 teaching authority is:

```text
docs/LEVEL_3_COGNITIVE_APPLICATIONS.md
```

It teaches five canonical application architectures:

1. Research Synthesis
2. Document Review / Drift Detection
3. Decision Analysis
4. Audit Reasoning
5. Knowledge Graph

Each application is taught as a composition of Level-1 patterns and inspected with the Level-2 toolbelt. The guide distinguishes the represented application spine from any domain algorithm that would be required to produce claims, detect drift, evaluate alternatives, discover findings, cluster entities, or generate explanations.

The five registered domain-library homes are:

```text
cog:domain:research
cog:domain:editorial
cog:domain:decision
cog:domain:audit
cog:domain:graph
```

A dedicated synchronization test requires the five `.cog` programs embedded in the Level-3 guide to remain identical to the five canonical application fixtures in curriculum order. The canonical example test suite provides compile/validate/plan/execute assertions for all five.

## 9. Executable Example Authority

Canonical executable examples live under:

```text
packages/cog-core/examples/
```

Their primary semantic proof is:

```text
packages/cog-core/src/tests/canonicalExamples.test.ts
```

Developer Preview documentation must prefer these tested programs over independently invented snippets when a canonical example already exists.

## 10. Documentation Authority and Dispositions

Authority order for the Developer Preview learning surface:

1. executable lexer/parser/compiler/runtime behavior;
2. `docs/LANGUAGE_SPEC_v0.4.md`;
3. `docs/LANGUAGE_SEMANTIC_MODEL.md`;
4. tested canonical examples;
5. new Developer Preview guides/tutorials.

Current learning path:

```text
START_HERE.md
  ↓
LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md
  ↓
GOVERNED_DECISION_TUTORIAL.md
  ↓
LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md
  ↓
LEVEL_3_COGNITIVE_APPLICATIONS.md
```

Dispositions:

- `GETTING_STARTED.md` — superseded; retained only to avoid broken links.
- `AUTHORING_TUTORIAL.md` — superseded; retained only to avoid broken links.
- `START_HERE.md` — current first-run authority.
- `LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md` — current Level-1 learning authority.
- `GOVERNED_DECISION_TUTORIAL.md` — current progressive full-language tutorial.
- `LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md` — current Level-2 developer-tooling authority.
- `LEVEL_3_COGNITIVE_APPLICATIONS.md` — current Level-3 application-learning authority.
- `LANGUAGE_SPEC_v0.4.md` — reconciled to the current parser and canonical authoring profile.
- `LANGUAGE_SEMANTIC_MODEL.md` — reconciled to actual structural validation/runtime behavior.
- `CANONICAL_PROGRAM_CATALOG.md` — retained as a repository catalog; teaching claims should follow the calibrated learning guides and executable tests where older catalog prose overstates computation.
- `DOMAIN_LIBRARY_TUTORIALS.md` — historical/stale relative to the current domain catalog and not a Developer Preview teaching authority.

## 11. Developer Preview Distribution Contract

The repository documents remain the source teaching authorities. A packed or published `@winmedia/cog-core` package must contain a self-contained distribution view:

```text
dist/
README.md
learning/
examples/
```

The `learning/` directory is generated during package `prepack` from the repository teaching authorities by:

```text
packages/cog-core/scripts/assembleLearningPack.cjs
```

The generated distribution contains:

```text
learning/MANIFEST.md
learning/START_HERE.md
learning/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md
learning/GOVERNED_DECISION_TUTORIAL.md
learning/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md
learning/LEVEL_3_COGNITIVE_APPLICATIONS.md
learning/LANGUAGE_SPEC_v0.4.md
learning/LANGUAGE_SEMANTIC_MODEL.md
learning/DEVELOPER_PREVIEW_TEACHING_SURFACE.md
```

The complete canonical `examples/` tree is shipped directly in the package. The assembler translates monorepo example paths in generated documentation to package-relative `examples/` paths while retaining repository source files as the only hand-maintained teaching authorities.

A clean-recipient proof in `packages/cog-core/src/tests/learningPackStranger.test.ts` must pack and install the generated tarball, verify the curriculum files and examples, and exercise the learning path through the installed CLI. This is the Developer Preview distribution gate.

## 12. Explicit Preview Non-Goals

Do not add to the teaching surface merely for tutorial convenience:

- loops;
- functions;
- imports;
- macros;
- implicit cognitive inference;
- a second CLI semantics implementation separate from core/services;
- Cog-owned Unix pipe or shell semantics;
- domain-specific semantics in the kernel;
- a separately hand-maintained packaged copy of the curriculum.

## 13. Documentation and Distribution Conformance

Published Developer Preview `.cog` snippets must parse under the current language implementation. A repository test scans the designated Developer Preview Markdown sources and rejects syntax drift.

The Level-1 guide has an additional synchronization test that requires its ten embedded `.cog` programs to remain identical to the ten canonical primitive fixtures in learning order.

Level-2 CLI behavior is covered by `level2CliUtilities.test.ts` and by the packed-consumer proof in `cliPackaging.test.ts`.

The Level-3 guide has an additional synchronization test that requires its five embedded `.cog` programs to remain identical to the five canonical application fixtures in curriculum order. Those applications receive compile/validate/plan/execute assertions through `canonicalExamples.test.ts`.

The packed distribution receives an additional stranger test that verifies the generated learning artifact from a clean downstream project rather than from the monorepo checkout.

## 14. Ratification

`COG_DP_TEACHING_SURFACE_RATIFIED`

The teaching curriculum and packaged distribution contract are frozen for the Developer Preview unless an explicit public-surface change supersedes them.
