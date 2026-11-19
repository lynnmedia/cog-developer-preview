/**
 * CogLib Cognitive Instrument: Epistemic Map
 *
 * Observational instrument mapping and projecting the epistemic composition,
 * evidence roles, authority tiers, staleness, and vulnerability clusters
 * of a cognitive artifact without reducing epistemic state to a single scalar.
 */

import { CognitiveInstrument, InstrumentObservationReport, InstrumentFinding } from "../cognitiveInstrumentContract";
import { CognitiveObjectEnvelope } from "../cognitiveObjectEnvelope";
import { ToolResultEvidence } from "../toolEpistemicContract";

export type EpistemicClassificationCategory =
  | "KNOWN"
  | "INFERRED"
  | "ASSUMED"
  | "CONFLICTING"
  | "UNRESOLVED"
  | "MEASURED"
  | "REMEMBERED"
  | "DOMAIN_DERIVED"
  | "TOOL_DERIVED"
  | "STALE"
  | "CHALLENGED";

export interface ClassifiedEpistemicElement {
  readonly elementId: string;
  readonly category: EpistemicClassificationCategory;
  readonly description: string;
  readonly confidence: number;
  readonly authorityLevel?: string;
  readonly freshnessStatus: "fresh" | "stale" | "unknown";
  readonly sourceAnchor?: string;
  readonly limitations: readonly string[];
}

export interface EpistemicMapInput {
  readonly envelope?: CognitiveObjectEnvelope;
  readonly targetObject?: Record<string, any>;
  readonly attachedEvidence?: readonly ToolResultEvidence[];
}

export interface EpistemicMapProjection {
  readonly objectId: string;
  readonly overallEpistemicPosture: "robust" | "provisional" | "vulnerable" | "degraded";
  readonly categoryCounts: Readonly<Record<EpistemicClassificationCategory, number>>;
  readonly elements: readonly ClassifiedEpistemicElement[];
  readonly activeTensions: readonly string[];
  readonly criticalVulnerabilities: readonly string[];
}

