/**
 * CogLib Cognitive Instrument Standard Contract
 *
 * Observational cognitive instruments project, reveal, and summarize
 * inspectable cognitive phenomena from governed artifacts without mutating,
 * adjudicating, deciding, or inventing cognition.
 *
 * CORE DISTINCTIONS & GOVERNANCE INVARIANTS:
 * 1. Routine operates on cognition (transforms / challenges / derives new state).
 *    Instrument reveals cognition (projects / maps / exposes existing state & tensions).
 * 2. An instrument is purely observational: it CANNOT modify source objects,
 *    resolve tensions, inflate confidence, or act as an opaque decision engine.
 * 3. All derived findings must remain reproducible from source state and explicitly
 *    traceable to source evidence anchors.
 */

export type InstrumentProjectionType =
  | "graph"
  | "tabular"
  | "hierarchical"
  | "vector_field"
  | "timeline"
  | "epistemic_matrix";

export type InstrumentFindingSeverity = "info" | "minor" | "material" | "critical";

export type InstrumentEpistemicStatus =
  | "OBSERVED"
  | "DERIVED"
  | "TENSION"
  | "DRIFT"
  | "QUALIFICATION";

export interface InstrumentFinding<TDetails = any> {
  readonly findingId: string; // e.g. "finding:<inst>:<id>"
  readonly dimension: string;
  readonly severity: InstrumentFindingSeverity;
  readonly summary: string;
  readonly details: TDetails;
  readonly sourceEvidence: readonly string[]; // Traceable anchor/evidence IDs
  readonly epistemicStatus: InstrumentEpistemicStatus;
}

export interface InstrumentObservationReport<TOutput = any> {
  readonly instrumentId: string;
  readonly instrumentVersion: string;
  readonly projectedAt: string; // ISO 8601
  readonly sourceObjectId: string;
  readonly projectionType: InstrumentProjectionType;
  readonly findings: readonly InstrumentFinding[];
  readonly structuredProjection: TOutput;
  readonly limitationsSurfaced: readonly string[];
  readonly provenanceChain: readonly string[];
}

export interface CognitiveInstrument<TInput = any, TOutput = any> {
  readonly instrumentId: string; // e.g. "instrument:drift-lens"
  readonly version: string;
  readonly purpose: string;
  readonly projectionType: InstrumentProjectionType;
  readonly acceptedObjectTypes: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly observedDimensions: readonly string[];
  readonly limitations: readonly string[];
  readonly failureModes: ReadonlyArray<{
    readonly code: string;
    readonly description: string;
    readonly mitigation: string;
  }>;
  readonly project: (input: TInput) => Promise<InstrumentObservationReport<TOutput>> | InstrumentObservationReport<TOutput>;
}

export interface InstrumentValidationReport {
  readonly valid: boolean;
  readonly instrumentId: string;
  readonly defects: readonly string[];
}

/**
 * Validates that an observational cognitive instrument satisfies the Cog standard contract.
 */
export function validateCognitiveInstrumentContract(instrument: CognitiveInstrument): InstrumentValidationReport {
  const defects: string[] = [];

  if (!instrument) {
    return { valid: false, instrumentId: "unknown", defects: ["Instrument is null or undefined"] };
  }

  if (!instrument.instrumentId || !instrument.instrumentId.startsWith("instrument:")) {
    defects.push("Instrument instrumentId must begin with 'instrument:' prefix");
  }

  if (!instrument.version) defects.push("Instrument version is required");
  if (!instrument.purpose) defects.push("Instrument purpose is required");
  if (!instrument.projectionType) defects.push("Instrument projectionType is required");

  if (!Array.isArray(instrument.acceptedObjectTypes) || instrument.acceptedObjectTypes.length === 0) {
    defects.push("Instrument acceptedObjectTypes must be a non-empty array");
  }

  if (!Array.isArray(instrument.observedDimensions) || instrument.observedDimensions.length === 0) {
    defects.push("Instrument observedDimensions must be a non-empty array");
  }

  if (!Array.isArray(instrument.limitations) || instrument.limitations.length === 0) {
    defects.push("Instrument limitations must be a non-empty array");
  }

  if (!Array.isArray(instrument.failureModes) || instrument.failureModes.length === 0) {
    defects.push("Instrument failureModes must be a non-empty array");
  }

  if (typeof instrument.project !== "function") {
    defects.push("Instrument project must be an observational function");
  }

  return {
    valid: defects.length === 0,
    instrumentId: instrument.instrumentId ?? "unknown",
    defects,
  };
}
