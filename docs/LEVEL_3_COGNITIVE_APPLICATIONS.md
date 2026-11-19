<!-- cog-doc-conformance -->
# Level 3 — Cognitive Applications

Level 3 is the application capstone of the Cog Developer Preview learning path.

By this point you should already understand:

- the seven `.cog` statement families from Level 1;
- the ten canonical cognitive patterns;
- how those structures compose in the governed-decision tutorial; and
- how to inspect a program with the Level-2 `validate`, `lint`, `graph`, `run`, `trace`, and `diff` utilities.

Level 3 now asks a different question:

> What does a complete cognitive application look like when several governed cognitive patterns are composed around a real problem shape?

The five canonical application fixtures are:

1. Research Synthesis
2. Document Review / Drift Detection
3. Decision Analysis
4. Audit Reasoning
5. Knowledge Graph

They live under:

```text
packages/cog-core/examples/applications/
```

They are executable repository fixtures, not illustrative pseudocode. The canonical example test suite compiles, validates, plans, executes, and inspects all five.

---

## 1. The Level-3 reading rule

A cognitive application is more than a large `.cog` file, but the `.cog` file is the governed semantic spine of the application.

Read every example through four layers:

```text
problem domain
    ↓
represented cognitive application
    ↓
Cog kernel execution substrate
    ↓
higher-layer domain algorithms / tools / integrations
```

The base kernel owns syntax, CoreIR, structural validation, planning, execution structure, emissions, and traces.

The base kernel does **not** automatically perform source extraction, semantic comparison, drift detection, decision evaluation, repository auditing, clustering, or explanation merely because those operation names occur in a program.

In these canonical applications, many intermediate and final cognitive products are already represented explicitly. That is intentional: the examples demonstrate how cognitive work becomes addressable, governable, inspectable, executable, and traceable.

Where actual domain computation is required, it belongs in CogLib, a domain library, an adapter, a tool, an integration, or an application layer.

---

## 2. The five applications at a glance

| Application | Problem shape | Main represented progression | Registered domain library |
| --- | --- | --- | --- |
| Research Synthesis | Combine evidence into a governed conclusion | sources → claims → comparison → cluster → resolution | `cog:domain:research` |
| Document Review | Detect and explain drift from an expected representation | draft → comparison → drift → action → explanation | `cog:domain:editorial` |
| Decision Analysis | Govern an option under evidence and criteria | metric → option → constraint → resolution → decision | `cog:domain:decision` |
| Audit Reasoning | Turn observations into related findings and severity | repository → findings → finding relation → severity | `cog:domain:audit` |
| Knowledge Graph | Turn observations and identities into a correlated semantic graph | sensor → profiles → relations → cluster → explanation | `cog:domain:graph` |

The five examples deliberately reuse Level-1 patterns. That is the core lesson of Level 3: **applications are compositions of smaller governed cognitive structures.**

---

# Application 1 — Research Synthesis

## Problem

Research synthesis must preserve a path from observed sources through extracted claims, relationships among those claims, a synthesis grouping, and a final represented conclusion.

The canonical application is:

