import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveRoutine,
  validateRoutineContract,
  executeRoutineWithGuards,
} from "../coglib/routineContract";

test("HDCP-COGLIB-ROUTINE-CONTRACT-002: validation rejects incomplete or malformed routine definitions", () => {
  const invalidRoutine: any = {
    metadata: {
      id: "invalid-id-without-prefix",
      name: "Bad Routine",
      version: "not-semver",
    },
    inputs: [],
    outputs: [],
  };

  const report = validateRoutineContract(invalidRoutine);
  assert.equal(report.valid, false);
  assert.ok(report.defects.some((d) => d.includes("coglib:")));
  assert.ok(report.defects.some((d) => d.includes("SemVer")));
  assert.ok(report.defects.some((d) => d.includes("input port")));
  assert.ok(report.defects.some((d) => d.includes("output port")));
  assert.ok(report.defects.some((d) => d.includes("execute")));
});

test("HDCP-COGLIB-ROUTINE-CONTRACT-002: describes music harmonic tension reconciliation routine", async () => {
  interface MusicTensionInput {
    voices: Array<{ pitch: string; tensionWeight: number }>;
    resolutionTarget: string;
  }
  interface MusicTensionOutput {
    reconciledTension: number;
    voiceMovements: Array<{ from: string; to: string; resolved: boolean }>;
    residualTension: number;
  }

  const musicTensionRoutine: CognitiveRoutine<MusicTensionInput, MusicTensionOutput> = {
    metadata: {
      id: "coglib:routine:tension-reconciliation",
      name: "Universal Tension Reconciliation",
      version: "1.0.0",
      category: "reconciliation",
      description: "Reconciles competing tension vectors into balanced resolution states.",
    },
    inputs: [
      { name: "voices", type: "array", required: true, description: "Input tension-bearing elements" },
      { name: "resolutionTarget", type: "string", required: true, description: "Target attractor" },
    ],
    outputs: [
      { name: "reconciledTension", type: "number", required: true, description: "Tension magnitude after resolution" },
      { name: "voiceMovements", type: "array", required: true, description: "Individual component transitions" },
      { name: "residualTension", type: "number", required: true, description: "Unresolved tension residue" },
    ],
    preconditions: [
      {
        id: "non-empty-elements",
        description: "Must contain at least one tension vector",
        evaluate: (input) => ({
          passed: input.voices.length > 0,
          reason: input.voices.length === 0 ? "Voice list cannot be empty" : undefined,
        }),
      },
    ],
    postconditions: [
      {
        id: "valid-residual-bound",
        description: "Residual tension must not exceed original tension",
        evaluate: ({ input, output }) => {
          const originalSum = input.voices.reduce((acc, v) => acc + v.tensionWeight, 0);
          return {
            passed: output.residualTension <= originalSum,
            reason: "Residual tension exceeded total input tension",
          };
        },
      },
    ],
    failureModes: [
      {
        code: "UNRESOLVABLE_CONSONANCE_CONFLICT",
        description: "Voices contain mutually incompatible attractor demands",
        severity: "qualified",
        recoverable: true,
        mitigation: "Emit qualified output with high residual tension",
      },
    ],
    provenanceRequirements: {
      requiresSourceAnchors: true,
      preserveLineage: true,
      trackTransformations: true,
      auditRequired: false,
    },
    epistemicContract: {
      producesUncertainty: false,
      uncertaintyHandling: "preserve",
      epistemicDelta: "Reduces dissonance while explicitly recording unresolved harmonic tension",
      preservesTensions: true,
    },
    invariants: [
      {
        id: "movement-cardinality",
        description: "Output voice movements must match input voices count",
        enforce: (input, output) => ({
          valid: input.voices.length === output.voiceMovements.length,
          violation: "Voice movement count mismatch",
        }),
      },
    ],
    domainHooks: [
      {
        hookId: "music-harmonic-adapter",
        description: "Binds pitches and intervals to generic tension weights",
        required: false,
      },
    ],
    evaluationHooks: [
      {
        hookId: "tension-reduction-ratio",
        metricName: "reductionRatio",
        description: "Calculates ratio of resolved tension to original tension",
        computeMetric: (output) => (output.reconciledTension > 0 ? 1 - output.residualTension / output.reconciledTension : 1),
      },
    ],
    compatibility: {
      compatibleRoutines: ["coglib:routine:perspective-synthesis", "coglib:routine:concept-evolution"],
      incompatibleRoutines: [],
      compositionPatterns: ["pipeline", "branch", "merge"],
      requiredKernelVersion: ">=0.1.0",
    },
    execute: (input) => {
      const initialTension = input.voices.reduce((s, v) => s + v.tensionWeight, 0);
      const residual = initialTension * 0.2;
      return {
        status: "success",
        output: {
          reconciledTension: initialTension,
          voiceMovements: input.voices.map((v) => ({ from: v.pitch, to: input.resolutionTarget, resolved: true })),
          residualTension: residual,
        },
        epistemicState: {
          confidence: 0.95,
          uncertaintyBounded: true,
          tensions: ["Minor 2nd dissonance resolved to unison"],
          provenanceLineage: ["coglib:routine:tension-reconciliation"],
        },
        provenance: {
          routineId: "coglib:routine:tension-reconciliation",
          routineVersion: "1.0.0",
          lineage: ["coglib:routine:tension-reconciliation"],
          timestamp: new Date().toISOString(),
        },
      };
    },
  };

  const validation = validateRoutineContract(musicTensionRoutine);
  assert.equal(validation.valid, true);

  const result = await executeRoutineWithGuards(musicTensionRoutine, {
    voices: [
      { pitch: "C#4", tensionWeight: 0.8 },
      { pitch: "D4", tensionWeight: 0.7 },
    ],
    resolutionTarget: "D4",
  });

  assert.equal(result.status, "success");
  assert.equal(result.output?.voiceMovements.length, 2);
  assert.ok(result.metrics?.reductionRatio !== undefined);
});

