<!-- cog-doc-conformance -->
# Level 1 — Language & Cognitive Patterns

This is the first structured learning level after [`START_HERE.md`](./START_HERE.md).

Level 1 teaches two things together:

1. the small `.cog` language surface; and
2. ten recurring cognitive patterns represented with that surface.

The examples in this guide are the existing canonical primitive programs from `packages/cog-core/examples/primitives/`. They are not tutorial-only pseudocode. Their repository tests compile, validate, execute, and inspect their resulting CoreIR, emissions, and traces.

## The rule for reading Level 1

Cog represents governed cognitive structure. Do not read an attribute such as:

```text
operation: compare
```

as an instruction for the base kernel to invent a comparison algorithm.

Instead, distinguish three things:

```text
cognitive intent
      ↓
explicit Cog representation
      ↓
kernel compilation / validation / planning / execution
```

A higher layer—CogLib, a domain library, an adapter, a tool, or an application—may implement an actual cognitive algorithm. The base language and kernel preserve the structure that algorithm can consume, produce, govern, and trace.

## The seven statement families

You will encounter all seven Developer Preview statement families across the ten patterns:

| Statement | Structural role |
| --- | --- |
| `define entity` | Declare an addressable semantic object and its attributes. |
| `relate` | Declare a typed directed relationship between two entities. |
| `view` | Declare a perspective or projection on an entity. |
| `resolve` | Declare a target resolution level. |
| `transform` | Declare transformation intent for an explicit target. |
| `constrain` | Attach a governed constraint to an explicit target. |
| `emit` | Declare an output target and emission kind. |

The language remains intentionally small. Level 1 does not introduce loops, user-defined functions, imports, macros, or implicit cognitive inference.

## The ten-pattern learning sequence

| # | Pattern | Primary language idea | What becomes explicit |
| ---: | --- | --- | --- |
| 1 | Observation | `define entity` | A represented observation and its attributes |
| 2 | Identification | `define entity` | An explicit identity/signature representation |
| 3 | Comparison | `relate` | A declared difference between represented states |
| 4 | Classification | `relate` | A declared source-to-category result |
| 5 | Relation | `relate` | A typed semantic edge |
| 6 | Projection | `view` | A perspective over an entity |
| 7 | Resolution | `resolve` | A declared resolution level |
| 8 | Constraint | `constrain` | A governed rule attached to a target |
| 9 | Transformation | `transform` | Transformation intent plus represented before/after state |
| 10 | Emission | `emit` | An explicit output boundary |

Each lesson follows the same questions:

- What cognitive pattern is being represented?
- Which Cog structure represents it?
- What does the kernel actually prove or preserve?
- What does the kernel **not** infer automatically?
- What does this pattern compose with next?

---

# 1. Observation

## Cognitive purpose

Observation makes a piece of represented evidence addressable. Instead of leaving a fact buried in an opaque string or application variable, the program gives it a semantic identity, kind, level, and explicit attributes.

The canonical fixture is `canonical-observation.cog`:

```cog
define entity "observed-signal" {
  kind: observation
  level: L1
  operation: observe
  attribute: "ambient-light"
  value: "present"
  confidence: 1
}

emit {
  target: "observed-signal"
  kind: observation
}
```

## What the language expresses

`define entity` creates the semantic object. Its fields preserve the represented observation:

```text
name       observed-signal
kind       observation
level      L1
attribute  ambient-light
value      present
confidence 1
```

`emit` makes the observation an explicit output target.

## What the kernel does

The canonical test proves that Cog compiles the entity with its attributes intact, validates the program, executes successfully, and emits the targeted observation.

## What the kernel does not do

`operation: observe` does not cause the kernel to operate a sensor or discover ambient light. The observation is already represented in the source. A sensor adapter, tool, application, or other producer would be responsible for obtaining real-world input.

## Composition

Observation is the usual starting point for identification, comparison, classification, constraint evaluation, and later resolution.

