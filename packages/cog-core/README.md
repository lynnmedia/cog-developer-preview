# `@winmedia/cog-core`

`@winmedia/cog-core` is the ontology-agnostic Cog kernel and Developer Preview package. It owns the neutral language surface, AST, CoreIR, validation, planning, runtime execution, traces, adapter contracts, the installed `cog` command, the canonical executable examples, and the assembled Developer Preview learning pack.

Core does not define MoM, Mandala, SROW, personalization, journey, profile, or other domain semantics. Those concerns belong in CogLib, domain libraries, adapters, tools, or applications according to the Cog layer architecture.

## Package Requirements

```text
Node.js 20.x
npm >= 10
```

## Start Here

After installing `@winmedia/cog-core`, the Developer Preview learning pack is available inside the installed package:

```text
node_modules/@winmedia/cog-core/learning/MANIFEST.md
node_modules/@winmedia/cog-core/learning/START_HERE.md
```

The complete curriculum is shipped as:

```text
learning/START_HERE.md
learning/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md
learning/GOVERNED_DECISION_TUTORIAL.md
learning/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md
learning/LEVEL_3_COGNITIVE_APPLICATIONS.md
```

Reference authorities are also included under `learning/`, and the complete canonical executable example tree is shipped under:

```text
examples/
```

The `learning/` directory is assembled during package creation from the repository teaching authorities. It is generated distribution content rather than a second independently maintained documentation source.

## Kernel Surface

Core provides:

- `lex()`
- `parseCog()`
- `compileCog()`
- `compileCogIncremental()`
- `validateCog()`
- `planCog()`
- `executeCog()`
- neutral type contracts under `src/types`
- CogLib exports
- domain-library registry and currently admitted libraries
- workflow inspection/testing services
- LSP services
- CLI entry points

The canonical consumer pipeline is:

```text
LEX → PARSE → COMPILE → VALIDATE → PLAN → EXECUTE → EMISSIONS + TRACE
```

`executeCog()` performs validation and planning internally before executing its plan.

## Installed CLI

Installing `@winmedia/cog-core` exposes the `cog` executable:

```bash
cog help
cog discover
cog workflows
cog validate <file>
cog run <file>
cog lint <file>
cog graph <file>
cog trace <file> [--phase <phase>]
cog diff <before.cog> <after.cog>
```

For a normal project-local install, use `npx --no-install cog ...` to invoke the package-local executable without assuming a global PATH entry.

The Level-2 utilities are thin CLI adapters over existing package services:

- `lint` → `WorkflowLinter`
- `graph` → `WorkflowGraphViewerService`
- `trace` → runtime trace + `TraceExplorer`
- `diff` → runtime traces + `TraceDiffVisualizer`

`diff` compares Cog execution traces, not source text. `lint` reports workflow warnings but does not replace structural validation.

## Distribution Proof

The package test suite contains two downstream-install proofs:

1. the CLI packaging proof installs a generated tarball into a temporary consumer project and exercises the complete Developer Preview CLI surface;
2. the learning-pack stranger test installs the tarball into a clean consumer project, verifies the shipped curriculum and examples, executes the Level-1 examples and governed tutorial, and exercises all five Level-3 applications through the installed CLI.

The stranger test is designed to reject monorepo-only example paths in the assembled `START_HERE.md`.

## Language Authority

Repository source authorities are:

- `docs/LANGUAGE_SPEC_v0.4.md` — canonical public authoring profile;
- `docs/LANGUAGE_SEMANTIC_MODEL.md` — semantic and execution interpretation;
- `docs/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md` — language and cognitive-pattern learning surface;
- `docs/GOVERNED_DECISION_TUTORIAL.md` — progressive full-program tutorial;
- `docs/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md` — CLI inspection and execution utilities;
- `docs/LEVEL_3_COGNITIVE_APPLICATIONS.md` — canonical cognitive application capstone;
- `packages/cog-core/examples/` — executable examples;
- `packages/cog-core/src/tests/canonicalExamples.test.ts` — semantic proof of canonical examples.

Installed packages receive assembled copies of the teaching authorities under `learning/` plus the executable `examples/` tree.

The executable parser is the provisional authority if older repository prose disagrees with the current language surface.

## Kernel / Higher-Layer Boundary

Core is responsible for:

- syntax and parsing;
- CoreIR;
- structural validation;
- execution planning;
- runtime execution structure;
- emissions;
- traces;
- adapter interfaces.

Core does **not** imply a universal cognitive algorithm merely because a program declares a comparison, classification, transformation, constraint, extraction, grouping, evaluation, or explanation. Higher-order algorithms and domain semantics are supplied above the kernel by CogLib routines, domain libraries, adapters, tools, and applications.

The Level-2 CLI follows the same rule: commands expose existing Cog services rather than introducing a parallel semantics implementation.

## Validation

From the repository root:

```bash
npm run test:v0.3
git diff --check
```

The package test command builds `packages/cog-core` and runs the Node test suite under `packages/cog-core/src/tests`.

## Current Limits

- no browser UI or hosted HTTP API;
- no database or production deployment surface;
- no loops, user-defined functions, imports, or macros in the `.cog` Developer Preview language;
- TypeScript contracts remain the primary schema representation;
- domain semantics must not leak downward into the ontology-agnostic kernel.
