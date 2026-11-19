<!-- cog-doc-conformance -->
# Progressive Tutorial — A Governed Decision in Cog

This tutorial continues from [`START_HERE.md`](START_HERE.md).

In Start Here, you wrote and ran one small observation. Here you will build a complete governed cognitive structure across the full Developer Preview language surface.

The goal is not to turn Cog into a business-rules language. The goal is to learn how Cog makes the **structure of cognition explicit and inspectable**: what objects exist, how they relate, which perspectives are applied, what resolution is requested, what transformation is intended, what constraints govern the structure, and what result is emitted.

## What you will build

You will model a decision about whether a software deployment is ready to proceed.

The represented reasoning is:

```text
availability evidence ─┐
                      ├─> deployment proposal
security evidence ─────┘          │
                                  ├─ viewed from operations
                                  ├─ viewed from governance
                                  ├─ resolved to a review level
                                  ↓
                         governed assessment
                                  │
                           governed by constraint
                                  ↓
                         deployment decision
                                  │
                                emit
```

By the end, your program will use all seven Cog statement families:

```text
define entity
relate
view
resolve
transform
constrain
emit
```

## Before you begin

Use the Developer Preview environment:

```text
Node.js 20.x
npm >= 10
@winmedia/cog-core
```

If you have not already created a project, the shortest setup is:

```bash
mkdir cog-decision-tutorial
cd cog-decision-tutorial
npm init -y
npm install @winmedia/cog-core
npx --no-install cog help
```

Create an empty file named:

```text
governed-decision.cog
```

You will add to that file as the tutorial progresses.

---

## 1. Define the things that can carry meaning

Cog begins with explicit semantic objects.

Add three entities: the proposal itself and two pieces of evidence.

```cog
define entity "deployment-proposal" {
  kind: proposal
  level: L1
  candidate: "release-2026-08"
  status: "under-review"
}

define entity "availability-evidence" {
  kind: evidence
  level: L1
  finding: "capacity-test-passed"
  confidence: 0.92
}

define entity "security-evidence" {
  kind: evidence
  level: L1
  finding: "security-review-complete"
  confidence: 0.88
}
```

At this point, Cog does not know that either evidence item supports the proposal. You have only made three semantic objects explicit.

That distinction matters. **Entities say what exists in the represented cognitive structure; relations say how those things are connected.**

### Validate the structure

You can validate at any point:

```bash
npx --no-install cog validate governed-decision.cog
```

The current file contains only entities, so there is nothing to emit yet. Validation and execution are separate concerns: a structurally valid Cog program does not need to emit a payload.

---

## 2. Relate evidence to the proposal

Now add typed relations.

```cog
relate "availability-evidence" -> "deployment-proposal" {
  kind: supports
  basis: "capacity"
}

relate "security-evidence" -> "deployment-proposal" {
  kind: qualifies
  basis: "security-review"
}
```

The graph now distinguishes two different relationships:

```text
availability-evidence --supports--> deployment-proposal
security-evidence ----qualifies--> deployment-proposal
```

Cog preserves these relation types. It does not silently collapse them into a generic association.

It also does not independently decide whether the evidence *really* supports or qualifies the proposal. Those semantics belong to the producing application, domain library, adapter, or cognitive routine. The kernel preserves and governs the declaration.

---

## 3. Add perspectives with `view`

A single object may need to be considered from more than one perspective without being duplicated into unrelated objects.

Add two views of the proposal:

```cog
view "deployment-proposal" as operations {
  focus: ["availability", "rollback"]
}

view "deployment-proposal" as governance {
  focus: ["security", "evidence"]
}
```

You now have one proposal with two explicit perspectives:

```text
                    ┌─ operations
                    │
deployment-proposal ┤
                    │
                    └─ governance
```

The views do not automatically calculate different conclusions. They preserve the fact that the same semantic object is being inspected under distinct perspectives. An adapter or higher-level cognitive system can map those perspectives to domain-specific behavior.

This is one of Cog's central ideas: **perspective is represented explicitly rather than hidden inside application code or prose.**

---

## 4. Resolve the proposal to an explicit level

Add a resolution statement:

```cog
resolve "deployment-proposal" to L2 {
  reason: "evidence-reviewed"
}
```

A resolution is not the decision outcome. It records that the target has been resolved to a particular Cog level in this cognitive structure.

For the Developer Preview, think of `L1` through `L5` as abstract resolution levels that may be mapped by higher layers. Do not assume that `L3` is universally "better" than `L2`, or that a resolution statement means "approved."

The important property is that resolution is **explicit, addressable, and traceable**.

---

## 5. Represent a transformation without pretending the kernel invented the result

The review process produces a governed assessment. Make that result explicit first:

```cog
define entity "governed-assessment" {
  kind: assessment
  level: L2
  status: "provisional"
  finding: "ready-with-rollback"
}
```