```cog
define entity "source-a" {
  kind: "observation"
  level: L1
  value: "source-a-data"
}

define entity "source-b" {
  kind: "observation"
  level: L1
  value: "source-b-data"
}

define entity "claim-a" {
  kind: "extraction"
  level: L2
  value: "claim-a-content"
}

define entity "claim-b" {
  kind: "extraction"
  level: L2
  value: "claim-b-content"
}

define entity "synthesis-cluster" {
  kind: "cluster"
  level: L3
  value: "clustered-claims"
}

define entity "final-resolution" {
  kind: "resolution"
  level: L4
  value: "synthesized-conclusion"
}

// Observe Sources
constrain {
  target: "source-a"
  operation: "observe"
}

constrain {
  target: "source-b"
  operation: "observe"
}

// Extract Claims
relate "source-a" -> "claim-a" {
  kind: "extracts"
  operation: "extract"
}

// Extract Claims
relate "source-b" -> "claim-b" {
  kind: "extracts"
  operation: "extract"
}

// Compare Claims
relate "claim-a" -> "claim-b" {
  kind: "differs-from"
  operation: "compare"
}

// Cluster Claims
relate "claim-a" -> "synthesis-cluster" {
  kind: "clustered-into"
  operation: "group"
}

relate "claim-b" -> "synthesis-cluster" {
  kind: "clustered-into"
  operation: "group"
}

// Resolve
resolve "synthesis-cluster" to L4 {
  operation: "resolve"
  reason: "synthesis-complete"
}

relate "synthesis-cluster" -> "final-resolution" {
  kind: "resolves-to"
  operation: "resolve"
}

// Emit
emit {
  target: "final-resolution"
  kind: "research-synthesis"
}
```

## Level-1 patterns composed

The application combines represented observation, relations, comparison, grouping, resolution, constraint attachment, and emission.

The key graph is:

```text
source-a → claim-a ─┐
                    ├→ synthesis-cluster → final-resolution → emission
source-b → claim-b ─┘
           ↑
      differs-from
```

## What the current executable proof establishes

The canonical test proves that the fixture:

- validates successfully;
- executes successfully;
- compiles to 6 entities;
- compiles to 6 relations;
- contains 1 resolution;
- emits exactly 1 result;
- emits target `final-resolution`;
- emits kind `research-synthesis`.

## What it does not establish

The fixture does not prove that the base kernel read external research sources, extracted the claims, discovered their differences, clustered them semantically, or generated the conclusion. Those cognitive products are already represented in the program.

The registered `Research Synthesis Library` (`cog:domain:research`) is the domain-library home for reusable source-to-claim, claim-clustering, and synthesis-resolution program construction. Actual source acquisition, extraction, comparison, or synthesis algorithms require an implementation above the neutral kernel.

## Inspect it with Level 2

From a repository checkout:

```bash
npx --no-install cog validate packages/cog-core/examples/applications/canonical-research-synthesis.cog
npx --no-install cog lint packages/cog-core/examples/applications/canonical-research-synthesis.cog
npx --no-install cog graph packages/cog-core/examples/applications/canonical-research-synthesis.cog
npx --no-install cog trace packages/cog-core/examples/applications/canonical-research-synthesis.cog
```

---

# Application 2 — Document Review / Drift Detection

## Problem

Document review often requires preserving the distinction between a current draft, an expected or golden representation, detected drift, the proposed reconciliation action, and the explanation for that action.

The canonical application is:

```cog
define entity "document-draft" {
  kind: "observation"
  level: L1
  value: "draft-content"
}

define entity "document-golden" {
  kind: "expectation"
  level: L1
  value: "golden-content"
}

define entity "drift-report" {
  kind: "drift"
  level: L2
  value: "detected-drift-details"
}

define entity "reconciliation-action" {
  kind: "action"
  level: L2
  value: "align-draft-to-golden"
}

define entity "explanation-summary" {
  kind: "explanation"
  level: L3
  value: "drift-mitigation-reasoning"
}

// 1. Observe
constrain {
  target: "document-draft"
  operation: "observe"
}

// 2. Compare
relate "document-draft" -> "document-golden" {
  kind: "differs-from"
  operation: "compare"
}

// 3. Detect Drift
relate "document-draft" -> "drift-report" {
  kind: "has-drift"
  operation: "detect-drift"
}

// 4. Resolve
resolve "drift-report" to L2 {
  operation: "resolve"
  reason: "drift-detected"
}

relate "drift-report" -> "reconciliation-action" {
  kind: "mitigated-by"
  operation: "resolve"
}

// 5. Explain
relate "reconciliation-action" -> "explanation-summary" {
  kind: "explained-by"
  operation: "explain"
}

// Emit report
emit {
  target: "explanation-summary"
  kind: "document-review"
}
```

