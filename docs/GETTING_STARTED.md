# Getting Started with Cog

Cog is a TypeScript cognition kernel and package system for the `.cog` language. This guide takes you from a clean Node project to compiling, validating, executing, and inspecting your first cog workflow.

## 1. Prerequisites

- Node.js 20.x
- npm 10+

Verify:

```bash
node --version
npm --version
```

## 2. Create a Clean Consumer Project

```bash
mkdir my-first-cog
cd my-first-cog
npm init -y
npm install --save-dev typescript tsx @types/node
npm install @cog/core
npx tsc --init
```

During Developer Preview validation, `@cog/core` may instead be installed from a locally packed `.tgz`. The consumer must not import source files or repository-internal paths.

## 3. Write `workflow.cog`

```cog
define entity "user-request" {
  kind: "record"
  level: L1
}

define entity "user-profile" {
  kind: "record"
  level: L1
}

define entity "risk-assessment" {
  kind: "assessment"
  level: L2
}

relate "user-request" -> "user-profile" {
  kind: "references"
}

relate "risk-assessment" -> "user-request" {
  kind: "derived_from"
}

resolve "risk-assessment" to L2 {}

emit {
  target: "risk-assessment"
  kind: "assessment-completed"
}
```

The point is not ordinary computation. The workflow declares meaningful entities, their relations, a governed resolution state, and an explicit emission.

## 4. Compile, Validate, and Execute

Create `run.ts`:

```typescript
import * as fs from "node:fs";
import {
  lex,
  parseCog,
  compileCog,
  validateCog,
  executeCog,
  type CoreExecutionContext
} from "@cog/core";

async function main() {
  const source = fs.readFileSync("workflow.cog", "utf8");
  const tokens = lex(source);
  const ast = parseCog(tokens);
  const ir = compileCog(ast);

  const validation = await validateCog(ir);
  if (!validation.valid) {
    console.error(validation.issues);
    process.exit(1);
  }

  const context: CoreExecutionContext = {
    runId: "getting-started-run",
    mode: "batch",
    startedAt: new Date().toISOString()
  };

  const result = await executeCog(ir, context);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Run it:

```bash
npx tsx run.ts
```

## 5. What to Inspect

A successful run gives you more than a return value. Inspect:

- validation results;
- resolved bindings;
- emissions;
- execution trace;
- any constraints or diagnostics produced by the workflow.

The trace is part of the cognitive contract: it lets a consumer inspect how declared meaning moved through the runtime.

## 6. Learn the Language

Next read:

1. `docs/AUTHORING_TUTORIAL.md` - progressive `.cog` authoring
2. `docs/DOMAIN_LIBRARY_TUTORIALS.md` - domain-oriented usage
3. `packages/cog-core/examples` - executable examples

Useful language statements include `define`, `relate`, `view`, `resolve`, `transform`, `constrain`, and `emit`.

## 7. Developer Preview Boundary

`@cog/core` is the primary public language/kernel package. Adapters are optional domain integrations. Cognitive Workspace and Book Assistant are downstream applications and are not required to learn or embed cog.

The Developer Preview does not promise 1.0 API stability. Prefer documented public exports and avoid repository-internal imports.
