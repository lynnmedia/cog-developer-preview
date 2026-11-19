# Cog Developer Preview 0.3

## Release posture

This release is a controlled Developer Preview of the Cog language, kernel, CLI, learning surface, and approved public adapters. It is intended for learning, experimentation, clean-consumer integration, and controlled downstream adoption. It is not a 1.0 compatibility promise.

## Public distribution boundary

Primary package:

- `@winmedia/cog-core` 0.3.0

Optional public adapters:

- `@winmedia/cog-adapter-mom` 0.3.0
- `@winmedia/cog-adapter-decision` 0.3.0

Developer tooling:

- Cog VS Code language support in `packages/cog-vscode-extension`

The root `cog` monorepo package remains private. Cognitive Workspace and Book Assistant are downstream applications and are not part of the core language distribution.

## Capability surface

The Developer Preview includes:

- the `.cog` lexer/parser and AST;
- CoreIR compilation;
- structural validation and planning;
- deterministic runtime execution;
- emissions and execution traces;
- diagnostics and resource guards;
- workflow linting and graph inspection;
- trace inspection and execution-trace diffing;
- domain-library discovery and workflow catalog inspection;
- documented adapter boundaries;
- the packaged Developer Preview learning curriculum and canonical examples.

Cog represents, governs, plans, validates, traces, composes, and executes declared cognition. Domain-specific cognitive algorithms remain the responsibility of CogLib routines, domain libraries, adapters, tools, or applications when they are not already represented explicitly in a Cog program.

## Installed CLI

Installing `@winmedia/cog-core` exposes the `cog` executable. For a normal local installation, the documented form is:

```bash
npx --no-install cog <command>
```

The Developer Preview command surface is:

```text
discover
workflows
validate <file>
lint <file>
graph <file>
run <file>
trace <file> [--phase <phase>]
diff <before.cog> <after.cog>
```

`diff` compares execution traces produced by two Cog programs; it is not a source-text diff.

## Learning path

The repository teaching authorities are:

1. `docs/START_HERE.md`
2. `docs/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md`
3. `docs/GOVERNED_DECISION_TUTORIAL.md`
4. `docs/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md`
5. `docs/LEVEL_3_COGNITIVE_APPLICATIONS.md`

The packaged `@winmedia/cog-core` artifact ships distribution copies under:

```text
learning/MANIFEST.md
learning/START_HERE.md
learning/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md
learning/GOVERNED_DECISION_TUTORIAL.md
learning/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md
learning/LEVEL_3_COGNITIVE_APPLICATIONS.md
examples/
```

A normal installed consumer can therefore learn and execute Cog without a checkout of the monorepo.

## Canonical learning applications

The Level-3 reference application set includes:

1. Research Synthesis
2. Document Review / Drift Detection
3. Decision Analysis
4. Audit Reasoning
5. Knowledge Graph

These are executable reference application shapes, not claims that the neutral kernel independently derives all represented domain conclusions.

## Compatibility

- Node.js: 20.x
- npm: >=10
- `@winmedia/cog-core`: 0.3.0
- `@winmedia/cog-adapter-mom`: 0.3.0
- `@winmedia/cog-adapter-decision`: 0.3.0
- root monorepo package: private/non-publishable

Public contracts may still evolve before 1.0. Consumers should avoid internal source-path imports and rely on documented package exports and the installed CLI.

## Known limitations

- This is a Developer Preview, not a 1.0 stability guarantee.
- The base kernel is deliberately neutral and does not silently supply arbitrary sensing, comparison, classification, transformation, constraint-predicate, or domain-reasoning algorithms.
- The VS Code package is developer tooling and has an independent distribution path from npm publication of the kernel packages.
- Cognitive Workspace and Book Assistant are downstream applications and are outside the public core distribution contract.
- Publication to npm or another external registry requires separate explicit repository-owner authorization.

## Learning-pack and consumer proof

DP-LEARN-008 assembled the learning pack into the actual `@winmedia/cog-core` tarball and proved it from a clean downstream project. The stranger test verifies that an installed consumer can:

- locate the curriculum and canonical examples;
- run the installed CLI;
- validate and execute the ten Level-1 examples;
- validate, lint, graph, run, and trace the governed-decision tutorial;
- locate and inspect all five Level-3 applications;
- run trace comparisons through the installed package.

The Developer Preview learning-pack gate and the broader release-validation gate have both passed on the reconciled Developer Preview baseline.

## DAOH provenance

The original Distribution, Adoption, and Operational Hardening program established clean TypeScript and DSL consumer pilots, diagnostics, determinism and backward-compatibility proofs, tutorials, external-author usability, release governance, and an adoption-readiness gate in July 2026.

The current Developer Preview reconciles that release-hardening work with the CLI-first learning pack and the current public/private monorepo boundary rather than creating a second distribution architecture.

## Verification

From a clean repository checkout, run the release-oriented sequence:

```bash
npm ci
npm run build:v0.3
npm test
npm run test:v0.3
npm run validate:release
git diff --check
```

The hosted release workflows exercise the package-specific learning/stranger gate and the broader release-validation gate.