## Level-1 patterns composed

This application combines observation, comparison, typed relation, resolution, governed constraint attachment, and emission.

Its semantic spine is:

```text
document-draft → document-golden
       │
       └→ drift-report → reconciliation-action → explanation-summary → emission
```

## What the current executable proof establishes

The test proves:

- successful validation and execution;
- 5 entities;
- 4 relations;
- 1 resolution;
- exactly 1 emission;
- emission target `explanation-summary`;
- emission kind `document-review`.

## What it does not establish

The base kernel does not compare arbitrary document content, detect semantic drift, invent a reconciliation action, or generate an explanation from prose. The fixture represents those products and the relations among them.

The registered `Editorial Review Library` (`cog:domain:editorial`) is the higher-level library surface for drift-detection, reconciliation-action, and editorial-explanation program patterns.

## Inspect it with Level 2

```bash
npx --no-install cog validate packages/cog-core/examples/applications/canonical-document-review.cog
npx --no-install cog lint packages/cog-core/examples/applications/canonical-document-review.cog
npx --no-install cog graph packages/cog-core/examples/applications/canonical-document-review.cog
npx --no-install cog trace packages/cog-core/examples/applications/canonical-document-review.cog
```

---

# Application 3 — Decision Analysis

## Problem

A governed decision should keep the observed metric, candidate alternative, criteria constraint, resolution state, and final decision distinguishable rather than collapsing them into one opaque answer.

The canonical application is:

```cog
define entity "raw-metric" {
  kind: "observation"
  level: L1
  value: 85
}

define entity "selected-option" {
  kind: "alternative"
  level: L1
  value: "option-alpha"
}

define entity "final-decision" {
  kind: "decision"
  level: L2
  value: "option-alpha-approved"
}

// 1. Observe raw metrics and alternative options
constrain {
  target: "raw-metric"
  operation: "observe"
}

// 2. Evaluate raw metrics against standard
relate "raw-metric" -> "selected-option" {
  kind: "supports"
  operation: "evaluate"
}

// 3. Constrain the choice based on criteria
constrain {
  target: "selected-option"
  operation: "evaluate"
  rule: "metric-threshold-met"
  threshold: 80
}

// 4. Resolve the choice to approval level
resolve "selected-option" to L2 {
  operation: "resolve"
  reason: "metrics-exceeded-threshold"
}

relate "selected-option" -> "final-decision" {
  kind: "approved-as"
  operation: "resolve"
}

// 5. Emit
emit {
  target: "final-decision"
  kind: "decision-analysis"
}
```

## Level-1 patterns composed

Decision Analysis combines observation, relation, constraint, resolution, and emission.

```text
raw-metric → selected-option → final-decision → emission
                 │
              constraint
```

## What the current executable proof establishes

The test proves:

- successful validation and execution;
- 3 entities;
- 2 relations;
- 1 resolution;
- exactly 1 emission;
- emission target `final-decision`;
- emission kind `decision-analysis`.

## What it does not establish

The string `rule: "metric-threshold-met"` is not a general executable predicate supplied by the base kernel. Nor does `operation: "evaluate"` cause the kernel to compare 85 against 80 and choose `option-alpha` automatically. The option and decision are already represented.

The registered `Decision Analysis Library` (`cog:domain:decision`) is the domain-library home for alternative-evaluation, metric-constraint, and decision-resolution program patterns. A real decision engine can use Cog to preserve its evidence, criteria, result, and trace without pushing its decision algorithm into the language kernel.

## Inspect it with Level 2

```bash
npx --no-install cog validate packages/cog-core/examples/applications/canonical-decision-workflow.cog
npx --no-install cog lint packages/cog-core/examples/applications/canonical-decision-workflow.cog
npx --no-install cog graph packages/cog-core/examples/applications/canonical-decision-workflow.cog
npx --no-install cog trace packages/cog-core/examples/applications/canonical-decision-workflow.cog
```

