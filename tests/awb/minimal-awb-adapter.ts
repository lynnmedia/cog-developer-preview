import type { CogDomainAdapter, CoreIR } from "@winmedia/cog-core";

export interface AwbNormalizedAuditOperation {
  operation_id: string;
  operation_kind: string;
  subject_ref: string;
  status: string;
}

const COMPILER_VERSION = "0.3.0";

export const awbAdapter: CogDomainAdapter = {
  adapterId: "awb",
  version: COMPILER_VERSION,
  mapEntityKind(kind: string): string {
    return kind;
  },
};

export function projectNormalizedAwbOperationToCoreIr(
  operation: AwbNormalizedAuditOperation,
): CoreIR {
  return {
    entities: [
      {
        id: operation.operation_id,
        name: operation.operation_id,
        entityKind: awbAdapter.mapEntityKind(operation.operation_kind),
        attributes: {
          subject_ref: operation.subject_ref,
          status: operation.status,
        },
      },
    ],
    relations: [],
    views: [],
    resolutions: [],
    transformations: [],
    constraints: [],
    emissions: [],
    graph: {
      nodes: [
        {
          id: operation.operation_id,
          kind: "entity",
          ref: operation.operation_id,
        },
      ],
      edges: [],
    },
    meta: {
      compilerVersion: COMPILER_VERSION,
      compiledAt: new Date().toISOString(),
      statementCount: 1,
      entityIndex: {
        [operation.operation_id]: operation.operation_id,
      },
    },
  };
}
