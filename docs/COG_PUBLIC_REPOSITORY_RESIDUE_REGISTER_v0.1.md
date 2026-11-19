# Cog Public Repository Residue Register (v0.1)

```text
audit_version: 0.1.0
governing_hdcp: COG-PRIVATE-RESIDUE-AUDIT-006
audit_scope: CURRENT_TREE_AND_FULL_GIT_HISTORY
current_tree_determination: COG_CURRENT_TREE_SANITATION_REQUIRED
history_determination: COG_HISTORY_REWRITE_RECOMMENDED
overall_determination: COG_PRIVATE_RESIDUE_SANITATION_REQUIRED
validation_date: 2026-08-20
```

## 1. Executive Summary & Objective

This register records the findings of an exhaustive security, privacy, and sensitive residue audit across the current worktree and the complete 704-commit Git history of the `cog` repository.

The goal is to determine the repository's fitness for eventual public visibility and to clearly distinguish:
1. **`historical code exists`**: Historical commits containing formerly co-located downstream applications (`book-assistant`, `cognitive-workspace`) and internal integration bridges prior to detachment.
2. **`historical sensitive material exists`**: Credentials, secrets, tokens, private keys, passwords, or customer PII.

### Key Audit Findings
- **Zero Critical Secret Exposures**: No passwords, private keys, API keys, `.env` files, or live auth tokens were discovered in either the current tree or the entire 704-commit Git history.
- **Zero Binary/Database Residue**: No SQLite databases (`.sqlite`, `.db`), binary archives (`.zip`, `.tgz`), or core dumps exist in Git history.
- **Current Tree Residue Identified**:
  - Proprietary integration modules (`packages/cog-core/src/integration/**`) and legacy product templates (`src/product/**`).
  - Internal orchestration, agent logs, and state files containing absolute local paths and private repository cross-references (`STATE.md`, `ORCHESTRATOR.md`, `codex-summaries/cog/**`).
- **Historical Application Code Identified**: Historical commits prior to commit `3a3eee7` contain the complete extracted application codebases (`packages/book-assistant`, `packages/cognitive-workspace`, `artifacts/book-assistant`).

---

## 2. Detailed Findings Register

### 2.1. Current Tree Findings

| Finding ID | Location / Path | Exposure Type | Severity | Confidence | Evidence | Disposition | Publication Blocker |
|---|---|---|---|---|---|---|---|
| `TREE-001` | `packages/cog-core/src/integration/**` | `TREE_PRIVATE_RESIDUE` | LOW | HIGH | Proprietary bridge code for `mandalaStacks`, `bookFactory`, `researchFactory`, `auditWorkbench`. Unreachable from public barrel, but present in tree. | `REMOVE_BEFORE_PUBLIC` | YES (Prior to Public Release) |
| `TREE-002` | `src/product/**` (Root Legacy) | `TREE_PRIVATE_RESIDUE` | LOW | HIGH | Pre-v0.3 legacy Mandala product templates and generator bridges. | `REMOVE_BEFORE_PUBLIC` | YES (Prior to Public Release) |
| `TREE-003` | `STATE.md`, `ORCHESTRATOR.md` | `TREE_PRIVATE_RESIDUE` | MEDIUM | HIGH | Internal orchestration records referencing private repositories (`MandalaStacks`, `WinMedia`, `cognitive-os`, `Docman`). | `REMOVE_BEFORE_PUBLIC` | YES (Prior to Public Release) |
| `TREE-004` | `codex-summaries/cog/**` | `TREE_PRIVATE_RESIDUE` | LOW | HIGH | Internal HDCP summary logs containing local machine paths and internal development notes. | `MOVE_TO_PRIVATE_REPO` | YES (Prior to Public Release) |
| `TREE-005` | `docs/awb-integration/**`, `docs/reports/**`, `docs/hdcp-renderer-pilot/**` | `TREE_PRIVATE_RESIDUE` | LOW | HIGH | Internal integration reports, pilot logs, and absolute paths to local user directories. | `REMOVE_BEFORE_PUBLIC` | YES (Prior to Public Release) |
| `TREE-006` | `docs/README.md`, `packages/cog-core/examples/README.md` | `TREE_PRIVATE_RESIDUE` | LOW | HIGH | Hardcoded local user filesystem links in documentation. | `REDACT` | NO (Cosmetic path fix) |
| `TREE-007` | `packages/cog-core/src/**` (Core, Stdlib, Tools, Domains) | `TREE_PUBLIC_SAFE` | NONE | HIGH | Fully sanitized, ontology-agnostic kernel, stdlib, CLI, LSP, and domain libraries. | `KEEP` | NO |
| `TREE-008` | `packages/cog-adapter-mom`, `packages/cog-adapter-decision` | `TREE_PUBLIC_SAFE` | NONE | HIGH | Clean standalone reference companion adapters. | `KEEP` | NO |

