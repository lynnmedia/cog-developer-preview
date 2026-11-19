# Cog Language Specification v0.4

This document defines the formal grammar, AST structures, intermediate representation, and execution contract for the Cog language version 0.4.

## 1. Lexical Grammar

### Tokens
- **Keywords**: `define`, `entity`, `relate`, `view`, `as`, `resolve`, `to`, `transform`, `constrain`, `emit`.
- **Identifiers**: Regex `[a-zA-Z_][a-zA-Z0-9_-]*`. Case-sensitive.
- **Strings**: Characters enclosed in double quotes `"[^"]*"`.
- **Levels**: Keyword `L` followed by digits `1` to `5` (e.g. `L1`, `L2`, `L3`, `L4`, `L5`).
- **Operators / Symbols**:
  - Arrow: `->`
  - Colon: `:`
  - Left Brace: `{`
  - Right Brace: `}`
- **Comments**: Single-line comments start with `//` and extend to the end of the line.

---

## 2. Syntactic Grammar (EBNF)

```ebnf
Program         ::= Statement*
Statement       ::= DefineEntity | Relate | View | Resolve | Transform | Constrain | Emit

DefineEntity    ::= "define" "entity" IdentifierOrString Block
Relate          ::= "relate" IdentifierOrString "->" IdentifierOrString Block
View            ::= "view" IdentifierOrString "as" Identifier Block
Resolve         ::= "resolve" IdentifierOrString "to" Level Block?
Transform       ::= "transform" IdentifierOrString Block
Constrain       ::= "constrain" IdentifierOrString Block
Emit            ::= "emit" IdentifierOrString Block?

Block           ::= "{" Field* "}"
Field           ::= Identifier ":" Value
Value           ::= IdentifierOrString | Level | Duration | List
List            ::= "[" (Value ("," Value)*)? "]"
Duration        ::= Digit+ ("ms" | "s" | "m" | "h")

IdentifierOrString ::= Identifier | String
```

---

## 3. Abstract Syntax Tree (AST)

The parser maps the token stream to a `ProgramNode` AST:
- Every statement is mapped to a typed node (e.g., `DefineEntityNode`, `RelateNode`, etc.) containing a `SourceSpan` (line, column, character offset range) for precise syntax diagnostics.
- Blocks are parsed into arrays of `FieldNode` containing the field key name and value node.

---

## 4. Intermediate Representation (IR)

The compiler compiles the AST into a schema-enforced `CoreIR` shape:

```ts
interface CoreIR {
  entities: CoreEntity[];
  relations: CoreRelation[];
  views: CoreView[];
  resolutions: CoreResolution[];
  transformations: CoreTransformation[];
  constraints: CoreConstraint[];
  emissions: CoreEmission[];
  graph: {
    nodes: CoreGraphNode[];
    edges: CoreGraphEdge[];
  };
  meta: {
    compilerVersion: string;
    statementCount: number;
    entityIndex: Record<string, string>;
  };
}
```

---

## 5. Execution Model and Determinism

The Cog runtime execution contract requires:
1. **Single-Pass Evaluation**: Computation proceeds forward in-memory from graph assembly to emissions.
2. **Deterministic Timeline**: The planner converts the `CoreIR` into a stable `CoreExecutionPlan` comprising:
   - `bind` phase: Resolves entity levels and values.
   - `transform` phase: Performs declared structural updates.
   - `validate` phase: Executes core validation policies and user-defined constraints.
   - `emit` phase: Formulates outbound emissions payloads.
3. **Execution Trace**: Every run produces a `CoreExecutionTrace` recording step results, timings (timestamps), success states, and errors.

---

## 6. Domain Adapter Contract

Domain adapters must implement a subset of the `CogDomainAdapter` interface to specialize kernel behavior:

```ts
interface CogDomainAdapter {
  adapterId: string;
  version: string;
  mapEntityKind?(kind: string): string;
  mapRelationKind?(kind: string): string;
  mapViewKind?(kind: string): string;
  mapLevel?(level: CoreLevel): string;
  validateProgram?(ir: CoreIR, context: CoreExecutionContext): Promise<AdapterValidationResult>;
  enrichPlan?(plan: CoreExecutionPlan, ir: CoreIR, context: CoreExecutionContext): Promise<CoreExecutionPlan>;
  mapEmission?(emission: CoreEmission, ir: CoreIR, context: CoreExecutionContext): Promise<DomainEmissionSpec>;
  resolveExternalRef?(ref: ObjectRef, context: CoreExecutionContext): Promise<ObjectRef | null | undefined>;
  /** @deprecated Use resolveExternalRef. */
  loadCanonicalRef?(ref: ObjectRef, context: CoreExecutionContext): Promise<ObjectRef | null | undefined>;
  createDomainTrace?(trace: CoreExecutionTrace, ir: CoreIR): Promise<unknown>;
}
```
