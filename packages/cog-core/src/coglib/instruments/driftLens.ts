/**
 * CogLib Cognitive Instrument: Drift Lens
 *
 * Observational instrument projecting cognitively significant drift across
 * time, revisions, or cross-runtime transformations without modifying
 * or adjudicating the observed state.
 */

import { CognitiveInstrument, InstrumentObservationReport, InstrumentFinding } from "../cognitiveInstrumentContract";
import { CognitiveObjectEnvelope } from "../cognitiveObjectEnvelope";

export interface DriftLensInput {
  readonly priorState: CognitiveObjectEnvelope | Record<string, any>;
  readonly currentState: CognitiveObjectEnvelope | Record<string, any>;
}

export interface DriftLensProjection {
  readonly identityContinuity: boolean;
  readonly driftSeverity: "none" | "minor" | "material" | "critical";
  readonly semanticChanges: {
    readonly preserved: readonly string[];
    readonly added: readonly string[];
    readonly modified: readonly string[];
    readonly removed: readonly string[];
  };
  readonly assumptionDrift: {
    readonly preserved: readonly string[];
    readonly added: readonly string[];
    readonly dropped: readonly string[];
  };
  readonly groundingDrift: {
    readonly preservedAnchors: readonly string[];
    readonly addedAnchors: readonly string[];
    readonly droppedAnchors: readonly string[];
  };
  readonly epistemicDrift: {
    readonly priorConfidence: number;
    readonly currentConfidence: number;
    readonly delta: number;
    readonly priorTensions: readonly string[];
    readonly currentTensions: readonly string[];
    readonly newUnresolvedTensions: readonly string[];
    readonly resolvedTensions: readonly string[];
  };
}