Compare it with the longer governed-decision tutorial to see the difference between a compact canonical application fixture and a deliberately explicit teaching program.

---

# Application 4 — Audit Reasoning

## Problem

An audit needs more than a list of findings. It needs addressable evidence, explicit finding relationships, represented severity, and an inspectable report boundary.

The canonical application is:

```cog
define entity "repository-root" {
  kind: "observation"
  level: L1
  value: "git-repository"
}

define entity "finding-unauthorized-api" {
  kind: "finding"
  level: L1
  value: "unauthorized-api-call-detected"
}

define entity "dependency-declaration" {
  kind: "finding"
  level: L1
  value: "package-json-dependencies"
}

define entity "severity-evaluation" {
  kind: "evaluation"
  level: L2
  value: "severity-high"
}

// 1. Observe Repository
constrain {
  target: "repository-root"
  operation: "observe"
}

// 2. Identify Findings
relate "repository-root" -> "finding-unauthorized-api" {
  kind: "contains-finding"
  operation: "identify"
}

relate "repository-root" -> "dependency-declaration" {
  kind: "contains-finding"
  operation: "identify"
}

// 3. Relate Findings
relate "finding-unauthorized-api" -> "dependency-declaration" {
  kind: "blocks"
  operation: "relate"
}

// 4. Resolve Severity
resolve "finding-unauthorized-api" to L2 {
  operation: "resolve"
  reason: "policy-violation"
}

relate "finding-unauthorized-api" -> "severity-evaluation" {
  kind: "severity-resolved-to"
  operation: "resolve"
}

// 5. Emit Report
emit {
  target: "severity-evaluation"
  kind: "audit-report"
}
```

## Level-1 patterns composed

Audit Reasoning combines observation, identification-like relations, typed relations, resolution, constraint attachment, and emission.

```text
repository-root
   ├→ finding-unauthorized-api ─→ severity-evaluation → emission
   │            │
   │            └─ blocks ─→ dependency-declaration
   └──────────────────────→ dependency-declaration
```

## What the current executable proof establishes

The canonical test proves:

- successful validation and execution;
- 4 entities;
- 4 relations;
- 1 resolution;
- exactly 1 emission;
- emission target `severity-evaluation`;
- emission kind `audit-report`.

## What it does not establish

The base kernel did not scan a repository, detect an unauthorized API call, infer a dependency conflict, or calculate `severity-high`. Those findings and the severity are represented in the fixture.

The registered `Audit Reasoning Library` (`cog:domain:audit`) is the domain-library home for finding-identification, finding-relationship, and severity-resolution program patterns. Repository scanners, policy engines, and audit tools can supply the actual findings while Cog preserves the governed semantic result.

## Inspect it with Level 2

```bash
npx --no-install cog validate packages/cog-core/examples/applications/canonical-audit-workflow.cog
npx --no-install cog lint packages/cog-core/examples/applications/canonical-audit-workflow.cog
npx --no-install cog graph packages/cog-core/examples/applications/canonical-audit-workflow.cog
npx --no-install cog trace packages/cog-core/examples/applications/canonical-audit-workflow.cog
```

---

# Application 5 — Knowledge Graph

## Problem

A knowledge-graph application makes identities, relationships, groups, and explanatory structures explicit so that correlation is inspectable rather than buried in an opaque result.

The canonical application is:

