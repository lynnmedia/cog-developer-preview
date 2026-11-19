# Cog Developer Preview Pre-Release Checklist

This checklist governs external distribution of the Cog Developer Preview. Passing the automated gates does **not** authorize publication; registry publication still requires explicit repository-owner authorization.

## 1. Distribution Boundary
- [ ] Root `cog` package remains `"private": true` and is never published directly.
- [ ] Primary public package is `@winmedia/cog-core`.
- [ ] Optional public adapters are limited to explicitly approved packages (`@winmedia/cog-adapter-mom`, `@winmedia/cog-adapter-decision` for this preview).
- [ ] Cognitive Workspace and Book Assistant remain downstream application packages, not part of the core language distribution.
- [ ] VS Code extension is treated as developer tooling with an independent distribution path.

## 2. Environment & Metadata
- [ ] Node.js contract is `20.x`; npm contract is `>=10`.
- [ ] Distributable packages have name, version, description, author, license, repository, engines, main, types, exports, and files metadata.
- [ ] No distributable dependency surface contains publication-blocking `file:` or `workspace:` references.
- [ ] Core and approved adapter package versions are mutually compatible for the release candidate.

## 3. Build & Regression
- [ ] `npm ci` passes from a clean checkout.
- [ ] `npm run build:v0.3` passes, including approved adapters and VS Code tooling.
- [ ] `npm test` passes.
- [ ] `npm run test:v0.3` passes after the public v0.3 workspaces are built.
- [ ] `git diff --check` passes.

## 4. Package Archives
- [ ] `npm pack --dry-run -w @winmedia/cog-core` passes and archive contents are appropriate.
- [ ] Core archive includes `dist/`, `README.md`, `learning/`, and `examples/`.
- [ ] `npm pack --dry-run -w @winmedia/cog-adapter-mom` passes.
- [ ] `npm pack --dry-run -w @winmedia/cog-adapter-decision` passes.

## 5. Clean Consumer Proof
- [ ] A clean project can install the packed `@winmedia/cog-core` archive without repository-relative imports.
- [ ] Installed consumer can execute the `cog` binary through local npm/npx tooling.
- [ ] Clean TypeScript consumer compiles and executes through documented public exports.
- [ ] Handwritten `.cog` consumer parses, compiles, validates, executes, and exposes trace/output evidence.
- [ ] Packed Developer Preview stranger test passes from a temporary downstream project.
- [ ] Previous clean-consumer proofs remain compatible or are explicitly superseded by a current proof.

## 6. Language & CLI Tooling
- [ ] Structured diagnostics remain operational.
- [ ] CLI help exposes the ratified Developer Preview surface: `discover`, `workflows`, `validate`, `lint`, `graph`, `run`, `trace`, `diff`.
- [ ] `lint`, `graph`, `trace`, and `diff` delegate to the existing tested Cog services rather than a parallel semantics implementation.
- [ ] VS Code extension builds against the current language surface.
- [ ] Determinism/reproducibility and backward-compatibility corpus tests remain green.

## 7. Documentation & Learning
- [ ] Root README matches the current public/private package boundary and installed CLI.
- [ ] `docs/START_HERE.md` is the current CLI-first onboarding authority.
- [ ] `docs/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md` matches the canonical ten-pattern fixture sequence.
- [ ] `docs/GOVERNED_DECISION_TUTORIAL.md` remains executable against the current language/runtime.
- [ ] `docs/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md` matches the installed CLI surface.
- [ ] `docs/LEVEL_3_COGNITIVE_APPLICATIONS.md` matches the canonical application fixtures.
- [ ] `docs/GETTING_STARTED.md` and `docs/AUTHORING_TUTORIAL.md` remain valid compatibility redirects and do not contradict the current teaching authorities.
- [ ] Pack-time learning assembly produces `learning/MANIFEST.md` and all referenced installed learning documents.
- [ ] Examples required by the curriculum are present in the published package and runnable.

## 8. Release Record
- [ ] `CHANGELOG.md` contains the current Developer Preview learning/CLI/distribution refresh.
- [ ] `docs/RELEASE_NOTES_DEVELOPER_PREVIEW.md` describes the actual CLI, learning path, package contents, scope, compatibility, known limitations, and public boundary.
- [ ] Compatibility/deprecation posture is explicit.
- [ ] Release notes do not claim obsolete API-only onboarding or absence of the installed CLI.

## 9. Automated Gates
- [ ] Developer Preview learning-pack workflow passes on the release candidate commit.
- [ ] `npm run validate:release` passes.
- [ ] `.github/workflows/dao-release-validation.yml` passes on the release candidate commit.

## 10. Release Identity
- [ ] Release candidate commit is identified on the supported `developer-preview` line.
- [ ] Exact published source will receive an immutable Git tag corresponding to the released package version.

## 11. Publication Authorization
- [ ] **Explicit owner authorization has been given for npm/external-registry publication.**

Until item 11 is checked, the result is a validated release candidate, not a published release.