Now declare the transformation intent and connect the represented source and result:

```cog
transform {
  target: "deployment-proposal"
  to: assemble-governed-assessment
  operation: "transform"
}

relate "deployment-proposal" -> "governed-assessment" {
  kind: transforms-to
  operation: "transform"
}
```

This pattern is deliberate.

The base Cog kernel records the transformation declaration in CoreIR and in the execution plan/trace. It does **not** contain a universal algorithm named `assemble-governed-assessment` that discovers the assessment for you.

In a real system, the assessment might be produced by:

- a CogLib routine;
- a Decision domain-library operation;
- an adapter;
- an external tool;
- an application service;
- or a human decision process whose result is then represented in Cog.

Cog's job here is to make the transformation intent and represented result governable and inspectable.

---

## 6. Govern the assessment with a constraint

Add a constraint:

```cog
constrain {
  target: "governed-assessment"
  operation: "constrain"
  rule: "rollback-plan-required"
}
```

This adds a governed assertion to the program.

The base validator can verify structural facts such as whether the target exists. The string `rollback-plan-required` is not, by itself, executable domain logic. If your application needs that rule to be evaluated against real deployment data, its semantics must be implemented in a higher layer.

That distinction prevents a common category error:

```text
represented rule ≠ implemented rule evaluator
```

Cog can preserve the rule as part of an inspectable cognitive contract even when its domain semantics live elsewhere.

---

## 7. Represent and emit the decision

Now represent the decision explicitly:

```cog
define entity "deployment-decision" {
  kind: decision
  level: L3
  outcome: "approve-with-conditions"
  condition: "rollback-plan-present"
}
```

Connect the assessment to the decision:

```cog
relate "governed-assessment" -> "deployment-decision" {
  kind: informs-decision
}
```

Resolve the represented decision and then emit it:

```cog
resolve "deployment-decision" to L3 {
  reason: "review-complete"
}

emit {
  target: "deployment-decision"
  kind: "governed-decision"
}
```

Notice what you did **not** write:

```text
if capacity > threshold and security == approved then approve
```

Cog is not hiding a conventional imperative program behind different punctuation. You constructed a governed semantic graph whose decision, evidence, perspectives, transformation intent, constraints, and output are explicit objects in the cognitive structure.

---

## 8. Validate the complete program

Run:

```bash
npx --no-install cog validate governed-decision.cog
```

The expected successful result is:

```text
Validation passed successfully!
```

Validation occurs after lexing, parsing, and compilation to CoreIR:

```text
SOURCE
  ↓
LEX
  ↓
PARSE
  ↓
COMPILE TO CoreIR
  ↓
VALIDATE
```

If validation fails, Cog reports structural issues rather than executing an incoherent graph.

---

## 9. Execute the governed decision

Run:

```bash
npx --no-install cog run governed-decision.cog
```

The current Developer Preview CLI reports a compact execution summary. A successful run should report:

```text
Execution finished successfully!
Emitted 1 payloads.
```

Internally, the runtime produces an execution trace as part of the result. The current `run` command does not yet print the full trace; trace inspection is part of the Level 2 cognitive-utilities surface.

The execution model is:

```text
CoreIR
  ↓
VALIDATE
  ↓
PLAN
  ↓
EXECUTE
  ↓
EMISSIONS + TRACE
```

The plan contains the kernel phases needed by the program, including bind, transform, validate, and emit work.

---

## 10. Break the graph on purpose

A useful way to understand governed structure is to violate it.

Temporarily change the final emission target from:

```cog
emit {
  target: "deployment-decision"
  kind: "governed-decision"
}
```

to:

```cog
emit {
  target: "missing-decision"
  kind: "governed-decision"
}
```

Now run:

```bash
npx --no-install cog validate governed-decision.cog
```

Validation should fail because the emission refers to an object that the graph does not define.

Restore the target to `"deployment-decision"` and validate again.

This is the beginning of Cog governance: important semantic references are not left as unstructured prose or convention. They become explicit, inspectable references that can be checked.

---

## 11. Read the program as a semantic graph

Your completed program contains five entities:

```text
deployment-proposal
availability-evidence
security-evidence
governed-assessment
deployment-decision
```

It contains four typed relations:

```text
availability-evidence --supports---------> deployment-proposal
security-evidence ----qualifies---------> deployment-proposal
deployment-proposal --transforms-to-----> governed-assessment
governed-assessment --informs-decision--> deployment-decision
```

It also contains:

```text
2 views
2 resolutions
1 transformation declaration
1 constraint
1 emission
```

This is why the semantic-graph mental model is more useful than reading the file as a sequence of commands. The source has an order because text must have an order; the represented meaning is primarily relational.

---

## 12. What Cog did — and what it did not do

### The kernel did

