# CogLib Architectural Boundary Specification

## 1. Canonical Layer Architecture

The cognitive computing stack in the `cog` ecosystem is structured into five canonical layers with strict separation of concerns and unambiguous dependency directions:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 5: Applications & Consumer Surfaces                               │
│ (Reader CLI, Tutor, Interactive UX, Application Policy, Session Loops)  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ consumes / orchestrates
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Tools & Memory Substrates                                      │
│ (SQLite Adapters, Snapshot Stores, Workspace Query Engine, File I/O)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ supports / materializes
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Domain Libraries & Machine Editions (MEs)                      │
│ (Domain Ontologies, SROW, MoM, Music, Scientific Claims, Software Arch) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ specializes
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2: CogLib (Universal Cognitive Standard Library)                  │
│ (Domain-Agnostic Cognitive Routines, Composition Rules, Epistemics)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ builds upon
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Cog Kernel (@winmedia/cog-core)                                         │
│ (Language AST, CoreIR, Deterministic Pipeline, Structural Invariants)  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer Definitions and Responsibilities

### Layer 1: Cog Kernel (`@winmedia/cog-core`)
- **Responsibility**: Provides the core `.cog` language grammar, AST representation, neutral CoreIR, deterministic execution pipeline (`COMPILE → PLAN → VALIDATE → EXECUTE → EMIT → TRACE`), and structural invariant validation.
- **Epistemic Stance**: Purely ontology-agnostic, side-effect-free, and deterministic.
- **Dependencies**: Zero internal domain dependencies; Node standard library / minimal foundational utilities only.

### Layer 2: CogLib (Universal Cognitive Standard Library)
- **Responsibility**: Provides universal, domain-agnostic cognitive routines (e.g. hypothesis testing, tension reconciliation, perspective synthesis, concept evolution, epistemic provenance tracing) and composition operators.
- **Epistemic Stance**: Operates over abstract cognitive entities, relations, perspectives, tensions, and provenance traces without binding to any specific subject domain.
- **Permitted Dependencies**: Cog Kernel (`@winmedia/cog-core`) ONLY.
- **Prohibited Dependencies**: Domain libraries, Machine Editions, persistence/database drivers, network/API clients, or application shells.

### Layer 3: Domain Libraries & Machine Editions (MEs)
- **Responsibility**: Encodes domain-specific vocabularies, ontologies, concept schemas, structural hierarchies, and domain reasoning adapters (e.g., SROW edition schemas, MoM decision trees, music harmonic theory schemas, scientific falsification structures, software architecture tradeoff models).
- **Epistemic Stance**: Domain-bound semantics. Specializes generic cognitive routines into domain workflows.
- **Permitted Dependencies**: Cog Kernel, CogLib.

### Layer 4: Tools & Memory Substrates
- **Responsibility**: Provides durable storage (SQLite, snapshot stores, content-addressable history), workspace retrieval, indexing, vector/semantic search bridges, and tool execution wrappers.
- **Epistemic Stance**: Substrate for persistence, indexing, and I/O execution.
- **Permitted Dependencies**: Kernel data structures, domain IR schemas.

### Layer 5: Applications & Consumer Surfaces
- **Responsibility**: End-user interfaces, CLI shells, tutoring engines, product workflows, user interaction sessions, and policy governance.
- **Epistemic Stance**: Application and experience-level orchestration.
- **Permitted Dependencies**: Layers 1 through 4 as needed for product delivery.

---

## 3. Authority Direction and Dependency Rules

1. **Strict Downward Dependency**: Higher layers may depend on lower layers; lower layers MUST NEVER import, reference, or assume behavior from higher layers.
2. **Authority Direction**: Cognitive validity and invariant enforcement flow downward. The Kernel validates structural soundness; CogLib validates cognitive routine semantics; Domain Libraries validate ontological conformance; Tools handle physical storage; Applications manage user interaction.
3. **No Layer Skipping for Cognitive Semantics**: Domain reasoning should compose universal CogLib routines rather than inventing bespoke core language extensions.

---

## 4. Explicit Exclusions and Anti-Absorption Boundaries for CogLib

To preserve CogLib as a reusable, universal cognitive standard library, CogLib is explicitly forbidden from absorbing:

| Category | Prohibited In CogLib | Canonical Home |
| :--- | :--- | :--- |
| **Kernel Primitives** | AST nodes, CoreIR evaluation instructions, language grammar | Layer 1 (`@winmedia/cog-core`) |
| **Domain Knowledge** | Music scales, scientific taxonomies, code syntax trees, SROW concepts | Layer 3 (Domain Libraries / MEs) |
| **Application Policy** | User session state machines, CLI prompts, formatting rules, pricing | Layer 5 (Applications) |
| **Tool Integrations** | LLM API clients, HTTP fetchers, process execution, bash commands | Layer 4 (Tools) / Layer 5 |
| **Memory Contents** | SQLite tables, serialized document blobs, cache storage | Layer 4 (Memory / Storage) |
| **ME-Specific Semantics** | Machine Edition manifest parsing, edition factory rules | Layer 3 (Machine Editions) |

---

## 5. Architectural Ratification Determination

`COGLIB_ARCHITECTURE_BOUNDARY_RATIFIED`
- All boundaries, responsibilities, permitted dependencies, authority directions, and anti-absorption invariants are ratified and binding across the `cog` repository.
