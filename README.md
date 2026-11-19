# cog

`cog` is a TypeScript cognition kernel and `.cog` language for building governed, inspectable transformations over structured meaning.

The public developer surface is centered on `@cog/core`, with optional domain adapters and VS Code language support. Larger applications in this monorepo, including Cognitive Workspace and Book Assistant, consume cog but are not part of the core language distribution.

## Developer Preview Status

- Core package: `@cog/core` v0.3.0
- Runtime: parser, compiler, validation, planning, deterministic execution, trace, identity and governance contracts
- Tooling: structured diagnostics, LSP/VS Code support, workflow linting, graph/trace visualization services
- Adapters: `@cog/adapter-mom`, `@cog/adapter-decision`
- Applications: Cognitive Workspace and Book Assistant are downstream/private application packages in this repository
- Environment: Node.js 20.x, npm 10+

The current release target is a controlled **Developer Preview**, not a 1.0 stability promise.

## What cog Is For

Use cog where software must represent and govern meaning explicitly: concepts, relationships, evidence, authority, assumptions, constraints, transformations, identity, provenance, and traceable cognitive state.

Use conventional languages for ordinary application plumbing, networking, persistence, UI, and general computation. cog is intended to be the cognitive layer inside a larger system, not a replacement for TypeScript, Python, Java, or C#.

## Core Toolchain

```text
.cog source
  -> lexer/parser
  -> AST
  -> compiler
  -> CoreIR
  -> validation/planning
  -> runtime execution
  -> trace + outputs
```

Primary package:

- `packages/cog-core` - ontology-neutral language/kernel

Optional adapters:

- `packages/cog-adapter-mom`
- `packages/cog-adapter-decision`

Tooling:

- `packages/cog-vscode-extension`

## Start Learning

Read these in order:

1. `docs/GETTING_STARTED.md`
2. `docs/AUTHORING_TUTORIAL.md`
3. `docs/DOMAIN_LIBRARY_TUTORIALS.md`
4. examples under `packages/cog-core/examples`

A clean consumer should be able to install `@cog/core`, author a `.cog` file, compile it, validate it, execute it, and inspect the resulting trace without importing repository-internal modules.

## Build and Test

```bash
npm install
npm run build
npm test
npm run build:v0.3
npm run test:v0.3
npm run validate:release
```

## Local Packaging

The root package remains private. Public distribution is through workspace packages such as `@cog/core`.

For local package proofs, use package-level `npm pack` / dry-run workflows rather than publishing the root package.

## Release Governance

See:

- `docs/RELEASE_CHECKLIST.md`
- `docs/RELEASE_NOTES_TEMPLATE.md`
- `CHANGELOG.md`

No npm or external-registry publication is authorized merely by passing validation. Publication requires explicit release authorization.

## Repository Boundaries

This repository contains the standalone Cog language kernel, domain adapters, and tooling. Downstream applications (such as Book Assistant and Cognitive Workspace) operate in independent repositories. New kernel features should be driven by demonstrated consumer demand rather than speculative platform growth.