- tokenize and parse the seven statement families;
- compile them into explicit CoreIR structures;
- preserve entity and relation identity;
- preserve the two perspectives;
- preserve the requested resolutions;
- record transformation intent;
- preserve the constraint declaration;
- structurally validate references;
- build an execution plan;
- execute that plan;
- emit the represented decision;
- produce an execution trace.

### The kernel did not

- run a capacity test;
- perform a security review;
- decide whether the evidence was trustworthy;
- invent the `ready-with-rollback` assessment;
- implement the `rollback-plan-required` domain predicate merely because that string appears in a constraint;
- choose `approve-with-conditions` on its own.

Those are cognitive or domain operations supplied above the language kernel.

The intended dependency direction is:

```text
Cog Kernel
  ↓
CogLib
  ↓
Domain Libraries / Machine Editions
  ↓
Tools & Memory Substrates
  ↓
Applications & Consumer Surfaces
```

A useful rule is:

> **Cog makes cognition explicit and governable; higher layers supply the cognition that requires domain knowledge or algorithms.**

---

## 13. Complete program

Your final `governed-decision.cog` should be:

```cog
define entity "deployment-proposal" {
  kind: proposal
  level: L1
  candidate: "release-2026-08"
  status: "under-review"
}

define entity "availability-evidence" {
  kind: evidence
  level: L1
  finding: "capacity-test-passed"
  confidence: 0.92
}

define entity "security-evidence" {
  kind: evidence
  level: L1
  finding: "security-review-complete"
  confidence: 0.88
}

relate "availability-evidence" -> "deployment-proposal" {
  kind: supports
  basis: "capacity"
}

relate "security-evidence" -> "deployment-proposal" {
  kind: qualifies
  basis: "security-review"
}

view "deployment-proposal" as operations {
  focus: ["availability", "rollback"]
}

view "deployment-proposal" as governance {
  focus: ["security", "evidence"]
}

resolve "deployment-proposal" to L2 {
  reason: "evidence-reviewed"
}

define entity "governed-assessment" {
  kind: assessment
  level: L2
  status: "provisional"
  finding: "ready-with-rollback"
}

transform {
  target: "deployment-proposal"
  to: assemble-governed-assessment
  operation: "transform"
}

relate "deployment-proposal" -> "governed-assessment" {
  kind: transforms-to
  operation: "transform"
}

constrain {
  target: "governed-assessment"
  operation: "constrain"
  rule: "rollback-plan-required"
}

define entity "deployment-decision" {
  kind: decision
  level: L3
  outcome: "approve-with-conditions"
  condition: "rollback-plan-present"
}

relate "governed-assessment" -> "deployment-decision" {
  kind: informs-decision
}

resolve "deployment-decision" to L3 {
  reason: "review-complete"
}

emit {
  target: "deployment-decision"
  kind: "governed-decision"
}
```

A repository copy of this complete program lives at:

```text
packages/cog-core/examples/tutorials/governed-decision.cog
```

---

## 14. From a represented decision to a cognitive application

This tutorial intentionally kept the domain algorithms outside the kernel. The next architectural move is not to add hidden intelligence to `.cog` syntax. It is to connect the governed representation to reusable cognitive capabilities.

Inspect what is already available:

```bash
npx --no-install cog discover
npx --no-install cog workflows
```

The Developer Preview includes a Decision domain library and a canonical Decision Analysis application example. Those higher-level surfaces are where reusable decision semantics belong.

Compare this tutorial with:

```text
packages/cog-core/examples/applications/canonical-decision-workflow.cog
```

That example is deliberately compact. This tutorial is more explicit because its purpose is to expose the language model one piece at a time.

---

## 15. What you should now understand

After completing this tutorial, you should be able to explain the following without referring to syntax alone:

1. An **entity** is an explicit semantic object.
2. A **relation** makes a typed connection explicit.
3. A **view** preserves perspective as part of the model.
4. A **resolution** records an explicit resolution level; it is not automatically a verdict.
5. A **transform** declares transformation intent; it does not imply a universal hidden algorithm.
6. A **constraint** preserves a governed assertion; domain evaluation requires implemented semantics.
7. An **emission** identifies the represented result that leaves the cognition step.
8. Validation, planning, execution, emissions, and traces are separate parts of the execution substrate.
9. The Cog kernel governs semantic structure; CogLib, domain libraries, adapters, tools, and applications supply higher-order cognitive behavior.

That is the Level 1 mental model.

## Next

Continue in two directions:

- study the canonical primitive examples under `packages/cog-core/examples/primitives/` to see each cognitive pattern in isolation;
- begin Level 2 with small composable cognitive utilities built on the existing linter, graph, trace, discovery, validation, and diff services.

For exact syntax, use [`LANGUAGE_SPEC_v0.4.md`](LANGUAGE_SPEC_v0.4.md). For semantic interpretation, use [`LANGUAGE_SEMANTIC_MODEL.md`](LANGUAGE_SEMANTIC_MODEL.md).
