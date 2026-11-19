/**
 * CogLib Cognitive Instrument: Provenance & Lineage Instrument
 *
 * Observational instrument projecting the end-to-end provenance graph,
 * cross-runtime transfer sequence, and declared mutation lineage:
 * source -> routine -> memory -> tool evidence -> domain capability -> CogOP exchange -> current object
 */

import { CognitiveInstrument, InstrumentObservationReport, InstrumentFinding } from "../cognitiveInstrumentContract";
import { CognitiveObjectEnvelope } from "../cognitiveObjectEnvelope";
import { ToolResultEvidence } from "../toolEpistemicContract";

export type LineageStepKind =
  | "genesis"
  | "routine_execution"
  | "memory_retrieval"
  | "tool_evidence_ingestion"
  | "capability_mounting"
  | "cogop_cross_runtime"
  | "declared_mutation";

export interface LineageEdge {
  readonly edgeId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly stepKind: LineageStepKind;
  readonly actorRuntime: string;
  readonly timestamp?: string;
  readonly actionSummary: string;
  readonly authorityTier?: string;
  readonly epistemicDeltaSummary?: string;
}

export interface ProvenanceLineageInput {
  readonly envelope?: CognitiveObjectEnvelope;
  readonly targetObject?: Record<string, any>;
  readonly priorLineage?: readonly string[];
  readonly attachedEvidence?: readonly ToolResultEvidence[];
}

export interface ProvenanceLineageProjection {
  readonly objectId: string;
  readonly originRuntime: string;
  readonly createdAt: string;
  readonly totalSteps: number;
  readonly runtimesInvolved: readonly string[];
  readonly sourceAnchors: readonly string[];
  readonly lineageGraph: {
    readonly nodes: ReadonlyArray<{ id: string; label: string; kind: string }>;
    readonly edges: readonly LineageEdge[];
  };
  readonly timeline: readonly LineageEdge[];
}

