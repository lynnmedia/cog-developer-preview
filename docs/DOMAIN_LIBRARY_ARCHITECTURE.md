# Cog Domain Library Architecture

This document defines the shared architecture, directory structure, export patterns, validation criteria, and cataloging conventions for cognitive domain libraries in the `cog` repository.

---

## 1. Directory Structure

All domain libraries reside under the `@winmedia/cog-core` package within the `packages/cog-core/src/domain/` directory. This keeps domain reasoning patterns first-class and statically discoverable.

```
packages/cog-core/src/domain/
├── contract.ts               # Standard Domain Library conformance contracts
├── registry.ts               # Discovery and capability registry
├── research/                 # Research Synthesis domain library
│   ├── index.ts
│   ├── patterns.ts
│   └── researchLibrary.ts
├── editorial/                # Editorial Review domain library
│   ├── index.ts
│   ├── patterns.ts
│   └── editorialLibrary.ts
├── decision/                 # Decision Analysis domain library
│   ├── index.ts
│   ├── patterns.ts
│   └── decisionLibrary.ts
├── audit/                    # Audit Reasoning domain library
│   ├── index.ts
│   ├── patterns.ts
│   └── auditLibrary.ts
└── graph/                    # Knowledge Graph domain library
    ├── index.ts
    ├── patterns.ts
    └── graphLibrary.ts
```

---

## 2. Naming Conventions

1. **Directories**: Lowercase kebab-case matching the domain purpose (e.g. `research`, `editorial`, `decision`).
2. **Library Object**: CamelCase with `Library` suffix (e.g., `researchLibrary`, `editorialLibrary`).
3. **Registry Identifiers**: Formal string identifiers using `cog:domain:<name>` (e.g. `cog:domain:research`, `cog:domain:editorial`).

---

## 3. Standard Exports and Contracts

Every domain library must implement and export a common contract defined in `contract.ts`:

```typescript
export interface DomainLibrary {
  id: string; // e.g. "cog:domain:research"
  name: string; // Human readable name
  description: string;
  capabilities: string[]; // List of semantic capabilities supported
  supportedPatterns: string[]; // Names of composition patterns available
  generate(params: Record<string, any>): string; // Generates a valid .cog source program string
}
```

---

## 4. Discovery and Registry

A central registry (`registry.ts`) exposes all active domain libraries.

- Discovery: Allows programmatic retrieval of a library by its ID or capability.
- Neutrality: Registry provides descriptive metadata and generation primitives, avoiding runtime execution authority or tight coupling to external platforms (e.g., AWB).

---

## 5. Composition and Pipelines

Domain libraries are designed to be composable. Output structures from one library (e.g., claims/synthesis from a research library) can be piped as input parameters into another library (e.g., editorial review or decision analysis).

Composition does not require modifying the underlying `.cog` language parser or runtime. It is achieved at the template/generator layer by nesting or sequencing entity and relationship declarations.

---

## 6. Validation and Test Standards

All domain libraries must satisfy three levels of testing:
1. **Compilation Validation**: The generated `.cog` string must lex and parse successfully.
2. **Execution Validation**: The resulting `CoreIR` must compile, plan, and execute successfully on the core runtime.
3. **Semantics/Contracts Check**: The output of the run must conform to expected domain structures (e.g. specific entity kinds, resolution levels, and emitted attributes).
