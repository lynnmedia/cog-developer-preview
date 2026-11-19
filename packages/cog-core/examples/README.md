# Cog Domain Library Examples

This directory contains canonical runnable examples for each implemented domain library in the `cog` repository.

## Runnable Application Examples

Each example demonstrates the consumption and declarative patterns of a specific domain library. They can be compiled, validated, planned, and executed using the `@cog/core` runtime.

1. **Research Synthesis** (`cog:domain:research`)
   - **File**: [`applications/canonical-research-synthesis.cog`](./applications/canonical-research-synthesis.cog)
   - **Purpose**: Demonstrates claim extraction, clustering, and resolution patterns.

2. **Editorial Review** (`cog:domain:editorial`)
   - **File**: [`applications/canonical-document-review.cog`](./applications/canonical-document-review.cog)
   - **Purpose**: Demonstrates drift detection, reconciliation action, and editorial explanation.

3. **Decision Analysis** (`cog:domain:decision`)
   - **File**: [`applications/canonical-decision-workflow.cog`](./applications/canonical-decision-workflow.cog)
   - **Purpose**: Demonstrates option alternative evaluation, metric constraint, and decision resolution.

4. **Audit Reasoning** (`cog:domain:audit`)
   - **File**: [`applications/canonical-audit-workflow.cog`](./applications/canonical-audit-workflow.cog)
   - **Purpose**: Demonstrates policy finding identification, dependency mapping, and severity resolution.

5. **Knowledge Graph** (`cog:domain:graph`)
   - **File**: [`applications/canonical-knowledge-graph.cog`](./applications/canonical-knowledge-graph.cog)
   - **Purpose**: Demonstrates node/profile identification, graph clustering, and correlation explanation.

---

## Validation & Execution

These examples are verified in the test suite to ensure they validate, plan, and execute deterministically.

To run the example validations:
```bash
npm run test:v0.3
```
or run the canonical test file directly:
```bash
npx tsx --test packages/cog-core/src/tests/canonicalExamples.test.ts
```
