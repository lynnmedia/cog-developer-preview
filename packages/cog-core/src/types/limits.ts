/**
 * Bounded resource limits policy for the Cog cognition-kernel.
 */
export const COG_RESOURCE_LIMITS = {
  MAX_SOURCE_SIZE_BYTES: 100 * 1024, // 100 KB
  MAX_ENTITY_COUNT: 1000,
  MAX_EXECUTION_STEPS: 500,
  MAX_TRACE_STEPS: 1000,
  MAX_GRAPH_DEPTH: 50,
  MAX_DEPENDENCY_BREADTH: 50,
} as const;