test("HDCP-COGLIB-ROUTINE-CONTRACT-002: describes scientific claim falsification routine", async () => {
  interface ClaimInput {
    claimId: string;
    statement: string;
    empiricalObservations: Array<{ id: string; supports: boolean; confidence: number }>;
  }
  interface ClaimOutput {
    verdict: "supported" | "falsified" | "indeterminate";
    falsificationStrength: number;
    epistemicConfidence: number;
  }

  const claimFalsificationRoutine: CognitiveRoutine<ClaimInput, ClaimOutput> = {
    metadata: {
      id: "coglib:routine:claim-falsification",
      name: "Empirical Claim Falsification",
      version: "1.1.0",
      category: "falsification",
      description: "Evaluates empirical observations against declarative claims to determine falsification status.",
    },
    inputs: [
      { name: "claimId", type: "string", required: true, description: "Claim identifier" },
      { name: "statement", type: "string", required: true, description: "Target hypothesis" },
      { name: "empiricalObservations", type: "array", required: true, description: "Observation dataset" },
    ],
    outputs: [
      { name: "verdict", type: "string", required: true, description: "Falsification verdict" },
      { name: "falsificationStrength", type: "number", required: true, description: "Evidence strength against claim" },
      { name: "epistemicConfidence", type: "number", required: true, description: "Confidence score" },
    ],
    preconditions: [
      {
        id: "has-observations",
        description: "Requires at least one empirical observation",
        evaluate: (input) => ({
          passed: input.empiricalObservations.length > 0,
          reason: "At least one empirical observation is required to evaluate falsification",
        }),
      },
    ],
    postconditions: [
      {
        id: "bounded-confidence",
        description: "Confidence must be within [0, 1]",
        evaluate: ({ output }) => ({
          passed: output.epistemicConfidence >= 0 && output.epistemicConfidence <= 1,
          reason: "Confidence score out of bounds",
        }),
      },
    ],
    failureModes: [
      {
        code: "CONTRADICTORY_EVIDENCE_STREAM",
        description: "Observations contain irreconcilable contradictions of equal weight",
        severity: "qualified",
        recoverable: true,
      },
    ],
    provenanceRequirements: {
      requiresSourceAnchors: true,
      preserveLineage: true,
      trackTransformations: true,
      auditRequired: true,
    },
    epistemicContract: {
      producesUncertainty: true,
      uncertaintyHandling: "quantify",
      epistemicDelta: "Refines epistemic confidence and updates hypothesis truth state",
      preservesTensions: true,
    },
    invariants: [
      {
        id: "verdict-strength-consistency",
        description: "Falsified verdict requires positive falsification strength",
        enforce: (_input, output) => ({
          valid: output.verdict !== "falsified" || output.falsificationStrength > 0,
          violation: "Falsified claim cannot have zero falsification strength",
        }),
      },
    ],
    domainHooks: [],
    evaluationHooks: [
      {
        hookId: "evidence-weight",
        metricName: "observationCount",
        description: "Total observations evaluated",
        computeMetric: (_out) => 3,
      },
    ],
    compatibility: {
      compatibleRoutines: ["coglib:routine:tension-reconciliation"],
      incompatibleRoutines: [],
      compositionPatterns: ["pipeline", "branch", "guarded_transition"],
      requiredKernelVersion: ">=0.1.0",
    },
    execute: (input) => {
      const opposing = input.empiricalObservations.filter((o) => !o.supports);
      const falsified = opposing.length > input.empiricalObservations.length / 2;
      return {
        status: "success",
        output: {
          verdict: falsified ? "falsified" : "supported",
          falsificationStrength: opposing.length / input.empiricalObservations.length,
          epistemicConfidence: 0.88,
        },
        epistemicState: {
          confidence: 0.88,
          uncertaintyBounded: true,
          tensions: opposing.map((o) => `Opposing observation: ${o.id}`),
          provenanceLineage: [input.claimId],
        },
        provenance: {
          routineId: "coglib:routine:claim-falsification",
          routineVersion: "1.1.0",
          lineage: [input.claimId],
          timestamp: new Date().toISOString(),
        },
      };
    },
  };

  assert.equal(validateRoutineContract(claimFalsificationRoutine).valid, true);

  const result = await executeRoutineWithGuards(claimFalsificationRoutine, {
    claimId: "claim-gravity-speed",
    statement: "Speed of gravity equals speed of light",
    empiricalObservations: [
      { id: "obs-gw170817-1", supports: true, confidence: 0.99 },
      { id: "obs-gw170817-2", supports: true, confidence: 0.98 },
      { id: "obs-anomaly-x", supports: false, confidence: 0.12 },
    ],
  });

  assert.equal(result.status, "success");
  assert.equal(result.output?.verdict, "supported");
});