### Try it

Create `observation.cog`, validate it, then run it:

```bash
npx --no-install cog validate observation.cog
npx --no-install cog run observation.cog
```

Change `value: "present"` to `value: "absent"` and repeat the authoring loop.

---

# 2. Identification

## Cognitive purpose

Identification gives an observed or candidate object an explicit identity representation. The important move is not hidden recognition; it is making the identity evidence and signature inspectable.

The canonical fixture is `canonical-identification.cog`:

```cog
define entity "identity-candidate" {
  kind: identity-signature
  level: L1
  operation: identify
  source: "scanner-1"
  value: "present"
  signature: "kind:observation|source:scanner-1|value:present"
  identity: "identity:scanner-1:present"
}

emit {
  target: "identity-candidate"
  kind: identity
}
```

## What the language expresses

The identity candidate carries both the evidence-bearing attributes and the explicit `signature` / `identity` values.

This makes the represented identity inspectable rather than implicit in application code.

## What the kernel does

The canonical test proves deterministic preservation: compiling the same source twice preserves the same explicit signature and identity values, and execution emits the identity candidate.

## What the kernel does not do

The base kernel does not derive the signature from the other fields or decide that two arbitrary objects are identical. In this fixture the signature and identity are already declared. A higher-level identification routine could calculate them and then produce this governed representation.

## Composition

Identification commonly follows observation and precedes relation construction, classification, provenance linking, deduplication, or graph assembly.

---

# 3. Comparison

## Cognitive purpose

Comparison makes a difference between two represented states explicit and typed.

The canonical fixture is `canonical-comparison.cog`:

```cog
define entity "baseline-signal" {
  kind: observation
  level: L1
  value: "present"
}

define entity "current-signal" {
  kind: observation
  level: L1
  value: "absent"
}

relate "current-signal" -> "baseline-signal" {
  kind: differs-from
  operation: compare
  field: "value"
  before: "present"
  after: "absent"
}

emit {
  target: "current-signal"
  kind: comparison
}
```

## What the language expresses

Two states are represented separately. The `relate` statement declares a directed semantic edge:

```text
current-signal --differs-from--> baseline-signal
```

The relation itself carries the comparison metadata: field, before value, and after value.

## What the kernel does

The canonical test proves that the two entities compile, the `differs-from` relation is preserved with its attributes, validation succeeds, and the emitted payload contains that relation structure.

## What the kernel does not do

The base kernel does not compare `present` and `absent` and discover the delta. The fixture **declares** the delta. An implemented comparison routine can perform that computation and emit or construct the same explicit representation.

## Composition

Comparison is the basis for drift detection, change analysis, contradiction mapping, before/after assessment, and decision evidence.

---

# 4. Classification

## Cognitive purpose

Classification represents the result of assigning a source object to a category while preserving the relationship to the source.

The canonical fixture is `canonical-classification.cog`:

```cog
define entity "raw-signal" {
  kind: observation
  level: L1
  source: "scanner-1"
  value: "over-threshold"
}

define entity "classified-signal" {
  kind: incident
  level: L2
  operation: classify
  source: "scanner-1"
  value: "over-threshold"
  preserved-source: "raw-signal"
}

relate "raw-signal" -> "classified-signal" {
  kind: classified-as
  operation: classify
}

emit {
  target: "classified-signal"
  kind: classification
  preserved-source: "raw-signal"
}
```

## What the language expresses

The source and classified result are separate entities. The classified result carries its category (`kind: incident`) and preserves source attributes. A `classified-as` relation makes lineage from source to result explicit.

## What the kernel does

The canonical test proves that both entities remain distinct, source/value attributes are preserved in the represented classified result, the `classified-as` relation exists, and the result is emitted.

## What the kernel does not do

The kernel does not inspect `over-threshold` and decide that the correct category is `incident`. That classification result is explicit in the program. A CogLib or domain classifier can make the decision and produce this structure.

