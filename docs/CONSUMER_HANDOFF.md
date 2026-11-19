# Downstream Consumer Handoff Guide

This guide describes how downstream repositories and consumer applications should consume domain libraries, pipelines, and the core runtime exported by the `@winmedia/cog-core` package.

---

## 1. Package Exports & Import Patterns

All core compiler machinery, standard library functions, domain libraries, composition helper functions, and the registry are exported directly from the `@winmedia/cog-core` npm package:

```typescript
import {
  // Compiler Pipeline
  lex,
  parseCog,
  compileCog,
  validateCog,
  planCog,
  executeCog,

  // Domain Library Registry
  domainRegistry,

  // Domain Libraries
  researchLibrary,
  editorialLibrary,
  decisionLibrary,
  auditLibrary,
  graphLibrary,

  // Compositions & Pipelines
  composeResearchToEditorial,
  composeAuditToDecision,
  composeGraphToResearch,
  researchToBookPipeline
} from "@winmedia/cog-core";
```

---

## 2. Using the Domain Registry

The `domainRegistry` provides a central lookup for all available domain libraries:

```typescript
// Query library by its unique domain ID
const research = domainRegistry.get("cog:domain:research");

if (research) {
  console.log(`Loaded ${research.name} library`);
}
```

---

## 3. Domain Library Generation Patterns

Each domain library exposes a `.generate(params)` method to generate compile-ready `.cog` source code. Here are the expected parameters and schema contracts:

### A. Research Synthesis (`cog:domain:research`)
- **Parameters**: `sources`, `claims` (with `sourceId`), `clusterId`, `clusterValue`, `resolutionId`, `resolutionValue`.
- **Output**: Source code mapping raw source evidence to grouped thematic claims and synthesized resolutions.

### B. Editorial Review (`cog:domain:editorial`)
- **Parameters**: `draftId`, `draftValue`, `goldenId`, `goldenValue`, `driftId`, `actionId`, `explanationId`, `explanationValue`.
- **Output**: Source code checking draft entities against golden reference targets, identifying drift, mapping actions, and emitting justification.

### C. Decision Analysis (`cog:domain:decision`)
- **Parameters**: `metricId`, `metricValue`, `optionId`, `optionValue`, `decisionId`, `decisionValue`, `threshold`.
- **Output**: Source code comparing option metrics against numeric thresholds to resolve gate decisions.

### D. Audit Reasoning (`cog:domain:audit`)
- **Parameters**: `repoRootId`, `repoRootVal`, `findings` (list of findings), `severityId`, `severityVal`.
- **Output**: Source code checking workspace root observations for violations, mapping dependency chains, and resolving severity levels.

### E. Knowledge Graph (`cog:domain:graph`)
- **Parameters**: `sensorId`, `sensorVal`, `profiles` (list of user/host profiles), `clusterId`, `clusterVal`, `explanationId`, `explanationVal`.
- **Output**: Source code modeling correlated activity networks and causal security explanation nodes.

---

## 4. Compilation, Planning, and Execution Pipeline

Downstream consumers must follow the deterministic pipeline execution order:

`PARSE (LEX + PARSE) → COMPILE → PLAN → VALIDATE → EXECUTE`

### Canonical Consumption Example

```typescript
import { lex, parseCog, compileCog, validateCog, planCog, executeCog } from "@winmedia/cog-core";
import { momAdapter } from "@winmedia/cog-adapter-mom";

const source = `
  define entity "my-node" {
    kind: record
    level: L3
  }
  emit {
    target: "my-node"
    kind: detail
  }
`;

// 1. Compile
const ir = compileCog(parseCog(lex(source)));

// 2. Validate (incorporating domain adapter validation if present)
const validation = await validateCog(ir, {
  context: { runId: "run-1", mode: "batch", startedAt: new Date().toISOString() },
  adapter: momAdapter
});

if (!validation.valid) {
  throw new Error(`Validation failed: ${JSON.stringify(validation.issues)}`);
}

// 3. Plan
const plan = await planCog(ir, {
  context: { runId: "run-1", mode: "batch", startedAt: new Date().toISOString() },
  adapter: momAdapter
});

// 4. Execute
const result = await executeCog(ir, {
  runId: "run-1",
  mode: "batch",
  startedAt: new Date().toISOString()
}, momAdapter);

console.log("Success:", result.success);
console.log("Emissions:", result.emissions);
console.log("Trace steps:", result.trace.steps);
```

---

## 5. Adapter & Kernel Boundaries

- **Ontology-Agnostic Core**: The core kernel (`@winmedia/cog-core`) is domain-neutral and knows nothing of MoM, audit, or decision taxonomies.
- **Adapter Projections**: Adapters (e.g., `momAdapter`, `decisionAdapter`) map neutral IR values (like `L1-L5` or generic `relate` kinds) to domain-specific terms (like `R1-R5` or specific dependency links) only during validation, planning, execution, and emission.
- **Neutral Fallback**: When running without an adapter, the compiler and executor fallback to default, identity-neutral mapping.

---

## 6. Unsupported and Anti-Patterns

1. **No Silent/Implicit Reasoning**: Avoid attempting to execute code without checking the validation result. Validation issues contain errors or warnings from both core and active adapters.
2. **Strict Language Constraints**: Do not attempt to write loops, imports, function calls, or complex control flows in `.cog` files. The language is flat, declarative, and structural.
3. **No Direct IR Mutation**: Consumers must not mutate compiled `CoreIR` objects directly. All domain variations should be handled cleanly via adapter hooks (`mapLevel`, `mapRelationKind`, `mapViewKind`, `enrichPlan`, etc.).