test("HDCP-COGLIB-ROUTINE-CONTRACT-002: describes software architecture tradeoff and concept evolution routines", () => {
  const archTradeoffRoutine: CognitiveRoutine = {
    metadata: {
      id: "coglib:routine:arch-tradeoff-evaluation",
      name: "Architectural Tradeoff Evaluation",
      version: "1.0.0",
      category: "evaluation",
      description: "Evaluates architectural decision candidates across multiple quality attribute axes.",
    },
    inputs: [
      { name: "candidates", type: "array", required: true, description: "Architectural options" },
      { name: "criteria", type: "array", required: true, description: "Evaluation dimensions" },
    ],
    outputs: [
      { name: "selectedOption", type: "string", required: true, description: "Chosen option" },
      { name: "tradeoffs", type: "array", required: true, description: "Identified tradeoffs" },
    ],
    preconditions: [],
    postconditions: [],
    failureModes: [],
    provenanceRequirements: { requiresSourceAnchors: false, preserveLineage: true, trackTransformations: true, auditRequired: false },
    epistemicContract: { producesUncertainty: true, uncertaintyHandling: "bound", epistemicDelta: "Discloses latent architectural tradeoffs", preservesTensions: true },
    invariants: [],
    domainHooks: [],
    evaluationHooks: [],
    compatibility: { compatibleRoutines: [], incompatibleRoutines: [], compositionPatterns: ["pipeline"], requiredKernelVersion: ">=0.1.0" },
    execute: () => ({
      status: "success",
      output: { selectedOption: "opt-event-driven", tradeoffs: ["complexity vs latency"] },
      epistemicState: { confidence: 0.9, uncertaintyBounded: true, tensions: ["high complexity"], provenanceLineage: [] },
      provenance: { routineId: "coglib:routine:arch-tradeoff-evaluation", routineVersion: "1.0.0", lineage: [], timestamp: new Date().toISOString() },
    }),
  };

  const conceptEvolutionRoutine: CognitiveRoutine = {
    metadata: {
      id: "coglib:routine:concept-evolution",
      name: "Concept Evolution and Semantic Drift",
      version: "1.0.0",
      category: "evolution",
      description: "Tracks semantic mutation and lineage of concepts across transformation stages.",
    },
    inputs: [
      { name: "ancestorConcept", type: "object", required: true, description: "Original concept graph" },
      { name: "descendantConcept", type: "object", required: true, description: "Transformed concept graph" },
    ],
    outputs: [
      { name: "driftMagnitude", type: "number", required: true, description: "Semantic drift score" },
      { name: "mutatedAttributes", type: "array", required: true, description: "Attributes that evolved" },
    ],
    preconditions: [],
    postconditions: [],
    failureModes: [],
    provenanceRequirements: { requiresSourceAnchors: true, preserveLineage: true, trackTransformations: true, auditRequired: true },
    epistemicContract: { producesUncertainty: false, uncertaintyHandling: "preserve", epistemicDelta: "Maps lineage continuity", preservesTensions: false },
    invariants: [],
    domainHooks: [],
    evaluationHooks: [],
    compatibility: { compatibleRoutines: [], incompatibleRoutines: [], compositionPatterns: ["pipeline", "guarded_transition"], requiredKernelVersion: ">=0.1.0" },
    execute: () => ({
      status: "success",
      output: { driftMagnitude: 0.25, mutatedAttributes: ["scope"] },
      epistemicState: { confidence: 1.0, uncertaintyBounded: true, tensions: [], provenanceLineage: [] },
      provenance: { routineId: "coglib:routine:concept-evolution", routineVersion: "1.0.0", lineage: [], timestamp: new Date().toISOString() },
    }),
  };

  assert.equal(validateRoutineContract(archTradeoffRoutine).valid, true);
  assert.equal(validateRoutineContract(conceptEvolutionRoutine).valid, true);
});
