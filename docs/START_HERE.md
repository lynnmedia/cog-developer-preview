<!-- cog-doc-conformance -->
# Start Here — Cog Developer Preview

This is the shortest path from a clean folder to a working Cog program.

Cog is a small, declarative language and execution substrate for constructing governed semantic graphs with explicit entities, relations, perspectives, resolutions, transformation intent, constraints, emissions, validation, planning, and execution traces.

You do not need to write a TypeScript runner to begin.

## What you will do

In roughly 10–15 minutes you will:

1. install `@winmedia/cog-core`;
2. verify the Cog CLI;
3. create a small `.cog` program;
4. validate it;
5. execute it;
6. make one change and run it again;
7. discover the larger Cog learning surface.

## 1. Requirements

Use:

```text
Node.js 20.x
npm >= 10
```

Check your environment:

```bash
node --version
npm --version
```

## 2. Create a clean project

```bash
mkdir cog-hello
cd cog-hello
npm init -y
npm install @winmedia/cog-core@0.3.0
```

If the Developer Preview is supplied to you as a local package tarball rather than through npm, install that tarball instead:

```bash
npm install /path/to/winmedia-cog-core-0.3.0.tgz
```

A packaged Developer Preview installation includes both the curriculum and canonical examples:

```text
node_modules/@winmedia/cog-core/learning/MANIFEST.md
node_modules/@winmedia/cog-core/learning/START_HERE.md
node_modules/@winmedia/cog-core/examples/
```

The repository `docs/` files remain the source teaching authorities. During package creation, Cog assembles distribution copies under `learning/` and ships the executable `examples/` tree with them.

## 3. Verify the CLI

For a normal local npm installation, use `npx --no-install` so that npm runs the `cog` executable from this project's `node_modules/.bin` directory without downloading anything else.

```bash
npx --no-install cog help
```

You should see the current command surface:

```text
discover
workflows
validate <file>
run <file>
lint <file>
graph <file>
trace <file> [--phase <phase>]
diff <before> <after>
```

The shorter form `cog ...` is appropriate when the executable is already on your PATH, for example from a global installation or inside an npm script. This guide uses the local-install form consistently.

## 4. Write your first Cog program

Create a file named `observed-signal.cog` with the following program:

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

This is the same program used by Cog's canonical observation example under `packages/cog-core/examples/primitives/`.

## 5. Validate it

```bash
npx --no-install cog validate observed-signal.cog
```

A valid program should report:

```text
Validation passed successfully!
```

Validation checks whether the compiled Cog structure is acceptable to the current kernel and any active adapter. In the base kernel, validation is primarily structural: references, levels, required fields, and related invariants must be coherent.

## 6. Run it

```bash
npx --no-install cog run observed-signal.cog
```

A successful run should report output similar to:

```text
Execution finished successfully!
Emitted 1 payloads.
```

Internally, Cog lexes and parses the source, compiles it to CoreIR, validates and plans it, executes the plan, produces emissions, and records an execution trace.

The canonical consumer sequence is:

```text
LEX → PARSE → COMPILE → VALIDATE → PLAN → EXECUTE → EMISSIONS + TRACE
```

The normal `run` command keeps first-run output intentionally compact. Level 2 exposes richer structural and trace inspection through `lint`, `graph`, `trace`, and `diff`.

## 7. Read what you just wrote

The first statement declares an entity:

```cog
define entity "observed-signal" {
  kind: observation
  level: L1
  operation: observe
  attribute: "ambient-light"
  value: "present"
  confidence: 1
}
```

`define entity` is Cog language syntax. The fields inside the block describe the entity.

`kind` classifies the entity structurally. `level` uses one of Cog's current levels, `L1` through `L5`. The remaining fields are explicit attributes carried by the entity.

One distinction matters immediately: `operation: observe` is data in this program. It does not cause the kernel to perform hidden sensing or inference. Cog preserves and governs declared cognitive structure; higher-order algorithms can be supplied by CogLib, domain libraries, adapters, tools, or applications.

The second statement declares an emission:

```cog
emit {
  target: "observed-signal"
  kind: observation
}
```

Every Developer Preview example uses an explicit `target:`. Do not rely on implicit emit targeting.

## 8. Change something

Change:

```text
value: "present"
```

to:

```text
value: "absent"
```

Then validate and run again:

```bash
npx --no-install cog validate observed-signal.cog
npx --no-install cog run observed-signal.cog
```

You have now completed the basic Cog authoring loop:

```text
write → validate → run → revise
```

## 9. See what Cog already knows about

Cog includes a registry of domain libraries and a catalog of runnable workflows.

List the available domain libraries:

```bash
npx --no-install cog discover
```

List runnable workflows:

```bash
npx --no-install cog workflows
```

These commands move beyond the language kernel toward reusable cognitive capabilities and applications.

## 10. The seven language statement families

The Developer Preview intentionally teaches a small language surface:

