# Level 2 — Composable Cognitive Utilities

Level 2 moves from **writing Cog structures** to **working with them as a developer**.

Level 1 taught the language and ten recurring cognitive patterns. The governed-decision tutorial showed those structures composing into one program. Level 2 adds a small command vocabulary for inspecting, checking, executing, and comparing Cog programs.

The design is Unix-inspired in one specific sense:

> each command should do one developer-facing job, produce inspectable output, and compose with the ordinary shell.

Cog does **not** reimplement Unix pipes, files, `grep`, or `diff`. The shell already provides those mechanisms. Cog provides cognition-specific operations over `.cog` programs, CoreIR, semantic graphs, and execution traces.

## 1. The Level-2 toolbelt

The Developer Preview CLI now exposes:

| Command | Cognitive-development job | Existing implementation reused |
| --- | --- | --- |
| `discover` | List available domain capability libraries | `DiscoveryService` |
| `workflows` | List runnable workflow definitions | `WorkflowCatalogService` |
| `validate <file>` | Check whether compiled Cog structure is valid | `validateCog()` |
| `lint <file>` | Find structural workflow smells | `WorkflowLinter` |
| `graph <file>` | Render the compiled semantic structure as Mermaid | `WorkflowGraphViewerService` |
| `run <file>` | Execute a valid Cog program | `executeCog()` |
| `trace <file>` | Inspect the execution path and phases | `TraceExplorer` over the runtime trace |
| `diff <before> <after>` | Compare two execution traces | `TraceDiffVisualizer` |

For a normal project-local installation, this guide uses:

```bash
npx --no-install cog <command>
```

If `cog` is already on your PATH, the shorter `cog <command>` form is equivalent.

## 2. The mental model

Level 2 gives you several views of the same program:

```text
.cog source
   │
   ├── validate ──→ structural validity
   ├── lint ──────→ structural smells
   ├── graph ─────→ semantic graph view
   ├── run ───────→ emissions + execution
   └── trace ─────→ execution path
                         │
                         └── diff ──→ change between execution paths
```

These commands do not introduce new language semantics. They expose already-existing compiler, validator, runtime, graph, lint, and trace services through a compact CLI.

---

# 3. `discover` — inspect the capability namespace

Use:

```bash
npx --no-install cog discover
```

The command lists domain libraries registered with Cog.

Think of it loosely as an `ls` over the **available cognitive capability namespace**. It answers:

> What domain libraries does this installation know about?

It does not load every library into a program or execute any domain cognition merely by listing it.

A shell can further filter the text:

```bash
npx --no-install cog discover | grep decision
```

The pipe and `grep` are shell behavior; `discover` simply emits inspectable text.

---

# 4. `workflows` — inspect runnable workflow definitions

Use:

```bash
npx --no-install cog workflows
```

This lists the runnable workflow catalog known to the current package.

The distinction from `discover` is useful:

```text
discover  → what libraries/capability domains exist?
workflows → what runnable workflow definitions are cataloged?
```

This is closer to a small `find` or command catalog than to execution itself.

---

# 5. `validate` — check the structural contract

Use:

```bash
npx --no-install cog validate program.cog
```

`validate` lexes, parses, compiles, and structurally validates the program.

A successful result reports:

```text
Validation passed successfully!
```

Validation is the **correctness gate** for the current kernel. It checks structural invariants such as coherent references and required fields. It does not automatically evaluate every arbitrary domain rule represented by a string attribute.

A useful authoring loop is:

```text
edit → validate → edit → validate
```

Use `validate` before interpreting lint warnings or runtime output as meaningful.

---

# 6. `lint` — inspect structural smells

Use:

```bash
npx --no-install cog lint program.cog
```

`lint` compiles the program and passes its CoreIR to the existing `WorkflowLinter`.

The current linter detects structural smells including:

- orphaned entities;
- unused resolutions;
- repeated transformations on one target;
- circular relation graphs;
- disconnected graph components that do not lead to an emission.

If no issues are found:

```text
Lint passed with no workflow issues.
```

Lint findings are warnings, not automatic validation failures. That separation is deliberate:

```text
validate → Is this structure acceptable to the kernel?
lint     → Does this acceptable structure contain suspicious workflow shapes?
```

This mirrors the distinction between a compiler/type checker and a conventional source linter.

A useful combined check is:

```bash
npx --no-install cog validate program.cog && \
npx --no-install cog lint program.cog
```

The `&&` is ordinary shell composition.

---

# 7. `graph` — inspect semantic structure spatially

Use:

```bash
npx --no-install cog graph program.cog
```

The command compiles the source and delegates to `WorkflowGraphViewerService`. It prints a Mermaid flowchart describing entities, typed relations, resolutions, and emissions.

Typical output begins:

```text
graph TD
```

This makes `graph` analogous to tools such as `tree`, `dot`, or other structural viewers: it changes the **view** of the program, not the semantics of the program.

Because the output is plain Mermaid text, ordinary shell redirection works:

