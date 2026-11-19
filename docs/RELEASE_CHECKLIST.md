# Cog Developer Preview Pre-Release Checklist

This checklist governs external distribution of the cog Developer Preview. Passing the automated gate does **not** authorize publication; registry publication still requires explicit repository-owner authorization.

## 1. Distribution Boundary
- [ ] Root `cog` package remains `"private": true` and is never published directly.
- [ ] Primary public package is `@cog/core`.
- [ ] Optional public adapters are limited to explicitly approved packages (`@cog/adapter-mom`, `@cog/adapter-decision` for this preview).
- [ ] Cognitive Workspace and Book Assistant remain downstream application packages, not part of the core language distribution.
- [ ] VS Code extension is treated as developer tooling with an independent distribution path.

## 2. Environment & Metadata
- [ ] Node.js contract is `20.x`; npm contract is `>=10`.
- [ ] Distributable packages have name, version, description, author, license, repository, engines, main, types, exports, and files metadata.
- [ ] No distributable dependency surface contains publication-blocking `file:` references.

## 3. Build & Regression
- [ ] `npm run build:v0.3` passes, including VS Code tooling.
- [ ] `npm test` passes.
- [ ] `npm run test:v0.3` passes.
- [ ] `git diff --check` passes.

## 4. Package Archives
- [ ] `npm pack --dry-run -w @cog/core` passes and archive contents are appropriate.
- [ ] `npm pack --dry-run -w @cog/adapter-mom` passes.
- [ ] `npm pack --dry-run -w @cog/adapter-decision` passes.

## 5. Clean Consumer Proof
- [ ] A clean project can install the packed `@cog/core` archive without repository-relative imports.
- [ ] Clean TypeScript consumer compiles and executes through documented public exports.
- [ ] Handwritten `.cog` consumer parses, compiles, validates, executes, and exposes trace/output evidence.
- [ ] Previous clean-consumer proofs remain compatible or are explicitly superseded by a current proof.

## 6. Language Tooling
- [ ] Structured diagnostics remain operational.
- [ ] VS Code extension builds against the current language surface.
- [ ] Determinism/reproducibility and backward-compatibility corpus tests remain green.

## 7. Documentation & Learning
- [ ] Root README matches the current public/private package boundary.
- [ ] `docs/GETTING_STARTED.md` is runnable against current public exports and Node 20.
- [ ] `docs/AUTHORING_TUTORIAL.md` is consistent with current `.cog` syntax.
- [ ] `docs/DOMAIN_LIBRARY_TUTORIALS.md` remains applicable to current domain-library contracts.
- [ ] Examples required by tutorials are present and runnable.

## 8. Release Record
- [ ] `CHANGELOG.md` contains the Developer Preview refresh.
- [ ] `docs/RELEASE_NOTES_DEVELOPER_PREVIEW.md` describes scope, compatibility, known limitations, and public boundary.
- [ ] Compatibility/deprecation posture is explicit.

## 9. Automated Gate
- [ ] `npm run validate:release` passes.
- [ ] `.github/workflows/dao-release-validation.yml` passes on the release candidate commit.

## 10. Publication Authorization
- [ ] **Explicit owner authorization has been given for npm/external-registry publication.**

Until item 10 is checked, the result is a validated release candidate, not a published release.
