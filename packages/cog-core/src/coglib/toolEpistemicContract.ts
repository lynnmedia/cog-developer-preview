/**
 * CogLib Tool Epistemic Evidence Contract
 *
 * Substrate-neutral contract for external tool results entering Cog as epistemically
 * typed evidence rather than untyped raw context.
 *
 * CORE GOVERNANCE PRINCIPLE:
 * Tool output must never enter cognition as unqualified truth.
 * Governance authority, evidentiary strength, source reliability, freshness,
 * scope fit, and epistemic role remain distinct multidimensional attributes.
 */

export type ToolEpistemicRole =
  | "DIRECT_OBSERVATION"   // Sensor feeds, direct hardware captures
  | "MEASUREMENT"          // Calibrated numerical measurements with units
  | "AUTHORITATIVE_RECORD" // Registry records, cryptographic attestations, official databases
  | "RETRIEVED_DOCUMENT"   // Search results, scraped web text, document chunks
  | "HUMAN_TESTIMONY"      // Direct user input, interview statements, expert reviews
  | "CALCULATION"          // Deterministic mathematical / symbolic computation
  | "SIMULATION"           // Monte Carlo runs, physics models, synthetic simulations
  | "MODEL_INFERENCE"      // LLM/ML neural inferences, speculative embeddings
  | "HEURISTIC"            // Rule-of-thumb checks, lint rules, regex scans
  | "DERIVED_ESTIMATE";    // Multi-factor statistical approximations

export type ToolEvidentiaryStrength =
  | "decisive"     // Conclusively proves or falsifies a claim within scope
  | "corroborative" // Substantially supports or undermines with independent backing
  | "suggestive"    // Points toward an outcome but requires corroboration
  | "weak"          // Marginal signal, high noise, or uncalibrated
  | "speculative";  // Hypothetical possibility without empirical backing

export type ToolSourceReliability =
  | "calibrated_hardware"   // High precision calibrated sensors
  | "authoritative_registry" // Verified single source of truth
  | "deterministic_engine"   // Formally verified symbolic math/code execution
  | "verified_human"         // Authenticated domain expert testimony
  | "stochastic_model"       // Neural network or probabilistic predictor
  | "unverified_source";     // Unauthenticated open web, raw text

export type ToolGovernanceAuthority =
  | "canonical"   // Hard architectural or formal specification authority
  | "project"     // Workspace or project-level authority
  | "situational" // Ephemeral operational environment observation
  | "advisory"    // Advisory or recommendation tool output
  | "untrusted";  // Third-party, unauthenticated, or sandboxed output

export interface ToolEvidenceProvenance {
  readonly toolId: string;
  readonly executionInvocationId: string;
  readonly sourceUri?: string;
  readonly callerRef?: string;
  readonly rawInputHash?: string;
}

export interface ToolResultEvidence<TData = any> {
  readonly evidenceId: string;
  readonly epistemicRole: ToolEpistemicRole;
  readonly governanceAuthority: ToolGovernanceAuthority;
  readonly evidentiaryStrength: ToolEvidentiaryStrength;
  readonly sourceReliability: ToolSourceReliability;
  readonly scope: string;
  readonly observedAt: string; // ISO 8601
  readonly freshnessExpiresAt?: string; // ISO 8601
  readonly confidence: number; // [0.0, 1.0]
  readonly data: TData;
  readonly limitations: readonly string[];
  readonly tensionsSurfaced: readonly string[];
  readonly provenance: ToolEvidenceProvenance;
}

export interface ToolEvidenceValidationReport {
  readonly valid: boolean;
  readonly evidenceId: string;
  readonly defects: readonly string[];
}

/**
 * Validates that an external tool result satisfies the Tool Epistemic Contract.
 */
export function validateToolEvidenceContract(evidence: ToolResultEvidence): ToolEvidenceValidationReport {
  const defects: string[] = [];

  if (!evidence) {
    return { valid: false, evidenceId: "unknown", defects: ["Tool evidence is null or undefined"] };
  }

  if (!evidence.evidenceId || !evidence.evidenceId.startsWith("evidence:tool:")) {
    defects.push("Evidence evidenceId must begin with 'evidence:tool:' prefix");
  }

  const validRoles: ToolEpistemicRole[] = [
    "DIRECT_OBSERVATION",
    "MEASUREMENT",
    "AUTHORITATIVE_RECORD",
    "RETRIEVED_DOCUMENT",
    "HUMAN_TESTIMONY",
    "CALCULATION",
    "SIMULATION",
    "MODEL_INFERENCE",
    "HEURISTIC",
    "DERIVED_ESTIMATE",
  ];
  if (!evidence.epistemicRole || !validRoles.includes(evidence.epistemicRole)) {
    defects.push(`Invalid or missing epistemicRole: '${evidence.epistemicRole}'`);
  }

  const validAuthorities: ToolGovernanceAuthority[] = ["canonical", "project", "situational", "advisory", "untrusted"];
  if (!evidence.governanceAuthority || !validAuthorities.includes(evidence.governanceAuthority)) {
    defects.push(`Invalid or missing governanceAuthority: '${evidence.governanceAuthority}'`);
  }

  const validStrengths: ToolEvidentiaryStrength[] = ["decisive", "corroborative", "suggestive", "weak", "speculative"];
  if (!evidence.evidentiaryStrength || !validStrengths.includes(evidence.evidentiaryStrength)) {
    defects.push(`Invalid or missing evidentiaryStrength: '${evidence.evidentiaryStrength}'`);
  }

  const validReliabilities: ToolSourceReliability[] = [
    "calibrated_hardware",
    "authoritative_registry",
    "deterministic_engine",
    "verified_human",
    "stochastic_model",
    "unverified_source",
  ];
  if (!evidence.sourceReliability || !validReliabilities.includes(evidence.sourceReliability)) {
    defects.push(`Invalid or missing sourceReliability: '${evidence.sourceReliability}'`);
  }

  if (!evidence.scope) defects.push("Evidence scope is required");
  if (!evidence.observedAt) defects.push("Evidence observedAt is required");

  if (evidence.confidence === undefined || evidence.confidence < 0 || evidence.confidence > 1) {
    defects.push("Evidence confidence must be a number between 0.0 and 1.0");
  }

  if (!evidence.provenance) {
    defects.push("Evidence provenance is required");
  } else {
    if (!evidence.provenance.toolId) defects.push("Provenance toolId is required");
    if (!evidence.provenance.executionInvocationId) defects.push("Provenance executionInvocationId is required");
  }

  if (!Array.isArray(evidence.limitations)) defects.push("Evidence limitations must be an array");
  if (!Array.isArray(evidence.tensionsSurfaced)) defects.push("Evidence tensionsSurfaced must be an array");

  return {
    valid: defects.length === 0,
    evidenceId: evidence.evidenceId ?? "unknown",
    defects,
  };
}
