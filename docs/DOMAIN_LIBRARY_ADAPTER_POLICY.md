# Domain Library Adapter Policy

This document defines the governance policy for how Cog domain libraries interact with domain adapters (e.g. MoM, Decision, AWB) while preserving core kernel neutrality.

---

## 1. Core Principles

1. **Kernel Neutrality**: The core parser, compiler, planner, and runtime must remain completely free of adapter-specific code or logic.
2. **Loosely Coupled Specialization**: Domain libraries define generic/neutral cognitive patterns. Adapters enrich these patterns at runtime, but must never redefine program semantics.
3. **No Direct Dependency**: A domain library must never import or depend directly on an adapter implementation.

---

## 2. Allowed Adapter Operations

Domain libraries may leverage the following adapter hooks defined in `CogDomainAdapter`:

1. **Kind Mapping**: Map generic entity kinds (e.g. `observation`, `alternative`) to adapter namespaces (e.g. `mom:observation`, `decision:alternative`).
2. **Plan Enrichment**: Add custom verification or post-processing steps during the planning phase (`enrichPlan`).
3. **Emission Mapping**: Specialize the output format when emitting payloads.
4. **Trace Projection**: Projects standard runtime execution traces into domain-specific structures.

---

## 3. Kernel-Neutral Boundaries

The following core elements must always remain kernel-neutral and must never be altered by adapters:
- **EBNF Grammar & AST**: The syntax and language tokens of `.cog`.
- **Core IR**: The basic structural shapes (`CoreEntity`, `CoreRelation`, etc.).
- **Planner Execution Phases**: The linear execution phases (`bind` -> `transform` -> `validate` -> `emit`).
- **Standard Library Primitives**: Functions exported by `stdlib/stdlib.ts`.

---

## 4. Validation & Conformance Testing

To ensure compliance with this policy:
1. Every adapter-dependent library feature must have a corresponding test suite utilizing the neutral kernel baseline.
2. Tests must execute the domain library *with* and *without* the active adapter to verify that:
   - Without the adapter: The program executes successfully using core defaults.
   - With the adapter: Mapped kinds are correctly namespaced, and enriched steps are successfully planned/executed.