```cog
define entity "sensor-stream" {
  kind: "observation"
  level: L1
  value: "network-log-data"
}

define entity "profile-host" {
  kind: "profile"
  level: L1
  value: "host-10.0.0.1"
}

define entity "profile-user" {
  kind: "profile"
  level: L1
  value: "user-admin"
}

define entity "network-cluster" {
  kind: "cluster"
  level: L2
  value: "admin-activity-graph"
}

define entity "explanation-node" {
  kind: "explanation"
  level: L3
  value: "correlated-admin-access-reasoning"
}

// 1. Observe
constrain {
  target: "sensor-stream"
  operation: "observe"
}

// 2. Identify
relate "sensor-stream" -> "profile-host" {
  kind: "identifies"
  operation: "identify"
}

relate "sensor-stream" -> "profile-user" {
  kind: "identifies"
  operation: "identify"
}

// 3. Relate
relate "profile-user" -> "profile-host" {
  kind: "accesses"
  operation: "relate"
}

// 4. Cluster
relate "profile-user" -> "network-cluster" {
  kind: "clustered-into"
  operation: "group"
}

relate "profile-host" -> "network-cluster" {
  kind: "clustered-into"
  operation: "group"
}

// 5. Explain / Resolve
resolve "network-cluster" to L3 {
  operation: "resolve"
  reason: "clustering-complete"
}

relate "network-cluster" -> "explanation-node" {
  kind: "explained-by"
  operation: "explain"
}

// Emit report
emit {
  target: "explanation-node"
  kind: "knowledge-graph"
}
```

## Level-1 patterns composed

This application combines observation, identification-like relations, typed relation, grouping, resolution, constraint attachment, and emission.

```text
sensor-stream
   ├→ profile-user ── accesses ─→ profile-host
   │       │                         │
   │       └──────┐           ┌──────┘
   └→ profile-host│           │
                  ↓           ↓
                 network-cluster → explanation-node → emission
```

## What the current executable proof establishes

The test proves:

- successful validation and execution;
- 5 entities;
- 6 relations;
- 1 resolution;
- exactly 1 emission;
- emission target `explanation-node`;
- emission kind `knowledge-graph`.

## What it does not establish

The base kernel does not inspect network traffic, resolve real host/user identities, discover the `accesses` relation, cluster activity, or generate explanatory correlation reasoning. Those products are represented explicitly.

The registered `Knowledge Graph Library` (`cog:domain:graph`) is the domain-library home for profile-identification, graph-clustering, and correlation-explanation program patterns.

## Inspect it with Level 2

```bash
npx --no-install cog validate packages/cog-core/examples/applications/canonical-knowledge-graph.cog
npx --no-install cog lint packages/cog-core/examples/applications/canonical-knowledge-graph.cog
npx --no-install cog graph packages/cog-core/examples/applications/canonical-knowledge-graph.cog
npx --no-install cog trace packages/cog-core/examples/applications/canonical-knowledge-graph.cog
```

---

# 8. Read applications as cognitive architectures

Across all five examples, the recurring architecture is:

```text
represented input / observation
        ↓
addressable intermediate cognitive objects
        ↓
typed semantic relationships
        ↓
resolution / governance structure
        ↓
represented result
        ↓
emission + trace
```

The specific nouns change by domain:

```text
Research: source → claim → cluster → conclusion
Editorial: draft → drift → action → explanation
Decision: metric → alternative → decision
Audit: repository → finding → severity
Graph: sensor → profile → cluster → explanation
```

But the underlying governed structures are reusable. That is the application-level value of Cog: different cognitive domains can share an execution substrate without collapsing their domain semantics into the kernel.

---

# 9. Use the Level-2 toolbelt as an application workflow

A useful inspection sequence for any application is:

```bash
npx --no-install cog validate app.cog
npx --no-install cog lint app.cog
npx --no-install cog graph app.cog > app.mmd
npx --no-install cog run app.cog
npx --no-install cog trace app.cog
```

Use `diff` when comparing two executable versions of an application:

```bash
npx --no-install cog diff before.cog after.cog
```

Remember that `diff` compares the two **runtime execution traces**. It does not report source-text differences or semantic-domain differences unless those differences change the execution trace.

You can also inspect a single execution phase:

```bash
npx --no-install cog trace app.cog --phase validate
```

This is where Levels 1, 2, and 3 meet:

```text
Level 1: understand the structures
Level 2: inspect the structures and execution
Level 3: compose the structures around a domain problem
```