## Composition

Classification often feeds relation graphs, routing, constraint evaluation, grouping, audit findings, and decision workflows.

---

# 5. Relation

## Cognitive purpose

Relation is the core graph-building pattern: make a semantic connection between two addressable entities explicit and typed.

The canonical fixture is `canonical-relation.cog`:

```cog
define entity "sensor" {
  kind: source
  level: L1
}

define entity "reading" {
  kind: observation
  level: L1
  value: "42"
}

relate "sensor" -> "reading" {
  kind: produces
  operation: "relate"
  cardinality: one
}

emit {
  target: "sensor"
  kind: relation-graph
}
```

## What the language expresses

The relation is directed and typed:

```text
sensor --produces--> reading
```

Because both endpoints are explicit entities, the compiler can connect the semantic edge to concrete graph nodes.

## What the kernel does

The canonical test proves deterministic graph construction: source and target entity IDs are linked through a relation node, and the emitted payload carries the `produces` relation.

## What the kernel does not do

The word `produces` does not execute causal inference. It is the declared semantics of the edge. Applications and domain libraries decide how a relation kind should be interpreted.

## Composition

Relations are the connective tissue of Cog. Comparison and classification already use them; larger graphs use them to represent support, blocking, provenance, causality, dependency, recommendation, and other domain-specific semantics.

---

# 6. Projection

## Cognitive purpose

Projection represents a perspective on an entity without replacing the underlying entity.

The canonical fixture is `canonical-projection.cog`:

```cog
define entity "signal-record" {
  kind: observation
  level: L1
  source: "scanner-1"
  value: "present"
  raw: "scanner-1 present at t0"
}

view "signal-record" as reduced {
  operation: project
  include: ["source", "value"]
  exclude: ["raw"]
}

emit {
  target: "signal-record"
  kind: projection
}
```

## What the language expresses

`view` attaches a named perspective—`reduced`—to the existing `signal-record`. The block records the intended projection metadata.

The crucial distinction is:

```text
entity ≠ view of entity
```

A perspective is explicitly represented instead of destructively replacing its source.

## What the kernel does

The canonical test proves that the view targets `signal-record`, preserves the `reduced` view kind and include/exclude metadata, and appears in the emitted view structure.

## What the kernel does not do

The base runtime does not generically rewrite the entity into a new filtered object merely because `include` and `exclude` attributes exist. A view-aware adapter or higher-level capability can interpret those attributes operationally.

## Composition

Projection leads naturally to multi-perspective analysis, audience-specific views, operator vs summary views, decision perspectives, and adapter-specific view mapping.

---

# 7. Resolution

## Cognitive purpose

Resolution declares that an entity should be represented at a particular Cog level.

The canonical fixture is `canonical-resolution.cog`:

```cog
define entity "candidate-decision" {
  kind: decision
  level: L2
  status: "candidate"
}

resolve "candidate-decision" to L3 {
  operation: "resolve"
  reason: "sufficient-evidence"
}

emit {
  target: "candidate-decision"
  kind: resolution
}
```

## What the language expresses

The entity starts with an entity-level attribute of `L2`; the separate `resolve` statement declares an explicit resolution target of `L3` with a reason.

This separation makes resolution intent inspectable rather than burying it inside an application transition.

## What the kernel does

The canonical test proves that a resolution object targets `candidate-decision` with value `L3`, validation succeeds, planning contains the expected binding/validation/emission structure, and execution emits the candidate decision.

## What the kernel does not do

A resolution declaration does not prove that `sufficient-evidence` is true. That reason is represented data. Evidence evaluation belongs to the relevant cognitive routine or domain capability.

## Composition

Resolution commonly follows observations, comparisons, constraints, evidence relationships, and perspective analysis. It often precedes emission or downstream application action.

---

# 8. Constraint

## Cognitive purpose

Constraint makes governance explicit by attaching a rule and its parameters to an addressable target.

