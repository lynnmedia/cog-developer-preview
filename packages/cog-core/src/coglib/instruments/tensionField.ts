/**
 * CogLib Cognitive Instrument: Tension Field
 *
 * Observational instrument projecting unresolved cognitive tensions,
 * competing claims, downstream dependency implications, and conflict topology
 * without resolving, suppressing, or adjudicating the tension.
 */

import { CognitiveInstrument, InstrumentObservationReport, InstrumentFinding } from "../cognitiveInstrumentContract";
import { CognitiveObjectEnvelope } from "../cognitiveObjectEnvelope";

export type TensionEpistemicStatus = "UNRESOLVED" | "QUALIFIED" | "RESOLVED" | "SUPERFICIAL";

export interface TensionVector {
  readonly tensionId: string;
  readonly title: string;
  readonly description: string;
  readonly competingPositions: readonly string[];
  readonly sourceGrounding: readonly string[];
  readonly epistemicStatus: TensionEpistemicStatus;
  readonly affectedAssumptions: readonly string[];
  readonly affectedConclusions: readonly string[];
  readonly downstreamDependentObjects: readonly string[];
  readonly scope: string;
  readonly severity: "minor" | "material" | "critical";
}

export interface TensionFieldInput {
  readonly envelope?: CognitiveObjectEnvelope;
  readonly targetObject?: Record<string, any>;
  readonly explicitTensions?: readonly TensionVector[];
  readonly dependentObjectManifest?: ReadonlyArray<{ objectId: string; dependsOn: string }>;
}

export interface TensionFieldProjection {
  readonly objectId: string;
  readonly totalTensions: number;
  readonly activeUnresolvedCount: number;
  readonly tensionVectors: readonly TensionVector[];
  readonly impactedDownstreamCount: number;
  readonly tensionHotspots: readonly string[];
}

export const tensionFieldInstrument: CognitiveInstrument<TensionFieldInput, TensionFieldProjection> = {
  instrumentId: "instrument:tension-field",
  version: "1.0.0",
  purpose: "Reveal and project unresolved cognitive tensions, competing positions, and downstream impact topology",
  projectionType: "vector_field",
  acceptedObjectTypes: ["cognitive_object_envelope", "epistemic_artifact", "evaluation_report", "architecture_spec"],
  requiredEvidence: ["epistemic_tensions_and_dependencies"],
  observedDimensions: [
    "unresolved_tension_density",
    "competing_claim_divergence",
    "downstream_dependency_exposure",
    "epistemic_conflict_severity",
  ],
  limitations: [
    "Observational projection only; does NOT adjudicate, resolve, or force convergence on tensions",
  ],
  failureModes: [
    {
      code: "NO_TENSIONS_DECLARED",
      description: "Artifact declares no active tensions or dependencies",
      mitigation: "Emit informational finding noting absence of surfaced cognitive tensions",
    },
  ],
  project(input: TensionFieldInput): InstrumentObservationReport<TensionFieldProjection> {
    const env = input.envelope;
    const target = input.targetObject ?? env?.payload ?? {};
    const objectId = env?.objectId ?? target.id ?? "obj:tension-target";
    const scope = env?.scope ?? target.scope ?? "scope:global";

    const tensionVectors: TensionVector[] = [];

    // 1. Ingest Explicit Tension Vectors if provided
    if (input.explicitTensions && input.explicitTensions.length > 0) {
      tensionVectors.push(...input.explicitTensions);
    } else {
      // 2. Synthesize Tension Vectors from Envelope / Target
      const rawTensions: string[] = env?.epistemicState?.tensions ?? target.tensions ?? [];
      const assumptions: string[] = env?.assumptions ?? target.assumptions ?? [];
      const sourceAnchors: string[] = env?.grounding?.sourceAnchors ?? target.sourceAnchors ?? [];

      const dependents = input.dependentObjectManifest ?? [];
      const dependentIds = dependents.filter((d) => d.dependsOn === objectId).map((d) => d.objectId);

      for (let i = 0; i < rawTensions.length; i++) {
        const t = rawTensions[i]!;
        const isConflict = t.toLowerCase().includes("conflict") || t.toLowerCase().includes("contradiction");
        const isSuperficial = t.toLowerCase().includes("superficial") || t.toLowerCase().includes("naming");
        const isQualified = t.toLowerCase().includes("qualif") || t.toLowerCase().includes("bounded");

        let epistemicStatus: TensionEpistemicStatus = "UNRESOLVED";
        let severity: "minor" | "material" | "critical" = "material";

        if (isSuperficial) {
          epistemicStatus = "SUPERFICIAL";
          severity = "minor";
        } else if (isQualified) {
          epistemicStatus = "QUALIFIED";
          severity = "minor";
        } else if (isConflict) {
          severity = "critical";
        }

        tensionVectors.push({
          tensionId: `tension-vec-${i + 1}`,
          title: t.length > 40 ? `${t.slice(0, 37)}...` : t,
          description: t,
          competingPositions: isConflict ? ["Position A (Declared Spec)", "Position B (Empirical Evidence)"] : [t],
          sourceGrounding: sourceAnchors,
          epistemicStatus,
          affectedAssumptions: assumptions,
          affectedConclusions: [target.statement ?? target.title ?? "Primary claim"],
          downstreamDependentObjects: dependentIds,
          scope,
          severity,
        });
      }
    }

    const activeUnresolved = tensionVectors.filter((v) => v.epistemicStatus === "UNRESOLVED" || v.severity === "critical");
    const impactedDownstreamSet = new Set<string>();
    for (const vec of activeUnresolved) {
      for (const dep of vec.downstreamDependentObjects) {
        impactedDownstreamSet.add(dep);
      }
    }

    const tensionHotspots: string[] = [];
    if (activeUnresolved.length >= 2) {
      tensionHotspots.push(`High tension concentration in scope '${scope}' (${activeUnresolved.length} active unresolved)`);
    }
    if (impactedDownstreamSet.size > 0) {
      tensionHotspots.push(`${impactedDownstreamSet.size} downstream dependent objects exposed to active tension`);
    }

    // 3. Build Findings
    const findings: InstrumentFinding[] = [];
    for (const vec of tensionVectors) {
      findings.push({
        findingId: `finding:tension:${vec.tensionId}`,
        dimension: "unresolved_tension_density",
        severity: vec.severity,
        summary: `Tension [${vec.epistemicStatus}]: ${vec.title}`,
        details: {
          competingPositions: vec.competingPositions,
          downstreamExposed: vec.downstreamDependentObjects,
        },
        sourceEvidence: vec.sourceGrounding.length > 0 ? vec.sourceGrounding : [objectId],
        epistemicStatus: "TENSION",
      });
    }

    const structuredProjection: TensionFieldProjection = {
      objectId,
      totalTensions: tensionVectors.length,
      activeUnresolvedCount: activeUnresolved.length,
      tensionVectors,
      impactedDownstreamCount: impactedDownstreamSet.size,
      tensionHotspots,
    };

    return {
      instrumentId: "instrument:tension-field",
      instrumentVersion: "1.0.0",
      projectedAt: new Date().toISOString(),
      sourceObjectId: objectId,
      projectionType: "vector_field",
      findings,
      structuredProjection,
      limitationsSurfaced: [
        "Observational projection only; does not resolve or adjudicate competing positions",
      ],
      provenanceChain: [objectId],
    };
  },
};
