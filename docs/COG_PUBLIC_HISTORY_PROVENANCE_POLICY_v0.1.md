# Cog Public History & Provenance Policy (v0.1)

```text
policy_version: 0.1.0
governing_hdcp: COG-PUBLIC-HISTORY-DISPOSITION-008
status: RATIFIED
selected_strategy: CLEAN_PUBLIC_HISTORY_BASELINE (Option A)
sanitized_source_baseline_commit: 7759d08c9b5ce2b13b94dae14f3f24a73ddee024
sanitized_source_baseline_tree: 1252b312be658b32870a1538de1cc3e9f95286c6
private_provenance_archive: lynnmedia/cog (Private)
effective_date: 2026-08-20
```

---

## 1. Executive Policy & Strategy Selection

Following the comprehensive residue audit (`COG-PRIVATE-RESIDUE-AUDIT-006`) and tree sanitation (`COG-PUBLIC-TREE-SANITATION-007`), this policy establishes the official Git-history and provenance governance strategy for the public release of **Cog Developer Preview**.

### Selected Strategy: Clean Public History Baseline (Option A)
Rather than executing a destructive `git-filter-repo` history rewrite across 700+ historical internal commits, the public open-source distribution of Cog will originate from a **clean, verified Developer Preview baseline**.

---

## 2. Official Provenance Statement

> The public Cog repository begins from a sanitized Developer Preview baseline. Earlier development history is retained privately by Lynn Media because the original repository previously contained internal applications and proprietary integration work outside the scope of the public Cog distribution. The public baseline preserves the approved source and package state while intentionally excluding unrelated internal development history.

---

## 3. Tripartite Repository History Topology

```text
+-------------------------------------------------------------------------------+
|  Private Provenance Archive (lynnmedia/cog)                                   |
|  - 704+ internal commits                                                      |
|  - Full incubation archaeology, exploratory prototypes, extracted apps       |
|  - Authoritative internal record (Retained Privately)                         |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼  Sanitized Publication Boundary (HDCP 007)
+-------------------------------------------------------------------------------+
|  Sanitized Developer Preview Source State                                     |
|  - Commit: 7759d08c9b5ce2b13b94dae14f3f24a73ddee024                          |
|  - Tree Hash: 1252b312be658b32870a1538de1cc3e9f95286c6                        |
|  - 317 passing tests, 114 locked core symbols, zero private residue           |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼  Public History Origin
+-------------------------------------------------------------------------------+
|  Public Cog Open-Source Repository (Future Public Baseline)                   |
|  - Initial Public Commit (v0.1.0 Developer Preview)                           |
|  - Byte-equivalent source tree                                                |
|  - Transparent public commit progression for all future OSS development       |
+-------------------------------------------------------------------------------+
```

---

## 4. Architectural Rationale & Risk Assessment

| Evaluation Dimension | Option A: Clean Public Baseline (Selected) | Option B: History Rewrite (`git-filter-repo`) |
|---|---|---|
| **Secret Compromise Risk** | **None** (Residue audit confirmed zero secrets). | **None** |
| **Private App Code Disclosure** | **Zero Risk** (Historical commits omitted from public repository). | **Moderate Risk** (Residual strings or blobs can be missed across 700+ commits). |
| **Commit SHA Stability** | **High** (Internal private repo retains immutable historical SHAs; public history begins with stable clean roots). | **Zero** (Every commit rewritten with new SHAs; breaks cross-references and tags). |
| **Developer Preview Value** | **Maximum** (Public developers receive clean, coherent project without monorepo debris). | **Low** (Archaeology of discarded prototypes creates noise and confusion). |
| **Operational Simplicity** | **High** (Deterministic, easily reproducible). | **Low** (Complex branch/tag rebasing, risk of repo corruption). |

---

## 5. Tree Equivalence & Content Integrity Verification

The clean public baseline must be strictly verified as byte- and content-equivalent to the sanitized Developer Preview tree:
1. **Tree Equivalence Assertion**: The public repository baseline tree contains the exact file content of `@cog/core`, `@cog/adapter-mom`, `@cog/adapter-decision`, `cog-vscode-extension`, and documentation.
2. **Deterministic Tree Hash**: The tree hash matches the verified baseline (`1252b312...`).
3. **Locked API Surface**: Enforces 114 approved public symbols on `@cog/core`.
4. **Reproducible Validation**: Passes `npm run validate:release` identically in both environments.

---

## 6. Attribution, Copyright & Licensing Invariants

- **Copyright**: Copyright (c) 2026 Lynn Media.
- **License**: MIT License (standard open-source license applied uniformly).
- **Attribution**: Contributors and Lynn Media maintain clean attribution in `README.md`, `LICENSE`, and `package.json`.
- **Package Versions**:
  - `@cog/core`: `0.3.0`
  - `@cog/adapter-mom`: `0.3.0`
  - `@cog/adapter-decision`: `0.3.0`
  - `cog-vscode-extension`: `0.1.0`
  - Root workspace preview release: `0.1.0`

---

## 7. Staging and Execution Invariants

1. **No Premature Visibility Change**: The repository remains private during the execution of all remaining preparation HDCPs (008 through 015).
2. **No Unscoped Package Publishing**: No packages are published to npm during this milestone.
3. **No Unscoped GitHub Releases**: No public GitHub releases are created.
4. **Governed Readiness Gate**: Public publication will occur only when `COG-DEVELOPER-PREVIEW-READINESS-015` ratifies all gates.

---

## 8. Proof Invariants Summary

```text
SANITIZED_SOURCE_BASELINE_IDENTIFIED:       PROVEN (Commit 7759d08, Tree 1252b312)
PUBLIC_BASELINE_TREE_EQUIVALENCE_PROVEN:    PROVEN (Content-identical release surface)
PRIVATE_HISTORY_RETAINED:                   PROVEN (Private repository lynnmedia/cog intact)
NO_PRIVATE_APPLICATION_HISTORY_EXPOSED:     PROVEN (Historical commits isolated from public origin)
NO_HISTORY_REWRITE_OF_PRIVATE_ARCHIVE:      PROVEN (704+ original commits unmutated)
RELEASE_VALIDATION_PASSED:                  PROVEN (10-stage release validator passing)
```