The canonical fixture is `canonical-constraint.cog`:

```cog
define entity "candidate-record" {
  kind: observation
  level: L1
  confidence: 0.9
}

constrain {
  target: "candidate-record"
  operation: "constrain"
  rule: "confidence-at-least"
  threshold: 0.8
}

emit {
  target: "candidate-record"
  kind: constraint-validation
}
```

## What the language expresses

The constraint identifies:

```text
target     candidate-record
rule       confidence-at-least
threshold  0.8
```

The target is explicit. Developer Preview material does not rely on implicit constraint targets.

## What the kernel does

The canonical test proves that the constraint compiles against the correct target, preserves the rule and threshold attributes, validates structurally, participates in the validation phase, and allows the program to execute.

## What the kernel does not do

The base validator does not provide a universal interpreter for arbitrary rule strings such as `confidence-at-least`. It validates the governed structure and references. A domain validator, adapter, CogLib routine, or other higher layer must implement rule semantics when actual predicate evaluation is required.

## Composition

Constraints turn represented cognition into governed cognition. They combine with resolution, transformation, decision analysis, audit, planning, and any workflow where an outcome must remain inside explicit boundaries.

---

# 9. Transformation

## Cognitive purpose

Transformation represents a governed change from one semantic state to another while preserving the before/after relationship.

The canonical fixture is `canonical-transformation.cog`:

```cog
define entity "raw-record" {
  kind: observation
  level: L1
  value: "  Present  "
}

define entity "normalized-record" {
  kind: observation
  level: L1
  value: "present"
  transformed-from: "raw-record"
}

transform {
  target: "raw-record"
  to: normalize-value
  operation: "transform"
}

relate "raw-record" -> "normalized-record" {
  kind: transforms-to
  operation: "transform"
}

emit {
  target: "normalized-record"
  kind: transformation
}
```

## What the language expresses

Three things are made distinct:

```text
before state          raw-record
transformation intent normalize-value
after state           normalized-record
```

The `transforms-to` relation preserves lineage between the represented states.

## What the kernel does

The canonical test proves that the before and after entities retain their declared values, the transformation targets `raw-record` with transform reference `normalize-value`, a transform phase appears in execution, the lineage relation exists, and the normalized record is emitted.

## What the kernel does not do

The base kernel does not trim and lowercase `"  Present  "` to derive `"present"`. The after-state is already represented in the fixture. A transformation implementation can perform that algorithm and then produce or update governed Cog structures.

## Composition

Transformation combines naturally with comparison, provenance, constraint validation, normalization pipelines, document reconciliation, migration analysis, and decision preparation.

---

# 10. Emission

## Cognitive purpose

Emission marks an explicit output boundary. A graph can contain many represented entities, relations, views, resolutions, transformations, and constraints; `emit` identifies what leaves the cognitive step as an output.

The canonical fixture is `canonical-emission.cog`:

```cog
define entity "emission-record" {
  kind: record
  level: L1
  value: "ready"
}

emit {
  target: "emission-record"
  kind: digest
  payload: "canonical-emission"
  trace: "required"
}
```

## What the language expresses

The emission identifies an explicit target and kind and can carry additional payload attributes.

All new Developer Preview examples use an explicit `target:`.

## What the kernel does

The canonical test proves that execution creates exactly one emission, targets `emission-record`, preserves the `digest` kind and payload attributes, and records an execution trace containing bind, validate, and emit phases.

## What the kernel does not do

`emit` does not imply network transmission, database persistence, email delivery, or another external side effect. The base runtime constructs an emission result. Adapters and consuming applications decide what to do with it.

## Composition

Emission is the boundary between a governed cognitive step and its consumer. Almost every useful pipeline eventually emits a result, report, decision, graph, projection, or other addressable output.

---

# From patterns to programs

The ten patterns are not ten new keywords. They are recurring cognitive structures built from the seven statement families.

A useful progression is:

```text
OBSERVE
  ↓
IDENTIFY
  ↓
COMPARE / CLASSIFY
  ↓
RELATE
  ↓
VIEW
  ↓
RESOLVE
  ↓
CONSTRAIN / TRANSFORM
  ↓
EMIT
```

This is a learning progression, not a mandatory execution pipeline. Real Cog programs can use only the structures they need.

## First compositions

After the ten primitives, inspect the canonical pipelines under:

```text
packages/cog-core/examples/pipelines/
```

The current pipeline corpus includes patterns such as:

- observe → compare → constrain → resolve;
- classify → relate;
- constraint-oriented resolution;
- transformation → comparison.

The purpose of those examples is to show that Cog's useful unit is not an isolated keyword. It is an inspectable semantic graph composed from small governed structures.

# Language primitives vs cognitive patterns

Keep these terms separate:

## Language primitives

The seven `.cog` statement families:

```text
define entity
relate
view
resolve
transform
constrain
emit
```

## Cognitive patterns

The ten Level‑1 examples:

```text
Observation
Identification
Comparison
Classification
Relation
Projection
Resolution
Constraint
Transformation
Emission
```

A cognitive pattern may use several language primitives. For example, Classification uses entities, a relation, and an emission. Transformation uses entities, transformation intent, a lineage relation, and an emission.

## Core helpers

The TypeScript helper functions exported from the core standard-helper surface are a third thing. They are programmatic APIs, not additional `.cog` syntax.

## CogLib

CogLib is the cognitive standard library above the kernel. Its routines can implement actual reusable cognitive algorithms and return governed results that fit into Cog structures.

# A practical authoring method

When designing a small Cog program, use this sequence:

1. **Name the cognitive objects.** What observations, candidates, results, decisions, or artifacts need stable identity?
2. **Make important relationships explicit.** What supports, differs from, transforms to, blocks, derives from, or otherwise relates to what?
3. **Separate perspectives from objects.** If the same entity must be considered differently, use a view rather than duplicating or mutating meaning.
4. **Represent resolution explicitly.** If something changes level or resolution, make that transition inspectable.
5. **Attach governance to targets.** Constraints should point to the objects they govern.
6. **Separate intent from implementation.** A transform name, rule string, or operation attribute does not substitute for an algorithm.
7. **Emit only what the consumer needs.** Make the output boundary explicit.
8. **Validate, run, inspect, revise.** Use the same loop introduced in `START_HERE.md`.

# Run the canonical Level‑1 fixtures

When working from the Cog repository, the canonical primitive fixtures are under:

```text
packages/cog-core/examples/primitives/
```

You can validate and run a fixture with the repository-built CLI or copy one into a small consumer project and use:

```bash
npx --no-install cog validate example.cog
npx --no-install cog run example.cog
```

The strongest repository proof is not this prose. It is the canonical example test corpus:

```text
packages/cog-core/src/tests/canonicalExamples.test.ts
```

Those tests establish the exact structural and runtime claims this guide relies on.

# Level‑1 completion check

You are ready to leave Level 1 when you can explain, without treating Cog as a general-purpose imperative language:

- why entities and relations form the semantic graph backbone;
- why a `view` is not the same thing as mutating its target;
- why `resolve` represents a governed level decision;
- why a constraint rule string is not automatically a universal predicate evaluator;
- why transformation intent is distinct from the transformation algorithm;
- why `emit` is an output boundary rather than an implicit external side effect;
- why Comparison and Classification in the canonical fixtures represent their outcomes explicitly;
- the difference between language primitives, cognitive patterns, Core Helpers, and CogLib.

If those distinctions are clear, continue to:

- [`GOVERNED_DECISION_TUTORIAL.md`](./GOVERNED_DECISION_TUTORIAL.md) for a single program that uses the full language surface;
- the canonical `pipelines/` examples for composition;
- **Level 2 — Composable Cognitive Utilities** for small developer-facing cognitive tools.