```bash
npx --no-install cog graph program.cog > program.mmd
```

That file can then be inspected or rendered by any Mermaid-compatible tool. Cog itself is only responsible for producing the graph representation.

Use `graph` when you need to answer questions such as:

- What entities are represented?
- Which typed relations connect them?
- What is resolved?
- What eventually reaches an emission?

---

# 8. `run` — execute the governed structure

Use:

```bash
npx --no-install cog run program.cog
```

`run` validates the compiled program and executes it through the Cog runtime.

A successful execution reports the number of emitted payloads.

`run` remains intentionally concise. It answers:

> Did the governed program execute successfully, and how many emissions did it produce?

For the execution path itself, use `trace`.

---

# 9. `trace` — inspect execution rather than only output

Use:

```bash
npx --no-install cog trace program.cog
```

`trace` executes the program and then exposes its runtime `CoreExecutionTrace` through `TraceExplorer`.

The output lists execution steps with:

- step id;
- phase;
- status;
- selected duration;
- runtime message when one exists.

Cog's core execution phases are:

```text
bind → transform → validate → emit
```

To inspect only one phase:

```bash
npx --no-install cog trace program.cog --phase transform
```

This is the closest Level-2 analogue to tools such as `strace`: it makes **what execution did** inspectable rather than treating the final output as a black box.

The analogy is limited. `trace` reports Cog execution-plan activity, not operating-system system calls.

You can use ordinary shell filtering as well:

```bash
npx --no-install cog trace program.cog | grep emit
```

---

# 10. `diff` — compare cognitive execution paths

Use:

```bash
npx --no-install cog diff before.cog after.cog
```

`diff` does **not** compare source text. It:

1. compiles and executes `before.cog`;
2. compiles and executes `after.cog`;
3. obtains both runtime traces;
4. delegates to `TraceDiffVisualizer`;
5. reports added, removed, or modified trace steps and the aggregate duration shift.

This makes the command semantically different from the operating-system `diff` utility:

```text
text diff   → what characters or lines changed?
Cog diff    → what changed in the represented execution path?
```

Both programs must execute successfully before the traces are compared.

A useful development sequence is therefore:

```bash
npx --no-install cog validate before.cog
npx --no-install cog validate after.cog
npx --no-install cog diff before.cog after.cog
```

For source-level changes, continue using your normal version-control or text-diff tools.

---

# 11. A Unix-like cognitive workflow

The value of Level 2 is not any one command. It is the ability to ask a sequence of small questions without writing a TypeScript harness.

For example:

```bash
npx --no-install cog validate proposal.cog && \
npx --no-install cog lint proposal.cog && \
npx --no-install cog graph proposal.cog > proposal.mmd && \
npx --no-install cog trace proposal.cog
```

That sequence means:

```text
Is it valid?
   ↓
Does it smell structurally suspicious?
   ↓
What semantic graph did I declare?
   ↓
What execution path did Cog actually take?
```

After revising the program:

```bash
npx --no-install cog diff proposal-before.cog proposal-after.cog
```

Now the developer can inspect the effect of a cognitive-program change at the execution-trace level.

## Why this is "composable cognition"

The commands are not themselves cognition algorithms. They are small instruments for working with governed cognitive structures.

Their composition creates a developer reasoning loop:

```text
discover
   ↓
author
   ↓
validate
   ↓
lint
   ↓
graph
   ↓
run
   ↓
trace
   ↓
diff
   ↓
revise
```

The program remains declarative. The toolbelt makes its structure and execution progressively more inspectable.

---

# 12. What Level 2 deliberately does not add

Level 2 does not add:

- new `.cog` keywords;
- Unix pipe semantics inside Cog;
- a second parser or execution engine;
- hidden inference behind CLI command names;
- automatic domain cognition;
- a replacement for Git or ordinary text diff tools;
- a GUI requirement.

Each utility is a CLI exposure of an existing Cog service or kernel operation.

That architectural rule matters:

```text
CLI command
    ↓
existing Cog service / kernel API
    ↓
one semantic implementation
```

not:

```text
CLI command
    ↓
new parallel semantics
```

---

# 13. Level-2 command reference

```text
cog discover
cog workflows
cog validate <file>
cog lint <file>
cog graph <file>
cog run <file>
cog trace <file> [--phase <phase>]
cog diff <before.cog> <after.cog>
```

For project-local installation, prefix these commands with `npx --no-install`.

The packed-consumer test installs the generated package into a clean downstream project and exercises this CLI surface through the installed executable.

---

# 14. Where to go next

You have now learned Cog from three directions:

```text
Level 1
language + cognitive patterns
        ↓
Governed Decision Tutorial
full-program composition
        ↓
Level 2
inspection + execution utilities
```

The next learning level is **Level 3 — Cognitive Applications**.

Level 3 should move from developer instruments to consequential application shapes, beginning with:

1. Research Synthesis
2. Document Review / Drift Detection
3. Decision Analysis

and then extending to Audit Reasoning and Knowledge Graph applications.