---

### 2.2. Git History Findings

| Finding ID | Historical Target / Commit Range | Exposure Type | Severity | Confidence | Evidence | Disposition | Publication Blocker |
|---|---|---|---|---|---|---|---|
| `HIST-001` | Commits prior to `3a3eee7`: `packages/book-assistant/**` | `HISTORY_PRIVATE_RESIDUE` | MEDIUM | HIGH | Historical commits retain full source and test suites for Book Assistant before detachment. Contains zero credentials. | `REWRITE_HISTORY` | YES (If full repo made public) |
| `HIST-002` | Commits prior to `3a3eee7`: `packages/cognitive-workspace/**` | `HISTORY_PRIVATE_RESIDUE` | MEDIUM | HIGH | Historical commits retain full source and test suites for Cognitive Workspace before detachment. Contains zero credentials. | `REWRITE_HISTORY` | YES (If full repo made public) |
| `HIST-003` | Commits prior to `3a3eee7`: `artifacts/book-assistant/**` | `HISTORY_PRIVATE_RESIDUE` | MEDIUM | HIGH | Historical book conception artifacts and drafting schemas. Contains zero credentials. | `REWRITE_HISTORY` | YES (If full repo made public) |
| `HIST-004` | Entire commit log (704 commits): Secret Scan | `HISTORY_PUBLIC_SAFE` | NONE | HIGH | Automated scanning for private keys, tokens, passwords, `.env` files yielded 0 secret exposures. | `NO_ACTION` | NO |
| `HIST-005` | Entire commit log (704 commits): Binary/DB Scan | `HISTORY_PUBLIC_SAFE` | NONE | HIGH | Scanned for `.sqlite`, `.db`, `.zip`, `.tgz`, `.pem`, `.key`. 0 binary database/archive files discovered. | `NO_ACTION` | NO |

---

## 3. Publication Blocker Register

Before `cog` can be converted to a public open-source repository, the following blockers must be addressed:

| Blocker ID | Description | Remediation Strategy | Required Authorization |
|---|---|---|---|
| `BLOCK-001` | Proprietary `integration/` and `src/product/` modules remain in tree | Delete `packages/cog-core/src/integration` and consolidate root `src/` prior to public release. | Public API Sanitation / Cleanup HDCP |
| `BLOCK-002` | Internal orchestration docs (`STATE.md`, `ORCHESTRATOR.md`, `codex-summaries/`) | Transfer internal summaries to private operational store; replace `STATE.md` with public roadmap. | Repository Documentation Cleanup HDCP |
| `BLOCK-003` | Historical private application code in Git history | Option A: Export a clean `release/v0.1.0` branch / repository with squashed initial commit for public release.<br>Option B: Use `git-filter-repo` to excise historical `packages/book-assistant` and `packages/cognitive-workspace` paths. | History Rewrite / Public Branch Authorization |
| `BLOCK-004` | Local user filesystem path links in documentation | Normalize all absolute markdown links to relative repository paths. | Documentation Sanitation HDCP |

---

## 4. Overall Determinations

```text
Current Tree Determination: COG_CURRENT_TREE_SANITATION_REQUIRED
History Determination:      COG_HISTORY_REWRITE_RECOMMENDED
Overall Determination:      COG_PRIVATE_RESIDUE_SANITATION_REQUIRED
```
