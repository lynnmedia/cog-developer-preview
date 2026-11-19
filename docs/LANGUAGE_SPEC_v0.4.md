# Cog Language Specification v0.4

Status: **Developer Preview teaching surface**

This document defines the canonical public authoring profile for the Cog language as implemented by the current `@winmedia/cog-core` lexer and parser. The executable parser is the provisional authority when implementation and older prose disagree.

Cog is a small, flat, declarative language for constructing governed semantic graphs. A Cog source file declares entities, relations, views, resolutions, transformations, constraints, and emissions. It does not provide general-purpose loops, functions, imports, or hidden control flow.

## 1. Canonical Authoring Conventions

Developer Preview examples MUST use:

- double-quoted strings;
- `//` single-line comments;
- explicit `target:` fields for `transform`, `constrain`, and `emit`;
- flat blocks;
- flat (non-nested) lists;
- levels `L1` through `L5`.

The lexer accepts some additional spellings for compatibility, including single-quoted strings. Those forms are not part of the canonical teaching profile.

## 2. Lexical Grammar

### Keywords

`define`, `entity`, `relate`, `view`, `as`, `resolve`, `to`, `transform`, `constrain`, `emit`, `true`, `false`, `null`, `L1`, `L2`, `L3`, `L4`, `L5`.

### Identifiers

Identifiers begin with an ASCII letter or underscore and may continue with ASCII letters, digits, underscore, period, or hyphen.

```text
[A-Za-z_][A-Za-z0-9_.-]*
```

Identifiers are case-sensitive.

### Strings

Canonical examples use double quotes:

```cog
"example"
```

The lexer also accepts single-quoted strings as a compatibility convenience.

### Numbers

Integers and decimal values are supported.

### Booleans and null

`true`, `false`, and `null` are supported field values.

### Levels

`L1`, `L2`, `L3`, `L4`, `L5`.

### Durations

Duration tokens are a number followed by one of:

`ms`, `s`, `m`, `min`, `h`, `d`, `w`.

`min` is normalized to minutes (`m`) internally.

### Symbols

- relation arrow: `->`
- colon: `:`
- braces: `{` `}`
- brackets: `[` `]`
- comma: `,`

### Comments

Single-line comments begin with `//` and continue to the end of the line.

## 3. Syntactic Grammar

The public authoring grammar is:

```ebnf
Program         ::= Statement*
Statement       ::= DefineEntity | Relate | View | Resolve | Transform | Constrain | Emit

DefineEntity    ::= "define" "entity" IdentifierOrString Block
Relate          ::= "relate" IdentifierOrString "->" IdentifierOrString Block
View            ::= "view" IdentifierOrString "as" Identifier Block
Resolve         ::= "resolve" IdentifierOrString "to" Level Block
Transform       ::= "transform" TransformBlock
Constrain       ::= "constrain" ConstrainBlock
Emit            ::= "emit" EmitBlock

Block           ::= "{" Field* "}"
TransformBlock  ::= "{" TransformField* "}"
ConstrainBlock  ::= "{" ConstrainField* "}"
EmitBlock       ::= "{" EmitField* "}"

Field           ::= FieldName ":" Value
TransformField  ::= Field
ConstrainField  ::= Field
EmitField       ::= Field
FieldName       ::= Identifier | "to" | "as"

Value           ::= IdentifierOrString | Number | Boolean | Null | Level | Duration | List
List            ::= "[" (Value ("," Value)*)? "]"
IdentifierOrString ::= Identifier | String
Level           ::= "L1" | "L2" | "L3" | "L4" | "L5"
```

Nested lists are not supported.

## 4. Statement Contracts

### `define entity`

Declares an entity in the semantic graph.

```cog
define entity "proposal" {
  kind: proposal
  level: L1
}
```

`kind:` is optional at parser level but should normally be present in public examples. `level:` is optional.

### `relate`

Declares a directed typed relation between two entities.

```cog
relate "evidence" -> "proposal" {
  kind: supports
}
```

`kind:` is required.

### `view`

Declares a perspective over an entity.

```cog
view "proposal" as operational {
}
```

### `resolve`

Declares a resolution target and level.

```cog
resolve "proposal" to L3 {
}
```

The block is required by the current parser, although it may be empty.

### `transform`

Declares an explicit transformation reference.

```cog
transform {
  target: "proposal"
  to: assessed
}
```

Both `target:` and `to:` are required.

A transformation declaration records governed transformation intent in CoreIR and execution planning. The kernel does not imply a universal transformation algorithm from the keyword alone; actual transformation behavior may be supplied by a library, adapter, tool, or application.

### `constrain`

Declares a constraint over an explicit target.

```cog
constrain {
  target: "proposal"
  rule: "requires-evidence"
}
```

`target:` is required. Core validation checks structural correctness and adapter-provided validation. Domain-specific rule evaluation must be implemented by the appropriate cognitive/library/domain layer rather than assumed from an arbitrary `rule:` string.

### `emit`

Declares a governed output projection.

```cog
emit {
  target: "proposal"
  kind: assessment
}
```

**Developer Preview authoring requires an explicit `target:`.**

The current parser retains a narrow backward-compatibility fallback that can infer the target when exactly one entity has been defined. That fallback is not canonical syntax, must not appear in Developer Preview examples, and may be removed in a future compatibility cleanup.

## 5. Abstract Syntax Tree

The parser maps source into a `ProgramNode` AST. Every statement becomes a typed AST node and carries source-span information for diagnostics.

Statement node families are:

- `DefineEntityNode`
- `RelateNode`
- `ViewNode`
- `ResolveNode`
- `TransformNode`
- `ConstrainNode`
- `EmitNode`

Blocks are represented as flat arrays of `FieldNode` values.

## 6. Intermediate Representation

Compilation produces `CoreIR`, containing:

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

CoreIR is the inspectable governed representation between source authoring and runtime execution.

## 7. Validation, Planning, Execution, and Trace

The canonical consumer pipeline is:

```text
LEX → PARSE → COMPILE → VALIDATE → PLAN → EXECUTE → EMISSIONS + TRACE
```

`executeCog()` also performs validation and planning internally before running its plan.

The execution plan uses four kernel phases:

1. `bind` — bind entity/reference state;
2. `transform` — execute the declared transformation plan step and preserve its reference in trace state;
3. `validate` — represent the governed validation phase;
4. `emit` — create outbound emission payloads.

Every execution returns a trace. Structural execution is deterministic for the same CoreIR, context, and adapter behavior.

## 8. Domain Adapter Contract

The kernel is ontology-agnostic. Domain adapters may specialize execution through hooks such as:

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
  createDomainTrace?(trace: CoreExecutionTrace, ir: CoreIR): Promise<unknown>;
}
```

Adapters specialize neutral kernel structures; they do not redefine the core language grammar.

## 9. Explicit Non-Goals for the Developer Preview

The v0.4 teaching surface does not include:

- loops;
- user-defined functions;
- imports;
- macros;
- nested block control flow;
- implicit cognitive inference from keyword names;
- direct mutation of CoreIR as an authoring mechanism.

The language remains intentionally small so that cognitive structure, transformation intent, constraints, emissions, and traces remain inspectable.