export const driftLensInstrument: CognitiveInstrument<DriftLensInput, DriftLensProjection> = {
  instrumentId: "instrument:drift-lens",
  version: "1.0.0",
  purpose: "Reveal and project cognitively significant semantic, assumption, grounding, and epistemic drift",
  projectionType: "tabular",
  acceptedObjectTypes: ["cognitive_object_envelope", "cognitive_state_snapshot", "domain_object"],
  requiredEvidence: ["prior_and_current_state_pair"],
  observedDimensions: [
    "identity_continuity",
    "assumption_drift",
    "grounding_anchor_drift",
    "confidence_trajectory",
    "unresolved_tension_emergence",
  ],
  limitations: [
    "Purely observational; does not evaluate whether drift is beneficial or detrimental",
    "Does not resolve emerging tensions or alter confidence trajectory",
  ],
  failureModes: [
    {
      code: "DISJOINT_IDENTITY_ROOTS",
      description: "Observed targets have non-continuous identity roots",
      mitigation: "Flag identity disconnect in findings with critical severity",
    },
  ],
  project(input: DriftLensInput): InstrumentObservationReport<DriftLensProjection> {
    const prior = input.priorState as any;
    const current = input.currentState as any;

    const priorId = prior.objectId ?? prior.id;
    const currentId = current.objectId ?? current.id;
    const identityContinuous = Boolean(
      (priorId && currentId && priorId === currentId) ||
      (prior.identityRoot && current.identityRoot && prior.identityRoot === current.identityRoot),
    );

    // 1. Assumptions Drift
    const priorAssumptions: string[] = Array.isArray(prior.assumptions) ? prior.assumptions : [];
    const currentAssumptions: string[] = Array.isArray(current.assumptions) ? current.assumptions : [];
    const preservedAssumptions = priorAssumptions.filter((a) => currentAssumptions.includes(a));
    const addedAssumptions = currentAssumptions.filter((a) => !priorAssumptions.includes(a));
    const droppedAssumptions = priorAssumptions.filter((a) => !currentAssumptions.includes(a));

    // 2. Grounding Anchors Drift
    const priorAnchors: string[] = prior.grounding?.sourceAnchors ?? (Array.isArray(prior.sourceAnchors) ? prior.sourceAnchors : []);
    const currentAnchors: string[] = current.grounding?.sourceAnchors ?? (Array.isArray(current.sourceAnchors) ? current.sourceAnchors : []);
    const preservedAnchors = priorAnchors.filter((a) => currentAnchors.includes(a));
    const addedAnchors = currentAnchors.filter((a) => !priorAnchors.includes(a));
    const droppedAnchors = priorAnchors.filter((a) => !currentAnchors.includes(a));

    // 3. Epistemic Drift
    const priorConf = prior.epistemicState?.confidence ?? prior.confidence ?? 1.0;
    const currentConf = current.epistemicState?.confidence ?? current.confidence ?? 1.0;
    const confDelta = Number((currentConf - priorConf).toFixed(3));

    const priorTensions: string[] = prior.epistemicState?.tensions ?? (Array.isArray(prior.tensions) ? prior.tensions : []);
    const currentTensions: string[] = current.epistemicState?.tensions ?? (Array.isArray(current.tensions) ? current.tensions : []);
    const newUnresolvedTensions = currentTensions.filter((t) => !priorTensions.includes(t));
    const resolvedTensions = priorTensions.filter((t) => !currentTensions.includes(t));

    // 4. Determine overall drift severity
    let driftSeverity: "none" | "minor" | "material" | "critical" = "none";
    if (!identityContinuous) {
      driftSeverity = "critical";
    } else if (newUnresolvedTensions.length > 0 || droppedAssumptions.length > 0 || Math.abs(confDelta) >= 0.2) {
      driftSeverity = "material";
    } else if (addedAssumptions.length > 0 || addedAnchors.length > 0 || Math.abs(confDelta) > 0.05) {
      driftSeverity = "minor";
    }

    // 5. Build Findings
    const findings: InstrumentFinding[] = [];

    if (!identityContinuous) {
      findings.push({
        findingId: "finding:drift:identity-disconnect",
        dimension: "identity_continuity",
        severity: "critical",
        summary: `Concept Identity broken between prior '${priorId}' and current '${currentId}'`,
        details: { priorId, currentId },
        sourceEvidence: [priorId, currentId],
        epistemicStatus: "DRIFT",
      });
    }

    if (droppedAssumptions.length > 0) {
      findings.push({
        findingId: "finding:drift:dropped-assumptions",
        dimension: "assumption_drift",
        severity: "material",
        summary: `Dropped ${droppedAssumptions.length} foundational assumptions`,
        details: { droppedAssumptions },
        sourceEvidence: droppedAssumptions,
        epistemicStatus: "DRIFT",
      });
    }

    if (newUnresolvedTensions.length > 0) {
      findings.push({
        findingId: "finding:drift:emergent-tensions",
        dimension: "unresolved_tension_emergence",
        severity: "material",
        summary: `Emerged ${newUnresolvedTensions.length} new unresolved tensions`,
        details: { newUnresolvedTensions },
        sourceEvidence: newUnresolvedTensions,
        epistemicStatus: "TENSION",
      });
    }

    if (Math.abs(confDelta) >= 0.1) {
      findings.push({
        findingId: "finding:drift:confidence-trajectory",
        dimension: "confidence_trajectory",
        severity: Math.abs(confDelta) >= 0.2 ? "material" : "minor",
        summary: `Confidence shifted by ${confDelta > 0 ? "+" : ""}${confDelta} (${priorConf} -> ${currentConf})`,
        details: { priorConf, currentConf, confDelta },
        sourceEvidence: [priorId, currentId],
        epistemicStatus: "DRIFT",
      });
    }

    const structuredProjection: DriftLensProjection = {
      identityContinuity: identityContinuous,
      driftSeverity,
      semanticChanges: {
        preserved: preservedAssumptions,
        added: addedAssumptions,
        modified: [],
        removed: droppedAssumptions,
      },
      assumptionDrift: {
        preserved: preservedAssumptions,
        added: addedAssumptions,
        dropped: droppedAssumptions,
      },
      groundingDrift: {
        preservedAnchors,
        addedAnchors,
        droppedAnchors,
      },
      epistemicDrift: {
        priorConfidence: priorConf,
        currentConfidence: currentConf,
        delta: confDelta,
        priorTensions,
        currentTensions,
        newUnresolvedTensions,
        resolvedTensions,
      },
    };

    return {
      instrumentId: "instrument:drift-lens",
      instrumentVersion: "1.0.0",
      projectedAt: new Date().toISOString(),
      sourceObjectId: currentId,
      projectionType: "tabular",
      findings,
      structuredProjection,
      limitationsSurfaced: [
        "Observational projection only; does not adjudicate correctness of observed drift",
      ],
      provenanceChain: [priorId, currentId],
    };
  },
};
