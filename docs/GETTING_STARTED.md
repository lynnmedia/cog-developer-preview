# Getting Started with Cog — Superseded

**Status:** Superseded for the Developer Preview.

This historical onboarding path is intentionally retained to avoid breaking existing links, but it is not the current Developer Preview learning authority.

Use:

1. [`START_HERE.md`](START_HERE.md) — install Cog, verify the CLI, write, validate, and run your first program.
2. [`LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md`](LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md) — learn the seven statement families through the ten canonical cognitive patterns.
3. [`GOVERNED_DECISION_TUTORIAL.md`](GOVERNED_DECISION_TUTORIAL.md) — compose the full language surface in one governed cognitive example.
4. `docs/LANGUAGE_SPEC_v0.4.md` — canonical Developer Preview syntax.
5. `packages/cog-core/examples/` — executable examples.

The Developer Preview environment is:

```text
Node.js 20.x
npm >= 10
@winmedia/cog-core
```

The intended beginner execution path is CLI-first. For a normal project-local installation, use:

```bash
npx --no-install cog help
npx --no-install cog validate example.cog
npx --no-install cog run example.cog
npx --no-install cog discover
npx --no-install cog workflows
```

Do not copy the older TypeScript-runner workflow from repository history into new onboarding material.
