import type { ProgramNode } from "../types/ast";
import type { CoreExecutionGraph, CoreIR } from "../types/ir";
import { compileCog } from "./compileCog";

const SEMANTIC_VERSION = "v0.4";
const BOUNDARY_FINGERPRINT = "cog-core:v0.4:incremental-graph-state:1";

export type IncrementalInvalidationReason =
  | "stale_state"
  | "source_changed"
  | "dependency_graph_changed";

export interface IncrementalCompileState {
  compilerVersion: string;
  semanticVersion: typeof SEMANTIC_VERSION;
  boundaryFingerprint: typeof BOUNDARY_FINGERPRINT;
  sourceFingerprint: string;
  dependencyFingerprint: string;
  graph: CoreExecutionGraph;
}

export interface IncrementalCompileResult {
  ir: CoreIR;
  state: IncrementalCompileState;
  reusedGraph: boolean;
  invalidationReasons: IncrementalInvalidationReason[];
}

export function compileCogIncremental(
  program: ProgramNode,
  options: {
    previousState?: IncrementalCompileState;
  } = {},
): IncrementalCompileResult {
  const ir = compileCog(program);
  const currentState = createIncrementalState(program, ir);
  const previousState = options.previousState;

  if (!previousState) {
    return {
      ir,
      state: currentState,
      reusedGraph: false,
      invalidationReasons: [],
    };
  }

  const invalidationReasons = getInvalidationReasons(previousState, currentState);

  if (invalidationReasons.length > 0) {
    return {
      ir,
      state: currentState,
      reusedGraph: false,
      invalidationReasons,
    };
  }

  ir.graph = previousState.graph;

  return {
    ir,
    state: {
      ...currentState,
      graph: previousState.graph,
    },
    reusedGraph: true,
    invalidationReasons: [],
  };
}

function createIncrementalState(
  program: ProgramNode,
  ir: CoreIR,
): IncrementalCompileState {
  return {
    compilerVersion: ir.meta.compilerVersion,
    semanticVersion: SEMANTIC_VERSION,
    boundaryFingerprint: BOUNDARY_FINGERPRINT,
    sourceFingerprint: stableFingerprint(program),
    dependencyFingerprint: graphFingerprint(ir.graph),
    graph: cloneGraph(ir.graph),
  };
}

function getInvalidationReasons(
  previousState: IncrementalCompileState,
  currentState: IncrementalCompileState,
): IncrementalInvalidationReason[] {
  if (!isReusableState(previousState, currentState)) {
    return ["stale_state"];
  }

  const reasons: IncrementalInvalidationReason[] = [];

  if (previousState.sourceFingerprint !== currentState.sourceFingerprint) {
    reasons.push("source_changed");
  }

  if (previousState.dependencyFingerprint !== currentState.dependencyFingerprint) {
    reasons.push("dependency_graph_changed");
  }

  return reasons;
}

function isReusableState(
  previousState: IncrementalCompileState,
  currentState: IncrementalCompileState,
): boolean {
  return previousState.compilerVersion === currentState.compilerVersion
    && previousState.semanticVersion === currentState.semanticVersion
    && previousState.boundaryFingerprint === currentState.boundaryFingerprint
    && typeof previousState.sourceFingerprint === "string"
    && typeof previousState.dependencyFingerprint === "string"
    && isGraph(previousState.graph);
}

function graphFingerprint(graph: CoreExecutionGraph): string {
  return stableFingerprint({
    nodes: [...graph.nodes].sort((left, right) => left.id.localeCompare(right.id)),
    edges: [...graph.edges].sort((left, right) => stableFingerprint(left).localeCompare(stableFingerprint(right))),
  });
}

function cloneGraph(graph: CoreExecutionGraph): CoreExecutionGraph {
  return {
    nodes: graph.nodes.map((node) => ({ ...node })),
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}

function stableFingerprint(value: unknown): string {
  return JSON.stringify(toStableValue(value));
}

function toStableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => toStableValue(item));
  }

  if (!isPlainRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "span")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, toStableValue(item)]),
  );
}

function isGraph(value: unknown): value is CoreExecutionGraph {
  return isPlainRecord(value)
    && Array.isArray(value.nodes)
    && Array.isArray(value.edges);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