export const epistemicMapInstrument: CognitiveInstrument<EpistemicMapInput, EpistemicMapProjection> = {
  instrumentId: "instrument:epistemic-map",
  version: "1.0.0",
  purpose: "Map and project the multidimensional epistemic composition and vulnerability topography of cognitive artifacts",
  projectionType: "epistemic_matrix",
  acceptedObjectTypes: ["cognitive_object_envelope", "epistemic_artifact", "evaluation_report"],
  requiredEvidence: ["epistemic_state_and_grounding"],
  observedDimensions: [
    "epistemic_composition",
    "evidence_grounding_balance",
    "assumption_density",
    "staleness_exposure",
    "unresolved_conflict_clusters",
  ],
  limitations: [
    "Observational mapping only; does not re-verify external truth of claims",
    "Does not resolve tensions or inflate low-confidence elements",
  ],
  failureModes: [
    {
      code: "EMPTY_EPISTEMIC_GROUNDING",
      description: "Artifact contains no grounding, assumptions, or evidence",
      mitigation: "Emit high-severity finding warning of completely ungrounded epistemic state",
    },
  ],
  project(input: EpistemicMapInput): InstrumentObservationReport<EpistemicMapProjection> {
    const env = input.envelope;
    const target = input.targetObject ?? env?.payload ?? {};
    const objectId = env?.objectId ?? target.id ?? "obj:epistemic-target";

    const elements: ClassifiedEpistemicElement[] = [];
    const counts: Record<EpistemicClassificationCategory, number> = {
      KNOWN: 0,
      INFERRED: 0,
      ASSUMED: 0,
      CONFLICTING: 0,
      UNRESOLVED: 0,
      MEASURED: 0,
      REMEMBERED: 0,
      DOMAIN_DERIVED: 0,
      TOOL_DERIVED: 0,
      STALE: 0,
      CHALLENGED: 0,
    };

    // 1. Process Assumptions
    const assumptions: string[] = env?.assumptions ?? (Array.isArray(target.assumptions) ? target.assumptions : []);
    for (let i = 0; i < assumptions.length; i++) {
      const a = assumptions[i]!;
      elements.push({
        elementId: `assump-${i + 1}`,
        category: "ASSUMED",
        description: a,
        confidence: 0.7,
        freshnessStatus: "unknown",
        limitations: ["Unverified foundational assumption"],
      });
      counts.ASSUMED++;
    }

    // 2. Process Grounding & Anchors
    const sourceAnchors: string[] = env?.grounding?.sourceAnchors ?? target.sourceAnchors ?? [];
    for (let i = 0; i < sourceAnchors.length; i++) {
      const anchor = sourceAnchors[i]!;
      const isKnown = anchor.includes("spec") || anchor.includes("rfc") || anchor.includes("canonical");
      const category: EpistemicClassificationCategory = isKnown ? "KNOWN" : "REMEMBERED";
      elements.push({
        elementId: `ground-${i + 1}`,
        category,
        description: `Grounded in source anchor: ${anchor}`,
        confidence: isKnown ? 1.0 : 0.85,
        sourceAnchor: anchor,
        freshnessStatus: "fresh",
        limitations: [],
      });
      counts[category]++;
    }

    // 3. Process Attached Evidence
    const evidenceList = input.attachedEvidence ?? [];
    for (const ev of evidenceList) {
      const isStale = Boolean(ev.freshnessExpiresAt && new Date(ev.freshnessExpiresAt).getTime() < Date.now());
      let category: EpistemicClassificationCategory = "TOOL_DERIVED";
      if (isStale) category = "STALE";
      else if (ev.epistemicRole === "MEASUREMENT") category = "MEASURED";
      else if (ev.epistemicRole === "MODEL_INFERENCE") category = "INFERRED";

      elements.push({
        elementId: ev.evidenceId,
        category,
        description: `Tool evidence: ${ev.epistemicRole} from ${ev.sourceReliability}`,
        confidence: ev.confidence,
        authorityLevel: ev.governanceAuthority,
        freshnessStatus: isStale ? "stale" : "fresh",
        limitations: ev.limitations,
      });
      counts[category]++;
    }

    // 4. Process Tensions & Conflicts
    const tensions: string[] = env?.epistemicState?.tensions ?? target.tensions ?? [];
    for (let i = 0; i < tensions.length; i++) {
      const t = tensions[i]!;
      const isConflict = t.toLowerCase().includes("conflict") || t.toLowerCase().includes("contradiction");
      const category: EpistemicClassificationCategory = isConflict ? "CONFLICTING" : "UNRESOLVED";
      elements.push({
        elementId: `tension-${i + 1}`,
        category,
        description: t,
        confidence: 0.5,
        freshnessStatus: "fresh",
        limitations: ["Active epistemic tension requiring downstream investigation"],
      });
      counts[category]++;
    }

    // 5. Process Domain Capabilities & Mutations
    if (env?.capabilityContext?.mountedCapabilities && env.capabilityContext.mountedCapabilities.length > 0) {
      for (const cap of env.capabilityContext.mountedCapabilities) {
        elements.push({
          elementId: `cap-${cap}`,
          category: "DOMAIN_DERIVED",
          description: `Specialized domain cognition from ${cap}`,
          confidence: 0.9,
          freshnessStatus: "fresh",
          limitations: [],
        });
        counts.DOMAIN_DERIVED++;
      }
    }

    // Check for CHALLENGED mutations
    if (env?.declaredMutations?.some((m) => m.action === "CHALLENGED")) {
      counts.CHALLENGED++;
    }

    // 6. Determine Posture & Vulnerabilities
    const criticalVulnerabilities: string[] = [];
    if (counts.STALE > 0) criticalVulnerabilities.push(`${counts.STALE} stale evidence items active in cognition`);
    if (counts.CONFLICTING > 0) criticalVulnerabilities.push(`${counts.CONFLICTING} direct conflicting contradictions unresolved`);
    if (counts.ASSUMED > counts.KNOWN + counts.MEASURED) {
      criticalVulnerabilities.push("Assumption-heavy cognition: foundational assumptions outnumber verified grounding");
    }

    let overallEpistemicPosture: "robust" | "provisional" | "vulnerable" | "degraded" = "robust";
    if (counts.STALE > 0 || counts.CONFLICTING > 0) {
      overallEpistemicPosture = "degraded";
    } else if (criticalVulnerabilities.length > 0 || counts.UNRESOLVED > 0) {
      overallEpistemicPosture = "vulnerable";
    } else if (counts.ASSUMED > 0 || counts.INFERRED > 0) {
      overallEpistemicPosture = "provisional";
    }

    // 7. Findings
    const findings: InstrumentFinding[] = [];
    if (criticalVulnerabilities.length > 0) {
      for (const vuln of criticalVulnerabilities) {
        findings.push({
          findingId: `finding:epistemic-map:vuln-${findings.length + 1}`,
          dimension: "epistemic_composition",
          severity: "material",
          summary: vuln,
          details: { posture: overallEpistemicPosture, vuln },
          sourceEvidence: [objectId],
          epistemicStatus: "TENSION",
        });
      }
    }

    const structuredProjection: EpistemicMapProjection = {
      objectId,
      overallEpistemicPosture,
      categoryCounts: counts,
      elements,
      activeTensions: tensions,
      criticalVulnerabilities,
    };

    return {
      instrumentId: "instrument:epistemic-map",
      instrumentVersion: "1.0.0",
      projectedAt: new Date().toISOString(),
      sourceObjectId: objectId,
      projectionType: "epistemic_matrix",
      findings,
      structuredProjection,
      limitationsSurfaced: [
        "Observational mapping; multidimensional categories reflect declared artifact structure",
      ],
      provenanceChain: [objectId],
    };
  },
};
