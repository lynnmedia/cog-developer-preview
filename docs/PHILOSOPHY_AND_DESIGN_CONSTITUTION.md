# Cog Philosophy and Design Constitution

## 1. Why Cognition-First Programming?

Traditional programming languages (like Python, TypeScript, or Go) are **action-oriented**. They model computation as a sequential series of instructions, state updates, and side effects designed to *do* things. 

In contrast, **cognition-first programming** models the *structure of understanding*. It does not describe how to execute actions; instead, it declares:
- What entities exist in the current mental model.
- How they relate to one another (Relations).
- How they are perceived under different contexts (Perspectives).
- The rules that restrict or shape their validity (Constraints).
- The transition paths between states of knowledge (Transformations).

Cognition-first programming treats execution as a deterministic traversal of a structured semantic graph, planning out observations, resolutions, and emissions.

## 2. Core Primitives

Cog defines a minimal set of primitives for modeling cognition:

### A. Relations
Relations define semantic edges between entity nodes. Rather than active pointers, they represent declarative truth about associations (e.g., entity `A` relates to `B` via relation kind `C`). Relations can be mapped or interpreted differently depending on the active domain adapter.

### B. Perspectives (Views)
A view represents a contextual slice or perspective on an entity. An entity is not a static object; its significance changes depending on who or what is observing it. Perspectives map generic entities into contextually-legible shapes.

### C. Transformations
Transformations declare the mapping of entities and relations from one state or ontology to another. They represent reasoning steps or translations. All transformations must be declared explicitly in the intermediate representation (IR); there are no hidden or silent inferences.

### D. Constraints
Constraints enforce logical and structural invariants over the semantic graph. They act as boundaries for safe execution. If a constraint is violated, validation fails immediately, preventing execution of unsafe paths.

### E. Observations
Observations are inputs from the external environment (or prior execution states) projected into the kernel's intermediate representation.

### F. Resolutions
Resolutions bind entities, attributes, and relationships to specific values, levels, or external references. They materialize abstract relationships into concrete bindings.

## 3. Permanent Invariants

The `cog` kernel is governed by several unalterable invariants:
1. **Core Ontology Agnosticism**: The core kernel (`@cog/core`) does not know about any specific domain (like MoM or AWB). It is entirely generic. All domain-specific semantics are injected downstream via adapters.
2. **Structural Determinism**: The execution pipeline is deterministic: `COMPILE → PLAN → VALIDATE → EXECUTE → EMIT → TRACE`. Given the same input and adapter, the pipeline will always produce the same structural execution path and trace.
3. **Trace Mandatory**: Every execution must output a complete trace showing every step, binding, and emission. There is no hidden computation.

## 4. Intentional Exclusions

To prevent the language from bloating into a general-purpose utility language, the following features are intentionally excluded:
- **Control Flow**: No loops (`for`, `while`) or conditional branches (`if`/`else`).
- **Mutability**: Variables cannot be reassigned. The execution path builds a new trace rather than modifying state in place.
- **IO / Side Effects in Core**: The core kernel is completely free of filesystem, shell, network, or external API execution.
