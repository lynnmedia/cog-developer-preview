# Cog

`cog` is a standalone TypeScript repository for a small declarative cognition language and governed execution substrate. Its current public-development center is the `@winmedia/cog-core` workspace package.

Cog source describes inspectable semantic structure—entities, relations, perspectives, resolutions, transformation intent, constraints, and emissions—which is compiled into CoreIR, validated, planned, executed, and traced.

> **Developer Preview Notice**
> Cog is provided as a Developer Preview. APIs, language constructs, package boundaries, and tooling may evolve before a stable 1.0 release. Preview users should pin package versions and review release notes before upgrading.

## Run a checked-in example

Use Node.js 20 and npm 10 or later. From this repository's root:

```bash
npm ci
npm run build:v0.3
node packages/cog-core/dist/cli/bin.js validate packages/cog-core/examples/primitives/canonical-observation.cog
node packages/cog-core/dist/cli/bin.js run packages/cog-core/examples/primitives/canonical-observation.cog
```

The example validates and emits one observation. Start with [the language and CLI guide](docs/START_HERE.md) to write your own program.

## Start Here

New Developer Preview users should begin with:

1. `docs/START_HERE.md`
2. `docs/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md`
3. `docs/GOVERNED_DECISION_TUTORIAL.md`
4. `docs/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md`
5. `docs/LEVEL_3_COGNITIVE_APPLICATIONS.md`

`START_HERE.md` provides the shortest CLI-first path from a clean project to installing Cog and running a canonical `.cog` program. Level 1 teaches the seven language statement families through ten tested canonical cognitive patterns. The governed-decision tutorial composes the full language surface into one semantic graph. Level 2 adds a Unix-inspired inspection toolbelt. Level 3 applies the learned structures and utilities to five tested cognitive application architectures.

## Developer Preview Distribution

A packed or published `@winmedia/cog-core` package contains the complete learning surface required by a new developer:

```text
dist/
README.md
learning/
examples/
```

`learning/` is assembled during package creation from the authoritative repository documents. This avoids maintaining a second hand-edited curriculum while giving a package consumer a self-contained learning artifact.

After installation, begin at:

```text
node_modules/@winmedia/cog-core/learning/MANIFEST.md
node_modules/@winmedia/cog-core/learning/START_HERE.md
```

Canonical executable examples are available under:

```text
node_modules/@winmedia/cog-core/examples/
```

`packages/cog-core/src/tests/learningPackStranger.test.ts` packs `@winmedia/cog-core`, installs the generated tarball into a temporary downstream project, verifies the shipped curriculum, and exercises the learning path through the installed CLI. `.github/workflows/developer-preview-learning-pack.yml` provides the hosted clean-environment gate for this proof.

## Developer Preview Surface

Current package requirements:

```text
Node.js 20.x
npm >= 10
```

The `@winmedia/cog-core` package contains:

- lexer and parser for `.cog` source;
- AST and CoreIR contracts;
- compiler and incremental compiler;
- structural validator;
- deterministic planner;
- runtime execution and traces;
- CogLib cognitive routines and contracts;
- domain libraries and adapters;
- workflow inspection/testing services;
- LSP support;
- canonical executable examples;
- assembled Developer Preview learning documents;
- a CLI implementation exposed as the installed `cog` executable.

The Developer Preview CLI surface is:

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

For a normal local npm installation, `docs/START_HERE.md` uses `npx --no-install cog ...` so the project-local executable is invoked without assuming a global PATH entry.

## Language

The canonical Developer Preview authoring profile is documented in:

- `docs/LANGUAGE_SPEC_v0.4.md`
- `docs/LANGUAGE_SEMANTIC_MODEL.md`

The language intentionally remains small. It does not currently expose loops, user-defined functions, imports, macros, or general-purpose hidden control flow.

## Learning and Examples

The current learning path is:

```text
START_HERE
  ↓
Level 1 — Language & Cognitive Patterns
  ↓
Governed Decision Tutorial
  ↓
Level 2 — Composable Cognitive Utilities
  ↓
Level 3 — Cognitive Applications
```

Executable source examples live under:

```text
packages/cog-core/examples/
  primitives/
  pipelines/
  graphs/
  adapters/
  tutorials/
  applications/
```

The canonical examples are exercised by `packages/cog-core/src/tests/canonicalExamples.test.ts`. `level1LearningGuide.test.ts` locks the Level-1 examples to canonical fixtures. `governedDecisionTutorial.test.ts` proves the progressive tutorial fixture. `level2CliUtilities.test.ts` proves the Level-2 utility behavior. `cliPackaging.test.ts` proves the command surface through a packed downstream installation. `level3LearningGuide.test.ts` locks the five Level-3 applications to the canonical application fixtures. `learningPackStranger.test.ts` proves the assembled distribution shape from a clean recipient environment.

Historical `docs/GETTING_STARTED.md` and `docs/AUTHORING_TUTORIAL.md` are superseded for the Developer Preview and are retained only to avoid breaking existing links.

## Architecture Boundary

The intended dependency direction is:

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

Core remains ontology-agnostic. Higher layers may supply cognitive algorithms and domain semantics without pushing those semantics into the language kernel.

## Build and Test

From the repository root:

```bash
npm ci
npm run build
npm test
npm run build:v0.3
npm run test:v0.3
git diff --check
```

To inspect the package-local learning assembly without publishing:

```bash
npm run assemble:learning -w @winmedia/cog-core
```

`npm pack` for `@winmedia/cog-core` runs package build and learning assembly through the package `prepack` lifecycle.

`npm run release:local` mutates package version state and should only be used in explicit release scope.

## Contributing, Roadmap, and Security

- See [CONTRIBUTING.md](CONTRIBUTING.md) for architectural principles and testing requirements.
- See [ROADMAP.md](ROADMAP.md) for public milestones and capability tracks.
- Report vulnerabilities privately according to [SECURITY.md](SECURITY.md).

## Repository Boundaries

This repository is not a hosted API, browser application, production database service, or production deployment surface. Application integrations such as MandalaStacks, Book Assistant, and other consumers remain higher-layer concerns.

Developer Preview learning material must follow executable language behavior and tested examples rather than historical documentation.

## License

Cog is open-source software licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Lynn Media.
