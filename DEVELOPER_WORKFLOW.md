# DEVELOPER_WORKFLOW.md

## Purpose
This document establishes the Cog Developer Workflow, outlining execution rules, validation tiers, and summary conventions for coding agents operating within the `cog` repository.

## Execution Rules
- **Approved Pilot Executions**: Rendered `INSPECTION` and `NARROW_EXECUTOR` pilots are permitted only with explicit human approval.
- **Unapproved Executions**: `GOVERNED_EXECUTOR` execution remains strictly unapproved.
- **Strict Execution Restrictions**: There must be no deployment, external API calls, production mutation, queue advancement, or worker dispatch.
- **Branch Strategy**: The target branch for all development work is `main`.

## Code & Integration Boundaries
- **Legacy Root Code**: Legacy root code may overlap with `v0.3` package definitions in future tasks.
- **Debt Control**: Existing lint/build/test debt must not be worsened under any circumstances.

## Validation Protocol
All changes must be validated against the repo validation commands before staging/commit:
1. Root build and test checks.
2. `v0.3` package checks.

Specifically, run:
```bash
npm run build
npm test
npm run build:v0.3
npm run test:v0.3
git diff --check
git status --short
```

## Summary and Artifact Conventions
- **Summary Location**: Summary artifacts must be written to:
  `codex-summaries/cog/<HDCP_ID>.summary.md`
- **Placeholder Rule**: Use the placeholder `Commit SHA: FINAL_COMMIT_SHA_REPORTED_IN_CHAT` in the summary markdown before committing.