---

# 10. Domain library versus canonical application

The canonical application fixture and its domain library serve different purposes.

The fixture is a stable executable reference program. It demonstrates the semantic graph and execution shape.

The registered domain library is a reusable higher-layer construction surface. Its `generate()` function produces domain-oriented Cog source from parameters and declares the library's capability and supported patterns.

Neither fact means that the neutral kernel has acquired a domain-specific reasoning algorithm.

A production system may look like:

```text
external data / tool
        ↓
domain algorithm
        ↓
CogLib or domain library
        ↓
Cog semantic representation
        ↓
validate / plan / execute
        ↓
emission + trace
        ↓
application consumer
```

This boundary should remain visible as Cog grows.

---

# 11. What makes an application Cog-native?

A Cog application is not Cog-native merely because it stores its output in a `.cog` file.

A stronger application makes the important cognitive distinctions explicit:

- inputs are addressable;
- intermediate cognitive products are addressable where governance requires them;
- relations are typed;
- perspective or resolution is explicit when relevant;
- constraints are attached to named targets;
- transformation intent is explicit when transformation occurs;
- outputs cross a declared emission boundary;
- validation, planning, and execution remain inspectable;
- the trace provides evidence of what the execution substrate actually did;
- domain algorithms remain owned by the appropriate higher layer.

This is the architectural standard to carry beyond the five canonical examples.

---

# 12. Exercises

## Exercise A — Inspect before reading

Choose one application and run:

```bash
npx --no-install cog graph <application.cog>
npx --no-install cog trace <application.cog>
```

Then read the source. Determine whether the graph and trace let you predict the application structure before reading every field.

## Exercise B — Introduce a structural smell

Add an entity that is never referenced. Run:

```bash
npx --no-install cog lint <application.cog>
```

Remove it after observing the warning.

## Exercise C — Compare application executions

Make a copy of an application and add a structurally meaningful statement that changes its plan. Compare the two:

```bash
npx --no-install cog diff original.cog modified.cog
```

Explain the difference as an execution-path change rather than a text diff.

## Exercise D — Identify the missing algorithm

For each operation name in one canonical application, label it as one of:

```text
represented result already present
kernel structural behavior
domain algorithm required
```

This is the most important Level-3 exercise because it prevents semantic names from being mistaken for implemented cognition.

## Exercise E — Design a sixth application

Choose a problem domain and sketch only the semantic spine first:

```text
inputs
  ↓
intermediate cognitive objects
  ↓
typed relations
  ↓
governance / resolution
  ↓
result
  ↓
emission
```

Then decide which Level-1 patterns are needed and which computations must live outside the kernel.

---

# 13. Level-3 completion criteria

You have completed Level 3 when you can:

1. explain each of the five canonical application architectures;
2. identify the Level-1 patterns being composed;
3. run and inspect an application with the Level-2 utilities;
4. distinguish declared cognitive structure from actual domain computation;
5. identify the registered domain-library home for each application family;
6. explain exactly what the kernel proves about a canonical application;
7. explain what the kernel does not prove;
8. design the semantic spine of a new cognitive application without adding domain semantics to the kernel.

---

# 14. The complete Developer Preview learning path

```text
START_HERE
  ↓
Level 1 — Language & Cognitive Patterns
  ↓
Governed Decision Tutorial
  ↓
Level 2 — Composable Cognitive Utilities
  ↓
Level 3 — Cognitive Applications
```

At Level 1, you learned the vocabulary.

In the governed tutorial, you learned composition.

At Level 2, you learned the inspection toolbelt.

At Level 3, you learned how the same governed structures form domain applications.

The next learning-pack work should therefore move from **curriculum creation** to **Developer Preview assembly and stranger testing**: package the learning surfaces coherently, verify every command in a clean consumer environment, and ask whether a developer unfamiliar with Cog can complete the path without repository-specific knowledge or undocumented assumptions.