export const provenanceLineageInstrument: CognitiveInstrument<ProvenanceLineageInput, ProvenanceLineageProjection> = {
  instrumentId: "instrument:provenance-lineage",
  version: "1.0.0",
  purpose: "Reveal and project end-to-end cross-runtime provenance, transformation history, and mutation lineage",
  projectionType: "timeline",
  acceptedObjectTypes: ["cognitive_object_envelope", "cognitive_state_snapshot", "domain_object"],
  requiredEvidence: ["provenance_and_grounding"],
  observedDimensions: [
    "lineage_depth",
    "runtime_distribution",
    "source_anchor_density",
    "cross_boundary_transfers",
    "mutation_attributability",
  ],
  limitations: [
    "Observational projection only; reflects declared lineage without inventing missing historical steps",
  ],
  failureModes: [
    {
      code: "EMPTY_PROVENANCE_ORIGIN",
      description: "Artifact lacks origin runtime or creation metadata",
      mitigation: "Emit high-severity finding warning of untraceable cognitive genesis",
    },
  ],
  project(input: ProvenanceLineageInput): InstrumentObservationReport<ProvenanceLineageProjection> {
    const env = input.envelope;
    const target = input.targetObject ?? env?.payload ?? {};
    const objectId = env?.objectId ?? target.id ?? "obj:lineage-target";

    const originRuntime = env?.provenance?.originRuntime ?? target.originRuntime ?? "runtime:unknown";
    const createdAt = env?.provenance?.createdAt ?? target.createdAt ?? new Date().toISOString();
    const sourceAnchors = env?.grounding?.sourceAnchors ?? target.sourceAnchors ?? [];

    const rawLineage: string[] = env?.provenance?.lineage ?? input.priorLineage ?? target.lineage ?? ["genesis"];
    const runtimesSet = new Set<string>([originRuntime]);

    const nodes: Array<{ id: string; label: string; kind: string }> = [
      { id: "node-genesis", label: `Genesis (${originRuntime})`, kind: "genesis" },
    ];
    const edges: LineageEdge[] = [];

    // 1. Trace Raw Lineage Steps
    let prevNodeId = "node-genesis";
    for (let i = 0; i < rawLineage.length; i++) {
      const step = rawLineage[i]!;
      if (step === "genesis" && i === 0) continue;

      const currNodeId = `step-${i + 1}`;
      let stepKind: LineageStepKind = "routine_execution";
      let actorRuntime = originRuntime;

      if (step.includes("transformed_by(")) {
        stepKind = "cogop_cross_runtime";
        const match = step.match(/transformed_by\(([^)]+)\)/);
        if (match && match[1]) {
          actorRuntime = match[1];
          runtimesSet.add(actorRuntime);
        }
      } else if (step.includes("mom:") || step.includes("science:") || step.includes("capability:")) {
        stepKind = "capability_mounting";
      }

      nodes.push({ id: currNodeId, label: step, kind: stepKind });
      edges.push({
        edgeId: `edge-${prevNodeId}->${currNodeId}`,
        fromNodeId: prevNodeId,
        toNodeId: currNodeId,
        stepKind,
        actorRuntime,
        actionSummary: step,
      });
      prevNodeId = currNodeId;
    }

    // 2. Trace Attached Tool Evidence Entries
    const evidenceList = input.attachedEvidence ?? [];
    for (let j = 0; j < evidenceList.length; j++) {
      const ev = evidenceList[j]!;
      const evNodeId = `ev-${ev.evidenceId}`;
      nodes.push({ id: evNodeId, label: `Evidence: ${ev.epistemicRole}`, kind: "tool_evidence" });
      edges.push({
        edgeId: `edge-${evNodeId}->${prevNodeId}`,
        fromNodeId: evNodeId,
        toNodeId: prevNodeId,
        stepKind: "tool_evidence_ingestion",
        actorRuntime: ev.provenance.toolId,
        timestamp: ev.observedAt,
        actionSummary: `Ingested ${ev.evidentiaryStrength} ${ev.epistemicRole} evidence`,
        authorityTier: ev.governanceAuthority,
        epistemicDeltaSummary: `Confidence ${ev.confidence}`,
      });
    }

    // 3. Trace Declared Mutations
    const mutations = env?.declaredMutations ?? [];
    for (let k = 0; k < mutations.length; k++) {
      const m = mutations[k]!;
      runtimesSet.add(m.transformerRuntime);
      const mutNodeId = `mut-${k + 1}`;
      nodes.push({ id: mutNodeId, label: `Mutation: ${m.action} (${m.field})`, kind: "mutation" });
      edges.push({
        edgeId: `edge-${prevNodeId}->${mutNodeId}`,
        fromNodeId: prevNodeId,
        toNodeId: mutNodeId,
        stepKind: "declared_mutation",
        actorRuntime: m.transformerRuntime,
        timestamp: m.timestamp,
        actionSummary: `${m.action} on ${m.field}: ${m.rationale}`,
        epistemicDeltaSummary: m.newValueSummary ? `${m.previousValueSummary ?? "none"} -> ${m.newValueSummary}` : undefined,
      });
      prevNodeId = mutNodeId;
    }

    const runtimesInvolved = Array.from(runtimesSet);

    // 4. Build Findings
    const findings: InstrumentFinding[] = [];
    if (runtimesInvolved.length > 1) {
      findings.push({
        findingId: "finding:lineage:cross-runtime-transfer",
        dimension: "cross_boundary_transfers",
        severity: "info",
        summary: `Cognitive artifact traversed ${runtimesInvolved.length} heterogeneous runtimes`,
        details: { runtimesInvolved },
        sourceEvidence: runtimesInvolved,
        epistemicStatus: "OBSERVED",
      });
    }

    if (mutations.length > 0) {
      findings.push({
        findingId: "finding:lineage:declared-mutations",
        dimension: "mutation_attributability",
        severity: "info",
        summary: `Recorded ${mutations.length} traceable declared mutations`,
        details: { mutationCount: mutations.length },
        sourceEvidence: mutations.map((m) => m.field),
        epistemicStatus: "DERIVED",
      });
    }

    const structuredProjection: ProvenanceLineageProjection = {
      objectId,
      originRuntime,
      createdAt,
      totalSteps: nodes.length,
      runtimesInvolved,
      sourceAnchors,
      lineageGraph: {
        nodes,
        edges,
      },
      timeline: edges,
    };

    return {
      instrumentId: "instrument:provenance-lineage",
      instrumentVersion: "1.0.0",
      projectedAt: new Date().toISOString(),
      sourceObjectId: objectId,
      projectionType: "timeline",
      findings,
      structuredProjection,
      limitationsSurfaced: [
        "Observational projection only; reflects declared lineage without inventing missing history",
      ],
      provenanceChain: [originRuntime, ...runtimesInvolved],
    };
  },
};
