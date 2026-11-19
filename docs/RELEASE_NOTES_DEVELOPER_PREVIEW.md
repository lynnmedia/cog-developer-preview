# cog Developer Preview 0.3

## Release posture

This release is a controlled developer preview of the cog language/kernel. It is intended for learning, experimentation, clean-consumer integration, and controlled downstream adoption. It is not a 1.0 compatibility promise.

## Public distribution boundary

Primary package:

- `@cog/core` 0.3.0

Optional domain adapters:

- `@cog/adapter-mom`
- `@cog/adapter-decision`

Developer tooling:

- Cog VS Code language support in `packages/cog-vscode-extension`

The root `cog` monorepo package remains private. Cognitive Workspace and Book Assistant are downstream applications and are not part of the core language distribution.

## Capability surface

The Developer Preview includes the `.cog` lexer/parser, AST, CoreIR compilation, validation, planning, deterministic runtime execution, traces, diagnostics, identity/governance contracts, workflow linting and inspection services, and documented adapter boundaries.

## Learning path

Start with:

1. `docs/GETTING_STARTED.md`
2. `docs/AUTHORING_TUTORIAL.md`
3. `docs/DOMAIN_LIBRARY_TUTORIALS.md`
4. `packages/cog-core/examples`

The intended clean-consumer experience is: install `@cog/core`, author a `.cog` workflow, compile it, validate it, execute it, and inspect its trace using only documented public exports.

## Compatibility

- Node.js: 20.x
- npm: 10+
- Core package version: 0.3.0
- Root monorepo package: private/non-publishable

Public contracts may still evolve before 1.0. Consumers should avoid internal source-path imports.

## Known limitations

- No standalone general-purpose `cog` command-line compiler is promised by this preview; the documented authoring path uses the `@cog/core` API.
- The VS Code package is developer tooling and should be treated independently from npm publication of the kernel packages.
- Cognitive Workspace and Book Assistant demonstrate downstream use but are not part of the core distribution contract.
- Publication to npm or another registry requires separate explicit release authorization.

## DAOH provenance

The original Distribution, Adoption, and Operational Hardening program established clean TypeScript and DSL consumer pilots, diagnostics, determinism and backward-compatibility proofs, tutorials, external-author usability, release governance, and an adoption-readiness gate in July 2026.

This Developer Preview refresh revalidates that program against the current monorepo boundary and documentation rather than creating a second distribution architecture.

## Verification

Run:

```bash
npm run validate:release
```

The current release gate verifies the root/private boundary, current v0.3 workspace build including VS Code tooling, distributable package metadata, documentation freshness constraints, regression tests, and npm package dry-runs.
