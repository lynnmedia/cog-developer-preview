# AGENTS.md

## Purpose

`cog` is a standalone TypeScript cognition-kernel and package/schema-contract repo for a small `.cog` language, deterministic cognition execution pipeline, and v0.3 workspace packages.

## Operating Rules for Coding Agents

- Work only from this repo root.
- Before changes, verify `pwd`, branch, status, branch/ahead state, and remotes.
- Default branch is `main` unless the task explicitly says otherwise.
- Do not create, switch, merge, rebase, reset, or delete branches unless explicitly authorized.
- Do not deploy, publish packages, tag releases, mutate production data, call external APIs, or dispatch workers unless explicitly scoped.
- Do not commit secrets, `.env`, `.env.local`, credentials, service-account files, private keys, private media, production data, build outputs, or runtime artifacts.
- Do not perform broad refactors or unrelated cleanup.
- Preserve existing behavior unless the task explicitly changes it.
- Treat recommendations, readiness reviews, and preflights as advisory only.

## TDD and Validation

- Nontrivial implementation must be test-first, regression-first, or explicitly validation-governed.
- Do not commit failing tests unless the task explicitly authorizes a red-state checkpoint.
- Do not weaken tests, validators, security checks, or boundaries to make work pass.
- Run the repo validation commands listed below before commit.
- If a listed command is unavailable, report `COMMAND_NOT_AVAILABLE` rather than inventing a substitute.

## Repo Validation Commands

```bash
npm run build
npm test
npm run build:v0.3
npm run test:v0.3
git diff --check
git status --short
```

## Repo-Specific Boundaries

- Do not assume `cog` has the same role as `cognitive-os`.
- Do not move, merge, or rename responsibilities between `cog`, `cognitive-os`, MandalaStacks, WinMedia, Docman, or Orchestrator without an explicit boundary HDCP.
- Do not claim runtime, package, release, publishing, website, API, or production readiness without repo evidence.
- Do not run `npm run release:local`, publish packages, or mutate version/package state unless release work is explicitly scoped.
- Keep the kernel ontology-agnostic unless a task explicitly scopes adapter/domain behavior.

## Blocker Behavior

- If blocked, investigate before exiting.
- Report the blocker code, root cause, changed/untracked files, validation or push failure, and one concrete next action.
- Do not continue with another task after push failure, branch mismatch, dirty unrelated worktree, secret/private-file risk, deployment attempt, production-data risk, or scope expansion.

## Summary and Commit Rules

- Write the completion summary to `codex-summaries/cog/<HDCP_ID>.summary.md`.
- Keep `FINAL_COMMIT_SHA_REPORTED_IN_CHAT` as the committed summary SHA placeholder.
- Include the real final commit SHA in the final chat/completion report.
- Commit only intended changes after validation passes.
- Commit message must begin with the HDCP ID.
