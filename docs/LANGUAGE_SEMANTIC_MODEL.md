# Cog Language Semantic Model

This document defines the formal semantic model of the Cog language. A `.cog` program does not specify an operational sequence of actions; instead, it defines a **declarative semantic graph** and the execution constraints, views, and transformations that operate upon it.

## 1. The Semantic Graph Model

The evaluation of a `.cog` program yields a directed semantic graph $G = (V, E)$ where:
- **Vertices ($V$)**: Represent **Entities**. Each entity has a unique identifier, an entity kind (ontology type), an optional level, and a set of key-value attributes.
- **Edges ($E$)**: Represent **Relations**. Each edge is directed from a source entity to a target entity, has a relation kind, and carries optional attributes.

Entities and relations represent the baseline state of knowledge before transformations or resolutions are applied.

## 2. Compilation and Intermediate Representation (`CoreIR`)

A `.cog` program undergoes compilation from an Abstract Syntax Tree (AST) to a structured Intermediate Representation (`CoreIR`).

The `CoreIR` represents the complete blueprint for a cognition step, containing:
1. **Entities and Relations**: The static vertices and edges of the graph.
2. **Views**: Contextual slices defined on entities.
3. **Resolutions**: Instructions for binding entities to levels or values.
4. **Transformations**: Declared source-to-target entity mappings.
5. **Constraints**: Invariant rules asserted over the final graph.
6. **Emissions**: Intentions to output specific entity states.

## 3. Execution Semantics

The execution of a compiled `CoreIR` follows a strict, non-looping, feed-forward pipeline:

```
[CoreIR] ➔ [Plan] ➔ [Validation] ➔ [Execution] ➔ [Trace & Emissions]
```

### A. Planning Phase (`planCog`)
The planner analyzes the dependencies in the `CoreIR` and produces a sequence of execution steps. Each step belongs to one of the following phases:
1. **`bind`**: Binds references and computes initial states.
2. **`transform`**: Executes declared mappings to derive new entities or attributes.
3. **`validate`**: Enforces that all structural constraints and adapter rules are satisfied.
4. **`emit`**: Projects finalized results to the domain adapter.

### B. Validation Phase (`validateCog`)
Validation is a first-class phase that runs both before planning (to ensure the IR is structurally sound) and during execution (to enforce constraints).
- **Structural Validation**: Checks that all referenced relation sources, targets, views, and transformations exist.
- **Constraint Validation**: Evaluates user-defined rules. If a constraint is violated, validation fails, halting execution.

### C. Execution Phase (`executeCog`)
Execution processes the plan steps in-memory:
- It maintains a runtime context and memory map.
- It applies adapter hooks (e.g. `mapLevel`, `mapViewKind`, `mapEmission`) to enrich the output.
- It returns an execution result containing a success flag, list of issues, emissions, and a complete trace.

## 4. Relations and Perspectives

- **Relation Semantics**: Relations assert that two entities are linked. The domain adapter interprets what this link means (e.g., in a MoM context, a relation might mean a security dependency; in a Decision context, a dependency constraint).
- **Perspective Semantics**: A `view` statement describes how an entity appears under a specific perspective (`as <perspective_id>`). At runtime, the active adapter maps the view's perspective identifier to a domain-specific view kind (via `mapViewKind`), altering how attributes are evaluated.

## 5. Transformations and Resolutions

- **Transform Semantics**: Transformations define explicit mappings between entity structures. They translate or enrich data across schemas. All transformation mappings must be statically checkable.
- **Resolve Semantics**: Resolutions bind entity levels or properties. Levels (e.g. `L1`, `L2`) represent abstract degrees of importance, criticality, or depth. The adapter maps these to domain-specific levels (via `mapLevel`).

## 6. Constraints and Emissions

- **Constraint Semantics**: A constraint asserts an invariant over the state of the graph. If the constraint expression evaluates to false, the program is invalid.
- **Emission Semantics**: Emissions represent the final outputs of a cognition step. When an entity is emitted, its state is projected through the active adapter's `mapEmission` hook, producing a domain-specific payload.
