# Contributing to Cog

Thank you for your interest in contributing to Cog. Cog is an ontology-agnostic cognition kernel and language for deterministic cognitive specifications.

---

## 1. Constitutional Principles

1. **Kernel Ontology Agnosticism**: The Core language (`@winmedia/cog-core`) must not assume or hardcode any domain ontology or application-specific semantics. Domain concerns belong in domain libraries or custom adapters.
2. **Deterministic Execution**: All language execution, planning, and validation must produce deterministic, reproducible outcomes.
3. **Rigorous Boundaries**: Workspace packages maintain clear separation between Core, Standard Library, Developer Tools, and Domain Adapters.

---

## 2. Local Development & Testing

### Prerequisites
- **Node.js**: `20.x`
- **npm**: `>=10`

### Build and Test Commands
```bash
# Clean install
npm install

# Build core and workspaces
npm run build
npm run build:v0.3

# Run test suites
npm test
npm run test:v0.3

# Run release validation and isolated consumer proofs
npm run validate:release
```

---

## 3. Branch Governance

Cog uses a mainline-plus-stabilization model.

### Long-lived branches

- **`main`** — forward development. Accepted features, architecture changes, documentation, and future-version work land here.
- **`developer-preview`** — the currently supported Developer Preview stabilization line. It represents what Preview users can rely on while `main` continues to evolve. Ordinary feature development does not occur directly on this branch.
- **`archive/*`** — immutable historical preservation points. Archive branches are not development or release targets.

### Short-lived branches

- **`feature/*`** — ordinary new work, branched from `main` and merged back to `main` through a pull request.
- **`fix/*`** — non-release-specific corrections, branched from `main` and merged back to `main`.
- **`hotfix/dp-*`** — urgent fixes to the supported Developer Preview. Branch from `developer-preview`, merge the fix into `developer-preview`, then forward-port the same correction to `main` so the development line never loses a release fix.
- **`spike/*`** — optional short-lived experimental work where architectural uncertainty warrants isolation. A spike is never itself a release line; useful results are reworked or merged deliberately into `main`.

### Release identity

Use Git tags for exact published Developer Preview versions. The moving `developer-preview` branch identifies the supported Preview line; a tag identifies the exact immutable source corresponding to a particular published package version.

Do not create a permanent `develop` branch while `main` is the designated forward-development line. Do not use `developer-preview` as a second feature branch. Additional long-lived release branches should be introduced only if Cog later supports multiple release families simultaneously.

### Flow

```text
feature/* ───────┐
fix/* ───────────┼──> main ───────────────> future development
                 │      │
                 │      └── cut/advance supported baseline deliberately
                 │
                 └─────────────────────────

                    developer-preview
                           │
                    hotfix/dp-*
                           │
                 merge back + forward-port to main
```

The `developer-preview` branch should advance only after an explicit release/stabilization decision and the applicable Developer Preview validation gates pass.

---

## 4. Pull Request Guidelines

- All new features or routines must include deterministic tests.
- Maintain the locked public API boundary on `@winmedia/cog-core`.
- Run `npm run validate:release` and ensure all applicable tests pass cleanly before submitting or merging a release-affecting PR.
- Target ordinary feature and fix PRs to `main`.
- Target DP hotfix PRs to `developer-preview`, then forward-port them to `main`.
- Do not merge experimental branches directly into `developer-preview`.