| Statement | Purpose |
| --- | --- |
| `define entity` | Declare an entity and its attributes. |
| `relate` | Declare a typed directed relationship between entities. |
| `view` | Declare a perspective on an entity. |
| `resolve` | Bind an entity to a Cog resolution level. |
| `transform` | Declare transformation intent for an explicit target. |
| `constrain` | Attach an explicit governed constraint to a target. |
| `emit` | Declare an output target and emission kind. |

Cog does not currently add loops, user-defined functions, imports, macros, or hidden general-purpose control flow to this authoring surface.

## 11. How to think about Cog

A `.cog` program is not primarily a script containing a sequence of commands. It declares inspectable cognitive structure.

A useful first mental model is:

```text
source
  ↓
semantic graph
  ↓
CoreIR
  ↓
validation + planning
  ↓
execution
  ↓
emissions + trace
```

The kernel is deliberately small. More capable cognition is layered above it:

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

This separation is important. A relation named `differs-from`, for example, records a declared semantic relation; its name alone does not cause the kernel to discover a difference. An actual comparison algorithm belongs in a higher-level implementation such as CogLib or a domain capability.

## 12. Learn Cog in three levels

### Level 1 — Language and cognitive patterns

Continue with [`LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md`](LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md).

It teaches the seven language statement families through the canonical primitive examples in:

```text
packages/cog-core/examples/primitives/
```

The learning sequence is:

1. Observation
2. Identification
3. Comparison
4. Classification
5. Relation
6. Projection
7. Resolution
8. Constraint
9. Transformation
10. Emission

These are executable repository fixtures, not illustrative pseudocode.

### Level 2 — Composable cognitive utilities

Continue with [`LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md`](LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md).

The Developer Preview CLI exposes a compact Unix-inspired toolbelt:

```text
discover
workflows
validate
lint
graph
run
trace
diff
```

The Level-2 utilities reuse existing Cog services rather than creating a second semantics implementation. The shell remains responsible for ordinary piping, redirection, and filtering.

### Level 3 — Cognitive applications

Continue with [`LEVEL_3_COGNITIVE_APPLICATIONS.md`](LEVEL_3_COGNITIVE_APPLICATIONS.md).

The capstone uses five canonical applications:

1. Research Synthesis
2. Document Review / Drift Detection
3. Decision Analysis
4. Audit Reasoning
5. Knowledge Graph

They live under:

```text
packages/cog-core/examples/applications/
```

Level 3 treats them as reference application architectures rather than autonomous cognitive agents. Actual domain algorithms remain higher-layer responsibilities.

## 13. Where to go next

Continue with:

1. `docs/LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md` — learn the ten canonical cognitive patterns and the seven statement families.
2. `docs/GOVERNED_DECISION_TUTORIAL.md` — compose the full language surface into one governed cognitive problem.
3. `docs/LEVEL_2_COMPOSABLE_COGNITIVE_UTILITIES.md` — inspect, lint, graph, trace, and compare Cog programs from the CLI.
4. `docs/LEVEL_3_COGNITIVE_APPLICATIONS.md` — study five complete cognitive application architectures.
5. `docs/LANGUAGE_SPEC_v0.4.md` — exact Developer Preview authoring syntax.
6. `docs/LANGUAGE_SEMANTIC_MODEL.md` — what Cog structures mean and how execution is interpreted.
7. `packages/cog-core/examples/pipelines/` — composed patterns.
8. `packages/cog-core/examples/graphs/` — graph-oriented examples.
9. `packages/cog-core/examples/applications/` — complete cognitive applications.
10. `docs/DEVELOPER_PREVIEW_TEACHING_SURFACE.md` — the public learning and architecture boundary.

Level 1 is the direct continuation of this guide. The governed-decision tutorial demonstrates full-language composition, Level 2 adds the developer inspection toolbelt, and Level 3 closes the path with complete application architectures.

## Troubleshooting

### `npx: command not found`

Verify that npm is installed and that `npm --version` reports version 10 or later.

### `could not determine executable to run`

Confirm that `@winmedia/cog-core` installed successfully:

```bash
npm ls @winmedia/cog-core
```

Then retry:

```bash
npx --no-install cog help
```

### Where is the installed learning pack?

For a normal local installation, open:

```text
node_modules/@winmedia/cog-core/learning/MANIFEST.md
node_modules/@winmedia/cog-core/learning/START_HERE.md
```

The installed package also contains the canonical examples under `node_modules/@winmedia/cog-core/examples/`.

### Validation reports an error

Read the reported issue and first check explicit references and targets. Relation endpoints, views, resolutions, transformations, constraints, and emissions must refer to coherent program objects.

### Older Cog documentation disagrees with this guide

For the Developer Preview, the authority order is:

```text
executable implementation
→ LANGUAGE_SPEC_v0.4.md
→ LANGUAGE_SEMANTIC_MODEL.md
→ tested canonical examples
→ Developer Preview guides/tutorials
```

Historical `GETTING_STARTED.md` and `AUTHORING_TUTORIAL.md` are retained only to avoid broken links and are not current teaching authorities.

---

Continue with [`LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md`](LEVEL_1_LANGUAGE_AND_COGNITIVE_PATTERNS.md).
